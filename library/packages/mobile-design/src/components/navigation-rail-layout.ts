type DestinationLayoutInput = {
    railWidth: number;
    expansion: number;
    collapsedHeight: number;
    expandedHeight?: number;
    labelWidth: number;
    badgeWidth: number;
    labelVisible?: boolean;
    fullWidth: boolean;
    rtl: boolean;
};

/** The visible pill and its full-row hit region share one animated geometry. */
export function navigationRailDestinationLayout({
    railWidth,
    expansion,
    collapsedHeight,
    expandedHeight = 56,
    labelWidth,
    badgeWidth,
    labelVisible = true,
    fullWidth,
    rtl,
}: DestinationLayoutInput) {
    'worklet';
    const amount = Number.isFinite(expansion) ? Math.max(0, Math.min(1, expansion)) : 0;
    const width = Number.isFinite(railWidth) ? Math.max(80, railWidth) : 96;
    const compactHeight = labelVisible ? (Number.isFinite(collapsedHeight) ? Math.max(64, collapsedHeight) : 64) : 56;
    const label = Number.isFinite(labelWidth) ? Math.max(0, labelWidth) : 0;
    const badge = Number.isFinite(badgeWidth) ? Math.max(0, badgeWidth) : 0;
    const tallHeight = Number.isFinite(expandedHeight) ? Math.max(56, expandedHeight) : 56;
    const available = width - 40;
    const expandedWidth = fullWidth ? available : Math.min(available, labelVisible ? 64 + label + badge : 56);
    const logicalX = 20 + ((available - 56) / 2) * (1 - amount);
    const pillWidth = 56 + (expandedWidth - 56) * amount;
    // Baseline NavigationRailItem without a label uses a56dp round indicator,
    // centered in a56dp item, rather than reserving the label's lower space.
    const pillHeight = labelVisible ? 32 + (tallHeight - 32) * amount : 56;
    const top = labelVisible ? 6 * (1 - amount) : 0;
    const left = rtl ? width - logicalX - pillWidth : logicalX;
    const rowHeight = compactHeight + ((labelVisible ? tallHeight : 56) - compactHeight) * amount;

    return {
        rowHeight,
        frame: { left, top, width: pillWidth, height: pillHeight },
        hitSlop: {
            top,
            right: Math.max(0, width - left - pillWidth),
            bottom: Math.max(0, rowHeight - top - pillHeight),
            left: Math.max(0, left),
        },
    };
}
