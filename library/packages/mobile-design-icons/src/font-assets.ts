import type { FontFamilyDefinition } from 'expo-font';

export const materialSymbolsFontFamily = 'MobileDesignMaterialSymbolsRoundedFull';
export const mobileDesignSymbolsFont = {
    fontFamily: materialSymbolsFontFamily,
    fontDefinitions: [{ path: require('../assets/fonts/MaterialSymbolsRounded.ttf') }],
} satisfies FontFamilyDefinition;
