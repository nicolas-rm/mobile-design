import { badgeTokens } from '@mobile-design/tokens';
import { webAccessibility } from '../web-accessibility';
import {
    Children,
    createContext,
    cloneElement,
    isValidElement,
    useEffect,
    useLayoutEffect,
    useContext,
    useRef,
    useId,
    useMemo,
    useState,
    type ComponentProps,
    type ComponentRef,
    type ComponentType,
    type Ref,
    type ReactNode,
} from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle, type ViewInstance } from 'react-native';
import {
    Badge as PaperBadge,
    List as PaperList,
    Text,
    Surface,
    Icon,
    useLocale,
    type BadgeProps as PaperBadgeProps,
    type ChipProps as PaperChipProps,
    type DividerProps as PaperDividerProps,
} from 'react-native-paper';
import { TouchableRipple } from '../ripple';
import Animated, {
    LinearTransition,
    FadeIn,
    FadeOut,
    ReduceMotion,
    useAnimatedStyle,
    useSharedValue,
    cancelAnimation,
    withSpring,
    withTiming,
    interpolateColor,
} from 'react-native-reanimated';
import { useMobileTheme } from '../core';
import { withAlpha } from '../color';
import { orderFocusTargets } from './focus-order';
import { ListCollection, ListFocusContext } from './list-focus';
import { usePressScope } from './press-scope';
export { ListCollection, type ListCollectionProps } from './list-focus';

type Position = 'first' | 'middle' | 'last' | 'only';
const ExpandedListContext = createContext(false);
const ListSelectionContext = createContext<'single' | 'multiple' | undefined>(undefined);
// RN Web accepts listbox; React Native's shared Role declaration omits it.
const ListGroupView = View as ComponentType<Omit<ComponentProps<typeof View>, 'role'> & { role?: 'listbox' }>;
const springConfig = (spring: { stiffness: number; damping: number }) => ({
    stiffness: spring.stiffness,
    damping: 2 * spring.damping * Math.sqrt(spring.stiffness),
    reduceMotion: ReduceMotion.Never,
});

export type BadgeProps = PaperBadgeProps & {
    variant?: 'dot' | 'large';
    /** Numeric counts only. Normalized to an integer in0…999 to fit four characters including+. */
    maximum?: number;
};
/** BadgeTokens: 6dp dot,16dp label, LabelSmall/Error/OnError. */
export function Badge({
    children,
    variant = children == null ? 'dot' : 'large',
    maximum = 999,
    size,
    style,
    visible = true,
    accessibilityElementsHidden,
    importantForAccessibility,
    ...props
}: BadgeProps) {
    const theme = useMobileTheme(props.theme);
    const dot = variant === 'dot';
    const limit = Number.isFinite(maximum)
        ? Math.max(0, Math.min(badgeTokens.maximumCount, Math.floor(maximum)))
        : badgeTokens.maximumCount;
    const count = typeof children === 'number' && children > limit ? `${limit}+` : children;
    const characters = typeof count === 'string' || typeof count === 'number' ? Array.from(String(count)) : null;
    const content =
        characters && characters.length > badgeTokens.maximumCharacters
            ? `${characters.slice(0, badgeTokens.maximumCharacters - 1).join('')}+`
            : count;
    const diameter = size ?? (dot ? badgeTokens.smallSize : badgeTokens.largeMinSize);
    return (
        <PaperBadge
            {...props}
            visible={visible}
            size={diameter}
            accessibilityElementsHidden={!visible || accessibilityElementsHidden}
            importantForAccessibility={!visible ? 'no-hide-descendants' : importantForAccessibility}
            {...(Platform.OS === 'web' ? { 'aria-hidden': !visible || accessibilityElementsHidden || props['aria-hidden'] } : {})}
            style={[
                theme.fonts.labelSmall,
                {
                    color: theme.colors.onError,
                    backgroundColor: theme.colors.error,
                    // Large badges have a minimum height, not a fixed text crop. Native Text
                    // grows with Dynamic Type; the anchor below keeps its bottom overlap.
                    height: dot ? diameter : undefined,
                    minHeight: diameter,
                    minWidth: diameter,
                    borderRadius: dot ? diameter / 2 : 9999,
                    includeFontPadding: false,
                    paddingHorizontal: dot ? 0 : badgeTokens.largePadding,
                },
                style,
            ]}
        >
            {dot ? undefined : content}
        </PaperBadge>
    );
}

export type BadgedBoxProps = {
    children: ReactNode;
    badge?: boolean | string | number;
    maximum?: number;
    style?: StyleProp<ViewStyle>;
    badgeContainerStyle?: ComponentProps<typeof Animated.View>['style'];
    onBadgeLayout?: ComponentProps<typeof Animated.View>['onLayout'];
    testID?: string;
};
/** Badge.kt: logical start is anchorEnd−6/12; bottom is anchorTop+6/14. */
export function BadgedBox({ children, badge, maximum = 999, style, badgeContainerStyle, onBadgeLayout, testID = 'mobile-badged-box' }: BadgedBoxProps) {
    const { direction } = useLocale();
    const [anchor, setAnchor] = useState({ width: 0, height: 0 });
    const dot = typeof badge === 'boolean';
    const visible = badge !== undefined && badge !== false;
    return (
        <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]} testID={testID}>
            <View
                collapsable={false}
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setAnchor((previous) => (previous.width === width && previous.height === height ? previous : { width, height }));
                }}
                style={{ position: 'relative', flexDirection: 'row', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}
                testID={`${testID}-anchor`}
            >
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>
                {/* Fabric's legacy Yoga errata can resolve a percentage against the
                available ancestor width rather than this intrinsic anchor.
                A row anchor also lets its absolute badge measure at intrinsic
                width: Yoga constrains absolute text to the owner in a column. */}
                {visible && anchor.width > 0 ? (
                    <Animated.View
                        onLayout={onBadgeLayout}
                        pointerEvents="none"
                        accessible={false}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                        style={[
                            {
                                position: 'absolute',
                                bottom: anchor.height - (dot ? badgeTokens.smallAnchorBottom : badgeTokens.largeAnchorBottom),
                                [direction === 'rtl' ? 'right' : 'left']:
                                    anchor.width - (dot ? badgeTokens.smallAnchorStartOffset : badgeTokens.largeAnchorStartOffset),
                            },
                            badgeContainerStyle,
                        ]}
                        testID={`${testID}-badge`}
                        {...webAccessibility({ role: undefined, state: undefined, value: undefined, hidden: true })}
                    >
                        <Badge variant={dot ? 'dot' : 'large'} maximum={maximum}>
                            {dot ? undefined : badge}
                        </Badge>
                    </Animated.View>
                ) : null}
            </View>
        </View>
    );
}

type ChipFocusGroup = {
    register: (id: string, focus: () => void, disabled: () => boolean, node: () => unknown) => () => void;
    focused: (id: string) => void;
    move: (id: string, offset: number, boundary?: 'first' | 'last') => void;
};
const ChipGroupContext = createContext<ChipFocusGroup | null>(null);
export type ChipProps = Omit<PaperChipProps, 'style' | 'ref' | 'compact' | 'showSelectedOverlay'> &
    Pick<ComponentProps<typeof Pressable>, 'onFocus' | 'onBlur' | 'onHoverIn' | 'onHoverOut'> & {
        ref?: Ref<ComponentRef<typeof View>>;
        /** The visible32dp surface, separate from the outer48dp interaction target. */
        containerRef?: Ref<ComponentRef<typeof View>>;
        variant?: 'assist' | 'filter' | 'input' | 'suggestion';
        style?: StyleProp<ViewStyle>;
        dragged?: boolean;
        /** Keep the state layer visible while an attached menu is open. */
        pressed?: boolean;
        /** Filter chips may open a menu from a trailing icon. Give the whole chip the same action in compact layouts. */
        trailingIcon?: ComponentProps<typeof Icon>['source'];
        onTrailingIconPress?: () => void;
        trailingIconAccessibilityLabel?: string;
    };
/** The four M3 chip families have distinct icon/label/disabled roles, not merely distinct names. */
function ChipRoot({
    variant = 'assist',
    selected = false,
    disabled = false,
    icon,
    avatar,
    children,
    onClose,
    closeIcon = 'close',
    closeIconAccessibilityLabel = 'Quitar',
    trailingIcon,
    onTrailingIconPress,
    trailingIconAccessibilityLabel,
    onPress,
    onPressIn,
    onPressOut,
    onFocus,
    onBlur,
    onHoverIn,
    onHoverOut,
    onLongPress,
    delayLongPress,
    showSelectedCheck = variant === 'filter',
    selectedColor,
    elevated = false,
    mode,
    textStyle,
    style,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    accessibilityActions,
    onAccessibilityAction,
    testID = 'chip',
    maxFontSizeMultiplier,
    ellipsizeMode,
    hitSlop,
    dragged = false,
    pressed: suppliedPressed = false,
    theme: override,
    ref,
    containerRef,
    ...props
}: ChipProps) {
    const theme = useMobileTheme(override);
    const { direction } = useLocale();
    const group = useContext(ChipGroupContext);
    const focusId = useId();
    const canPress = usePressScope(disabled);
    const focusTarget = useRef<ComponentRef<typeof View>>(null);
    const removeOnly = Boolean(onClose && !onPress && !onLongPress);
    const primaryAction = onPress ?? (removeOnly ? onClose : undefined);
    const touch = disabled || (!primaryAction && !onLongPress);
    const role = accessibilityRole ?? (variant === 'filter' ? 'checkbox' : 'button');
    const disabledRef = useRef(touch);
    disabledRef.current = touch;
    const spacePressed = useRef(false);
    useEffect(
        () =>
            group?.register(
                focusId,
                () => focusTarget.current?.focus(),
                () => disabledRef.current,
                () => focusTarget.current
            ),
        [group, focusId]
    );
    const [hovered, setHovered] = useState(false),
        [focused, setFocused] = useState(false),
        [ownPressed, setPressed] = useState(false);
    const pressed = ownPressed || suppliedPressed;
    const reduced = theme.animation.scale === 0;
    const stateOpacity = dragged ? 0.16 : suppliedPressed ? 0.1 : ownPressed ? (reduced ? 0.1 : 0) : focused ? 0.1 : hovered ? 0.08 : 0;
    const [inkBounds, setInkBounds] = useState({ width: 48, height: 32 });
    const [inkOrigin, setInkOrigin] = useState({ x: 24, y: 16, radius: 48 });
    const inkScale = useSharedValue(0),
        inkAlpha = useSharedValue(0);
    useEffect(
        () => () => {
            cancelAnimation(inkScale);
            cancelAnimation(inkAlpha);
        },
        [inkAlpha, inkScale]
    );
    useEffect(() => {
        if (disabled || theme.animation.scale === 0) {
            cancelAnimation(inkScale);
            cancelAnimation(inkAlpha);
            inkScale.set(1);
            inkAlpha.set(0);
            if (disabled) {
                spacePressed.current = false;
                setPressed(false);
                setHovered(false);
                setFocused(false);
            }
        }
    }, [disabled, inkAlpha, inkScale, theme.animation.scale]);
    const inkStyle = useAnimatedStyle(() => ({
        opacity: dragged || suppliedPressed ? 0 : Math.max(0, Math.min(0.1, inkAlpha.get())),
        transform: [{ scale: Math.max(0, inkScale.get()) }],
    }));
    const isSelected = selected && (variant === 'filter' || variant === 'input');
    const leadingSource = isSelected && showSelectedCheck ? 'check' : icon;
    const ink = disabled
        ? theme.colors.onSurface
        : (selectedColor ??
          (isSelected ? theme.colors.onSecondaryContainer : variant === 'assist' ? theme.colors.onSurface : theme.colors.onSurfaceVariant));
    const leadingInk = disabled
        ? theme.colors.onSurface
        : (selectedColor ??
          (variant === 'input'
              ? dragged && isSelected
                  ? theme.colors.onSecondaryContainer
                  : isSelected || hovered || focused || pressed
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
              : isSelected
                ? theme.colors.onSecondaryContainer
                : theme.colors.primary));
    const trailingInk = disabled ? theme.colors.onSurface : variant === 'input' && dragged ? theme.colors.primary : ink;
    const endIcon = onClose ? closeIcon : trailingIcon;
    const endAction = onClose ?? onTrailingIconPress;
    const stroke = !elevated && !isSelected && mode !== 'flat';
    const flattened = StyleSheet.flatten(style);
    const fill =
        flattened?.backgroundColor ??
        (isSelected ? theme.colors.secondaryContainer : elevated ? theme.colors.surfaceContainerLow : 'transparent');
    const radius = flattened?.borderRadius ?? 8;
    const iconProgress = useSharedValue(leadingSource || avatar ? 1 : 0);
    const iconOpacity = useSharedValue(leadingSource || avatar ? 1 : 0);
    useEffect(() => {
        const to = leadingSource || avatar ? 1 : 0;
        const sizeMotion = to ? theme.motion.spring.fast.spatial : theme.motion.spring.default.effects;
        const fadeMotion = to ? theme.motion.spring.slow.effects : theme.motion.spring.fast.effects;
        iconProgress.set(disabled || theme.animation.scale === 0 ? to : withSpring(to, springConfig(sizeMotion)));
        iconOpacity.set(disabled || theme.animation.scale === 0 ? to : withSpring(to, springConfig(fadeMotion)));
        return () => {
            cancelAnimation(iconProgress);
            cancelAnimation(iconOpacity);
        };
    }, [avatar, disabled, iconOpacity, iconProgress, leadingSource, theme]);
    const leadingStyle = useAnimatedStyle(() => ({
        width: (avatar ? 24 : 18) * Math.max(0, iconProgress.get()),
        marginLeft: direction === 'rtl' ? 8 * Math.max(0, iconProgress.get()) : 0,
        marginRight: direction === 'rtl' ? 0 : 8 * Math.max(0, iconProgress.get()),
        opacity: Math.max(0, Math.min(1, iconOpacity.get())) * (disabled ? 0.38 : 1),
    }));
    const beginPress: NonNullable<ComponentProps<typeof Pressable>['onPressIn']> = (event) => {
        setPressed(true);
        const { locationX, locationY } = event.nativeEvent;
        const x = Number.isFinite(locationX) ? Math.max(0, Math.min(inkBounds.width, locationX)) : inkBounds.width / 2;
        const y = Number.isFinite(locationY)
            ? Math.max(0, Math.min(inkBounds.height, locationY - Math.max(0, (48 - inkBounds.height) / 2)))
            : inkBounds.height / 2;
        setInkOrigin({ x, y, radius: Math.hypot(Math.max(x, inkBounds.width - x), Math.max(y, inkBounds.height - y)) });
        cancelAnimation(inkScale);
        cancelAnimation(inkAlpha);
        inkScale.set(0);
        inkAlpha.set(reduced ? 0 : 0.1);
        if (!reduced) {
            inkScale.set(withTiming(1, { duration: theme.motion.duration.medium2, reduceMotion: ReduceMotion.Never }));
        }
        onPressIn?.(event);
    };
    const endPress: NonNullable<ComponentProps<typeof Pressable>['onPressOut']> = (event) => {
        setPressed(false);
        inkAlpha.set(reduced ? 0 : withTiming(0, { duration: theme.motion.duration.short4, reduceMotion: ReduceMotion.Never }));
        onPressOut?.(event);
    };
    type KeyEvent = Parameters<NonNullable<ComponentProps<typeof Pressable>['onKeyDown']>>[0];
    const keyboard =
        Platform.OS === 'web'
            ? {
                  onKeyDown: (event: KeyEvent) => {
                      const { key } = event.nativeEvent;
                      if (!canPress()) return;
                      if (role === 'checkbox' && primaryAction && (key === ' ' || key === 'Spacebar')) {
                          event.preventDefault();
                          event.stopPropagation();
                          if (spacePressed.current) return;
                          spacePressed.current = true;
                          setFocused(true);
                          beginPress(event as unknown as Parameters<typeof beginPress>[0]);
                      } else if (variant === 'input' && onClose && (key === 'Backspace' || key === 'Delete')) {
                          event.preventDefault();
                          event.stopPropagation();
                          if ((event.nativeEvent as { repeat?: boolean }).repeat) return;
                          group?.move(focusId, 1);
                          onClose();
                      }
                  },
                  onKeyUp: (event: KeyEvent) => {
                      const { key } = event.nativeEvent;
                      if (!spacePressed.current || (key !== ' ' && key !== 'Spacebar')) return;
                      spacePressed.current = false;
                      event.preventDefault();
                      event.stopPropagation();
                      const press = event as unknown as Parameters<typeof endPress>[0];
                      endPress(press);
                      if (canPress()) primaryAction?.(press);
                  },
              }
            : {};
    return (
        <View
            ref={ref}
            style={[
                {
                    minHeight: 48,
                    direction: 'ltr',
                    minWidth: endIcon ? 88 : 48,
                    maxWidth: '100%',
                    justifyContent: 'center',
                    alignSelf: 'flex-start',
                    paddingLeft: endIcon && direction === 'rtl' ? 8 : 0,
                    paddingRight: endIcon && direction !== 'rtl' ? 8 : 0,
                },
                style,
            ]}
        >
            <Pressable
                key={disabled ? 'primary-inactive' : 'primary-interactive'}
                {...keyboard}
                ref={focusTarget}
                accessible={Boolean(primaryAction || onLongPress)}
                disabled={touch}
                accessibilityRole={role}
                accessibilityState={{ ...accessibilityState, disabled, ...(variant === 'filter' ? { checked: selected } : { selected }) }}
                accessibilityLabel={
                    accessibilityLabel ??
                    (removeOnly && typeof children === 'string' ? `${closeIconAccessibilityLabel} ${children}` : undefined)
                }
                accessibilityActions={accessibilityActions}
                onAccessibilityAction={onAccessibilityAction}
                onPress={
                    primaryAction
                        ? (event) => {
                              if (canPress()) primaryAction(event);
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
                delayLongPress={delayLongPress}
                onPressIn={beginPress}
                onPressOut={endPress}
                onFocus={(event) => {
                    const target = event.currentTarget as unknown as HTMLElement;
                    setFocused(Platform.OS !== 'web' || target?.matches?.(':focus-visible') !== false);
                    group?.focused(focusId);
                    onFocus?.(event);
                }}
                onBlur={(event) => {
                    spacePressed.current = false;
                    setFocused(false);
                    setPressed(false);
                    cancelAnimation(inkAlpha);
                    inkAlpha.set(0);
                    onBlur?.(event);
                }}
                onHoverIn={(event) => {
                    setHovered(true);
                    onHoverIn?.(event);
                }}
                onHoverOut={(event) => {
                    setHovered(false);
                    onHoverOut?.(event);
                }}
                hitSlop={hitSlop}
                style={{ minHeight: 48, minWidth: 48, justifyContent: 'center' }}
                testID={testID}
                {...webAccessibility({
                    role,
                    state: { ...accessibilityState, disabled, ...(variant === 'filter' ? { checked: selected } : { selected }) },
                    value: undefined,
                    hidden: undefined,
                })}
            >
                <Surface
                    elevation={
                        disabled ? 0 : dragged ? 4 : elevated ? (hovered ? 2 : 1) : variant === 'filter' && isSelected && hovered ? 1 : 0
                    }
                    style={{ borderRadius: radius, backgroundColor: disabled ? 'transparent' : fill }}
                >
                    {disabled && (isSelected || elevated) ? (
                        <View
                            pointerEvents="none"
                            style={[
                                StyleSheet.absoluteFill,
                                { borderRadius: radius, backgroundColor: theme.colors.onSurface, opacity: 0.12 },
                            ]}
                        />
                    ) : null}
                    {stroke ? (
                        <View
                            pointerEvents="none"
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    borderRadius: radius,
                                    borderWidth: 1,
                                    borderColor: disabled
                                        ? theme.colors.onSurface
                                        : focused
                                          ? variant === 'assist'
                                              ? theme.colors.onSurface
                                              : theme.colors.onSurfaceVariant
                                          : theme.colors.outlineVariant,
                                    opacity: disabled ? 0.12 : 1,
                                },
                            ]}
                        />
                    ) : null}
                    <View
                        {...props}
                        ref={containerRef}
                        collapsable={false}
                        pointerEvents="none"
                        style={{ borderRadius: radius, overflow: 'hidden' }}
                        onLayout={(event) => {
                            setInkBounds({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height });
                            props.onLayout?.(event);
                        }}
                    >
                        <View
                            style={{
                                flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                                direction: 'ltr',
                                alignItems: 'center',
                                minHeight: 32,
                                paddingLeft: direction === 'rtl' ? (endIcon ? 32 : 16) : avatar ? 4 : leadingSource ? 8 : 16,
                                paddingRight: direction === 'rtl' ? (avatar ? 4 : leadingSource ? 8 : 16) : endIcon ? 32 : 16,
                                paddingVertical: 4,
                                backgroundColor:
                                    !disabled && stateOpacity > 0
                                        ? typeof ink === 'string'
                                            ? withAlpha(ink, stateOpacity)
                                            : theme.colors.stateLayerPressed
                                        : 'transparent',
                            }}
                        >
                            <Animated.View
                                pointerEvents="none"
                                style={[
                                    { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: disabled ? 0.38 : 1 },
                                    leadingStyle,
                                ]}
                            >
                                {avatar ? (
                                    isValidElement<{ size?: number; style?: StyleProp<ViewStyle> }>(avatar) ? (
                                        cloneElement(avatar, {
                                            size: 24,
                                            style: [{ width: 24, height: 24, borderRadius: 12 }, avatar.props.style],
                                        })
                                    ) : (
                                        avatar
                                    )
                                ) : leadingSource ? (
                                    <Icon source={leadingSource} size={18} color={leadingInk} />
                                ) : null}
                            </Animated.View>
                            <Text
                                variant="labelLarge"
                                numberOfLines={1}
                                ellipsizeMode={ellipsizeMode}
                                maxFontSizeMultiplier={maxFontSizeMultiplier}
                                style={[
                                    { flexShrink: 1, minWidth: endIcon ? 42 : undefined, color: ink, opacity: disabled ? 0.38 : 1 },
                                    textStyle,
                                ]}
                            >
                                {children}
                            </Text>
                        </View>
                        <Animated.View
                            style={[
                                {
                                    position: 'absolute',
                                    left: inkOrigin.x - inkOrigin.radius,
                                    top: inkOrigin.y - inkOrigin.radius,
                                    width: inkOrigin.radius * 2,
                                    height: inkOrigin.radius * 2,
                                    borderRadius: inkOrigin.radius,
                                    backgroundColor: ink,
                                },
                                inkStyle,
                            ]}
                        />
                    </View>
                </Surface>
            </Pressable>
            {endIcon ? (
                <TouchableRipple
                    key={disabled ? 'trailing-inactive' : 'trailing-interactive'}
                    disabled={disabled || !endAction}
                    accessible={Boolean(endAction) && !removeOnly}
                    focusable={!removeOnly}
                    accessibilityRole="button"
                    accessibilityLabel={onClose ? closeIconAccessibilityLabel : trailingIconAccessibilityLabel}
                    accessibilityState={{ disabled }}
                    onPress={(event) => {
                        event.stopPropagation();
                        if (canPress()) endAction?.();
                    }}
                    rippleColor={typeof trailingInk === 'string' ? withAlpha(trailingInk, 0.1) : theme.colors.stateLayerPressed}
                    borderless
                    style={{
                        position: 'absolute',
                        left: direction === 'rtl' ? 0 : undefined,
                        right: direction === 'rtl' ? undefined : 0,
                        top: 0,
                        bottom: 0,
                        width: 48,
                        minHeight: 48,
                        borderRadius: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    testID={`${testID}-${onClose ? 'close' : 'trailing'}`}
                >
                    <View style={{ opacity: disabled ? 0.38 : 1 }}>
                        <Icon source={endIcon} size={18} color={trailingInk} />
                    </View>
                </TouchableRipple>
            ) : null}
            {focused && !disabled ? (
                <View
                    pointerEvents="none"
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            marginVertical: 6,
                            marginHorizontal: -2,
                            borderRadius: Number(radius) + 2,
                            borderWidth: 3,
                            borderColor: theme.colors.secondary,
                        },
                    ]}
                />
            ) : null}
        </View>
    );
}

/** A set keeps native chip semantics and adds directional keyboard focus without a second visual control. */
export type ChipGroupProps = { children: ReactNode; style?: StyleProp<ViewStyle>; accessibilityLabel?: string; testID?: string };
function ChipGroup({ children, style, accessibilityLabel, testID }: ChipGroupProps) {
    const { direction } = useLocale();
    const targets = useRef(new Map<string, { id: string; node: () => unknown; focus: () => void; disabled: boolean }>());
    const focused = useRef<string | null>(null);
    const context = useMemo<ChipFocusGroup>(
        () => ({
            register: (id, focus, disabled, node) => {
                targets.current.set(id, {
                    id,
                    node,
                    focus,
                    get disabled() {
                        return disabled();
                    },
                });
                return () => {
                    targets.current.delete(id);
                };
            },
            focused: (id) => {
                focused.current = id;
            },
            move: (id, offset, boundary) => {
                const enabled = orderFocusTargets([...targets.current.values()]).filter((target) => !target.disabled);
                if (!enabled.length) return;
                const index = enabled.findIndex((target) => target.id === id);
                const next =
                    boundary === 'first'
                        ? 0
                        : boundary === 'last'
                          ? enabled.length - 1
                          : (Math.max(0, index) + offset + enabled.length) % enabled.length;
                enabled[next].focus();
            },
        }),
        []
    );
    const keyboard =
        Platform.OS === 'web'
            ? {
                  onKeyDown: (event: { nativeEvent: { key?: string }; preventDefault: () => void; stopPropagation: () => void }) => {
                      const key = event.nativeEvent.key;
                      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key ?? '')) return;
                      event.preventDefault();
                      event.stopPropagation();
                      const previous = key === 'ArrowUp' || (direction === 'rtl' ? key === 'ArrowRight' : key === 'ArrowLeft');
                      context.move(focused.current ?? '', previous ? -1 : 1, key === 'Home' ? 'first' : key === 'End' ? 'last' : undefined);
                  },
              }
            : {};
    return (
        <ChipGroupContext.Provider value={context}>
            <View
                {...keyboard}
                accessibilityLabel={accessibilityLabel}
                style={[
                    {
                        direction: 'ltr',
                        flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                        flexWrap: 'wrap',
                        gap: 8,
                        alignItems: 'center',
                    },
                    style,
                ]}
                testID={testID}
            >
                {children}
            </View>
        </ChipGroupContext.Provider>
    );
}
export const Chip = Object.assign(ChipRoot, { Group: ChipGroup });

export type ListSlotProps = {
    color: ComponentProps<typeof Icon>['color'];
    height: number;
    style: ViewStyle;
    disabled: boolean;
    selected: boolean;
};
export type ListItemProps = {
    title: ReactNode;
    description?: ReactNode;
    overline?: string;
    /** Passive metadata in the primary content region; put independent controls in trailing. */
    metadata?: ReactNode;
    leading?: ReactNode | ((props: ListSlotProps) => ReactNode);
    trailing?: ReactNode | ((props: ListSlotProps) => ReactNode);
    content?: ReactNode;
    lines?: 1 | 2 | 3;
    titleNumberOfLines?: number;
    descriptionNumberOfLines?: 1 | 2 | 3;
    variant?: 'expressive' | 'baseline';
    position?: Position;
    expanded?: boolean;
    selected?: boolean;
    selectionMode?: 'single' | 'multiple';
    multiAction?: boolean;
    disabled?: boolean;
    dragged?: boolean;
    onPress?: () => void;
    onLongPress?: ComponentProps<typeof TouchableRipple>['onLongPress'];
    delayLongPress?: number;
    accessibilityLabel?: string;
    accessibilityRole?: ComponentProps<typeof TouchableRipple>['accessibilityRole'];
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

/** Baseline56/72/88dp remains explicit; expressive rows add slots, selection and4↔16dp shape. */
export function ListItem({
    title,
    description,
    overline,
    metadata,
    leading,
    trailing,
    expanded,
    content,
    lines = description != null && description !== '' && typeof description !== 'boolean' ? 2 : 1,
    titleNumberOfLines = 1,
    descriptionNumberOfLines = lines === 3 ? 2 : 1,
    variant = 'expressive',
    position,
    selected: requestedSelected = false,
    selectionMode,
    multiAction = false,
    disabled = false,
    dragged = false,
    onPress,
    onLongPress,
    delayLongPress,
    accessibilityLabel,
    accessibilityRole,
    style,
    testID = 'mobile-list-item',
}: ListItemProps) {
    const withinExpandedContainer = useContext(ExpandedListContext);
    const focusCollection = useContext(ListFocusContext);
    const selectionGroup = useContext(ListSelectionContext);
    const focusId = useId();
    const rowRef = useRef<ViewInstance>(null);
    const primaryRef = useRef<ViewInstance>(null);
    const theme = useMobileTheme();
    const { direction } = useLocale();
    const actionable = Boolean(onPress || onLongPress);
    const interaction = useRef({
        alive: true,
        generation: 0,
        config: '',
        disabled,
        actionable,
    });
    const interactionConfig = `${disabled}:${actionable}:${multiAction}`;
    if (interaction.current.config !== interactionConfig) interaction.current.generation++;
    Object.assign(interaction.current, { config: interactionConfig, disabled, actionable });
    const interactionGeneration = interaction.current.generation;
    const [hovered, setHovered] = useState(false),
        [focused, setFocused] = useState(false);
    const [press, setPress] = useState({ generation: interactionGeneration, active: false });
    const pressed = press.generation === interactionGeneration && press.active;
    const canInteract = () => {
        const current = interaction.current;
        return current.alive && current.generation === interactionGeneration && !current.disabled && current.actionable;
    };
    const updatePress = (active: boolean) => {
        if (!canInteract()) return;
        setPress((previous) => {
            if (!canInteract()) return previous;
            return previous.generation === interactionGeneration && previous.active === active
                ? previous
                : { generation: interactionGeneration, active };
        });
    };
    useEffect(() => {
        interaction.current.alive = true;
        return () => {
            interaction.current.alive = false;
        };
    }, []);
    const [textLines, setTextLines] = useState({ title: 1, description: 1 });
    const [intrinsicHeights, setIntrinsicHeights] = useState({ label: 0, leading: 0 });
    const [trailingWidth, setTrailingWidth] = useState(0);
    const hasDescription = description != null && description !== '' && typeof description !== 'boolean';
    const hasCustomContent = content != null;
    const hasMetadata = metadata != null && metadata !== '' && typeof metadata !== 'boolean';
    const selectionRole = accessibilityRole === 'radio' || accessibilityRole === 'checkbox' || accessibilityRole === 'switch';
    const selectable = actionable && !multiAction && (Boolean(selectionMode) || selectionRole);
    const selected = selectable && requestedSelected;
    const focusState = useRef({ disabled, selected, actionable });
    focusState.current = { disabled, selected, actionable };
    useLayoutEffect(
        () =>
            focusCollection?.register(focusId, {
                node: () => rowRef.current,
                primary: () => primaryRef.current,
                disabled: () => focusState.current.disabled,
                selected: () => focusState.current.selected,
                actionable: () => focusState.current.actionable,
            }),
        [focusCollection, focusId]
    );
    useLayoutEffect(() => {
        focusCollection?.refresh();
    });
    const lineCount = hasCustomContent ? 0 : (overline ? 1 : 0) + textLines.title + (hasDescription ? textLines.description : 0);
    const rowLines = Math.max(lines, Math.min(3, lineCount));
    const flatStyle = StyleSheet.flatten(style);
    const minimumHeight = Math.max(
        rowLines === 1 ? 56 : rowLines === 2 ? 72 : 88,
        typeof flatStyle?.height === 'number' ? flatStyle.height : 0,
        typeof flatStyle?.minHeight === 'number' ? flatStyle.minHeight : 0
    );
    const expressive = variant === 'expressive';
    const paintedSelection = selected && expressive;
    const ink = disabled ? theme.colors.onSurface : paintedSelection ? theme.colors.onSecondaryContainer : theme.colors.onSurface;
    const secondary = disabled
        ? theme.colors.onSurface
        : paintedSelection
          ? theme.colors.onSecondaryContainer
          : theme.colors.onSurfaceVariant;
    const slotInk = paintedSelection && !disabled && (hovered || focused || pressed || dragged) ? theme.colors.onSurface : secondary;
    const resolvedLeading =
        typeof leading === 'function'
            ? leading({
                  color: slotInk,
                  // Leading media determines intrinsic row height; never feed the padded
                  // result back into that measurement on the next render.
                  height: minimumHeight,
                  style: { marginLeft: 0, marginRight: 0, marginVertical: 0 },
                  disabled,
                  selected,
              })
            : leading;
    // Use intrinsic content, never the previous padded row height. Otherwise a
    // recycled row can keep its old 12dp padding after its text becomes shorter.
    const needsTallPadding =
        rowLines >= 3 ||
        minimumHeight >= 88 ||
        intrinsicHeights.label + 16 >= 88 ||
        (resolvedLeading != null && intrinsicHeights.leading >= 64);
    const verticalPadding = expressive ? 10 : needsTallPadding ? 12 : 8;
    // Measure the content independently of a full-height trailing action, so a
    // previous taller action cannot pin the row after its text becomes shorter.
    const slotHeight = Math.max(
        minimumHeight,
        intrinsicHeights.label + verticalPadding * 2,
        resolvedLeading ? intrinsicHeights.leading + verticalPadding * 2 : 0,
        typeof flatStyle?.height === 'number' ? flatStyle.height : 0,
        typeof flatStyle?.minHeight === 'number' ? flatStyle.minHeight : 0
    );
    const tall = rowLines >= 3 || slotHeight >= 88;
    const trailingRenderer = typeof trailing === 'function';
    const resolvedTrailing = trailingRenderer
        ? trailing({
              color: slotInk,
              height: slotHeight,
              disabled,
              selected,
              style: { height: slotHeight, marginVertical: multiAction ? 0 : -verticalPadding },
          })
        : trailing;
    const hasTrailing = resolvedTrailing != null && resolvedTrailing !== '' && typeof resolvedTrailing !== 'boolean';
    // Expand the native primary indication beneath the independent trailing
    // control. Compensating padding preserves the label's original layout.
    const primaryExtension = multiAction ? (hasTrailing ? trailingWidth : 0) + 16 : 0;
    const target = paintedSelection
        ? 16
        : expressive
          ? !disabled && (focused || pressed || dragged)
              ? 16
              : !disabled && hovered
                ? 12
                : 4
          : 0;
    const radius = useSharedValue(target);
    useEffect(() => {
        setHovered(false);
        setFocused(false);
    }, [interactionGeneration]);
    const motion = theme.motion.spring.fast.spatial;
    useEffect(() => {
        radius.set(theme.animation.scale === 0 ? target : withSpring(target, springConfig(motion)));
    }, [radius, target, theme.animation.scale, motion.stiffness, motion.damping]);
    useEffect(() => () => cancelAnimation(radius), [radius]);
    const shape = useAnimatedStyle(() => ({
        borderRadius: Math.max(0, radius.get()),
        ...(expressive && (position === 'first' || position === 'only') ? { borderTopLeftRadius: 16, borderTopRightRadius: 16 } : {}),
        ...(expressive && (position === 'last' || position === 'only') ? { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 } : {}),
    }));
    const measureLines = (slot: 'title' | 'description', next: number) =>
        setTextLines((previous) => (previous[slot] === next ? previous : { ...previous, [slot]: next }));
    const measureIntrinsicHeight = (slot: 'label' | 'leading', next: number) =>
        setIntrinsicHeights((previous) => (previous[slot] === next ? previous : { ...previous, [slot]: next }));
    const label = (
        <View
            onLayout={(event) => measureIntrinsicHeight('label', event.nativeEvent.layout.height)}
            style={{ flex: 1, minWidth: 0, direction, flexDirection: 'row', alignItems: 'center', gap: expressive ? 12 : 16 }}
        >
            <View style={{ flex: 1, minWidth: 0 }}>
                {content ?? (
                    <>
                        {overline ? (
                            <Text variant="labelSmall" numberOfLines={1} style={{ color: secondary, textAlign: direction === 'rtl' ? 'right' : 'left' }}>
                                {overline}
                            </Text>
                        ) : null}
                        <Text
                            variant="bodyLarge"
                            numberOfLines={titleNumberOfLines}
                            onTextLayout={(event) => measureLines('title', event.nativeEvent.lines.length)}
                            style={{ color: ink, textAlign: direction === 'rtl' ? 'right' : 'left' }}
                        >
                            {title}
                        </Text>
                        {hasDescription ? (
                            <Text
                                variant="bodyMedium"
                                numberOfLines={descriptionNumberOfLines}
                                onTextLayout={(event) => measureLines('description', event.nativeEvent.lines.length)}
                                style={{ color: secondary, textAlign: direction === 'rtl' ? 'right' : 'left' }}
                            >
                                {description}
                            </Text>
                        ) : null}
                    </>
                )}
            </View>
            {hasMetadata ? (
                <View
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{ flexShrink: 0 }}
                    {...webAccessibility({ role: undefined, state: undefined, value: undefined, hidden: true })}
                >
                    {typeof metadata === 'string' || typeof metadata === 'number' ? (
                        <Text variant="labelSmall" numberOfLines={1} style={{ color: secondary, textAlign: direction === 'rtl' ? 'right' : 'left' }}>
                            {metadata}
                        </Text>
                    ) : (
                        metadata
                    )}
                </View>
            ) : null}
        </View>
    );
    const nativeRole =
        (!selectable && selectionRole ? undefined : accessibilityRole) ??
        (selectable
            ? selectionMode === 'single'
                ? 'radio'
                : selectionRole
                  ? accessibilityRole
                  : 'checkbox'
            : actionable
              ? 'button'
              : undefined);
    const role = Platform.OS === 'web' && selectable && selectionGroup ? 'option' : nativeRole;
    const spokenLabel =
        accessibilityLabel ??
        ((typeof title === 'string' || typeof title === 'number') &&
        (description == null || typeof description === 'string' || typeof description === 'number') &&
        (metadata == null || typeof metadata === 'string' || typeof metadata === 'number')
            ? [overline, title, description, metadata].filter((part) => part != null && part !== '').join(', ')
            : undefined);
    const semantics = {
        disabled,
        ...(expanded == null ? {} : { expanded }),
        ...(selectable ? (role === 'radio' || role === 'checkbox' || role === 'switch' ? { checked: selected } : { selected }) : {}),
    };
    const decorativeSlots = disabled || (actionable && !multiAction);
    const leadingView = resolvedLeading ? (
        <View
            pointerEvents={decorativeSlots ? 'none' : 'auto'}
            accessibilityElementsHidden={decorativeSlots}
            importantForAccessibility={decorativeSlots ? 'no-hide-descendants' : 'auto'}
            {...(Platform.OS === 'web' ? { inert: decorativeSlots } : {})}
            onLayout={(event) => measureIntrinsicHeight('leading', event.nativeEvent.layout.height)}
            style={{ minWidth: expressive ? 20 : 24 }}
            {...webAccessibility({ role: undefined, state: undefined, value: undefined, hidden: decorativeSlots })}
        >
            {resolvedLeading}
        </View>
    ) : null;
    const trailingView =
        hasTrailing ? (
            <View
                pointerEvents={decorativeSlots ? 'none' : 'auto'}
                accessibilityElementsHidden={decorativeSlots}
                importantForAccessibility={decorativeSlots ? 'no-hide-descendants' : 'auto'}
                {...(Platform.OS === 'web' ? { inert: decorativeSlots } : {})}
                onLayout={multiAction ? (event) => setTrailingWidth(event.nativeEvent.layout.width) : undefined}
                // The trailing control remains above the expanded native ripple.
                style={{ paddingTop: 0, ...(multiAction ? { zIndex: 1 } : {}) }}
                {...webAccessibility({ role: undefined, state: undefined, value: undefined, hidden: decorativeSlots })}
            >
                {typeof resolvedTrailing === 'string' || typeof resolvedTrailing === 'number' ? (
                    <Text variant="labelSmall" numberOfLines={1} style={{ color: secondary }}>
                        {resolvedTrailing}
                    </Text>
                ) : (
                    resolvedTrailing
                )}
            </View>
        ) : null;
    const directionStyle = {
        direction,
        flexDirection: 'row' as const,
        alignItems: tall ? ('flex-start' as const) : ('center' as const),
    };
    const interactions = {
        onFocus: (event?: Parameters<NonNullable<ComponentProps<typeof TouchableRipple>['onFocus']>>[0]) => {
            if (!canInteract()) return;
            const target = event?.currentTarget as unknown as HTMLElement | undefined;
            setFocused(Platform.OS !== 'web' || target?.matches?.(':focus-visible') !== false);
        },
        onBlur: () => {
            if (!canInteract()) return;
            setFocused(false);
            updatePress(false);
        },
        onHoverIn: () => {
            if (canInteract()) setHovered(true);
        },
        onHoverOut: () => {
            if (canInteract()) setHovered(false);
        },
        onPressIn: () => updatePress(true),
        onPressOut: () => updatePress(false),
    };
    const layer =
        !disabled && (dragged || (!pressed && (hovered || focused))) && typeof theme.colors.onSurface === 'string'
            ? withAlpha(theme.colors.onSurface, dragged ? 0.16 : focused ? 0.1 : 0.08)
            : 'transparent';
    // A multi-action row can have informational text beside an independent
    // trailing control. A disabled Pressable would announce that text as an
    // unavailable action even when the row itself is enabled.
    const PrimaryRegion = actionable ? TouchableRipple : View;
    const primaryInteractions = actionable
        ? {
              ...interactions,
              disabled,
              onPress: onPress
                  ? () => {
                        if (canInteract()) onPress();
                    }
                  : undefined,
              onLongPress: onLongPress
                  ? (event: Parameters<NonNullable<ListItemProps['onLongPress']>>[0]) => {
                        if (canInteract()) onLongPress(event);
                    }
                  : undefined,
              delayLongPress,
              rippleColor:
                  typeof theme.colors.onSurface === 'string' ? withAlpha(theme.colors.onSurface, 0.1) : theme.colors.stateLayerPressed,
          }
        : { accessible: true };
    const focusIndicator =
        focused && !disabled ? (
            <Animated.View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    { borderWidth: 3, borderRadius: target, borderColor: theme.colors.secondary, marginEnd: primaryExtension },
                    shape,
                ]}
            />
        ) : null;
    const body = multiAction ? (
        <View style={{ minHeight: minimumHeight, paddingEnd: 16, ...directionStyle, opacity: disabled ? 0.38 : 1 }}>
            <PrimaryRegion
                key={disabled ? 'inactive' : 'interactive'}
                ref={primaryRef}
                {...primaryInteractions}
                accessibilityRole={role ?? 'text'}
                accessibilityLabel={spokenLabel}
                accessibilityState={semantics}
                style={{ flex: 1, minWidth: 0, alignSelf: 'stretch', marginEnd: -primaryExtension, backgroundColor: layer }}
                testID={`${testID}-primary`}
            >
                <View
                    style={{
                        minHeight: minimumHeight,
                        flexGrow: 1,
                        paddingStart: 16,
                        paddingEnd: (expressive ? 12 : 16) + primaryExtension,
                        paddingVertical: verticalPadding,
                        ...directionStyle,
                        gap: expressive ? 12 : 16,
                    }}
                >
                    {leadingView}
                    {label}
                    {focusIndicator}
                </View>
            </PrimaryRegion>
            {trailingView}
        </View>
    ) : (
        <View
            style={{
                minHeight: minimumHeight,
                paddingStart: 16,
                paddingEnd: 16,
                paddingVertical: verticalPadding,
                ...directionStyle,
                gap: expressive ? 12 : 16,
                opacity: disabled ? 0.38 : 1,
            }}
        >
            {leadingView}
            {label}
            {trailingView}
        </View>
    );
    return (
        <Surface
            elevation={disabled ? 0 : dragged ? 4 : 0}
            mode="elevated"
            style={{ borderRadius: target, backgroundColor: dragged ? theme.colors.surface : 'transparent' }}
        >
            <Animated.View
                ref={rowRef}
                {...(Platform.OS === 'web' ? { dataSet: { mobileDesignListItem: focusId } } : {})}
                {...(Platform.OS === 'web' && focusCollection
                    ? {
                          onKeyDown: focusCollection.onKeyDown,
                          onFocus: focusCollection.refresh,
                          onBlur: focusCollection.refresh,
                      }
                    : {})}
                style={[
                    {
                        backgroundColor: withinExpandedContainer ? theme.colors.surfaceContainer : theme.colors.surface,
                        overflow: 'hidden',
                    },
                    shape,
                    style,
                    // Layout overrides must not let a row's indication escape its shape.
                    { overflow: 'hidden' },
                ]}
            >
                {paintedSelection ? (
                    <View
                        pointerEvents="none"
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                backgroundColor: disabled ? theme.colors.onSurface : theme.colors.secondaryContainer,
                                opacity: disabled ? 0.1 : 1,
                            },
                        ]}
                    />
                ) : null}
                {multiAction ? (
                    body
                ) : (
                    <PrimaryRegion
                        key={disabled ? 'inactive' : 'interactive'}
                        ref={primaryRef}
                        {...primaryInteractions}
                        accessibilityRole={role}
                        accessibilityLabel={spokenLabel}
                        accessibilityState={semantics}
                        style={{ backgroundColor: layer }}
                        testID={testID}
                    >
                        {body}
                    </PrimaryRegion>
                )}
                {multiAction ? null : focusIndicator}
            </Animated.View>
        </Surface>
    );
}

export type ListGroupProps = { children: ReactNode; variant?: 'standard' | 'segmented'; accessibilityLabel?: string };

export function ListGroup({ children, variant = 'segmented', accessibilityLabel }: ListGroupProps) {
    const items = Children.toArray(children);
    const baseline = items.length > 0 && items.every(
        (child) => isValidElement<ListItemProps>(child) && child.type === ListItem && child.props.variant === 'baseline'
    );
    const withinExpandedContainer = useContext(ExpandedListContext);
    const focusCollection = useContext(ListFocusContext);
    const selectionModes = items.map((child) =>
        isValidElement<ListItemProps>(child) && child.type === ListItem && child.props.onPress &&
        !child.props.multiAction && child.props.accessibilityRole !== 'switch'
            ? child.props.selectionMode
            : undefined
    );
    const selectionMode = selectionModes[0] && selectionModes.every((mode) => mode === selectionModes[0]) ? selectionModes[0] : undefined;
    const body = (
        <ListSelectionContext.Provider value={selectionMode}>
            <ListGroupView
                {...(Platform.OS === 'web' && selectionMode ? {
                    role: 'listbox' as const,
                    'aria-label': accessibilityLabel ?? (selectionMode === 'single' ? 'Single selection' : 'Multiple selection'),
                    'aria-multiselectable': selectionMode === 'multiple',
                } : {})}
                style={{
                    gap: !baseline && variant === 'segmented' ? 2 : 0,
                    borderRadius: baseline ? 0 : 16,
                    paddingVertical: baseline ? 8 : 0,
                    overflow: 'hidden',
                }}
            >
                {items.map((child, index) =>
                    isValidElement<ListItemProps>(child) && child.type === ListItem
                        ? cloneElement(child, {
                              variant: child.props.variant ?? 'expressive',
                              position: withinExpandedContainer
                                  ? index === items.length - 1
                                      ? 'last'
                                      : 'middle'
                                  : items.length === 1
                                    ? 'only'
                                    : index === 0
                                      ? 'first'
                                      : index === items.length - 1
                                        ? 'last'
                                        : 'middle',
                          })
                        : child
                )}
            </ListGroupView>
        </ListSelectionContext.Provider>
    );
    return focusCollection ? body : <ListCollection>{body}</ListCollection>;
}

export type ListAccordionProps = Pick<
    ListItemProps,
    'title' | 'description' | 'leading' | 'disabled' | 'titleNumberOfLines' | 'descriptionNumberOfLines' | 'accessibilityLabel'
> & {
    children: ReactNode;
    expanded?: boolean;
    onPress?: () => void;
    testID?: string;
};

/** Parent and children share the expanding container from the MD3 Lists examples. */
export function ListAccordion({
    title,
    description,
    leading,
    children,
    expanded,
    onPress,
    disabled = false,
    titleNumberOfLines,
    descriptionNumberOfLines,
    accessibilityLabel,
    testID = 'mobile-list-accordion',
}: ListAccordionProps) {
    const theme = useMobileTheme();
    const [internal, setInternal] = useState(false);
    const open = expanded ?? internal,
        angle = useSharedValue(open ? 180 : 0);
    const s = theme.motion.spring.default.spatial;
    useEffect(() => {
        angle.set(theme.animation.scale === 0 ? (open ? 180 : 0) : withSpring(open ? 180 : 0, springConfig(s)));
    }, [angle, open, s, theme.animation.scale]);
    useEffect(() => () => cancelAnimation(angle), [angle]);
    const rotate = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.get()}deg` }] }));
    const closedColor = String(theme.colors.surface),
        openColor = String(theme.colors.surfaceContainer);
    const container = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(Math.max(0, Math.min(1, angle.get() / 180)), [0, 1], [closedColor, openColor]),
    }));
    return (
        <Animated.View
            collapsable={false}
            style={[{ overflow: 'hidden', borderRadius: 16 }, container]}
            layout={LinearTransition.springify()
                .stiffness(s.stiffness)
                .damping(2 * s.damping * Math.sqrt(s.stiffness))
                .reduceMotion(theme.animation.scale === 0 ? ReduceMotion.Always : ReduceMotion.Never)}
        >
            <ListItem
                title={title}
                description={description}
                leading={leading}
                disabled={disabled}
                titleNumberOfLines={titleNumberOfLines}
                descriptionNumberOfLines={descriptionNumberOfLines}
                accessibilityLabel={accessibilityLabel}
                expanded={open}
                position={open ? 'first' : 'only'}
                style={{ backgroundColor: 'transparent' }}
                onPress={() => {
                    if (disabled) return;
                    if (expanded === undefined) setInternal((previous) => !previous);
                    onPress?.();
                }}
                trailing={
                    <Animated.View
                        style={[
                            {
                                width: 40,
                                height: 40,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 20,
                                backgroundColor: open ? theme.colors.surfaceContainer : 'transparent',
                            },
                            rotate,
                        ]}
                    >
                        <Icon source="chevron-down" size={20} color={theme.colors.onSurface} />
                    </Animated.View>
                }
                testID={testID}
            />
            <View
                collapsable={false}
                pointerEvents={open ? 'auto' : 'none'}
                accessibilityElementsHidden={!open}
                importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
                testID={`${testID}-children`}
                {...webAccessibility({ role: undefined, state: undefined, value: undefined, hidden: !open })}
            >
                {open ? (
                    <Animated.View
                        entering={FadeIn.duration(theme.motion.duration.short3 * theme.animation.scale).reduceMotion(ReduceMotion.Never)}
                        exiting={FadeOut.duration(theme.motion.duration.short2 * theme.animation.scale).reduceMotion(ReduceMotion.Never)}
                    >
                        <ExpandedListContext.Provider value>{children}</ExpandedListContext.Provider>
                    </Animated.View>
                ) : null}
            </View>
        </Animated.View>
    );
}

export const List = {
    Accordion: ListAccordion,
    Collection: ListCollection,
    Group: ListGroup,
    Icon: PaperList.Icon,
    Image: PaperList.Image,
    Item: ListItem,
    Section: PaperList.Section,
    Subheader: PaperList.Subheader,
};

export type DividerProps = Omit<PaperDividerProps, 'style'> & {
    orientation?: 'horizontal' | 'vertical';
    thickness?: number;
    style?: StyleProp<ViewStyle>;
};
/** Vertical dividers stretch inside a row; horizontal insets remain logical in RTL. */
export function Divider({
    bold = true,
    leftInset,
    horizontalInset,
    orientation = 'horizontal',
    thickness,
    style,
    theme: override,
    ...props
}: DividerProps) {
    const theme = useMobileTheme(override);
    const { direction } = useLocale();
    const line = Number.isFinite(thickness) ? Math.max(0, thickness!) : bold ? 1 : StyleSheet.hairlineWidth;
    return (
        <View
            {...props}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            {...(Platform.OS === 'web' ? { dir: direction, 'aria-hidden': true, inert: true } : {})}
            style={[
                {
                    alignSelf: 'stretch',
                    direction,
                    backgroundColor: theme.colors.outlineVariant,
                    ...(orientation === 'vertical'
                        ? {
                              width: line,
                              marginTop: horizontalInset || leftInset ? 16 : 0,
                              marginBottom: horizontalInset ? 16 : 0,
                          }
                        : { height: line, marginStart: leftInset || horizontalInset ? 16 : 0, marginEnd: horizontalInset ? 16 : 0 }),
                },
                style,
            ]}
        />
    );
}
