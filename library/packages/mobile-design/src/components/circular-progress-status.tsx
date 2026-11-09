import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
    cancelAnimation,
    Easing,
    ReduceMotion,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { useMobileTheme } from '../core';
import { ProgressIndicator } from './progress-indicator';
import { circularProgressPath, clampProgress, progressEasing } from './progress-indicator-paths';
import { webAccessibility } from '../web-accessibility';

const AnimatedPath = Animated.createAnimatedComponent(Path);
export type CircularProgressStatusProps = {
    status: 'progress' | 'success';
    progress?: number;
    appearance?: 'flat' | 'wavy';
    size?: number;
    thickness?: number;
    color?: ColorValue;
    progressLabel?: string;
    successLabel?: string;
    animated?: boolean;
    onSuccessAnimationEnd?: () => void;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

/** Presentation stages observed in M3's Progress-Indicator-Overview video.
 * This is a progress→result composition, not a third normative progress shape.
 * Retraction/check durations are measured reference approximations, not published tokens.
 */
export function progressStatusGeometry(elapsed: number, settle: number, retract: number, draw: number, size: number, stroke: number) {
    'worklet';
    const tail = progressEasing((elapsed - settle) / Math.max(1, retract), 0.2, 0, 0, 1);
    const check = clampProgress((elapsed - settle - retract) / Math.max(1, draw));
    return {
        ring: elapsed < settle || tail >= 1 ? '' : circularProgressPath(tail, 1, size, size / 2 - stroke / 2),
        check,
        ringVisible: elapsed >= settle && elapsed < settle + retract,
    };
}

/** Retains the indicator's center, stroke color and footprint when work completes. */
export function CircularProgressStatus({
    status,
    progress,
    appearance = 'wavy',
    size = 48,
    thickness = 4,
    color,
    progressLabel = 'Processing payment…',
    successLabel = 'Payment complete',
    animated = true,
    onSuccessAnimationEnd,
    style,
    testID = 'circular-progress-status',
}: CircularProgressStatusProps) {
    const theme = useMobileTheme();
    const moving = animated && theme.animation.scale > 0;
    const actualSize = Number.isFinite(size) ? Math.max(24, Math.min(240, size)) : 48;
    const stroke = Number.isFinite(thickness) ? Math.max(1, Math.min(actualSize / 4, thickness)) : 4;
    const ink = color ?? theme.colors.primary;
    const [completed, setCompleted] = useState(status === 'success' && !moving);
    const time = useSharedValue(0);
    const revision = useRef(0),
        alive = useRef(true),
        delivered = useRef(false);
    const settleRef = useRef(progress === undefined ? theme.motion.duration.long2 * 2 : theme.motion.duration.long2);
    const latest = useRef(onSuccessAnimationEnd);
    useEffect(() => {
        latest.current = onSuccessAnimationEnd;
    }, [onSuccessAnimationEnd]);
    const settle = settleRef.current;
    const retract = 500,
        draw = 200;
    const finish = useCallback((token: number) => {
        if (!alive.current || revision.current !== token || delivered.current) return;
        delivered.current = true;
        setCompleted(true);
        latest.current?.();
    }, []);
    const revealCaption = useCallback((token: number) => {
        if (alive.current && revision.current === token) setCompleted(true);
    }, []);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            revision.current++;
            cancelAnimation(time);
        };
    }, [time]);
    useEffect(() => {
        const token = ++revision.current;
        cancelAnimation(time);
        if (status === 'progress') {
            settleRef.current = progress === undefined ? theme.motion.duration.long2 * 2 : theme.motion.duration.long2;
            delivered.current = false;
            time.set(0);
            setCompleted(false);
        } else {
            if (delivered.current) time.set(settle + retract + draw);
            else if (!moving) {
                time.set(settle + retract + draw);
                finish(token);
            } else {
                time.set(0);
                time.set(
                    withSequence(
                        withTiming(
                            settle + retract,
                            {
                                duration: (settle + retract) * theme.animation.scale,
                                easing: Easing.linear,
                                reduceMotion: ReduceMotion.Never,
                            },
                            (finished) => {
                                if (finished) scheduleOnRN(revealCaption, token);
                            }
                        ),
                        withTiming(
                            settle + retract + draw,
                            { duration: draw * theme.animation.scale, easing: Easing.linear, reduceMotion: ReduceMotion.Never },
                            (finished) => {
                                if (finished) scheduleOnRN(finish, token);
                            }
                        )
                    )
                );
            }
        }
        return () => {
            revision.current++;
            cancelAnimation(time);
        };
    }, [finish, moving, progress, revealCaption, settle, status, theme.animation.scale, theme.motion.duration.long2, time]);
    const graphic = useAnimatedStyle(() => ({ opacity: status === 'progress' || time.get() < settle ? 1 : 0 }));
    const ring = useAnimatedProps(() => ({ d: progressStatusGeometry(time.get(), settle, retract, draw, actualSize, stroke).ring }));
    const checkLength = Math.hypot(10, 10) + Math.hypot(18, 18);
    const check = useAnimatedProps(() => ({
        strokeDashoffset: checkLength * (1 - progressStatusGeometry(time.get(), settle, retract, draw, actualSize, stroke).check),
        opacity: time.get() >= settle + retract ? 1 : 0,
    }));
    const accessibilityValue =
        status === 'progress'
            ? progress == null
                ? { text: 'En curso' }
                : { min: 0, max: 100, now: Math.round(clampProgress(progress) * 100) }
            : undefined;
    return (
        <View
            accessible
            accessibilityRole={status === 'progress' ? 'progressbar' : 'text'}
            accessibilityLabel={completed ? successLabel : progressLabel}
            accessibilityState={{ busy: status === 'progress' }}
            accessibilityValue={accessibilityValue}
            {...webAccessibility({ state: { busy: status === 'progress' }, value: accessibilityValue })}
            {...(Platform.OS === 'web' ? { role: status === 'progress' ? ('progressbar' as const) : ('status' as const) } : {})}
            accessibilityLiveRegion="polite"
            style={[{ alignItems: 'center', justifyContent: 'center', gap: 16 }, style]}
            testID={testID}
        >
            <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                {...webAccessibility({ hidden: true })}
                style={{ width: actualSize, height: actualSize }}
            >
                <Animated.View style={[{ position: 'absolute', inset: 0 }, graphic]}>
                    <ProgressIndicator
                        variant="circular"
                        appearance={appearance}
                        progress={status === 'success' ? 1 : progress}
                        size={actualSize}
                        thickness={stroke}
                        color={ink}
                        animated={animated}
                    />
                </Animated.View>
                {status === 'success' ? (
                    <Svg width={actualSize} height={actualSize} style={{ position: 'absolute', inset: 0 }}>
                        <AnimatedPath animatedProps={ring} stroke={ink} strokeWidth={stroke} strokeLinecap="round" fill="none" />
                        <Svg width={actualSize} height={actualSize} viewBox="0 0 48 48">
                            <AnimatedPath
                                animatedProps={check}
                                d="M 10 24 L 20 34 L 38 16"
                                stroke={ink}
                                strokeWidth={6}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                                strokeDasharray={[checkLength, checkLength]}
                            />
                        </Svg>
                    </Svg>
                ) : null}
            </View>
            <Text
                accessible={false}
                {...webAccessibility({ hidden: true })}
                variant="bodyMedium"
                style={{ textAlign: 'center', color: theme.colors.onSurface }}
            >
                {completed ? successLabel : progressLabel}
            </Text>
        </View>
    );
}
