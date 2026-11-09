import type { ScrollIndicatorOptions } from '../scroll-indicators';
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, Text, useLocale, useTheme, type Theme } from 'react-native-paper';
import { TouchableRipple } from '../ripple';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { withAlpha } from '../color';
import { AnimatedActionSurface as AnimatedSurface } from './action-surface';
import { Menu } from './menu';
import { usePressScope } from './press-scope';

// The indication host clips its own animated corners; ancestors stay visible
// so a 32/40dp half can retain its complete 48dp interaction target.
const AnimatedTouchableRipple = Animated.createAnimatedComponent(TouchableRipple);

type SplitIcon = ComponentProps<typeof Icon>['source'];
export type SplitButtonAction = {
    key: string;
    label: string;
    onPress: () => void;
    icon?: SplitIcon;
    disabled?: boolean;
    /** Set true or false on each choice in a menu that displays the current value. Omit for commands. */
    selected?: boolean;
    testID?: string;
};
export type SplitButtonProps = {
    /** Scrollbars are opt-in for this component only; both axes are hidden by default. */
    scrollIndicators?: ScrollIndicatorOptions;
    label: string;
    onPress: () => void;
    icon?: SplitIcon;
    actions: readonly SplitButtonAction[];
    variant?: 'filled' | 'tonal' | 'outlined' | 'elevated';
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
    disabled?: boolean;
    expanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
    menuAccessibilityLabel?: string;
    primaryAccessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

// AndroidX SplitButton{XSmall,Small,Medium,Large,XLarge}Tokens, version18_0_18.
// https://github.com/androidx/androidx/tree/d153d87ed76372ece0c99dac837ff07ab845d495/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens
const sizes = {
    'extra-small': {
        height: 32,
        icon: 22,
        leadingIcon: 20,
        gap: 4,
        leading: 12,
        trailing: 10,
        iconPadding: 13,
        inner: 'extraSmall',
        pressed: 'small',
        type: 'labelLarge',
    },
    small: {
        height: 40,
        icon: 22,
        leadingIcon: 20,
        gap: 8,
        leading: 16,
        trailing: 12,
        iconPadding: 13,
        inner: 'extraSmall',
        pressed: 'medium',
        type: 'labelLarge',
    },
    medium: {
        height: 56,
        icon: 26,
        leadingIcon: 24,
        gap: 8,
        leading: 24,
        trailing: 24,
        iconPadding: 15,
        inner: 'extraSmall',
        pressed: 'medium',
        type: 'titleMedium',
    },
    large: {
        height: 96,
        icon: 38,
        leadingIcon: 32,
        gap: 12,
        leading: 48,
        trailing: 48,
        iconPadding: 29,
        inner: 'small',
        pressed: 'largeIncreased',
        type: 'headlineSmall',
    },
    'extra-large': {
        height: 136,
        icon: 50,
        leadingIcon: 40,
        gap: 16,
        leading: 64,
        trailing: 64,
        iconPadding: 43,
        inner: 'medium',
        pressed: 'largeIncreased',
        type: 'headlineLarge',
    },
} as const;

function Half({
    trailing = false,
    label,
    icon,
    size,
    variant,
    expanded,
    disabled,
    onPress,
    accessibilityLabel,
    testID,
}: {
    trailing?: boolean;
    label?: string;
    icon?: SplitIcon;
    size: NonNullable<SplitButtonProps['size']>;
    variant: NonNullable<SplitButtonProps['variant']>;
    expanded: boolean;
    disabled: boolean;
    onPress: () => void;
    accessibilityLabel?: string;
    testID: string;
}) {
    const theme = useTheme<Theme>();
    const { direction } = useLocale();
    const reduced = theme.animation.scale === 0;
    const spec = sizes[size];
    const [height, setHeight] = useState<number>(spec.height);
    const [focused, setFocused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [pressActive, setPressActive] = useState(false);
    const canPress = usePressScope(disabled);
    const pressed = useSharedValue(0);
    const checked = useSharedValue(Number(expanded));
    // SplitButton's shape/checked progress uses AndroidX DefaultEffects, not spatial bounce.
    const spring = theme.motion.spring.default.effects;
    const springConfig = {
        stiffness: spring.stiffness,
        damping: spring.damping * 2 * Math.sqrt(spring.stiffness),
        mass: 1,
        overshootClamping: true,
        reduceMotion: ReduceMotion.Never,
    };
    const setPressed = (down: boolean) => {
        const target = Number(down || (!expanded && (focused || hovered)));
        pressed.set(reduced ? target : withSpring(target, springConfig));
    };
    useEffect(() => {
        checked.set(reduced ? Number(expanded) : withSpring(Number(expanded), springConfig));
    }, [expanded, reduced, theme.motion, checked]);
    useEffect(() => () => cancelAnimation(checked), [checked]);
    useEffect(() => {
        if (disabled || reduced) {
            cancelAnimation(pressed);
            pressed.set(0);
        }
        if (disabled) {
            setPressActive(false);
            setFocused(false);
            setHovered(false);
        }
        return () => cancelAnimation(pressed);
    }, [disabled, pressed, reduced]);
    useEffect(() => {
        if (disabled) return;
        const target = Number(!expanded && (focused || hovered));
        pressed.set(reduced ? target : withSpring(target, springConfig));
    }, [disabled, expanded, focused, hovered, reduced, theme.motion, pressed]);
    const animatedShape = useAnimatedStyle(() => {
        const full = Math.max(spec.height, height) / 2;
        const defaultInner = theme.shapes.corner[spec.inner];
        const checkedInner = defaultInner + (full - defaultInner) * (trailing ? checked.get() : 0);
        const inner = checkedInner + (theme.shapes.corner[spec.pressed] - checkedInner) * pressed.get();
        const start = trailing ? inner : full;
        const end = trailing ? full : inner;
        return {
            borderTopLeftRadius: direction === 'rtl' ? end : start,
            borderBottomLeftRadius: direction === 'rtl' ? end : start,
            borderTopRightRadius: direction === 'rtl' ? start : end,
            borderBottomRightRadius: direction === 'rtl' ? start : end,
        };
    });
    // Exact M3 measurement: trailing glyph shifts to the optical center until selected.
    const opticalOffset = ({ 'extra-small': 1, small: 1, medium: 2, large: 3, 'extra-large': 6 } as const)[size];
    const iconRotation = useAnimatedStyle(() => ({
        transform: [
            { translateX: trailing ? (direction === 'rtl' ? 1 : -1) * opticalOffset * (1 - checked.get()) : 0 },
            { rotate: `${trailing ? checked.get() * 180 * (direction === 'rtl' ? -1 : 1) : 0}deg` },
        ],
    }));
    const background =
        variant === 'filled'
            ? theme.colors.primary
            : variant === 'tonal'
              ? theme.colors.secondaryContainer
              : variant === 'elevated'
                ? theme.colors.surfaceContainerLow
                : 'transparent';
    const foreground =
        variant === 'filled'
            ? theme.colors.onPrimary
            : variant === 'tonal'
              ? theme.colors.onSecondaryContainer
              : variant === 'outlined'
                ? theme.colors.onSurfaceVariant
                : theme.colors.primary;
    const disabledForeground = theme.colors.onSurface;
    return (
        <AnimatedSurface
            elevation={!disabled && variant === 'elevated' ? 1 : 0}
            mode="elevated"
            style={[
                {
                    // The row reserves the 48dp target via its leading half.
                    // Keep the menu's anchor at the trailing visual surface so
                    // its 4dp gap is measured from the drawing, not hit padding.
                    marginVertical: trailing ? 0 : Math.max(0, (48 - spec.height) / 2),
                    backgroundColor: disabled ? 'transparent' : background,
                    flexShrink: trailing ? 0 : 1,
                    outlineColor: theme.colors.secondary,
                    outlineStyle: 'solid',
                    outlineWidth: focused && !disabled ? 3 : 0,
                    outlineOffset: 2,
                },
            ]}
            geometry={animatedShape}
        >
            <Animated.View style={animatedShape}>
                {variant === 'outlined' ? (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            {
                                position: 'absolute',
                                inset: 0,
                                borderWidth: 1,
                                borderColor: theme.colors.outlineVariant,
                            },
                            animatedShape,
                        ]}
                    />
                ) : null}
                {disabled && variant !== 'outlined' ? (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            {
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: theme.colors.onSurface,
                                opacity: 0.1,
                            },
                            animatedShape,
                        ]}
                    />
                ) : null}
                {(focused || hovered || (trailing && expanded)) && !disabled && !pressActive ? (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            {
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: foreground,
                                opacity: focused || (trailing && expanded) ? 0.1 : 0.08,
                            },
                            animatedShape,
                        ]}
                    />
                ) : null}
                <AnimatedTouchableRipple
                    key={disabled ? 'inactive' : 'interactive'}
                    accessibilityLabel={accessibilityLabel ?? label}
                    accessibilityRole="button"
                    accessibilityState={{ disabled, ...(trailing ? { expanded } : {}) }}
                    {...(Platform.OS === 'web'
                        ? {
                              'aria-disabled': disabled,
                              ...(trailing ? { 'aria-expanded': expanded, 'aria-haspopup': 'menu' as const } : {}),
                              dataSet: { mobileDesignHitTarget: 'true' },
                          }
                        : {})}
                    disabled={disabled}
                    hitSlop={{ top: Math.max(0, (48 - spec.height) / 2), bottom: Math.max(0, (48 - spec.height) / 2) }}
                    onBlur={() => {
                        setFocused(false);
                        setPressActive(false);
                        setPressed(false);
                    }}
                    onFocus={(event) => {
                        if (!canPress()) return;
                        const target = event.currentTarget as unknown as { matches?: (selector: string) => boolean };
                        setFocused(Platform.OS !== 'web' || (target.matches?.(':focus-visible') ?? true));
                    }}
                    onHoverIn={() => {
                        if (canPress()) setHovered(true);
                    }}
                    onHoverOut={() => setHovered(false)}
                    onPress={
                        disabled
                            ? undefined
                            : () => {
                                  if (canPress()) onPress();
                              }
                    }
                    onPressIn={(event) => {
                        if (!canPress()) return;
                        if (Platform.OS === 'web') setFocused(typeof (event.nativeEvent as { key?: unknown }).key === 'string');
                        setPressActive(true);
                        setPressed(true);
                    }}
                    onPressOut={() => {
                        setPressActive(false);
                        setPressed(false);
                    }}
                    onTouchCancel={() => {
                        setPressActive(false);
                        setPressed(false);
                    }}
                    rippleColor={typeof foreground === 'string' ? withAlpha(foreground, 0.1) : theme.colors.stateLayerPressed}
                    style={[
                        {
                            minHeight: spec.height,
                            justifyContent: 'center',
                            backgroundColor: 'transparent',
                            overflow: Platform.OS === 'web' ? 'visible' : 'hidden',
                        },
                        Platform.OS === 'web'
                            ? { paddingVertical: Math.max(0, (48 - spec.height) / 2), marginVertical: -Math.max(0, (48 - spec.height) / 2) }
                            : undefined,
                        animatedShape,
                    ]}
                    testID={testID}
                >
                    <View
                        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
                        pointerEvents="none"
                        style={{
                            minHeight: spec.height,
                            minWidth: 48,
                            direction: 'ltr',
                            flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: spec.gap,
                            paddingLeft: trailing ? spec.iconPadding : direction === 'rtl' ? spec.trailing : spec.leading,
                            paddingRight: trailing ? spec.iconPadding : direction === 'rtl' ? spec.leading : spec.trailing,
                            paddingVertical: 4,
                            opacity: disabled ? 0.38 : 1,
                        }}
                    >
                        {icon ? (
                            <Animated.View style={iconRotation}>
                                <Icon
                                    color={disabled ? disabledForeground : foreground}
                                    size={trailing ? spec.icon : spec.leadingIcon}
                                    source={icon}
                                />
                            </Animated.View>
                        ) : null}
                        {label ? (
                            <Text
                                numberOfLines={1}
                                style={{ color: disabled ? disabledForeground : foreground, flexShrink: 1, writingDirection: direction }}
                                variant={spec.type}
                            >
                                {label}
                            </Text>
                        ) : null}
                    </View>
                </AnimatedTouchableRipple>
            </Animated.View>
        </AnimatedSurface>
    );
}

/** Independent primary action plus bounded Paper Menu; the trailing control never runs the primary. */
export function SplitButton({
    scrollIndicators,
    label,
    onPress,
    icon,
    actions,
    variant = 'filled',
    size = 'small',
    disabled = false,
    expanded,
    onExpandedChange,
    menuAccessibilityLabel = 'Más acciones',
    primaryAccessibilityLabel,
    style,
    testID = 'mobile-split-button',
}: SplitButtonProps) {
    const { direction } = useLocale();
    const [internalExpanded, setInternalExpanded] = useState(false);
    const visible = !disabled && actions.length > 0 && (expanded ?? internalExpanded);
    const mounted = useRef(true);
    const actionRequested = useRef(false);
    const pendingAction = useRef<string | null>(null);
    const current = useRef({ disabled, visible, actions, onPress });
    current.current = { disabled, visible, actions, onPress };
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            pendingAction.current = null;
        };
    }, []);
    const setExpanded = (next: boolean) => {
        if (expanded === undefined) setInternalExpanded(next);
        onExpandedChange?.(next);
    };
    useEffect(() => {
        if ((disabled || actions.length === 0) && (expanded ?? internalExpanded)) setExpanded(false);
    }, [disabled, actions.length, expanded, internalExpanded]);
    useLayoutEffect(() => {
        actionRequested.current = false;
        // An interrupted exit cannot deliver an action in a subsequent menu session.
        if (disabled || visible) pendingAction.current = null;
    }, [disabled, visible]);
    return (
        <View
            style={[
                {
                    direction: 'ltr',
                    flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 2,
                    alignSelf: 'flex-start',
                    maxWidth: '100%',
                },
                style,
            ]}
            testID={testID}
        >
            <Half
                label={label}
                icon={icon}
                size={size}
                variant={variant}
                expanded={false}
                disabled={disabled}
                onPress={() => {
                    if (mounted.current && !current.current.disabled) current.current.onPress();
                }}
                accessibilityLabel={primaryAccessibilityLabel ?? label}
                testID={`${testID}-primary`}
            />
            <Menu
                scrollIndicators={scrollIndicators}
                visible={visible}
                onDismiss={() => {
                    pendingAction.current = null;
                    setExpanded(false);
                }}
                onClosed={() => {
                    const key = pendingAction.current;
                    pendingAction.current = null;
                    const action = current.current.actions.find((item) => item.key === key);
                    if (mounted.current && !current.current.visible && !current.current.disabled && action && !action.disabled)
                        action.onPress();
                }}
                anchorPosition="bottom"
                // Popup anchors default to flex-start. Center this visual
                // anchor beside the leading half's larger interaction row.
                anchorStyle={{ alignSelf: 'center' }}
                anchorGap={4}
                anchor={
                    <Half
                        trailing
                        icon="chevron-down"
                        size={size}
                        variant={variant}
                        expanded={visible}
                        disabled={disabled || actions.length === 0}
                        onPress={() => {
                            if (mounted.current && !current.current.disabled && current.current.actions.length)
                                setExpanded(!current.current.visible);
                        }}
                        accessibilityLabel={menuAccessibilityLabel}
                        testID={`${testID}-toggle`}
                    />
                }
                testID={`${testID}-menu`}
            >
                {actions.map((action) => (
                    <Menu.Item
                        key={action.key}
                        title={action.label}
                        leadingIcon={action.icon}
                        disabled={action.disabled}
                        selected={action.selected}
                        selectionMode={action.selected === undefined ? undefined : 'single'}
                        closeOnPress={false}
                        onPress={() => {
                            const liveAction = current.current.actions.find((item) => item.key === action.key);
                            if (
                                !mounted.current ||
                                actionRequested.current ||
                                current.current.disabled ||
                                !current.current.visible ||
                                !liveAction ||
                                liveAction.disabled
                            )
                                return;
                            actionRequested.current = true;
                            pendingAction.current = liveAction.key;
                            setExpanded(false);
                        }}
                        testID={action.testID ?? `${testID}-${action.key}`}
                    />
                ))}
            </Menu>
        </View>
    );
}
