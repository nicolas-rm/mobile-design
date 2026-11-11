import { LightTheme, type Theme } from 'react-native-paper';
import { fonts } from '@/theme/fonts';
import { appColorTokens, createPaperColors } from '@/theme/tokens';

export const lightTheme = {
    ...LightTheme,
    // App layout token retained for existing chat geometry. Paper uses shapes instead.
    roundness: 6,
    shapes: { ...LightTheme.shapes, corner: { ...LightTheme.shapes.corner, extraSmall: 6 } },
    fonts,
    colors: createPaperColors(appColorTokens.light),
} satisfies Theme & { roundness: number };
