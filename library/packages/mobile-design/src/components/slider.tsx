import { sliderSizeTokens } from '@mobile-design/tokens';
import { webAccessibility } from '../web-accessibility';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, useLocale, useTheme, type Theme } from 'react-native-paper';
import { GestureDetector, GestureStateManager, useExclusiveGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, {
    cancelAnimation,
    Easing,
    ReduceMotion,
    useAnimatedProps,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export interface SliderBaseProps {
    minimumValue?: number;
    maximumValue?: number;
    /** 0 is continuous; a positive step includes both endpoints as selectable values. */
    step?: number;
    disabled?: boolean;
    showTicks?: boolean;
    showStopIndicator?: boolean;
    valueIndicator?: 'on-drag' | 'always' | 'never';
    valueSuffix?: string;
    /** Optional live value readout. Use an empty string to show only the value. */
    valueLabel?: string;
    /** Decimal places in the value indicator and accessible text, independent of the slider's step. */
    valuePrecision?: number;
    orientation?: 'horizontal' | 'vertical';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Width for horizontal sliders, height for vertical sliders (default240dp). */
    length?: number;
    /** Optional, evenly spaced visual marks on a continuous track; does not add detents. */
    continuousTickCount?: number;
    /** Inset icons are available on standard md/lg/xl sliders. */
    leadingIcon?: React.ComponentProps<typeof Icon>['source'];
    trailingIcon?: React.ComponentProps<typeof Icon>['source'];
    accessibilityLabel?: string;
    accessibilityHint?: string;
    /** Mirrors the track direction, without changing the numeric values. */
    reversed?: boolean;
    style?: StyleProp<ViewStyle>;
    testID?: string;
}

export interface SliderProps extends SliderBaseProps {
    /** Active track extends from the middle of the domain; useful for positive/negative values. */
    centered?: boolean;
    value: number;
    onValueChange: (value: number) => void;
    onSlidingStart?: (value: number) => void;
    onSlidingComplete?: (value: number) => void;
    /** An interrupted interaction ends without committing; the consumer may restore its accepted value. */
    onSlidingCancel?: (value: number) => void;
}

export interface RangeSliderProps extends SliderBaseProps {
    value: readonly [number, number];
    onValueChange: (value: [number, number]) => void;
    onSlidingStart?: (value: [number, number]) => void;
    onSlidingComplete?: (value: [number, number]) => void;
    onSlidingCancel?: (value: [number, number]) => void;
    minimumRange?: number;
    startAccessibilityLabel?: string;
    endAccessibilityLabel?: string;
}

type InternalProps = SliderBaseProps & {
    value: readonly [number, number];
    range: boolean;
    centered?: boolean;
    minimumRange?: number;
    onValueChange: (value: [number, number]) => void;
    onSlidingStart?: (value: [number, number]) => void;
    onSlidingComplete?: (value: [number, number]) => void;
    onSlidingCancel?: (value: [number, number]) => void;
    startAccessibilityLabel?: string;
    endAccessibilityLabel?: string;
};

/** MD3 slider, horizontal or vertical: continuous or discrete, with UI-thread tracking. */
export function Slider({ value, onValueChange, onSlidingStart, onSlidingComplete, onSlidingCancel, ...props }: SliderProps) {
    const min = props.minimumValue ?? 0;
    return (
        <SliderControl
            {...props}
            value={[min, value]}
            range={false}
            onValueChange={([, next]) => onValueChange(next)}
            onSlidingStart={onSlidingStart ? ([, next]) => onSlidingStart(next) : undefined}
            onSlidingComplete={onSlidingComplete ? ([, next]) => onSlidingComplete(next) : undefined}
            onSlidingCancel={onSlidingCancel ? ([, next]) => onSlidingCancel(next) : undefined}
        />
    );
}

/** Two independently adjustable thumbs; thumbs never cross. */
export function RangeSlider(props: RangeSliderProps) {
    return <SliderControl {...props} range />;
}

function clamp(value: number, min: number, max: number) {
    'worklet';
    return Math.min(max, Math.max(min, value));
}

function snap(value: number, min: number, max: number, step: number) {
    'worklet';
    if (!step) return clamp(value, min, max);
    const stepped = clamp(min + Math.round((value - min) / step) * step, min, max);
    // A final partial step still permits selecting maximumValue.
    return Math.abs(value - max) < Math.abs(value - stepped) ? max : Number(stepped.toFixed(10));
}

function constrainedSnap(value: number, min: number, max: number, step: number, lower: number, upper: number) {
    'worklet';
    let next = snap(value, min, max, step);
    if (step && next < lower) next = Math.min(max, min + Math.ceil((lower - min) / step) * step);
    if (step && next > upper) next = min + Math.floor((upper - min) / step) * step;
    return clamp(Number(next.toFixed(10)), lower, upper);
}

function decimalPlaces(number: number) {
    const [mantissa, exponent = '0'] = String(number).split('e');
    return Math.max(0, (mantissa.split('.')[1]?.length ?? 0) - Number(exponent));
}

const INDICATOR_GAP = 4;
const INDICATOR_PADDING = 8;

function formatSliderValue(value: number, precision: number, suffix: string) {
    'worklet';
    return `${precision === 0 ? Math.round(value) : Number(value.toFixed(precision))}${suffix}`;
}

function indicatorWidthFor(minimum: number, maximum: number, precision: number, suffix: string, fontScale: number) {
    const digits = Math.max(String(Math.trunc(minimum)).length, String(Math.trunc(maximum)).length) + (precision ? precision + 1 : 0);
    return Math.max(48, (digits + suffix.length) * 8 * fontScale + INDICATOR_PADDING * 2);
}

function SliderControl({
    value,
    onValueChange,
    onSlidingStart,
    onSlidingComplete,
    onSlidingCancel,
    range,
    centered = false,
    minimumValue = 0,
    maximumValue = 1,
    step = 0,
    minimumRange = 0,
    disabled = false,
    showTicks = step > 0,
    showStopIndicator = true,
    valueIndicator = 'never',
    valueSuffix = '',
    valueLabel,
    valuePrecision,
    orientation = 'horizontal',
    size = 'xs',
    length: componentLength,
    continuousTickCount = 0,
    leadingIcon,
    trailingIcon,
    accessibilityLabel = 'Slider',
    accessibilityHint,
    startAccessibilityLabel,
    endAccessibilityLabel,
    reversed: reversedProp,
    style,
    testID = range ? 'range-slider' : 'slider',
}: InternalProps) {
    const theme = useTheme<Theme>();
    const { fontScale } = useWindowDimensions();
    const { direction } = useLocale();
    const rtl = direction === 'rtl';
    const vertical = orientation === 'vertical';
    const reversed = reversedProp ?? (vertical || rtl);
    const dimensions = sliderSizeTokens[size];
    const crossSize = Math.max(48, dimensions.handle);
    // Material Android increases side padding with track thickness; keep at least24dp for touch.
    const axisPadding = Math.max(24, 16 + (dimensions.track - 4) / 2);
    if (
        !Number.isFinite(minimumValue) ||
        !Number.isFinite(maximumValue) ||
        maximumValue <= minimumValue ||
        !Number.isFinite(step) ||
        step < 0 ||
        !Number.isFinite(minimumRange) ||
        minimumRange < 0 ||
        minimumRange > maximumValue - minimumValue ||
        value.some((entry) => !Number.isFinite(entry))
    ) {
        throw new Error('Slider requires finite, ordered bounds, finite values and a non-negative step/minimumRange.');
    }
    if ((leadingIcon || trailingIcon) && (range || centered || !dimensions.icon))
        throw new Error('Inset icons require a standard Slider in md, lg or xl size.');
    if (
        !Number.isInteger(continuousTickCount) ||
        continuousTickCount < 0 ||
        (componentLength !== undefined && (!Number.isFinite(componentLength) || componentLength <= axisPadding * 2))
    )
        throw new Error('Slider length must fit its track; continuousTickCount must be a non-negative integer.');
    if (valuePrecision !== undefined && (!Number.isInteger(valuePrecision) || valuePrecision < 0 || valuePrecision > 10))
        throw new Error('Slider valuePrecision must be an integer between 0 and 10.');
    const span = maximumValue - minimumValue;
    const precision =
        valuePrecision ?? Math.min(10, Math.max(step ? decimalPlaces(step) : 2, decimalPlaces(minimumValue), decimalPlaces(maximumValue)));
    const initialEnd = constrainedSnap(value[1], minimumValue, maximumValue, step, minimumValue + (range ? minimumRange : 0), maximumValue);
    const initialStart = range
        ? constrainedSnap(value[0], minimumValue, maximumValue, step, minimumValue, initialEnd - minimumRange)
        : minimumValue;
    const start = useSharedValue(clamp(initialStart, minimumValue, maximumValue));
    const end = useSharedValue(initialEnd);
    // Semantic values commit immediately. Only a track tap animates the geometry;
    // dragging stays attached to the finger, including when it interrupts a tap.
    const displayStart = useSharedValue(initialStart);
    const displayEnd = useSharedValue(initialEnd);
    const active = useSharedValue(-1);
    const tapThumb = useSharedValue(-1);
    const focusedThumb = useSharedValue(-1);
    const indicatorOwner = useSharedValue(range ? 0 : 1);
    const dragging = useSharedValue(false);
    const pendingDirection = useSharedValue(false);
    const tapMultiplePointers = useSharedValue(false);
    const width = useSharedValue(0);
    const [layoutWidth, setLayoutWidth] = useState(0);
    const [a11yValue, setA11yValue] = useState<[number, number]>([initialStart, initialEnd]);
    const [interactionRevision, setInteractionRevision] = useState(0);
    const callbacks = useRef({ onValueChange, onSlidingStart, onSlidingComplete, onSlidingCancel });
    const disposed = useRef(false);
    const lastEmitted = useRef<[number, number]>([initialStart, initialEnd]);
    const gestureSequence = useSharedValue(0);
    const settledGesture = useRef(0);
    const activeGesture = useRef<number | null>(null);
    // Controlled value updates during a drag are expected. Changes to the
    // domain, direction or geometry revoke that gesture and its queued callbacks.
    const configuration = JSON.stringify([
        minimumValue,
        maximumValue,
        step,
        minimumRange,
        range,
        vertical,
        reversed,
        size,
        componentLength,
        layoutWidth,
        rtl,
        valueIndicator,
        disabled,
    ]);
    const configurationRef = useRef(configuration);
    const configurationUI = useSharedValue(configuration);
    const cancel = useCallback(
        (lower: number, upper: number, gesture: number, owner: string, updateState = true, revokeOwned = false) => {
            if (disposed.current || owner !== configurationRef.current || gesture <= settledGesture.current) return;
            if (
                !revokeOwned &&
                (gesture !== gestureSequence.get() || (activeGesture.current !== null && activeGesture.current !== gesture))
            )
                return;
            settledGesture.current = gesture;
            activeGesture.current = null;
            if (updateState) {
                setA11yValue([lower, upper]);
                setInteractionRevision((revision) => revision + 1);
            }
            callbacks.current.onSlidingCancel?.([lower, upper]);
        },
        [gestureSequence]
    );
    const cancelOwnedGesture = useCallback(
        (updateState = true) => {
            tapThumb.set(-1);
            const gesture = gestureSequence.get();
            if (dragging.get() || activeGesture.current !== null) {
                dragging.set(false);
                active.set(-1);
                pendingDirection.set(false);
                cancelAnimation(displayStart);
                cancelAnimation(displayEnd);
                displayStart.set(start.get());
                displayEnd.set(end.get());
                // The owner can revoke a UI drag whose begin notification is still
                // queued. Retire the latest sequence without leaving an older RN
                // interaction active; ordinary native cancel callbacks stay guarded.
                cancel(start.get(), end.get(), gesture, configurationRef.current, updateState, true);
            }
        },
        [active, cancel, dragging, end, gestureSequence, pendingDirection, start, displayStart, displayEnd, tapThumb]
    );
    useLayoutEffect(() => {
        callbacks.current = { onValueChange, onSlidingStart, onSlidingComplete, onSlidingCancel };
        if (configurationRef.current !== configuration) {
            cancelOwnedGesture();
            cancelAnimation(displayStart);
            cancelAnimation(displayEnd);
            displayStart.set(start.get());
            displayEnd.set(end.get());
            configurationRef.current = configuration;
            configurationUI.set(configuration);
        }
    }, [
        configuration,
        configurationUI,
        cancelOwnedGesture,
        displayStart,
        displayEnd,
        start,
        end,
        onValueChange,
        onSlidingStart,
        onSlidingComplete,
        onSlidingCancel,
    ]);
    useEffect(() => {
        disposed.current = false;
        return () => {
            cancelOwnedGesture(false);
            cancelAnimation(displayStart);
            cancelAnimation(displayEnd);
            disposed.current = true;
        };
    }, [cancelOwnedGesture, displayStart, displayEnd]);
    const indicatorHeight = Math.max(44, 20 * fontScale + 24);
    const preferredWidth = indicatorWidthFor(minimumValue, maximumValue, precision, valueSuffix, fontScale);
    const indicatorWidth = !vertical && layoutWidth > 0 ? Math.min(preferredWidth, layoutWidth) : preferredWidth;
    // Keep the slot at rest so feedback cannot cover adjacent text or move the track.
    const indicatorSpace =
        valueIndicator === 'never' ? 0 : (vertical ? indicatorWidth : indicatorHeight) + INDICATOR_GAP + (dimensions.handle - crossSize) / 2;
    const readoutTypography = vertical ? theme.fonts.bodySmall : theme.fonts.bodyLarge;
    const readoutHeight = (readoutTypography.lineHeight ?? (vertical ? 16 : 24)) * fontScale;
    const verticalLength = componentLength ?? 240;

    useEffect(() => {
        if (dragging.get()) return;
        const upper = constrainedSnap(value[1], minimumValue, maximumValue, step, minimumValue + (range ? minimumRange : 0), maximumValue);
        const lower = range
            ? constrainedSnap(value[0], minimumValue, maximumValue, step, minimumValue, upper - minimumRange)
            : minimumValue;
        if (start.get() !== lower) displayStart.set(lower);
        if (end.get() !== upper) displayEnd.set(upper);
        start.set(lower);
        end.set(upper);
        setA11yValue([lower, upper]);
        lastEmitted.current = [lower, upper];
    }, [
        value[0],
        value[1],
        minimumValue,
        maximumValue,
        step,
        minimumRange,
        range,
        start,
        end,
        displayStart,
        displayEnd,
        dragging,
        interactionRevision,
    ]);

    const publishValue = useCallback(
        (lower: number, upper: number, gesture?: number, owner?: string) => {
            if (
                disposed.current ||
                (gesture !== undefined &&
                    (gesture !== gestureSequence.get() || gesture <= settledGesture.current || owner !== configurationRef.current))
            )
                return;
            if (lastEmitted.current[0] === lower && lastEmitted.current[1] === upper) return;
            lastEmitted.current = [lower, upper];
            setA11yValue([lower, upper]);
            callbacks.current.onValueChange([lower, upper]);
        },
        [gestureSequence]
    );
    const begin = useCallback(
        (lower: number, upper: number, gesture?: number, owner?: string) => {
            if (
                disposed.current ||
                (gesture !== undefined &&
                    (gesture !== gestureSequence.get() || gesture <= settledGesture.current || owner !== configurationRef.current))
            )
                return;
            activeGesture.current = gesture ?? null;
            callbacks.current.onSlidingStart?.([lower, upper]);
        },
        [gestureSequence]
    );
    const finish = useCallback(
        (lower: number, upper: number, gesture?: number, owner?: string) => {
            if (
                disposed.current ||
                (gesture !== undefined &&
                    (gesture !== gestureSequence.get() || gesture <= settledGesture.current || owner !== configurationRef.current))
            )
                return;
            if (gesture !== undefined) settledGesture.current = gesture;
            activeGesture.current = null;
            setA11yValue([lower, upper]);
            setInteractionRevision((revision) => revision + 1);
            callbacks.current.onSlidingComplete?.([lower, upper]);
        },
        [gestureSequence]
    );

    // Report discrete numeric changes, never use React state to position a thumb/track.
    // Continuous callbacks use 1/1000 of the domain: enough precision without per-pixel JS traffic.
    useAnimatedReaction(
        () => {
            if (!dragging.get()) return null;
            const unit = step || span / 1000;
            return [Math.round((start.get() - minimumValue) / unit), Math.round((end.get() - minimumValue) / unit)];
        },
        (next, previous) => {
            if (next && (!previous || next[0] !== previous[0] || next[1] !== previous[1])) {
                scheduleOnRN(publishValue, start.get(), end.get(), gestureSequence.get(), configuration);
            }
        },
        Platform.OS === 'web' ? [publishValue, step, span, minimumValue, configuration, gestureSequence] : undefined
    );

    const updateAt = (x: number, animate = false) => {
        'worklet';
        const length = Math.max(1, width.get() - axisPadding * 2);
        const fraction = clamp((x - axisPadding) / length, 0, 1);
        const next = snap(minimumValue + (reversed ? 1 - fraction : fraction) * span, minimumValue, maximumValue, step);
        if (active.get() === 0 && range)
            start.set(constrainedSnap(next, minimumValue, maximumValue, step, minimumValue, end.get() - minimumRange));
        else
            end.set(
                constrainedSnap(next, minimumValue, maximumValue, step, range ? start.get() + minimumRange : minimumValue, maximumValue)
            );
        const motion = {
            duration: theme.motion.duration.short3 * theme.animation.scale,
            easing: Easing.bezier(...theme.motion.easing.standard),
            reduceMotion: ReduceMotion.Never,
        };
        displayStart.set(animate ? withTiming(start.get(), motion) : start.get());
        displayEnd.set(animate ? withTiming(end.get(), motion) : end.get());
    };
    const closestThumb = (coordinate: number) => {
        'worklet';
        const fraction = clamp((coordinate - axisPadding) / Math.max(1, width.get() - axisPadding * 2), 0, 1);
        const touchValue = minimumValue + (reversed ? 1 - fraction : fraction) * span;
        const distanceStart = Math.abs(start.get() - touchValue);
        const distanceEnd = Math.abs(end.get() - touchValue);
        return range && (distanceStart < distanceEnd || (distanceStart === distanceEnd && touchValue <= start.get())) ? 0 : 1;
    };
    const activateAt = (coordinate: number, animate = false) => {
        'worklet';
        if (disabled || configurationUI.get() !== configuration) return;
        const fraction = clamp((coordinate - axisPadding) / Math.max(1, width.get() - axisPadding * 2), 0, 1);
        const touchValue = minimumValue + (reversed ? 1 - fraction : fraction) * span;
        const distanceStart = Math.abs(start.get() - touchValue);
        const distanceEnd = Math.abs(end.get() - touchValue);
        // Coincident thumbs: left half moves the lower thumb, right half the upper thumb.
        active.set(closestThumb(coordinate));
        pendingDirection.set(
            range &&
                Math.abs(start.get() - end.get()) < span / 100000 &&
                Math.min(distanceStart, distanceEnd) < (span * 24) / Math.max(1, width.get() - axisPadding * 2)
        );
        dragging.set(true);
        gestureSequence.set(gestureSequence.get() + 1);
        scheduleOnRN(begin, start.get(), end.get(), gestureSequence.get(), configuration);
        if (!pendingDirection.get()) updateAt(coordinate, animate);
    };
    const completeAt = (coordinate: number, canceled: boolean, animate = false) => {
        'worklet';
        if (!dragging.get() || configurationUI.get() !== configuration) return;
        if (!canceled) updateAt(coordinate, animate);
        if (canceled) scheduleOnRN(cancel, start.get(), end.get(), gestureSequence.get(), configuration);
        else {
            scheduleOnRN(publishValue, start.get(), end.get(), gestureSequence.get(), configuration);
            scheduleOnRN(finish, start.get(), end.get(), gestureSequence.get(), configuration);
        }
        dragging.set(false);
        pendingDirection.set(false);
        active.set(-1);
    };
    const claimVerticalTouch = vertical && Platform.OS !== 'web';
    const pan = usePanGesture({
        enabled: !disabled,
        manualActivation: claimVerticalTouch,
        // Horizontal sliders leave cross-axis movement to the surrounding scroll.
        activeOffsetX: vertical ? undefined : [-8, 8],
        activeOffsetY: vertical ? [-8, 8] : undefined,
        failOffsetX: vertical ? [-8, 8] : undefined,
        failOffsetY: vertical ? undefined : [-8, 8],
        maxPointers: 1,
        onBegin: (event) => {
            'worklet';
            if (disabled || configurationUI.get() !== configuration) return;
            tapThumb.set(-1);
            active.set(closestThumb(vertical ? event.y : event.x));
        },
        // Native pan recognition must claim this axis in a touch callback.
        // A begin notification can precede the recognizer's activation gate.
        onTouchesDown: (event) => {
            'worklet';
            if (claimVerticalTouch && !disabled && configurationUI.get() === configuration) {
                GestureStateManager.activate(event.handlerTag);
            }
        },
        onTouchesMove: (event) => {
            'worklet';
            if (claimVerticalTouch && !disabled && configurationUI.get() === configuration && !dragging.get()) {
                GestureStateManager.activate(event.handlerTag);
            }
        },
        onActivate: (event) => {
            'worklet';
            activateAt(vertical ? event.y : event.x);
        },
        onUpdate: (event) => {
            'worklet';
            if (!dragging.get() || disabled || configurationUI.get() !== configuration) return;
            if (pendingDirection.get()) {
                const movement = (vertical ? event.translationY : event.translationX) * (reversed ? -1 : 1);
                if (Math.abs(movement) < 1) return;
                active.set(movement > 0 ? 1 : 0);
                pendingDirection.set(false);
            }
            updateAt(vertical ? event.y : event.x);
        },
        onFinalize: (event) => {
            'worklet';
            completeAt(vertical ? event.y : event.x, event.canceled);
            if (!dragging.get()) active.set(-1);
        },
    });
    const tap = useTapGesture({
        enabled: !disabled,
        maxDistance: 8,
        onBegin: (event) => {
            'worklet';
            tapMultiplePointers.set(event.numberOfPointers > 1);
        },
        onTouchesDown: (event) => {
            'worklet';
            if (event.numberOfTouches > 1) tapMultiplePointers.set(true);
        },
        onActivate: (event) => {
            'worklet';
            if (disabled || tapMultiplePointers.get() || configurationUI.get() !== configuration) return;
            const coordinate = vertical ? event.y : event.x;
            activateAt(coordinate, true);
            if (valueIndicator === 'on-drag') {
                tapThumb.set(active.get());
                tapThumb.set(
                    withDelay(theme.motion.duration.medium4, withTiming(-1, { duration: 0, reduceMotion: ReduceMotion.Never }), ReduceMotion.Never)
                );
            }
            completeAt(coordinate, false, true);
        },
    });
    const gesture = useExclusiveGestures(pan, tap);

    const adjust = (thumb: 0 | 1, increment: boolean, count = 1, boundary = false) => {
        if (disabled) return;
        const current = thumb === 0 ? start.get() : end.get();
        const offset = increment ? count : -count;
        let next = current + (span / 100) * offset;
        if (boundary) {
            next = increment ? maximumValue : minimumValue;
        } else if (step) {
            let index = Math.round((current - minimumValue) / step);
            // A maximum off the grid is its own stop, even when rounded to the preceding regular stop.
            const regularValue = Number((minimumValue + index * step).toFixed(10));
            if (current === maximumValue && regularValue < Number(maximumValue.toFixed(10))) index += 1;
            next = minimumValue + (index + offset) * step;
        }
        const lower =
            thumb === 0 ? constrainedSnap(next, minimumValue, maximumValue, step, minimumValue, end.get() - minimumRange) : start.get();
        const upper =
            thumb === 1
                ? constrainedSnap(next, minimumValue, maximumValue, step, lower + (range ? minimumRange : 0), maximumValue)
                : end.get();
        begin(start.get(), end.get());
        start.set(lower);
        end.set(upper);
        displayStart.set(lower);
        displayEnd.set(upper);
        publishValue(lower, upper);
        finish(lower, upper);
    };
    const tickFractions = useMemo(() => {
        if ((!showTicks && !continuousTickCount) || (!step && continuousTickCount < 2) || layoutWidth <= axisPadding * 2) return [];
        const numberOfSteps = step ? Math.ceil(span / step) : continuousTickCount - 1;
        // Ticks closer than 4dp merge visually; keep all numerical detents in snapping.
        const stride = Math.max(1, Math.ceil(numberOfSteps / Math.max(1, (layoutWidth - axisPadding * 2 - dimensions.corner * 2) / 4)));
        const ticks = [];
        for (let index = 0; index <= numberOfSteps; index += stride)
            ticks.push(step ? Math.min((index * step) / span, 1) : index / numberOfSteps);
        if (ticks[ticks.length - 1] !== 1) ticks.push(1);
        return ticks;
    }, [showTicks, step, span, layoutWidth, continuousTickCount, axisPadding, dimensions]);
    const trackProps = {
        start,
        end,
        displayStart,
        displayEnd,
        width,
        range,
        centered,
        minimumValue,
        span,
        reversed,
        disabled,
        theme,
        vertical,
        crossSize,
        axisPadding,
        dimensions,
        active,
        focusedThumb,
        indicatorOwner,
    };

    const readout = valueLabel === undefined ? null : (
        <View
            style={
                vertical
                    ? { marginTop: 8, width: Math.max(crossSize, indicatorWidth), alignSelf: 'flex-start' }
                    : { paddingBottom: indicatorSpace + 8 }
            }
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            {...webAccessibility({ hidden: true })}
        >
            <SliderReadout
                label={valueLabel}
                range={range}
                start={start}
                end={end}
                value={a11yValue}
                precision={precision}
                suffix={valueSuffix}
                typography={readoutTypography}
                height={readoutHeight}
                vertical={vertical}
                testID={`${testID}-value`}
            />
        </View>
    );

    return (
        <View
            style={[
                vertical
                    ? {
                          direction: 'ltr',
                          width: crossSize + indicatorSpace,
                          paddingLeft: rtl ? indicatorSpace : 0,
                          height: verticalLength + (readout ? readoutHeight + 8 : 0),
                          alignSelf: 'flex-start',
                      }
                    : { width: componentLength, minHeight: crossSize + indicatorSpace, paddingTop: readout ? 0 : indicatorSpace },
                style,
            ]}
            testID={testID}
        >
            {!vertical && readout}
            <GestureDetector gesture={gesture} touchAction={vertical ? 'pan-x' : 'pan-y'}>
                <Animated.View
                    collapsable={false}
                    style={[styles.touchArea, vertical ? { width: crossSize, height: readout ? verticalLength : '100%' } : { height: crossSize }]}
                    onLayout={(event) => {
                        const length = vertical ? event.nativeEvent.layout.height : event.nativeEvent.layout.width;
                        if (length !== width.get()) cancelOwnedGesture();
                        width.set(length);
                        setLayoutWidth(length);
                    }}
                >
                    <TrackSegment {...trackProps} segment="before" />
                    {(range || centered) && <TrackSegment {...trackProps} segment="active" />}
                    <TrackSegment {...trackProps} segment="after" />
                    {tickFractions.map((fraction, index) => (
                        <Tick key={index} {...trackProps} fraction={fraction} stop={false} showStopIndicator={showStopIndicator} />
                    ))}
                    {showStopIndicator && (
                        <>
                            <Tick {...trackProps} fraction={1} stop showStopIndicator />
                            {(range || centered) && <Tick {...trackProps} fraction={0} stop showStopIndicator />}
                        </>
                    )}
                    {leadingIcon && <InsetIcon {...trackProps} source={leadingIcon} endIcon={false} hasLeadingIcon />}
                    {trailingIcon && <InsetIcon {...trackProps} source={trailingIcon} endIcon hasLeadingIcon={Boolean(leadingIcon)} />}
                    {range && (
                        <Thumb
                            {...trackProps}
                            active={active}
                            index={0}
                            valueIndicator={valueIndicator}
                            indicatorWidth={indicatorWidth}
                            indicatorHeight={indicatorHeight}
                            indicatorOnLeft={rtl}
                            tapThumb={tapThumb}
                            suffix={valueSuffix}
                            precision={precision}
                            testID={`${testID}-start`}
                            label={startAccessibilityLabel ?? `${accessibilityLabel}, start`}
                            hint={accessibilityHint}
                            value={a11yValue[0]}
                            maximum={a11yValue[1] - minimumRange}
                            minimum={minimumValue}
                            onAdjust={(increment, count) => adjust(0, increment, count)}
                            onBoundary={(end) => adjust(0, end, 1, true)}
                        />
                    )}
                    <Thumb
                        {...trackProps}
                        active={active}
                        index={1}
                        valueIndicator={valueIndicator}
                        indicatorWidth={indicatorWidth}
                        indicatorHeight={indicatorHeight}
                        indicatorOnLeft={rtl}
                        tapThumb={tapThumb}
                        suffix={valueSuffix}
                        precision={precision}
                        testID={`${testID}-${range ? 'end' : 'thumb'}`}
                        label={endAccessibilityLabel ?? accessibilityLabel}
                        hint={accessibilityHint}
                        value={a11yValue[1]}
                        minimum={range ? a11yValue[0] + minimumRange : minimumValue}
                        maximum={maximumValue}
                        onAdjust={(increment, count) => adjust(1, increment, count)}
                        onBoundary={(end) => adjust(1, end, 1, true)}
                    />
                </Animated.View>
            </GestureDetector>
            {vertical && readout}
        </View>
    );
}

type TrackProps = {
    start: SharedValue<number>;
    end: SharedValue<number>;
    displayStart: SharedValue<number>;
    displayEnd: SharedValue<number>;
    width: SharedValue<number>;
    range: boolean;
    centered: boolean;
    minimumValue: number;
    span: number;
    reversed: boolean;
    disabled: boolean;
    theme: Theme;
    vertical: boolean;
    crossSize: number;
    axisPadding: number;
    dimensions: (typeof sliderSizeTokens)[keyof typeof sliderSizeTokens];
    active: SharedValue<number>;
    focusedThumb: SharedValue<number>;
    indicatorOwner: SharedValue<number>;
};

function TrackSegment({
    displayStart,
    displayEnd,
    width,
    range,
    centered,
    minimumValue,
    span,
    reversed,
    disabled,
    theme,
    vertical,
    crossSize,
    axisPadding,
    dimensions,
    active: activeThumb,
    focusedThumb,
    segment,
}: TrackProps & { segment: 'before' | 'active' | 'after' }) {
    const active = segment === 'active' || (segment === 'before' && !range && !centered);
    const animated = useAnimatedStyle(() => {
        const length = Math.max(0, width.get() - axisPadding * 2);
        const first = ((displayStart.get() - minimumValue) / span) * length;
        const last = ((displayEnd.get() - minimumValue) / span) * length;
        const center = length / 2;
        const low = centered ? Math.min(last, center) : first;
        const high = centered ? Math.max(last, center) : last;
        const interaction = activeThumb.get() >= 0 ? activeThumb.get() : focusedThumb.get();
        const startGap = interaction === 0 ? 7 : 8,
            endGap = interaction === 1 ? 7 : 8;
        const lowGap = centered && last >= center ? 6 : range ? startGap : endGap;
        const highGap = centered && last <= center ? 6 : endGap;
        const from = segment === 'before' ? 0 : segment === 'active' ? low + lowGap : high + highGap;
        const to = segment === 'before' ? (range || centered ? low : last) - lowGap : segment === 'active' ? high - highGap : length;
        const size = Math.max(0, to - from);
        const outerStart = segment === 'before';
        const outerEnd = segment === 'after';
        const fromCorner = (reversed ? outerEnd : outerStart) ? Math.min(dimensions.corner, size / 2) : 2;
        const toCorner = (reversed ? outerStart : outerEnd) ? Math.min(dimensions.corner, size / 2) : 2;
        return {
            left: vertical ? (crossSize - dimensions.track) / 2 : axisPadding + (reversed ? length - to : from),
            top: vertical ? axisPadding + (reversed ? length - to : from) : (crossSize - dimensions.track) / 2,
            width: vertical ? dimensions.track : size,
            height: vertical ? size : dimensions.track,
            opacity: disabled ? (active ? 0.38 : 0.12) : 1,
            borderTopLeftRadius: fromCorner,
            borderBottomLeftRadius: vertical ? toCorner : fromCorner,
            borderTopRightRadius: vertical ? fromCorner : toCorner,
            borderBottomRightRadius: toCorner,
        };
    });
    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.track,
                { backgroundColor: disabled ? theme.colors.onSurface : active ? theme.colors.primary : theme.colors.secondaryContainer },
                animated,
            ]}
        />
    );
}

function Tick({
    displayStart,
    displayEnd,
    width,
    range,
    centered,
    minimumValue,
    span,
    reversed,
    disabled,
    theme,
    vertical,
    crossSize,
    axisPadding,
    dimensions,
    fraction,
    stop,
    showStopIndicator,
}: TrackProps & { fraction: number; stop: boolean; showStopIndicator: boolean }) {
    const animated = useAnimatedStyle(() => {
        const length = Math.max(0, width.get() - axisPadding * 2);
        const corner = dimensions.corner;
        const x = fraction === 0 ? corner : fraction === 1 ? length - corner : fraction * length;
        const lower = ((displayStart.get() - minimumValue) / span) * length;
        const upper = ((displayEnd.get() - minimumValue) / span) * length;
        const inside = centered
            ? x >= Math.min(upper, length / 2) && x <= Math.max(upper, length / 2)
            : (!range || x >= lower) && x <= upper;
        const onGap = Math.abs(x - upper) <= 10 || (range && Math.abs(x - lower) <= 10) || (centered && Math.abs(x - length / 2) <= 6);
        const hideStop = stop && (fraction === 0 ? (centered ? upper <= corner + 8 : lower <= corner + 8) : upper >= length - corner - 8);
        const hideDuplicate = !stop && showStopIndicator && (fraction === 1 || ((range || centered) && fraction === 0));
        return {
            left: vertical ? crossSize / 2 - 2 : axisPadding + (reversed ? length - x : x) - 2,
            top: vertical ? axisPadding + (reversed ? length - x : x) - 2 : crossSize / 2 - 2,
            opacity: onGap || hideStop || hideDuplicate ? 0 : 1,
            backgroundColor: disabled
                ? inside
                    ? theme.colors.inverseOnSurface
                    : theme.colors.onSurface
                : inside
                  ? theme.colors.onPrimary
                  : theme.colors.onSecondaryContainer,
        };
    });
    return <Animated.View pointerEvents="none" style={[styles.tick, animated]} />;
}

function InsetIcon({
    displayEnd,
    width,
    minimumValue,
    span,
    reversed,
    disabled,
    theme,
    vertical,
    crossSize,
    axisPadding,
    dimensions,
    source,
    endIcon,
    hasLeadingIcon,
}: TrackProps & { source: React.ComponentProps<typeof Icon>['source']; endIcon: boolean; hasLeadingIcon: boolean }) {
    const animated = useAnimatedStyle(() => {
        const length = Math.max(0, width.get() - axisPadding * 2);
        const value = ((displayEnd.get() - minimumValue) / span) * length;
        const activeFits = value - 8 >= dimensions.icon + 20;
        const inactiveFits = length - value - 8 >= dimensions.icon + 20;
        const inactive = endIcon || !activeFits;
        const position = endIcon ? length - 10 - dimensions.icon : inactive ? value + 8 + 10 : 10;
        const physical = reversed ? length - position - dimensions.icon : position;
        return {
            left: vertical ? (crossSize - dimensions.icon) / 2 : axisPadding + physical,
            top: vertical ? axisPadding + physical : (crossSize - dimensions.icon) / 2,
            opacity: (inactive ? !inactiveFits : !activeFits) || (endIcon && hasLeadingIcon && !activeFits) ? 0 : disabled ? 0.38 : 1,
        };
    });
    const activeColor = useAnimatedStyle(() => ({
        opacity:
            !endIcon && ((displayEnd.get() - minimumValue) / span) * Math.max(0, width.get() - axisPadding * 2) - 8 >= dimensions.icon + 20
                ? 1
                : 0,
    }));
    const inactiveColor = useAnimatedStyle(() => ({
        opacity:
            endIcon || ((displayEnd.get() - minimumValue) / span) * Math.max(0, width.get() - axisPadding * 2) - 8 < dimensions.icon + 20
                ? 1
                : 0,
    }));
    return (
        <Animated.View
            pointerEvents="none"
            accessible={false}
            style={[{ position: 'absolute', width: dimensions.icon, height: dimensions.icon }, animated]}
        >
            <Animated.View style={[StyleSheet.absoluteFill, activeColor]}>
                <Icon source={source} size={dimensions.icon} color={disabled ? theme.colors.onSurface : theme.colors.onPrimary} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, inactiveColor]}>
                <Icon
                    source={source}
                    size={dimensions.icon}
                    color={disabled ? theme.colors.onSurface : theme.colors.onSecondaryContainer}
                />
            </Animated.View>
        </Animated.View>
    );
}

const AnimatedInput = Animated.createAnimatedComponent(TextInput);

function formatSliderReadout(label: string, range: boolean, start: number, end: number, precision: number, suffix: string) {
    'worklet';
    const upper = formatSliderValue(end, precision, suffix);
    const value = range ? `${formatSliderValue(start, precision, suffix)} – ${upper}` : upper;
    return label ? `${label}: ${value}` : value;
}

function SliderReadout({
    label,
    range,
    start,
    end,
    value,
    precision,
    suffix,
    typography,
    height,
    vertical,
    testID,
}: {
    label: string;
    range: boolean;
    start: SharedValue<number>;
    end: SharedValue<number>;
    value: [number, number];
    precision: number;
    suffix: string;
    typography: Theme['fonts']['bodyLarge'];
    height: number;
    vertical: boolean;
    testID: string;
}) {
    const theme = useTheme<Theme>();
    const animatedProps = useAnimatedProps<React.ComponentProps<typeof TextInput> & { text: string }>(
        () => {
            const text = formatSliderReadout(label, range, start.get(), end.get(), precision, suffix);
            return { text, defaultValue: text };
        },
        Platform.OS === 'web' ? [label, range, start, end, precision, suffix] : undefined
    );
    return (
        <AnimatedInput
            accessible={false}
            editable={false}
            focusable={false}
            {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
            caretHidden
            underlineColorAndroid="transparent"
            animatedProps={animatedProps}
            defaultValue={formatSliderReadout(label, range, value[0], value[1], precision, suffix)}
            style={[typography, { height, padding: 0, color: theme.colors.onSurface, textAlign: vertical ? 'center' : 'auto' }]}
            testID={testID}
        />
    );
}

function Thumb({
    start,
    end,
    displayStart,
    displayEnd,
    width,
    minimumValue,
    span,
    reversed,
    disabled,
    theme,
    vertical,
    crossSize,
    axisPadding,
    dimensions,
    active,
    focusedThumb,
    indicatorOwner,
    range,
    index,
    valueIndicator,
    indicatorWidth,
    indicatorHeight,
    indicatorOnLeft,
    tapThumb,
    suffix,
    precision,
    testID,
    label,
    hint,
    value,
    minimum,
    maximum,
    onAdjust,
    onBoundary,
}: TrackProps & {
    index: 0 | 1;
    valueIndicator: 'on-drag' | 'always' | 'never';
    indicatorWidth: number;
    indicatorHeight: number;
    indicatorOnLeft: boolean;
    tapThumb: SharedValue<number>;
    suffix: string;
    precision: number;
    testID: string;
    label: string;
    hint?: string;
    value: number;
    minimum: number;
    maximum: number;
    onAdjust: (increment: boolean, count?: number) => void;
    onBoundary: (end: boolean) => void;
}) {
    const [focused, setFocused] = useState(false);
    const { fontScale } = useWindowDimensions();
    const spaceHeld = useRef(false);
    const state = useSharedValue(0);
    const valueText = formatSliderValue(value, precision, suffix);
    useEffect(() => {
        if (disabled) {
            focusedThumb.set(-1);
            spaceHeld.current = false;
            setFocused(false);
            state.set(0);
        }
        return () => cancelAnimation(state);
    }, [disabled, focusedThumb, state]);
    useAnimatedReaction(
        () => {
            if (disabled) return false;
            const pressed = active.get();
            const tapped = tapThumb.get();
            return index === (pressed >= 0 ? pressed : tapped >= 0 ? tapped : focusedThumb.get());
        },
        (pressed) => {
            if (pressed) indicatorOwner.set(index);
            // Paper resolves auto/on/off into scale; it is the single motion authority.
            // MDC BaseSlider changes handle width immediately; label reveal has a separate duration.
            state.set(
                withTiming(pressed ? 1 : 0, {
                    duration: (pressed ? theme.motion.duration.medium4 : theme.motion.duration.short3) * theme.animation.scale,
                    easing: Easing.bezier(...(pressed ? theme.motion.easing.emphasized : theme.motion.easing.emphasizedAccelerate)),
                    reduceMotion: ReduceMotion.Never,
                })
            );
        },
        Platform.OS === 'web' ? [active, disabled, focusedThumb, indicatorOwner, index, state, tapThumb, theme] : undefined
    );
    const position = useAnimatedStyle(() => {
        const fraction = ((index === 0 ? displayStart.get() : displayEnd.get()) - minimumValue) / span;
        const position = axisPadding + (reversed ? 1 - fraction : fraction) * Math.max(0, width.get() - axisPadding * 2) - 24;
        return { left: vertical ? 0 : position, top: vertical ? position : 0 };
    });
    const handle = useAnimatedStyle(() => {
        const height = dimensions.handle - (focused && !disabled ? 6 : 0);
        const pressed = active.get();
        const interaction = pressed >= 0 ? pressed : focusedThumb.get();
        const thickness = !disabled && interaction === index ? 2 : 4;
        return { width: vertical ? height : thickness, height: vertical ? thickness : height };
    });
    const indicator = useAnimatedStyle(() => {
        const reveal = valueIndicator === 'always' ? 1 : state.get();
        const length = width.get();
        const fraction = ((index === 0 ? displayStart.get() : displayEnd.get()) - minimumValue) / span;
        const center = axisPadding + (reversed ? 1 - fraction : fraction) * Math.max(0, length - axisPadding * 2);
        const extent = vertical ? indicatorHeight : indicatorWidth;
        const offset = clamp(center - extent / 2, 0, Math.max(0, length - extent));
        return {
            ...(vertical ? { top: offset - center + 24 } : { left: offset - center + 24 }),
            opacity:
                disabled || length <= 0 || valueIndicator === 'never' || (range && indicatorOwner.get() !== index)
                    ? 0
                    : Math.min(1, Math.max(0, (reveal - 0.19) / 0.81)),
            transform: [{ scale: reveal }],
            transformOrigin: vertical ? `${indicatorOnLeft ? 'right' : 'left'} ${center - offset}px` : `${center - offset}px bottom`,
        };
    });
    const text = useAnimatedProps<React.ComponentProps<typeof TextInput> & { text: string }>(
        () => {
            const number = index === 0 ? start.get() : end.get();
            const formatted = formatSliderValue(number, precision, suffix);
            return { text: formatted, defaultValue: formatted };
        },
        Platform.OS === 'web' ? [suffix, index, precision] : undefined
    );
    return (
        <Animated.View
            accessible
            accessibilityRole="adjustable"
            {...(Platform.OS === 'web'
                ? { tabIndex: disabled ? -1 : 0, 'aria-orientation': vertical ? ('vertical' as const) : ('horizontal' as const) }
                : {})}
            accessibilityLabel={label}
            accessibilityHint={hint}
            accessibilityState={{ disabled }}
            accessibilityValue={{ min: minimum, max: maximum, now: value, text: valueText }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === 'increment') onAdjust(true);
                if (event.nativeEvent.actionName === 'decrement') onAdjust(false);
            }}
            onKeyDown={(event) => {
                const key = event.nativeEvent.key;
                if (event.nativeEvent.altKey || event.nativeEvent.ctrlKey || event.nativeEvent.metaKey) return;
                if (key === ' ' || key === 'Spacebar') {
                    if (!disabled) {
                        spaceHeld.current = true;
                        event.preventDefault?.();
                    }
                    return;
                }
                if (disabled || !['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(key))
                    return;
                event.preventDefault?.();
                if (key === 'Home' || key === 'End') onBoundary(key === 'End');
                else if (key === 'PageUp' || key === 'PageDown') onAdjust(key === 'PageUp', 10);
                else
                    onAdjust(
                        key === 'ArrowUp'
                            ? vertical
                                ? reversed
                                : true
                            : key === 'ArrowDown'
                              ? vertical
                                  ? !reversed
                                  : false
                              : (key === 'ArrowRight' && !reversed) || (key === 'ArrowLeft' && reversed),
                        spaceHeld.current ? 10 : 1
                    );
            }}
            onKeyUp={(event) => {
                if (event.nativeEvent.key === ' ' || event.nativeEvent.key === 'Spacebar') spaceHeld.current = false;
            }}
            onFocus={() => {
                focusedThumb.set(index);
                setFocused(true);
            }}
            onBlur={() => {
                focusedThumb.set(-1);
                spaceHeld.current = false;
                setFocused(false);
            }}
            focusable={!disabled}
            style={[
                styles.thumbTarget,
                { width: vertical ? crossSize : 48, height: vertical ? 48 : crossSize },
                Platform.OS === 'web' && {
                    outlineWidth: 0,
                    outlineStyle: 'solid',
                    outlineColor: 'transparent',
                    cursor: disabled ? 'auto' : 'pointer',
                },
                position,
            ]}
            testID={testID}
            {...webAccessibility({
                role: 'adjustable',
                state: { disabled },
                value: { min: minimum, max: maximum, now: value, text: valueText },
                hidden: undefined,
            })}
        >
            {focused && !disabled && (
                <View
                    pointerEvents="none"
                    accessible={false}
                    testID={`${testID}-focus-ring`}
                    style={{
                        position: 'absolute',
                        borderColor: theme.colors.secondary,
                        borderWidth: 3,
                        borderRadius: 24,
                        width: vertical ? dimensions.handle + 4 : 12,
                        height: vertical ? 12 : dimensions.handle + 4,
                    }}
                />
            )}
            <Animated.View
                pointerEvents="none"
                testID={`${testID}-handle`}
                style={[
                    styles.thumb,
                    { backgroundColor: disabled ? theme.colors.onSurface : theme.colors.primary, opacity: disabled ? 0.38 : 1 },
                    handle,
                ]}
            />
            <Animated.View
                pointerEvents="none"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                {...webAccessibility({ hidden: true })}
                testID={`${testID}-indicator`}
                style={[
                    styles.indicator,
                    vertical
                        ? {
                              left: indicatorOnLeft
                                  ? (crossSize - dimensions.handle) / 2 - INDICATOR_GAP - indicatorWidth
                                  : (crossSize + dimensions.handle) / 2 + INDICATOR_GAP,
                          }
                        : { bottom: (crossSize + dimensions.handle) / 2 + INDICATOR_GAP },
                    {
                        backgroundColor: theme.colors.inverseSurface,
                        width: indicatorWidth,
                        height: indicatorHeight,
                        borderRadius: indicatorHeight / 2,
                    },
                    indicator,
                ]}
            >
                <AnimatedInput
                    accessible={false}
                    editable={false}
                    focusable={false}
                    {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
                    caretHidden
                    underlineColorAndroid="transparent"
                    animatedProps={text}
                    defaultValue={valueText}
                    style={[
                        theme.fonts.labelLarge,
                        styles.indicatorText,
                        {
                            color: theme.colors.inverseOnSurface,
                            height: Math.max(24, 20 * fontScale),
                            // UIKit centers the line box; the Roboto digits sit below its center.
                            transform: Platform.OS === 'ios' ? [{ translateY: -3 * fontScale }] : undefined,
                        },
                    ]}
                />
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    touchArea: { minHeight: 48, direction: 'ltr' },
    track: { position: 'absolute' },
    tick: { position: 'absolute', width: 4, height: 4, borderRadius: 2 },
    thumbTarget: { position: 'absolute', top: 0, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    thumb: { height: 44, borderRadius: 2 },
    indicator: {
        position: 'absolute',
        paddingHorizontal: INDICATOR_PADDING,
        alignItems: 'center',
        justifyContent: 'center',
    },
    indicatorText: { padding: 0, textAlign: 'center', minWidth: 24, height: 24, fontSize: 14, lineHeight: 20 },
});
