import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from 'react-native-paper';
import { ReduceMotionContext } from 'react-native-paper/lib/module/theme/accessibility/ReduceMotionContext';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useMobileTheme } from '../core';

/** The same direction indicator in both renderers; it remains part of the field target. */
export function ChoiceIndicator({ expanded, testID }: { expanded: boolean; testID?: string }) {
    const theme = useMobileTheme();
    const reduced = useContext(ReduceMotionContext) || theme.animation.scale === 0;
    const rotation = useSharedValue(expanded ? 180 : 0);
    useEffect(() => {
        const spring = theme.motion.spring.fast.spatial;
        rotation.set(
            reduced
                ? expanded
                    ? 180
                    : 0
                : withSpring(expanded ? 180 : 0, {
                      stiffness: spring.stiffness,
                      damping: 2 * spring.damping * Math.sqrt(spring.stiffness),
                      reduceMotion: ReduceMotion.Never,
                  })
        );
        return () => cancelAnimation(rotation);
    }, [expanded, reduced, rotation, theme]);
    const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.get()}deg` }] }));
    return (
        <Animated.View testID={testID} style={[{ width: 24, height: 24, opacity: 1 }, style]}>
            <Icon source="arrow_drop_down" size={24} color={theme.colors.onSurfaceVariant} />
        </Animated.View>
    );
}

/** Retain a choice surface until FastEffects completes, including reversals. */
export function useChoicePresence(visible: boolean) {
    const theme = useMobileTheme();
    const reduced = useContext(ReduceMotionContext) || theme.animation.scale === 0;
    const [present, setPresent] = useState(visible);
    const state = useRef({ visible, alive: true, revision: 0 });
    state.current.visible = visible;
    const opacity = useSharedValue(0),
        scale = useSharedValue(0.8),
        origin = useSharedValue({ x: 0, y: 0 });
    const finish = useCallback((revision: number) => {
        if (state.current.alive && !state.current.visible && state.current.revision === revision) setPresent(false);
    }, []);
    useEffect(() => {
        state.current.alive = true;
        return () => {
            state.current.alive = false;
            state.current.revision++;
            cancelAnimation(opacity);
            cancelAnimation(scale);
        };
    }, [opacity, scale]);
    useLayoutEffect(() => {
        const revision = ++state.current.revision;
        cancelAnimation(opacity);
        cancelAnimation(scale);
        if (visible && !present) {
            setPresent(true);
            return;
        }
        if (!present) return;
        if (reduced) {
            opacity.set(visible ? 1 : 0);
            scale.set(visible ? 1 : 0.8);
            if (!visible) finish(revision);
            return;
        }
        const spatial = theme.motion.spring.fast.spatial,
            effects = theme.motion.spring.fast.effects;
        scale.set(
            withSpring(visible ? 1 : 0.8, {
                stiffness: spatial.stiffness,
                damping: 2 * spatial.damping * Math.sqrt(spatial.stiffness),
                reduceMotion: ReduceMotion.Never,
            })
        );
        opacity.set(
            withSpring(
                visible ? 1 : 0,
                {
                    stiffness: effects.stiffness,
                    damping: 2 * effects.damping * Math.sqrt(effects.stiffness),
                    overshootClamping: true,
                    reduceMotion: ReduceMotion.Never,
                },
                (done) => {
                    if (done && !visible) scheduleOnRN(finish, revision);
                }
            )
        );
        return () => {
            state.current.revision++;
            cancelAnimation(opacity);
            cancelAnimation(scale);
        };
    }, [finish, opacity, present, reduced, scale, theme, visible]);
    const style = useAnimatedStyle(() => ({
        opacity: opacity.get(),
        transform: [{ scale: scale.get() }],
        transformOrigin: [origin.get().x, origin.get().y, 0],
    }));
    return { present, style, origin };
}
