import { configureFonts } from 'react-native-paper';
import { appFontFamily } from './font-assets';

// Preserve all 15 baseline + 15 emphasized MD3 styles from the installed tokens.
export const fonts = configureFonts({
    config: { fontFamily: appFontFamily },
});
