import { getScrollIndicatorProps, type ScrollIndicatorOptions } from '../scroll-indicators';
/**
 * Pull distance/threshold/tension adapted from AndroidX PullToRefresh.kt,
 * Copyright2023 The Android Open Source Project, Apache License2.0.
 * https://www.apache.org/licenses/LICENSE-2.0
 * Reference: androidx/androidx@d153d87ed76372ece0c99dac837ff07ab845d495,
 * compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/pulltorefresh/PullToRefresh.kt
 * RN gesture arbitration is an adaptation, not Compose's nested-scroll engine.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    cancelAnimation,
    ReduceMotion,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { useMobileTheme } from '../core';
import { LoadingIndicator } from './loading-indicator';
import { webAccessibility } from '../web-accessibility';

type PullToRefreshViewportProps = Omit<ScrollViewProps, 'onScroll' | 'style' | 'refreshControl'> &
    Pick<ComponentProps<typeof Animated.ScrollView>, 'onScroll' | 'style'>;
const refreshAccessibilityAction = 'mobile-design-refresh';

export type PullToRefreshProps = Omit<ScrollViewProps, 'children' | 'onScroll' | 'refreshControl' | 'style'> & {
    /** Scrollbars are opt-in for this component only; both axes are hidden by default. */
    scrollIndicators?: ScrollIndicatorOptions;
    refreshing: boolean;
    onRefresh: () => void;
    children?: ReactNode;
    /** Supply one Animated.FlatList/SectionList viewport without nesting it in a ScrollView. Forward the provided scroll props. */
    renderScrollComponent?: (props: PullToRefreshViewportProps) => ReactNode;
    /** Overlay stays above content; adjacent translates content below the indicator. */
    indicatorMode?: 'overlay' | 'adjacent';
    threshold?: number;
    enabled?: boolean;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
};

/** Official drag multiplier/tension; input/output are density-independent pixels. */
export function pullToRefreshOffset(distance: number, threshold = 80) {
    'worklet';
    const adjusted = Math.max(0, distance) * 0.5;
    if (adjusted <= threshold) return adjusted;
    const tension = Math.min(2, adjusted / threshold - 1);
    return threshold * (1 + tension - (tension * tension) / 4);
}

/** Owns its scroll viewport: give it flex1 with no vertical ScrollView parent. */
export function PullToRefresh({
    scrollIndicators,
    showsVerticalScrollIndicator,
    showsHorizontalScrollIndicator,
    refreshing,
    onRefresh,
    children,
    renderScrollComponent,
    indicatorMode = 'overlay',
    threshold: requestedThreshold = 80,
    enabled = true,
    style,
    contentContainerStyle,
    accessibilityLabel = 'Actualizar contenido',
    testID = 'mobile-pull-to-refresh',
    ...scrollProps
}: PullToRefreshProps) {
    const theme = useMobileTheme();
    const threshold = Number.isFinite(requestedThreshold) ? Math.max(1, requestedThreshold) : 80;
    const reduced = theme.animation.scale === 0;
    const offset = useSharedValue(refreshing ? threshold : 0);
    const scrollY = useSharedValue(0);
    const startX = useSharedValue(0),
        startY = useSharedValue(0),
        origin = useSharedValue(0);
    const distance = useSharedValue(0),
        pending = useSharedValue(false);
    const refreshingUI = useSharedValue(refreshing),
        enabledUI = useSharedValue(enabled);
    const reducedUI = useSharedValue(reduced);
    const refreshBlend = useSharedValue(Number(refreshing));
    const requestRevision = useSharedValue(0);
    const controlVersionUI = useSharedValue(0),
        aliveUI = useSharedValue(true);
    const controlVersion = useRef(0),
        processedRequest = useRef(0);
    const latest = useRef({ refreshing, enabled, onRefresh });
    const alive = useRef(true),
        frame = useRef<ReturnType<typeof requestAnimationFrame> | undefined>(undefined);
    const settle = useCallback(
        (target: number) => {
            'worklet';
            cancelAnimation(offset);
            // PullToRefreshState's Animatable.animateTo uses Compose's default spring:
            // StiffnessMedium1500, DampingRatioNoBouncy1, with no release-velocity override.
            offset.set(
                reducedUI.get()
                    ? target
                    : withSpring(target, {
                          stiffness: 1500,
                          damping: 2 * Math.sqrt(1500),
                          mass: 1,
                          overshootClamping: true,
                          reduceMotion: ReduceMotion.Never,
                      })
            );
        },
        [offset, reducedUI]
    );
    useLayoutEffect(() => {
        latest.current = { refreshing, enabled, onRefresh };
    }, [enabled, onRefresh, refreshing]);
    useLayoutEffect(() => {
        const version = ++controlVersion.current;
        // RN shared writes are asynchronous. Apply configuration and its dependent
        // settle decision together on UI, rather than set(reduced) then get(oldReduced).
        scheduleOnUI(
            (version: number, refreshing: boolean, enabled: boolean, reduced: boolean, threshold: number) => {
                'worklet';
                if (version < controlVersionUI.get()) return;
                controlVersionUI.set(version);
                aliveUI.set(true);
                refreshingUI.set(refreshing);
                enabledUI.set(enabled);
                reducedUI.set(reduced);
                requestRevision.set(requestRevision.get() + 1);
                pending.set(false);
                distance.set(0);
                settle(refreshing ? threshold : 0);
            },
            version,
            refreshing,
            enabled,
            reduced,
            threshold
        );
    }, [
        aliveUI,
        controlVersionUI,
        distance,
        enabled,
        enabledUI,
        pending,
        reduced,
        reducedUI,
        refreshing,
        refreshingUI,
        requestRevision,
        settle,
        threshold,
    ]);
    useEffect(() => {
        const effects = theme.motion.spring.default.effects;
        refreshBlend.set(
            reduced
                ? Number(refreshing)
                : withSpring(Number(refreshing), {
                      stiffness: effects.stiffness,
                      damping: 2 * effects.damping * Math.sqrt(effects.stiffness),
                      overshootClamping: true,
                      reduceMotion: ReduceMotion.Never,
                  })
        );
        return () => cancelAnimation(refreshBlend);
    }, [reduced, refreshBlend, refreshing, theme.motion]);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            const version = ++controlVersion.current;
            if (frame.current != null) cancelAnimationFrame(frame.current);
            scheduleOnUI((version: number) => {
                'worklet';
                controlVersionUI.set(version);
                aliveUI.set(false);
                cancelAnimation(offset);
                pending.set(false);
                requestRevision.set(requestRevision.get() + 1);
            }, version);
        };
    }, [aliveUI, controlVersionUI, offset, pending, requestRevision]);
    const requestRefresh = useCallback(
        (version: number, token: number) => {
            // These guards belong to RN and update immediately, even while the matching
            // configuration transaction is waiting in the UI queue.
            if (
                !alive.current ||
                controlVersion.current !== version ||
                latest.current.refreshing ||
                !latest.current.enabled ||
                token <= processedRequest.current
            )
                return;
            processedRequest.current = token;
            try {
                latest.current.onRefresh();
            } finally {
                // Like Compose, allow one frame for the controlled refreshing update.
                frame.current = requestAnimationFrame(() => {
                    frame.current = undefined;
                    if (!alive.current || controlVersion.current !== version) return;
                    const refreshing = latest.current.refreshing;
                    scheduleOnUI(
                        (version: number, token: number, refreshing: boolean) => {
                            'worklet';
                            if (!aliveUI.get() || controlVersionUI.get() !== version || requestRevision.get() !== token) return;
                            pending.set(false);
                            if (!refreshing) settle(0);
                        },
                        version,
                        token,
                        refreshing
                    );
                });
            }
        },
        [aliveUI, controlVersionUI, pending, requestRevision, settle]
    );
    const beginRefresh = useCallback(() => {
        'worklet';
        if (!aliveUI.get() || !enabledUI.get() || refreshingUI.get() || pending.get()) return;
        const token = requestRevision.get() + 1;
        requestRevision.set(token);
        pending.set(true);
        settle(threshold);
        scheduleOnRN(requestRefresh, controlVersionUI.get(), token);
    }, [aliveUI, controlVersionUI, enabledUI, pending, refreshingUI, requestRefresh, requestRevision, settle, threshold]);
    const gestures = useMemo(() => {
        const native = Gesture.Native();
        const pan = Gesture.Pan()
            .manualActivation(true)
            .enabled(enabled)
            .simultaneousWithExternalGesture(native)
            .onTouchesDown((event) => {
                const touch = event.allTouches[0];
                if (touch) {
                    startX.set(touch.absoluteX);
                    startY.set(touch.absoluteY);
                }
            })
            .onTouchesMove((event, manager) => {
                const touch = event.allTouches[0];
                if (!touch || !aliveUI.get() || !enabledUI.get() || refreshingUI.get() || pending.get()) {
                    manager.fail();
                    return;
                }
                const dx = touch.absoluteX - startX.get(),
                    dy = touch.absoluteY - startY.get();
                if ((Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) || dy < -8) {
                    manager.fail();
                    return;
                }
                if (scrollY.get() <= 0.5 && dy > 8 && dy > Math.abs(dx)) manager.activate();
            })
            .onStart((event) => {
                if (!aliveUI.get()) return;
                cancelAnimation(offset);
                origin.set(event.translationY);
                distance.set(0);
            })
            .onUpdate((event) => {
                if (!aliveUI.get() || refreshingUI.get() || !enabledUI.get()) return;
                const next = Math.max(0, event.translationY - origin.get());
                distance.set(next);
                offset.set(pullToRefreshOffset(next, threshold));
            })
            .onEnd(() => {
                if (!aliveUI.get() || refreshingUI.get() || !enabledUI.get()) return;
                if (distance.get() * 0.5 > threshold) beginRefresh();
                else settle(0);
                distance.set(0);
            })
            .onFinalize((_event, success) => {
                if (aliveUI.get() && !success && !refreshingUI.get() && !pending.get()) {
                    distance.set(0);
                    settle(0);
                }
            });
        return Gesture.Simultaneous(native, pan);
    }, [
        aliveUI,
        beginRefresh,
        controlVersionUI,
        distance,
        enabled,
        enabledUI,
        offset,
        origin,
        pending,
        refreshingUI,
        requestRefresh,
        requestRevision,
        scrollY,
        settle,
        startX,
        startY,
        threshold,
    ]);
    const onScroll = useAnimatedScrollHandler((event) => {
        scrollY.set(Math.max(0, event.contentOffset.y));
    });
    const fraction = useDerivedValue(() => Math.max(0, offset.get() / threshold));
    const indicatorStyle = useAnimatedStyle(() => ({
        opacity: offset.get() > 0.1 ? 1 : 0,
        transform: [{ translateY: offset.get() - 48 }],
    }));
    const extraRotation = useAnimatedStyle(() => ({
        transform: [{ rotate: `${reduced || refreshing ? 0 : -Math.max(0, fraction.get() - 1) * 180}deg` }],
    }));
    const determinateOpacity = useAnimatedStyle(() => ({ opacity: 1 - Math.max(0, Math.min(1, refreshBlend.get())) }));
    const indeterminateOpacity = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, refreshBlend.get())) }));
    const contentStyle = useAnimatedStyle(() => ({ transform: [{ translateY: indicatorMode === 'adjacent' ? offset.get() : 0 }] }));
    const viewportProps: PullToRefreshViewportProps = {
        ...getScrollIndicatorProps({
            vertical: showsVerticalScrollIndicator ?? scrollIndicators?.vertical,
            horizontal: showsHorizontalScrollIndicator ?? scrollIndicators?.horizontal,
        }),
        ...scrollProps,
        accessibilityActions: [
            ...(scrollProps.accessibilityActions ?? []).filter((action) => action.name !== refreshAccessibilityAction),
            ...(enabled && !refreshing ? [{ name: refreshAccessibilityAction, label: accessibilityLabel }] : []),
        ],
        onAccessibilityAction: (event) => {
            if (event.nativeEvent.actionName !== refreshAccessibilityAction) {
                scrollProps.onAccessibilityAction?.(event);
                return;
            }
            if (alive.current && latest.current.enabled && !latest.current.refreshing) scheduleOnUI(beginRefresh);
        },
        bounces: false,
        overScrollMode: 'never',
        onScroll,
        scrollEventThrottle: 16,
        style: [{ flex: 1 }, contentStyle],
        contentContainerStyle,
        keyboardShouldPersistTaps: scrollProps.keyboardShouldPersistTaps ?? 'handled',
        testID: `${testID}-scroll`,
        children,
    };
    return (
        <View style={[{ flex: 1, overflow: 'hidden' }, style]} testID={testID}>
            <GestureDetector gesture={gestures}>
                {renderScrollComponent ? renderScrollComponent(viewportProps) : <Animated.ScrollView {...viewportProps} />}
            </GestureDetector>
            <Animated.View
                pointerEvents="none"
                accessible={refreshing}
                accessibilityRole="progressbar"
                accessibilityLabel={accessibilityLabel}
                accessibilityState={{ busy: refreshing }}
                {...webAccessibility({ state: { busy: refreshing }, hidden: !refreshing })}
                accessibilityElementsHidden={!refreshing}
                importantForAccessibility={refreshing ? 'yes' : 'no-hide-descendants'}
                style={[{ position: 'absolute', top: 0, alignSelf: 'center', width: 48, height: 48, zIndex: 1 }, indicatorStyle]}
                testID={`${testID}-indicator`}
            >
                <View
                    style={[StyleSheet.absoluteFill, { borderRadius: 24, backgroundColor: theme.colors.primaryContainer }]}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    {...webAccessibility({ hidden: true })}
                >
                    <Animated.View style={[StyleSheet.absoluteFill, extraRotation, determinateOpacity]}>
                        <LoadingIndicator color={theme.colors.onPrimaryContainer} gestureProgress={fraction} animating={false} />
                    </Animated.View>
                    <Animated.View style={[StyleSheet.absoluteFill, indeterminateOpacity]}>
                        <LoadingIndicator color={theme.colors.onPrimaryContainer} animating={refreshing} />
                    </Animated.View>
                </View>
            </Animated.View>
        </View>
    );
}
