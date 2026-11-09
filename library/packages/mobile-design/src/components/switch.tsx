import { TouchableRipple } from '../ripple';
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { Platform, StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, useLocale, type Theme } from 'react-native-paper';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useMobileTheme, type MobileDesignThemeOptions } from '../core';
import { selectionSpring } from './selection-controls';
import { usePressScope } from './press-scope';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

export type SwitchProps = {
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    disabled?: boolean;
    checkedIcon?: ComponentProps<typeof Icon>['source'];
    uncheckedIcon?: ComponentProps<typeof Icon>['source'];
    /** Set false when a parent row owns the switch semantics and activation. */
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
    theme?: MobileDesignThemeOptions['theme'];
};
/** SwitchTokens0.210: 52×32 track, 16/24dp handle, immediate28dp pressed handle. */
export function Switch({
    value = false,
    onValueChange,
    disabled = false,
    checkedIcon,
    uncheckedIcon,
    accessible = true,
    accessibilityLabel,
    accessibilityHint,
    style,
    testID = 'mobile-switch',
    theme: overrides,
}: SwitchProps) {
    const theme = useMobileTheme(overrides),
        { direction } = useLocale();
    const isRTL = direction === 'rtl';
    const blocked = disabled || !onValueChange;
    const semantic = accessible && Boolean(onValueChange || disabled);
    const configuration = `${Number(value)}:${Number(blocked)}:${direction}`;
    const generation = useRef({ configuration, revision: 0 });
    if (generation.current.configuration !== configuration) {
        generation.current = { configuration, revision: generation.current.revision + 1 };
    }
    const pressRevision = generation.current.revision;
    const canPress = usePressScope(blocked, configuration);
    const canInteract = usePressScope(blocked);
    const latest = useRef({ configuration, onValueChange });
    const [pressed, setPressed] = useState(false),
        [hovered, setHovered] = useState(false),
        [focused, setFocused] = useState(false),
        [dragActive, setDragActive] = useState(false);
    // Start/end can be delivered in one RN batch. Even when dragActive ends
    // where it began, a controlled owner may reject the requested selection.
    const [settlement, setSettlement] = useState(0);
    const pressing = !blocked && (pressed || dragActive);
    const interacted = !blocked && (pressing || hovered || focused);
    const hasIcon = value ? Boolean(checkedIcon) : Boolean(uncheckedIcon);
    const selected = useSharedValue(Number(value));
    const colorSelected = useSharedValue(Number(value));
    const dragging = useSharedValue(false);
    const tapBlocked = useSharedValue(false);
    const pointerX = useSharedValue(0);
    const pointerY = useSharedValue(0);
    const pressOwner = useSharedValue(pressRevision);
    const dragOrigin = useSharedValue(Number(value));
    const configurationUI = useSharedValue(configuration);
    const thumbSize = useSharedValue(hasIcon || value ? 24 : 16);
    const scale = theme.animation.scale;
    useLayoutEffect(() => {
        latest.current = { configuration, onValueChange };
    }, [configuration, onValueChange]);
    useLayoutEffect(() => {
        configurationUI.set(configuration);
        dragging.set(false);
        setDragActive(false);
        setPressed(false);
        if (blocked) {
            setHovered(false);
            setFocused(false);
        }
    }, [blocked, configuration, configurationUI, dragging]);
    useEffect(() => {
        if (!dragging.get())
            selected.set(
                !scale || pressing
                    ? withTiming(Number(value), { duration: 0, reduceMotion: ReduceMotion.Never })
                    : withSpring(Number(value), selectionSpring(theme, 'fast', 'spatial'))
            );
        const size = pressing ? 28 : hasIcon || value ? 24 : 16;
        thumbSize.set(
            !scale || pressing
                ? withTiming(size, { duration: 0, reduceMotion: ReduceMotion.Never })
                : withSpring(size, selectionSpring(theme, 'fast', 'spatial'))
        );
        colorSelected.set(!scale || disabled ? Number(value) : withSpring(Number(value), selectionSpring(theme, 'fast', 'effects')));
    }, [value, hasIcon, pressing, disabled, scale, selected, thumbSize, theme, dragging, dragActive, colorSelected, settlement]);
    useEffect(
        () => () => {
            cancelAnimation(selected);
            cancelAnimation(thumbSize);
            cancelAnimation(colorSelected);
        },
        [selected, thumbSize, colorSelected]
    );
    const startDrag = (token: string) => {
        if (!canPress() || latest.current.configuration !== token) return;
        setFocused(false);
        setDragActive(true);
    };
    const finishDrag = (next: boolean, canceled: boolean, token: string) => {
        if (!canPress() || latest.current.configuration !== token) return;
        setPressed(false);
        setDragActive(false);
        setSettlement((revision) => revision + 1);
        if (!canceled && next !== value) latest.current.onValueChange?.(next);
    };
    const pan = usePanGesture({
        enabled: !blocked,
        activeOffsetX: [-8, 8],
        failOffsetY: [-8, 8],
        maxPointers: 1,
        onTouchesDown: (event) => {
            'worklet';
            if (blocked || configurationUI.get() !== configuration) return;
            const touch = event.allTouches[0];
            pressOwner.set(pressRevision);
            tapBlocked.set(event.numberOfTouches !== 1);
            if (touch) {
                pointerX.set(touch.absoluteX);
                pointerY.set(touch.absoluteY);
            }
        },
        onTouchesMove: (event) => {
            'worklet';
            if (blocked || configurationUI.get() !== configuration) return;
            const touch = event.allTouches[0];
            if (touch && Math.hypot(touch.absoluteX - pointerX.get(), touch.absoluteY - pointerY.get()) > 8) tapBlocked.set(true);
        },
        onBegin: () => {
            'worklet';
            if (blocked || configurationUI.get() !== configuration) return;
            dragOrigin.set(Number(value));
        },
        onActivate: (event) => {
            'worklet';
            if (blocked || configurationUI.get() !== configuration) return;
            dragging.set(true);
            tapBlocked.set(true);
            cancelAnimation(selected);
            thumbSize.set(28);
            selected.set(Math.max(0, Math.min(1, dragOrigin.get() + (event.translationX * (isRTL ? -1 : 1)) / 20)));
            scheduleOnRN(startDrag, configuration);
        },
        onUpdate: (event) => {
            'worklet';
            if (!dragging.get() || configurationUI.get() !== configuration) return;
            selected.set(Math.max(0, Math.min(1, dragOrigin.get() + (event.translationX * (isRTL ? -1 : 1)) / 20)));
        },
        onFinalize: (event) => {
            'worklet';
            if (!dragging.get() || configurationUI.get() !== configuration) return;
            const next = selected.get() >= 0.5;
            dragging.set(false);
            scheduleOnRN(finishDrag, next, event.canceled, configuration);
        },
    });
    const colors: Theme['colors'] = theme.colors;
    const uncheckedThumb = disabled ? colors.onSurface : interacted ? colors.onSurfaceVariant : colors.outline;
    const checkedThumb = disabled ? colors.surface : interacted ? colors.primaryContainer : colors.onPrimary;
    const paint = (color: ColorValue) => {
        'worklet';
        return !scale || disabled || typeof color !== 'string' ? color : withSpring(color, selectionSpring(theme, 'fast', 'effects'));
    };
    const trackStyle = useAnimatedStyle(() => ({
        backgroundColor: paint(value ? (disabled ? colors.onSurface : colors.primary) : colors.surfaceContainerHighest),
        opacity: disabled ? 0.12 : 1,
    }));
    const borderStyle = useAnimatedStyle(() => ({ opacity: (1 - Math.min(1, Math.max(0, colorSelected.get()))) * (disabled ? 0.12 : 1) }));
    const thumbStyle = useAnimatedStyle(() => {
        const size = thumbSize.get();
        const logicalCenter = 16 + selected.get() * 20;
        const center = isRTL ? 52 - logicalCenter : logicalCenter;
        return { width: size, height: size, borderRadius: size / 2, left: center - size / 2, top: 16 - size / 2 };
    });
    const thumbPaint = useAnimatedStyle(() => ({
        backgroundColor: paint(value ? checkedThumb : uncheckedThumb),
        opacity: disabled ? (value ? 1 : 0.38) : 1,
    }));
    const stateStyle = useAnimatedStyle(() => ({ left: (isRTL ? 36 - selected.get() * 20 : 16 + selected.get() * 20) - 20 }));
    const checkedStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, colorSelected.get())) * (disabled ? 0.38 : 1) }));
    const uncheckedStyle = useAnimatedStyle(() => ({
        opacity: (1 - Math.min(1, Math.max(0, colorSelected.get()))) * (disabled ? 0.38 : 1),
    }));
    return (
        <GestureDetector gesture={pan} touchAction="pan-y">
            <TouchableRipple
                key={disabled ? 'inactive' : 'interactive'}
                accessible={semantic}
                accessibilityElementsHidden={!semantic}
                importantForAccessibility={semantic ? 'auto' : 'no-hide-descendants'}
                focusable={accessible && !blocked}
                accessibilityRole={semantic ? 'switch' : undefined}
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityHint}
                accessibilityState={semantic ? { checked: value, disabled } : undefined}
                disabled={blocked}
                onPress={(event) => {
                    // Virtual clicks (screen readers, keyboard/programmatic activation)
                    // have no pointer gesture to reset the movement gate.
                    const native = event?.nativeEvent as { detail?: number; pageX?: number; key?: string } | undefined;
                    const virtual = native && (native.key || (Platform.OS === 'web' ? native.detail === 0 : native.pageX == null));
                    const independent = native && !native.key && (Platform.OS === 'web' ? native.detail === 0 : native.pageX == null);
                    if (canPress() && (independent || pressOwner.get() === pressRevision) && (!tapBlocked.get() || virtual))
                        latest.current.onValueChange?.(!value);
                }}
                onPressIn={(event) => {
                    if (!canInteract()) return;
                    const keyboard = Boolean((event.nativeEvent as { key?: string }).key);
                    if (keyboard) {
                        tapBlocked.set(false);
                        pressOwner.set(pressRevision);
                        setFocused(true);
                    }
                    setPressed(true);
                    if (Platform.OS === 'web' && !keyboard) setFocused(false);
                }}
                onPressOut={() => {
                    if (canInteract()) setPressed(false);
                }}
                onFocus={(event) => {
                    if (!canInteract()) return;
                    const target = event.currentTarget as unknown as { matches: (selector: string) => boolean };
                    setFocused(Platform.OS !== 'web' || target.matches(':focus-visible'));
                }}
                onBlur={() => {
                    if (!canInteract()) return;
                    setFocused(false);
                    setPressed(false);
                }}
                onHoverIn={() => {
                    if (canInteract()) setHovered(true);
                }}
                onHoverOut={() => {
                    if (canInteract()) setHovered(false);
                }}
                borderless
                centered
                rippleColor="transparent"
                style={[
                    styles.target,
                    Platform.OS === 'web'
                        ? ({ outlineStyle: 'solid', outlineColor: 'transparent', outlineWidth: 0 } as ViewStyle)
                        : undefined,
                    style,
                ]}
                testID={testID}
            >
                <View pointerEvents="none" style={styles.track} testID={`${testID}-track`}>
                    <Animated.View style={[styles.trackPaint, trackStyle]} testID={`${testID}-track-paint`} />
                    <Animated.View style={[styles.outline, { borderColor: disabled ? colors.onSurface : colors.outline }, borderStyle]} />
                    {interacted ? (
                        <Animated.View
                            testID={`${testID}-state-layer`}
                            style={[
                                styles.state,
                                { backgroundColor: value ? colors.primary : colors.onSurface, opacity: pressing || focused ? 0.1 : 0.08 },
                                stateStyle,
                            ]}
                        />
                    ) : null}
                    {focused && !disabled ? (
                        <View style={[styles.focus, { borderColor: colors.secondary }]} testID={`${testID}-focus-ring`} />
                    ) : null}
                    <Animated.View style={[styles.thumbBackdrop, thumbStyle]} testID={`${testID}-handle`}>
                        <View style={[styles.disabledBackdrop, { backgroundColor: colors.surface, opacity: disabled ? 1 : 0 }]} />
                        <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 99 }, thumbPaint]} />
                        {uncheckedIcon ? (
                            <Animated.View style={[styles.icon, uncheckedStyle]} testID={`${testID}-unchecked-icon`}>
                                <Icon source={uncheckedIcon} size={16} color={colors.surfaceContainerHighest} />
                            </Animated.View>
                        ) : null}
                        {checkedIcon ? (
                            <Animated.View style={[styles.icon, checkedStyle]} testID={`${testID}-checked-icon`}>
                                <Icon source={checkedIcon} size={16} color={disabled ? colors.onSurface : colors.onPrimaryContainer} />
                            </Animated.View>
                        ) : null}
                    </Animated.View>
                </View>
            </TouchableRipple>
        </GestureDetector>
    );
}
const styles = StyleSheet.create({
    target: {
        width: 52,
        height: 48,
        minWidth: 52,
        minHeight: 48,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 26,
        overflow: 'visible',
    },
    track: { width: 52, height: 32 },
    trackPaint: { ...StyleSheet.absoluteFill, borderRadius: 16 },
    outline: { ...StyleSheet.absoluteFill, borderRadius: 16, borderWidth: 2 },
    thumbBackdrop: { position: 'absolute', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    disabledBackdrop: { ...StyleSheet.absoluteFill, borderRadius: 99 },
    state: { position: 'absolute', width: 40, height: 40, top: -4, borderRadius: 20 },
    focus: { position: 'absolute', left: -5, top: -5, right: -5, bottom: -5, borderRadius: 21, borderWidth: 3 },
    icon: { position: 'absolute', width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
});
