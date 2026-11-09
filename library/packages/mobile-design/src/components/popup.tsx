import { getScrollIndicatorProps, type ScrollIndicatorOptions } from '../scroll-indicators';
import { NativeModal as Modal } from '../native-modal';
import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
    BackHandler,
    Keyboard,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    useWindowDimensions,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { Portal, Surface, ThemeProvider, useLocale } from 'react-native-paper';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useOutsideInteraction } from '../outside-interaction';
import { useMobileTheme, type MobileDesignThemeOptions } from '../core';
import { ReduceMotionContext } from 'react-native-paper/lib/module/theme/accessibility/ReduceMotionContext';

export type PopupRect = { x: number; y: number; width: number; height: number };
export type PopupPlacement = 'overlap' | 'above' | 'below' | 'below-end' | 'below-center' | 'tooltip-below' | 'tooltip-above' | 'side';

/** Window coordinates: choose an available side before clamping, without covering a tooltip's anchor. */
export function popupPosition(
    anchor: PopupRect,
    content: { width: number; height: number },
    window: { width: number; height: number },
    placement: PopupPlacement,
    gap: number,
    inset: { top: number; bottom: number; left: number; right: number },
    rtl = false
) {
    const left = Math.min(inset.left + 8, Math.max(0, window.width - 1)),
        right = Math.max(left + 1, window.width - inset.right - 8);
    const top = Math.min(inset.top + 8, Math.max(0, window.height - 1)),
        bottom = Math.max(top + 1, window.height - inset.bottom - 8);
    const width = Math.min(content.width, Math.max(1, right - left));
    const below = Math.max(0, bottom - anchor.y - anchor.height - gap);
    const above = Math.max(0, anchor.y - gap - top);
    let y = anchor.y,
        height = Math.min(content.height, bottom - top);
    const startX = rtl ? anchor.x + anchor.width - width : anchor.x;
    const endX = rtl ? anchor.x : anchor.x + anchor.width - width;
    const fitsHorizontally = (candidate: number) => candidate >= left && candidate + width <= right;
    const alignToAnchor = (preferEnd = false) => {
        const preferred = preferEnd ? endX : startX;
        const alternate = preferEnd ? startX : endX;
        // Preserve a trigger edge before falling back to the window boundary.
        // A right-side trigger can fit an end-aligned menu without any clamp.
        return fitsHorizontally(preferred) ? preferred : fitsHorizontally(alternate) ? alternate : preferred;
    };
    let x = alignToAnchor();
    let originY = 0;
    if (placement === 'side') {
        const end = rtl ? anchor.x - gap - width : anchor.x + anchor.width + gap;
        const start = rtl ? anchor.x + anchor.width + gap : anchor.x - gap - width;
        if (end >= left && end + width <= right) x = end;
        else if (start >= left && start + width <= right) x = start;
        else {
            const useAbove = below < content.height && above > below;
            height = Math.min(content.height, bottom - top, Math.max(1, useAbove ? above : below));
            y = useAbove ? anchor.y - gap - height : anchor.y + anchor.height + gap;
            originY = useAbove ? height : 0;
        }
    } else if (placement !== 'overlap') {
        const preferAbove = placement === 'above' || placement === 'tooltip-above';
        const useAbove = preferAbove ? above >= content.height || above >= below : below < content.height && above > below;
        height = Math.min(content.height, bottom - top, Math.max(1, useAbove ? above : below));
        y = useAbove ? anchor.y - gap - height : anchor.y + anchor.height + gap;
        originY = useAbove ? height : 0;
        if (placement === 'above' || placement === 'below-center') x = anchor.x + (anchor.width - width) / 2;
        if (placement === 'below-end') x = alignToAnchor(true);
        if (placement === 'tooltip-below' || placement === 'tooltip-above') {
            const middle = anchor.x + anchor.width / 2;
            const preferred = rtl ? middle - width : middle;
            const alternate = rtl ? middle : middle - width;
            x = preferred >= left && preferred + width <= right ? preferred : alternate;
            x = Math.max(left, Math.min(right - width, Math.round(x / 8) * 8));
        }
    }
    x = Math.max(left, Math.min(right - width, x));
    y = Math.max(top, Math.min(bottom - height, y));
    return { x, y, width, height, originX: Math.max(0, Math.min(width, anchor.x + anchor.width / 2 - x)), originY };
}

export type AnchoredPopupProps = {
    /** Scrollbars are opt-in for this component only; both axes are hidden by default. */
    scrollIndicators?: ScrollIndicatorOptions;
    anchor: ReactNode | { x: number; y: number };
    visible: boolean;
    onDismiss: () => void;
    /** Runs once the outgoing presence finishes and the popup is removed. */
    onClosed?: () => void;
    onOpened?: () => void;
    /** Explicit keyboard/accessibility cancellation; ordinary outside dismissal remains separate. */
    onEscape?: () => void;
    children: ReactNode;
    placement?: PopupPlacement;
    gap?: number;
    anchorStyle?: StyleProp<ViewStyle>;
    width?: number;
    elevation?: 0 | 1 | 2 | 3 | 4 | 5;
    scrollable?: boolean;
    /** Reveal an existing choice once per opening, without taking over subsequent scrolling. */
    initialScrollTarget?: { y: number; height: number };
    dismissOnOutside?: boolean;
    modal?: boolean;
    /** Menus use a Portal; task dialogs own native windows. */
    presentation?: 'portal' | 'native-modal';
    accessibilityLabel?: string;
    testID?: string;
    contentStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ViewStyle>;
    theme?: MobileDesignThemeOptions['theme'];
    onOverflowChange?: (overflow: boolean) => void;
    onPositionChange?: (bounds: PopupRect) => void;
};

/** FastSpatial scale .8↔1 and FastEffects alpha, as Menu.kt/Tooltip.kt. */
export function AnchoredPopup({
    scrollIndicators,
    anchor,
    visible,
    onDismiss,
    onClosed,
    onOpened,
    onEscape,
    children,
    placement = 'below',
    gap = 0,
    anchorStyle,
    width = 280,
    elevation = 2,
    scrollable = true,
    initialScrollTarget,
    dismissOnOutside = true,
    modal = true,
    presentation = modal ? 'native-modal' : 'portal',
    accessibilityLabel,
    testID = 'mobile-popup',
    contentStyle,
    style,
    theme: override,
    onOverflowChange,
    onPositionChange,
}: AnchoredPopupProps) {
    const theme = useMobileTheme(override);
    const reduced = useContext(ReduceMotionContext) || theme.animation.scale === 0;
    const { direction } = useLocale();
    const screen = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const coordinate = anchor != null && typeof anchor === 'object' && 'x' in anchor && 'y' in anchor;
    const anchorRef = useRef<React.ComponentRef<typeof View>>(null);
    const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
    const scrolledOpening = useRef<number | undefined>(undefined);
    const popupRef = useRef<React.ComponentRef<typeof View>>(null);
    const [measured, setMeasured] = useState({ width: 0, height: 0 });
    const [keyboardTop, setKeyboardTop] = useState<number>();
    const [frameViewport, setFrameViewport] = useState<{ top: number; bottom: number }>();
    const visibility = useRef({ visible, version: 0 });
    if (visibility.current.visible !== visible) visibility.current = { visible, version: visibility.current.version + 1 };
    const openingVersion = visibility.current.version;
    const environment = JSON.stringify([
        screen.width,
        screen.height,
        insets.top,
        insets.bottom,
        insets.left,
        insets.right,
        keyboardTop,
        direction,
        coordinate ? (anchor as { x: number; y: number }).x : null,
        coordinate ? (anchor as { x: number; y: number }).y : null,
    ]);
    const measurementScope = useRef({ visibility: visibility.current.version, environment, version: 0 });
    if (measurementScope.current.visibility !== visibility.current.version || measurementScope.current.environment !== environment)
        measurementScope.current = { visibility: visibility.current.version, environment, version: measurementScope.current.version + 1 };
    const measurementVersion = measurementScope.current.version;
    const measureRevision = useRef(0);
    const [measuredAnchor, setMeasuredAnchor] = useState<{ bounds: PopupRect; version: number; opening: number } | null>(null);
    const bounds = measuredAnchor?.bounds ?? null;
    const reportedOverflow = useRef<boolean | undefined>(undefined);
    const [present, setPresent] = useState(visible);
    const revision = useRef(0),
        alive = useRef(true),
        current = useRef({ visible, onDismiss, onClosed, onOpened, onEscape });
    const openedVersion = useRef<number | undefined>(undefined);
    const opacity = useSharedValue(0),
        scale = useSharedValue(0.8);
    // Preserve an already visible menu while a keyboard/viewport reflow is
    // measured. A new opening must obtain its own anchor before becoming active.
    const ready = bounds != null && measured.height > 0 && (!visible || measuredAnchor?.opening === openingVersion);
    const readyRef = useRef(ready);
    readyRef.current = ready;
    useLayoutEffect(() => {
        current.current = { visible, onDismiss, onClosed, onOpened, onEscape };
    }, [visible, onDismiss, onClosed, onOpened, onEscape]);
    const measure = useCallback(() => {
        if (!alive.current || !visibility.current.visible) return;
        const token = ++measureRevision.current;
        const accept = (next: PopupRect) => {
            if (
                !alive.current ||
                !visibility.current.visible ||
                token !== measureRevision.current ||
                measurementScope.current.version !== measurementVersion
            )
                return;
            if (Platform.OS === 'web' && !coordinate) {
                const parent = (anchorRef.current as unknown as HTMLElement | null)?.closest<HTMLElement>(
                    '[data-mobile-design-popup="true"]'
                );
                if (parent) {
                    const frame = parent.getBoundingClientRect();
                    const x = Number(parent.dataset.mobileDesignPopupX),
                        y = Number(parent.dataset.mobileDesignPopupY);
                    const width = Number(parent.dataset.mobileDesignPopupWidth),
                        height = Number(parent.dataset.mobileDesignPopupHeight);
                    if ([x, y, width, height].every(Number.isFinite) && width > 0 && height > 0 && frame.width > 0 && frame.height > 0) {
                        // Nested popups anchor to the parent's final layout, not
                        // its temporary entrance scale. Portals do not inherit it.
                        next = {
                            x: x + ((next.x - frame.x) * width) / frame.width,
                            y: y + ((next.y - frame.y) * height) / frame.height,
                            width: (next.width * width) / frame.width,
                            height: (next.height * height) / frame.height,
                        };
                    }
                }
            }
            if (![next.x, next.y, next.width, next.height].every(Number.isFinite) || (!coordinate && (next.width <= 0 || next.height <= 0)))
                return;
            setMeasuredAnchor((previous) =>
                previous?.version === measurementVersion &&
                previous.bounds.x === next.x &&
                previous.bounds.y === next.y &&
                previous.bounds.width === next.width &&
                previous.bounds.height === next.height
                    ? previous
                    : { bounds: next, version: measurementVersion, opening: openingVersion }
            );
        };
        if (coordinate) {
            accept({ ...(anchor as { x: number; y: number }), width: 0, height: 0 });
            return;
        }
        try {
            anchorRef.current?.measureInWindow((x, y, width, height) => accept({ x, y, width, height }));
        } catch {
            // The opening deadline below removes a popup whose native anchor vanished.
        }
    }, [anchor, coordinate, measurementVersion, openingVersion]);
    const dismiss = useCallback(() => {
        if (alive.current && current.current.visible) current.current.onDismiss();
    }, []);
    const escape = useCallback(() => {
        if (alive.current && current.current.visible) (current.current.onEscape ?? current.current.onDismiss)();
    }, []);
    const finish = useCallback((token: number) => {
        if (alive.current && token === revision.current && !visibility.current.visible && !current.current.visible) {
            setPresent(false);
            setMeasuredAnchor(null);
            setMeasured({ width: 0, height: 0 });
            current.current.onClosed?.();
        }
    }, []);
    const opened = useCallback((token: number, version: number) => {
        if (
            alive.current &&
            token === revision.current &&
            current.current.visible &&
            visibility.current.visible &&
            version === visibility.current.version &&
            openedVersion.current !== version
        ) {
            openedVersion.current = version;
            current.current.onOpened?.();
        }
    }, []);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            revision.current++;
            measureRevision.current++;
            cancelAnimation(opacity);
            cancelAnimation(scale);
        };
    }, [opacity, scale]);
    useEffect(() => {
        if (!visible || ready) return;
        const version = measurementVersion;
        // This is measurement availability, not a motion duration. Never leave
        // an invisible modal backdrop over the app if a native callback is lost.
        const deadline = setTimeout(() => {
            if (alive.current && visibility.current.visible && !readyRef.current && measurementScope.current.version === version)
                current.current.onDismiss();
        }, 250);
        return () => clearTimeout(deadline);
    }, [measurementVersion, ready, visible]);
    useEffect(() => {
        if (!visible) return;
        if (Platform.OS === 'web') {
            // RN Web has no Keyboard.metrics. Keep anchored surfaces inside the
            // visible browser viewport, including a software keyboard resize.
            const viewport = globalThis.visualViewport;
            const frame = window.frameElement;
            const outerWindow = frame?.ownerDocument.defaultView;
            const updateFrameViewport = () => {
                if (!frame || !outerWindow) return;
                // An auto-height preview can be taller than the visible part of its host page.
                const origin = frame.getBoundingClientRect().top + frame.clientTop;
                const top = Math.max(0, -origin);
                const bottom = Math.min(window.innerHeight, outerWindow.innerHeight - origin);
                setFrameViewport((previous) => (previous?.top === top && previous.bottom === bottom ? previous : { top, bottom }));
            };
            const update = () => {
                setKeyboardTop(viewport ? viewport.offsetTop + viewport.height : undefined);
                updateFrameViewport();
                measure();
            };
            let scrollFrame: number | undefined;
            const reposition = (event: Event) => {
                const host = anchorRef.current as unknown as HTMLElement | null;
                if (!host || (event.target instanceof Element && !event.target.contains(host))) return;
                if (scrollFrame !== undefined) return;
                scrollFrame = requestAnimationFrame(() => {
                    scrollFrame = undefined;
                    measure();
                });
            };
            const repositionFrame = (event: Event) => {
                const target = event.target;
                if (!target || !('contains' in target) || (target as Node).contains(frame)) updateFrameViewport();
            };
            update();
            viewport?.addEventListener('resize', update);
            viewport?.addEventListener('scroll', update);
            if (presentation === 'portal' && !coordinate) window.addEventListener('scroll', reposition, { capture: true, passive: true });
            outerWindow?.addEventListener('scroll', repositionFrame, { capture: true, passive: true });
            outerWindow?.addEventListener('resize', updateFrameViewport);
            return () => {
                viewport?.removeEventListener('resize', update);
                viewport?.removeEventListener('scroll', update);
                window.removeEventListener('scroll', reposition, true);
                outerWindow?.removeEventListener('scroll', repositionFrame, true);
                outerWindow?.removeEventListener('resize', updateFrameViewport);
                if (scrollFrame !== undefined) cancelAnimationFrame(scrollFrame);
            };
        }
        const show = Keyboard.addListener('keyboardDidShow', (event) => setKeyboardTop(event.endCoordinates.screenY));
        const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardTop(undefined));
        const back = BackHandler.addEventListener('hardwareBackPress', () => {
            dismiss();
            return true;
        });
        setKeyboardTop(Keyboard.metrics()?.screenY);
        measure();
        return () => {
            show.remove();
            hide.remove();
            back.remove();
        };
    }, [coordinate, dismiss, measure, presentation, screen.width, screen.height, visible]);
    useLayoutEffect(() => {
        const token = ++revision.current;
        cancelAnimation(opacity);
        cancelAnimation(scale);
        if (visible && !present) {
            setPresent(true);
            return;
        }
        if (!present || (visible && !ready)) return;
        if (reduced) {
            opacity.set(visible ? 1 : 0);
            scale.set(visible ? 1 : 0.8);
            if (!visible) finish(token);
            else opened(token, openingVersion);
            return;
        }
        const spatial = theme.motion.spring.fast.spatial,
            effects = theme.motion.spring.fast.effects;
        scale.set(
            withSpring(visible ? 1 : 0.8, {
                stiffness: spatial.stiffness,
                damping: 2 * spatial.damping * Math.sqrt(spatial.stiffness),
                reduceMotion: ReduceMotion.Never,
            })
        );
        opacity.set(
            withSpring(
                visible ? 1 : 0,
                {
                    stiffness: effects.stiffness,
                    damping: 2 * effects.damping * Math.sqrt(effects.stiffness),
                    overshootClamping: true,
                    reduceMotion: ReduceMotion.Never,
                },
                (finished) => {
                    if (!finished) return;
                    if (visible) scheduleOnRN(opened, token, openingVersion);
                    else scheduleOnRN(finish, token);
                }
            )
        );
        return () => {
            revision.current++;
            cancelAnimation(opacity);
            cancelAnimation(scale);
        };
    }, [finish, opened, openingVersion, opacity, present, ready, reduced, scale, theme, visible]);
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: Math.max(0, Math.min(1, opacity.get())),
        transform: [{ scale: scale.get() }],
    }));
    const viewport = {
        width: screen.width,
        height: Math.max(1, Math.min(screen.height, keyboardTop ?? screen.height, frameViewport?.bottom ?? screen.height)),
    };
    const placementInsets = frameViewport ? { ...insets, top: Math.max(insets.top, frameViewport.top) } : insets;
    const availableHeight = Math.max(1, viewport.height - placementInsets.top - placementInsets.bottom - 16);
    const actualWidth = Math.min(width, Math.max(1, screen.width - insets.left - insets.right - 16));
    const position = popupPosition(
        bounds ?? { x: 0, y: 0, width: 0, height: 0 },
        { width: actualWidth, height: measured.height || 1 },
        viewport,
        placement,
        gap,
        placementInsets,
        direction === 'rtl'
    );
    const outsidePassThrough = visible && ready && dismissOnOutside && !modal;
    useOutsideInteraction(Platform.OS !== 'web' && outsidePassThrough, ({ x, y }) => {
        const contains = (rect: PopupRect) => x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
        if (bounds && !contains(bounds) && !contains(position)) dismiss();
    });
    useEffect(() => {
        if (Platform.OS !== 'web' || !outsidePassThrough) return;
        const outside = (event: PointerEvent) => {
            const target = event.target as Node | null;
            const host = popupRef.current as unknown as HTMLElement | null;
            if (target && !host?.contains(target) && !(anchorRef.current as unknown as HTMLElement | null)?.contains(target)) dismiss();
        };
        document.addEventListener('pointerdown', outside, true);
        return () => document.removeEventListener('pointerdown', outside, true);
    }, [dismiss, outsidePassThrough, testID]);
    useLayoutEffect(() => {
        if (!visible || !ready || !initialScrollTarget || scrolledOpening.current === openingVersion) return;
        scrolledOpening.current = openingVersion;
        scrollRef.current?.scrollTo({
            y: Math.max(0, initialScrollTarget.y - Math.max(0, position.height - initialScrollTarget.height) / 2),
            animated: false,
        });
    }, [visible, ready, initialScrollTarget, openingVersion, position.height]);
    const overflowing = ready && measured.height > position.height + 0.5;
    useLayoutEffect(() => {
        if (visible && ready) onPositionChange?.({ x: position.x, y: position.y, width: actualWidth, height: position.height });
    }, [visible, ready, position.x, position.y, position.height, actualWidth, onPositionChange]);
    useLayoutEffect(() => {
        if (visible && ready && reportedOverflow.current !== overflowing) {
            reportedOverflow.current = overflowing;
            onOverflowChange?.(overflowing);
        }
        if (!visible) reportedOverflow.current = undefined;
    }, [visible, ready, overflowing, onOverflowChange]);
    useEffect(() => {
        if (Platform.OS !== 'web' || !visible || !present || presentation !== 'portal') return;
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !event.isComposing && event.keyCode !== 229) {
                event.preventDefault();
                event.stopPropagation();
                escape();
            }
        };
        document.addEventListener('keydown', handleEscape, !modal);
        return () => document.removeEventListener('keydown', handleEscape, !modal);
    }, [escape, modal, present, presentation, visible]);
    const anchorView = coordinate ? null : (
        <View
            ref={anchorRef}
            collapsable={false}
            onLayout={() => {
                if (visible) measure();
            }}
            style={[{ alignSelf: 'flex-start' }, anchorStyle]}
        >
            {anchor as ReactNode}
        </View>
    );
    const layer = (
        <ThemeProvider theme={theme}>
            <ReduceMotionContext.Provider value={reduced}>
                {dismissOnOutside && modal ? (
                    <Pressable
                        accessible={false}
                        focusable={false}
                        tabIndex={-1}
                        onPress={dismiss}
                        style={StyleSheet.absoluteFill}
                        testID={`${testID}-outside`}
                    />
                ) : null}
                <Animated.View
                    ref={popupRef}
                    pointerEvents={visible && ready ? 'auto' : 'none'}
                    accessibilityViewIsModal={modal}
                    accessibilityElementsHidden={!visible || !ready}
                    importantForAccessibility={visible && ready ? 'auto' : 'no-hide-descendants'}
                    {...(Platform.OS === 'web'
                        ? {
                              'aria-hidden': !visible || !ready,
                              inert: !visible || !ready,
                              dataSet: {
                                  mobileDesignPopup: 'true',
                                  mobileDesignPopupX: String(position.x),
                                  mobileDesignPopupY: String(position.y),
                                  mobileDesignPopupWidth: String(actualWidth),
                                  mobileDesignPopupHeight: String(position.height),
                              },
                          }
                        : {})}
                    accessibilityLabel={accessibilityLabel}
                    onAccessibilityEscape={escape}
                    style={[
                        {
                            position: 'absolute',
                            left: position.x,
                            top: position.y,
                            width: actualWidth,
                            maxHeight: availableHeight,
                            transformOrigin: [position.originX, position.originY, 0],
                        },
                        style,
                        animatedStyle,
                        !ready && { opacity: 0 },
                    ]}
                    testID={testID}
                >
                    <Surface
                        elevation={elevation}
                        style={[{ backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 16, overflow: 'hidden' }, contentStyle]}
                    >
                        {scrollable ? (
                            <ScrollView
                                ref={scrollRef}
                                keyboardShouldPersistTaps="handled"
                                {...getScrollIndicatorProps(scrollIndicators)}
                                persistentScrollbar={scrollIndicators?.vertical === true && overflowing}
                                style={ready ? { maxHeight: position.height } : { maxHeight: availableHeight }}
                            >
                                <View
                                    onLayout={(event) => {
                                        const next = event.nativeEvent.layout;
                                        if (!alive.current || !Number.isFinite(next.width) || !Number.isFinite(next.height)) return;
                                        setMeasured((previous) =>
                                            previous.height === next.height && previous.width === next.width
                                                ? previous
                                                : { width: next.width, height: next.height }
                                        );
                                    }}
                                >
                                    {children}
                                </View>
                            </ScrollView>
                        ) : (
                            <View
                                onLayout={(event) => {
                                    const next = event.nativeEvent.layout;
                                    if (!alive.current || !Number.isFinite(next.width) || !Number.isFinite(next.height)) return;
                                    setMeasured((previous) =>
                                        previous.height === next.height && previous.width === next.width
                                            ? previous
                                            : { width: next.width, height: next.height }
                                    );
                                }}
                            >
                                {children}
                            </View>
                        )}
                    </Surface>
                </Animated.View>
            </ReduceMotionContext.Provider>
        </ThemeProvider>
    );
    return (
        <>
            {anchorView}
            {present ? (
                presentation === 'native-modal' ? (
                    <Modal
                        transparent
                        visible
                        animationType="none"
                        statusBarTranslucent
                        navigationBarTranslucent
                        onShow={measure}
                        onRequestClose={escape}
                    >
                        {layer}
                    </Modal>
                ) : (
                    <Portal>
                        {Platform.OS === 'web' ? (
                            // measureInWindow returns viewport coordinates. Paper's
                            // host can sit at the top of a scrolling document.
                            <View
                                pointerEvents="box-none"
                                style={[StyleSheet.absoluteFill, { position: 'fixed' as ViewStyle['position'] }]}
                            >
                                {layer}
                            </View>
                        ) : (
                            layer
                        )}
                    </Portal>
                )
            ) : null}
        </>
    );
}
