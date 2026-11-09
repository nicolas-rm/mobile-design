/*
 * Segmented layout/icon-motion adapted from AndroidX SegmentedButton.kt,
 * Copyright The Android Open Source Project, Apache License2.0.
 * https://www.apache.org/licenses/LICENSE-2.0
 * Source androidx/androidx@d153d87ed76372ece0c99dac837ff07ab845d495.
 */
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import {
    StyleSheet,
    Platform,
    View,
    useWindowDimensions,
    type GestureResponderEvent,
    type StyleProp,
    type TextStyle,
    type ViewStyle,
} from 'react-native';
import { Icon, Text, useLocale, type Theme } from 'react-native-paper';
import { TouchableRipple } from '../ripple';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useMobileTheme, type MobileDesignThemeOptions } from '../core';
import { withAlpha } from '../color';
import { selectionSpring } from './selection-controls';
import { usePressScope } from './press-scope';

export type SegmentedButtonOption<T extends string = string> = {
    value: T;
    label?: string;
    icon?: ComponentProps<typeof Icon>['source'];
    disabled?: boolean;
    accessibilityLabel?: string;
    checkedColor?: string;
    uncheckedColor?: string;
    onPress?: (event: GestureResponderEvent) => void;
    showSelectedCheck?: boolean;
    style?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
    testID?: string;
};
export type SegmentedButtonsProps<T extends string = string> = {
    buttons: SegmentedButtonOption<T>[];
    density?: 'regular' | 'small' | 'medium' | 'high';
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    theme?: MobileDesignThemeOptions['theme'];
    accessibilityLabel?: string;
    testID?: string;
} & (
    | { value: T; onValueChange: (value: T) => void; multiSelect?: false }
    | { value: T[]; onValueChange: (value: T[]) => void; multiSelect: true }
);

/** Published outlined MD3 segmented buttons. Expressive recommends connected ButtonGroup instead.
 * The40dp visual preserves48dp interaction targets; keyboard arrows move focus without changing selection.
 */
export function SegmentedButtons<T extends string = string>(props: SegmentedButtonsProps<T>) {
    const {
        buttons,
        density = 'regular',
        disabled = false,
        style,
        theme: overrides,
        accessibilityLabel,
        testID = 'mobile-segmented-buttons',
    } = props;
    const theme = useMobileTheme(overrides),
        { direction } = useLocale();
    const { fontScale } = useWindowDimensions();
    const [measurements, setMeasurements] = useState<Record<string, number>>({});
    const [focusedValue, setFocusedValue] = useState<string | null>(null);
    const hosts = useRef<Record<string, { focus: () => void } | null>>({});
    const alive = useRef(true);
    const latest = useRef(props);
    latest.current = props;
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            hosts.current = {};
        };
    }, []);
    const isRTL = direction === 'rtl';
    const enabled = disabled ? [] : buttons.filter((option) => !option.disabled);
    const selectedValue = props.multiSelect ? undefined : enabled.find((option) => option.value === props.value)?.value;
    const focusableValue = enabled.find((option) => option.value === focusedValue)?.value ?? selectedValue ?? enabled[0]?.value;
    const activate = (value: T, event: GestureResponderEvent) => {
        const current = latest.current;
        const option = current.buttons.find((item) => item.value === value);
        if (!alive.current || current.disabled || !option || option.disabled) return;
        if (current.multiSelect)
            current.onValueChange(
                current.value.includes(value) ? current.value.filter((selected) => selected !== value) : [...current.value, value]
            );
        else if (current.value !== value) current.onValueChange(value);
        option.onPress?.(event);
    };
    const keyDown = (value: T, event: Parameters<NonNullable<ComponentProps<typeof TouchableRipple>['onKeyDown']>>[0]) => {
        const { key, altKey, ctrlKey, metaKey, isComposing } = event.nativeEvent;
        if (disabled || altKey || ctrlKey || metaKey || isComposing || !enabled.length) return;
        const index = enabled.findIndex((option) => option.value === value);
        if (index < 0) return;
        let next: SegmentedButtonOption<T> | undefined;
        if (key === 'Home') next = enabled[0];
        else if (key === 'End') next = enabled[enabled.length - 1];
        else if (key === 'ArrowLeft' || key === 'ArrowRight') {
            const step = (key === 'ArrowRight' ? 1 : -1) * (isRTL ? -1 : 1);
            next = enabled[(index + step + enabled.length) % enabled.length];
        } else if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
            // The web ripple handles Space on release for radios and checkboxes.
            // RN Web already handles Enter. Leave both paths to the press host.
            if (Platform.OS === 'web') return;
            event.preventDefault?.();
            activate(value, event as unknown as GestureResponderEvent);
            return;
        }
        if (!next) return;
        event.preventDefault?.();
        setFocusedValue(next.value);
        hosts.current[next.value]?.focus();
    };
    const measureKey = (option: SegmentedButtonOption<T>) =>
        JSON.stringify([option.label, fontScale, theme.fonts.labelLarge, option.labelStyle]);
    // The native row uses IntrinsicSize.Min and equal segment widths. Measure labels
    // independently so a tablet does not stretch two short choices across the pane.
    const segmentWidth = Math.max(
        48,
        ...buttons.map(
            (option) =>
                (option.label ? (measurements[measureKey(option)] ?? 48) : 0) +
                24 +
                (option.icon || (option.showSelectedCheck ?? Boolean(option.label)) ? 18 + (option.label ? 8 : 0) : 0)
        )
    );
    const naturalWidth = segmentWidth * buttons.length - Math.max(0, buttons.length - 1);
    return (
        <View
            accessibilityRole={props.multiSelect ? undefined : 'radiogroup'}
            accessibilityLabel={accessibilityLabel}
            {...(Platform.OS === 'web'
                ? {
                      role: props.multiSelect ? ('group' as const) : ('radiogroup' as const),
                      onBlur: (event: unknown) => {
                          const { currentTarget, relatedTarget } = event as { currentTarget: HTMLElement; relatedTarget: Node | null };
                          if (!props.multiSelect && !currentTarget.contains(relatedTarget)) setFocusedValue(null);
                      },
                  }
                : {})}
            style={[
                styles.row,
                {
                    direction: 'ltr',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    width: naturalWidth,
                    maxWidth: '100%',
                    alignSelf: 'flex-start',
                },
                style,
            ]}
            testID={testID}
        >
            <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                style={{ position: 'absolute', opacity: 0, flexDirection: 'row' }}
            >
                {buttons
                    .filter((option) => option.label)
                    .map((option) => (
                        <Text
                            key={JSON.stringify([option.value, measureKey(option)])}
                            variant="labelLarge"
                            style={[{ flexShrink: 0 }, option.labelStyle]}
                            onLayout={
                                Platform.OS === 'web'
                                    ? (event) => {
                                          const width = Math.ceil(event.nativeEvent.layout.width) + 1;
                                          const key = measureKey(option);
                                          setMeasurements((old) => (old[key] === width ? old : { ...old, [key]: width }));
                                      }
                                    : undefined
                            }
                            onTextLayout={(event) => {
                                const width = Math.ceil(Math.max(0, ...event.nativeEvent.lines.map((line) => line.width))) + 1;
                                const key = measureKey(option);
                                setMeasurements((old) => (old[key] === width ? old : { ...old, [key]: width }));
                            }}
                        >
                            {option.label}
                        </Text>
                    ))}
            </View>
            {buttons.map((option, index) => (
                <Segment
                    key={option.value}
                    option={option}
                    theme={theme}
                    selected={props.multiSelect ? props.value.includes(option.value) : props.value === option.value}
                    disabled={disabled || Boolean(option.disabled)}
                    density={density}
                    first={index === 0}
                    last={index === buttons.length - 1}
                    isRTL={isRTL}
                    multiSelect={Boolean(props.multiSelect)}
                    tabIndex={focusableValue === option.value ? 0 : -1}
                    focusRef={(host) => {
                        const node: unknown = host;
                        hosts.current[option.value] =
                            node && typeof node === 'object' && 'focus' in node && typeof node.focus === 'function'
                                ? (node as { focus: () => void })
                                : null;
                    }}
                    onFocus={() => setFocusedValue(option.value)}
                    onKeyDown={(event) => keyDown(option.value, event)}
                    onPress={(event) => activate(option.value, event)}
                    testID={option.testID ?? `${testID}-${option.value}`}
                />
            ))}
        </View>
    );
}
function Segment<T extends string>({
    option,
    theme,
    selected,
    disabled,
    density,
    first,
    last,
    isRTL,
    multiSelect,
    tabIndex,
    focusRef,
    onFocus,
    onKeyDown,
    onPress,
    testID,
}: {
    option: SegmentedButtonOption<T>;
    theme: Theme;
    selected: boolean;
    disabled: boolean;
    density: 'regular' | 'small' | 'medium' | 'high';
    first: boolean;
    last: boolean;
    isRTL: boolean;
    multiSelect: boolean;
    tabIndex: 0 | -1;
    focusRef: ComponentProps<typeof TouchableRipple>['ref'];
    onFocus: () => void;
    onKeyDown: ComponentProps<typeof TouchableRipple>['onKeyDown'];
    onPress: (event: GestureResponderEvent) => void;
    testID: string;
}) {
    const { fontScale } = useWindowDimensions();
    const [focused, setFocused] = useState(false),
        [hovered, setHovered] = useState(false);
    const canPress = usePressScope(disabled, option.value);
    useEffect(() => {
        if (disabled) {
            setFocused(false);
            setHovered(false);
        }
    }, [disabled]);
    const showSelectedCheck = option.showSelectedCheck ?? Boolean(option.label);
    const checkVisible = selected && showSelectedCheck;
    const check = useSharedValue(Number(checkVisible));
    const effects = useSharedValue(Number(checkVisible));
    const reserveIcon = Boolean(option.icon) || showSelectedCheck;
    const labelOffset = useSharedValue(!option.icon && !checkVisible ? -13 : 0);
    useEffect(() => {
        const scale = theme.animation.scale;
        // SegmentedButtonDefaults.Icon: an existing icon crossfades without scaling.
        // A new check uses TransformOrigin(0,1), including RTL; exit is immediate.
        check.set(!scale || option.icon || !checkVisible ? Number(checkVisible) : withSpring(1, selectionSpring(theme, 'fast', 'spatial')));
        effects.set(
            !scale || (!option.icon && !checkVisible)
                ? Number(checkVisible)
                : withSpring(Number(checkVisible), selectionSpring(theme, 'default', 'effects'))
        );
        const offset = !option.icon && !checkVisible ? -13 : 0;
        labelOffset.set(!scale ? offset : withSpring(offset, selectionSpring(theme, 'fast', 'spatial')));
    }, [checkVisible, option.icon, theme, check, effects, labelOffset]);
    useEffect(
        () => () => {
            cancelAnimation(check);
            cancelAnimation(effects);
            cancelAnimation(labelOffset);
        },
        [check, effects, labelOffset]
    );
    const checkStyle = useAnimatedStyle(() => ({
        opacity: Math.min(1, Math.max(0, effects.get())),
        transform: [{ scale: option.icon ? 1 : Math.max(0, check.get()) }],
    }));
    const iconStyle = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, Math.max(0, effects.get())) }));
    const labelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: reserveIcon ? labelOffset.get() * (isRTL ? -1 : 1) : 0 }] }));
    const color = disabled
        ? theme.colors.onSurface
        : selected
          ? (option.checkedColor ?? theme.colors.onSecondaryContainer)
          : (option.uncheckedColor ?? theme.colors.onSurface);
    const baseHeight = { regular: 40, small: 36, medium: 32, high: 28 }[density];
    const lineHeight = theme.fonts.labelLarge.lineHeight ?? 20;
    const height = Math.max(baseHeight, lineHeight * fontScale + Math.max(0, baseHeight - 20));
    const targetInset = Math.max(0, (48 - height) / 2);
    const startCorner = first ? height / 2 : 0,
        endCorner = last ? height / 2 : 0;
    const corners = {
        borderTopLeftRadius: isRTL ? endCorner : startCorner,
        borderBottomLeftRadius: isRTL ? endCorner : startCorner,
        borderTopRightRadius: isRTL ? startCorner : endCorner,
        borderBottomRightRadius: isRTL ? startCorner : endCorner,
    };
    return (
        <View
            style={[
                styles.target,
                {
                    minHeight: Math.max(48, height),
                    marginLeft: !isRTL && !first ? -1 : 0,
                    marginRight: isRTL && !first ? -1 : 0,
                    zIndex: focused ? 2 : selected ? 1 : 0,
                },
                option.style,
            ]}
        >
            <View style={{ height }}>
                <TouchableRipple
                    key={disabled ? 'inactive' : 'interactive'}
                    ref={focusRef}
                    disabled={disabled}
                    onPress={(event) => {
                        if (canPress()) onPress(event);
                    }}
                    tabIndex={tabIndex}
                    onKeyDown={(event) => {
                        const { key, altKey, ctrlKey, metaKey, isComposing } = event.nativeEvent;
                        if (
                            !altKey &&
                            !ctrlKey &&
                            !metaKey &&
                            !isComposing &&
                            ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' ', 'Spacebar'].includes(key)
                        )
                            setFocused(true);
                        onKeyDown?.(event);
                    }}
                    onPressIn={(event) => {
                        if (Platform.OS === 'web') setFocused(typeof (event.nativeEvent as { key?: unknown }).key === 'string');
                    }}
                    onFocus={(event) => {
                        if (!canPress()) return;
                        const target = event.currentTarget as unknown as { matches?: (selector: string) => boolean };
                        setFocused(Platform.OS !== 'web' || (target.matches?.(':focus-visible') ?? true));
                        onFocus();
                    }}
                    onBlur={() => setFocused(false)}
                    onHoverIn={() => {
                        if (canPress()) setHovered(true);
                    }}
                    onHoverOut={() => setHovered(false)}
                    accessibilityRole={multiSelect ? 'checkbox' : 'radio'}
                    accessibilityLabel={option.accessibilityLabel ?? option.label ?? option.value}
                    accessibilityState={{ checked: selected, disabled }}
                    {...(Platform.OS === 'web'
                        ? { 'aria-checked': selected, 'aria-disabled': disabled, dataSet: { mobileDesignHitTarget: 'true' } }
                        : {})}
                    hitSlop={{ top: targetInset, bottom: targetInset }}
                    rippleColor={typeof color === 'string' ? withAlpha(color, 0.1) : theme.colors.stateLayerPressed}
                    style={[
                        corners,
                        { height, overflow: Platform.OS === 'web' ? 'visible' : 'hidden', backgroundColor: 'transparent' },
                        Platform.OS === 'web'
                            ? { height: height + targetInset * 2, paddingVertical: targetInset, marginVertical: -targetInset }
                            : undefined,
                    ]}
                    testID={testID}
                >
                    <View
                        pointerEvents="none"
                        style={[
                            styles.segment,
                            corners,
                            { height, backgroundColor: selected ? theme.colors.secondaryContainer : 'transparent' },
                        ]}
                    >
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                corners,
                                {
                                    borderWidth: 1,
                                    borderColor: disabled ? theme.colors.onSurface : theme.colors.outline,
                                    opacity: disabled ? 0.12 : 1,
                                },
                            ]}
                        />
                        {!disabled && (focused || hovered) ? (
                            <View style={[StyleSheet.absoluteFill, corners, { backgroundColor: color, opacity: focused ? 0.1 : 0.08 }]} />
                        ) : null}
                        <View
                            style={[
                                styles.content,
                                { direction: 'ltr', flexDirection: isRTL ? 'row-reverse' : 'row', opacity: disabled ? 0.38 : 1 },
                            ]}
                        >
                            {reserveIcon ? (
                                <View
                                    style={{
                                        width: 18,
                                        height: 18,
                                        marginLeft: isRTL && option.label ? 8 : 0,
                                        marginRight: !isRTL && option.label ? 8 : 0,
                                    }}
                                >
                                    {option.icon ? (
                                        <Animated.View style={[styles.icon, iconStyle]}>
                                            <Icon source={option.icon} size={18} color={color} />
                                        </Animated.View>
                                    ) : null}
                                    <Animated.View style={[styles.icon, { transformOrigin: '0% 100%' }, checkStyle]}>
                                        <Icon source="check" size={18} color={color} />
                                    </Animated.View>
                                </View>
                            ) : null}
                            {option.label ? (
                                <Animated.View style={[{ minWidth: 0, flexShrink: 1 }, labelStyle]}>
                                    <Text
                                        variant="labelLarge"
                                        numberOfLines={1}
                                        style={[{ color, writingDirection: isRTL ? 'rtl' : 'ltr' }, option.labelStyle]}
                                    >
                                        {option.label}
                                    </Text>
                                </Animated.View>
                            ) : null}
                        </View>
                    </View>
                </TouchableRipple>
                {focused && !disabled ? (
                    <View pointerEvents="none" style={[styles.focus, corners, { borderColor: theme.colors.secondary }]} />
                ) : null}
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    target: { flex: 1, minWidth: 48, justifyContent: 'center' },
    segment: { paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', overflow: 'visible' },
    content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', maxWidth: '100%' },
    icon: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
    focus: { position: 'absolute', left: -5, right: -5, top: -5, bottom: -5, borderWidth: 3 },
});
