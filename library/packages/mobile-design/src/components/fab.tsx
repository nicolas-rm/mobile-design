import { fabSizeTokens } from '@mobile-design/tokens';
import { getScrollIndicatorProps, type ScrollIndicatorOptions } from '../scroll-indicators';
/*
 * Geometry and interaction adapted from AndroidX FloatingActionButton.kt and
 * FloatingActionButtonMenu.kt, Copyright The Android Open Source Project, Apache2.0.
 * https://www.apache.org/licenses/LICENSE-2.0
 * Source androidx/androidx@d153d87ed76372ece0c99dac837ff07ab845d495.
 * RN/Paper composition; uses native ScrollView and Reanimated rather than Compose layout.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ComponentRef, type ReactNode, type Ref } from 'react';
import {
    BackHandler,
    Platform,
    ScrollView,
    StyleSheet,
    View,
    useWindowDimensions,
    type AccessibilityState,
    type ColorValue,
    type GestureResponderEvent,
    type PressableAndroidRippleConfig,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { Icon, Text, ThemeProvider, useLocale } from 'react-native-paper';
import { TouchableRipple } from '../ripple';
import Animated, {
    cancelAnimation,
    ReduceMotion,
    useAnimatedReaction,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobileTheme, type MobileDesignTheme } from '../core';
import { withAlpha } from '../color';
import { AnimatedActionSurface as AnimatedSurface } from './action-surface';
import { Menu } from './menu';
import { PaperMotionBridge } from '../paper-motion-bridge';

type IconSource = ComponentProps<typeof Icon>['source'];
export type FABVariant = 'primary' | 'secondary' | 'tertiary' | 'tonalPrimary' | 'tonalSecondary' | 'tonalTertiary';
export type FABSize = 'default' | 'medium' | 'large';
type FABInteractionProps = Pick<
    ComponentProps<typeof TouchableRipple>,
    'onPressIn' | 'onPressOut' | 'onLongPress' | 'delayLongPress' | 'onFocus' | 'onBlur' | 'onHoverIn' | 'onHoverOut' | 'onTouchCancel'
>;
export type FABProps = FABInteractionProps & {
    icon: IconSource;
    variant?: FABVariant;
    size?: FABSize;
    visible?: boolean;
    /** Use0 when embedded in a navigation rail; standalone FABs default to level3. */
    elevation?: 0 | 1 | 2 | 3;
    containerColor?: ColorValue;
    contentColor?: ColorValue;
    onPress?: (event: GestureResponderEvent) => void;
    accessibilityLabel?: string;
    accessibilityState?: AccessibilityState;
    'aria-describedby'?: string;
    /** Identifica un FAB que abre un menú en el árbol accesible web. */
    'aria-haspopup'?: 'menu';
    background?: PressableAndroidRippleConfig;
    style?: StyleProp<ViewStyle>;
    theme?: Parameters<typeof useMobileTheme>[0];
    testID?: string;
    ref?: Ref<ComponentRef<typeof View>>;
};
export type ExtendedFABProps = Omit<FABProps, 'icon'> & {
    icon?: IconSource;
    label: string;
    /** Extended by default; a host can collapse an icon-bearing FAB on scroll. */
    expanded?: boolean;
    labelMaxFontSizeMultiplier?: number;
};
type FABMenuItemBase = {
    /** Stable identity when an optional submenu is edited or localized. */
    key?: string;
    icon?: IconSource;
    label: string;
    accessibilityLabel?: string;
    disabled?: boolean;
    testID?: string;
};
export type FABMenuItemProps = FABMenuItemBase &
    ({ onPress: (event: GestureResponderEvent) => void; items?: never } | { items: readonly FABMenuItemProps[]; onPress?: never });
export type FABMenuTriggerProps = Omit<FABProps, 'style' | 'theme' | 'ref'>;
type TwoToSix<T> = readonly [T, T] | readonly [T, T, T] | readonly [T, T, T, T] | readonly [T, T, T, T, T] | readonly [T, T, T, T, T, T];
type FABMenuBaseProps = {
    /** Adaptive follows the web Menu pattern; expressive keeps the animated pill stack on every platform. */
    presentation?: 'adaptive' | 'expressive';
    /** Scrollbars are opt-in for this component only; both axes are hidden by default. */
    scrollIndicators?: ScrollIndicatorOptions;
    expanded: boolean;
    onDismiss: () => void;
    trigger: FABMenuTriggerProps;
    closeIcon?: IconSource;
    closeAccessibilityLabel?: string;
    /** Optional Mobile Design extension; bounds the action stack, excluding the close FAB. */
    maxHeight?: number;
    backLabel?: string;
    backAccessibilityLabel?: string;
    scrollUpAccessibilityLabel?: string;
    scrollDownAccessibilityLabel?: string;
    theme?: FABProps['theme'];
    testID?: string;
};
export type FABMenuProps = FABMenuBaseProps &
    ({ overflow?: undefined; items: TwoToSix<FABMenuItemProps> } | { overflow: 'scroll'; items: readonly FABMenuItemProps[] });

const AnimatedMenuScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedTouchableRipple = Animated.createAnimatedComponent(TouchableRipple);
const itemKey = (item: FABMenuItemProps, index: number) => item.key ?? `${index}-${item.label}`;

/** Resolve only live, enabled branches; stale paths fall back to their nearest valid ancestor. */
export function resolveFABMenuPath(items: readonly FABMenuItemProps[], path: readonly string[]) {
    let current = items;
    let title = '';
    const validPath: string[] = [];
    for (const key of path) {
        const branch = current.find((item, index) => itemKey(item, index) === key);
        if (!branch || branch.disabled || !branch.items?.length) break;
        current = branch.items;
        title = branch.label;
        validPath.push(key);
    }
    return { items: current, path: validPath, title };
}

/** Safe action viewport, distinct from the fixed close FAB and its8dp gap. */
export function fabMenuViewport({
    width,
    height,
    insets,
    margin,
    triggerHeight,
    maxHeight,
}: {
    width: number;
    height: number;
    insets: { top: number; right: number; bottom: number; left: number };
    margin: number;
    triggerHeight: number;
    maxHeight?: number;
}) {
    const availableHeight = Math.max(0, height - insets.top - insets.bottom - margin * 2 - triggerHeight - 8);
    return {
        width: Math.max(0, width - insets.left - insets.right - margin * 2),
        height: Math.min(availableHeight, maxHeight != null && Number.isFinite(maxHeight) ? Math.max(0, maxHeight) : availableHeight),
        availableHeight,
    };
}

const spring = (theme: MobileDesignTheme, speed: 'fast' | 'slow', kind: 'spatial' | 'effects') => {
    'worklet';
    const spec = theme.motion.spring[speed][kind];
    return { stiffness: spec.stiffness, damping: 2 * spec.damping * Math.sqrt(spec.stiffness), mass: 1, reduceMotion: ReduceMotion.Never };
};
const roleColors = (theme: MobileDesignTheme, variant: FABVariant, containerColor?: ColorValue, contentColor?: ColorValue) => {
    const roles = {
        primary: ['primary', 'onPrimary'],
        secondary: ['secondary', 'onSecondary'],
        tertiary: ['tertiary', 'onTertiary'],
        tonalPrimary: ['primaryContainer', 'onPrimaryContainer'],
        tonalSecondary: ['secondaryContainer', 'onSecondaryContainer'],
        tonalTertiary: ['tertiaryContainer', 'onTertiaryContainer'],
    } as const;
    const [container, content] = roles[variant];
    // Match a supplied semantic background to its foreground, including opaque native colors.
    const semantic = containerColor == null ? undefined : Object.values(roles).find(([key]) => theme.colors[key] === containerColor);
    return {
        container: containerColor ?? theme.colors[container],
        content:
            contentColor ??
            (containerColor == null ? theme.colors[content] : semantic ? theme.colors[semantic[1]] : theme.colors.onSurface),
    };
};

function usePresence(visible: boolean, theme: MobileDesignTheme) {
    const scale = useSharedValue(visible ? 1 : 0.2);
    const alpha = useSharedValue(visible ? 1 : 0);
    useEffect(() => {
        scale.set(theme.animation.scale === 0 ? (visible ? 1 : 0.2) : withSpring(visible ? 1 : 0.2, spring(theme, 'fast', 'spatial')));
        alpha.set(theme.animation.scale === 0 ? Number(visible) : withSpring(Number(visible), spring(theme, 'fast', 'effects')));
    }, [alpha, scale, theme, visible]);
    useEffect(
        () => () => {
            cancelAnimation(scale);
            cancelAnimation(alpha);
        },
        [alpha, scale]
    );
    return useAnimatedStyle(() => ({
        transform: [{ scale: Math.max(0.01, scale.get()) }],
        opacity: Math.max(0, Math.min(1, alpha.get())),
    }));
}

type ShellProps = Omit<FABProps, 'theme' | 'icon'> & {
    theme: MobileDesignTheme;
    width: number;
    height: number;
    radius: number;
    animatedGeometry?: ReturnType<typeof useAnimatedStyle>;
    animatedFocusGeometry?: ReturnType<typeof useAnimatedStyle>;
    children: ReactNode;
};
function Shell({
    theme,
    width,
    height,
    radius,
    animatedGeometry,
    animatedFocusGeometry,
    visible = true,
    variant = 'tonalPrimary',
    elevation = 3,
    containerColor,
    contentColor,
    accessibilityLabel,
    accessibilityState,
    'aria-describedby': describedBy,
    'aria-haspopup': hasPopup,
    background,
    onPress,
    onPressIn,
    onPressOut,
    onLongPress,
    delayLongPress,
    onFocus,
    onBlur,
    onHoverIn,
    onHoverOut,
    onTouchCancel,
    style,
    testID = 'mobile-fab',
    ref,
    children,
}: ShellProps) {
    const colors = roleColors(theme, variant, containerColor, contentColor);
    const presence = usePresence(visible, theme);
    const [focused, setFocused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const alive = useRef(true);
    const interaction = useRef({ visible, onPress, onLongPress });
    interaction.current = { visible, onPress, onLongPress };
    useEffect(() => {
        if (!visible) {
            setFocused(false);
            setHovered(false);
        }
    }, [visible]);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    return (
        <Animated.View
            ref={ref}
            style={[{ alignSelf: 'flex-start' }, style, { width, height }, animatedGeometry, presence]}
            pointerEvents={visible ? 'auto' : 'none'}
            accessibilityElementsHidden={!visible}
            importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
            {...(Platform.OS === 'web' ? { 'aria-hidden': !visible } : {})}
            testID={`${testID}-container`}
        >
            <AnimatedSurface
                mode="elevated"
                elevation={hovered && elevation > 0 ? ((elevation + 1) as 1 | 2 | 3 | 4) : elevation}
                geometry={animatedGeometry}
                style={{ flex: 1, borderRadius: radius, backgroundColor: colors.container }}
            >
                <Animated.View style={[{ flex: 1, overflow: 'hidden', borderRadius: radius }, animatedGeometry]}>
                    <AnimatedTouchableRipple
                        key={visible ? 'visible' : 'hidden'}
                        disabled={!visible}
                        background={background}
                        onPress={(event) => {
                            if (alive.current && interaction.current.visible) interaction.current.onPress?.(event);
                        }}
                        onPressIn={(event) => {
                            if (!alive.current || !interaction.current.visible) return;
                            if (Platform.OS === 'web') setFocused(typeof (event.nativeEvent as { key?: unknown }).key === 'string');
                            onPressIn?.(event);
                        }}
                        onPressOut={onPressOut}
                        onLongPress={
                            onLongPress
                                ? (event) => {
                                      if (alive.current && interaction.current.visible) interaction.current.onLongPress?.(event);
                                  }
                                : undefined
                        }
                        delayLongPress={delayLongPress}
                        onTouchCancel={onTouchCancel}
                        onFocus={(event) => {
                            if (!alive.current || !interaction.current.visible) return;
                            const target = event.currentTarget as unknown as { matches?: (selector: string) => boolean };
                            setFocused(Platform.OS !== 'web' || (target.matches?.(':focus-visible') ?? true));
                            onFocus?.(event);
                        }}
                        onBlur={(event) => {
                            setFocused(false);
                            onBlur?.(event);
                        }}
                        onHoverIn={(event) => {
                            if (!alive.current || !interaction.current.visible) return;
                            setHovered(true);
                            onHoverIn?.(event);
                        }}
                        onHoverOut={(event) => {
                            setHovered(false);
                            onHoverOut?.(event);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={accessibilityLabel}
                        accessibilityState={accessibilityState}
                        {...(Platform.OS === 'web'
                            ? {
                                  'aria-describedby': describedBy,
                                  'aria-expanded': accessibilityState?.expanded,
                                  'aria-busy': accessibilityState?.busy,
                                  'aria-haspopup': hasPopup,
                              }
                            : {})}
                        rippleColor={typeof colors.content === 'string' ? withAlpha(colors.content, 0.1) : theme.colors.stateLayerPressed}
                        style={[{ flex: 1, backgroundColor: 'transparent', borderRadius: radius, overflow: 'hidden' }, animatedGeometry]}
                        testID={testID}
                    >
                        {children}
                    </AnimatedTouchableRipple>
                    {focused || hovered ? (
                        <View
                            pointerEvents="none"
                            style={[StyleSheet.absoluteFill, { backgroundColor: colors.content, opacity: focused ? 0.1 : 0.08 }]}
                        />
                    ) : null}
                </Animated.View>
            </AnimatedSurface>
            {focused && visible ? (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        StyleSheet.absoluteFill,
                        { margin: -5, borderWidth: 3, borderColor: theme.colors.secondary, borderRadius: radius + 5 },
                        animatedFocusGeometry,
                    ]}
                />
            ) : null}
        </Animated.View>
    );
}

function FloatingActionButton({ size = 'default', variant = 'tonalPrimary', theme: overrides, icon, ...props }: FABProps) {
    const theme = useMobileTheme(overrides);
    const spec = fabSizeTokens[size];
    const colors = roleColors(theme, variant, props.containerColor, props.contentColor);
    return (
        <ThemeProvider theme={theme}>
            <PaperMotionBridge>
                <Shell
                    {...props}
                    theme={theme}
                    variant={variant}
                    width={spec.height}
                    height={spec.height}
                    radius={theme.shapes.corner[spec.radius]}
                >
                    <View pointerEvents="none" style={styles.center}>
                        <Icon source={icon} size={spec.icon} color={colors.content} />
                    </View>
                </Shell>
            </PaperMotionBridge>
        </ThemeProvider>
    );
}

function ExtendedFloatingActionButton({
    size = 'default',
    variant = 'tonalPrimary',
    expanded = true,
    label,
    icon,
    labelMaxFontSizeMultiplier,
    theme: overrides,
    accessibilityLabel = label,
    ...props
}: ExtendedFABProps) {
    const theme = useMobileTheme(overrides);
    const { direction } = useLocale();
    const { fontScale } = useWindowDimensions();
    const spec = fabSizeTokens[size];
    const showLabel = expanded || !icon;
    const colors = roleColors(theme, variant, props.containerColor, props.contentColor);
    const key = JSON.stringify([label, fontScale, labelMaxFontSizeMultiplier, theme.fonts[spec.text]]);
    const [measure, setMeasure] = useState({ key: '', width: 0, height: 0 });
    const recordMeasure = (width: number, height: number) => {
        width = Math.ceil(width) + 1;
        height = Math.ceil(height);
        setMeasure((old) => (old.key === key && old.width === width && old.height === height ? old : { key, width, height }));
    };
    const measured = measure.key === key ? measure : { width: 0, height: 0 };
    const expandedWidth = Math.max(spec.height, spec.leading + (icon ? spec.icon + spec.gap : 0) + measured.width + spec.trailing);
    const targetWidth = showLabel ? expandedWidth : spec.height;
    const height = Math.max(spec.height, measured.height + 16);
    const width = useSharedValue(targetWidth);
    const alpha = useSharedValue(Number(showLabel));
    useEffect(() => {
        // Both expansion and collapse use FastSpatial/FastEffects in current Compose.
        width.set(theme.animation.scale === 0 ? targetWidth : withSpring(targetWidth, spring(theme, 'fast', 'spatial')));
        alpha.set(theme.animation.scale === 0 ? Number(showLabel) : withSpring(Number(showLabel), spring(theme, 'fast', 'effects')));
    }, [alpha, showLabel, targetWidth, theme, width]);
    useEffect(
        () => () => {
            cancelAnimation(width);
            cancelAnimation(alpha);
        },
        [alpha, width]
    );
    const geometry = useAnimatedStyle(() => ({ width: Math.max(spec.height, width.get()) }));
    const labelStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, alpha.get())) }));
    const contentPosition = useAnimatedStyle(() => {
        const progress =
            expandedWidth > spec.height ? Math.max(0, Math.min(1, (width.get() - spec.height) / (expandedWidth - spec.height))) : 1;
        // Large uses a 36dp icon with 28dp leading space when extended.
        // Recenter that icon in its 96dp container at the collapsed endpoint.
        const offset = ((spec.height - spec.icon) / 2 - spec.leading) * (1 - progress);
        return { transform: [{ translateX: direction === 'rtl' ? -offset : offset }] };
    });
    return (
        <ThemeProvider theme={theme}>
            <PaperMotionBridge>
                <Shell
                    {...props}
                    theme={theme}
                    variant={variant}
                    accessibilityLabel={accessibilityLabel}
                    width={targetWidth}
                    height={height}
                    radius={theme.shapes.corner[spec.radius]}
                    animatedGeometry={geometry}
                >
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            {
                                position: 'absolute',
                                [direction === 'rtl' ? 'right' : 'left']: 0,
                                width: expandedWidth,
                                minHeight: height,
                                direction: 'ltr',
                                flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                                alignItems: 'center',
                                paddingHorizontal: spec.leading,
                                gap: spec.gap,
                            },
                            contentPosition,
                        ]}
                    >
                        {icon ? <Icon source={icon} size={spec.icon} color={colors.content} /> : null}
                        <Animated.View style={labelStyle}>
                            <Text
                                numberOfLines={1}
                                maxFontSizeMultiplier={labelMaxFontSizeMultiplier}
                                variant={spec.text}
                                style={{ color: colors.content, writingDirection: direction }}
                            >
                                {label}
                            </Text>
                        </Animated.View>
                    </Animated.View>
                </Shell>
                <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                    pointerEvents="none"
                    style={styles.measure}
                >
                    <Text
                        key={key}
                        numberOfLines={1}
                        maxFontSizeMultiplier={labelMaxFontSizeMultiplier}
                        variant={spec.text}
                        // RN Web has no onTextLayout; its layout observer measures
                        // the same hidden text again after font/label changes.
                        onLayout={
                            Platform.OS === 'web'
                                ? (event) => recordMeasure(event.nativeEvent.layout.width, event.nativeEvent.layout.height)
                                : undefined
                        }
                        onTextLayout={
                            Platform.OS !== 'web'
                                ? (event) =>
                                      recordMeasure(
                                          Math.max(0, ...event.nativeEvent.lines.map((line) => line.width)),
                                          Math.max(0, ...event.nativeEvent.lines.map((line) => line.height))
                                      )
                                : undefined
                        }
                    >
                        {label}
                    </Text>
                </View>
            </PaperMotionBridge>
        </ThemeProvider>
    );
}

function MenuItem({
    item,
    index,
    count,
    revealCount,
    expanded,
    theme,
    variant,
    maxWidth,
    onPress,
    testID,
}: {
    item: FABMenuItemProps;
    index: number;
    count: number;
    revealCount: SharedValue<number>;
    expanded: boolean;
    theme: MobileDesignTheme;
    variant: FABVariant;
    maxWidth: number;
    onPress: (event: GestureResponderEvent) => void;
    testID: string;
}) {
    const { direction } = useLocale();
    const { fontScale } = useWindowDimensions();
    const colors = roleColors(theme, variant);
    const disabled = Boolean(item.disabled || (item.items && !item.items.length));
    const [width, setWidth] = useState(56);
    const [height, setHeight] = useState(56);
    const [focused, setFocused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const widthFraction = useSharedValue(theme.animation.scale === 0 ? Number(expanded) : 0);
    const alpha = useSharedValue(theme.animation.scale === 0 ? Number(expanded) : 0);
    useAnimatedReaction(
        () => index >= count - Math.round(revealCount.get()),
        (shown, before) => {
            if (shown === before) return;
            widthFraction.set(theme.animation.scale === 0 ? Number(shown) : withSpring(Number(shown), spring(theme, 'fast', 'spatial')));
            alpha.set(theme.animation.scale === 0 ? Number(shown) : withSpring(Number(shown), spring(theme, 'fast', 'effects')));
        }
    );
    useEffect(() => {
        if (theme.animation.scale === 0) {
            cancelAnimation(widthFraction);
            cancelAnimation(alpha);
            widthFraction.set(Number(expanded));
            alpha.set(Number(expanded));
        }
    }, [alpha, expanded, theme.animation.scale, widthFraction]);
    useEffect(
        () => () => {
            cancelAnimation(widthFraction);
            cancelAnimation(alpha);
        },
        [alpha, widthFraction]
    );
    const naturalWidth = Math.max(56, Math.min(maxWidth, width));
    const geometry = useAnimatedStyle(() => ({ width: naturalWidth * Math.max(0, widthFraction.get()) }));
    const fade = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, alpha.get())) }));
    const contentOffset = useAnimatedStyle(() => {
        const remaining = naturalWidth * (widthFraction.get() - 1);
        const physicalEnd = direction !== 'rtl';
        return { transform: [{ translateX: physicalEnd ? remaining : 0 }] };
    });
    return (
        <View
            style={{
                alignSelf: direction !== 'rtl' ? 'flex-end' : 'flex-start',
                minHeight: height,
            }}
            pointerEvents={expanded && !disabled ? 'auto' : 'none'}
            accessibilityElementsHidden={!expanded}
            importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
        >
            <AnimatedSurface
                mode="flat"
                elevation={0}
                style={[
                    {
                        minHeight: height,
                        borderRadius: height / 2,
                        backgroundColor: colors.container,
                        outlineStyle: 'solid',
                        outlineColor: theme.colors.secondary,
                        outlineWidth: focused && !disabled ? 3 : 0,
                        outlineOffset: 2,
                    },
                    fade,
                ]}
                geometry={geometry}
            >
                <Animated.View style={{ minHeight: height, overflow: 'hidden', borderRadius: height / 2 }}>
                    <Animated.View style={[{ width: naturalWidth }, contentOffset]}>
                        <TouchableRipple
                            accessibilityRole="button"
                            accessibilityLabel={item.accessibilityLabel ?? item.label}
                            accessibilityHint={item.items ? 'Abre más opciones dentro de este menú' : undefined}
                            accessibilityState={{ disabled, ...(item.items ? { expanded: false } : {}) }}
                            {...(Platform.OS === 'web'
                                ? { 'aria-disabled': disabled, ...(item.items ? { 'aria-expanded': false } : {}) }
                                : {})}
                            disabled={disabled || !expanded}
                            onPress={onPress}
                            onFocus={(event) => {
                                const target = event.currentTarget as unknown as { matches?: (selector: string) => boolean };
                                setFocused(Platform.OS !== 'web' || (target.matches?.(':focus-visible') ?? true));
                            }}
                            onPressIn={(event) => {
                                if (Platform.OS === 'web') setFocused(typeof (event.nativeEvent as { key?: unknown }).key === 'string');
                            }}
                            onBlur={() => setFocused(false)}
                            onHoverIn={() => setHovered(true)}
                            onHoverOut={() => setHovered(false)}
                            rippleColor={
                                typeof colors.content === 'string' ? withAlpha(colors.content, 0.1) : theme.colors.stateLayerPressed
                            }
                            style={{ backgroundColor: 'transparent' }}
                            testID={item.testID ?? testID}
                        >
                            <View
                                pointerEvents="none"
                                style={{
                                    minHeight: height,
                                    paddingHorizontal: 24,
                                    paddingVertical: 8,
                                    direction: 'ltr',
                                    flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                                    gap: 8,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: disabled ? 0.38 : 1,
                                }}
                            >
                                {item.icon ? <Icon source={item.icon} size={24} color={colors.content} /> : null}
                                <Text variant="titleMedium" style={{ color: colors.content, flexShrink: 1, writingDirection: direction }}>
                                    {item.label}
                                </Text>
                            </View>
                        </TouchableRipple>
                        {(focused || hovered) && !disabled ? (
                            <View
                                pointerEvents="none"
                                style={[StyleSheet.absoluteFill, { backgroundColor: colors.content, opacity: focused ? 0.1 : 0.08 }]}
                            />
                        ) : null}
                    </Animated.View>
                </Animated.View>
            </AnimatedSurface>
            <View
                key={JSON.stringify([item.label, fontScale, maxWidth, theme.fonts.titleMedium])}
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                style={[styles.measure, { maxWidth: Math.max(1, maxWidth - 48 - (item.icon ? 32 : 0)) }]}
            >
                <Text
                    variant="titleMedium"
                    onLayout={
                        Platform.OS === 'web'
                            ? (event) => {
                                  setWidth(Math.ceil(event.nativeEvent.layout.width) + 49 + (item.icon ? 32 : 0));
                                  setHeight(Math.max(56, Math.ceil(event.nativeEvent.layout.height) + 16));
                              }
                            : undefined
                    }
                    onTextLayout={
                        Platform.OS !== 'web'
                            ? (event) => {
                                  setWidth(
                                      Math.ceil(Math.max(0, ...event.nativeEvent.lines.map((line) => line.width))) +
                                          49 +
                                          (item.icon ? 32 : 0)
                                  );
                                  setHeight(
                                      Math.max(56, Math.ceil(event.nativeEvent.lines.reduce((sum, line) => sum + line.height, 0)) + 16)
                                  );
                              }
                            : undefined
                    }
                >
                    {item.label}
                </Text>
            </View>
        </View>
    );
}

function NativeFloatingActionButtonMenu({
    scrollIndicators,
    expanded,
    onDismiss,
    trigger,
    closeIcon = 'close',
    closeAccessibilityLabel = 'Cerrar menú',
    items,
    overflow,
    maxHeight: requestedMaxHeight,
    backLabel = 'Volver',
    backAccessibilityLabel = backLabel,
    scrollUpAccessibilityLabel = 'Ver opciones anteriores',
    scrollDownAccessibilityLabel = 'Ver opciones siguientes',
    theme: overrides,
    testID = 'mobile-fab-menu',
}: FABMenuProps) {
    const theme = useMobileTheme(overrides);
    const { direction } = useLocale();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const [bounds, setBounds] = useState({ width: window.width, height: window.height });
    const [path, setPath] = useState<string[]>([]);
    const level = resolveFABMenuPath(items, path);
    const levelKey = JSON.stringify(level.path);
    const extension = overflow === 'scroll' || requestedMaxHeight != null || items.some((item) => item.items);
    const [backHeight, setBackHeight] = useState(56);
    const mounted = useRef(true);
    const actionInFlight = useRef(false);
    const navigationPending = useRef(false);
    const dismissRequested = useRef(false);
    const scrollRef = useRef<ComponentRef<typeof ScrollView> | null>(null);
    const scrollBounds = useRef({ contentHeight: 0, viewportHeight: 0 });
    const [overflows, setOverflows] = useState(false);
    const resetScroll = useRef(false);
    const previousLevel = useRef(levelKey);
    const scrollOffset = useSharedValue(0);
    const visible = trigger.visible !== false;
    const open = expanded && visible;
    const wasOpen = useRef(open);
    const focusWasOpen = useRef(open);
    const focusScope = useRef<ComponentRef<typeof View>>(null);
    useLayoutEffect(() => {
        const returning = focusWasOpen.current && !open;
        focusWasOpen.current = open;
        if (Platform.OS !== 'web' || !returning) return;
        const scope = focusScope.current as unknown as HTMLElement | null;
        if (scope && (document.activeElement === document.body || scope.contains(document.activeElement)))
            scope.querySelector<HTMLElement>('button,[role="button"]')?.focus({ preventScroll: true });
    }, [open]);
    const interaction = useRef({ open, levelKey, path: level.path, items: level.items });
    const spec = fabSizeTokens[trigger.size ?? 'default'];
    const margin = window.width >= 1200 ? 24 : 16;
    const viewport = fabMenuViewport({
        width: Math.min(window.width, bounds.width),
        height: Math.min(window.height, bounds.height),
        insets,
        margin,
        triggerHeight: spec.height,
        maxHeight: requestedMaxHeight,
    });
    const hasBack = level.path.length > 0;
    // Keep Back fixed while a full action still fits; tiny landscape viewports
    // scroll it with the other pills instead of painting beyond the safe bounds.
    const stickyBack = hasBack && viewport.height >= backHeight + 4 + 56;
    useEffect(() => {
        setBackHeight(56);
    }, [window.fontScale, viewport.width]);
    const dismiss = () => {
        if (!mounted.current || !interaction.current.open || dismissRequested.current) return;
        dismissRequested.current = true;
        onDismiss();
    };
    const back = () => {
        if (!mounted.current || !interaction.current.open || dismissRequested.current || navigationPending.current) return;
        if (interaction.current.path.length) {
            navigationPending.current = true;
            setPath(interaction.current.path.slice(0, -1));
        } else dismiss();
    };
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    useLayoutEffect(() => {
        interaction.current = { open, levelKey, path: level.path, items: level.items };
        if (open && !wasOpen.current) setPath([]);
        wasOpen.current = open;
        if (open) {
            actionInFlight.current = false;
            dismissRequested.current = false;
        }
    }, [open]);
    useEffect(() => {
        if (!open) {
            resetScroll.current = false;
        } else if (JSON.stringify(path) !== levelKey) setPath(level.path);
    }, [open, levelKey]);
    useLayoutEffect(() => {
        interaction.current = { open, levelKey, path: level.path, items: level.items };
        navigationPending.current = false;
    });
    useEffect(() => {
        if (!open) return;
        resetScroll.current = true;
        scrollRef.current?.scrollToEnd({ animated: false });
    }, [open, levelKey]);
    useEffect(() => {
        if (Platform.OS !== 'web' || !open) return;
        const scope = focusScope.current as unknown as HTMLElement | null;
        const releaseScroll = () => {
            resetScroll.current = false;
        };
        scope?.addEventListener('wheel', releaseScroll, { passive: true });
        return () => scope?.removeEventListener('wheel', releaseScroll);
    }, [open]);
    const measureScroll = (key: keyof typeof scrollBounds.current, height: number) => {
        const metrics = scrollBounds.current;
        metrics[key] = height;
        setOverflows(metrics.contentHeight > metrics.viewportHeight + 1);
        if (open && resetScroll.current) scrollRef.current?.scrollToEnd({ animated: false });
    };
    const onScroll = useAnimatedScrollHandler((event) => {
        scrollOffset.set(Math.max(0, event.contentOffset.y));
    });
    const scrollBy = (direction: -1 | 1) => {
        if (!mounted.current || !interaction.current.open || dismissRequested.current) return;
        resetScroll.current = false;
        const scroll = scrollRef.current;
        const element = Platform.OS === 'web' ? (scroll?.getScrollableNode() as unknown as HTMLElement | undefined) : undefined;
        const height = element?.clientHeight ?? scrollBounds.current.viewportHeight;
        const contentHeight = element?.scrollHeight ?? scrollBounds.current.contentHeight;
        const offset = element?.scrollTop ?? scrollOffset.get();
        const page = Math.max(56, height * 0.8);
        const maximum = Math.max(0, contentHeight - height);
        scroll?.scrollTo({
            y: Math.max(0, Math.min(maximum, offset + direction * page)),
            animated: theme.animation.scale !== 0,
        });
    };
    const triggerVariant = trigger.variant ?? 'tonalPrimary';
    const family = triggerVariant.toLowerCase().includes('secondary')
        ? 'secondary'
        : triggerVariant.toLowerCase().includes('tertiary')
          ? 'tertiary'
          : 'primary';
    const itemsVariant = ({ primary: 'tonalPrimary', secondary: 'tonalSecondary', tertiary: 'tonalTertiary' } as const)[family];
    const initialColors = roleColors(theme, triggerVariant, trigger.containerColor, trigger.contentColor);
    const closeColors = roleColors(theme, family);
    const morph = useSharedValue(Number(open));
    const revealCount = useSharedValue(open ? level.items.length : 0);
    useEffect(() => {
        cancelAnimation(morph);
        cancelAnimation(revealCount);
        if (open && previousLevel.current !== levelKey) revealCount.set(0);
        previousLevel.current = levelKey;
        morph.set(theme.animation.scale === 0 ? Number(open) : withSpring(Number(open), spring(theme, 'fast', 'spatial')));
        // Compose's stagger is one SlowEffects integer count, not fixed per-item delays.
        revealCount.set(
            theme.animation.scale === 0
                ? open
                    ? level.items.length
                    : 0
                : withSpring(open ? level.items.length : 0, spring(theme, 'slow', 'effects'))
        );
        return () => {
            cancelAnimation(morph);
            cancelAnimation(revealCount);
        };
    }, [level.items.length, levelKey, morph, open, revealCount, theme]);
    useEffect(() => {
        if (!open) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            back();
            return true;
        });
        return () => subscription.remove();
    }, [onDismiss, open, levelKey]);
    const radius = theme.shapes.corner[spec.radius];
    const geometry = useAnimatedStyle(() => {
        const progress = morph.get();
        return {
            width: spec.height + (56 - spec.height) * progress,
            height: spec.height + (56 - spec.height) * progress,
            borderRadius: radius + (28 - radius) * progress,
        };
    });
    const initialPlane = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, 1 - morph.get())) }));
    const focusGeometry = useAnimatedStyle(() => ({ borderRadius: radius + (28 - radius) * morph.get() + 5 }));
    const closePlane = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, morph.get())) }));
    const physicalEnd = direction !== 'rtl';
    const maxWidth = Math.max(56, viewport.width);
    const activate = (item: FABMenuItemProps, index: number, event: GestureResponderEvent) => {
        const current = interaction.current;
        if (!current.open || !mounted.current || current.levelKey !== levelKey || dismissRequested.current || navigationPending.current)
            return;
        const liveItem = current.items.find((candidate, candidateIndex) => itemKey(candidate, candidateIndex) === itemKey(item, index));
        if (!liveItem || liveItem.disabled) return;
        if (liveItem.items) {
            if (liveItem.items.length) {
                navigationPending.current = true;
                setPath([...current.path, itemKey(liveItem, current.items.indexOf(liveItem))]);
            }
            return;
        }
        if (actionInFlight.current) return;
        actionInFlight.current = true;
        try {
            liveItem.onPress(event);
        } finally {
            dismiss();
        }
    };
    return (
        <ThemeProvider theme={theme}>
            <PaperMotionBridge>
                <View
                    pointerEvents="box-none"
                    onAccessibilityEscape={back}
                    ref={focusScope}
                    {...(Platform.OS === 'web'
                        ? {
                              onKeyDown: (event: unknown) => {
                                  const key = event as { key?: string; preventDefault?: () => void };
                                  if (!open) return;
                                  if (key.key === 'Escape') {
                                      key.preventDefault?.();
                                      back();
                                  } else if (overflows && (key.key === 'PageUp' || key.key === 'PageDown')) {
                                      key.preventDefault?.();
                                      scrollBy(key.key === 'PageUp' ? -1 : 1);
                                  }
                              },
                          }
                        : {})}
                    onLayout={(event) => setBounds(event.nativeEvent.layout)}
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            paddingTop: insets.top + (extension ? margin : 0),
                            paddingLeft: insets.left + margin,
                            paddingRight: insets.right + margin,
                            paddingBottom: insets.bottom + margin,
                            justifyContent: 'flex-end',
                            // Geometry below uses physical edges; avoid a second
                            // CSS mirroring pass when the web parent is RTL.
                            ...(Platform.OS === 'web' ? { direction: 'ltr' as const } : {}),
                        },
                    ]}
                    testID={testID}
                >
                    <View pointerEvents="box-none" style={{ flex: 1, alignItems: physicalEnd ? 'flex-end' : 'flex-start' }}>
                        {/* Keep the focused close FAB first in keyboard and assistive navigation order. */}
                        <View
                            pointerEvents="box-none"
                            style={{
                                position: 'absolute',
                                zIndex: 1,
                                bottom: 0,
                                width: spec.height,
                                height: spec.height,
                                alignSelf: physicalEnd ? 'flex-end' : 'flex-start',
                            }}
                        >
                            <Shell
                                {...trigger}
                                theme={theme}
                                variant={open ? family : triggerVariant}
                                width={spec.height}
                                height={spec.height}
                                radius={open ? 28 : radius}
                                visible={visible}
                                animatedGeometry={geometry}
                                animatedFocusGeometry={focusGeometry}
                                style={{ alignSelf: physicalEnd ? 'flex-end' : 'flex-start' }}
                                accessibilityLabel={open ? closeAccessibilityLabel : trigger.accessibilityLabel}
                                accessibilityState={{ ...trigger.accessibilityState, expanded: open }}
                                onPress={open ? dismiss : trigger.onPress}
                                testID={trigger.testID ?? `${testID}-trigger`}
                            >
                                <View pointerEvents="none" style={styles.center}>
                                    <Animated.View
                                        style={[StyleSheet.absoluteFill, { backgroundColor: initialColors.container }, initialPlane]}
                                    />
                                    <Animated.View
                                        style={[StyleSheet.absoluteFill, { backgroundColor: closeColors.container }, closePlane]}
                                    />
                                    <Animated.View style={[styles.iconPlane, initialPlane]}>
                                        <Icon source={trigger.icon} size={spec.icon} color={initialColors.content} />
                                    </Animated.View>
                                    <Animated.View style={[styles.iconPlane, closePlane]}>
                                        <Icon source={closeIcon} size={20} color={closeColors.content} />
                                    </Animated.View>
                                </View>
                            </Shell>
                        </View>
                        {/* Five extra dp carry the external focus ring without moving the items' trailing edge. */}
                        <Animated.View
                            pointerEvents={open ? 'box-none' : 'none'}
                            accessibilityElementsHidden={!open}
                            importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
                            {...(Platform.OS === 'web' ? { 'aria-hidden': !open } : {})}
                            style={{
                                position: 'absolute',
                                ...(extension ? { bottom: spec.height + 8, height: viewport.height } : { top: 0, bottom: 0 }),
                                width: maxWidth + 10,
                                [physicalEnd ? 'right' : 'left']: -5,
                            }}
                        >
                            <AnimatedMenuScrollView
                                ref={scrollRef}
                                // Android's native scroll handler rejects box-none.
                                // A scrollable stack must own drag gestures on its background too.
                                pointerEvents={extension || overflows ? 'auto' : 'box-none'}
                                {...getScrollIndicatorProps(scrollIndicators)}
                                scrollEnabled={open}
                                style={extension ? { flex: 1 } : undefined}
                                onScroll={onScroll}
                                scrollEventThrottle={16}
                                onScrollBeginDrag={() => {
                                    resetScroll.current = false;
                                }}
                                onTouchStart={() => {
                                    resetScroll.current = false;
                                }}
                                onLayout={(event) => measureScroll('viewportHeight', event.nativeEvent.layout.height)}
                                onContentSizeChange={(_, height) => measureScroll('contentHeight', height)}
                                accessibilityLabel={`${level.title || 'Menú de acciones'}: ${level.items.length} opciones`}
                                accessibilityActions={
                                    extension || overflows
                                        ? [
                                              { name: 'scrollBackward', label: scrollUpAccessibilityLabel },
                                              { name: 'scrollForward', label: scrollDownAccessibilityLabel },
                                          ]
                                        : undefined
                                }
                                onAccessibilityAction={(event) => {
                                    if (!open) return;
                                    if (event.nativeEvent.actionName === 'scrollBackward') scrollBy(-1);
                                    if (event.nativeEvent.actionName === 'scrollForward') scrollBy(1);
                                }}
                                testID={`${testID}-scroll`}
                                contentContainerStyle={{
                                    flexGrow: 1,
                                    justifyContent: 'flex-end',
                                    gap: 4,
                                    paddingTop: 6,
                                    paddingBottom: extension ? 6 : spec.height + 8,
                                    paddingHorizontal: 5,
                                }}
                            >
                                {level.items.map((item, index) => (
                                    <MenuItem
                                        key={`${levelKey}-${itemKey(item, index)}`}
                                        item={item}
                                        index={index}
                                        count={level.items.length}
                                        revealCount={revealCount}
                                        expanded={open}
                                        theme={theme}
                                        variant={itemsVariant}
                                        maxWidth={maxWidth}
                                        onPress={(event) => activate(item, index, event)}
                                        testID={`${testID}-item-${index}`}
                                    />
                                ))}
                                {hasBack && !stickyBack ? (
                                    <MenuItem
                                        item={{
                                            key: '__back',
                                            icon: direction === 'rtl' ? 'arrow_forward' : 'arrow_back',
                                            label: backLabel,
                                            accessibilityLabel: backAccessibilityLabel,
                                            onPress: back,
                                        }}
                                        index={level.items.length - 1}
                                        count={level.items.length}
                                        revealCount={revealCount}
                                        expanded={open}
                                        theme={theme}
                                        variant={itemsVariant}
                                        maxWidth={maxWidth}
                                        onPress={back}
                                        testID={`${testID}-back`}
                                    />
                                ) : null}
                            </AnimatedMenuScrollView>
                            {stickyBack ? (
                                <View
                                    style={{ paddingTop: 4, paddingHorizontal: 5 }}
                                    onLayout={(event) => setBackHeight(Math.max(56, event.nativeEvent.layout.height - 4))}
                                >
                                    <MenuItem
                                        item={{
                                            key: '__back',
                                            icon: direction === 'rtl' ? 'arrow_forward' : 'arrow_back',
                                            label: backLabel,
                                            accessibilityLabel: backAccessibilityLabel,
                                            onPress: back,
                                        }}
                                        index={0}
                                        count={1}
                                        revealCount={revealCount}
                                        expanded={open}
                                        theme={theme}
                                        variant={itemsVariant}
                                        maxWidth={maxWidth}
                                        onPress={back}
                                        testID={`${testID}-back`}
                                    />
                                </View>
                            ) : null}
                        </Animated.View>
                    </View>
                </View>
            </PaperMotionBridge>
        </ThemeProvider>
    );
}

function WebFloatingActionButtonMenu({
    scrollIndicators,
    expanded,
    onDismiss,
    trigger,
    items,
    theme: overrides,
    testID = 'mobile-fab-menu',
}: FABMenuProps) {
    const theme = useMobileTheme(overrides);
    const { direction } = useLocale();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const margin = window.width >= 1200 ? 24 : 16;
    const physicalEnd = direction !== 'rtl';
    const actionInFlight = useRef(false);
    useLayoutEffect(() => {
        if (expanded) actionInFlight.current = false;
    }, [expanded]);
    return (
        <ThemeProvider theme={theme}>
            <PaperMotionBridge>
                <View
                    pointerEvents="box-none"
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            padding: margin,
                            paddingBottom: insets.bottom + margin,
                            justifyContent: 'flex-end',
                            alignItems: physicalEnd ? 'flex-end' : 'flex-start',
                            direction: 'ltr',
                        },
                    ]}
                    testID={testID}
                >
                    <Menu
                        scrollIndicators={scrollIndicators}
                        variant="baseline"
                        anchorGap={4}
                        anchorStyle={{ alignSelf: physicalEnd ? 'flex-end' : 'flex-start' }}
                        visible={expanded && trigger.visible !== false}
                        onDismiss={onDismiss}
                        anchor={
                            <FloatingActionButton
                                {...trigger}
                                aria-haspopup="menu"
                                accessibilityState={{ ...trigger.accessibilityState, expanded }}
                            />
                        }
                    >
                        {items.map((item, index) => (
                            <Menu.Item
                                key={`${index}-${item.label}`}
                                title={item.label}
                                leadingIcon={item.icon}
                                disabled={item.disabled}
                                accessibilityLabel={item.accessibilityLabel ?? item.label}
                                closeOnPress={false}
                                onPress={(event) => {
                                    if (item.disabled || !item.onPress || actionInFlight.current) return;
                                    actionInFlight.current = true;
                                    try {
                                        item.onPress(event);
                                    } finally {
                                        onDismiss();
                                    }
                                }}
                                testID={item.testID ?? `${testID}-item-${index}`}
                            />
                        ))}
                    </Menu>
                </View>
            </PaperMotionBridge>
        </ThemeProvider>
    );
}

function FloatingActionButtonMenu(props: FABMenuProps) {
    // M3 specifies an anchored baseline menu for web, rather than the native pill stack.
    // Explicit local extensions use the inline stack on web too; no modal is created.
    const extended = props.overflow === 'scroll' || props.maxHeight != null || props.items.some((item) => item.items);
    return Platform.OS === 'web' && props.presentation !== 'expressive' && !extended ? (
        <WebFloatingActionButtonMenu {...props} />
    ) : (
        <NativeFloatingActionButtonMenu {...props} />
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    iconPlane: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
    measure: { position: 'absolute', opacity: 0, alignSelf: 'flex-start', pointerEvents: 'none' },
});
export const FAB = Object.assign(FloatingActionButton, { Extended: ExtendedFloatingActionButton, Menu: FloatingActionButtonMenu });
export const ExtendedFAB = ExtendedFloatingActionButton;
export const FABMenu = FloatingActionButtonMenu;
