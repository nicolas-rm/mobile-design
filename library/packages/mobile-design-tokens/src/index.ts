export type LanguageHeight = 'small' | 'medium' | 'large' | 'extraLarge';

/** MD3 language-height tokens, July 2026. Small is the original Latin scale.
 * Configure the profile for the content language; this is independent of font scaling.
 * https://m3.material.io/styles/typography/type-scale-tokens
 */
export const languageLineHeights = {
    displayLarge: [64, 73, 89, 120],
    displayMedium: [52, 56, 71, 99],
    displaySmall: [44, 47, 57, 80],
    headlineLarge: [40, 42, 50, 75],
    headlineMedium: [36, 38, 45, 66],
    headlineSmall: [32, 35, 41, 59],
    titleLarge: [28, 31, 36, 53],
    titleMedium: [24, 27, 31, 42],
    titleSmall: [20, 23, 26, 36],
    bodyLarge: [24, 27, 31, 41],
    bodyMedium: [20, 23, 26, 35],
    bodySmall: [16, 18, 21, 30],
    labelLarge: [20, 23, 26, 36],
    labelMedium: [16, 18, 21, 30],
    labelSmall: [16, 18, 21, 29],
} as const;

export type ButtonSize = 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
export type ButtonVariant = 'filled' | 'tonal' | 'elevated' | 'outlined' | 'text';

// Current M3 button tokens and ButtonDefaults' vertical content padding.
// https://m3.material.io/components/buttons/specs
export const buttonSizeTokens = {
    // ButtonDefaults corrects the generated XS padding/spacing tokens to12/4.
    'extra-small': {
        height: 32,
        padding: 12,
        verticalPadding: 6,
        icon: 20,
        gap: 4,
        square: 12,
        pressed: 8,
        outline: 1,
        text: 'labelLarge',
    },
    small: { height: 40, padding: 16, verticalPadding: 10, icon: 20, gap: 8, square: 12, pressed: 8, outline: 1, text: 'labelLarge' },
    medium: { height: 56, padding: 24, verticalPadding: 16, icon: 24, gap: 8, square: 16, pressed: 12, outline: 1, text: 'titleMedium' },
    large: { height: 96, padding: 48, verticalPadding: 32, icon: 32, gap: 12, square: 28, pressed: 16, outline: 2, text: 'headlineSmall' },
    'extra-large': {
        height: 136,
        padding: 64,
        verticalPadding: 48,
        icon: 40,
        gap: 16,
        square: 28,
        pressed: 16,
        outline: 3,
        text: 'headlineLarge',
    },
} as const;

// Sizes/padding/inner corners are explicit in the current M3 button-group Specs.
export const buttonGroupSizeTokens = {
    'extra-small': {
        height: 32,
        padding: 12,
        icon: 20,
        iconOnly: 20,
        iconNarrow: 4,
        iconPadding: 6,
        iconWide: 10,
        gap: 4,
        between: 18,
        inner: 8,
        pressedInner: 4,
        outerSquare: 4,
        square: 12,
        pressed: 8,
        outline: 1,
        text: 'labelLarge',
    },
    small: {
        height: 40,
        padding: 16,
        icon: 20,
        iconOnly: 24,
        iconNarrow: 4,
        iconPadding: 8,
        iconWide: 14,
        gap: 8,
        between: 12,
        inner: 8,
        pressedInner: 4,
        outerSquare: 8,
        square: 12,
        pressed: 8,
        outline: 1,
        text: 'labelLarge',
    },
    medium: {
        height: 56,
        padding: 24,
        icon: 24,
        iconOnly: 24,
        iconNarrow: 12,
        iconPadding: 16,
        iconWide: 24,
        gap: 8,
        between: 8,
        inner: 8,
        pressedInner: 4,
        outerSquare: 8,
        square: 16,
        pressed: 12,
        outline: 1,
        text: 'titleMedium',
    },
    large: {
        height: 96,
        padding: 48,
        icon: 32,
        iconOnly: 32,
        iconNarrow: 16,
        iconPadding: 32,
        iconWide: 48,
        gap: 12,
        between: 8,
        inner: 16,
        pressedInner: 12,
        outerSquare: 16,
        square: 28,
        pressed: 16,
        outline: 2,
        text: 'headlineSmall',
    },
    'extra-large': {
        height: 136,
        padding: 64,
        icon: 40,
        iconOnly: 40,
        iconNarrow: 32,
        iconPadding: 48,
        iconWide: 72,
        gap: 16,
        between: 8,
        inner: 20,
        pressedInner: 16,
        outerSquare: 20,
        square: 28,
        pressed: 16,
        outline: 3,
        text: 'headlineLarge',
    },
} as const;

export const topAppBarTokens = {
    small: { height: 64, title: 'titleLarge', subtitle: 'labelMedium' },
    'medium-flexible': { height: 112, subtitleHeight: 136, title: 'headlineMedium', subtitle: 'labelLarge' },
    'large-flexible': { height: 120, subtitleHeight: 152, title: 'displaySmall', subtitle: 'titleMedium' },
} as const;

export const badgeTokens = {
    smallSize: 6,
    largeMinSize: 16,
    largePadding: 4,
    maximumCharacters: 4,
    maximumCount: 999,
    smallAnchorStartOffset: 6,
    smallAnchorBottom: 6,
    largeAnchorStartOffset: 12,
    largeAnchorBottom: 14,
} as const;

export const fabSizeTokens = {
    default: { height: 56, icon: 24, radius: 'large', leading: 16, trailing: 16, gap: 8, text: 'titleMedium' },
    medium: { height: 80, icon: 28, radius: 'largeIncreased', leading: 26, trailing: 26, gap: 12, text: 'titleLarge' },
    // Compose explicitly corrects the generated large-icon token to36dp.
    large: { height: 96, icon: 36, radius: 'extraLarge', leading: 28, trailing: 28, gap: 16, text: 'headlineSmall' },
} as const;

/** Material Android slider token set34.0.0: thickness, handle cross-axis span and outer corner. */
export const sliderSizeTokens = {
    xs: { track: 16, handle: 44, corner: 8, icon: 0 },
    sm: { track: 24, handle: 44, corner: 8, icon: 0 },
    md: { track: 40, handle: 52, corner: 12, icon: 24 },
    lg: { track: 56, handle: 68, corner: 16, icon: 24 },
    xl: { track: 96, handle: 108, corner: 28, icon: 32 },
} as const;

/** Current MD3 Tabs specs; scrollable sizing and motion follow AndroidX TabRow. */
export const tabsTokens = {
    containerHeight: 48,
    stackedContainerHeight: 64,
    iconSize: 24,
    inlineIconGap: 8,
    stackedIconGap: 4,
    badgeGap: 4,
    iconBadgeOverlap: 6,
    horizontalPadding: 16,
    scrollableMinimumTabWidth: 90,
    scrollableEdgePadding: 52,
    dividerHeight: 1,
    primaryIndicatorHeight: 3,
    primaryIndicatorMinimumWidth: 24,
    primaryIndicatorInset: 2,
    secondaryIndicatorHeight: 2,
} as const;

export const mobileDesignTokens = {
    minimumTouchTarget: 48,
    spacing: { none: 0, extraSmall: 4, small: 8, medium: 16, large: 24, extraLarge: 32 },
    breakpoints: { medium: 600, expanded: 840, large: 1200, extraLarge: 1600 },
    state: { hovered: 0.08, focused: 0.1, pressed: 0.1, dragged: 0.16, disabledContent: 0.38, disabledContainer: 0.12 },
} as const;

export const spatialMotionTokens = {
    expressive: {
        fast: { stiffness: 800, damping: 0.6 },
        default: { stiffness: 380, damping: 0.8 },
        slow: { stiffness: 200, damping: 0.8 },
    },
    standard: {
        fast: { stiffness: 1400, damping: 0.9 },
        default: { stiffness: 700, damping: 0.9 },
        slow: { stiffness: 300, damping: 0.9 },
    },
} as const;
