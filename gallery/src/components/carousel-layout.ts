/*
 * Arrangement fitting and keyline shifting adapted from Material Components for Android:
 * Arrangement, CarouselStrategyHelper, KeylineState and KeylineStateList.
 * Copyright 2022–2023 The Android Open Source Project, Apache License 2.0.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 * Source revision: 66b0eeb53afeb6025ffbbd37734b08e5bce197ed (2026-10-16).
 * https://github.com/material-components/material-components-android/tree/66b0eeb53afeb6025ffbbd37734b08e5bce197ed/lib/java/com/google/android/material/carousel
 * https://www.apache.org/licenses/LICENSE-2.0
 */

export type CarouselVariant = 'multi-browse' | 'hero' | 'center-aligned-hero' | 'uncontained' | 'uncontained-multi-aspect' | 'full-screen';
export type CarouselKeyline = { loc: number; offset: number; size: number };
export type CarouselKeylineState = { keylines: CarouselKeyline[]; firstFocal: number; lastFocal: number };
export type CarouselLayout = {
    gap: number;
    itemCount: number;
    /** The unmasked image width, rather than the width of its smallest clip. */
    itemWidth: number;
    itemWidths: number[];
    itemOrigins: number[];
    offsets: number[];
    maxOffset: number;
    step: number;
    uniform: boolean;
    variant: CarouselVariant;
    width: number;
    defaultState: CarouselKeylineState;
    startStates: CarouselKeylineState[];
    endStates: CarouselKeylineState[];
    startShift: number;
    endShift: number;
    startPadding: number;
};
type Arrangement = {
    small: number;
    medium: number;
    large: number;
    smallCount: number;
    mediumCount: number;
    largeCount: number;
    cost: number;
};

function clamp(value: number, min: number, max: number) {
    'worklet';
    return Math.max(min, Math.min(max, value));
}
function mix(from: number, to: number, progress: number) {
    'worklet';
    return from + (to - from) * progress;
}

/** Material's least-cost arrangement: first flex small items, then medium ±10%, then large. */
function fitArrangement(
    space: number,
    targetLarge: number,
    gap: number,
    smallCount: number,
    mediumCount: number,
    largeCount: number,
    priority: number
): Arrangement {
    const smallMin = 40 + gap;
    const smallMax = 56 + gap;
    let small = clamp((targetLarge - gap) / 3 + gap, smallMin, smallMax);
    let medium = (targetLarge + small) / 2;
    const delta = space - (targetLarge * largeCount + medium * mediumCount + small * smallCount);
    if (smallCount > 0) small += clamp(delta / smallCount, smallMin - small, smallMax - small);
    else small = 0;
    let large = (space - (smallCount + mediumCount / 2) * small) / (largeCount + mediumCount / 2);
    medium = (large + small) / 2;
    if (mediumCount > 0) {
        const adjustment = (targetLarge - large) * largeCount;
        const flex = Math.min(Math.abs(adjustment), medium * 0.1 * mediumCount);
        const direction = Math.sign(adjustment);
        medium -= (direction * flex) / mediumCount;
        large += (direction * flex) / largeCount;
    }
    const valid = large > gap && (!smallCount || large > small) && (!mediumCount || (large > medium && (!smallCount || medium > small)));
    return {
        small: Math.max(0, small - gap),
        medium: Math.max(0, medium - gap),
        large: Math.max(1, large - gap),
        smallCount,
        mediumCount,
        largeCount,
        cost: valid ? Math.abs(targetLarge - large) * priority : Infinity,
    };
}

function chooseArrangement(
    width: number,
    count: number,
    variant: CarouselVariant,
    height: number,
    preferredWidth: number,
    gap: number,
    alignment: 'start' | 'center'
): { arrangement: Arrangement; centered: boolean } {
    // A collection with one item has no preview item to reserve space for.
    if (count <= 1)
        return {
            arrangement: { large: width, medium: 0, small: 0, largeCount: 1, mediumCount: 0, smallCount: 0, cost: 0 },
            centered: false,
        };
    const hero = variant === 'hero' || variant === 'center-aligned-hero';
    let centered = variant === 'center-aligned-hero' || alignment === 'center';
    const target = Math.min(width, hero ? height * 2 : preferredWidth) + gap;
    const space = width + gap;
    const find = (center: boolean) => {
        const smallCounts = width < 80 + gap ? [0] : [center ? 2 : 1];
        const mediumCounts = hero ? (center ? [0, 2] : [0, 1]) : [center ? 2 : 1, 0];
        const minLarge = Math.max(
            1,
            Math.floor((space - (56 + gap) * Math.max(...smallCounts) - ((target + 56 + gap) / 2) * Math.max(...mediumCounts)) / target)
        );
        const maxLarge = Math.max(minLarge, Math.ceil(space / target));
        const largeCounts = Array.from({ length: maxLarge - minLarge + 1 }, (_, i) => (hero ? minLarge + i : maxLarge - i));
        let best: Arrangement | undefined;
        let priority = 1;
        for (const largeCount of largeCounts)
            for (const mediumCount of mediumCounts)
                for (const smallCount of smallCounts) {
                    const arrangement = fitArrangement(space, target, gap, smallCount, mediumCount, largeCount, priority++);
                    if (!best || arrangement.cost < best.cost) best = arrangement;
                }
        return best!;
    };
    let arrangement = find(centered);
    if (
        centered &&
        (!Number.isFinite(arrangement.cost) || arrangement.largeCount + arrangement.mediumCount + arrangement.smallCount > count)
    ) {
        centered = false;
        arrangement = find(false);
    }
    if (!hero) {
        let { smallCount, mediumCount } = arrangement;
        let surplus = arrangement.largeCount + mediumCount + smallCount - count;
        while (surplus-- > 0) {
            if (smallCount > 0) smallCount--;
            else if (mediumCount > 1) mediumCount--;
        }
        if (!smallCount && !mediumCount && width > 80 + gap) smallCount = 1;
        if (smallCount !== arrangement.smallCount || mediumCount !== arrangement.mediumCount) {
            arrangement = fitArrangement(space, target, gap, smallCount, mediumCount, arrangement.largeCount, 1);
        }
    }
    // If a short collection cannot populate the selected preview arrangement, fit its actual
    // items as large keylines. Reserving a nonexistent preview would reverse motion at the start.
    if (
        arrangement.largeCount + arrangement.mediumCount + arrangement.smallCount > count &&
        count * arrangement.large + (count - 1) * gap > width
    ) {
        arrangement = fitArrangement(space, target, gap, 0, 0, count, 1);
        centered = false;
    }
    return { arrangement, centered };
}

function stateFromSizes(sizes: number[], firstFocal: number, lastFocal: number, step: number, gap: number): CarouselKeylineState {
    // The 1dp anchor keylines remain outside the viewport and hide off-screen items.
    let edge = -1 - gap;
    const offsets = sizes.map((size) => {
        const center = edge + size / 2;
        edge += size + gap;
        return center;
    });
    const pivot = offsets[firstFocal];
    return {
        firstFocal,
        lastFocal,
        keylines: sizes.map((size, index) => ({ size, offset: offsets[index], loc: pivot + (index - firstFocal) * step })),
    };
}
function moveKeyline(
    state: CarouselKeylineState,
    from: number,
    to: number,
    firstFocal: number,
    lastFocal: number,
    step: number,
    gap: number
) {
    const sizes = state.keylines.map((keyline) => keyline.size);
    sizes.splice(to, 0, sizes.splice(from, 1)[0]);
    return stateFromSizes(sizes, firstFocal, lastFocal, step, gap);
}

/** Move one non-focal keyline at a time across the focal range, preserving its neighbours' sizes. */
function shiftedStates(defaultState: CarouselKeylineState, step: number, gap: number, start: boolean) {
    const states = [defaultState];
    const { firstFocal, lastFocal, keylines } = defaultState;
    const steps = start ? firstFocal - 1 : keylines.length - 2 - lastFocal;
    for (let i = 0; i < steps; i++) {
        const previous = states[states.length - 1];
        if (start) {
            const neighbourSize = keylines[i].size;
            let destination = previous.keylines.length - 2;
            for (let j = previous.lastFocal; j < previous.keylines.length; j++)
                if (previous.keylines[j].size === neighbourSize) {
                    destination = j - 1;
                    break;
                }
            states.push(moveKeyline(previous, 1, destination, firstFocal - i - 1, lastFocal - i - 1, step, gap));
        } else {
            const neighbourSize = keylines[keylines.length - 1 - i].size;
            let destination = 1;
            for (let j = previous.firstFocal - 1; j >= 0; j--)
                if (previous.keylines[j].size === neighbourSize) {
                    destination = j + 1;
                    break;
                }
            states.push(moveKeyline(previous, keylines.length - 2, destination, firstFocal + i + 1, lastFocal + i + 1, step, gap));
        }
    }
    return states;
}

export function createCarouselLayout(
    width: number,
    itemCount: number,
    variant: CarouselVariant,
    height = 240,
    aspectRatios: readonly number[] = [],
    reduceMotion = false,
    preferredItemWidth = height,
    contentPadding = 0,
    itemSpacing = 8,
    alignment: 'start' | 'center' = 'start'
): CarouselLayout {
    width = Math.max(1, Number.isFinite(width) ? width : 1);
    itemCount = Math.max(0, itemCount);
    const gap = Math.max(0, Math.min(itemSpacing, width / 10));
    const uniform = reduceMotion || variant.startsWith('uncontained');
    const { arrangement, centered } = chooseArrangement(
        width,
        itemCount,
        variant,
        Math.max(1, height),
        Math.max(1, preferredItemWidth),
        gap,
        alignment
    );
    const itemWidth = variant.startsWith('uncontained') ? Math.max(1, preferredItemWidth) : arrangement.large;
    const step = itemWidth + gap;
    const sizes = [1];
    if (centered) {
        for (let i = 0; i < arrangement.smallCount / 2; i++) sizes.push(arrangement.small);
        for (let i = 0; i < arrangement.mediumCount / 2; i++) sizes.push(arrangement.medium);
    }
    const firstFocal = sizes.length;
    for (let i = 0; i < arrangement.largeCount; i++) sizes.push(itemWidth);
    const lastFocal = sizes.length - 1;
    for (let i = 0; i < arrangement.mediumCount / (centered ? 2 : 1); i++) sizes.push(arrangement.medium);
    for (let i = 0; i < arrangement.smallCount / (centered ? 2 : 1); i++) sizes.push(arrangement.small);
    sizes.push(1);
    const defaultState = stateFromSizes(sizes, firstFocal, lastFocal, step, gap);
    const startStates = shiftedStates(defaultState, step, gap, true);
    const endStates = shiftedStates(defaultState, step, gap, false);
    const startState = startStates[startStates.length - 1];
    const endState = endStates[endStates.length - 1];
    const startShift = startState.keylines[0].loc - defaultState.keylines[0].loc;
    const endShift = defaultState.keylines[defaultState.keylines.length - 1].loc - endState.keylines[endState.keylines.length - 1].loc;
    const itemWidths = Array.from({ length: itemCount }, (_, index) =>
        variant === 'uncontained-multi-aspect'
            ? Math.max(1, height) *
              clamp(Number.isFinite(aspectRatios[index]) && aspectRatios[index] > 0 ? aspectRatios[index] : 1, 9 / 16, 16 / 9)
            : itemWidth
    );
    const startPadding = variant.startsWith('uncontained') ? Math.max(0, contentPadding) : 0;
    let distance = startPadding;
    const itemOrigins = itemWidths.map((size) => {
        const position = distance;
        distance += size + gap;
        return position;
    });
    const uncontainedOffsets = itemOrigins.map((origin) => origin - startPadding);
    const maxOffset = uniform
        ? Math.max(0, distance - gap - width)
        : Math.max(0, (itemCount - 1) * step + itemWidth / 2 - endState.keylines[endState.lastFocal].loc);
    // The native snap helper associates each edge item with its discrete shifted state.
    const endIndices = Array.from({ length: itemCount }, (_, i) => i).filter(
        (i) => i * step > maxOffset - endShift || i >= itemCount - endStates.length
    );
    const startIndices = Array.from({ length: itemCount }, (_, i) => itemCount - i - 1).filter(
        (i) => i * step < startShift || i < startStates.length
    );
    const offsets = uniform
        ? uncontainedOffsets.map((offset) => Math.min(offset, maxOffset))
        : Array.from({ length: itemCount }, (_, index) => {
              let state = defaultState;
              const endIndex = endIndices.indexOf(index);
              if (endIndex >= 0) state = endStates[Math.min(endIndex, endStates.length - 1)];
              const startIndex = startIndices.indexOf(index);
              if (startIndex >= 0) state = startStates[Math.min(startIndex, startStates.length - 1)];
              return clamp(index * step + itemWidth / 2 - state.keylines[state.firstFocal].loc, 0, maxOffset);
          });
    return {
        gap,
        itemCount,
        itemWidth,
        itemWidths,
        itemOrigins,
        offsets,
        maxOffset,
        step,
        uniform,
        variant,
        width,
        defaultState,
        startStates,
        endStates,
        startShift,
        endShift,
        startPadding,
    };
}

function interpolateState(states: CarouselKeylineState[], amount: number, shift: number, start: boolean): CarouselKeylineState {
    'worklet';
    if (states.length === 1 || shift <= 0) return states[0];
    const first = states[0].keylines;
    let lower = 0;
    for (let index = 1; index < states.length; index++) {
        const keylines = states[index].keylines;
        const distance = start ? keylines[0].loc - first[0].loc : first[first.length - 1].loc - keylines[keylines.length - 1].loc;
        const upper = distance / shift;
        if (amount <= upper || index === states.length - 1) {
            const progress = clamp((amount - lower) / Math.max(Number.EPSILON, upper - lower), 0, 1);
            const from = states[index - 1];
            const to = states[index];
            return {
                firstFocal: Math.round(mix(from.firstFocal, to.firstFocal, progress)),
                lastFocal: Math.round(mix(from.lastFocal, to.lastFocal, progress)),
                keylines: from.keylines.map((keyline, i) => ({
                    loc: mix(keyline.loc, to.keylines[i].loc, progress),
                    offset: mix(keyline.offset, to.keylines[i].offset, progress),
                    size: mix(keyline.size, to.keylines[i].size, progress),
                })),
            };
        }
        lower = upper;
    }
    return states[0];
}

/** Keylines stay fixed while the image travels between them; only edge states shift. */
export function getCarouselKeylineState(offset: number, layout: CarouselLayout) {
    'worklet';
    if (layout.maxOffset === 0) return layout.startStates[layout.startStates.length - 1];
    const position = clamp(offset, 0, layout.maxOffset);
    if (position < layout.startShift)
        return interpolateState(layout.startStates, 1 - position / layout.startShift, layout.startShift, true);
    if (position > layout.maxOffset - layout.endShift)
        return interpolateState(
            layout.endStates,
            (position - layout.maxOffset + layout.endShift) / layout.endShift,
            layout.endShift,
            false
        );
    return layout.defaultState;
}

/** Crop an unscaled image using the same location-to-offset mapping as Material's layout manager. */
export function getCarouselItemFrame(index: number, offset: number, layout: CarouselLayout, state?: CarouselKeylineState) {
    'worklet';
    const clamped = clamp(offset, 0, layout.maxOffset);
    if (layout.uniform) {
        // `offsets` contains snap positions; actual item origins must remain un-clamped.
        return { width: layout.itemWidths[index], x: layout.itemOrigins[index] - clamped };
    }
    const keylines = (state ?? getCarouselKeylineState(clamped, layout)).keylines;
    const center = layout.itemWidth / 2 + index * layout.step - clamped;
    let before = keylines[0];
    let after = keylines[keylines.length - 1];
    for (let i = 0; i < keylines.length; i++) {
        if (keylines[i].loc <= center) before = keylines[i];
        if (keylines[i].loc >= center) {
            after = keylines[i];
            break;
        }
    }
    const progress = before === after ? 0 : clamp((center - before.loc) / (after.loc - before.loc), 0, 1);
    const size = mix(before.size, after.size, progress);
    let visualCenter = mix(before.offset, after.offset, progress);
    if (center < keylines[0].loc)
        visualCenter = keylines[0].offset + (center - keylines[0].loc) * ((keylines[0].size + layout.gap) / layout.step);
    if (center > keylines[keylines.length - 1].loc)
        visualCenter =
            keylines[keylines.length - 1].offset +
            (center - keylines[keylines.length - 1].loc) * ((keylines[keylines.length - 1].size + layout.gap) / layout.step);
    return { width: size, x: visualCenter - size / 2 };
}

export function getCarouselIndex(offset: number, layout: CarouselLayout) {
    'worklet';
    if (layout.itemCount < 2 || layout.maxOffset === 0) return 0;
    let closest = 0;
    for (let index = 1; index < layout.itemCount; index++) {
        if (Math.abs(layout.offsets[index] - offset) < Math.abs(layout.offsets[closest] - offset)) closest = index;
    }
    return closest;
}
