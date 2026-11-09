import { TouchableRipple } from '../ripple';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, Surface, useLocale, useTheme, type Theme } from 'react-native-paper';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NavigationDestination } from './navigation';
import { BadgedBox } from './content';
import { withAlpha } from '../color';
import { usePressScope } from './press-scope';
import { Text } from '../typography';
import { useNavigationFocus, type NavigationFocusEvent } from './navigation-focus';

/** Reveal the pill from the icon's center while keeping its vertical geometry. */
export function navigationSelectionFrame(left: number, width: number, iconCenter: number, progress: number) {
    'worklet';
    const amount = Math.max(0, Math.min(1, progress));
    return { left: left + iconCenter * (1 - amount), width: width * amount, opacity: amount };
}

/** AndroidX NavigationItem uses DefaultSpatial; the standard tall bar uses FastSpatial. */
export function useNavigationSelection(selected: boolean, speed: 'default' | 'fast' = 'default') {
    const theme = useTheme<Theme>();
    const progress = useSharedValue(selected ? 1 : 0);
    useEffect(() => {
        const spring = theme.motion.spring[speed].spatial;
        progress.set(
            theme.animation.scale === 0
                ? Number(selected)
                : withSpring(Number(selected), {
                      stiffness: spring.stiffness,
                      damping: 2 * spring.damping * Math.sqrt(spring.stiffness),
                      mass: 1,
                      reduceMotion: ReduceMotion.Never,
                  })
        );
    }, [progress, selected, speed, theme]);
    useEffect(() => () => cancelAnimation(progress), [progress]);
    return progress;
}

export type NavigationBarProps = {
    items: readonly NavigationDestination[];
    value: string;
    onValueChange: (key: string) => void;
    /** Standard tall bar is80dp; the expressive short bar is64dp. */
    variant?: 'standard' | 'short';
    iconPosition?: 'top' | 'start';
    arrangement?: 'equal' | 'centered';
    /** Label configuration, including the icon-only specimens in Badge specs. */
    labelVisibility?: 'all' | 'selected' | 'none';
    safeArea?: boolean;
    leading?: ReactNode;
    trailing?: ReactNode;
    accessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

/** Destination state is controlled; route panels and navigation remain caller-owned. */
export function NavigationBar({
    items,
    value,
    onValueChange,
    variant = 'short',
    iconPosition = 'top',
    arrangement = variant === 'short' && iconPosition === 'start' ? 'centered' : 'equal',
    labelVisibility = 'all',
    safeArea = true,
    leading,
    trailing,
    accessibilityLabel,
    style,
    testID = 'mobile-navigation-bar',
}: NavigationBarProps) {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const rtl = useLocale().direction === 'rtl';
    const focus = useNavigationFocus(items);
    return (
        <Surface
            mode="flat"
            elevation={variant === 'standard' ? 2 : 0}
            style={[
                {
                    backgroundColor: variant === 'standard' ? theme.colors.surface : theme.colors.surfaceContainer,
                    paddingBottom: safeArea ? insets.bottom : 0,
                    paddingLeft: safeArea ? insets.left : 0,
                    paddingRight: safeArea ? insets.right : 0,
                },
                style,
            ]}
            testID={testID}
        >
            <View
                {...(Platform.OS === 'web' ? { role: 'tablist' as const, 'aria-orientation': 'horizontal' as const } : {})}
                accessibilityLabel={accessibilityLabel}
                style={{
                    minHeight: variant === 'standard' ? 80 : 64,
                    direction: 'ltr',
                    flexDirection: rtl ? 'row-reverse' : 'row',
                    alignItems: 'stretch',
                    justifyContent: 'center',
                }}
            >
                {leading}
                {items.map((item) => (
                    <NavigationBarItem
                        key={item.key}
                        item={item}
                        selected={item.key === value}
                        onPress={() => onValueChange(item.key)}
                        horizontal={variant === 'short' && iconPosition === 'start'}
                        tall={variant === 'standard'}
                        labelVisible={labelVisibility === 'all' || (labelVisibility === 'selected' && item.key === value)}
                        centered={arrangement === 'centered'}
                        focusRef={focus.refFor(item.key)}
                        onKeyDown={(event) => {
                            const key = event.nativeEvent?.key ?? event.key;
                            const logicalKey = key === 'ArrowRight' ? (rtl ? 'ArrowUp' : 'ArrowDown') : key === 'ArrowLeft' ? (rtl ? 'ArrowDown' : 'ArrowUp') : key;
                            // Keep Tab's normal traversal; arrows move focus only.
                            if (key === 'ArrowUp' || key === 'ArrowDown') return;
                            focus.onKeyDown(item.key, {
                                ...event,
                                nativeEvent: { key: logicalKey },
                                preventDefault: () => event.preventDefault?.(),
                            });
                        }}
                        testID={item.testID ?? `${testID}-${item.key}`}
                    />
                ))}
                {trailing}
            </View>
        </Surface>
    );
}

function NavigationBarItem({
    item,
    selected,
    onPress,
    horizontal,
    tall,
    labelVisible,
    centered,
    focusRef,
    onKeyDown,
    testID,
}: {
    item: NavigationDestination;
    selected: boolean;
    onPress: () => void;
    horizontal: boolean;
    tall: boolean;
    labelVisible: boolean;
    centered: boolean;
    focusRef: (target: unknown) => void;
    onKeyDown: (event: NavigationFocusEvent) => void;
    testID: string;
}) {
    const theme = useTheme<Theme>();
    const rtl = useLocale().direction === 'rtl';
    const { fontScale } = useWindowDimensions();
    const progress = useNavigationSelection(selected, tall ? 'fast' : 'default');
    const canPress = usePressScope(Boolean(item.disabled), item.key);
    const [hovered, setHovered] = useState(false),
        [focused, setFocused] = useState(false);
    const [labelHeight, setLabelHeight] = useState((theme.fonts.labelMedium.lineHeight ?? 16) * fontScale);
    const [target, setTarget] = useState({ width: 0, height: 64 });
    const verticalPillWidth = tall ? 64 : 56;
    const [pill, setPill] = useState({ x: 0, y: 0, width: verticalPillWidth, height: 32 });
    const [contentOrigin, setContentOrigin] = useState({ x: 0, y: 0 });
    useEffect(() => {
        if (item.disabled) {
            setHovered(false);
            setFocused(false);
        }
    }, [item.disabled]);
    const inline = horizontal && labelVisible;
    const ink = selected ? theme.colors.onSecondaryContainer : theme.colors.onSurface;
    const pillX = contentOrigin.x + pill.x;
    const pillY = contentOrigin.y + pill.y;
    const stateLayer =
        !item.disabled && (hovered || focused) ? (
            <View
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: inline ? 20 : 16,
                    backgroundColor: selected ? theme.colors.onSecondaryContainer : theme.colors.onSurface,
                    opacity: focused ? 0.1 : 0.08,
                }}
            />
        ) : null;
    const indicator = useAnimatedStyle(() => {
        const width = inline ? pill.width : verticalPillWidth;
        const iconCenter = inline ? (rtl ? width - 28 : 28) : width / 2;
        return navigationSelectionFrame(0, width, iconCenter, progress.get());
    });
    const iconColor = selected ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant;
    const labelColor = selected
        ? tall
            ? theme.colors.onSurface
            : horizontal
              ? theme.colors.onSecondaryContainer
              : theme.colors.secondary
        : theme.colors.onSurfaceVariant;
    const glyph = (
        <BadgedBox badge={item.badge} style={{ width: 24, height: 24, flexShrink: 0 }}>
            <Icon source={selected ? (item.selectedIcon ?? item.icon) : item.icon} size={24} color={iconColor} />
        </BadgedBox>
    );
    const label = (
        <Text
            numberOfLines={fontScale > 1 ? 2 : 1}
            onLayout={(event) => setLabelHeight(event.nativeEvent.layout.height)}
            variant={selected ? 'labelMediumEmphasized' : 'labelMedium'}
            testID={`${testID}-label`}
            style={{
                color: labelColor,
                flexShrink: 1,
                writingDirection: rtl ? 'rtl' : 'ltr',
                textAlign: horizontal ? (rtl ? 'right' : 'left') : 'center',
            }}
        >
            {item.label}
        </Text>
    );
    return (
        <View
            onLayout={(event) => setTarget(event.nativeEvent.layout)}
            style={{
                ...(centered ? { width: inline ? 120 : 80, maxWidth: 200, flexShrink: 1 } : { flex: 1 }),
                minWidth: 48,
                minHeight: Math.max(tall ? 80 : 64, labelVisible && !inline ? (tall ? 54 : 48) + labelHeight : 0),
                opacity: item.disabled ? 0.38 : 1,
            }}
        >
            <View
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: tall && labelVisible ? 'flex-start' : 'center',
                    paddingTop: tall && labelVisible ? 12 : 6,
                    paddingBottom: 6,
                    paddingHorizontal: inline ? 4 : 0,
                    gap: labelVisible ? 4 : 0,
                }}
            >
                <TouchableRipple
                    ref={focusRef}
                    key={item.disabled ? 'inactive' : 'interactive'}
                    accessibilityRole="tab"
                    accessibilityState={{ selected, disabled: item.disabled }}
                    {...(Platform.OS === 'web' ? { 'aria-selected': selected, 'aria-disabled': Boolean(item.disabled), onKeyDown } : {})}
                    accessibilityLabel={
                        item.accessibilityLabel ??
                        `${item.label}${item.badge === true ? ', novedades' : typeof item.badge === 'number' || typeof item.badge === 'string' ? `, ${item.badge}` : ''}`
                    }
                    disabled={item.disabled}
                    onPress={() => {
                        if (canPress()) onPress();
                    }}
                    onPressIn={(event) => {
                        if (Platform.OS === 'web' && !(event.nativeEvent as { key?: string }).key) setFocused(false);
                    }}
                    onHoverIn={() => setHovered(true)}
                    onHoverOut={() => setHovered(false)}
                    onFocus={(event) =>
                        setFocused(
                            Platform.OS !== 'web' || Boolean((event.currentTarget as unknown as HTMLElement)?.matches?.(':focus-visible'))
                        )
                    }
                    onBlur={() => setFocused(false)}
                    hitSlop={{
                        top: pillY,
                        left: pillX,
                        right: Math.max(0, target.width - pillX - pill.width),
                        bottom: Math.max(0, target.height - pillY - pill.height),
                    }}
                    rippleColor={typeof ink === 'string' ? withAlpha(ink, 0.1) : theme.colors.stateLayerPressed}
                    {...(Platform.OS === 'web'
                        ? { dataSet: { mobileDesignHitTarget: 'true', mobileDesignRippleRadius: inline ? '20' : '16' } }
                        : {})}
                    style={{
                        position: 'absolute',
                        left: pillX,
                        top: pillY,
                        width: pill.width,
                        height: pill.height,
                        borderRadius: inline ? 20 : 16,
                        overflow: 'hidden',
                        ...(Platform.OS === 'web'
                            ? {
                                  backgroundColor: 'transparent',
                                  borderRadius: 0,
                                  overflow: 'visible',
                                  left: 0,
                                  top: 0,
                                  width: target.width,
                                  height: target.height,
                                  paddingLeft: pillX,
                                  paddingTop: pillY,
                                  paddingRight: Math.max(0, target.width - pillX - pill.width),
                                  paddingBottom: Math.max(0, target.height - pillY - pill.height),
                              }
                            : {}),
                        zIndex: 1,
                    }}
                    testID={testID}
                >
                    <View />
                </TouchableRipple>
                <View
                    onLayout={(event) => setContentOrigin(event.nativeEvent.layout)}
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                    pointerEvents="none"
                    style={{
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: tall && labelVisible ? 'flex-start' : 'center',
                        paddingTop: 0,
                        gap: labelVisible ? 4 : 0,
                    }}
                >
                    {inline ? (
                        <View
                            onLayout={(event) => setPill(event.nativeEvent.layout)}
                            style={{
                                minHeight: 40,
                                paddingLeft: rtl ? 20 : 16,
                                paddingRight: rtl ? 16 : 20,
                                paddingVertical: 8,
                                flexDirection: rtl ? 'row-reverse' : 'row',
                                direction: 'ltr',
                                gap: 4,
                                alignItems: 'center',
                                borderRadius: 20,
                                maxWidth: '100%',
                            }}
                        >
                            <Animated.View
                                testID={`${testID}-indicator`}
                                style={[
                                    {
                                        position: 'absolute',
                                        top: 0,
                                        bottom: 0,
                                        borderRadius: 20,
                                        backgroundColor: theme.colors.secondaryContainer,
                                    },
                                    indicator,
                                ]}
                            />
                            {stateLayer}
                            {glyph}
                            {label}
                        </View>
                    ) : (
                        <>
                            <View
                                onLayout={(event) => setPill(event.nativeEvent.layout)}
                                style={{ width: verticalPillWidth, height: 32, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Animated.View
                                    testID={`${testID}-indicator`}
                                    style={[
                                        {
                                            position: 'absolute',
                                            height: 32,
                                            borderRadius: 16,
                                            backgroundColor: theme.colors.secondaryContainer,
                                        },
                                        indicator,
                                    ]}
                                />
                                {stateLayer}
                                {glyph}
                            </View>
                            {labelVisible ? label : null}
                        </>
                    )}
                </View>
            </View>
        </View>
    );
}
