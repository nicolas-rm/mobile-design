import { useCallback, useEffect, useRef, useState } from 'react';
import { I18nManager, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedProps,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { usePaperTheme } from '@/theme/paper';
import {
    circularProgressPath,
    circularProgressSegment,
    clampProgress,
    linearProgressPath,
    linearProgressSegments,
    linearTrackSegments,
    progressWaveAmplitude,
} from './progress-indicator-paths';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type ProgressIndicatorProps = {
    variant?: 'linear' | 'circular';
    appearance?: 'flat' | 'wavy';
    /** A value from 0 to 1. Omit it for indeterminate progress. */
    progress?: number;
    /** Disable motion and immediately render the supplied value (static examples). */
    animated?: boolean;
    /** Freeze the current frame; explicit value changes can still be demonstrated while paused. */
    paused?: boolean;
    size?: number;
    thickness?: number;
    color?: string;
    trackColor?: string;
    showTrack?: boolean;
    showStopIndicator?: boolean;
    direction?: 'ltr' | 'rtl';
    /** Wave height in dp, measured from its center line to its peak. */
    waveAmplitude?: number;
    wavelength?: number;
    /** Wave travel speed in dp/second; defaults to one wavelength per second. Zero keeps it static. */
    waveSpeed?: number;
    /** Duration of one indeterminate cycle. Defaults to M3's 1750/6000 ms. */
    animationDuration?: number;
    accessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

type GraphicProps = {
    amplitude: number;
    amplitudeFraction: SharedValue<number>;
    completion: SharedValue<number>;
    color: string;
    indeterminate: boolean;
    phase: SharedValue<number>;
    wavePhase: SharedValue<number>;
    progress: SharedValue<number>;
    size: number;
    thickness: number;
    trackColor: string;
    showTrack: boolean;
    showStopIndicator: boolean;
    wavelength: number;
};

function LinearGraphic({
    amplitude,
    amplitudeFraction,
    color,
    indeterminate,
    phase,
    wavePhase,
    progress,
    thickness,
    trackColor,
    showTrack,
    showStopIndicator,
    wavelength,
}: GraphicProps) {
    const [width, setWidth] = useState(0);
    const height = Math.max(showStopIndicator && !indeterminate ? 4 : 0, thickness + amplitude * 2);
    const indicatorProps = useAnimatedProps(() => {
        const segments = linearProgressSegments(phase.get(), progress.get(), indeterminate);
        return {
            d: segments
                .map((segment) =>
                    linearProgressPath(
                        segment.start,
                        segment.end,
                        width,
                        height,
                        thickness,
                        amplitude * amplitudeFraction.get(),
                        wavePhase.get(),
                        wavelength
                    )
                )
                .join(' '),
        };
    });
    const trackProps = useAnimatedProps(() => {
        const segments = linearProgressSegments(phase.get(), progress.get(), indeterminate);
        return {
            d: linearTrackSegments(segments, width, thickness)
                .map((segment) => linearProgressPath(segment.start, segment.end, width, height, thickness))
                .join(' '),
        };
    });

    return (
        <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ height }}>
            <Svg accessible={false} height={height} width="100%">
                {showTrack ? (
                    <AnimatedPath
                        animatedProps={trackProps}
                        fill="none"
                        stroke={trackColor}
                        strokeLinecap="round"
                        strokeWidth={thickness}
                    />
                ) : null}
                {showStopIndicator && !indeterminate && width > thickness ? (
                    <Circle cx={width - Math.max(2, thickness / 2)} cy={height / 2} fill={color} r={2} />
                ) : null}
                <AnimatedPath
                    animatedProps={indicatorProps}
                    fill="none"
                    stroke={color}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={thickness}
                />
            </Svg>
        </View>
    );
}

function CircularGraphic({
    amplitude,
    amplitudeFraction,
    completion,
    color,
    indeterminate,
    phase,
    wavePhase,
    progress,
    size,
    thickness,
    trackColor,
    showTrack,
    wavelength,
}: GraphicProps) {
    // Wavy circular paths move inward, preserving the size and location of the outer track.
    const radius = size / 2 - thickness / 2;
    const indicatorProps = useAnimatedProps(() => {
        const segment = circularProgressSegment(phase.get(), progress.get(), indeterminate);
        if (indeterminate) segment.end -= ((segment.end - segment.start) * (1 - Math.cos(Math.PI * completion.get()))) / 2;
        return {
            d: circularProgressPath(
                segment.start,
                segment.end,
                size,
                radius,
                amplitude * amplitudeFraction.get(),
                wavePhase.get(),
                wavelength
            ),
        };
    });
    const trackProps = useAnimatedProps(() => {
        const segment = circularProgressSegment(phase.get(), progress.get(), indeterminate);
        if (indeterminate) segment.end -= ((segment.end - segment.start) * (1 - Math.cos(Math.PI * completion.get()))) / 2;
        const sweep = segment.end - segment.start;
        const gap = Math.min(sweep, (4 + thickness) / (Math.PI * 2 * radius));
        return {
            d:
                sweep === 0
                    ? circularProgressPath(0, 1, size, radius)
                    : circularProgressPath(segment.end + gap, segment.start + 1 - gap, size, radius),
        };
    });

    return (
        <Svg accessible={false} height={size} width={size}>
            {showTrack ? (
                <AnimatedPath animatedProps={trackProps} fill="none" stroke={trackColor} strokeLinecap="round" strokeWidth={thickness} />
            ) : null}
            <AnimatedPath
                animatedProps={indicatorProps}
                fill="none"
                stroke={color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={thickness}
            />
        </Svg>
    );
}

/**
 * M3's current gaps, stop marker and Expressive wave variants, using the Paper theme.
 * Paper's ProgressBar/ActivityIndicator do not yet implement these M3 drawing/motion specs.
 * SVG paths and the independently timed segment/wave phases run on the UI thread.
 */
export function ProgressIndicator({
    variant = 'linear',
    appearance = 'flat',
    progress,
    animated = true,
    paused = false,
    size,
    thickness,
    color,
    trackColor,
    showTrack = true,
    showStopIndicator = true,
    direction = I18nManager.isRTL ? 'rtl' : 'ltr',
    waveAmplitude,
    wavelength,
    waveSpeed,
    animationDuration,
    accessibilityLabel = 'Progreso',
    style,
    testID = 'progress-indicator',
}: ProgressIndicatorProps) {
    const theme = usePaperTheme();
    const systemReduceMotion = useReducedMotion();
    const indeterminate = progress === undefined;
    const [displayIndeterminate, setDisplayIndeterminate] = useState(indeterminate);
    const value = clampProgress(progress ?? 0);
    const defaultSize = appearance === 'wavy' ? ((thickness ?? 4) >= 8 ? 52 : 48) : 40;
    const sizeValue = Number.isFinite(size) ? Math.max(24, Math.min(240, size!)) : defaultSize;
    const sizeScale = sizeValue / (appearance === 'wavy' ? 48 : 40);
    const stroke = Number.isFinite(thickness)
        ? Math.max(1, Math.min(thickness!, sizeValue / 4))
        : variant === 'circular'
          ? 4 * sizeScale
          : 4;
    const circularScale = sizeValue / ((thickness ?? 4) >= 8 ? 52 : 48);
    const defaultAmplitude = variant === 'circular' ? 1.6 * circularScale : 3;
    const amplitude =
        appearance === 'wavy'
            ? Math.min(
                  Math.max(0, Number.isFinite(waveAmplitude) ? waveAmplitude! : defaultAmplitude),
                  variant === 'circular' ? (sizeValue - stroke) / 4 : 24
              )
            : 0;
    const defaultWavelength = variant === 'circular' ? 15 * circularScale : displayIndeterminate ? 20 : 40;
    const waveLengthValue = Number.isFinite(wavelength) ? Math.max(8, wavelength!) : defaultWavelength;
    const waveSpeedValue = Number.isFinite(waveSpeed) ? Math.max(0, waveSpeed!) : waveLengthValue;
    const duration = Number.isFinite(animationDuration) ? Math.max(200, animationDuration!) : variant === 'linear' ? 1750 : 6000;
    const motionAllowed = animated && !systemReduceMotion && theme.animation.scale > 0;
    const moving = motionAllowed && !paused;
    const waveTarget = progressWaveAmplitude(value, displayIndeterminate);
    // Running indicators start at the official cycle origin. A newly mounted static
    // indeterminate preview needs a visible frame instead of an empty linear track.
    const phase = useSharedValue(indeterminate && !moving ? 0.2 : 0);
    const wavePhase = useSharedValue(0);
    const animatedProgress = useSharedValue(value);
    const completion = useSharedValue(0);
    const amplitudeFraction = useSharedValue(waveTarget);
    const progressDuration = theme.motion.duration.long2 * theme.animation.scale;
    const previousTarget = useRef(value);
    const previousAmplitudeTarget = useRef(waveTarget);
    const transitionRevision = useRef(0);
    const mounted = useRef(true);
    const hasRunIndeterminate = useRef(false);
    const finishTransition = useCallback((revision: number) => {
        if (mounted.current && transitionRevision.current === revision) setDisplayIndeterminate(false);
    }, []);
    const standardCurve = theme.motion.easing.standard;
    const accelerateCurve = theme.motion.easing.emphasizedAccelerate;

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            transitionRevision.current += 1;
            [phase, wavePhase, animatedProgress, amplitudeFraction, completion].forEach(cancelAnimation);
        };
    }, [amplitudeFraction, animatedProgress, completion, phase, wavePhase]);

    useEffect(() => {
        const targetChanged = previousTarget.current !== value;
        previousTarget.current = value;
        if (motionAllowed && paused && !targetChanged) {
            cancelAnimation(animatedProgress);
            return;
        }
        animatedProgress.set(
            displayIndeterminate
                ? 0
                : !motionAllowed
                  ? value
                  : appearance === 'wavy'
                    ? withTiming(value, { duration: progressDuration, easing: Easing.linear })
                    : withSpring(value, {
                          stiffness: 50,
                          damping: 2 * Math.sqrt(50),
                          mass: 1,
                          overshootClamping: true,
                          energyThreshold: 0.000001,
                      })
        );
    }, [animatedProgress, appearance, displayIndeterminate, motionAllowed, paused, progressDuration, value]);

    useEffect(() => {
        const targetChanged = previousAmplitudeTarget.current !== waveTarget;
        previousAmplitudeTarget.current = waveTarget;
        if (motionAllowed && paused && !targetChanged) {
            cancelAnimation(amplitudeFraction);
            return;
        }
        const curve = waveTarget > amplitudeFraction.get() ? standardCurve : accelerateCurve;
        amplitudeFraction.set(
            motionAllowed
                ? withTiming(waveTarget, { duration: progressDuration, easing: Easing.bezier(...curve) }, (finished) => {
                      // Let the wave continue travelling throughout its amplitude fade.
                      if (finished && waveTarget === 0) cancelAnimation(wavePhase);
                  })
                : waveTarget
        );
    }, [accelerateCurve, amplitudeFraction, motionAllowed, paused, progressDuration, standardCurve, wavePhase, waveTarget]);

    useEffect(() => {
        cancelAnimation(phase);
        if (moving && (indeterminate || (displayIndeterminate && variant === 'circular'))) {
            if (indeterminate && !hasRunIndeterminate.current) {
                hasRunIndeterminate.current = true;
                phase.set(0);
            }
            // Repeating from the current phase makes pause/resume continuous.
            phase.set(
                withRepeat(withTiming(phase.get() + 1, { duration: duration * theme.animation.scale, easing: Easing.linear }), -1, false)
            );
        }
        return () => cancelAnimation(phase);
    }, [displayIndeterminate, duration, indeterminate, moving, phase, theme.animation.scale, variant]);

    useEffect(() => {
        cancelAnimation(wavePhase);
        if (moving && amplitude > 0 && (waveTarget > 0 || amplitudeFraction.get() > 0) && waveSpeedValue > 0) {
            // One wavelength per second, independent of the indeterminate segment's period.
            wavePhase.set(
                withRepeat(
                    withTiming(wavePhase.get() + 1, {
                        duration: Math.max(16, (1000 * waveLengthValue) / waveSpeedValue) * theme.animation.scale,
                        easing: Easing.linear,
                    }),
                    -1,
                    false
                )
            );
        }
        return () => cancelAnimation(wavePhase);
    }, [amplitude, amplitudeFraction, moving, theme.animation.scale, waveLengthValue, wavePhase, waveSpeedValue, waveTarget]);

    useEffect(() => {
        const revision = ++transitionRevision.current;
        cancelAnimation(completion);
        if (indeterminate) {
            completion.set(0);
            setDisplayIndeterminate(true);
            return;
        }
        if (!displayIndeterminate) return;
        if (!motionAllowed) {
            completion.set(0);
            setDisplayIndeterminate(false);
            return;
        }
        if (paused) return;
        // Finish the outgoing motion before revealing a determinate value. A linear
        // disjoint indicator finishes its current cycle; a circular one closes its arc.
        if (variant === 'linear') {
            const current = phase.get();
            const remaining = 1 - (((current % 1) + 1) % 1);
            phase.set(
                withTiming(
                    current + remaining,
                    { duration: remaining * duration * theme.animation.scale, easing: Easing.linear },
                    (finished) => {
                        if (finished) scheduleOnRN(finishTransition, revision);
                    }
                )
            );
        } else {
            // Material Android's complete-end ObjectAnimator keeps its default
            // accelerate/decelerate cosine curve. Store linear play time so pause
            // resumes the same curve, rather than restarting its easing.
            completion.set(
                withTiming(1, { duration: (1 - completion.get()) * progressDuration, easing: Easing.linear }, (finished) => {
                    if (finished) scheduleOnRN(finishTransition, revision);
                })
            );
        }
        return () => {
            transitionRevision.current += 1;
            cancelAnimation(completion);
            if (variant === 'linear') cancelAnimation(phase);
        };
    }, [
        completion,
        displayIndeterminate,
        duration,
        finishTransition,
        indeterminate,
        motionAllowed,
        paused,
        phase,
        progressDuration,
        standardCurve,
        theme.animation.scale,
        variant,
    ]);

    const graphicProps: GraphicProps = {
        amplitude,
        completion,
        amplitudeFraction,
        showTrack,
        showStopIndicator,
        wavelength: waveLengthValue,
        color: color ?? theme.colors.primary,
        indeterminate: displayIndeterminate,
        phase,
        wavePhase,
        progress: animatedProgress,
        size: sizeValue,
        thickness: stroke,
        trackColor: trackColor ?? theme.colors.secondaryContainer,
    };
    const percent = Math.round(value * 100);

    return (
        <View
            accessible
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="progressbar"
            accessibilityState={{ busy: indeterminate || value < 1 }}
            accessibilityValue={indeterminate ? { text: 'En curso' } : { min: 0, max: 100, now: percent, text: `${percent} %` }}
            style={[variant === 'circular' ? { height: sizeValue, width: sizeValue } : { alignSelf: 'stretch' }, style]}
            testID={testID}
        >
            {variant === 'circular' ? (
                <CircularGraphic {...graphicProps} />
            ) : (
                <View style={direction === 'rtl' ? { transform: [{ scaleX: -1 }] } : undefined}>
                    <LinearGraphic {...graphicProps} />
                </View>
            )}
        </View>
    );
}
