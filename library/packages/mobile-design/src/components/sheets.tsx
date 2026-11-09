import { NativeModal as Modal } from '../native-modal';
import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ComponentProps,
    type PropsWithChildren,
    type ReactNode,
} from 'react';
import {
    BackHandler,
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions,
    type StyleProp,
    type ViewProps,
    type ViewStyle,
    type ViewInstance,
} from 'react-native';
import { Surface, Text, useLocale, useTheme, type Theme } from 'react-native-paper';
import { IconButton } from './icon-button';
import GorhomBottomSheet, {
    BottomSheetScrollView as GorhomScrollView,
    BottomSheetFlatList as GorhomFlatList,
    BottomSheetSectionList as GorhomSectionList,
    BottomSheetBackdrop,
    BottomSheetView,
    type BottomSheetBackdropProps,
    type BottomSheetBackgroundProps,
    type BottomSheetProps as GorhomProps,
} from '@gorhom/bottom-sheet';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    cancelAnimation,
    Easing,
    ReduceMotion,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
const SheetContentHeight = createContext<((height: number) => void) | null>(null);

type SheetHandleState = {
    open: boolean;
    modal: boolean;
    draggable: boolean;
    dismissible: boolean;
    label: string;
    height: string;
    multiple: boolean;
    onPress: () => void;
    onAdjust: NonNullable<ViewProps['onAccessibilityAction']>;
    onEscape: () => void;
    testID: string;
};
const SheetHandleContext = createContext<SheetHandleState | null>(null);

/** Keep the native handle mounted while its current height and label change. */
function SheetHandle() {
    const state = useContext(SheetHandleContext)!;
    const theme = useTheme<Theme>();
    const ref = useRef<ViewInstance>(null);
    const [focused, setFocused] = useState(false);
    useEffect(() => {
        if (Platform.OS !== 'web' || !state.open || !state.modal || !state.draggable) return;
        const frame = requestAnimationFrame(() => (ref.current as unknown as HTMLElement | null)?.focus({ preventScroll: true }));
        return () => cancelAnimationFrame(frame);
    }, [state.open, state.modal, state.draggable]);
    return (
        <Pressable
            ref={ref}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${state.label}, altura${Platform.OS === 'web' ? `: ${state.height}` : ''}`}
            accessibilityHint={
                state.dismissible
                    ? 'Toca para cambiar a la siguiente altura; en la última altura cierra la hoja'
                    : 'Toca para cambiar a la siguiente altura'
            }
            accessibilityState={{ disabled: !state.draggable }}
            disabled={!state.draggable}
            accessibilityValue={{ text: state.height }}
            accessibilityActions={
                state.draggable && state.multiple
                    ? [
                          { name: 'increment', label: 'Expandir' },
                          { name: 'decrement', label: 'Contraer' },
                      ]
                    : []
            }
            onPress={state.onPress}
            onAccessibilityAction={state.onAdjust}
            onAccessibilityEscape={state.onEscape}
            onFocus={(event) =>
                setFocused(Platform.OS === 'web' && (event.currentTarget as unknown as HTMLElement).matches(':focus-visible'))
            }
            onBlur={() => setFocused(false)}
            onPressIn={(event) => {
                if (!(event.nativeEvent as { key?: string }).key) setFocused(false);
            }}
            style={{
                height: 48,
                paddingVertical: 22,
                alignItems: 'center',
                ...(Platform.OS === 'web' ? { outlineStyle: 'solid', outlineWidth: 0 } : {}),
            }}
            testID={state.testID}
        >
            {focused && state.draggable ? (
                <View
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        top: 8,
                        width: 48,
                        height: 32,
                        borderRadius: 12,
                        borderWidth: 3,
                        borderColor: theme.colors.secondary,
                    }}
                    testID={`${state.testID}-focus`}
                />
            ) : null}
            <View
                accessible={false}
                pointerEvents="none"
                style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: theme.colors.onSurfaceVariant }}
            />
        </Pressable>
    );
}

/** Internal presence controller. An interrupted exit cannot unmount a reopened overlay. */
export function useOverlayPresence(
    open: boolean,
    duration: number,
    motion: 'timing' | 'search' | 'drawer' = 'timing',
    onClosed?: () => void,
    options?: { ready?: boolean; easing?: readonly [number, number, number, number]; overshootClamping?: boolean }
) {
    const theme = useTheme<Theme>();
    const [present, setPresent] = useState(open);
    const progress = useSharedValue(0);
    const revision = useRef(0);
    const alive = useRef(true);
    const latest = useRef({ open, onClosed });
    const ready = options?.ready ?? true;
    const overshootClamping = options?.overshootClamping ?? true;
    const curve = options?.easing;
    const [curveX1, curveY1, curveX2, curveY2] = curve ?? [open ? 0.05 : 0.3, open ? 0.7 : 0, open ? 0.1 : 0.8, open ? 1 : 0.15];
    useLayoutEffect(() => {
        latest.current = { open, onClosed };
    }, [open, onClosed]);
    const finish = useCallback((token: number) => {
        if (alive.current && token === revision.current && !latest.current.open) {
            setPresent(false);
            latest.current.onClosed?.();
        }
    }, []);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            revision.current += 1;
            cancelAnimation(progress);
        };
    }, [progress]);
    useLayoutEffect(() => {
        const token = ++revision.current;
        if (open && !present) {
            setPresent(true);
            return;
        }
        if (!present) return;
        // A shared-container destination must be laid out before its first frame.
        // Closing still completes normally if it was dismissed before measurement.
        if (open && !ready) {
            cancelAnimation(progress);
            return;
        }
        const complete = (finished?: boolean) => {
            'worklet';
            if (finished && !open) scheduleOnRN(finish, token);
        };
        if (duration === 0 || motion === 'timing')
            progress.set(
                withTiming(
                    open ? 1 : 0,
                    {
                        duration,
                        reduceMotion: ReduceMotion.Never,
                        easing: Easing.bezier(curveX1, curveY1, curveX2, curveY2),
                    },
                    complete
                )
            );
        else {
            const spring =
                motion === 'search'
                    ? theme.motion.spring[open ? 'slow' : 'default'].spatial
                    : open
                      ? theme.motion.spring.default.spatial
                      : theme.motion.spring.fast.effects;
            progress.set(
                withSpring(
                    open ? 1 : 0,
                    {
                        stiffness: spring.stiffness,
                        damping: 2 * spring.damping * Math.sqrt(spring.stiffness),
                        mass: 1,
                        overshootClamping,
                        reduceMotion: ReduceMotion.Never,
                    },
                    complete
                )
            );
        }
    }, [curveX1, curveX2, curveY1, curveY2, duration, finish, motion, open, overshootClamping, present, progress, ready, theme]);
    return { present, progress };
}

type SheetCommon = PropsWithChildren<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    variant?: 'standard' | 'modal';
    dismissible?: boolean;
    accessibilityLabel?: string;
    testID?: string;
    style?: StyleProp<ViewStyle>;
}>;

export type BottomSheetProps = SheetCommon & {
    /** Ascending dp heights or percentages. Omit for content sizing with an initial half-height detent for long modal content. */
    snapPoints?: (number | string)[];
    /** Controlled expanded/partial position; -1 is represented by open=false. */
    index?: number;
    onIndexChange?: (index: number) => void;
    onClosed?: () => void;
    draggable?: boolean;
    /** Allows content to drag the sheet; the handle remains controlled by draggable. */
    contentPanning?: boolean;
    showDragHandle?: boolean;
    maxWidth?: number;
    /** Square top edge for a minimized standard sheet, such as a compact player. */
    minimized?: boolean;
    /** Top clearance in dp. Omit for MD3's 72dp/56dp margin; use the safe top inset for a full-height sheet. */
    topInset?: number;
    /** Scrollable children should use the exported Gorhom scrollables, without an outer view. */
    scrollable?: boolean;
    keyboardBehavior?: GorhomProps['keyboardBehavior'];
    /** Decorative content clipped behind the handle and scrolling sheet content. */
    backgroundContent?: ReactNode | ((props: BottomSheetBackgroundProps & { containerHeight: number }) => ReactNode);
};

/** MD3 standard/modal sheet. Requires GestureHandlerRootView in the app for the standard form. */
export function BottomSheet({
    open,
    onOpenChange,
    variant = 'modal',
    dismissible = true,
    children,
    snapPoints,
    index = 0,
    onIndexChange,
    onClosed,
    draggable = true,
    contentPanning = true,
    showDragHandle = true,
    maxWidth = 640,
    minimized = false,
    topInset,
    scrollable = false,
    keyboardBehavior = 'interactive',
    backgroundContent,
    accessibilityLabel = 'Hoja inferior',
    style,
    testID = 'mobile-bottom-sheet',
}: BottomSheetProps) {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const reduced = theme.animation.scale === 0;
    const corner = variant === 'standard' && minimized ? 0 : 28;
    const [present, setPresent] = useState(open);
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const automaticModal = variant === 'modal' && !snapPoints;
    const availableHeight = containerHeight || window.height;
    const topMargin = Math.min(
        Math.max(0, availableHeight - 1),
        Math.max(0, topInset ?? Math.max(insets.top, (containerWidth || window.width) > 640 ? 56 : 72))
    );
    const longContent = contentHeight === 0 || contentHeight + (showDragHandle ? 48 : 0) > availableHeight / 2 + 1;
    // Gorhom inserts the measured content detent into this list. Short content
    // wraps naturally; long content opens at 50% and can expand to its full height.
    const effectiveSnapPoints = useMemo(
        () => (automaticModal && longContent ? ['50%'] : snapPoints),
        [automaticModal, longContent, snapPoints]
    );
    const maximumIndex = Math.max(0, (snapPoints?.length ?? (automaticModal && longContent ? 2 : 1)) - 1);
    const boundedIndex = Math.max(0, Math.min(index, maximumIndex));
    const [announcedIndex, setAnnouncedIndex] = useState(boundedIndex);
    const currentIndex = useRef(boundedIndex);
    const handleSettings = useRef({ draggable, dismissible, maximumIndex, automaticModal });
    useLayoutEffect(() => {
        currentIndex.current = boundedIndex;
        setAnnouncedIndex(boundedIndex);
    }, [boundedIndex]);
    useLayoutEffect(() => {
        handleSettings.current = { draggable, dismissible, maximumIndex, automaticModal };
    }, [draggable, dismissible, maximumIndex, automaticModal]);
    const latestPresent = useRef(present);
    useLayoutEffect(() => {
        latestPresent.current = present;
    }, [present]);
    const sheet = useRef<GorhomBottomSheet>(null);
    const latestOpen = useRef(open);
    const alive = useRef(true);
    const callback = useRef({ onOpenChange, onClosed, onIndexChange });
    useLayoutEffect(() => {
        latestOpen.current = open;
        callback.current = { onOpenChange, onClosed, onIndexChange };
    }, [open, onOpenChange, onClosed, onIndexChange]);
    // BottomSheet.kt uses DefaultSpatial for show/snap and FastEffects for hide.
    const spring = theme.motion.spring[open ? 'default' : 'fast'][open ? 'spatial' : 'effects'];
    const configs = reduced
        ? { duration: 0, reduceMotion: ReduceMotion.Never }
        : {
              stiffness: spring.stiffness,
              damping: 2 * spring.damping * Math.sqrt(spring.stiffness),
              mass: 1,
              overshootClamping: true,
              reduceMotion: ReduceMotion.Never,
          };
    const request = useMemo(() => ({}), [open, index]);
    const latestRequest = useRef(request);
    const closedRequest = useRef<object | null>(null);
    const destination = useRef({ index: boundedIndex, configs });
    useLayoutEffect(() => {
        latestRequest.current = request;
        destination.current = { index: boundedIndex, configs };
    }, [request, boundedIndex, reduced, theme]);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    const close = useCallback(() => {
        if (alive.current && handleSettings.current.dismissible && latestOpen.current) {
            Keyboard.dismiss();
            callback.current.onOpenChange(false);
        }
    }, []);
    useEffect(() => {
        if (open && !present) {
            setContentHeight(0);
            setPresent(true);
        }
    }, [open, present]);
    useEffect(() => {
        if (!open) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            close();
            return true;
        });
        return () => subscription.remove();
    }, [close, open, variant]);
    const backdrop = useCallback(
        (props: BottomSheetBackdropProps) =>
            variant === 'modal' ? (
                <GestureDetector
                    gesture={Gesture.Tap().onEnd((_event, success) => {
                        if (success) scheduleOnRN(close);
                    })}
                >
                    <BottomSheetBackdrop
                        {...props}
                        accessible={false}
                        accessibilityRole={null}
                        accessibilityLabel={null}
                        accessibilityHint={null}
                        opacity={0.32}
                        appearsOnIndex={0}
                        disappearsOnIndex={-1}
                        pressBehavior="none"
                        style={[props.style, { backgroundColor: theme.colors.scrim }]}
                    />
                </GestureDetector>
            ) : null,
        [close, theme.colors.scrim, variant]
    );
    // Gorhom's default background is another adjustable accessibility element;
    // it is decorative and must not compete with the handle or content controls.
    const background = useCallback(
        (props: BottomSheetBackgroundProps) =>
            backgroundContent ? (
                // Paper Surface has two layers on iOS. A decorative absolute-fill
                // child cannot size its inner layer, so use one clipped background.
                <View
                    pointerEvents="none"
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={[props.style, { overflow: 'hidden' }]}
                >
                    {typeof backgroundContent === 'function'
                        ? backgroundContent({ ...props, containerHeight: Math.max(0, containerHeight - topMargin) })
                        : backgroundContent}
                </View>
            ) : (
                <Surface
                    mode="elevated"
                    elevation={1}
                    pointerEvents="none"
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={props.style}
                    children={null}
                />
            ),
        [backgroundContent, containerHeight, topMargin]
    );
    const adjustHandle = useCallback<NonNullable<ViewProps['onAccessibilityAction']>>((event) => {
        if (!alive.current || !latestOpen.current || !handleSettings.current.draggable) return;
        const action = event.nativeEvent.actionName;
        if (action !== 'increment' && action !== 'decrement') return;
        const next = Math.max(0, Math.min(handleSettings.current.maximumIndex, currentIndex.current + (action === 'increment' ? 1 : -1)));
        if (next === currentIndex.current) return;
        currentIndex.current = next;
        setAnnouncedIndex(next);
        if (handleSettings.current.automaticModal) {
            if (next > 0) sheet.current?.expand(destination.current.configs);
            else sheet.current?.collapse(destination.current.configs);
        } else sheet.current?.snapToIndex(next, destination.current.configs);
    }, []);
    const announcedHeight =
        automaticModal && longContent ? (announcedIndex === 0 ? '50%' : undefined) : snapPoints?.[Math.min(announcedIndex, maximumIndex)];
    const heightDescription =
        typeof announcedHeight === 'string'
            ? announcedHeight.replace('%', ' %')
            : typeof announcedHeight === 'number'
              ? `${announcedHeight} dp`
              : 'Altura del contenido';
    const cycleHandle = useCallback(() => {
        if (!alive.current || !latestOpen.current || !handleSettings.current.draggable) return;
        if (currentIndex.current === handleSettings.current.maximumIndex && handleSettings.current.dismissible) {
            close();
            return;
        }
        const next = currentIndex.current >= handleSettings.current.maximumIndex ? 0 : currentIndex.current + 1;
        currentIndex.current = next;
        setAnnouncedIndex(next);
        if (handleSettings.current.automaticModal) {
            if (next > 0) sheet.current?.expand(destination.current.configs);
            else sheet.current?.collapse(destination.current.configs);
        } else sheet.current?.snapToIndex(next, destination.current.configs);
    }, [close]);
    const closed = useCallback(() => {
        if (!alive.current || !latestPresent.current) return;
        const currentRequest = latestRequest.current;
        if (latestOpen.current) {
            // forceClose blocks intervening snap requests until its native end.
            // Restore the current target after it ends, including a rapid reopen.
            sheet.current?.snapToIndex(destination.current.index, destination.current.configs);
            return;
        }
        // Gorhom captures onClose when its native animation starts. Reflecting
        // onAnimate's dismissal changes request before that legitimate exit ends.
        if (closedRequest.current === currentRequest) return;
        closedRequest.current = currentRequest;
        latestPresent.current = false;
        setPresent(false);
        callback.current.onClosed?.();
    }, []);
    useEffect(() => {
        if (open || !present) return;
        Keyboard.dismiss();
        if (containerWidth === 0) {
            closed();
            return;
        }
        // Updating index to -1 goes through snapToIndex in Gorhom5, whereas
        // forceClose explicitly targets the closed detent and interrupts a snap.
        sheet.current?.forceClose(configs);
        // No onClose is emitted if native is already closed. Bound the native
        // modal lifetime to a conservative spring-settling bound. Native onClose
        // normally releases it first; a missing callback cannot trap the scrim.
        const token = request;
        const deadline = setTimeout(
            () => {
                if (alive.current && !latestOpen.current && latestRequest.current === token) closed();
            },
            reduced ? 0 : 1200
        );
        return () => clearTimeout(deadline);
    }, [closed, containerWidth, open, present, reduced, request, theme]);
    if (!present) return null;
    const content = (
        <View
            {...(Platform.OS === 'web' ? { 'aria-hidden': !open, inert: !open } : {})}
            pointerEvents={open ? 'box-none' : 'none'}
            accessibilityElementsHidden={!open}
            importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
            onLayout={(event) => {
                setContainerWidth(event.nativeEvent.layout.width);
                setContainerHeight(event.nativeEvent.layout.height);
            }}
            style={[StyleSheet.absoluteFill, style]}
            testID={testID}
        >
            {containerWidth > 0 ? (
                <SheetHandleContext.Provider
                    value={{
                        open,
                        modal: variant === 'modal',
                        draggable,
                        dismissible,
                        label: accessibilityLabel,
                        height: heightDescription,
                        multiple: maximumIndex > 0,
                        onPress: cycleHandle,
                        onAdjust: adjustHandle,
                        onEscape: close,
                        testID: `${testID}-handle`,
                    }}
                >
                    <GorhomBottomSheet
                        ref={sheet}
                        index={open ? boundedIndex : -1}
                        animateOnMount
                        containerStyle={{
                            marginHorizontal: Math.max(containerWidth > 640 ? 56 : 0, (containerWidth - Math.min(640, maxWidth)) / 2),
                            // This viewport clips the sheet; it must not scroll when Tab moves focus.
                            ...(Platform.OS === 'web' ? ({ overflowX: 'clip', overflowY: 'clip' } as ViewStyle) : {}),
                        }}
                        snapPoints={effectiveSnapPoints}
                        enableDynamicSizing={!snapPoints}
                        maxDynamicContentSize={Math.max(1, availableHeight - topMargin)}
                        topInset={topMargin}
                        bottomInset={0}
                        enablePanDownToClose={dismissible && draggable}
                        enableHandlePanningGesture={draggable}
                        enableContentPanningGesture={draggable && contentPanning}
                        overrideReduceMotion={reduced ? ReduceMotion.Always : ReduceMotion.Never}
                        animationConfigs={configs}
                        keyboardBehavior={keyboardBehavior}
                        keyboardBlurBehavior="restore"
                        android_keyboardInputMode="adjustResize"
                        backdropComponent={variant === 'modal' ? backdrop : undefined}
                        backgroundComponent={background}
                        backgroundStyle={{
                            backgroundColor: theme.colors.surfaceContainerLow,
                            borderTopLeftRadius: corner,
                            borderTopRightRadius: corner,
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                        }}
                        handleComponent={showDragHandle ? SheetHandle : null}
                        accessible={false}
                        accessibilityRole={null}
                        accessibilityLabel={null}
                        onAnimate={(_from, to) => {
                            if (alive.current && latestRequest.current === request && latestOpen.current && to === -1) close();
                        }}
                        onChange={(next) => {
                            if (alive.current && latestOpen.current && latestRequest.current === request && next >= 0) {
                                currentIndex.current = next;
                                setAnnouncedIndex(next);
                                callback.current.onIndexChange?.(next);
                            }
                        }}
                        onClose={closed}
                    >
                        <SheetContentHeight.Provider value={setContentHeight}>
                            {scrollable ? (
                                children
                            ) : (
                                <BottomSheetView
                                    accessible={false}
                                    onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}
                                    style={{ paddingBottom: insets.bottom }}
                                >
                                    {children}
                                </BottomSheetView>
                            )}
                        </SheetContentHeight.Provider>
                    </GorhomBottomSheet>
                </SheetHandleContext.Provider>
            ) : null}
        </View>
    );
    return variant === 'modal' ? (
        <Modal
            accessibilityLabel={accessibilityLabel}
            animationType="none"
            transparent
            visible
            onRequestClose={close}
            statusBarTranslucent
            navigationBarTranslucent
        >
            {content}
        </Modal>
    ) : (
        content
    );
}

export type SideSheetProps = SheetCommon & {
    onClosed?: () => void;
    edge?: 'start' | 'end';
    width?: number;
    title?: string;
    header?: ReactNode;
    footer?: ReactNode;
    draggable?: boolean;
    showCloseButton?: boolean;
    motion?: 'sheet' | 'drawer';
    detached?: boolean;
    showDivider?: boolean;
    onBackPress?: () => void;
    elevation?: 0 | 1 | 2 | 3;
};

/** Supplementary content; standard participates in the parent's row, modal overlays it. */
export function SideSheet({
    open,
    onOpenChange,
    onClosed,
    variant = 'modal',
    edge = 'end',
    width = 360,
    dismissible = true,
    draggable = true,
    showCloseButton = true,
    motion = 'sheet',
    detached = false,
    showDivider = false,
    onBackPress,
    elevation,
    title,
    header,
    footer,
    children,
    accessibilityLabel,
    testID = 'mobile-side-sheet',
    style,
}: SideSheetProps) {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const rtl = useLocale().direction === 'rtl';
    const reduced = theme.animation.scale === 0;
    const duration = reduced ? 0 : theme.motion.duration.medium4 * theme.animation.scale;
    const { present, progress } = useOverlayPresence(open, duration, motion === 'drawer' ? 'drawer' : 'timing', onClosed);
    const label = accessibilityLabel ?? title ?? 'Hoja lateral';
    const heading = useRef<ViewInstance>(null);
    useEffect(() => {
        if (Platform.OS !== 'web' || !open || !present || variant !== 'modal' || header || !title || motion === 'drawer') return;
        const frame = requestAnimationFrame(() => (heading.current as unknown as HTMLElement | null)?.focus({ preventScroll: true }));
        return () => cancelAnimationFrame(frame);
    }, [open, present, variant, header, title, motion]);
    const previousFocus = useRef<HTMLElement | null>(null);
    const wasPresent = useRef(present);
    useLayoutEffect(() => {
        if (Platform.OS === 'web' && open)
            previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }, [open]);
    useEffect(() => {
        if (Platform.OS === 'web' && wasPresent.current && !present && document.activeElement === document.body)
            previousFocus.current?.isConnected && previousFocus.current.focus({ preventScroll: true });
        wasPresent.current = present;
    }, [present]);
    const panelWidth = Math.max(1, Math.min(400, width, window.width - (variant === 'modal' ? 56 : detached ? 32 : 0)));
    const right = (edge === 'end') !== rtl;
    const sign = right ? 1 : -1;
    const sequence = useRef(0);
    const version = useMemo(
        () => ++sequence.current,
        [open, draggable, dismissible, right, panelWidth, detached, variant, motion, reduced]
    );
    const gestureVersion = useSharedValue(version);
    const startProgress = useSharedValue(1);
    const openUI = useSharedValue(open);
    const alive = useRef(true);
    const latest = useRef({ open, onOpenChange, dismissible, version });
    useLayoutEffect(() => {
        latest.current = { open, onOpenChange, dismissible, version };
        openUI.set(open);
        gestureVersion.set(version);
    }, [open, onOpenChange, dismissible, version, openUI, gestureVersion]);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    const dismiss = useCallback(() => {
        if (alive.current && latest.current.open && latest.current.dismissible) {
            Keyboard.dismiss();
            latest.current.onOpenChange(false);
        }
    }, []);
    const dismissGesture = useCallback(
        (expected: number) => {
            if (latest.current.version === expected) dismiss();
        },
        [dismiss]
    );
    const recoverGesture = useCallback(
        (expected: number) => {
            // Finalization can arrive after a controlled close. It must not cancel
            // the outgoing presence animation and strand its native modal/scrim.
            if (alive.current && latest.current.open && latest.current.version === expected)
                progress.set(withTiming(1, { duration, reduceMotion: ReduceMotion.Never, easing: Easing.bezier(0.05, 0.7, 0.1, 1) }));
        },
        [duration, progress]
    );
    useEffect(() => {
        if (!open) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            dismiss();
            return true;
        });
        return () => subscription.remove();
    }, [dismiss, open, variant]);
    const pan = Gesture.Pan()
        .enabled(draggable && dismissible && open)
        .activeOffsetX([-12, 12])
        .failOffsetY([-16, 16])
        .onStart(() => {
            if (!openUI.get() || gestureVersion.get() !== version) return;
            cancelAnimation(progress);
            startProgress.set(progress.get());
        })
        .onUpdate((event) => {
            if (openUI.get() && gestureVersion.get() === version)
                progress.set(Math.max(0, Math.min(1, startProgress.get() - (event.translationX * sign) / panelWidth)));
        })
        .onEnd((event) => {
            if (!openUI.get() || gestureVersion.get() !== version) return;
            if (progress.get() < 0.5 || event.velocityX * sign > (motion === 'drawer' ? 400 : 500)) {
                scheduleOnRN(dismissGesture, version);
            } else
                progress.set(
                    reduced
                        ? 1
                        : withSpring(1, {
                              stiffness: theme.motion.spring.default.spatial.stiffness,
                              damping:
                                  2 *
                                  Math.sqrt(theme.motion.spring.default.spatial.stiffness) *
                                  theme.motion.spring.default.spatial.damping,
                              velocity: (-event.velocityX * sign) / panelWidth,
                              overshootClamping: true,
                              reduceMotion: ReduceMotion.Never,
                          })
                );
        })
        .onFinalize((_event, success) => {
            if (!success) scheduleOnRN(recoverGesture, version);
        });
    const panelStyle = useAnimatedStyle(() =>
        variant === 'standard'
            ? { width: panelWidth * progress.get(), ...(detached ? { marginHorizontal: 16 * progress.get() } : {}) }
            : { transform: [{ translateX: sign * (panelWidth + (detached ? 16 : 0)) * (1 - progress.get()) }] }
    );
    const innerStyle = useAnimatedStyle(() =>
        variant === 'standard' && !right ? { transform: [{ translateX: -panelWidth * (1 - progress.get()) }] } : {}
    );
    const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.get() * 0.32 }));
    if (!present) return null;
    const panel = (
        <GestureDetector gesture={pan}>
            <Animated.View
                pointerEvents={open ? 'auto' : 'none'}
                accessibilityElementsHidden={!open}
                importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
                accessibilityViewIsModal={variant === 'modal'}
                {...(Platform.OS === 'web'
                    ? {
                          role: variant === 'standard' ? ('dialog' as const) : undefined,
                          'aria-modal': variant === 'standard' ? false : undefined,
                          'aria-hidden': !open,
                          inert: !open,
                      }
                    : {})}
                onAccessibilityEscape={dismiss}
                accessibilityLabel={variant === 'standard' ? label : undefined}
                style={[
                    {
                        width: panelWidth,
                        alignSelf: 'stretch',
                        ...(variant === 'modal'
                            ? {
                                  position: 'absolute',
                                  top: detached ? 16 : 0,
                                  bottom: detached ? 16 : 0,
                                  [right ? 'right' : 'left']: detached ? 16 : 0,
                              }
                            : { overflow: 'hidden', ...(detached ? { marginVertical: 16 } : {}) }),
                    },
                    panelStyle,
                ]}
                testID={testID}
            >
                <Animated.View style={[{ width: panelWidth, flex: 1 }, innerStyle]}>
                    <Surface
                        mode={variant === 'modal' ? 'elevated' : 'flat'}
                        elevation={elevation ?? (variant === 'modal' ? 1 : 0)}
                        style={[
                            {
                                flex: 1,
                                backgroundColor: variant === 'modal' ? theme.colors.surfaceContainerLow : theme.colors.surface,
                                paddingTop: variant === 'standard' ? 0 : detached ? Math.max(0, insets.top - 16) : insets.top,
                                paddingBottom: variant === 'standard' ? 0 : detached ? Math.max(0, insets.bottom - 16) : insets.bottom,
                                paddingLeft: variant === 'modal' && !right ? Math.max(0, insets.left - (detached ? 16 : 0)) : 0,
                                paddingRight: variant === 'modal' && right ? Math.max(0, insets.right - (detached ? 16 : 0)) : 0,
                                overflow: 'hidden',
                                ...(showDivider && variant === 'standard'
                                    ? { [right ? 'borderLeftWidth' : 'borderRightWidth']: 1, borderColor: theme.colors.outlineVariant }
                                    : {}),
                                ...(variant === 'modal' || detached
                                    ? {
                                          borderTopLeftRadius: right || detached ? 16 : 0,
                                          borderBottomLeftRadius: right || detached ? 16 : 0,
                                          borderTopRightRadius: !right || detached ? 16 : 0,
                                          borderBottomRightRadius: !right || detached ? 16 : 0,
                                      }
                                    : {}),
                            },
                            style,
                        ]}
                    >
                        {header ??
                            (title || showCloseButton || onBackPress ? (
                                <View
                                    style={{
                                        // Align the 24dp glyphs, rather than adding padding to their 48dp targets.
                                        paddingLeft: rtl ? 12 : onBackPress ? 4 : 24,
                                        paddingRight: !rtl ? 12 : onBackPress ? 4 : 24,
                                        paddingVertical: 12,
                                        direction: 'ltr',
                                        flexDirection: rtl ? 'row-reverse' : 'row',
                                        alignItems: 'center',
                                        gap: 0,
                                    }}
                                >
                                    {onBackPress ? (
                                        <IconButton
                                            icon={rtl ? 'arrow-right' : 'arrow-left'}
                                            iconColor={theme.colors.onSurfaceVariant}
                                            accessibilityLabel="Volver"
                                            onPress={onBackPress}
                                            testID={`${testID}-back`}
                                        />
                                    ) : null}
                                    <View
                                        ref={heading}
                                        accessible={Boolean(title)}
                                        accessibilityRole={title ? 'header' : undefined}
                                        accessibilityLabel={title}
                                        {...(Platform.OS === 'web' ? { tabIndex: title ? -1 : undefined, 'aria-hidden': !title } : {})}
                                        style={{ flex: 1 }}
                                        testID={`${testID}-title`}
                                    >
                                        <Text
                                            variant="titleLarge"
                                            accessible={false}
                                            {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                                            style={{
                                                color: theme.colors.onSurfaceVariant,
                                                textAlign: rtl ? 'right' : 'left',
                                                writingDirection: rtl ? 'rtl' : 'ltr',
                                            }}
                                        >
                                            {title}
                                        </Text>
                                    </View>
                                    {showCloseButton ? (
                                        <IconButton
                                            icon="close"
                                            iconColor={theme.colors.onSurfaceVariant}
                                            accessibilityLabel="Cerrar"
                                            onPress={dismiss}
                                            disabled={!dismissible}
                                            testID={`${testID}-close`}
                                        />
                                    ) : null}
                                </View>
                            ) : null)}
                        <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
                        {footer ? (
                            <View
                                style={{
                                    minHeight: 72,
                                    paddingTop: 16,
                                    paddingBottom: 24,
                                    paddingHorizontal: 24,
                                    direction: rtl ? 'rtl' : 'ltr',
                                    alignItems: 'flex-start',
                                    ...(showDivider ? { borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant } : {}),
                                }}
                            >
                                {footer}
                            </View>
                        ) : null}
                    </Surface>
                </Animated.View>
            </Animated.View>
        </GestureDetector>
    );
    return variant === 'modal' ? (
        <Modal
            accessibilityLabel={label}
            webDismissOnKeyDown
            transparent
            animationType="none"
            visible
            onRequestClose={dismiss}
            statusBarTranslucent
            navigationBarTranslucent
        >
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.scrim }, scrimStyle]}>
                {Platform.OS === 'web' ? (
                    <View
                        aria-hidden
                        {...{ onClick: dismiss }}
                        pointerEvents={open && dismissible ? 'auto' : 'none'}
                        style={StyleSheet.absoluteFill}
                        testID={`${testID}-scrim`}
                    />
                ) : (
                    <Pressable
                        accessible={false}
                        disabled={!open || !dismissible}
                        onPress={dismiss}
                        style={StyleSheet.absoluteFill}
                        testID={`${testID}-scrim`}
                    />
                )}
            </Animated.View>
            {panel}
        </Modal>
    ) : (
        panel
    );
}

function notifyContentSize(callback: ComponentProps<typeof GorhomScrollView>['onContentSizeChange'], width: number, height: number) {
    const handler = typeof callback === 'function' ? callback : callback?.get();
    handler?.(width, height);
}

/** React19 passes ref through props; each scrollable keeps Gorhom's gesture/ref contract. */
export function BottomSheetScrollView({
    showsVerticalScrollIndicator = false,
    showsHorizontalScrollIndicator = false,
    ...props
}: ComponentProps<typeof GorhomScrollView>) {
    const reportHeight = useContext(SheetContentHeight);
    return (
        <GorhomScrollView
            {...props}
            onContentSizeChange={(width, height) => {
                reportHeight?.(height);
                notifyContentSize(props.onContentSizeChange, width, height);
            }}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
        />
    );
}

export function BottomSheetFlatList<Item>({
    showsVerticalScrollIndicator = false,
    showsHorizontalScrollIndicator = false,
    ...props
}: ComponentProps<typeof GorhomFlatList<Item>>) {
    const reportHeight = useContext(SheetContentHeight);
    return (
        <GorhomFlatList<Item>
            {...props}
            onContentSizeChange={(width, height) => {
                reportHeight?.(height);
                notifyContentSize(props.onContentSizeChange, width, height);
            }}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
        />
    );
}

export function BottomSheetSectionList<Item, Section>({
    showsVerticalScrollIndicator = false,
    showsHorizontalScrollIndicator = false,
    ...props
}: ComponentProps<typeof GorhomSectionList<Item, Section>>) {
    const reportHeight = useContext(SheetContentHeight);
    return (
        <GorhomSectionList<Item, Section>
            {...props}
            onContentSizeChange={(width, height) => {
                reportHeight?.(height);
                notifyContentSize(props.onContentSizeChange, width, height);
            }}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
        />
    );
}

export { BottomSheetTextInput } from './bottom-sheet-text-input';
