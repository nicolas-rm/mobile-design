import {
    createContext,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ComponentProps,
    type ReactNode,
    type Ref,
} from 'react';
import { Platform, StyleSheet, View, type ColorValue, type GestureResponderEvent, type ViewInstance } from 'react-native';
import {
    Text,
    useLocale,
    type CheckboxProps,
    type CheckboxItemProps,
    type RadioButtonProps,
    type RadioButtonItemProps,
    type Theme,
} from 'react-native-paper';
import { TouchableRipple } from '../ripple';
import Svg, { Path } from 'react-native-svg';
import Animated, {
    ReduceMotion,
    cancelAnimation,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useMobileTheme } from '../core';
import { withAlpha } from '../color';
import { orderFocusTargets } from './focus-order';
import { usePressScope } from './press-scope';

const AnimatedPath = Animated.createAnimatedComponent(Path);
/** AndroidX MotionScheme tokens contain damping ratios, rather than damping coefficients. */
export function selectionSpring(theme: Theme, speed: 'fast' | 'default', kind: 'spatial' | 'effects') {
    'worklet';
    const token = theme.motion.spring[speed][kind];
    return {
        stiffness: token.stiffness,
        damping: token.damping * 2 * Math.sqrt(token.stiffness),
        mass: 1,
        reduceMotion: ReduceMotion.Never,
    };
}
type VisualProps = {
    status: 'checked' | 'unchecked' | 'indeterminate';
    radio?: boolean;
    disabled?: boolean;
    error?: boolean;
    color?: ColorValue;
    uncheckedColor?: ColorValue;
    interacted?: boolean;
    theme: Theme;
};
/** CheckboxTokens14.1 / RadioButtonTokens0.117: box18, radio20, stroke2. */
function SelectionVisual({ status, radio, disabled, error, color, uncheckedColor, interacted, theme }: VisualProps) {
    const selected = status !== 'unchecked';
    const fill = useSharedValue(Number(selected));
    const draw = useSharedValue(Number(selected));
    const gravitation = useSharedValue(status === 'indeterminate' ? 1 : 0);
    const [lastGlyph, setLastGlyph] = useState(status === 'indeterminate' ? 1 : 0);
    const nextGlyph = selected ? (status === 'indeterminate' ? 1 : 0) : lastGlyph;
    if (nextGlyph !== lastGlyph) setLastGlyph(nextGlyph);
    const scale = theme.animation.scale;
    useEffect(() => {
        fill.set(
            disabled || !scale
                ? Number(selected)
                : withSpring(Number(selected), selectionSpring(theme, selected ? 'default' : 'fast', 'effects'))
        );
        if (radio)
            draw.set(disabled || !scale ? Number(selected) : withSpring(Number(selected), selectionSpring(theme, 'fast', 'spatial')));
        else if (!selected)
            draw.set(
                disabled || !scale
                    ? 0
                    : withDelay(100 * scale, withTiming(0, { duration: 0, reduceMotion: ReduceMotion.Never }), ReduceMotion.Never)
            );
        else draw.set(disabled || !scale ? 1 : withSpring(1, selectionSpring(theme, 'default', 'spatial')));
        gravitation.set(disabled || !scale ? nextGlyph : withSpring(nextGlyph, selectionSpring(theme, 'default', 'spatial')));
        return () => {
            cancelAnimation(fill);
            cancelAnimation(draw);
            cancelAnimation(gravitation);
        };
    }, [selected, nextGlyph, disabled, radio, scale, theme, fill, draw, gravitation]);
    const selectedColor = disabled ? theme.colors.onSurface : (color ?? (error ? theme.colors.error : theme.colors.primary));
    const outlineColor = disabled
        ? theme.colors.onSurface
        : (uncheckedColor ?? (error ? theme.colors.error : interacted ? theme.colors.onSurface : theme.colors.onSurfaceVariant));
    const glyphColor = disabled ? theme.colors.surface : error ? theme.colors.onError : theme.colors.onPrimary;
    const fillStyle = useAnimatedStyle(() => ({
        backgroundColor:
            disabled || !scale || typeof selectedColor !== 'string'
                ? selectedColor
                : withSpring(selectedColor, selectionSpring(theme, selected ? 'default' : 'fast', 'effects')),
        opacity: Math.min(1, Math.max(0, fill.get())) * (disabled ? 0.38 : 1),
    }));
    const outlineStyle = useAnimatedStyle(() => ({
        borderColor:
            disabled || !scale || typeof outlineColor !== 'string'
                ? outlineColor
                : withSpring(outlineColor, selectionSpring(theme, 'fast', 'effects')),
        opacity: (1 - Math.min(1, Math.max(0, fill.get()))) * (disabled ? 0.38 : 1),
    }));
    const radioColor = selected ? selectedColor : outlineColor;
    const radioOutline = useAnimatedStyle(() => ({
        borderColor:
            disabled || !scale || typeof radioColor !== 'string'
                ? radioColor
                : withSpring(radioColor, selectionSpring(theme, 'default', 'effects')),
        opacity: disabled ? 0.38 : 1,
    }));
    const dotStyle = useAnimatedStyle(() => ({
        backgroundColor: disabled || !scale || typeof selectedColor !== 'string' ? selectedColor : withSpring(selectedColor, selectionSpring(theme, 'default', 'effects')),
        transform: [{ scale: Math.max(0, draw.get()) }],
        opacity: disabled ? 0.38 : 1,
    }));
    const pathProps = useAnimatedProps(() => {
        const g = Math.min(1, Math.max(0, gravitation.get()));
        const crossX = 7.2 + 1.8 * g,
            crossY = 11.7 - 2.7 * g,
            rightY = 5.4 + 3.6 * g;
        const length = Math.hypot(crossX - 4.5, crossY - 9) + Math.hypot(13.5 - crossX, rightY - crossY);
        return {
            d: `M4.5 9 L${crossX} ${crossY} L13.5 ${rightY}`,
            strokeDasharray: [length, length],
            strokeDashoffset: length * (1 - Math.min(1, Math.max(0, draw.get()))),
        };
    });
    if (radio)
        return (
            <View pointerEvents="none" style={styles.radio}>
                <Animated.View style={[styles.radioOutline, radioOutline]} />
                <Animated.View style={[styles.radioDot, dotStyle]} />
            </View>
        );
    return (
        <View pointerEvents="none" style={styles.box}>
            <Animated.View style={[styles.boxOutline, { borderColor: outlineColor }, outlineStyle]} />
            <Animated.View style={[styles.boxFill, { backgroundColor: selectedColor }, fillStyle]} />
            <Svg width={18} height={18} viewBox="0 0 18 18">
                <AnimatedPath
                    animatedProps={pathProps}
                    fill="none"
                    stroke={glyphColor}
                    strokeWidth={2}
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                />
            </Svg>
        </View>
    );
}

/** Unified visual states keep hover/focus/press outline colors current, rather than a static Paper glyph. */
type RowState = { focused: boolean; hovered: boolean; pressed: boolean };
type ItemInteractions = Pick<
    ComponentProps<typeof TouchableRipple>,
    'onFocus' | 'onBlur' | 'onHoverIn' | 'onHoverOut' | 'onPressIn' | 'onPressOut'
>;
function useRowInteraction(disabled: boolean) {
    const [state, setState] = useState<RowState>({ focused: false, hovered: false, pressed: false });
    useEffect(() => {
        if (disabled) setState({ focused: false, hovered: false, pressed: false });
    }, [disabled]);
    return {
        state,
        handlers: {
            onFocus: (focused = true) => setState((previous) => ({ ...previous, focused })),
            onBlur: () => setState((previous) => ({ ...previous, focused: false, pressed: false })),
            onHoverIn: () => setState((previous) => ({ ...previous, hovered: true })),
            onHoverOut: () => setState((previous) => ({ ...previous, hovered: false })),
            onPressIn: () => setState((previous) => ({ ...previous, pressed: true })),
            onPressOut: () => setState((previous) => ({ ...previous, pressed: false })),
        },
    };
}
/** The 48dp hit target is larger than RadioButton's 40dp state layer. */
function RadioStateLayer({ color, hovered, pressed, disabled, theme }: {
    color: ColorValue; hovered: boolean; pressed: boolean; disabled: boolean; theme: Theme;
}) {
    const opacity = useSharedValue(0);
    useEffect(() => {
        const next = disabled ? 0 : pressed ? 0.1 : hovered ? 0.08 : 0;
        opacity.set(disabled || !theme.animation.scale ? next : withTiming(next, {
            duration: theme.motion.duration.short2 * theme.animation.scale, reduceMotion: ReduceMotion.Never,
        }));
        return () => cancelAnimation(opacity);
    }, [hovered, pressed, disabled, theme, opacity]);
    const animated = useAnimatedStyle(() => ({ opacity: opacity.get() }));
    return <Animated.View style={[styles.stateLayer, { backgroundColor: color }, animated]} />;
}
function Control({
    radio,
    rowState,
    status,
    disabled = false,
    error,
    color,
    uncheckedColor,
    theme: overrides,
    style,
    onPress,
    onFocus,
    onBlur,
    onHoverIn,
    onHoverOut,
    onPressIn,
    onPressOut,
    controlRef,
    ...props
}: CheckboxProps & { radio?: boolean; rowState?: RowState; controlRef?: Ref<ViewInstance>; tabIndex?: 0 | -1 }) {
    const theme = useMobileTheme(overrides);
    const canPress = usePressScope(disabled);
    const [ownFocus, setFocused] = useState(false),
        [ownHover, setHovered] = useState(false),
        [ownPress, setPressed] = useState(false),
        [keyboardPress, setKeyboardPress] = useState(false);
    useEffect(() => {
        if (disabled) {
            setFocused(false);
            setHovered(false);
            setPressed(false);
            setKeyboardPress(false);
        }
    }, [disabled]);
    const focused = rowState?.focused || ownFocus,
        hovered = rowState?.hovered || ownHover,
        pressed = rowState?.pressed || ownPress;
    const stateColor = error ? theme.colors.error : status === 'unchecked' ? theme.colors.onSurface : color ?? theme.colors.primary;
    const staticPress = !radio && pressed && Platform.OS === 'web' && theme.animation.scale === 0;
    return (
        <TouchableRipple
            key={disabled ? 'inactive' : 'interactive'}
            {...props}
            ref={controlRef}
            {...(Platform.OS === 'web' && props.accessible === false ? { 'aria-hidden': true, tabIndex: -1 } : {})}
            onPress={
                disabled || !onPress
                    ? undefined
                    : (event) => {
                          if (canPress()) onPress(event);
                      }
            }
            disabled={disabled}
            borderless
            centered
            {...(radio ? {
                // Web masks the indication at the padding edge; Android owns a
                // 20dp-radius ripple. The other renderers use the layer below.
                dataSet: { mobileDesignHitTarget: 'true', mobileDesignRippleRadius: '20' },
                background: { color: typeof stateColor === 'string' ? withAlpha(stateColor, 0.1) : theme.colors.stateLayerPressed, radius: 20, borderless: true },
                underlayColor: 'transparent',
            } : {})}
            rippleColor={typeof stateColor === 'string' ? withAlpha(stateColor, 0.1) : theme.colors.stateLayerPressed}
            accessibilityRole={props.accessible === false ? undefined : radio ? 'radio' : 'checkbox'}
            accessibilityState={
                props.accessible === false ? undefined : { checked: status === 'indeterminate' ? 'mixed' : status === 'checked', disabled }
            }
            onFocus={(event) => {
                const target = event.currentTarget as unknown as HTMLElement;
                if (disabled && Platform.OS === 'web') { target.blur(); return; }
                setFocused(Platform.OS !== 'web' || target.matches(':focus-visible'));
                onFocus?.(event);
            }}
            onBlur={(event) => {
                setFocused(false);
                setPressed(false);
                setKeyboardPress(false);
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
            onPressIn={(event) => {
                setPressed(true);
                setKeyboardPress(Boolean((event.nativeEvent as { key?: string }).key));
                if (Platform.OS === 'web' && !(event.nativeEvent as { key?: string }).key) setFocused(false);
                onPressIn?.(event);
            }}
            onPressOut={(event) => {
                setPressed(false);
                setKeyboardPress(false);
                onPressOut?.(event);
            }}
            style={[styles.touch, radio && { padding: 4, backgroundColor: 'transparent' }, style]}
        >
            <View pointerEvents="none" style={[styles.touch, radio && { width: 40, height: 40 }]}>
                {radio ? <RadioStateLayer color={stateColor} disabled={disabled} theme={theme}
                    hovered={!pressed && hovered}
                    pressed={Boolean(pressed && (rowState || keyboardPress || Platform.OS === 'ios' || !theme.animation.scale))} /> : null}
                {!radio && !disabled && (staticPress || hovered || focused) ? (
                    <View
                        style={[
                            styles.stateLayer,
                            {
                                backgroundColor: stateColor,
                                opacity: staticPress || focused ? 0.1 : 0.08,
                            },
                        ]}
                    />
                ) : null}
                {!disabled && focused ? <View style={[styles.focusRing, radio && styles.radioFocusRing, { borderColor: radio ? stateColor : theme.colors.secondary }]} /> : null}
                <SelectionVisual
                    theme={theme}
                    radio={radio}
                    status={status}
                    disabled={disabled}
                    error={error}
                    color={color}
                    uncheckedColor={uncheckedColor}
                    interacted={focused || hovered || pressed}
                />
            </View>
        </TouchableRipple>
    );
}
function CheckboxRoot(props: CheckboxProps) {
    return <Control {...props} />;
}
function CheckboxItem({
    status,
    disabled = false,
    label,
    description,
    error = false,
    labelStyle,
    labelVariant = 'bodyLarge',
    labelMaxFontSizeMultiplier,
    position = 'trailing',
    theme: overrides,
    style,
    accessibilityLabel = label,
    'aria-describedby': describedBy,
    onPress,
    ...props
}: CheckboxItemProps & ItemInteractions & { description?: string; error?: boolean; 'aria-describedby'?: string }) {
    const theme = useMobileTheme(overrides),
        { direction } = useLocale();
    const isRTL = direction === 'rtl';
    const interaction = useRowInteraction(disabled);
    const canPress = usePressScope(disabled);
    const descriptionId = useId();
    const descriptionIds = [describedBy, description ? descriptionId : undefined].filter(Boolean).join(' ');
    const control = (
        <Control
            {...props}
            testID={props.testID ? `${props.testID}-control` : undefined}
            rowState={interaction.state}
            status={status}
            disabled={disabled}
            error={error}
            accessible={false}
            theme={theme}
        />
    );
    const stateColor = error ? theme.colors.error : status === 'unchecked' ? theme.colors.onSurface : theme.colors.primary;
    return (
        <TouchableRipple
            key={disabled ? 'inactive' : 'interactive'}
            {...props}
            {...interaction.handlers}
            onFocus={(event) => {
                const target = event.currentTarget as unknown as HTMLElement;
                interaction.handlers.onFocus(Platform.OS !== 'web' || target.matches(':focus-visible'));
                props.onFocus?.(event);
            }}
            onBlur={(event) => {
                interaction.handlers.onBlur();
                props.onBlur?.(event);
            }}
            onHoverIn={(event) => {
                interaction.handlers.onHoverIn();
                props.onHoverIn?.(event);
            }}
            onHoverOut={(event) => {
                interaction.handlers.onHoverOut();
                props.onHoverOut?.(event);
            }}
            onPressIn={(event) => {
                interaction.handlers.onPressIn();
                props.onPressIn?.(event);
            }}
            onPressOut={(event) => {
                interaction.handlers.onPressOut();
                props.onPressOut?.(event);
            }}
            rippleColor={typeof stateColor === 'string' ? withAlpha(stateColor, 0.1) : theme.colors.stateLayerPressed}
            onPress={
                disabled || !onPress
                    ? undefined
                    : (event) => {
                          if (canPress()) onPress(event);
                      }
            }
            disabled={disabled}
            accessibilityRole="checkbox"
            accessibilityLabel={Platform.OS !== 'web' && description ? `${accessibilityLabel}. ${description}` : accessibilityLabel}
            {...(Platform.OS === 'web' && descriptionIds ? { 'aria-describedby': descriptionIds } : {})}
            accessibilityState={{ checked: status === 'indeterminate' ? 'mixed' : status === 'checked', disabled }}
            style={[styles.row, style]}
        >
            <View pointerEvents="none" style={[styles.rowContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {position === 'leading' && control}
                <View style={styles.labelGroup}>
                    <Text
                        variant={labelVariant}
                        maxFontSizeMultiplier={labelMaxFontSizeMultiplier}
                        style={[
                            { color: theme.colors.onSurface, opacity: disabled ? 0.38 : 1, textAlign: isRTL ? 'right' : 'left' },
                            labelStyle,
                        ]}
                    >
                        {label}
                    </Text>
                    {description ? (
                        <Text
                            nativeID={descriptionId}
                            variant="bodyMedium"
                            style={{
                                color: theme.colors.onSurfaceVariant,
                                opacity: disabled ? 0.38 : 1,
                                textAlign: isRTL ? 'right' : 'left',
                            }}
                        >
                            {description}
                        </Text>
                    ) : null}
                </View>
                {position === 'trailing' && control}
            </View>
        </TouchableRipple>
    );
}
export const Checkbox = Object.assign(CheckboxRoot, { Item: CheckboxItem });

type RadioGroupProps = {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
    accessibilityLabel?: string;
    testID?: string;
};
type RadioGroupContext = {
    value: string;
    onValueChange: (value: string) => void;
    tabStop: string | null;
    register: (key: string, focus: () => void, disabled: () => boolean, node: () => unknown) => () => void;
    refresh: () => void;
};
const RadioContext = createContext<RadioGroupContext | null>(null);
function RadioGroup({ value, onValueChange, children, accessibilityLabel, testID }: RadioGroupProps) {
    const root = useRef<ViewInstance>(null);
    const tabEntry = useRef<'forward' | 'backward' | null>(null);
    const targets = useRef(new Map<string, { id: string; node: () => unknown; focus: () => void; disabled: boolean }>());
    const [keys, setKeys] = useState<string[]>([]);
    const [emptyTabStop, setEmptyTabStop] = useState<string | null>(null);
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    const refresh = useMemo(
        () => () => {
            if (alive.current) setKeys([...targets.current.keys()]);
        },
        []
    );
    const register = useMemo(
        () => (key: string, focus: () => void, disabled: () => boolean, node: () => unknown) => {
            targets.current.set(key, {
                id: key,
                node,
                focus,
                get disabled() {
                    return disabled();
                },
            });
            setKeys([...targets.current.keys()]);
            return () => {
                targets.current.delete(key);
                if (alive.current) setKeys([...targets.current.keys()]);
            };
        },
        []
    );
    const enabled = orderFocusTargets(keys.flatMap((key) => (targets.current.has(key) ? [targets.current.get(key)!] : [])))
        .filter((target) => !target.disabled)
        .map((target) => target.id);
    const tabStop = enabled.includes(value) ? value : (enabled.includes(emptyTabStop ?? '') ? emptyTabStop : enabled[0] ?? null);
    const context = useMemo(
        () => ({ value, onValueChange, tabStop, register, refresh }),
        [value, onValueChange, tabStop, register, refresh]
    );
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const document = (root.current as unknown as HTMLElement | null)?.ownerDocument;
        if (!document) return;
        const key = (event: KeyboardEvent) => { tabEntry.current = event.key === 'Tab' ? (event.shiftKey ? 'backward' : 'forward') : null; };
        const pointer = () => { tabEntry.current = null; };
        document.addEventListener('keydown', key, true);
        document.addEventListener('pointerdown', pointer, true);
        return () => {
            document.removeEventListener('keydown', key, true);
            document.removeEventListener('pointerdown', pointer, true);
        };
    }, []);
    const keyboard =
        Platform.OS === 'web'
            ? {
                  onFocus: (event: { target?: unknown; currentTarget: unknown; relatedTarget?: unknown }) => {
                      const entry = tabEntry.current;
                      tabEntry.current = null;
                      const available = orderFocusTargets([...targets.current.values()]).filter((target) => !target.disabled);
                      if (available.some((target) => target.id === value)) return;
                      const focused = available.find((target) => (target.node() as HTMLElement)?.contains?.(event.target as Node));
                      if (focused) setEmptyTabStop(focused.id);
                      if (!entry || (event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) return;
                      // Tab enters an empty group at its first option; reverse
                      // Tab enters at its last. Neither action selects an option.
                      const next = entry === 'backward' ? available.at(-1) : available[0];
                      if (next) { setEmptyTabStop(next.id); next.focus(); }
                  },
                  onKeyDown: (event: { target?: unknown; nativeEvent: { key?: string }; preventDefault: () => void; stopPropagation: () => void }) => {
                      const key = event.nativeEvent.key;
                      const currentEnabled = orderFocusTargets([...targets.current.values()])
                          .filter((target) => !target.disabled)
                          .map((target) => target.id);
                      if (!currentEnabled.length || !['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(key ?? '')) return;
                      event.preventDefault();
                      event.stopPropagation();
                      const focused = currentEnabled.findIndex((key) => (targets.current.get(key)?.node() as HTMLElement)?.contains?.(event.target as Node));
                      const current = focused >= 0 ? focused : currentEnabled.indexOf(value);
                      const delta = key === 'ArrowDown' || key === 'ArrowRight' ? 1 : -1;
                      const next = currentEnabled[(Math.max(0, current) + delta + currentEnabled.length) % currentEnabled.length];
                      targets.current.get(next)?.focus();
                      if (next !== value) onValueChange(next);
                  },
              }
            : {};
    return (
        <RadioContext.Provider value={context}>
            <View ref={root} {...keyboard} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} testID={testID}>
                {children}
            </View>
        </RadioContext.Provider>
    );
}
function RadioRoot({ value, status, onPress, ...props }: RadioButtonProps) {
    const group = useContext(RadioContext);
    const canPress = usePressScope(Boolean(props.disabled), value);
    const target = useRef<ViewInstance>(null);
    const disabledRef = useRef(Boolean(props.disabled));
    disabledRef.current = Boolean(props.disabled);
    useEffect(
        () =>
            group?.register(
                value,
                () => target.current?.focus(),
                () => disabledRef.current,
                () => target.current
            ),
        [group?.register, value]
    );
    useEffect(() => {
        group?.refresh();
    }, [group?.refresh, props.disabled]);
    const checked = group ? group.value === value : status === 'checked';
    const checkedRef = useRef(checked);
    checkedRef.current = checked;
    const press = (event: GestureResponderEvent) => {
        if (canPress()) {
            if (group) {
                if (!checkedRef.current) group.onValueChange(value);
            } else if (!checkedRef.current) onPress?.(event);
        }
    };
    return (
        <Control
            {...props}
            controlRef={target}
            tabIndex={group && group.tabStop !== value ? -1 : 0}
            radio
            status={checked ? 'checked' : 'unchecked'}
            onPress={press}
        />
    );
}
function RadioItem({
    value,
    status,
    label,
    description,
    labelStyle,
    labelVariant = 'bodyLarge',
    labelMaxFontSizeMultiplier,
    position = 'trailing',
    disabled = false,
    theme: overrides,
    onPress,
    style,
    accessibilityLabel = label,
    'aria-describedby': describedBy,
    ...props
}: Omit<RadioButtonItemProps, 'mode'> & ItemInteractions & { description?: string; accessibilityHint?: string; 'aria-describedby'?: string }) {
    const theme = useMobileTheme(overrides),
        { direction } = useLocale(),
        group = useContext(RadioContext);
    const isRTL = direction === 'rtl';
    const interaction = useRowInteraction(disabled);
    const canPress = usePressScope(disabled, value);
    const descriptionId = useId();
    const descriptionIds = [describedBy, description ? descriptionId : undefined].filter(Boolean).join(' ');
    const target = useRef<ViewInstance>(null);
    const disabledRef = useRef(disabled);
    disabledRef.current = disabled;
    useEffect(
        () =>
            group?.register(
                value,
                () => target.current?.focus(),
                () => disabledRef.current,
                () => target.current
            ),
        [group?.register, value]
    );
    useEffect(() => {
        group?.refresh();
    }, [group?.refresh, disabled]);
    const checked = group ? group.value === value : status === 'checked';
    const checkedRef = useRef(checked);
    checkedRef.current = checked;
    const press = (event: GestureResponderEvent) => {
        if (canPress()) {
            if (group) {
                if (!checkedRef.current) group.onValueChange(value);
            } else if (!checkedRef.current) onPress?.(event);
        }
    };
    const control = (
        <Control
            {...props}
            radio
            testID={props.testID ? `${props.testID}-control` : undefined}
            rowState={interaction.state}
            status={checked ? 'checked' : 'unchecked'}
            disabled={disabled}
            accessible={false}
            theme={theme}
        />
    );
    return (
        <TouchableRipple
            key={disabled ? 'inactive' : 'interactive'}
            {...props}
            ref={target}
            tabIndex={group && group.tabStop !== value ? -1 : 0}
            {...interaction.handlers}
            onFocus={(event) => {
                const target = event.currentTarget as unknown as HTMLElement;
                if (disabled && Platform.OS === 'web') { target.blur(); return; }
                interaction.handlers.onFocus(Platform.OS !== 'web' || target.matches(':focus-visible'));
                props.onFocus?.(event);
            }}
            onBlur={(event) => {
                interaction.handlers.onBlur();
                props.onBlur?.(event);
            }}
            onHoverIn={(event) => {
                interaction.handlers.onHoverIn();
                props.onHoverIn?.(event);
            }}
            onHoverOut={(event) => {
                interaction.handlers.onHoverOut();
                props.onHoverOut?.(event);
            }}
            onPressIn={(event) => {
                interaction.handlers.onPressIn();
                if (Platform.OS === 'web' && !(event.nativeEvent as { key?: string }).key) interaction.handlers.onFocus(false);
                props.onPressIn?.(event);
            }}
            onPressOut={(event) => {
                interaction.handlers.onPressOut();
                props.onPressOut?.(event);
            }}
            rippleColor="transparent"
            underlayColor="transparent"
            onPress={press}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={props.accessibilityHint ?? description}
            {...(Platform.OS === 'web' && descriptionIds ? { 'aria-describedby': descriptionIds } : {})}
            accessibilityState={{ checked, disabled }}
            style={[styles.row, { backgroundColor: 'transparent' }, style]}
        >
            <View pointerEvents="none" style={[styles.rowContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {position === 'leading' && control}
                <View style={styles.labelGroup}>
                    <Text
                        variant={labelVariant}
                        maxFontSizeMultiplier={labelMaxFontSizeMultiplier}
                        style={[
                            { color: theme.colors.onSurface, opacity: disabled ? 0.38 : 1, textAlign: isRTL ? 'right' : 'left' },
                            labelStyle,
                        ]}
                    >
                        {label}
                    </Text>
                    {description ? (
                        <Text
                            nativeID={descriptionId}
                            variant="bodyMedium"
                            style={{
                                color: theme.colors.onSurfaceVariant,
                                opacity: disabled ? 0.38 : 1,
                                textAlign: isRTL ? 'right' : 'left',
                            }}
                        >
                            {description}
                        </Text>
                    ) : null}
                </View>
                {position === 'trailing' && control}
            </View>
        </TouchableRipple>
    );
}
/** The circular Material radio is used on both platforms. */
export const RadioButton = Object.assign(RadioRoot, { Group: RadioGroup, Item: RadioItem });
const styles = StyleSheet.create({
    touch: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
    stateLayer: { position: 'absolute', width: 40, height: 40, borderRadius: 20 },
    focusRing: { position: 'absolute', width: 40, height: 40, borderRadius: 20, borderWidth: 3 },
    radioFocusRing: { width: 30, height: 30, borderRadius: 15 },
    box: { width: 18, height: 18 },
    boxOutline: { ...StyleSheet.absoluteFill, borderRadius: 2, borderWidth: 2 },
    boxFill: { ...StyleSheet.absoluteFill, borderRadius: 2 },
    radio: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
    radioOutline: { ...StyleSheet.absoluteFill, borderRadius: 10, borderWidth: 2 },
    radioDot: { width: 10, height: 10, borderRadius: 5 },
    row: { minHeight: 48, paddingHorizontal: 8 },
    rowContent: { direction: 'ltr', flexDirection: 'row', alignItems: 'center', minHeight: 48 },
    labelGroup: { flex: 1, minWidth: 0, paddingHorizontal: 8, paddingVertical: 12 },
});
