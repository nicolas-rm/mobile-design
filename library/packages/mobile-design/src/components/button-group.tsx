import { buttonGroupSizeTokens, type ButtonVariant } from '@mobile-design/tokens';
import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { PixelRatio, Platform, View, useWindowDimensions, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, Text, useLocale, useTheme, type Theme } from 'react-native-paper';
import { TouchableRipple } from '../ripple';
import Animated, {
    cancelAnimation,
    ReduceMotion,
    useAnimatedProps,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';
import { withAlpha } from '../color';
import { AnimatedActionSurface as AnimatedSurface } from './action-surface';
import { Menu } from './menu';
import { IconButton } from './icon-button';
import { Tooltip } from './tooltip';

// Clip the indication on Paper's native touch host so XS/S hitSlop can extend
// beyond the visual shape through overflow-visible ancestors.
const AnimatedTouchableRipple = Animated.createAnimatedComponent(TouchableRipple);

export type ButtonGroupItem = {
    value: string;
    label: string;
    icon?: ComponentProps<typeof Icon>['source'];
    /** Keep label as the accessible name while rendering an icon button. */
    iconOnly?: boolean;
    /** Keep an action as a command inside a standard toggle group. Connected groups remain uniform. */
    selectionMode?: 'none';
    disabled?: boolean;
    onPress?: () => void;
    accessibilityLabel?: string;
    /** Individual treatments apply only to standard groups; connected groups stay uniform. */
    variant?: ButtonVariant;
    size?: ButtonGroupProps['size'];
    shape?: ButtonGroupProps['shape'];
    widthVariant?: 'narrow' | 'default' | 'wide';
    /** Explicit proportional slot in a full-width group; content remains a minimum. */
    weight?: number;
    buttonColor?: ColorValue;
    textColor?: ColorValue;
};
export type ButtonGroupProps = {
    items: readonly ButtonGroupItem[];
    variant?: 'standard' | 'connected';
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
    shape?: 'round' | 'square';
    /** M3 layout density reduces visual height by4dp per step, keeping text and48dp targets. */
    density?: 0 | -1 | -2 | -3;
    buttonVariant?: ButtonVariant;
    selectionMode?: 'none' | 'single' | 'multiple';
    value?: string | readonly string[];
    onValueChange?: (value: string | string[]) => void;
    allowEmptySelection?: boolean;
    showSelectedIcon?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    maxVisibleItems?: number;
    /** Fractional growth on press in a standard group. AndroidX defaults to 0.15; 0 disables width motion. */
    expandedRatio?: number;
    accessibilityLabel?: string;
    overflowAccessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

const rawSpring = (theme: Theme) => {
    const { stiffness, damping } = theme.motion.spring.fast.spatial;
    return { stiffness, damping: damping * 2 * Math.sqrt(stiffness), mass: 1, reduceMotion: ReduceMotion.Never };
};

const iconPaddingFor = (
    spec: (typeof buttonGroupSizeTokens)[keyof typeof buttonGroupSizeTokens],
    width: ButtonGroupItem['widthVariant']
) => (width === 'narrow' ? spec.iconNarrow : width === 'wide' ? spec.iconWide : spec.iconPadding);

/**
 * AndroidX gives the middle item equal space from its two immediate neighbours.
 * Its limit is each neighbour's end padding, never an inferred constant 16 dp.
 * Visual minima protect the actual content. Small icon surfaces keep their own
 * token widths; their separate transparent hitSlop supplies the48dp target.
 */
export function buttonGroupPressDeltas(
    widths: readonly number[],
    limits: readonly number[],
    expandedRatio: number,
    minimumWidths: readonly number[] = widths.map(() => 48)
) {
    return widths.map((itemWidth, index) => {
        const result = widths.map(() => 0);
        const neighbours = [index - 1, index + 1].filter((i) => i >= 0 && i < widths.length);
        if (!neighbours.length) return result;
        const transfer = Math.min(
            (itemWidth * expandedRatio) / neighbours.length,
            ...neighbours.map((i) => Math.max(0, Math.min(limits[i], widths[i] - minimumWidths[i])))
        );
        result[index] = transfer * neighbours.length;
        neighbours.forEach((i) => (result[i] = -transfer));
        return result;
    });
}

type GroupKeyEvent = {
    key: string;
    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    nativeEvent?: { key: string; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; isComposing?: boolean };
    preventDefault: () => void;
};

function GroupItem({
    item,
    index,
    count,
    width,
    actualWidths,
    pressOffsets,
    selected,
    connected,
    size,
    density,
    groupShape,
    variant,
    selectionMode,
    disabled,
    showSelectedIcon,
    onPress,
    onPressChange,
    geometryKey,
    onFocus,
    onKeyDown,
    focusRef,
    tabIndex,
    testID,
}: {
    item: ButtonGroupItem;
    index: number;
    count: number;
    width: number;
    deltas: number[][];
    actualWidths: { get: () => number[] };
    pressOffsets: { get: () => number[] };
    presses: SharedValue<number[]>;
    selected: boolean;
    connected: boolean;
    variant: ButtonVariant;
    size: NonNullable<ButtonGroupProps['size']>;
    density: NonNullable<ButtonGroupProps['density']>;
    groupShape: NonNullable<ButtonGroupProps['shape']>;
    selectionMode: 'none' | 'single' | 'multiple';
    disabled: boolean;
    showSelectedIcon: boolean;
    onPress: () => void;
    onPressChange: (index: number, down: boolean) => void;
    geometryKey: string;
    onFocus?: () => void;
    onKeyDown?: (event: unknown) => void;
    focusRef?: (node: unknown) => void;
    tabIndex?: 0 | -1;
    testID: string;
}) {
    const theme = useTheme<Theme>();
    const web = Platform.OS === 'web';
    const { direction } = useLocale();
    const reduced = theme.animation.scale === 0;
    const spec = buttonGroupSizeTokens[size];
    const visualHeight = spec.height + 4 * density;
    const labelPadding = item.iconOnly ? iconPaddingFor(spec, item.widthVariant) : spec.padding;
    const iconSize = item.iconOnly ? spec.iconOnly : spec.icon;
    const checked = useSharedValue(selected ? 1 : 0);
    const shapePressed = useSharedValue(0);
    const [measurement, setMeasurement] = useState({ key: geometryKey, height: visualHeight });
    const height = measurement.key === geometryKey ? measurement.height : visualHeight;
    const [focused, setFocused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [pressActive, setPressActive] = useState(false);
    const [keyboardDown, setKeyboardDown] = useState(false);
    const spaceHeld = useRef(false);
    const [pressHitSlop, setPressHitSlop] = useState<{ top: number; bottom: number; left: number; right: number }>();
    const nativePress = useRef({ alive: true, disabled, geometryKey, generation: 0 });
    if (nativePress.current.disabled !== disabled || nativePress.current.geometryKey !== geometryKey) nativePress.current.generation++;
    nativePress.current.disabled = disabled;
    nativePress.current.geometryKey = geometryKey;
    const pressGeneration = nativePress.current.generation;
    const canInteract = () =>
        nativePress.current.alive && !nativePress.current.disabled && nativePress.current.generation === pressGeneration;
    useEffect(() => {
        nativePress.current.alive = true;
        return () => {
            nativePress.current.alive = false;
        };
    }, []);
    const shapeSpring = () => {
        // Use the same current corner motion as the standalone Button/IconButton.
        const { stiffness, damping } = item.iconOnly ? theme.motion.spring.default.effects : theme.motion.spring.fast.spatial;
        return { stiffness, damping: damping * 2 * Math.sqrt(stiffness), mass: 1, reduceMotion: ReduceMotion.Never };
    };
    const setShapePressed = (down: boolean) => shapePressed.set(reduced ? Number(down) : withSpring(Number(down), shapeSpring()));
    useEffect(() => {
        checked.set(reduced ? Number(selected) : withSpring(Number(selected), shapeSpring()));
    }, [checked, reduced, selected, item.iconOnly, theme.motion]);
    useEffect(() => () => cancelAnimation(checked), [checked]);
    useEffect(() => {
        cancelAnimation(shapePressed);
        shapePressed.set(0);
        setPressActive(false);
        setKeyboardDown(false);
        spaceHeld.current = false;
        setPressHitSlop(undefined);
        return () => cancelAnimation(shapePressed);
    }, [disabled, reduced, geometryKey, shapePressed]);
    useEffect(() => {
        // These changes replace the native press host; a motion preference
        // alone must not erase focus on the still-focused host.
        setFocused(false);
        setHovered(false);
    }, [disabled, geometryKey]);
    const actualWidth = useDerivedValue(() => actualWidths.get()[index] ?? width);
    const currentHitSlop = () => {
        'worklet';
        const horizontal = Math.max(0, (48 - actualWidth.get()) / 2);
        const vertical = Math.max(0, (48 - height) / 2);
        return { top: vertical, bottom: vertical, left: horizontal, right: horizontal };
    };
    const touchTarget = useAnimatedProps(() => ({ hitSlop: currentHitSlop() }));
    const webTarget = useAnimatedStyle(() => {
        const inset = currentHitSlop();
        // DOM hit testing does not implement RN hitSlop. Enlarge the real host
        // while keeping the visual and its neighbours in the same layout slots.
        return web
            ? {
                  minHeight: Math.max(48, visualHeight),
                  width: actualWidth.get() + inset.left + inset.right,
                  paddingTop: inset.top,
                  paddingBottom: inset.bottom,
                  paddingLeft: inset.left,
                  paddingRight: inset.right,
                  marginTop: -inset.top,
                  marginBottom: -inset.bottom,
                  marginLeft: -inset.left,
                  marginRight: -inset.right,
              }
            : {};
    });
    const contentInsets = useAnimatedStyle(() => ({
        // AndroidX's compression budget is content padding, not the label or icon.
        // Read the displacement calculated with the same baseline on the UI
        // thread. Comparing a derived width with a new React prop can mix two
        // layout generations while resizing or remounting the touch host.
        paddingHorizontal: Math.max(0, labelPadding + (pressOffsets.get()[index] ?? 0) / 2),
    }));
    const shape = useAnimatedStyle(() => {
        const full = height / 2;
        const initial = connected ? spec.inner : groupShape === 'round' ? full : spec.square;
        const checkedRadius = connected ? full : groupShape === 'round' ? spec.square : full;
        const normal = initial + (checkedRadius - initial) * checked.get();
        // M3's rendered token browser supplies pressed-inner4/4/4/12/16 by size.
        const pressedInner = connected ? spec.pressedInner : spec.pressed;
        const inner = normal + (pressedInner - normal) * shapePressed.get();
        const outer = groupShape === 'round' ? full : spec.outerSquare + (full - spec.outerSquare) * checked.get();
        const start = connected && index === 0 ? outer : inner;
        const end = connected && index === count - 1 ? outer : inner;
        return {
            width: actualWidth.get(),
            borderTopLeftRadius: Math.max(0, direction === 'rtl' ? end : start),
            borderBottomLeftRadius: Math.max(0, direction === 'rtl' ? end : start),
            borderTopRightRadius: Math.max(0, direction === 'rtl' ? start : end),
            borderBottomRightRadius: Math.max(0, direction === 'rtl' ? start : end),
        };
    });
    const tonal = variant === 'tonal';
    const filled = variant === 'filled';
    const toggle = selectionMode !== 'none';
    const baseBackground = toggle
        ? variant === 'outlined'
            ? selected
                ? theme.colors.inverseSurface
                : 'transparent'
            : tonal
              ? selected
                  ? theme.colors.secondary
                  : theme.colors.secondaryContainer
              : selected
                ? theme.colors.primary
                : variant === 'elevated'
                  ? theme.colors.surfaceContainerLow
                  : theme.colors.surfaceContainer
        : filled
          ? theme.colors.primary
          : tonal
            ? theme.colors.secondaryContainer
            : variant === 'elevated'
              ? theme.colors.surfaceContainerLow
              : 'transparent';
    const baseForeground = toggle
        ? variant === 'outlined'
            ? selected
                ? theme.colors.inverseOnSurface
                : theme.colors.onSurfaceVariant
            : tonal
              ? selected
                  ? theme.colors.onSecondary
                  : theme.colors.onSecondaryContainer
              : selected
                ? theme.colors.onPrimary
                : variant === 'elevated'
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant
        : filled
          ? theme.colors.onPrimary
          : tonal
            ? theme.colors.onSecondaryContainer
            : variant === 'outlined'
              ? theme.colors.onSurfaceVariant
              : theme.colors.primary;
    const background = !connected && item.buttonColor != null ? item.buttonColor : baseBackground;
    const foreground = !connected && item.textColor != null ? item.textColor : baseForeground;
    const disabledForeground = theme.colors.onSurface;
    const outlined = variant === 'outlined' && !(toggle && selected);
    const icon = selected && showSelectedIcon ? 'check' : item.icon;
    return (
        <AnimatedSurface
            elevation={!disabled && variant === 'elevated' ? 1 : 0}
            mode="elevated"
            style={[
                {
                    marginVertical: Math.max(0, (48 - height) / 2),
                    backgroundColor: disabled ? 'transparent' : background,
                    outlineColor: theme.colors.secondary,
                    outlineWidth: focused && !disabled ? 3 : 0,
                    outlineOffset: 2,
                    outlineStyle: 'solid',
                },
            ]}
            geometry={shape}
        >
            <Animated.View style={[shape, { width: '100%' }]}>
                {outlined ? (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            {
                                position: 'absolute',
                                inset: 0,
                                borderWidth: spec.outline,
                                borderColor: theme.colors.outlineVariant,
                                opacity: disabled && item.iconOnly ? 0.38 : 1,
                            },
                            shape,
                            { width: '100%' },
                        ]}
                    />
                ) : null}
                {disabled && variant !== 'text' && !outlined ? (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            {
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: theme.colors.onSurface,
                                opacity: 0.1,
                            },
                            shape,
                            { width: '100%' },
                        ]}
                    />
                ) : null}
                {(focused || hovered || keyboardDown) && !disabled && (!pressActive || keyboardDown) ? (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            { position: 'absolute', inset: 0, backgroundColor: foreground, opacity: keyboardDown || focused ? 0.1 : 0.08 },
                            shape,
                            { width: '100%' },
                        ]}
                    />
                ) : null}
                <AnimatedTouchableRipple
                    key={`${disabled ? 'inactive' : 'interactive'}:${geometryKey}`}
                    ref={focusRef}
                    {...(Platform.OS === 'web'
                        ? {
                              tabIndex,
                              dataSet: { mobileDesignHitTarget: 'true' },
                              'aria-checked': selectionMode !== 'none' ? selected : undefined,
                              'aria-disabled': disabled,
                              onKeyDown: (event: {
                                  nativeEvent: {
                                      key: string;
                                      repeat?: boolean;
                                      altKey?: boolean;
                                      ctrlKey?: boolean;
                                      metaKey?: boolean;
                                      isComposing?: boolean;
                                  };
                                  preventDefault: () => void;
                              }) => {
                                  const key = event.nativeEvent;
                                  if (!canInteract() || key.altKey || key.ctrlKey || key.metaKey || key.isComposing) return;
                                  if (
                                      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' ', 'Spacebar'].includes(
                                          key.key
                                      )
                                  )
                                      setFocused(true);
                                  // RN Web handles Enter on keyup, but Space only for
                                  // button/menuitem roles. Radio/checkbox commit once
                                  // on release and cancel on blur/configuration change.
                                  if ((key.key === ' ' || key.key === 'Spacebar') && selectionMode !== 'none') {
                                      event.preventDefault();
                                      if (!key.repeat && !spaceHeld.current) {
                                          spaceHeld.current = true;
                                          setKeyboardDown(true);
                                          setPressActive(true);
                                          setShapePressed(true);
                                          onPressChange(index, true);
                                      }
                                  } else onKeyDown?.(event);
                              },
                              onKeyUp: (event: { nativeEvent: { key: string }; preventDefault: () => void }) => {
                                  if (![' ', 'Spacebar'].includes(event.nativeEvent.key) || !spaceHeld.current) return;
                                  event.preventDefault();
                                  spaceHeld.current = false;
                                  setKeyboardDown(false);
                                  setPressActive(false);
                                  setShapePressed(false);
                                  onPressChange(index, false);
                                  if (canInteract()) onPress();
                              },
                          }
                        : {})}
                    accessibilityLabel={item.accessibilityLabel ?? item.label}
                    accessibilityRole={selectionMode === 'single' ? 'radio' : selectionMode === 'multiple' ? 'checkbox' : 'button'}
                    accessibilityState={{ disabled, ...(selectionMode !== 'none' ? { checked: selected } : {}) }}
                    disabled={disabled}
                    hitSlop={
                        pressHitSlop ?? {
                            top: Math.max(0, (48 - height) / 2),
                            bottom: Math.max(0, (48 - height) / 2),
                            left: Math.max(0, (48 - width) / 2),
                            right: Math.max(0, (48 - width) / 2),
                        }
                    }
                    animatedProps={touchTarget}
                    onBlur={() => {
                        if (!canInteract()) return;
                        setFocused(false);
                        setPressActive(false);
                        spaceHeld.current = false;
                        setKeyboardDown(false);
                        setPressHitSlop(undefined);
                        setShapePressed(false);
                        onPressChange(index, false);
                    }}
                    onFocus={(event) => {
                        if (!canInteract()) return;
                        setFocused(
                            Platform.OS !== 'web' ||
                                ((event.currentTarget as unknown as { matches?: (selector: string) => boolean }).matches?.(
                                    ':focus-visible'
                                ) ??
                                    true)
                        );
                        onFocus?.();
                    }}
                    onHoverIn={() => {
                        if (canInteract()) setHovered(true);
                    }}
                    onHoverOut={() => {
                        if (canInteract()) setHovered(false);
                    }}
                    onPress={
                        disabled
                            ? undefined
                            : () => {
                                  if (canInteract()) onPress();
                              }
                    }
                    onPressIn={(event) => {
                        if (!canInteract()) return;
                        if (Platform.OS === 'web') setFocused(typeof (event.nativeEvent as { key?: unknown }).key === 'string');
                        // Match the native hitSlop in Pressability's JS retention
                        // region once per gesture, never with per-frame JS work.
                        setPressHitSlop(currentHitSlop());
                        setPressActive(true);
                        setShapePressed(true);
                        onPressChange(index, true);
                    }}
                    onPressOut={() => {
                        if (!canInteract()) return;
                        setPressActive(false);
                        setPressHitSlop(undefined);
                        setShapePressed(false);
                        onPressChange(index, false);
                    }}
                    rippleColor={typeof foreground === 'string' ? withAlpha(foreground, 0.1) : theme.colors.stateLayerPressed}
                    style={[
                        {
                            minHeight: visualHeight,
                            justifyContent: 'center',
                            backgroundColor: 'transparent',
                            overflow: Platform.OS === 'web' ? 'visible' : 'hidden',
                        },
                        shape,
                        { width: '100%' },
                        webTarget,
                    ]}
                    testID={testID}
                >
                    <Animated.View
                        onLayout={(event) => {
                            const nextHeight = Math.max(visualHeight, event.nativeEvent.layout.height);
                            setMeasurement((previous) =>
                                previous.key === geometryKey && previous.height === nextHeight
                                    ? previous
                                    : { key: geometryKey, height: nextHeight }
                            );
                        }}
                        pointerEvents="none"
                        style={[
                            {
                                minHeight: visualHeight,
                                direction,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingHorizontal: labelPadding,
                                paddingVertical: item.iconOnly ? 0 : Math.max(0, 4 + density * 2),
                                gap: spec.gap,
                                opacity: disabled ? 0.38 : 1,
                            },
                            contentInsets,
                        ]}
                    >
                        {icon ? <Icon color={disabled ? disabledForeground : foreground} source={icon} size={iconSize} /> : null}
                        {!item.iconOnly ? (
                            <Text
                                numberOfLines={1}
                                style={{ color: disabled ? disabledForeground : foreground, flexShrink: 1 }}
                                variant={spec.text}
                            >
                                {item.label}
                            </Text>
                        ) : null}
                    </Animated.View>
                </AnimatedTouchableRipple>
            </Animated.View>
        </AnimatedSurface>
    );
}

/**
 * Paper composition. M3 standard groups expand the pressed item by 15% and compress its
 * neighbours; connected groups use size-specific inner corners and select to capsules.
 * Tokens/interaction: AndroidX ButtonGroup.kt + ConnectedButtonGroupSmallTokens (Apache2).
 * https://github.com/androidx/androidx/tree/d153d87ed76372ece0c99dac837ff07ab845d495/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3
 */
export function ButtonGroup({
    items,
    variant = 'standard',
    size = 'small',
    shape = 'round',
    density = 0,
    buttonVariant = 'tonal',
    selectionMode = variant === 'connected' ? 'single' : 'none',
    value,
    onValueChange,
    allowEmptySelection = false,
    showSelectedIcon = true,
    disabled = false,
    fullWidth = variant === 'connected',
    maxVisibleItems,
    expandedRatio = 0.15,
    accessibilityLabel,
    overflowAccessibilityLabel = 'Más opciones',
    style,
    testID = 'mobile-button-group',
}: ButtonGroupProps) {
    const theme = useTheme<Theme>();
    const { direction } = useLocale();
    const { fontScale } = useWindowDimensions();
    const reduced = theme.animation.scale === 0;
    const [width, setWidth] = useState(0);
    const [measured, setMeasured] = useState<Record<string, number>>({});
    const [menuVisible, setMenuVisible] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const focusRefs = useRef<Array<{ focus: () => void } | null>>([]);
    const connected = variant === 'connected';
    const spec = buttonGroupSizeTokens[size];
    const resolvedDensity = [0, -1, -2, -3].includes(density) ? density : 0;
    const itemSize = (item: ButtonGroupItem) => (connected ? size : (item.size ?? size));
    const itemSpec = (item: ButtonGroupItem) => buttonGroupSizeTokens[itemSize(item)];
    const itemVariant = (item: ButtonGroupItem) => (connected ? buttonVariant : (item.variant ?? buttonVariant));
    const itemSelectionMode = (item: ButtonGroupItem) => (connected ? selectionMode : (item.selectionMode ?? selectionMode));
    const gap = connected ? 2 : spec.between;
    const selected = useMemo(() => new Set(typeof value === 'string' ? [value] : (value ?? [])), [value]);
    const pixelDensity = PixelRatio.get();
    const measurementKey = (item: ButtonGroupItem) => JSON.stringify([item.value, item.label, fontScale, theme.fonts[itemSpec(item).text]]);
    const contentWidths = items.map((item) => {
        const spec = itemSpec(item);
        // Round outwards and leave one physical pixel for native glyph/layout rounding.
        if (item.iconOnly) return spec.iconOnly;
        const labelWidth = Math.ceil((measured[measurementKey(item)] ?? 48) * pixelDensity) / pixelDensity + 1 / pixelDensity;
        return labelWidth + (item.icon || (showSelectedIcon && itemSelectionMode(item) !== 'none') ? spec.icon + spec.gap : 0);
    });
    const naturalWidths = items.map((item, index) => {
        const spec = itemSpec(item);
        const border = !item.iconOnly && itemVariant(item) === 'outlined' ? spec.outline * 2 : 0;
        return Math.max(
            item.iconOnly && !connected ? 0 : 48,
            contentWidths[index] + (item.iconOnly ? iconPaddingFor(spec, item.widthVariant) : spec.padding) * 2 + border
        );
    });
    const visibleLimit =
        maxVisibleItems == null || !Number.isFinite(maxVisibleItems) ? items.length : Math.max(0, Math.floor(maxVisibleItems));
    let visibleCount = Math.min(items.length, visibleLimit);
    if (width > 0) {
        while (
            visibleCount > 0 &&
            naturalWidths.slice(0, visibleCount).reduce((sum, itemWidth) => sum + itemWidth, 0) +
                gap * Math.max(0, visibleCount - 1) +
                (visibleCount < items.length ? 48 + gap : 0) >
                width
        )
            visibleCount--;
    }
    const visible = items.slice(0, visibleCount);
    const overflow = items.slice(visibleCount);
    const reserved = overflow.length ? 48 + (visibleCount ? gap : 0) : 0;
    const widths = naturalWidths.slice(0, visibleCount);
    const weights = visible.map((item) => (Number.isFinite(item.weight) && (item.weight ?? 0) > 0 ? item.weight! : 0));
    const weighted = weights.map((weight, index) => (weight > 0 ? index : -1)).filter((index) => index >= 0);
    if (fullWidth && weighted.length) {
        let remaining = width - reserved - gap * Math.max(0, visibleCount - 1);
        widths.forEach((itemWidth, index) => {
            if (!weights[index]) remaining -= itemWidth;
        });
        let flexible = weighted;
        while (flexible.length) {
            const totalWeight = flexible.reduce((sum, index) => sum + weights[index], 0);
            const constrained = flexible.filter((index) => widths[index] > (remaining * weights[index]) / totalWeight);
            if (!constrained.length) {
                flexible.forEach((index) => (widths[index] = (remaining * weights[index]) / totalWeight));
                break;
            }
            constrained.forEach((index) => (remaining -= widths[index]));
            flexible = flexible.filter((index) => !constrained.includes(index));
        }
    } else if (fullWidth && visibleCount) {
        let remaining = Math.max(
            0,
            width - reserved - gap * Math.max(0, visibleCount - 1) - widths.reduce((sum, itemWidth) => sum + itemWidth, 0)
        );
        let flexible = widths.map((_, i) => i);
        while (remaining > 0.01 && flexible.length) {
            const share = remaining / flexible.length;
            flexible = flexible.filter((i) => {
                const spec = itemSpec(visible[i]);
                const maximum = visible[i].iconOnly ? Math.max(connected ? 48 : 0, spec.iconOnly + spec.iconWide * 2) : Infinity;
                const extra = Math.min(share, Math.max(0, maximum - widths[i]));
                widths[i] += extra;
                remaining -= extra;
                return widths[i] < maximum - 0.01;
            });
        }
    }
    const expansion = Number.isFinite(expandedRatio) ? Math.max(0, expandedRatio) : 0.15;
    const minimumWidths = visible.map((item, index) => Math.max(item.iconOnly && !connected ? 0 : 48, contentWidths[index]));
    const deltas = buttonGroupPressDeltas(
        widths,
        visible.map((item) => (item.iconOnly ? iconPaddingFor(itemSpec(item), item.widthVariant) : itemSpec(item).padding)),
        connected ? 0 : expansion,
        minimumWidths
    );
    const presses = useSharedValue<number[]>(items.map(() => 0));
    const pressGeometry = useDerivedValue(() => {
        const progress = presses.get();
        const offsets = widths.map((_, index) =>
            progress.reduce((sum, value, pressed) => sum + value * (deltas[pressed]?.[index] ?? 0), 0)
        );
        // During an interrupted/reversed spring several press values can be
        // nonzero. Clamping individual widths would grow the whole group. Apply
        // one common limit to preserve its width and the minimum content budget.
        // The transparent hit target grows as a small icon surface compresses.
        let fraction = 1;
        offsets.forEach((offset, index) => {
            if (offset < 0) fraction = Math.min(fraction, (widths[index] - minimumWidths[index]) / -offset);
        });
        const displacement = offsets.map((offset) => offset * Math.max(0, fraction));
        return { widths: widths.map((width, index) => width + displacement[index]), offsets: displacement };
    });
    const actualWidths = useDerivedValue(() => pressGeometry.get().widths);
    const pressOffsets = useDerivedValue(() => pressGeometry.get().offsets);
    const interaction = useSharedValue({ index: -1, held: false });
    const springConfig = rawSpring(theme);
    // A disabled/removed item can never deliver PressOut. Its old UI transaction
    // must not leave its neighbours compressed, nor survive a size/variant swap.
    const interactionKey = JSON.stringify([
        variant,
        selectionMode,
        size,
        shape,
        buttonVariant,
        fullWidth,
        resolvedDensity,
        expansion,
        showSelectedIcon,
        widths,
        minimumWidths,
        items.map((item) => [
            item.value,
            // Icon-only labels are accessible names and never affect geometry.
            // Play/Pause or Mute/Unmute must retain their current press impulse.
            item.iconOnly ? null : item.label,
            item.disabled,
            item.size,
            item.widthVariant,
            item.shape,
            item.variant,
            item.iconOnly,
            Boolean(item.icon),
            item.weight,
            item.selectionMode,
        ]),
    ]);
    const pendingMenuAction = useRef<{ value: string; owner: string } | null>(null);
    const live = useRef({ alive: true, owner: interactionKey, disabled, items, selected, onValueChange });
    live.current = { ...live.current, owner: interactionKey, disabled, items, selected, onValueChange };
    useEffect(() => {
        live.current.alive = true;
        return () => {
            live.current.alive = false;
            pendingMenuAction.current = null;
        };
    }, []);
    useEffect(() => {
        cancelAnimation(presses);
        presses.set(items.map(() => 0));
        interaction.set({ index: -1, held: false });
        return () => cancelAnimation(presses);
    }, [interactionKey, visibleCount, width, disabled, reduced, interaction, presses]);
    useEffect(() => {
        pendingMenuAction.current = null;
        setMenuVisible(false);
    }, [disabled, interactionKey]);
    const enabledVisible = visible.map((item, index) => (!disabled && !item.disabled ? index : -1)).filter((index) => index >= 0);
    if (overflow.length && !disabled) enabledVisible.push(visibleCount);
    const keyboardIndex = enabledVisible.includes(focusedIndex) ? focusedIndex : (enabledVisible[0] ?? -1);
    const onItemKeyDown = (index: number, event: GroupKeyEvent) => {
        const key = event.nativeEvent ?? event;
        if (key.altKey || key.ctrlKey || key.metaKey || disabled) return;
        // The trigger can still own focus during the first opening frame.
        // Escape must cancel that opening before the menu moves focus inside.
        if (key.key === 'Escape' && menuVisible) {
            event.preventDefault();
            pendingMenuAction.current = null;
            setMenuVisible(false);
            return;
        }
        let target: number | undefined;
        const position = enabledVisible.indexOf(index);
        if (position < 0) return;
        if (key.key === 'Home') target = enabledVisible[0];
        else if (key.key === 'End') target = enabledVisible.at(-1);
        else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key.key)) {
            const horizontal = key.key === 'ArrowLeft' || key.key === 'ArrowRight';
            const step = (key.key === 'ArrowRight' || key.key === 'ArrowDown' ? 1 : -1) * (horizontal && direction === 'rtl' ? -1 : 1);
            target = enabledVisible[(position + step + enabledVisible.length) % enabledVisible.length];
        }
        if (target == null) return;
        event.preventDefault();
        setFocusedIndex(target);
        focusRefs.current[target]?.focus();
    };
    useAnimatedReaction(
        () => {
            const state = interaction.get();
            return !reduced && !state.held && state.index >= 0 && (presses.get()[state.index] ?? 0) > 0.75;
        },
        (release) => {
            if (!release) return;
            interaction.set({ index: -1, held: false });
            presses.set(
                withSpring(
                    presses.get().map(() => 0),
                    springConfig
                )
            );
        }
    );
    const enabledItems = items.map((item) => !disabled && !item.disabled);
    const updatePress = (index: number, down: boolean) => {
        'worklet';
        // Keep PressIn and PressOut ordered on UI. Reading interaction on RN
        // immediately after a queued PressIn write can miss a short tap's release.
        if (!down && !reduced) {
            if (interaction.get().index === index) interaction.set({ index, held: false });
            return;
        }
        interaction.set({ index: down ? index : -1, held: down });
        const next = enabledItems.map((enabled, i) => (down && i === index && enabled ? 1 : 0));
        presses.set(reduced ? next : withSpring(next, springConfig));
    };
    const onPressChange = (index: number, down: boolean) => scheduleOnUI(updatePress, index, down);
    const activate = (item: ButtonGroupItem) => {
        const current = live.current;
        const target = current.items.find((entry) => entry.value === item.value);
        if (!current.alive || current.owner !== interactionKey || current.disabled || !target || target.disabled) return;
        target.onPress?.();
        const selection = itemSelectionMode(target);
        if (selection === 'single') current.onValueChange?.(current.selected.has(target.value) && allowEmptySelection ? '' : target.value);
        if (selection === 'multiple')
            current.onValueChange?.(
                current.selected.has(target.value)
                    ? [...current.selected].filter((entry) => entry !== target.value)
                    : [...current.selected, target.value]
            );
    };
    return (
        <View
            accessible={false}
            accessibilityRole={
                selectionMode === 'single' && items.every((item) => itemSelectionMode(item) === 'single') ? 'radiogroup' : undefined
            }
            accessibilityLabel={accessibilityLabel}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
            style={style}
            testID={testID}
        >
            <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                pointerEvents="none"
                // Natural-width probes must not extend the web scrollable area.
                // Children retain flexShrink: 0 so clipping does not change measurement.
                style={{ position: 'absolute', opacity: 0, flexDirection: 'row', width: '100%', overflow: 'hidden' }}
            >
                {items.map((item) => {
                    const key = measurementKey(item);
                    const recordMeasurement = (labelWidth: number) =>
                        setMeasured((previous) => {
                            const width = Math.max(previous[key] ?? 0, labelWidth);
                            return previous[key] === width ? previous : { ...previous, [key]: width };
                        });
                    return (
                        <Text
                            key={key}
                            onTextLayout={(event) => {
                                const labelWidth = Math.max(0, ...event.nativeEvent.lines.map((line) => line.width));
                                recordMeasurement(labelWidth);
                            }}
                            onLayout={(event) => recordMeasurement(event.nativeEvent.layout.width)}
                            style={{ flexShrink: 0 }}
                            variant={itemSpec(item).text}
                        >
                            {item.label}
                        </Text>
                    );
                })}
            </View>
            <View
                // Measure the actual content box as well, so caller padding does
                // not accidentally spend the full outer width on the buttons.
                onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
                style={{
                    direction,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap,
                    minHeight: items.length ? Math.max(48, ...visible.map((item) => itemSpec(item).height + 4 * resolvedDensity)) : 0,
                    opacity: width > 0 ? 1 : 0,
                }}
                pointerEvents={width > 0 ? 'auto' : 'none'}
                accessibilityElementsHidden={width <= 0}
                importantForAccessibility={width > 0 ? 'auto' : 'no-hide-descendants'}
            >
                {visible.map((item, index) => (
                    <GroupItem
                        key={item.value}
                        item={item}
                        index={index}
                        count={visibleCount}
                        width={widths[index]}
                        deltas={deltas}
                        actualWidths={actualWidths}
                        pressOffsets={pressOffsets}
                        presses={presses}
                        selected={itemSelectionMode(item) !== 'none' && selected.has(item.value)}
                        connected={connected}
                        size={itemSize(item)}
                        density={resolvedDensity}
                        groupShape={connected ? shape : (item.shape ?? shape)}
                        variant={itemVariant(item)}
                        selectionMode={itemSelectionMode(item)}
                        disabled={disabled || Boolean(item.disabled)}
                        showSelectedIcon={showSelectedIcon && itemSelectionMode(item) !== 'none'}
                        onPress={() => activate(item)}
                        onPressChange={onPressChange}
                        geometryKey={interactionKey}
                        onFocus={() => setFocusedIndex(index)}
                        // React Native and react-native-web expose different key-event
                        // types. This callback is installed only on the web host.
                        onKeyDown={(event) => onItemKeyDown(index, event as GroupKeyEvent)}
                        focusRef={(node) => {
                            focusRefs.current[index] =
                                node && typeof node === 'object' && 'focus' in node && typeof node.focus === 'function'
                                    ? (node as { focus: () => void })
                                    : null;
                        }}
                        tabIndex={index === keyboardIndex ? 0 : -1}
                        testID={`${testID}-${item.value}`}
                    />
                ))}
                {overflow.length ? (
                    <Menu
                        visible={menuVisible && !disabled}
                        onDismiss={() => {
                            pendingMenuAction.current = null;
                            setMenuVisible(false);
                        }}
                        onClosed={() => {
                            const pending = pendingMenuAction.current;
                            pendingMenuAction.current = null;
                            if (!pending || pending.owner !== live.current.owner) return;
                            const item = live.current.items.find((entry) => entry.value === pending.value);
                            if (item) activate(item);
                        }}
                        anchor={
                            <Tooltip title={overflowAccessibilityLabel}>
                                <IconButton
                                    ref={(node) => {
                                        focusRefs.current[visibleCount] = node;
                                    }}
                                    {...(Platform.OS === 'web'
                                        ? {
                                              tabIndex: visibleCount === keyboardIndex ? 0 : -1,
                                              onKeyDown: (event: unknown) => onItemKeyDown(visibleCount, event as GroupKeyEvent),
                                          }
                                        : {})}
                                    mode="contained"
                                    accessibilityLabel={overflowAccessibilityLabel}
                                    accessibilityState={{ expanded: menuVisible }}
                                    disabled={disabled}
                                    icon="dots-vertical"
                                    onPress={() => setMenuVisible(true)}
                                    onFocus={() => setFocusedIndex(visibleCount)}
                                    style={{ margin: 0, width: 48, height: 48 }}
                                    testID={`${testID}-overflow`}
                                />
                            </Tooltip>
                        }
                    >
                        {overflow.map((item) => (
                            <Menu.Item
                                key={item.value}
                                disabled={disabled || item.disabled}
                                closeOnPress={false}
                                selectionMode={
                                    itemSelectionMode(item) === 'single'
                                        ? 'single'
                                        : itemSelectionMode(item) === 'multiple'
                                          ? 'multiple'
                                          : undefined
                                }
                                selected={itemSelectionMode(item) === 'none' ? undefined : selected.has(item.value)}
                                leadingIcon={
                                    itemSelectionMode(item) !== 'none' && showSelectedIcon && selected.has(item.value) ? 'check' : item.icon
                                }
                                onPress={() => {
                                    pendingMenuAction.current = { value: item.value, owner: interactionKey };
                                    setMenuVisible(false);
                                }}
                                title={item.label}
                                accessibilityLabel={item.accessibilityLabel ?? item.label}
                                accessibilityState={{
                                    disabled: disabled || Boolean(item.disabled),
                                    ...(itemSelectionMode(item) !== 'none' ? { checked: selected.has(item.value) } : {}),
                                }}
                                testID={`${testID}-overflow-${item.value}`}
                            />
                        ))}
                    </Menu>
                ) : null}
            </View>
        </View>
    );
}
