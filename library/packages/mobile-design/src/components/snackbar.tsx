import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { Surface, Text, ThemeProvider, useLocale } from 'react-native-paper';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobileTheme } from '../core';
import { Button, type ButtonProps } from './button';
import { IconButton } from './icon-button';

type WebFocusTarget = {
    focus: (options?: { preventScroll: boolean }) => void;
    isConnected?: boolean;
    closest?: (selector: string) => unknown;
};
type WebFocusRegion = { contains: (target: unknown) => boolean };
const webDocument = () => (globalThis as unknown as { document?: { activeElement: WebFocusTarget | null } }).document;

export type SnackbarProps = Omit<ComponentProps<typeof Surface>, 'children' | 'style'> & {
    visible: boolean;
    onDismiss: () => void;
    children: ReactNode;
    /** Identifies a new notification even when its text is unchanged; restarts its lifetime without remounting. */
    messageKey?: string | number;
    action?: Omit<ButtonProps, 'children' | 'variant'> & { label: string };
    actionOnNewLine?: boolean;
    icon?: ComponentProps<typeof IconButton>['icon'];
    onIconPress?: () => void;
    iconAccessibilityLabel?: string;
    /** Actionable snackbars persist. Non-action messages default to4000ms on native. */
    duration?: number;
    /** Required to opt into automatic dismissal on web; the owner supplies accessible inline feedback. */
    inlineFeedback?: boolean;
    /** Web-only focus access, without autofocus. Set false if the host reserves Alt+G. */
    focusShortcut?: false | 'Alt+G';
    bottomOffset?: number;
    maxFontSizeMultiplier?: number;
    wrapperStyle?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    style?: ComponentProps<typeof Surface>['style'];
    testID?: string;
};

function SnackbarRoot({
    visible,
    onDismiss,
    children,
    messageKey,
    action,
    actionOnNewLine = false,
    icon = 'close',
    onIconPress,
    iconAccessibilityLabel = 'Cerrar mensaje',
    duration = 4000,
    inlineFeedback = false,
    focusShortcut = 'Alt+G',
    bottomOffset = 0,
    maxFontSizeMultiplier,
    wrapperStyle,
    contentStyle,
    style,
    theme: overrides,
    elevation = 3,
    testID = 'mobile-snackbar',
    ...props
}: SnackbarProps) {
    const theme = useMobileTheme(overrides);
    const { direction } = useLocale();
    const insets = useSafeAreaInsets();
    const [present, setPresent] = useState(visible);
    const [lines, setLines] = useState(1);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);
    const alive = useRef(true);
    const revision = useRef(0);
    const requested = useRef(false);
    const actionFocus = useRef<WebFocusTarget | null>(null);
    const closeFocus = useRef<WebFocusTarget | null>(null);
    const focusRegion = useRef<WebFocusRegion | null>(null);
    const returnFocus = useRef<WebFocusTarget | null>(null);
    const wasVisible = useRef(false);
    const restoreFocus = useCallback(() => {
        if (Platform.OS !== 'web') return;
        const active = webDocument()?.activeElement;
        const target = returnFocus.current;
        // Never steal focus after an action deliberately moved it elsewhere,
        // or revive a trigger removed/hidden by that action (for example a dialog).
        if (
            active &&
            focusRegion.current?.contains(active) &&
            target?.isConnected &&
            !target.closest?.('[inert], [aria-hidden="true"], [hidden], :disabled')
        )
            target.focus({ preventScroll: true });
    }, []);
    const presentation = {
        children,
        action,
        actionOnNewLine: actionOnNewLine && action != null,
        icon,
        onIconPress,
        iconAccessibilityLabel,
    };
    const retainedPresentation = useRef(presentation);
    useLayoutEffect(() => {
        if (visible) retainedPresentation.current = presentation;
    }, [action, actionOnNewLine, children, icon, iconAccessibilityLabel, onIconPress, visible]);
    // Owners commonly clear their message together with visible. Keep the last
    // visible content and footprint while its presence animation finishes.
    const shown = visible ? presentation : retainedPresentation.current;
    const latest = useRef({ visible, onDismiss, action, onIconPress });
    useLayoutEffect(() => {
        latest.current = { visible, onDismiss, action, onIconPress };
    }, [visible, onDismiss, action, onIconPress]);
    useLayoutEffect(() => {
        if (Platform.OS !== 'web') return;
        if (visible && !wasVisible.current) returnFocus.current = webDocument()?.activeElement ?? null;
        if (!visible) restoreFocus();
        wasVisible.current = visible;
    }, [restoreFocus, visible]);
    useLayoutEffect(() => () => restoreFocus(), [restoreFocus]);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            revision.current += 1;
            cancelAnimation(opacity);
            cancelAnimation(scale);
        };
    }, [opacity, scale]);
    const finish = useCallback((token: number) => {
        if (alive.current && revision.current === token && !latest.current.visible) setPresent(false);
    }, []);
    const dismiss = useCallback(
        (beforeDismiss?: () => void) => {
            if (!alive.current || !latest.current.visible || requested.current) return;
            requested.current = true;
            try {
                beforeDismiss?.();
            } finally {
                restoreFocus();
                latest.current.onDismiss();
            }
        },
        [restoreFocus]
    );
    useEffect(() => {
        if (Platform.OS !== 'web' || !visible || !focusShortcut || (!action && !onIconPress)) return;
        type ShortcutEvent = {
            key: string;
            code?: string;
            altKey: boolean;
            ctrlKey: boolean;
            metaKey: boolean;
            shiftKey: boolean;
            isComposing?: boolean;
            preventDefault: () => void;
        };
        type WebModal = { contains: (target: unknown) => boolean; closest?: (selector: string) => unknown };
        const document = (
            globalThis as unknown as {
                document?: {
                    addEventListener: (type: string, listener: (event: ShortcutEvent) => void) => void;
                    removeEventListener: (type: string, listener: (event: ShortcutEvent) => void) => void;
                    querySelectorAll: (selector: string) => ArrayLike<WebModal>;
                };
            }
        ).document;
        if (!document) return;
        const focusMessage = (event: ShortcutEvent) => {
            if (
                !alive.current ||
                !latest.current.visible ||
                !event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.isComposing ||
                (event.code !== 'KeyG' && event.key.toLowerCase() !== 'g')
            )
                return;
            const target = (!latest.current.action?.disabled ? actionFocus.current : null) ?? closeFocus.current;
            if (!target) return;
            // A snackbar in a background window must not pull focus out of an
            // active dialog. A snackbar inside that dialog remains reachable.
            const modals = Array.from(document.querySelectorAll('[aria-modal="true"]')).filter(
                (modal) => !modal.closest?.('[aria-hidden="true"]')
            );
            const topModal = modals[modals.length - 1];
            if (topModal && !topModal.contains(target)) return;
            const active = webDocument()?.activeElement;
            if (active && !focusRegion.current?.contains(active)) returnFocus.current = active;
            event.preventDefault();
            target.focus();
        };
        document.addEventListener('keydown', focusMessage);
        return () => document.removeEventListener('keydown', focusMessage);
    }, [action != null, focusShortcut, onIconPress != null, visible]);
    useLayoutEffect(() => {
        const token = ++revision.current;
        if (visible && !present) {
            setPresent(true);
            return;
        }
        if (!present) return;
        const completed = (finished?: boolean) => {
            'worklet';
            if (finished && !visible) scheduleOnRN(finish, token);
        };
        if (theme.animation.scale === 0) {
            opacity.set(withTiming(Number(visible), { duration: 0, reduceMotion: ReduceMotion.Never }, completed));
            scale.set(visible ? 1 : 0.8);
        } else {
            const effects = theme.motion.spring.fast.effects;
            const spatial = theme.motion.spring.fast.spatial;
            opacity.set(
                withSpring(
                    Number(visible),
                    {
                        stiffness: effects.stiffness,
                        damping: 2 * effects.damping * Math.sqrt(effects.stiffness),
                        mass: 1,
                        reduceMotion: ReduceMotion.Never,
                    },
                    completed
                )
            );
            scale.set(
                withSpring(visible ? 1 : 0.8, {
                    stiffness: spatial.stiffness,
                    damping: 2 * spatial.damping * Math.sqrt(spatial.stiffness),
                    mass: 1,
                    reduceMotion: ReduceMotion.Never,
                })
            );
        }
    }, [finish, opacity, present, scale, theme, visible]);
    useEffect(() => {
        requested.current = false;
        if (!visible) return;
        if (Platform.OS === 'ios' && typeof children === 'string')
            AccessibilityInfo.announceForAccessibilityWithOptions(children, { queue: true });
        // AndroidX defaults actionable messages to Indefinite. Web requires
        // another accessible feedback channel before automatic dismissal.
        if (action || (Platform.OS === 'web' && !inlineFeedback) || !Number.isFinite(duration)) return;
        let current = true;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const wait = Math.max(4000, duration);
        const start = (recommended: number) => {
            if (current)
                timeout = setTimeout(
                    () => {
                        if (current) dismiss();
                    },
                    Math.max(wait, recommended)
                );
        };
        if (Platform.OS === 'android') AccessibilityInfo.getRecommendedTimeoutMillis(wait).then(start, () => start(wait));
        else start(wait);
        return () => {
            current = false;
            if (timeout !== undefined) clearTimeout(timeout);
        };
    }, [action != null, children, dismiss, duration, inlineFeedback, messageKey, visible]);
    const animated = useAnimatedStyle(() => ({
        opacity: Math.max(0, Math.min(1, opacity.get())),
        transform: [{ scale: Math.max(0, scale.get()) }],
    }));
    if (!present) return null;
    const actionButton = shown.action ? (
        <Button
            {...shown.action}
            ref={(host) => {
                const node: unknown = host;
                actionFocus.current =
                    node && typeof node === 'object' && 'focus' in node && typeof node.focus === 'function'
                        ? (node as WebFocusTarget)
                        : null;
                if (typeof shown.action?.ref === 'function') return shown.action.ref(host);
                if (shown.action?.ref) shown.action.ref.current = host;
            }}
            variant="text"
            style={[{ maxWidth: '100%', flexShrink: 1 }, shown.action.style]}
            textColor={theme.colors.inversePrimary}
            disabled={shown.action.disabled || !visible}
            accessibilityHint={
                shown.action.accessibilityHint ??
                (Platform.OS === 'web' && focusShortcut ? 'Alt+G mueve el foco a este mensaje.' : undefined)
            }
            onPress={(event) => {
                const current = latest.current;
                if (!alive.current || !current.visible || current.action?.disabled || requested.current) return;
                dismiss(() => current.action?.onPress?.(event));
            }}
            testID={shown.action.testID ?? `${testID}-action`}
        >
            {shown.action.label}
        </Button>
    ) : null;
    const closeButton = shown.onIconPress ? (
        <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <IconButton
                ref={(host) => {
                    const node: unknown = host;
                    closeFocus.current =
                        node && typeof node === 'object' && 'focus' in node && typeof node.focus === 'function'
                            ? (node as WebFocusTarget)
                            : null;
                }}
                icon={shown.icon}
                iconColor={theme.colors.inverseOnSurface}
                accessibilityLabel={shown.iconAccessibilityLabel}
                disabled={!visible}
                onPress={() => {
                    if (alive.current && latest.current.visible && !requested.current) {
                        dismiss(() => latest.current.onIconPress?.());
                    }
                }}
                testID={`${testID}-close`}
            />
        </View>
    ) : null;
    return (
        <ThemeProvider theme={theme}>
            <View
                pointerEvents="box-none"
                style={[
                    {
                        position: 'absolute',
                        left: insets.left + 12,
                        right: insets.right + 12,
                        bottom: insets.bottom + 12 + bottomOffset,
                        alignItems: 'center',
                    },
                    wrapperStyle,
                ]}
            >
                <Animated.View
                    ref={(host: unknown) => {
                        if (Platform.OS === 'web' && host) focusRegion.current = host as unknown as WebFocusRegion;
                    }}
                    pointerEvents={visible ? 'auto' : 'none'}
                    accessibilityElementsHidden={!visible}
                    importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
                    onAccessibilityEscape={() => dismiss()}
                    {...(Platform.OS === 'web'
                        ? {
                              onKeyDown: (event: {
                                  nativeEvent: { key?: string };
                                  preventDefault?: () => void;
                                  stopPropagation?: () => void;
                              }) => {
                                  if (event.nativeEvent.key === 'Escape' && latest.current.visible) {
                                      event.preventDefault?.();
                                      event.stopPropagation?.();
                                      dismiss();
                                  }
                              },
                          }
                        : {})}
                    style={[{ width: '100%', maxWidth: 600 }, animated]}
                    testID={`${testID}-presence`}
                >
                    <Surface
                        {...props}
                        mode="elevated"
                        elevation={elevation}
                        style={[{ borderRadius: 4, backgroundColor: theme.colors.inverseSurface }, style]}
                        testID={testID}
                    >
                        <View
                            style={[
                                {
                                    minHeight: lines > 1 ? 64 : 48,
                                    direction: 'ltr',
                                    paddingLeft: direction === 'rtl' ? (shown.onIconPress ? 0 : shown.action ? 8 : 16) : 16,
                                    paddingRight: direction === 'rtl' ? 16 : shown.onIconPress ? 0 : shown.action ? 8 : 16,
                                    flexDirection: shown.actionOnNewLine ? 'column' : direction === 'rtl' ? 'row-reverse' : 'row',
                                    alignItems: shown.actionOnNewLine ? 'stretch' : 'center',
                                },
                                contentStyle,
                            ]}
                        >
                            <View
                                style={{
                                    ...(shown.actionOnNewLine ? {} : { flex: 1 }),
                                    paddingVertical: 12,
                                    ...(shown.action ? (direction === 'rtl' ? { marginLeft: 8 } : { marginRight: 8 }) : {}),
                                }}
                            >
                                <Text
                                    variant="bodyMedium"
                                    accessibilityLiveRegion={visible ? 'polite' : 'none'}
                                    maxFontSizeMultiplier={maxFontSizeMultiplier}
                                    testID={`${testID}-message`}
                                    numberOfLines={2}
                                    onTextLayout={(event) => setLines(Math.min(2, Math.max(1, event.nativeEvent.lines.length)))}
                                    style={{ color: theme.colors.inverseOnSurface, writingDirection: direction }}
                                >
                                    {shown.children}
                                </Text>
                            </View>
                            {shown.actionOnNewLine ? (
                                <View
                                    style={{
                                        direction: 'ltr',
                                        flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        paddingBottom: 2,
                                    }}
                                >
                                    {actionButton}
                                    {closeButton}
                                </View>
                            ) : (
                                <>
                                    {actionButton}
                                    {closeButton}
                                </>
                            )}
                        </View>
                    </Surface>
                </Animated.View>
            </View>
        </ThemeProvider>
    );
}

export const Snackbar = Object.assign(SnackbarRoot, { DURATION_SHORT: 4000, DURATION_MEDIUM: 7000, DURATION_LONG: 10000 });
