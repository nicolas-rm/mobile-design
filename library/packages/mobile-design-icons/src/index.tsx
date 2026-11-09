import { isLoaded, useFonts } from 'expo-font';
import { createMaterialSymbolRenderer, type MaterialSymbolProps } from 'mobile-design/react-native';
import type { ProviderProps } from 'react-native-paper';
import { materialSymbolsFontFamily, mobileDesignSymbolsFont } from './font-assets';
import { materialSymbolCodepoints } from './material-symbol-codepoints';
import { materialSymbolPaths } from './material-symbol-paths';

export { materialSymbolsFontFamily, mobileDesignSymbolsFont } from './font-assets';
export type { MaterialSymbolProps } from 'mobile-design/react-native';

const Glyph = createMaterialSymbolRenderer(materialSymbolsFontFamily, materialSymbolCodepoints, materialSymbolPaths, { waitForFont: true });
const fonts = [mobileDesignSymbolsFont];

function LoadMaterialSymbol(props: MaterialSymbolProps) {
    const [, error] = useFonts(fonts);
    if (error) throw error;
    return <Glyph {...props} />;
}

export function MaterialSymbol(props: MaterialSymbolProps) {
    return isLoaded(materialSymbolsFontFamily) ? <Glyph {...props} /> : <LoadMaterialSymbol {...props} />;
}

type PaperIconProps = Parameters<NonNullable<NonNullable<ProviderProps['settings']>['icon']>>[0];

export function renderMaterialIcon(props: PaperIconProps) {
    return <MaterialSymbol {...props} />;
}
