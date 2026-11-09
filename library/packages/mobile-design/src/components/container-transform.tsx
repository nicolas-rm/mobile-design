/// <reference path="../paper-internals.d.ts" />
import { useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { View, useWindowDimensions, type ColorValue, type LayoutChangeEvent, type ViewInstance } from 'react-native';
import { ReduceMotionContext } from 'react-native-paper/lib/module/theme/accessibility/ReduceMotionContext';
import Animated, { interpolateColor, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import type { MobileDesignTheme } from '../core';
import { toIconColor } from '../color';
import { useOverlayPresence } from './sheets';

/** A snapshot measured by the actual source's measureInWindow, in logical dp. */
export type ContainerTransformOrigin = {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number;
    backgroundColor?: ColorValue;
    /** Optional decorative source content; do not pass another interactive control. */
    content?: ReactNode;
};
type Bounds = Pick<ContainerTransformOrigin, 'x' | 'y' | 'width' | 'height'>;
type Measurement = 'waiting' | 'ready' | 'fallback';

function validBounds(bounds: Bounds | undefined): bounds is Bounds {
    return !!bounds && [bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite) && bounds.width > 0 && bounds.height > 0;
}
function captureOrigin(origin: ContainerTransformOrigin | undefined): ContainerTransformOrigin | undefined {
    return validBounds(origin)
        ? {
              ...origin,
              borderRadius: Number.isFinite(origin.borderRadius) ? Math.max(0, origin.borderRadius!) : 0,
          }
        : undefined;
}

/** Share the existing presence/cancellation controller; latch a source until return finishes. */
export function useContainerTransformPresence(
    visible: boolean,
    origin: ContainerTransformOrigin | undefined,
    theme: MobileDesignTheme,
    onClosed?: () => void
) {
    const reduced = useContext(ReduceMotionContext) || theme.animation.scale === 0;
    const [session, setSession] = useState(() => ({ open: visible, origin: captureOrigin(origin), generation: 0 }));
    // Adjust at the opening edge before effects run. A caller rerendering its source
    // node cannot restart an already visible dialog, and return keeps its snapshot.
    if (session.open !== visible)
        setSession({
            open: visible,
            origin: visible ? captureOrigin(origin) : session.origin,
            generation: session.generation + Number(visible),
        });
    const [measurement, setMeasurement] = useState<{ origin: ContainerTransformOrigin; generation: number; state: Measurement }>();
    const source = session.origin;
    const status =
        measurement && measurement.origin === source && measurement.generation === session.generation ? measurement.state : 'waiting';
    const transforming = !!source && !reduced && status !== 'fallback';
    const ready = !transforming || status === 'ready';
    const generation = session.generation;
    const latest = useRef({ visible, source, generation });
    useLayoutEffect(() => {
        latest.current = { visible, source, generation };
    }, [generation, source, visible]);
    const measured = useCallback(
        (captured: ContainerTransformOrigin, state: Exclude<Measurement, 'waiting'>) => {
            if (!latest.current.visible || latest.current.source !== captured || latest.current.generation !== generation) return;
            setMeasurement((previous) =>
                previous && previous.origin === captured && previous.generation === generation && previous.state === state
                    ? previous
                    : { origin: captured, generation, state }
            );
        },
        [generation]
    );
    const closed = useCallback(() => {
        setMeasurement(undefined);
        onClosed?.();
    }, [onClosed]);
    // MDC MaterialContainerTransform resolves Long2 enter / Medium4 return and
    // emphasized easing. Ordinary dialogs retain their existing fade tokens.
    const duration = reduced
        ? 0
        : (transforming
              ? visible
                  ? theme.motion.duration.long2
                  : theme.motion.duration.medium4
              : visible
                ? theme.motion.duration.medium2
                : theme.motion.duration.short4) * theme.animation.scale;
    const presence = useOverlayPresence(visible, duration, 'timing', closed, {
        ready,
        easing: transforming ? theme.motion.easing.emphasized : undefined,
    });
    return { ...presence, origin: source, transforming, measured };
}

/**
 * RN adaptation of MDC's linear container path, rounded mask and content fade.
 * The destination remains one mounted tree at its final layout width: only the
 * mask bounds change, never text/icon scale or line wrapping per animation frame.
 * Missing measurement deliberately falls back to the normal dialog fade.
 */
export function ContainerTransformSurface({
    origin,
    transforming,
    entering,
    progress,
    onMeasured,
    borderRadius,
    backgroundColor,
    fill = false,
    maxHeight,
    children,
    testID,
}: {
    origin?: ContainerTransformOrigin;
    transforming: boolean;
    entering: boolean;
    progress: SharedValue<number>;
    onMeasured: (origin: ContainerTransformOrigin, state: 'ready' | 'fallback') => void;
    borderRadius: number;
    backgroundColor: ColorValue;
    fill?: boolean;
    maxHeight?: number;
    children: ReactNode;
    testID?: string;
}) {
    const host = useRef<ViewInstance>(null);
    const alive = useRef(false);
    const revision = useRef(0);
    const frame = useRef<number | undefined>(undefined);
    const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const [bounds, setBounds] = useState<Bounds>();
    const [naturalHeight, setNaturalHeight] = useState<number>();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    useLayoutEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            revision.current += 1;
            if (frame.current !== undefined) cancelAnimationFrame(frame.current);
            if (deadline.current !== undefined) clearTimeout(deadline.current);
        };
    }, []);
    const measure = useCallback(() => {
        if (!transforming || !origin) return;
        const captured = origin;
        const token = ++revision.current;
        if (frame.current !== undefined) cancelAnimationFrame(frame.current);
        if (deadline.current !== undefined) clearTimeout(deadline.current);
        frame.current = requestAnimationFrame(() => {
            frame.current = undefined;
            if (!alive.current || token !== revision.current) return;
            const node = host.current;
            if (!node?.measureInWindow) {
                onMeasured(captured, 'fallback');
                return;
            }
            const complete = (next?: Bounds) => {
                if (!alive.current || token !== revision.current) return;
                revision.current += 1;
                if (deadline.current !== undefined) clearTimeout(deadline.current);
                deadline.current = undefined;
                if (next)
                    setBounds((previous) =>
                        previous && Object.keys(next).every((key) => previous[key as keyof Bounds] === next[key as keyof Bounds])
                            ? previous
                            : next
                    );
                onMeasured(captured, next ? 'ready' : 'fallback');
            };
            // Measurement is asynchronous and a native node can disappear without
            // delivering its callback. This is an availability deadline, not a
            // motion token: never leave an otherwise usable destination invisible.
            deadline.current = setTimeout(() => complete(), 200);
            try {
                node.measureInWindow((x, y, width, height) => {
                    if (!alive.current || token !== revision.current) return;
                    const next = { x, y, width, height };
                    complete(validBounds(next) ? next : undefined);
                });
            } catch {
                complete();
            }
        });
    }, [onMeasured, origin, transforming]);
    useLayoutEffect(() => {
        measure();
        return () => {
            revision.current += 1;
            if (frame.current !== undefined) cancelAnimationFrame(frame.current);
            if (deadline.current !== undefined) clearTimeout(deadline.current);
        };
    }, [measure, windowHeight, windowWidth]);
    const hasMask = transforming && !!origin && !!bounds;
    const sourceX = origin?.x ?? 0;
    const sourceY = origin?.y ?? 0;
    const sourceWidth = origin?.width ?? 1;
    const sourceHeight = origin?.height ?? 1;
    const sourceRadius = Number.isFinite(origin?.borderRadius) ? Math.max(0, origin!.borderRadius!) : 0;
    const sourceColor = origin?.backgroundColor ?? backgroundColor;
    const fromColor = toIconColor(sourceColor ?? undefined);
    const toColor = toIconColor(backgroundColor ?? undefined);
    const targetX = bounds?.x ?? 0;
    const targetY = bounds?.y ?? 0;
    const targetWidth = bounds?.width ?? 1;
    const targetHeight = bounds?.height ?? 1;
    const maskStyle = useAnimatedStyle(() => {
        const p = Math.max(0, Math.min(1, progress.get()));
        if (!hasMask)
            return {
                opacity: transforming ? 0 : p,
                left: undefined,
                top: undefined,
                width: undefined,
                height: undefined,
                borderRadius: undefined,
                backgroundColor: undefined,
            };
        // Linear interpolation of top/center is the default MDC path motion.
        // On return, MDC's shape interval .30–.90 maps to p .70–.10.
        const shape = entering ? Math.min(1, p / 0.75) : Math.max(0, Math.min(1, (p - 0.1) / 0.6));
        return {
            opacity: 1,
            left: (sourceX - targetX) * (1 - p),
            top: (sourceY - targetY) * (1 - p),
            width: sourceWidth + (targetWidth - sourceWidth) * p,
            height: sourceHeight + (targetHeight - sourceHeight) * p,
            borderRadius: sourceRadius + (borderRadius - sourceRadius) * shape,
            backgroundColor:
                typeof fromColor === 'string' && typeof toColor === 'string'
                    ? interpolateColor(p, [0, 1], [fromColor, toColor])
                    : p < 0.5
                      ? sourceColor
                      : backgroundColor,
        };
    });
    const contentStyle = useAnimatedStyle(() => {
        const p = Math.max(0, Math.min(1, progress.get()));
        // MDC default FADE_IN: incoming over source (0–.25); on return the
        // destination fades out at elapsed .60–.90 (remaining p .40–.10).
        const opacity = entering ? Math.min(1, p / 0.25) : Math.max(0, Math.min(1, (p - 0.1) / 0.3));
        return { opacity: hasMask ? opacity : 1 };
    });
    const originStyle = useAnimatedStyle(() => {
        const p = Math.max(0, Math.min(1, progress.get()));
        const width = sourceWidth + (targetWidth - sourceWidth) * p;
        const height = sourceHeight + (targetHeight - sourceHeight) * p;
        return { left: (width - sourceWidth) / 2, top: (height - sourceHeight) / 2 };
    });
    const onLayout = (_event: LayoutChangeEvent) => measure();
    return (
        <View
            ref={host}
            collapsable={false}
            onLayout={onLayout}
            style={{ flexShrink: 1, maxHeight, ...(fill ? { flex: 1 } : hasMask ? { height: naturalHeight ?? targetHeight } : {}) }}
            testID={testID}
        >
            <Animated.View
                style={[
                    fill ? { flex: 1 } : { flexShrink: 1 },
                    hasMask ? { position: 'absolute', overflow: 'hidden' } : undefined,
                    maskStyle,
                ]}
            >
                {hasMask && origin.content ? (
                    <Animated.View
                        pointerEvents="none"
                        accessible={false}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        style={[
                            {
                                position: 'absolute',
                                width: sourceWidth,
                                height: sourceHeight,
                                alignItems: 'center',
                                justifyContent: 'center',
                            },
                            originStyle,
                        ]}
                    >
                        {origin.content}
                    </Animated.View>
                ) : null}
                <Animated.View
                    onLayout={(event) => {
                        if (!fill) setNaturalHeight(event.nativeEvent.layout.height);
                    }}
                    style={[
                        fill ? { flex: 1 } : { flexShrink: 1, maxHeight },
                        hasMask
                            ? { position: 'absolute', left: 0, top: 0, width: targetWidth, ...(fill ? { height: targetHeight } : {}) }
                            : undefined,
                        contentStyle,
                    ]}
                >
                    {children}
                </Animated.View>
            </Animated.View>
        </View>
    );
}
