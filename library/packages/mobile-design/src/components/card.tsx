import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { Card as PaperCard, Surface, ThemeProvider } from 'react-native-paper';
import { useMobileTheme } from '../core';
import { withAlpha } from '../color';
import { TouchableRipple } from '../ripple';
import { usePressScope } from './press-scope';

type PressProps = ComponentProps<typeof Pressable>;
export type CardProps = Omit<ComponentProps<typeof PaperCard>, 'onPressIn' | 'onPressOut' | 'elevation'> & {
    /** Link destination in a browser. Native navigation remains in onPress. */
    href?: string;
    /** Browser attributes for the link destination. */
    hrefAttrs?: { rel?: string };
    /** Material names; Paper's contained mode corresponds to the filled variant. */
    variant?: 'elevated' | 'filled' | 'outlined';
    elevation?: 0 | 1 | 2 | 3 | 4 | 5 | Animated.Value;
    /** Drag state comes from the application's actual drag controller. */
    dragged?: boolean;
    onPressIn?: (event: GestureResponderEvent) => void;
    onPressOut?: (event: GestureResponderEvent) => void;
    onHoverIn?: PressProps['onHoverIn'];
    onHoverOut?: PressProps['onHoverOut'];
    onFocus?: PressProps['onFocus'];
    onBlur?: PressProps['onBlur'];
};

/** Paper content slots are retained; current M3 container/state tokens are applied locally. */
function CardRoot({
    variant,
    mode: suppliedMode = 'elevated',
    elevation: suppliedElevation,
    dragged = false,
    href,
    hrefAttrs,
    disabled = false,
    onPress,
    onLongPress,
    onPressIn,
    onPressOut,
    onHoverIn,
    onHoverOut,
    onFocus,
    onBlur,
    delayLongPress,
    children,
    style,
    contentStyle,
    theme: overrides,
    testID = 'mobile-card',
    accessible,
    accessibilityRole,
    accessibilityLabel,
    accessibilityHint,
    accessibilityState,
    ref,
    ...props
}: CardProps) {
    const mode = variant === 'filled' ? 'contained' : (variant ?? suppliedMode);
    const theme = useMobileTheme(overrides);
    const canPress = usePressScope(disabled);
    const [pressed, setPressed] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    useEffect(() => {
        if (disabled) {
            setPressed(false);
            setHovered(false);
            setFocused(false);
        }
    }, [disabled]);
    const base = mode === 'elevated' ? 1 : 0;
    const target = disabled
        ? base
        : dragged
          ? mode === 'elevated'
              ? 4
              : 3
          : pressed || focused
            ? base
            : hovered
              ? mode === 'elevated'
                  ? 2
                  : 1
              : base;
    const elevation = useRef(new Animated.Value(typeof suppliedElevation === 'number' ? suppliedElevation : base)).current;
    useEffect(() => {
        elevation.stopAnimation();
        if (suppliedElevation instanceof Animated.Value) return;
        const value = typeof suppliedElevation === 'number' ? suppliedElevation : target;
        if (theme.animation.scale === 0) {
            elevation.setValue(value);
            return;
        }
        // Paper Surface consumes an RN Animated.Value for shadow/color interpolation.
        // Shadow elevation is not a native-driver property in Paper's renderer.
        const spring = theme.motion.spring.default.effects;
        const animation = Animated.spring(elevation, {
            toValue: value,
            stiffness: spring.stiffness,
            damping: 2 * spring.damping * Math.sqrt(spring.stiffness),
            mass: 1,
            useNativeDriver: false,
            isInteraction: false,
        });
        animation.start();
        return () => animation.stop();
    }, [elevation, suppliedElevation, target, theme]);
    const interactive = !!(onPress || onLongPress || onPressIn || onPressOut || (Platform.OS === 'web' && href));
    const CardPressable = (Platform.OS === 'web' ? TouchableRipple : Pressable) as typeof Pressable;
    const background =
        mode === 'contained'
            ? theme.colors.surfaceContainerHighest
            : mode === 'outlined'
              ? theme.colors.surface
              : theme.colors.surfaceContainerLow;
    const disabledLayer = mode === 'contained' ? theme.colors.surfaceVariant : theme.colors.surface;
    const border = disabled ? theme.colors.outline : focused ? theme.colors.onSurface : theme.colors.outlineVariant;
    const stateOpacity = disabled
        ? 0
        : dragged
          ? 0.16
          : pressed
            ? Platform.OS === 'android' || (Platform.OS === 'web' && theme.animation.scale !== 0)
                ? 0
                : 0.1
            : focused
              ? 0.1
              : hovered
                ? 0.08
                : 0;
    const card = (
        <View pointerEvents={disabled ? 'none' : 'auto'} style={{ borderRadius: 12, overflow: 'hidden' }}>
            {disabled && mode !== 'outlined' ? (
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: disabledLayer, opacity: 0.38 }]} />
            ) : null}
            <PaperCard
                mode="contained"
                theme={theme}
                style={{ backgroundColor: 'transparent', borderRadius: 12 }}
                contentStyle={contentStyle}
                testID={`${testID}-content`}
            >
                {children}
            </PaperCard>
            {stateOpacity ? (
                <View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.onSurface, opacity: stateOpacity }]}
                />
            ) : null}
        </View>
    );
    return (
        <ThemeProvider theme={theme}>
            <Surface
                {...props}
                ref={ref}
                elevation={suppliedElevation instanceof Animated.Value ? suppliedElevation : elevation}
                style={[{ borderRadius: 12, backgroundColor: disabled && mode === 'contained' ? theme.colors.surface : background }, style]}
                testID={`${testID}-container`}
            >
                {interactive ? (
                    <CardPressable
                        key={disabled ? 'inactive' : 'interactive'}
                        accessible={accessible}
                        accessibilityRole={accessibilityRole ?? (href ? 'link' : 'button')}
                        accessibilityLabel={accessibilityLabel}
                        accessibilityHint={accessibilityHint}
                        accessibilityState={{ ...accessibilityState, disabled }}
                        {...(Platform.OS === 'web'
                            ? {
                                  href: disabled ? undefined : href,
                                  hrefAttrs,
                                  'aria-disabled': disabled,
                                  'aria-selected': accessibilityState?.selected,
                              }
                            : {})}
                        disabled={disabled}
                        delayLongPress={delayLongPress}
                        onPress={
                            onPress
                                ? (event) => {
                                      if (canPress()) onPress(event);
                                  }
                                : undefined
                        }
                        onLongPress={
                            onLongPress
                                ? () => {
                                      if (canPress()) onLongPress();
                                  }
                                : undefined
                        }
                        onPressIn={(event) => {
                            if (!canPress()) return;
                            if (Platform.OS === 'web') setFocused(typeof (event.nativeEvent as { key?: unknown }).key === 'string');
                            setPressed(true);
                            onPressIn?.(event);
                        }}
                        onPressOut={(event) => {
                            setPressed(false);
                            onPressOut?.(event);
                        }}
                        onHoverIn={(event) => {
                            setHovered(true);
                            onHoverIn?.(event);
                        }}
                        onHoverOut={(event) => {
                            setHovered(false);
                            onHoverOut?.(event);
                        }}
                        onFocus={(event) => {
                            if (!canPress()) return;
                            const target = event.currentTarget as unknown as { matches?: (selector: string) => boolean };
                            setFocused(Platform.OS !== 'web' || (target.matches?.(':focus-visible') ?? true));
                            onFocus?.(event);
                        }}
                        onBlur={(event) => {
                            setFocused(false);
                            setPressed(false);
                            onBlur?.(event);
                        }}
                        android_ripple={{
                            color:
                                typeof theme.colors.onSurface === 'string'
                                    ? withAlpha(theme.colors.onSurface, 0.1)
                                    : theme.colors.onSurface,
                            foreground: true,
                        }}
                        {...(Platform.OS === 'web'
                            ? {
                                  rippleColor:
                                      typeof theme.colors.onSurface === 'string'
                                          ? withAlpha(theme.colors.onSurface, 0.1)
                                          : theme.colors.onSurface,
                              }
                            : {})}
                        style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: 'transparent' }}
                        testID={testID}
                    >
                        {card}
                    </CardPressable>
                ) : (
                    <View
                        accessible={accessible}
                        accessibilityLabel={accessibilityLabel}
                        accessibilityHint={accessibilityHint}
                        accessibilityRole={accessibilityRole}
                        accessibilityState={accessibilityState}
                        testID={testID}
                    >
                        {card}
                    </View>
                )}
                {mode === 'outlined' ? (
                    <View
                        pointerEvents="none"
                        style={[
                            StyleSheet.absoluteFill,
                            { borderRadius: 12, borderWidth: 1, borderColor: border, opacity: disabled ? 0.12 : 1 },
                        ]}
                    />
                ) : null}
                {focused && !disabled ? (
                    <View
                        pointerEvents="none"
                        style={[
                            StyleSheet.absoluteFill,
                            { margin: -5, borderWidth: 3, borderColor: theme.colors.secondary, borderRadius: 17 },
                        ]}
                    />
                ) : null}
            </Surface>
        </ThemeProvider>
    );
}

export const Card = Object.assign(CardRoot, {
    Title: PaperCard.Title,
    Content: PaperCard.Content,
    Cover: PaperCard.Cover,
    Actions: PaperCard.Actions,
});
