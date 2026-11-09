// SPDX-License-Identifier: Apache-2.0
// Adapted from AndroidX AppBar.kt, Copyright 2021 The Android Open Source Project.
// https://github.com/androidx/androidx/blob/d153d87ed76372ece0c99dac837ff07ab845d495/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/AppBar.kt
// See ../../LICENSE-Apache-2.0.txt and ../../NOTICE.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { useTheme, type Theme } from 'react-native-paper';
import { Gesture } from 'react-native-gesture-handler';
import {
    cancelAnimation,
    ReduceMotion,
    useAnimatedScrollHandler,
    useDerivedValue,
    useSharedValue,
    withDecay,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { appBarFinite, appBarFraction } from './appbar-layout';
export type AppBarScrollMode = 'pinned' | 'exit-until-collapsed' | 'enter-always';
type Metrics = {
    expanded: number;
    collapsed: number;
    top: number;
};
export type AppBarScrollBehavior = {
    onScroll: ReturnType<typeof useAnimatedScrollHandler>;
    collapseProgress: SharedValue<number>;
    heightOffset: SharedValue<number>;
    /** Resets the bar; the caller still owns the ScrollView and its scrollTo. */
    reset: () => void;
    /** @internal Measured by TopAppBar, not configured by the consuming screen. */
    _metrics: SharedValue<Metrics>;
    /** @internal */ _mode: SharedValue<AppBarScrollMode>;
    /** @internal */ _contentOffset: SharedValue<number>;
    /** @internal */ _setLayout: (expanded: number, collapsed: number, top: number) => void;
    /** @internal Mounted on the bar only; pinned bars have no pan recognizer. */
    _dragGesture?: ReturnType<typeof Gesture.Pan>;
};
function limit(metrics: Metrics, mode: AppBarScrollMode) {
    'worklet';
    return mode === 'pinned'
        ? 0
        : mode === 'enter-always'
          ? metrics.expanded + metrics.top
          : Math.max(0, metrics.expanded - metrics.collapsed);
}
/**
 * ScrollView adapter for MD3 pinned/exit-until-collapsed/enter-always behavior.
 * Native scrolling supplies momentum; its frames never visit the RN runtime.
 * Unlike Compose NestedScrollConnection it cannot consume a child's pre-scroll.
 */
export function useAppBarScrollBehavior({
    behavior = 'exit-until-collapsed',
    snap = true,
}: {
    behavior?: AppBarScrollMode;
    snap?: boolean;
} = {}): AppBarScrollBehavior {
    const theme = useTheme<Theme>();
    const reduced = theme.animation.scale === 0;
    const springStiffness = theme.motion.spring.default.effects.stiffness;
    const springDamping = 2 * theme.motion.spring.default.effects.damping * Math.sqrt(springStiffness);
    const mounted = useRef(true);
    const metrics = useSharedValue<Metrics>({
        expanded: 64,
        collapsed: 64,
        top: 0,
    });
    const mode = useSharedValue(behavior),
        snapEnabled = useSharedValue(snap),
        reducedUI = useSharedValue(reduced);
    const contentOffset = useSharedValue(0),
        heightOffset = useSharedValue(0),
        previousY = useSharedValue(0);
    const alive = useSharedValue(true),
        settling = useSharedValue(false),
        snapTarget = useSharedValue(0),
        revision = useSharedValue(0);
    const dragging = useSharedValue(false),
        dragTranslation = useSharedValue(0),
        barInertia = useSharedValue(false);
    const collapseProgress = useDerivedValue(() => {
        const current = metrics.get(),
            range = current.expanded - current.collapsed;
        return range > 0 ? appBarFraction(-heightOffset.get() / range) : 0;
    });
    const stop = useCallback(() => {
        'worklet';
        revision.set(revision.get() + 1);
        cancelAnimation(heightOffset);
        settling.set(false);
        barInertia.set(false);
    }, [barInertia, heightOffset, revision, settling]);
    const settle = useCallback(() => {
        'worklet';
        if (!alive.get() || !snapEnabled.get()) return;
        const range = limit(metrics.get(), mode.get());
        if (range <= 0) return;
        const current = Math.max(-range, Math.min(0, appBarFinite(heightOffset.get())));
        if (current === 0 || current === -range) return;
        stop();
        const target = current <= -range / 2 ? -range : 0;
        snapTarget.set(target);
        if (reducedUI.get()) {
            heightOffset.set(target);
            return;
        }
        settling.set(true);
        const token = revision.get();
        // TopAppBarDefaults.snapAnimationSpec = MotionScheme.DefaultEffects.
        heightOffset.set(
            withSpring(
                target,
                {
                    stiffness: springStiffness,
                    damping: springDamping,
                    mass: 1,
                    overshootClamping: true,
                    reduceMotion: ReduceMotion.Never,
                },
                (finished) => {
                    if (finished && alive.get() && revision.get() === token) settling.set(false);
                }
            )
        );
    }, [alive, heightOffset, metrics, mode, reducedUI, revision, settling, snapEnabled, snapTarget, springDamping, springStiffness, stop]);
    // RN Web does not emit ScrollView's drag/momentum end events. Wait for
    // the browser's scroll stream to become idle, then use the same snap spring.
    const webIdle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const clearWebIdle = useCallback(() => {
        if (Platform.OS === 'web') clearTimeout(webIdle.current);
        webIdle.current = undefined;
    }, []);
    const queueWebSettle = useCallback(() => {
        clearWebIdle();
        webIdle.current = setTimeout(() => {
            webIdle.current = undefined;
            if (mounted.current && !dragging.get() && !barInertia.get()) scheduleOnUI(settle);
        }, 120);
    }, [barInertia, clearWebIdle, dragging, settle]);
    const releaseBar = useCallback(
        (velocity: number) => {
            'worklet';
            if (!alive.get()) return;
            const range = limit(metrics.get(), mode.get());
            const current = Math.max(-range, Math.min(0, appBarFinite(heightOffset.get())));
            if (range <= 0 || current === 0 || current === -range) return;
            if (reducedUI.get() || Math.abs(appBarFinite(velocity)) <= 1) {
                settle();
                return;
            }
            stop();
            settling.set(true);
            barInertia.set(true);
            snapTarget.set(current <= -range / 2 ? -range : 0);
            const token = revision.get();
            // AndroidX settles a direct bar fling with decay, then DefaultEffects.
            // RN uses Reanimated's native decay here; its friction is an adaptation,
            // not a claim of Android's platform-specific spline physics on iOS.
            heightOffset.set(
                withDecay({ velocity, clamp: [-range, 0], reduceMotion: ReduceMotion.Never }, (finished) => {
                    if (!finished || !alive.get() || revision.get() !== token) return;
                    settling.set(false);
                    barInertia.set(false);
                    settle();
                })
            );
        },
        [alive, barInertia, heightOffset, metrics, mode, reducedUI, revision, settle, settling, snapTarget, stop]
    );
    const dragGesture = useMemo(
        () =>
            behavior === 'pinned'
                ? undefined
                : Gesture.Pan()
                      // Android's MD3 draggable observes touch slop before taking a vertical
                      // drag. A tap/hold never activates this recognizer; horizontal input fails.
                      .activeOffsetY([-8, 8])
                      .failOffsetX([-8, 8])
                      .maxPointers(1)
                      .cancelsTouchesInView(true)
                      .onStart((event) => {
                          if (!alive.get() || mode.get() === 'pinned') return;
                          stop();
                          dragging.set(true);
                          const translation = appBarFinite(event.translationY);
                          dragTranslation.set(translation);
                          const overslop = Math.sign(translation) * Math.max(0, Math.abs(translation) - 8);
                          const range = limit(metrics.get(), mode.get());
                          heightOffset.set(Math.max(-range, Math.min(0, heightOffset.get() + overslop)));
                      })
                      .onUpdate((event) => {
                          if (!alive.get() || !dragging.get() || mode.get() === 'pinned' || !Number.isFinite(event.translationY)) return;
                          const translation = event.translationY;
                          const delta = translation - dragTranslation.get();
                          dragTranslation.set(translation);
                          const range = limit(metrics.get(), mode.get());
                          heightOffset.set(Math.max(-range, Math.min(0, heightOffset.get() + delta)));
                      })
                      .onEnd((event, success) => {
                          if (!dragging.get()) return;
                          dragging.set(false);
                          releaseBar(success ? appBarFinite(event.velocityY) : 0);
                      })
                      .onFinalize(() => {
                          if (!dragging.get()) return;
                          dragging.set(false);
                          releaseBar(0);
                      }),
        [alive, behavior, dragTranslation, dragging, heightOffset, metrics, mode, releaseBar, stop]
    );
    const onScroll = useAnimatedScrollHandler({
        onBeginDrag: (event) => {
            if (!alive.get()) return;
            dragging.set(false);
            stop();
            previousY.set(Math.max(0, appBarFinite(event.contentOffset.y, previousY.get())));
        },
        onScroll: (event) => {
            if (!alive.get() || !Number.isFinite(event.contentOffset.y)) return;
            const y = Math.max(0, event.contentOffset.y),
                previous = previousY.get(),
                delta = y - previous;
            previousY.set(y);
            contentOffset.set(y);
            if (Platform.OS === 'web') scheduleOnRN(queueWebSettle);
            // A second native momentum stream must not fight a drag/fling of
            // the bar. A new content drag above explicitly takes ownership.
            if (dragging.get() || barInertia.get()) return;
            const currentMode = mode.get(),
                range = limit(metrics.get(), currentMode);
            if (range <= 0) {
                if (heightOffset.get() !== 0) {
                    stop();
                    heightOffset.set(0);
                }
                return;
            }
            if (delta === 0 && y > 0) return;
            stop();
            const consumed = currentMode === 'exit-until-collapsed' && delta < 0 ? Math.min(range, y) - Math.min(range, previous) : delta;
            const next = y === 0 ? 0 : heightOffset.get() - consumed;
            heightOffset.set(Math.max(-range, Math.min(0, appBarFinite(next))));
        },
        onEndDrag: (event) => {
            if (dragging.get() || barInertia.get()) return;
            // iOS may report a nonzero release velocity without starting any
            // momentum sequence. Wait only when it projects an actual travel;
            // on platforms without that projection, MomentumBegin cancels the
            // provisional settle before native momentum owns subsequent frames.
            const target = event.targetContentOffset?.y;
            if (!Number.isFinite(target) || Math.abs(target! - event.contentOffset.y) < 0.5) settle();
        },
        onMomentumBegin: () => {
            if (alive.get() && !dragging.get() && !barInertia.get()) stop();
        },
        onMomentumEnd: () => {
            if (!dragging.get() && !barInertia.get()) settle();
        },
    });
    const updateLayout = useCallback(
        (expanded: number, collapsed: number, top: number) => {
            'worklet';
            if (!alive.get()) return;
            const old = metrics.get();
            const next = {
                expanded: Math.max(64, appBarFinite(expanded, 64)),
                collapsed: Math.max(64, appBarFinite(collapsed, 64)),
                top: Math.max(0, appBarFinite(top)),
            };
            next.expanded = Math.max(next.expanded, next.collapsed);
            if (old.expanded === next.expanded && old.collapsed === next.collapsed && old.top === next.top) return;
            const oldCollapse = Math.max(0, old.expanded - old.collapsed),
                newCollapse = Math.max(0, next.expanded - next.collapsed);
            const offset = Math.max(0, -appBarFinite(heightOffset.get()));
            const rebased =
                offset <= oldCollapse && oldCollapse > 0
                    ? (offset / oldCollapse) * newCollapse
                    : mode.get() === 'enter-always' && offset > oldCollapse
                      ? newCollapse + ((offset - oldCollapse) / Math.max(1, old.collapsed + old.top)) * (next.collapsed + next.top)
                      : Math.min(offset, newCollapse);
            stop();
            dragging.set(false);
            metrics.set(next);
            heightOffset.set(-Math.min(limit(next, mode.get()), rebased));
        },
        [alive, dragging, heightOffset, metrics, mode, stop]
    );
    const setLayout = useCallback(
        (expanded: number, collapsed: number, top: number) => {
            if (mounted.current) scheduleOnUI(updateLayout, expanded, collapsed, top);
        },
        [updateLayout]
    );
    const resetUI = useCallback(() => {
        'worklet';
        if (!alive.get()) return;
        stop();
        dragging.set(false);
        heightOffset.set(0);
        previousY.set(0);
        contentOffset.set(0);
    }, [alive, contentOffset, dragging, heightOffset, previousY, stop]);
    const reset = useCallback(() => {
        clearWebIdle();
        if (mounted.current) scheduleOnUI(resetUI);
    }, [clearWebIdle, resetUI]);
    useLayoutEffect(() => {
        clearWebIdle();
        scheduleOnUI(
            (nextMode: AppBarScrollMode, nextSnap: boolean, nextReduced: boolean) => {
                'worklet';
                if (!alive.get()) return;
                const wasSettling = settling.get(),
                    wasInertia = barInertia.get(),
                    target = snapTarget.get();
                const changedMode = nextMode !== mode.get();
                stop();
                if (changedMode) dragging.set(false);
                mode.set(nextMode);
                snapEnabled.set(nextSnap);
                reducedUI.set(nextReduced);
                const range = limit(metrics.get(), nextMode);
                const reducedTarget = wasInertia ? (heightOffset.get() <= -range / 2 ? -range : 0) : target;
                const next = changedMode
                    ? Math.max(-range, Math.min(0, heightOffset.get()))
                    : nextReduced && wasSettling
                      ? reducedTarget
                      : heightOffset.get();
                heightOffset.set(Math.max(-limit(metrics.get(), nextMode), Math.min(0, next)));
            },
            behavior,
            snap,
            reduced
        );
    }, [
        alive,
        clearWebIdle,
        barInertia,
        behavior,
        dragging,
        heightOffset,
        metrics,
        mode,
        reduced,
        reducedUI,
        settling,
        snap,
        snapEnabled,
        snapTarget,
        stop,
    ]);
    useEffect(() => {
        mounted.current = true;
        scheduleOnUI(() => {
            'worklet';
            alive.set(true);
        });
        return () => {
            mounted.current = false;
            clearWebIdle();
            scheduleOnUI(() => {
                'worklet';
                alive.set(false);
                dragging.set(false);
                stop();
            });
        };
    }, [alive, clearWebIdle, dragging, stop]);
    return useMemo(
        () => ({
            onScroll,
            collapseProgress,
            heightOffset,
            reset,
            _metrics: metrics,
            _mode: mode,
            _contentOffset: contentOffset,
            _setLayout: setLayout,
            _dragGesture: dragGesture,
        }),
        [collapseProgress, contentOffset, dragGesture, heightOffset, metrics, mode, onScroll, reset, setLayout]
    );
}
