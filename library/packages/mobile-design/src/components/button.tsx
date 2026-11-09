import { buttonSizeTokens, type ButtonSize, type ButtonVariant } from '@mobile-design/tokens';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Animated as NativeAnimated, Platform, StyleSheet, View, type ColorValue } from 'react-native';
import { Icon, Text, ThemeProvider, useLocale, type ButtonProps as PaperButtonProps } from 'react-native-paper';
import { TouchableRipple } from '../ripple';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useMobileTheme } from '../core';
import { withAlpha } from '../color';
import { AnimatedActionSurface as AnimatedSurface } from './action-surface';
import { ProgressIndicator } from './progress-indicator';
import { PaperMotionBridge } from '../paper-motion-bridge';

// Paper forwards this ref to its native Pressable. The indication's own host
// clips its animated shape; an ancestor clip would discard the expanded hitSlop.
const AnimatedTouchableRipple = Animated.createAnimatedComponent(TouchableRipple);

export type ButtonProps = Omit<PaperButtonProps, 'mode' | 'ref' | 'loading' | 'dark' | 'touchableRef'> &
    Pick<ComponentProps<typeof TouchableRipple>, 'onHoverIn' | 'onHoverOut' | 'rippleColor' | 'ref'> & {
        /** An ongoing action blocks repeats and keeps its color contrast. Supply a renderer for a custom indicator. */
        loading?: boolean | ((props: { size: number; color: ColorValue }) => ReactNode);
        variant?: ButtonVariant;
        size?: ButtonSize;
        shape?: 'round' | 'square';
        /** Keep the resting shape during press and selection when false. */
        morph?: boolean;
        /** Browser link destination. Native navigation is handled by onPress. */
        href?: string;
        /** Browser attributes for a link destination. */
        hrefAttrs?: { target?: string; rel?: string; download?: boolean | string };
        selected?: boolean;
        /** Keep the pressed presentation while an attached popup is open; does not select the button. */
        pressed?: boolean;
        iconSize?: number;
    };

type IconButtonRenderOptions = {
    iconOnly?: boolean;
    containerWidth?: number;
    selectedRadius?: number;
    disabledContentColor?: ColorValue;
    disabledContainerOpacity?: number;
    disabledOutlineOpacity?: number;
};

/** Current MD3 size/shape scale, composed with Paper's ripple, text, icons and elevation. */
export function Button({
    variant: kind = 'filled',
    size = 'small',
    shape = 'round',
    morph = true,
    href,
    hrefAttrs,
    selected,
    pressed: controlledPressed = false,
    disabled = false,
    loading,
    icon,
    iconSize,
    children,
    style,
    contentStyle,
    labelStyle,
    buttonColor,
    textColor,
    hitSlop,
    theme: themeOverride,
    onPress,
    onLongPress,
    onPressIn,
    onPressOut,
    onFocus,
    onBlur,
    onHoverIn,
    onHoverOut,
    accessibilityLabel,
    accessibilityState,
    testID = 'mobile-button',
    uppercase = false,
    ...rest
}: ButtonProps) {
    const {
        iconOnly = false,
        containerWidth,
        selectedRadius,
        disabledContentColor,
        disabledContainerOpacity,
        disabledOutlineOpacity = 1,
        ...props
    } = rest as typeof rest & IconButtonRenderOptions;
    const theme = useMobileTheme(themeOverride);
    const { direction } = useLocale();
    const tokens = buttonSizeTokens[size];
    const blocked = disabled || Boolean(loading);
    const nativePress = useRef({ alive: true, blocked, generation: 0 });
    if (nativePress.current.blocked !== blocked) nativePress.current.generation++;
    nativePress.current.blocked = blocked;
    const pressGeneration = nativePress.current.generation;
    const canHandlePress = () =>
        nativePress.current.alive && !nativePress.current.blocked && nativePress.current.generation === pressGeneration;
    const [focused, setFocused] = useState(false);
    const [pressed, setPressed] = useState(false);
    const [hovered, setHovered] = useState(false);
    const forwardedPress = useRef<{
        event: Parameters<NonNullable<ComponentProps<typeof TouchableRipple>['onPressIn']>>[0];
        onPressOut: typeof onPressOut;
    } | null>(null);
    const releaseForwardedPress = () => {
        const pending = forwardedPress.current;
        if (!pending) return;
        forwardedPress.current = null;
        pending.onPressOut?.(pending.event);
    };
    const [measured, setMeasured] = useState({ size, height: tokens.height as number });
    const visualHeight = Math.max(measured.size === size ? measured.height : tokens.height, tokens.height);
    const fullRadius = visualHeight / 2;
    // The text configuration has no toggle variant. Standard IconButton uses
    // this rendering path internally and does support selection.
    const toggle = selected != null && (iconOnly || kind !== 'text');
    useEffect(() => {
        if (!blocked) return;
        // Pressability may be disabled before it delivers release/blur. A later
        // enable must not revive a held shape, hover shadow or focus indicator.
        setPressed(false);
        setHovered(false);
        setFocused(false);
        releaseForwardedPress();
    }, [blocked]);
    // A held target can disappear without a final native PressOut. Preserve
    // the matching In's callback/target and release once, including composites.
    useEffect(() => {
        nativePress.current.alive = true;
        return () => {
            nativePress.current.alive = false;
            releaseForwardedPress();
        };
    }, []);
    const radiusTarget = !morph
        ? shape === 'round'
            ? fullRadius
            : tokens.square
        : (pressed || controlledPressed) && !blocked
          ? tokens.pressed
          : toggle && selected
            ? (selectedRadius ?? (shape === 'round' ? tokens.square : fullRadius))
            : shape === 'round'
              ? fullRadius
              : tokens.square;
    const radius = useSharedValue(radiusTarget);
    // The current M3 web tokens map Button corner-size to FastSpatial.
    // IconButton's separate API still specifies DefaultEffects without bounce.
    const spring = iconOnly ? theme.motion.spring.default.effects : theme.motion.spring.fast.spatial;
    const animationScale = theme.animation.scale;
    useEffect(() => {
        radius.set(
            animationScale === 0
                ? radiusTarget
                : withSpring(radiusTarget, {
                      reduceMotion: ReduceMotion.Never,
                      stiffness: spring.stiffness,
                      damping: 2 * spring.damping * Math.sqrt(spring.stiffness),
                      mass: 1,
                  })
        );
    }, [radiusTarget, radius, animationScale, spring.stiffness, spring.damping]);
    // Replacing a running spring lets Reanimated resolve velocity at the next
    // target. Cancel only on unmount: per-update cleanup would discard the
    // previous spring before the engine can handle an interrupted morph.
    useEffect(() => () => cancelAnimation(radius), [radius]);
    const radiusStyle = useAnimatedStyle(() => ({ borderRadius: Math.max(0, radius.get()) }));
    const focusGeometry = useAnimatedStyle(() => ({ borderRadius: Math.max(0, radius.get()) + 5 }));
    const containerColors: Record<ButtonVariant, ColorValue> = {
        filled: theme.colors.primary,
        tonal: theme.colors.secondaryContainer,
        elevated: theme.colors.surfaceContainerLow,
        outlined: 'transparent',
        text: 'transparent',
    };
    const labelColors: Record<ButtonVariant, ColorValue> = {
        filled: theme.colors.onPrimary,
        tonal: theme.colors.onSecondaryContainer,
        elevated: theme.colors.primary,
        outlined: theme.colors.onSurfaceVariant,
        text: theme.colors.primary,
    };
    const fill =
        buttonColor ??
        (selected === false && kind === 'filled'
            ? theme.colors.surfaceContainer
            : selected === true && kind === 'outlined'
              ? theme.colors.inverseSurface
              : selected === true && kind === 'tonal'
                ? theme.colors.secondary
                : selected === true && kind === 'elevated'
                  ? theme.colors.primary
                  : containerColors[kind]);
    const ink = disabled
        ? (disabledContentColor ?? theme.colors.onSurface)
        : (textColor ??
          (selected === false && kind === 'filled'
              ? theme.colors.onSurfaceVariant
              : selected === true && kind === 'outlined'
                ? theme.colors.inverseOnSurface
                : selected === true && kind === 'tonal'
                  ? theme.colors.onSecondary
                  : selected === true && kind === 'elevated'
                    ? theme.colors.onPrimary
                    : labelColors[kind]));
    const iconSlot = Boolean(icon) || Boolean(loading);
    const glyphSize = iconSize ?? tokens.icon;
    const touchInsets = hitSlop ?? {
        top: Math.max(0, (48 - visualHeight) / 2),
        bottom: Math.max(0, (48 - visualHeight) / 2),
        left: iconOnly ? Math.max(0, (48 - (containerWidth ?? tokens.height)) / 2) : 0,
        right: iconOnly ? Math.max(0, (48 - (containerWidth ?? tokens.height)) / 2) : 0,
    };
    const webInsets =
        typeof touchInsets === 'number'
            ? { top: touchInsets, bottom: touchInsets, left: touchInsets, right: touchInsets }
            : { top: touchInsets.top ?? 0, bottom: touchInsets.bottom ?? 0, left: touchInsets.left ?? 0, right: touchInsets.right ?? 0 };
    return (
        <ThemeProvider theme={theme}>
            <PaperMotionBridge>
                <NativeAnimated.View
                    // Cross-axis placement belongs to the parent composition;
                    // forcing start here misaligns mixed-height action rows.
                    style={[
                        {
                            minHeight: Math.max(48, tokens.height),
                            minWidth: 48,
                            justifyContent: 'center',
                            alignItems: 'center',
                        },
                        style,
                    ]}
                >
                    <AnimatedSurface
                        // M3's current token browser deprecates hover elevation
                        // for every Button style. Hover is an8% state layer.
                        elevation={!blocked && kind === 'elevated' ? 1 : 0}
                        geometry={radiusStyle}
                        style={{
                            backgroundColor: disabled || kind === 'text' || (kind === 'outlined' && !selected) ? 'transparent' : fill,
                            borderRadius: radiusTarget,
                            alignSelf: iconOnly ? undefined : 'stretch',
                        }}
                    >
                        <Animated.View style={{ minWidth: iconOnly ? (containerWidth ?? tokens.height) : 58 }}>
                            <Animated.View
                                pointerEvents="none"
                                style={[
                                    StyleSheet.absoluteFill,
                                    {
                                        backgroundColor: disabled ? theme.colors.onSurface : fill,
                                        opacity:
                                            disabled && kind !== 'text' && (kind !== 'outlined' || selected)
                                                ? (disabledContainerOpacity ?? 0.1)
                                                : disabled
                                                  ? 0
                                                  : 1,
                                    },
                                    radiusStyle,
                                ]}
                            />
                            {kind === 'outlined' && !selected ? (
                                <Animated.View
                                    pointerEvents="none"
                                    style={[
                                        StyleSheet.absoluteFill,
                                        {
                                            borderWidth: tokens.outline,
                                            borderColor: theme.colors.outlineVariant,
                                            opacity: disabled ? disabledOutlineOpacity : 1,
                                        },
                                        radiusStyle,
                                    ]}
                                />
                            ) : null}
                            {(controlledPressed || (!pressed && (focused || hovered))) && !blocked ? (
                                <Animated.View
                                    pointerEvents="none"
                                    style={[
                                        StyleSheet.absoluteFill,
                                        { backgroundColor: ink, opacity: controlledPressed || focused ? 0.1 : 0.08 },
                                        radiusStyle,
                                    ]}
                                />
                            ) : null}
                            <AnimatedTouchableRipple
                                // RN Pressability.configure only replaces its config; it does
                                // not clear a held underlay. Unmounting the touch host resets
                                // that native press when a running action blocks this button.
                                key={blocked ? 'inactive' : 'interactive'}
                                {...props}
                                accessibilityRole={props.accessibilityRole ?? (Platform.OS === 'web' && href ? 'link' : 'button')}
                                accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
                                {...(Platform.OS === 'web'
                                    ? {
                                          href: blocked ? undefined : href,
                                          hrefAttrs,
                                          'aria-disabled': blocked,
                                          'aria-busy': Boolean(loading) || Boolean(accessibilityState?.busy),
                                          'aria-expanded': accessibilityState?.expanded,
                                          'aria-checked': accessibilityState?.checked,
                                          dataSet: { mobileDesignHitTarget: 'true' },
                                          'aria-selected': toggle ? undefined : accessibilityState?.selected,
                                          ...(toggle ? { 'aria-pressed': Boolean(selected) } : {}),
                                      }
                                    : {})}
                                accessibilityState={{
                                    ...accessibilityState,
                                    disabled: blocked,
                                    busy: Boolean(loading) || Boolean(accessibilityState?.busy),
                                    ...(toggle ? { selected: Platform.OS === 'web' ? undefined : selected } : {}),
                                }}
                                disabled={blocked}
                                hitSlop={touchInsets}
                                onPress={
                                    onPress
                                        ? (event) => {
                                              if (canHandlePress()) onPress(event);
                                          }
                                        : undefined
                                }
                                onLongPress={
                                    onLongPress
                                        ? (event) => {
                                              if (canHandlePress()) onLongPress(event);
                                          }
                                        : undefined
                                }
                                onPressIn={(event) => {
                                    if (!canHandlePress()) return;
                                    if (Platform.OS === 'web') setFocused(typeof (event.nativeEvent as { key?: unknown }).key === 'string');
                                    setPressed(true);
                                    if (!forwardedPress.current) {
                                        forwardedPress.current = {
                                            // RN's responder event exposes getter-only fields. Define
                                            // own snapshot values without assigning through those getters.
                                            event: Object.create(Object.getPrototypeOf(event), {
                                                ...Object.getOwnPropertyDescriptors(event),
                                                nativeEvent: {
                                                    value: { ...event.nativeEvent },
                                                    enumerable: true,
                                                    configurable: true,
                                                    writable: true,
                                                },
                                                currentTarget: {
                                                    value: event.currentTarget,
                                                    enumerable: true,
                                                    configurable: true,
                                                    writable: true,
                                                },
                                            }),
                                            onPressOut,
                                        };
                                    }
                                    onPressIn?.(event);
                                }}
                                onPressOut={(event) => {
                                    if (!canHandlePress()) return;
                                    setPressed(false);
                                    const pending = forwardedPress.current;
                                    if (!pending) return;
                                    forwardedPress.current = null;
                                    pending.onPressOut?.(event);
                                }}
                                onFocus={(event) => {
                                    if (!canHandlePress()) return;
                                    const target = event.currentTarget as unknown as { matches?: (selector: string) => boolean };
                                    setFocused(Platform.OS !== 'web' || (target.matches?.(':focus-visible') ?? true));
                                    onFocus?.(event);
                                }}
                                onBlur={(event) => {
                                    if (!canHandlePress()) return;
                                    setFocused(false);
                                    setPressed(false);
                                    releaseForwardedPress();
                                    onBlur?.(event);
                                }}
                                onHoverIn={(event) => {
                                    if (!canHandlePress()) return;
                                    setHovered(true);
                                    onHoverIn?.(event);
                                }}
                                onHoverOut={(event) => {
                                    // Leaving is cleanup, even if loading/disabled replaced
                                    // the press host since enter. Attached hints must close.
                                    if (!nativePress.current.alive) return;
                                    setHovered(false);
                                    onHoverOut?.(event);
                                }}
                                rippleColor={
                                    controlledPressed
                                        ? 'transparent'
                                        : (props.rippleColor ??
                                          (typeof ink === 'string' ? withAlpha(ink, 0.1) : theme.colors.stateLayerPressed))
                                }
                                // Native hit-testing includes the host's own hitSlop before
                                // clipping; visible ancestors propagate the expanded rect.
                                // Web clips the indication separately from its larger target.
                                // Paper retains its native ripple / underlay and settings.
                                style={[
                                    { backgroundColor: 'transparent', overflow: Platform.OS === 'web' ? 'visible' : 'hidden' },
                                    // RN Web does not expand DOM hit testing for hitSlop. Padding
                                    // makes the real button target larger; negative margins keep
                                    // its visual surface and layout unchanged. The web indication
                                    // clips to the inner surface rather than this invisible target.
                                    Platform.OS === 'web'
                                        ? {
                                              paddingTop: webInsets.top,
                                              paddingBottom: webInsets.bottom,
                                              paddingLeft: webInsets.left,
                                              paddingRight: webInsets.right,
                                              marginTop: -webInsets.top,
                                              marginBottom: -webInsets.bottom,
                                              marginLeft: -webInsets.left,
                                              marginRight: -webInsets.right,
                                          }
                                        : undefined,
                                    radiusStyle,
                                ]}
                                testID={testID}
                            >
                                <View
                                    onLayout={(event) => setMeasured({ size, height: event.nativeEvent.layout.height })}
                                    pointerEvents="none"
                                    style={[
                                        {
                                            // Resolve the logical leading edge from Paper's
                                            // locale once. row-reverse plus a native RTL
                                            // root would otherwise mirror the content twice.
                                            direction,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: tokens.height,
                                            gap: iconOnly ? 0 : tokens.gap,
                                            paddingHorizontal: iconOnly ? 0 : tokens.padding,
                                            paddingVertical: iconOnly ? 0 : tokens.verticalPadding,
                                            width: iconOnly ? (containerWidth ?? tokens.height) : undefined,
                                            opacity: disabled ? 0.38 : 1,
                                        },
                                        contentStyle,
                                    ]}
                                >
                                    {iconSlot ? (
                                        <View
                                            style={{ width: glyphSize, height: glyphSize, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            {typeof loading === 'function' ? (
                                                loading({ size: glyphSize, color: ink })
                                            ) : loading ? (
                                                <ProgressIndicator
                                                    variant="circular"
                                                    size={glyphSize}
                                                    color={ink}
                                                    showTrack={false}
                                                    accessibilityLabel="En curso"
                                                />
                                            ) : icon ? (
                                                <Icon source={icon} size={glyphSize} color={ink} />
                                            ) : null}
                                        </View>
                                    ) : null}
                                    {!iconOnly ? (
                                        <Text
                                            numberOfLines={2}
                                            maxFontSizeMultiplier={props.maxFontSizeMultiplier}
                                            style={[
                                                theme.fonts[tokens.text],
                                                {
                                                    color: ink,
                                                    textTransform: uppercase ? 'uppercase' : 'none',
                                                    textAlign: 'center',
                                                    flexShrink: 1,
                                                },
                                                labelStyle,
                                            ]}
                                        >
                                            {children}
                                        </Text>
                                    ) : null}
                                </View>
                            </AnimatedTouchableRipple>
                        </Animated.View>
                        {focused && !blocked ? (
                            <Animated.View
                                pointerEvents="none"
                                style={[
                                    StyleSheet.absoluteFill,
                                    { margin: -5, borderWidth: 3, borderColor: theme.colors.secondary },
                                    focusGeometry,
                                ]}
                            />
                        ) : null}
                    </AnimatedSurface>
                </NativeAnimated.View>
            </PaperMotionBridge>
        </ThemeProvider>
    );
}

// IconButton shares the same React component with access to its rendering options.
export const ButtonForIcon: (props: ButtonProps & IconButtonRenderOptions) => ReturnType<typeof Button> = Button;
