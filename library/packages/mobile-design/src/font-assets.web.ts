import type { FontFamilyDefinition } from 'expo-font';

/** Lossless web compression of the original local fonts; no glyph subsetting. */
export const mobileDesignRobotoFont = {
    fontFamily: 'Roboto',
    fontDefinitions: [
        { path: require('../assets/fonts/roboto/Roboto_400Regular.woff2'), weight: 400, style: 'normal' },
        { path: require('../assets/fonts/roboto/Roboto_400Regular_Italic.woff2'), weight: 400, style: 'italic' },
        { path: require('../assets/fonts/roboto/Roboto_500Medium.woff2'), weight: 500, style: 'normal' },
        { path: require('../assets/fonts/roboto/Roboto_500Medium_Italic.woff2'), weight: 500, style: 'italic' },
        { path: require('../assets/fonts/roboto/Roboto_600SemiBold.woff2'), weight: 600, style: 'normal' },
        { path: require('../assets/fonts/roboto/Roboto_600SemiBold_Italic.woff2'), weight: 600, style: 'italic' },
        { path: require('../assets/fonts/roboto/Roboto_700Bold.woff2'), weight: 700, style: 'normal' },
        { path: require('../assets/fonts/roboto/Roboto_700Bold_Italic.woff2'), weight: 700, style: 'italic' },
        { path: require('../assets/fonts/roboto/Roboto_800ExtraBold.woff2'), weight: 800, style: 'normal' },
        { path: require('../assets/fonts/roboto/Roboto_800ExtraBold_Italic.woff2'), weight: 800, style: 'italic' },
    ],
} satisfies FontFamilyDefinition;

export const materialSymbolsFontFamily = 'MobileDesignMaterialSymbolsRounded';
export const mobileDesignSymbolsFont = {
    fontFamily: materialSymbolsFontFamily,
    fontDefinitions: [{ path: require('../assets/fonts/MaterialSymbolsRounded.woff2') }],
} satisfies FontFamilyDefinition;
export const mobileDesignFonts: FontFamilyDefinition[] = [mobileDesignRobotoFont, mobileDesignSymbolsFont];
