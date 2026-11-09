import { webAccessibility } from '../web-accessibility';
/*
 * Shape vertices, repetition and sequence adapted from AndroidX MaterialShapes.kt and
 * LoadingIndicator.kt, Copyright 2024 The Android Open Source Project, Apache License2.0.
 * Licensed under the Apache License, Version2.0 (the "License"); you may not use this file
 * except in compliance with the License. https://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for permissions and limitations.
 * Source: androidx/androidx@d153d87ed76372ece0c99dac837ff07ab845d495,
 * compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/{MaterialShapes,LoadingIndicator}.kt
 * The SVG correspondence/resampling below is an RN adaptation, not AndroidX graphics-shapes Morph.
 */
import { useEffect } from 'react';
import { StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, type Theme } from 'react-native-paper';
import Animated, {
    cancelAnimation,
    Easing,
    ReduceMotion,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

export type LoadingIndicatorProps = {
    variant?: 'contained' | 'uncontained';
    /** Pull-to-refresh gesture morph only; this is not determinate task progress. Omit during an ongoing load. */
    gestureProgress?: number | SharedValue<number>;
    size?: number;
    animating?: boolean;
    visible?: boolean;
    color?: ColorValue;
    containerColor?: ColorValue;
    accessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};
type Point = { x: number; y: number };
type Vertex = Point & { r: number };
type Morph = { from: number[]; to: number[] };
const sampleCount = 112;
const tau = Math.PI * 2;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const lerpPoint = (a: Point, b: Point, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function repeat(vertices: readonly Vertex[], reps: number, mirrored = false): Vertex[] {
    const output: Vertex[] = [];
    const sections = mirrored ? reps * 2 : reps;
    const angle = tau / sections;
    const firstAngle = Math.atan2(vertices[0].y - 0.5, vertices[0].x - 0.5);
    for (let section = 0; section < sections; section++)
        for (let j = 0; j < vertices.length; j++) {
            const i = mirrored && section % 2 ? vertices.length - j - 1 : j;
            if (mirrored && section % 2 && i === 0) continue;
            const v = vertices[i];
            const a = Math.atan2(v.y - 0.5, v.x - 0.5);
            const radius = Math.hypot(v.x - 0.5, v.y - 0.5);
            const finalAngle = section * angle + (mirrored && section % 2 ? angle - a + 2 * firstAngle : a);
            output.push({ x: 0.5 + Math.cos(finalAngle) * radius, y: 0.5 + Math.sin(finalAngle) * radius, r: v.r });
        }
    return output;
}

/** Circular rounded corners with shared edge budgets; all default loading shapes use smoothing0. */
function rounded(vertices: readonly Vertex[]): Point[] {
    const n = vertices.length;
    const corners = vertices.map((p, i) => {
        const before = vertices[(i + n - 1) % n];
        const after = vertices[(i + 1) % n];
        const aLength = distance(before, p);
        const bLength = distance(after, p);
        const a = { x: (before.x - p.x) / aLength, y: (before.y - p.y) / aLength };
        const b = { x: (after.x - p.x) / bLength, y: (after.y - p.y) / bLength };
        const cosine = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y));
        const sinHalf = Math.sqrt((1 - cosine) / 2);
        const cosHalf = Math.sqrt((1 + cosine) / 2);
        return { p, a, b, aLength, bLength, sinHalf, cosHalf, cut: sinHalf > 1e-6 ? (p.r * cosHalf) / sinHalf : 0 };
    });
    const output: Point[] = [];
    corners.forEach((c, i) => {
        const before = corners[(i + n - 1) % n];
        const after = corners[(i + 1) % n];
        const budget = Math.min(1, c.aLength / Math.max(1e-9, c.cut + before.cut), c.bLength / Math.max(1e-9, c.cut + after.cut));
        const cut = c.cut * budget;
        const start = { x: c.p.x + c.a.x * cut, y: c.p.y + c.a.y * cut };
        const end = { x: c.p.x + c.b.x * cut, y: c.p.y + c.b.y * cut };
        if (cut < 1e-6 || c.cosHalf < 1e-6) {
            output.push(c.p);
            return;
        }
        const radius = (cut * c.sinHalf) / c.cosHalf;
        const sweep = Math.PI - 2 * Math.asin(c.sinHalf);
        const handle = ((radius * 4) / 3) * Math.tan(sweep / 4);
        const control1 = { x: start.x - c.a.x * handle, y: start.y - c.a.y * handle };
        const control2 = { x: end.x - c.b.x * handle, y: end.y - c.b.y * handle };
        for (let step = 0; step <= 12; step++) {
            const t = step / 12;
            const u = 1 - t;
            output.push({
                x: u ** 3 * start.x + 3 * u ** 2 * t * control1.x + 3 * u * t ** 2 * control2.x + t ** 3 * end.x,
                y: u ** 3 * start.y + 3 * u ** 2 * t * control1.y + 3 * u * t ** 2 * control2.y + t ** 3 * end.y,
            });
        }
    });
    return output;
}

function normalizeAndSample(points: Point[]): Point[] {
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    const side = Math.max(maxX - minX, maxY - minY);
    const normalized = points.map((p) => ({ x: (p.x - (maxX + minX) / 2) / side, y: (p.y - (maxY + minY) / 2) / side }));
    const lengths = normalized.map((p, i) => distance(p, normalized[(i + 1) % normalized.length]));
    const perimeter = lengths.reduce((sum, length) => sum + length, 0);
    let segment = 0;
    let before = 0;
    return Array.from({ length: sampleCount }, (_, i) => {
        const target = (i * perimeter) / sampleCount;
        while (segment < lengths.length - 1 && before + lengths[segment] < target) before += lengths[segment++];
        return lerpPoint(
            normalized[segment],
            normalized[(segment + 1) % normalized.length],
            (target - before) / Math.max(1e-9, lengths[segment])
        );
    });
}
function star(count: number, inner: number, radius: number, rotation = 0) {
    return rounded(
        Array.from({ length: count * 2 }, (_, i) => {
            const angle = (i * Math.PI) / count + rotation;
            const r = i % 2 ? inner : 1;
            return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, r: radius };
        })
    );
}
function ellipse(ratio: number, rotation: number) {
    return Array.from({ length: 256 }, (_, i) => {
        const a = (i * tau) / 256;
        const x = Math.cos(a);
        const y = Math.sin(a) * ratio;
        return { x: x * Math.cos(rotation) - y * Math.sin(rotation), y: x * Math.sin(rotation) + y * Math.cos(rotation) };
    });
}
function makeMorph(from: Point[], next: Point[]): Morph {
    let bestShift = 0;
    let bestCost = Infinity;
    for (let shift = 0; shift < sampleCount; shift++) {
        let cost = 0;
        for (let i = 0; i < sampleCount; i++) {
            const a = from[i];
            const b = next[(i + shift) % sampleCount];
            cost += (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        }
        if (cost < bestCost) {
            bestCost = cost;
            bestShift = shift;
        }
    }
    const cubicCoordinates = (points: Point[]) =>
        points.flatMap((p, i) => {
            const before = points[(i + sampleCount - 1) % sampleCount];
            const to = points[(i + 1) % sampleCount];
            const after = points[(i + 2) % sampleCount];
            return [
                p.x,
                p.y,
                p.x + (to.x - before.x) / 6,
                p.y + (to.y - before.y) / 6,
                to.x - (after.x - p.x) / 6,
                to.y - (after.y - p.y) / 6,
                to.x,
                to.y,
            ];
        });
    return { from: cubicCoordinates(from), to: cubicCoordinates(next.map((_, i) => next[(i + bestShift) % sampleCount])) };
}

// Official MaterialShapes vertices/radii; this work is cached at module load, never per frame.
const shapes = [
    rounded(
        repeat(
            [
                { x: 0.193, y: 0.277, r: 0.053 },
                { x: 0.176, y: 0.055, r: 0.053 },
            ],
            10
        )
    ),
    star(9, 0.8, 0.5, -Math.PI / 2),
    rounded(
        repeat(
            [
                { x: 0.5, y: -0.009, r: 0.172 },
                { x: 1.03, y: 0.365, r: 0.164 },
                { x: 0.828, y: 0.97, r: 0.169 },
            ],
            1,
            true
        )
    ),
    rounded(
        repeat(
            [
                { x: 0.961, y: 0.039, r: 0.426 },
                { x: 1.001, y: 0.428, r: 0 },
                { x: 1, y: 0.609, r: 1 },
            ],
            2,
            true
        )
    ),
    star(8, 0.8, 0.15),
    rounded(
        repeat(
            [
                { x: 1.237, y: 1.236, r: 0.258 },
                { x: 0.5, y: 0.918, r: 0.233 },
            ],
            4
        )
    ),
    ellipse(0.64, -Math.PI / 4),
].map(normalizeAndSample);
const morphs = shapes.map((shape, i) => makeMorph(shape, shapes[(i + 1) % shapes.length]));
const determinateMorph = makeMorph(normalizeAndSample(ellipse(1, Math.PI / 10)), shapes[0]);
const maxRadius = Math.max(...shapes.flatMap((shape) => shape.map((p) => Math.hypot(p.x, p.y))));
const pathScale = 38 / (2 * maxRadius);

function morphPath(morph: Morph, progress: number) {
    'worklet';
    // Control points and correspondence are cached; each frame only interpolates scalar arrays.
    const coordinate = (i: number) => 24 + (morph.from[i] + (morph.to[i] - morph.from[i]) * progress) * pathScale;
    let d = `M${coordinate(0)},${coordinate(1)}`;
    for (let i = 0; i < morph.from.length; i += 8)
        d += `C${coordinate(i + 2)},${coordinate(i + 3)} ${coordinate(i + 4)},${coordinate(i + 5)} ${coordinate(i + 6)},${coordinate(i + 7)}`;
    return `${d}Z`;
}
const AnimatedPath = Animated.createAnimatedComponent(Path);
function progressFraction(value: number) {
    'worklet';
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

/** SVG morphing for brief ongoing loads, with the separate pull-to-refresh gesture presentation. */
export function LoadingIndicator({
    variant = 'uncontained',
    gestureProgress,
    size = 48,
    animating = true,
    visible = true,
    color,
    containerColor,
    accessibilityLabel = 'Cargando',
    style,
    testID = 'mobile-loading-indicator',
}: LoadingIndicatorProps) {
    const theme = useTheme<Theme>();
    const reduced = theme.animation.scale === 0;
    const pulling = gestureProgress !== undefined;
    const value = typeof gestureProgress === 'number' && Number.isFinite(gestureProgress) ? Math.max(0, Math.min(1, gestureProgress)) : 0;
    const clock = useSharedValue(0);
    const shapeIndex = useSharedValue(0);
    const morph = useSharedValue(0);
    const rotation = useSharedValue(0);
    const morphRotation = useSharedValue(90);
    const position = useSharedValue(value);
    const liveProgress = typeof gestureProgress === 'object' ? gestureProgress : position;
    const scale = theme.animation.scale;
    useEffect(() => {
        position.set(value);
    }, [position, value]);
    useEffect(() => {
        cancelAnimation(clock);
        cancelAnimation(morph);
        cancelAnimation(rotation);
        if (pulling || reduced || !visible || !animating) return;
        const spring = {
            stiffness: 200,
            damping: 0.6 * 2 * Math.sqrt(200),
            mass: 1,
            energyThreshold: 0.01,
            reduceMotion: ReduceMotion.Never,
        };
        // The source uses a component-specific spring, not the generic theme spring.
        morph.set(withSpring(1, spring));
        clock.set(0);
        clock.set(
            withRepeat(
                withTiming(1, { duration: 650 * scale, easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (finished) => {
                    if (!finished) return;
                    shapeIndex.set((shapeIndex.get() + 1) % morphs.length);
                    morphRotation.set((morphRotation.get() + 90) % 360);
                    morph.set(0);
                    morph.set(withSpring(1, spring));
                }),
                -1,
                false,
                undefined,
                ReduceMotion.Never
            )
        );
        rotation.set(
            withRepeat(
                withTiming(rotation.get() + 360, { duration: 4666 * scale, easing: Easing.linear, reduceMotion: ReduceMotion.Never }),
                -1,
                false,
                undefined,
                ReduceMotion.Never
            )
        );
        return () => {
            cancelAnimation(clock);
            cancelAnimation(morph);
            cancelAnimation(rotation);
        };
    }, [animating, clock, pulling, morph, morphRotation, reduced, rotation, scale, shapeIndex, visible]);
    const pathProps = useAnimatedProps(() => ({
        d: pulling
            ? morphPath(determinateMorph, progressFraction(liveProgress.get()))
            : reduced
              ? morphPath(morphs[0], 0)
              : morphPath(morphs[shapeIndex.get()], progressFraction(morph.get())),
    }));
    // Reanimated processes `transform` as an RN style even on SVG animatedProps.
    // SVG's rotate(angle cx cy) syntax is invalid there; rotate the square viewport
    // around its native center instead, leaving path updates in SVG coordinates.
    const rotationStyle = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: `${reduced ? 0 : pulling ? -progressFraction(liveProgress.get()) * 180 : morph.get() * 90 + morphRotation.get() + rotation.get()}deg`,
            },
        ],
    }));
    if (!visible) return null;
    const actualSize = Number.isFinite(size) ? Math.max(24, Math.min(240, size)) : 48;
    return (
        <View
            accessible
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="progressbar"
            accessibilityState={{ busy: !pulling }}
            accessibilityValue={pulling ? { text: 'Desliza para actualizar' } : { text: 'En curso' }}
            style={[
                {
                    width: actualSize,
                    height: actualSize,
                    borderRadius: actualSize / 2,
                    backgroundColor: variant === 'contained' ? (containerColor ?? theme.colors.primaryContainer) : 'transparent',
                },
                style,
            ]}
            testID={testID}
            {...webAccessibility({
                role: 'progressbar',
                state: { busy: !pulling },
                value: pulling ? { text: 'Desliza para actualizar' } : { text: 'En curso' },
                hidden: undefined,
            })}
        >
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, rotationStyle]}>
                <Svg accessible={false} width="100%" height="100%" viewBox="0 0 48 48">
                    <AnimatedPath
                        animatedProps={pathProps}
                        fill={color ?? (variant === 'contained' ? theme.colors.onPrimaryContainer : theme.colors.primary)}
                    />
                </Svg>
            </Animated.View>
        </View>
    );
}
