/** Geometry for Mobile Design's vertical gallery extension, independent of rendering. */
export type VerticalCarouselLayout = {
    width: number;
    viewportHeight: number;
    mediaWidth: number;
    mediaHeights: number[];
    itemHeights: number[];
    itemOrigins: number[];
    /** Reachable navigation anchors, compressed only when the final item cannot align at the top. */
    offsets: number[];
    contentHeight: number;
    maxOffset: number;
    padding: number;
    gap: number;
};

/**
 * Preserve each image's width/height ratio; unlike the horizontal multi-aspect
 * strategy, a vertical gallery does not impose landscape/portrait ratio limits.
 * Navigation anchors span the available scroll range without adding blank tail
 * space or giving the final several items an identical clamped destination.
 */
export function createVerticalCarouselLayout(
    width: number,
    height: number,
    ratios: readonly number[],
    padding = 16,
    gap = 8,
    extraHeights: readonly number[] = []
): VerticalCarouselLayout {
    const availableWidth = Math.max(1, Number.isFinite(width) ? width : 1);
    const viewportHeight = Math.max(1, Number.isFinite(height) ? height : 1);
    const edgePadding = Math.min(Math.max(0, Number.isFinite(padding) ? padding : 16), (availableWidth - 1) / 2);
    const itemGap = Math.max(0, Number.isFinite(gap) ? gap : 8);
    const mediaWidth = availableWidth - edgePadding * 2;
    const mediaHeights = ratios.map((value) => {
        const ratio = Number.isFinite(value) && value > 0 ? value : 1;
        const naturalHeight = mediaWidth / ratio;
        // Ratios that overflow/underflow the numeric geometry cannot be rendered.
        return Number.isFinite(naturalHeight) && naturalHeight > 0 ? naturalHeight : mediaWidth;
    });
    const itemHeights = mediaHeights.map((mediaHeight, index) => {
        const extra = extraHeights[index] ?? 0;
        return mediaHeight + (Number.isFinite(extra) && extra > 0 ? extra : 0);
    });
    let cursor = edgePadding;
    const itemOrigins = itemHeights.map((itemHeight) => {
        const origin = cursor;
        cursor += itemHeight + itemGap;
        return origin;
    });
    const contentHeight = itemHeights.length ? cursor - itemGap + edgePadding : 0;
    const maxOffset = Math.max(0, contentHeight - viewportHeight);
    const finalNaturalOffset = itemOrigins.length ? itemOrigins[itemOrigins.length - 1] - edgePadding : 0;
    const navigationScale = finalNaturalOffset > 0 ? Math.min(1, maxOffset / finalNaturalOffset) : 0;
    const offsets = itemOrigins.map((origin, index) => {
        const normalized = (origin - edgePadding) * navigationScale;
        // A short row reached by keyboard or an accessibility action should be
        // wholly visible, even when proportional tail compression moved its anchor.
        const revealBottom =
            itemHeights[index] <= viewportHeight - edgePadding * 2
                ? origin + itemHeights[index] + edgePadding - viewportHeight
                : 0;
        return Math.max(0, Math.min(maxOffset, Math.max(normalized, revealBottom)));
    });

    return {
        width: availableWidth,
        viewportHeight,
        mediaWidth,
        mediaHeights,
        itemHeights,
        itemOrigins,
        offsets,
        contentHeight,
        maxOffset,
        padding: edgePadding,
        gap: itemGap,
    };
}

/** Resolve the nearest reachable item anchor. Equal distances prefer the earlier item. */
export function getVerticalCarouselIndex(offset: number, layout: VerticalCarouselLayout): number {
    'worklet';
    if (layout.offsets.length < 2 || layout.maxOffset <= 0) return 0;
    const position = Math.max(0, Math.min(layout.maxOffset, Number.isNaN(offset) ? 0 : offset));
    let closest = 0;
    for (let index = 1; index < layout.offsets.length; index++) {
        if (Math.abs(layout.offsets[index] - position) < Math.abs(layout.offsets[closest] - position)) closest = index;
    }
    return closest;
}
