import { DarkTheme, type Theme } from 'react-native-paper';
import { fonts } from '@/theme/fonts';
import { appColorTokens, createPaperColors } from '@/theme/tokens';

export const darkTheme = {
    ...DarkTheme,
    // App layout token retained for existing chat geometry. Paper uses shapes instead.
    roundness: 6,
    shapes: { ...DarkTheme.shapes, corner: { ...DarkTheme.shapes.corner, extraSmall: 6 } },
    fonts,
    colors: createPaperColors(appColorTokens.dark),
} satisfies Theme & { roundness: number };
