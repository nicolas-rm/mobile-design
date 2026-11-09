import type { FontFamilyDefinition } from 'expo-font';

/** Original Google fonts, bundled locally. No runtime CDN or generated look-alike glyphs. */
export const mobileDesignRobotoFont = {
    fontFamily: 'Roboto',
    fontDefinitions: [
        { path: require('../assets/fonts/roboto/Roboto_400Regular.ttf'), weight: 400, style: 'normal' },
        { path: require('../assets/fonts/roboto/Roboto_400Regular_Italic.ttf'), weight: 400, style: 'italic' },
        { path: require('../assets/fonts/roboto/Roboto_500Medium.ttf'), weight: 500, style: 'normal' },
        { path: require('../assets/fonts/roboto/Roboto_500Medium_Italic.ttf'), weight: 500, style: 'italic' },
        { path: require('../assets/fonts/roboto/Roboto_600SemiBold.ttf'), weight: 600, style: 'normal' },
        { path: require('../assets/fonts/roboto/Roboto_600SemiBold_Italic.ttf'), weight: 600, style: 'italic' },
        { path: require('../assets/fonts/roboto/Roboto_700Bold.ttf'), weight: 700, style: 'normal' },
        { path: require('../assets/fonts/roboto/Roboto_700Bold_Italic.ttf'), weight: 700, style: 'italic' },
        { path: require('../assets/fonts/roboto/Roboto_800ExtraBold.ttf'), weight: 800, style: 'normal' },
        { path: require('../assets/fonts/roboto/Roboto_800ExtraBold_Italic.ttf'), weight: 800, style: 'italic' },
    ],
} satisfies FontFamilyDefinition;

export const materialSymbolsFontFamily = 'MobileDesignMaterialSymbolsRounded';
export const mobileDesignSymbolsFont = {
    fontFamily: materialSymbolsFontFamily,
    // Do not pin weight here: all four original variable axes remain available.
    fontDefinitions: [{ path: require('../assets/fonts/MaterialSymbolsRounded.ttf') }],
} satisfies FontFamilyDefinition;

/** Can also be preloaded once by the app's root useFonts call. */
export const mobileDesignFonts: FontFamilyDefinition[] = [mobileDesignRobotoFont, mobileDesignSymbolsFont];
