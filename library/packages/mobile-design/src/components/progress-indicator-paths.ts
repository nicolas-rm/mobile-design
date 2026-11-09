/*
 * Motion specifications and wavy path construction adapted from AndroidX Material 3
 * ProgressIndicator.kt / WavyProgressIndicator.kt and Material Components Android
 * CircularDrawingDelegate.java (Copyright The Android Open Source Project).
 * Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0
 * Linear waves use AndroidX's quadratic curves; circular waves use Material Android's
 * tangent cubic curves, with the official 0.48 smoothing coefficient.
 * Sources (upstream revisions inspected 2026-10-25):
 * https://github.com/androidx/androidx/blob/080d2b3e5326ba80392d93442c4a51a02dc22650/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ProgressIndicator.kt
 * https://github.com/androidx/androidx/blob/af13b569f732160d3773e232795ae7c154e82238/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/WavyProgressIndicator.kt
 * https://github.com/androidx/androidx/blob/7ac433e44e797de53af85226797862687f37735f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/internal/LinearWavyProgressModifiers.kt
 * https://github.com/material-components/material-components-android/blob/2e97dd672eafe77c565895daa67d3580a9cf13aa/lib/java/com/google/android/material/progressindicator/CircularDrawingDelegate.java
 */
const TAU = Math.PI * 2;
export type ProgressSegment = { start: number; end: number };
type Point = { x: number; y: number };
type Cubic = [Point, Point, Point, Point];

export function clampProgress(value: number) {
    'worklet';
    return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}

/** Cubic-bezier timing evaluated by x, rather than treating time as its curve parameter. */
export function progressEasing(value: number, x1: number, y1: number, x2: number, y2: number) {
    'worklet';
    const x = clampProgress(value);
    if (x === 0 || x === 1) return x;
    let low = 0;
    let high = 1;
    for (let index = 0; index < 14; index++) {
        const t = (low + high) / 2;
        const inverse = 1 - t;
        const point = 3 * inverse * inverse * t * x1 + 3 * inverse * t * t * x2 + t * t * t;
        if (point < x) low = t;
        else high = t;
    }
    const t = (low + high) / 2;
    const inverse = 1 - t;
    return 3 * inverse * inverse * t * y1 + 3 * inverse * t * t * y2 + t * t * t;
}

/** Current M3 disjoint line timing: 1750 ms, two independently timed heads and tails. */
export function linearProgressSegments(phase: number, progress: number, indeterminate: boolean): ProgressSegment[] {
    'worklet';
    if (!indeterminate) return [{ start: 0, end: clampProgress(progress) }];
    const time = (((phase % 1) + 1) % 1) * 1750;
    const endpoint = (delay: number, duration: number) => {
        'worklet';
        return progressEasing((time - delay) / duration, 0.3, 0, 0.8, 0.15);
    };
    return [
        { start: endpoint(250, 1000), end: endpoint(0, 1000) },
        { start: endpoint(900, 850), end: endpoint(650, 850) },
    ];
}

/** Current M3 circular motion: 6000 ms; 1080° global + four 90° decelerated rotations. */
export function circularProgressSegment(phase: number, progress: number, indeterminate: boolean): ProgressSegment {
    'worklet';
    if (!indeterminate) return { start: 0, end: clampProgress(progress) };
    const fraction = ((phase % 1) + 1) % 1;
    const time = fraction * 6000;
    let degrees = fraction * 1080;
    for (let index = 0; index < 4; index++) {
        degrees += 90 * progressEasing((time - index * 1500) / 300, 0.05, 0.7, 0.1, 1);
    }
    const half = time < 3000 ? time / 3000 : (time - 3000) / 3000;
    const eased = progressEasing(half, 0.2, 0, 0, 1);
    const sweep = time < 3000 ? 0.1 + 0.77 * eased : 0.87 - 0.77 * eased;
    return { start: degrees / 360, end: degrees / 360 + sweep };
}

export function progressWaveAmplitude(progress: number, indeterminate: boolean) {
    'worklet';
    return indeterminate || (progress > 0.1 && progress < 0.95) ? 1 : 0;
}

function coordinate(value: number) {
    'worklet';
    return Math.round(value * 1000) / 1000;
}

/** Measure the gaps from the painted indicator ends, including their rounded caps. */
export function linearTrackSegments(segments: ProgressSegment[], width: number, thickness: number) {
    'worklet';
    if (width <= thickness) return [];
    const gap = (4 + thickness) / width;
    const cap = thickness / (2 * width);
    const center = (fraction: number) => Math.max(cap, Math.min(1 - cap, fraction));
    const result: ProgressSegment[] = [];
    let next = 0;
    const ordered = segments.filter((segment) => segment.end > segment.start).sort((a, b) => a.start - b.start);
    for (const segment of ordered) {
        const start = center(segment.start) - gap;
        if (start > next) result.push({ start: next, end: start });
        next = Math.max(next, Math.min(1, center(segment.end) + gap));
    }
    if (next < 1) result.push({ start: next, end: 1 });
    return result;
}

/** Exact quadratic half-waves, clipped analytically instead of a faceted sine polyline. */
export function linearProgressPath(
    start: number,
    end: number,
    width: number,
    height: number,
    thickness: number,
    amplitude = 0,
    phase = 0,
    wavelength = 40
) {
    'worklet';
    if (end <= start || width <= thickness) return '';
    const cap = thickness / 2;
    const first = Math.max(cap, Math.min(width - cap, start * width));
    const last = Math.max(cap, Math.min(width - cap, end * width));
    const middle = height / 2;
    if (last === first) {
        // A zero-length SVG line can disappear on native. Draw the cap as a dot.
        const dotEnd = first === cap ? first + 0.001 : first - 0.001;
        return `M ${coordinate(first)} ${middle} L ${coordinate(dotEnd)} ${middle}`;
    }
    if (amplitude <= 0) return `M ${coordinate(first)} ${middle} L ${coordinate(last)} ${middle}`;
    const half = Math.max(1, wavelength / 2);
    const shift = (((phase % 1) + 1) % 1) * wavelength;
    let current = first;
    let path = '';
    while (current < last + 0.00001) {
        const wave = Math.floor((current + shift + 0.0000001) / half);
        const origin = wave * half - shift;
        const finish = Math.min(last, origin + half);
        const t0 = (current - origin) / half;
        const t1 = (finish - origin) / half;
        const sign = wave % 2 === 0 ? 1 : -1;
        const y0 = middle + sign * 4 * amplitude * t0 * (1 - t0);
        const y1 = middle + sign * 4 * amplitude * t1 * (1 - t1);
        const controlY = y0 + (sign * 4 * amplitude * (1 - 2 * t0) * (t1 - t0)) / 2;
        if (path === '') path = `M ${coordinate(current)} ${coordinate(y0)}`;
        path += ` Q ${coordinate((current + finish) / 2)} ${coordinate(controlY)} ${coordinate(finish)} ${coordinate(y1)}`;
        if (finish >= last || finish <= current) break;
        current = finish;
    }
    return path;
}

function mix(a: Point, b: Point, amount: number): Point {
    'worklet';
    return { x: a.x + (b.x - a.x) * amount, y: a.y + (b.y - a.y) * amount };
}

function splitCubic(curve: Cubic, t: number): [Cubic, Cubic] {
    'worklet';
    const a = mix(curve[0], curve[1], t);
    const b = mix(curve[1], curve[2], t);
    const c = mix(curve[2], curve[3], t);
    const d = mix(a, b, t);
    const e = mix(b, c, t);
    const point = mix(d, e, t);
    return [
        [curve[0], a, d, point],
        [point, e, c, curve[3]],
    ];
}

/** Five-point Gaussian quadrature matches native PathMeasure without drawing sampled facets. */
function cubicLength(curve: Cubic, end: number) {
    'worklet';
    const nodes = [0, -0.5384693101, 0.5384693101, -0.9061798459, 0.9061798459];
    const weights = [0.5688888889, 0.4786286705, 0.4786286705, 0.2369268851, 0.2369268851];
    let length = 0;
    for (let index = 0; index < 5; index++) {
        const t = (end / 2) * (nodes[index] + 1);
        const inverse = 1 - t;
        const x =
            3 * inverse * inverse * (curve[1].x - curve[0].x) +
            6 * inverse * t * (curve[2].x - curve[1].x) +
            3 * t * t * (curve[3].x - curve[2].x);
        const y =
            3 * inverse * inverse * (curve[1].y - curve[0].y) +
            6 * inverse * t * (curve[2].y - curve[1].y) +
            3 * t * t * (curve[3].y - curve[2].y);
        length += weights[index] * Math.sqrt(x * x + y * y);
    }
    return (length * end) / 2;
}

function cubicFraction(curve: Cubic, fraction: number) {
    'worklet';
    if (fraction <= 0 || fraction >= 1) return clampProgress(fraction);
    const target = cubicLength(curve, 1) * fraction;
    let low = 0;
    let high = 1;
    for (let index = 0; index < 12; index++) {
        const t = (low + high) / 2;
        if (cubicLength(curve, t) < target) low = t;
        else high = t;
    }
    return (low + high) / 2;
}

/** Material Android's circular tangent cubic waves, measured and trimmed by path length. */
export function circularProgressPath(start: number, end: number, size: number, radius: number, amplitude = 0, phase = 0, wavelength = 15) {
    'worklet';
    const sweep = Math.min(1, end - start);
    if (sweep <= 0 || radius <= 0) return '';
    const center = size / 2;
    const angle = start * TAU - Math.PI / 2;
    const endAngle = angle + sweep * TAU;
    if (amplitude <= 0) {
        const firstX = coordinate(center + radius * Math.cos(angle));
        const firstY = coordinate(center + radius * Math.sin(angle));
        if (sweep >= 0.99999) {
            const oppositeX = coordinate(center - radius * Math.cos(angle));
            const oppositeY = coordinate(center - radius * Math.sin(angle));
            return `M ${firstX} ${firstY} A ${radius} ${radius} 0 1 1 ${oppositeX} ${oppositeY} A ${radius} ${radius} 0 1 1 ${firstX} ${firstY}`;
        }
        return `M ${firstX} ${firstY} A ${radius} ${radius} 0 ${sweep > 0.5 ? 1 : 0} 1 ${coordinate(center + radius * Math.cos(endAngle))} ${coordinate(center + radius * Math.sin(endAngle))}`;
    }
    const cycles = Math.max(3, Math.floor((TAU * radius) / Math.max(1, wavelength)));
    const halves = cycles * 2;
    const waveShift = (((phase % 1) + 1) % 1) / cycles;
    const rotation = -Math.PI / 2 - waveShift * TAU;
    const first = (start + waveShift) * halves;
    const last = first + sweep * halves;
    const handle = ((TAU * radius) / cycles / 2) * 0.48;
    const anchor = (index: number): Point => {
        'worklet';
        const theta = (index / halves) * TAU + rotation;
        const r = index % 2 === 0 ? radius : Math.max(0, radius - amplitude * 2);
        return { x: center + r * Math.cos(theta), y: center + r * Math.sin(theta) };
    };
    let path = '';
    for (let index = Math.floor(first); index < Math.ceil(last); index++) {
        const p0 = anchor(index);
        const p3 = anchor(index + 1);
        const theta0 = (index / halves) * TAU + rotation;
        const theta1 = ((index + 1) / halves) * TAU + rotation;
        let curve: Cubic = [
            p0,
            { x: p0.x - Math.sin(theta0) * handle, y: p0.y + Math.cos(theta0) * handle },
            { x: p3.x + Math.sin(theta1) * handle, y: p3.y - Math.cos(theta1) * handle },
            p3,
        ];
        const t0 = cubicFraction(curve, Math.max(0, first - index));
        const t1 = cubicFraction(curve, Math.min(1, last - index));
        if (t1 < 1) curve = splitCubic(curve, t1)[0];
        if (t0 > 0 && t1 > 0) curve = splitCubic(curve, t0 / t1)[1];
        if (path === '') path = `M ${coordinate(curve[0].x)} ${coordinate(curve[0].y)}`;
        path += ` C ${coordinate(curve[1].x)} ${coordinate(curve[1].y)} ${coordinate(curve[2].x)} ${coordinate(curve[2].y)} ${coordinate(curve[3].x)} ${coordinate(curve[3].y)}`;
    }
    return path;
}
