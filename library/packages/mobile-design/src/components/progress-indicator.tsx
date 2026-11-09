import { webAccessibility } from '../web-accessibility';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { useLocale } from 'react-native-paper';
import Animated, {
    ReduceMotion,
    cancelAnimation,
    Easing,
    useAnimatedProps,
    useAnimatedReaction,
    useSharedValue,
    withRepeat,
    withTiming,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { useMobileTheme } from '../core';
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
    /** UI-thread value (0–1) for determinate progress. Also supply progress for an accessible numeric value. */
    progressSource?: SharedValue<number>;
    /** Disable motion and immediately render the supplied value (static examples). */
    animated?: boolean;
    /** Freeze the current frame; explicit value changes can still be demonstrated while paused. */
    paused?: boolean;
    size?: number;
    thickness?: number;
    color?: ColorValue;
    trackColor?: ColorValue;
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
    color: ColorValue;
    indeterminate: boolean;
    phase: SharedValue<number>;
    wavePhase: SharedValue<number>;
    progress: SharedValue<number>;
    size: number;
    thickness: number;
    trackColor: ColorValue;
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
        const gap = (4 + thickness) / (Math.PI * 2 * radius);
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
    progressSource,
    animated = true,
    paused = false,
    size,
    thickness,
    color,
    trackColor,
    showTrack = true,
    showStopIndicator = true,
    direction,
    waveAmplitude,
    wavelength,
    waveSpeed,
    animationDuration,
    accessibilityLabel = 'Progreso',
    style,
    testID = 'progress-indicator',
}: ProgressIndicatorProps) {
    const theme = useMobileTheme();
    const locale = useLocale();
    const resolvedDirection = direction ?? locale.direction;
    const indeterminate = progress === undefined && progressSource === undefined;
    const [displayIndeterminate, setDisplayIndeterminate] = useState(indeterminate);
    const value = clampProgress(progress ?? 0);
    const thick = Number.isFinite(thickness) && thickness! >= 8;
    const defaultSize = (appearance === 'wavy' ? 48 : 40) + (thick ? 4 : 0);
    const sizeValue = Number.isFinite(size) ? Math.max(24, Math.min(240, size!)) : defaultSize;
    const sizeScale = sizeValue / defaultSize;
    const stroke = Number.isFinite(thickness)
        ? Math.max(1, variant === 'circular' ? Math.min(thickness!, sizeValue / 4) : thickness!)
        : variant === 'circular'
          ? 4 * sizeScale
          : 4;
    const defaultAmplitude = variant === 'circular' ? 1.6 * sizeScale : 3;
    const amplitude =
        appearance === 'wavy'
            ? Math.min(
                  Math.max(0, Number.isFinite(waveAmplitude) ? waveAmplitude! : defaultAmplitude),
                  variant === 'circular' ? (sizeValue - stroke) / 4 : 24
              )
            : 0;
    const defaultWavelength = variant === 'circular' ? 15 * sizeScale : displayIndeterminate ? 20 : 40;
    const waveLengthValue = Number.isFinite(wavelength) ? Math.max(8, wavelength!) : defaultWavelength;
    const waveSpeedValue = Number.isFinite(waveSpeed) ? Math.max(0, waveSpeed!) : waveLengthValue;
    const duration = Number.isFinite(animationDuration) ? Math.max(200, animationDuration!) : variant === 'linear' ? 1750 : 6000;
    const motionAllowed = animated && theme.animation.scale > 0;
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
                    ? withTiming(value, { reduceMotion: ReduceMotion.Never, duration: progressDuration, easing: Easing.linear })
                    : withSpring(value, {
                          reduceMotion: ReduceMotion.Never,
                          stiffness: 50,
                          damping: 2 * Math.sqrt(50),
                          mass: 1,
                          overshootClamping: true,
                          energyThreshold: 0.000001,
                      })
        );
    }, [animatedProgress, appearance, displayIndeterminate, motionAllowed, paused, progressDuration, value]);

    useEffect(() => {
        // A live source owns the same amplitude thresholds on UI, independently
        // of the less frequent accessible progress updates supplied by its owner.
        if (progressSource && !displayIndeterminate) return;
        const targetChanged = previousAmplitudeTarget.current !== waveTarget;
        previousAmplitudeTarget.current = waveTarget;
        if (motionAllowed && paused && !targetChanged) {
            cancelAnimation(amplitudeFraction);
            return;
        }
        const curve = waveTarget > amplitudeFraction.get() ? standardCurve : accelerateCurve;
        amplitudeFraction.set(
            motionAllowed
                ? withTiming(
                      waveTarget,
                      { reduceMotion: ReduceMotion.Never, duration: progressDuration, easing: Easing.bezier(...curve) },
                      (finished) => {
                          // Let the wave continue travelling throughout its amplitude fade.
                          if (finished && waveTarget === 0 && !progressSource) cancelAnimation(wavePhase);
                      }
                  )
                : waveTarget
        );
    }, [
        accelerateCurve,
        amplitudeFraction,
        displayIndeterminate,
        motionAllowed,
        paused,
        progressDuration,
        progressSource,
        standardCurve,
        wavePhase,
        waveTarget,
    ]);

    useAnimatedReaction(
        () =>
            progressSource && !displayIndeterminate
                ? {
                      value: progressWaveAmplitude(clampProgress(progressSource.get()), false),
                      animated: motionAllowed,
                      duration: progressDuration,
                  }
                : null,
        (target, previous) => {
            if (
                target === null ||
                (target.value === previous?.value && target.animated === previous?.animated && target.duration === previous?.duration)
            )
                return;
            cancelAnimation(amplitudeFraction);
            const curve = target.value > amplitudeFraction.get() ? standardCurve : accelerateCurve;
            amplitudeFraction.set(
                target.animated
                    ? withTiming(target.value, {
                          reduceMotion: ReduceMotion.Never,
                          duration: target.duration,
                          easing: Easing.bezier(...curve),
                      })
                    : target.value
            );
        }
    );

    useEffect(() => {
        cancelAnimation(phase);
        if (moving && (indeterminate || (displayIndeterminate && variant === 'circular'))) {
            let cycleStart = phase.get();
            if (indeterminate && !hasRunIndeterminate.current) {
                hasRunIndeterminate.current = true;
                phase.set(0);
                // RN set is deferred; reading phase again here can still return
                // the static preview's .2 and incorrectly target1.2 for this cycle.
                cycleStart = 0;
            }
            // Repeating from the current phase makes pause/resume continuous.
            phase.set(
                withRepeat(
                    withTiming(cycleStart + 1, {
                        reduceMotion: ReduceMotion.Never,
                        duration: duration * theme.animation.scale,
                        easing: Easing.linear,
                    }),
                    -1,
                    false,
                    undefined,
                    ReduceMotion.Never
                )
            );
        }
        return () => cancelAnimation(phase);
    }, [displayIndeterminate, duration, indeterminate, moving, phase, theme.animation.scale, variant]);

    useEffect(() => {
        cancelAnimation(wavePhase);
        if (moving && amplitude > 0 && (progressSource || waveTarget > 0 || amplitudeFraction.get() > 0) && waveSpeedValue > 0) {
            // One wavelength per second, independent of the indeterminate segment's period.
            wavePhase.set(
                withRepeat(
                    withTiming(wavePhase.get() + 1, {
                        reduceMotion: ReduceMotion.Never,
                        duration: Math.max(16, (1000 * waveLengthValue) / waveSpeedValue) * theme.animation.scale,
                        easing: Easing.linear,
                    }),
                    -1,
                    false,
                    undefined,
                    ReduceMotion.Never
                )
            );
        }
        return () => cancelAnimation(wavePhase);
    }, [
        amplitude,
        amplitudeFraction,
        moving,
        progressSource,
        theme.animation.scale,
        waveLengthValue,
        wavePhase,
        waveSpeedValue,
        waveTarget,
    ]);

    useEffect(() => {
        const revision = ++transitionRevision.current;
        cancelAnimation(completion);
        if (indeterminate) {
            completion.set(0);
            // An existing determinate preview can retain phase 0 (or a completed
            // integer cycle). Without motion, that would leave the line empty.
            // Only entering a new unknown task selects a visible static frame;
            // pausing an already running task still preserves its current frame.
            if (!displayIndeterminate && (!motionAllowed || paused)) phase.set(0.2);
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
                    { reduceMotion: ReduceMotion.Never, duration: remaining * duration * theme.animation.scale, easing: Easing.linear },
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
                withTiming(
                    1,
                    { reduceMotion: ReduceMotion.Never, duration: (1 - completion.get()) * progressDuration, easing: Easing.linear },
                    (finished) => {
                        if (finished) scheduleOnRN(finishTransition, revision);
                    }
                )
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
        progress: !displayIndeterminate && progressSource ? progressSource : animatedProgress,
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
            accessibilityState={{ busy: indeterminate || progress === undefined || value < 1 }}
            accessibilityValue={
                progress === undefined || indeterminate ? { text: 'En curso' } : { min: 0, max: 100, now: percent, text: `${percent} %` }
            }
            style={[
                variant === 'circular'
                    ? { height: sizeValue, width: sizeValue }
                    : { alignSelf: 'stretch', minWidth: 40, paddingHorizontal: 4 },
                style,
            ]}
            testID={testID}
            {...webAccessibility({
                role: 'progressbar',
                state: { busy: indeterminate || progress === undefined || value < 1 },
                value:
                    progress === undefined || indeterminate
                        ? { text: 'En curso' }
                        : { min: 0, max: 100, now: percent, text: `${percent} %` },
                hidden: undefined,
            })}
        >
            {variant === 'circular' ? (
                <CircularGraphic {...graphicProps} />
            ) : (
                <View style={resolvedDirection === 'rtl' ? { transform: [{ scaleX: -1 }] } : undefined}>
                    <LinearGraphic {...graphicProps} />
                </View>
            )}
        </View>
    );
}
