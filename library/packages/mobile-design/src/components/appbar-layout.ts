// SPDX-License-Identifier: Apache-2.0
// Adapted from AndroidX AppBar.kt, Copyright 2021 The Android Open Source Project.
// https://github.com/androidx/androidx/blob/d153d87ed76372ece0c99dac837ff07ab845d495/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/AppBar.kt
// See ../../LICENSE-Apache-2.0.txt and ../../NOTICE.
export function appBarFinite(value: number, fallback = 0) {
    'worklet';
    return Number.isFinite(value) ? value : fallback;
}
export function appBarFraction(value: number) {
    'worklet';
    return Math.max(0, Math.min(1, appBarFinite(value)));
}
/** Solve the x coordinate before evaluating y; an easing is not a polynomial in x. */
function bezierAt(x: number, x1: number, y1: number, x2: number, y2: number) {
    'worklet';
    const fraction = appBarFraction(x);
    if (fraction === 0 || fraction === 1) return fraction;
    let low = 0,
        high = 1,
        t = fraction;
    for (let index = 0; index < 18; index++) {
        const inverse = 1 - t;
        const at = 3 * inverse * inverse * t * x1 + 3 * inverse * t * t * x2 + t * t * t;
        if (Math.abs(at - fraction) < 0.000001) break;
        if (at < fraction) low = t;
        else high = t;
        t = (low + high) / 2;
    }
    const inverse = 1 - t;
    return 3 * inverse * inverse * t * y1 + 3 * inverse * t * t * y2 + t * t * t;
}
/** TopTitleAlphaEasing from AndroidX; the expanded title keeps alpha1−fraction. */
export function appBarCompactTitleAlpha(fraction: number) {
    'worklet';
    return bezierAt(fraction, 0.8, 0, 0.8, 0.15);
}
/** FastOutLinearInEasing used by TopAppBarColors.containerColor. */
export function appBarContainerFraction(fraction: number) {
    'worklet';
    return bezierAt(fraction, 0.4, 0, 1, 1);
}
/** At312dp stop filling the entire interval; beyond624dp use half the interval. */
export function appBarSearchWidth(available: number) {
    return Math.min(Math.max(0, appBarFinite(available)), Math.max(312, appBarFinite(available) * 0.5));
}
/** Center in the whole safe width, then move only as far as real actions require. */
export function appBarTitleFrame(
    width: number,
    leftInset: number,
    rightInset: number,
    leading: number,
    trailing: number,
    hasLeading: boolean,
    rtl: boolean,
    centered: boolean,
    measuredWidth: number
) {
    const start = hasLeading ? 8 + leading : 16;
    const end = 8 + trailing;
    const left = leftInset + (rtl ? end : start);
    const right = Math.max(left, width - rightInset - (rtl ? start : end));
    const available = Math.max(0, right - left);
    if (!centered || measuredWidth <= 0)
        return {
            left,
            width: available,
            translateX: 0,
        };
    const textWidth = Math.min(available, measuredWidth);
    const center = (leftInset + width - rightInset) / 2;
    const movement = Math.max(0, (available - textWidth) / 2);
    // Keep the measure constraint at the entire available width. A previously
    // truncated measurement must not cap intrinsic text when the window grows.
    return {
        left,
        width: available,
        translateX: Math.max(-movement, Math.min(movement, center - (left + right) / 2)),
    };
}
/** Bottom24/28 is baseline padding, reduced when the measured row has no room. */
export function appBarExpandedRow(minHeight: number, contentHeight: number, lastBaseline: number, baselinePadding: number) {
    const height = Math.max(0, minHeight, appBarFinite(contentHeight));
    const belowBaseline = Math.max(0, contentHeight - appBarFinite(lastBaseline, contentHeight));
    return { height, bottomPadding: Math.max(0, Math.min(height - contentHeight, baselinePadding - belowBaseline)) };
}
