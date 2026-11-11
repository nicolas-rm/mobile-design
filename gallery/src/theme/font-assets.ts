import type { FontFamilyDefinition } from 'expo-font';
import { mobileDesignSymbolsFont } from '@mobile-design/icons/react-native';
import { mobileDesignRobotoFont } from 'mobile-design/react-native';

export const appFontFamily = mobileDesignRobotoFont.fontFamily;
export const appFonts: FontFamilyDefinition[] = [mobileDesignRobotoFont, mobileDesignSymbolsFont];
