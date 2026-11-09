/// <reference path="./paper-internals.d.ts" />
import { Platform, Text as NativeText, View, type ColorValue, type TextStyle } from 'react-native';
import type { ProviderProps } from 'react-native-paper';
import { isLoaded } from 'expo-font';
import PaperFallbackIcon from 'react-native-paper/lib/module/components/MaterialCommunityIcon';
import Svg, { Path } from 'react-native-svg';
import { materialSymbolAliases } from './paper-icon-aliases';
import { materialSymbolPaths } from './material-symbol-paths';
import { materialSymbolCodepoints } from './material-symbol-codepoints';
import { materialSymbolsFontFamily } from './font-assets';

export type MaterialSymbolProps = {
    name: string;
    size?: number;
    color?: ColorValue;
    filled?: boolean;
    weight?: number;
    grade?: number;
    opticalSize?: number;
    direction?: 'ltr' | 'rtl';
    testID?: string;
};

type SymbolPaths = Readonly<Record<string, { viewBox: string; paths: readonly string[] }>>;

/** Official variable font, with pinned SVG paths before the font loads. */
function renderSymbol(
    { name, size = 24, color = '#000000', filled, weight = 400, grade = 0, opticalSize, direction = 'ltr', testID }: MaterialSymbolProps,
    fontFamily: string,
    codepoints: Readonly<Record<string, number>>,
    paths: SymbolPaths,
    waitForFont: boolean
) {
    const alias = materialSymbolAliases[name] ?? name;
    const originalFilled = alias.endsWith('_fill1');
    const symbolName = originalFilled ? alias.slice(0, -6) : alias;
    const fill = filled ?? originalFilled;
    const codepoint = Object.hasOwn(codepoints, symbolName) ? codepoints[symbolName] : undefined;
    const bounded = (value: number, min: number, max: number, fallback: number) =>
        Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
    const actualSize = bounded(size, 1, 512, 24);
    // The original font's hhea ascent/descent are1056/-96 at960 units/em.
    // iOS TextKit compresses a1em paragraph without centering its baseline.
    // Center the natural1.2em text frame inside the unchanged1em icon canvas.
    // Android's CustomLineHeightSpan already distributes the half-leading.
    const textHeight = Platform.OS === 'ios' ? actualSize * 1.2 : actualSize;
    const axes = {
        FILL: fill ? 1 : 0,
        wght: bounded(weight, 100, 700, 400),
        GRAD: bounded(grade, -50, 200, 0),
        opsz: bounded(opticalSize ?? actualSize, 20, 48, 24),
    };
    // Native Text accepts an axis record; CSS requires its quoted-axis string.
    const variationStyle = (
        Platform.OS === 'web'
            ? {
                  fontVariationSettings: Object.entries(axes)
                      .map(([axis, value]) => `"${axis}" ${value}`)
                      .join(', '),
              }
            : { fontVariationSettings: axes }
    ) as TextStyle;
    if (codepoint !== undefined && isLoaded(fontFamily))
        return (
            <View
                pointerEvents="none"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                    width: actualSize,
                    height: actualSize,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...(direction === 'rtl' ? { transform: [{ scaleX: -1 }] } : {}),
                }}
                testID={testID}
            >
                <NativeText
                    accessible={false}
                    allowFontScaling={false}
                    style={{
                        fontFamily,
                        fontSize: actualSize,
                        lineHeight: textHeight,
                        width: actualSize,
                        height: textHeight,
                        flexShrink: 0,
                        color,
                        includeFontPadding: false,
                        textAlign: 'center',
                        textAlignVertical: 'center',
                        fontWeight: '400',
                        fontStyle: 'normal',
                        fontVariationSettings: variationStyle.fontVariationSettings,
                    }}
                >
                    {String.fromCodePoint(codepoint)}
                </NativeText>
            </View>
        );
    const key = fill && Object.hasOwn(paths, `${symbolName}_fill1`) ? `${symbolName}_fill1` : symbolName;
    const symbol = Object.hasOwn(paths, key) ? paths[key] : undefined;
    if (!symbol) {
        if (waitForFont && codepoint !== undefined)
            return (
                <View
                    pointerEvents="none"
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{ width: actualSize, height: actualSize }}
                    testID={testID}
                />
            );
        return <PaperFallbackIcon name={name} size={size} color={color} direction={direction} testID={testID} />;
    }
    return (
        <Svg
            width={size}
            height={size}
            viewBox={symbol.viewBox}
            fill={color}
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={direction === 'rtl' ? { transform: [{ scaleX: -1 }] } : undefined}
            testID={testID}
        >
            {symbol.paths.map((d, index) => (
                <Path key={index} d={d} />
            ))}
        </Svg>
    );
}

export function createMaterialSymbolRenderer(
    fontFamily: string,
    codepoints: Readonly<Record<string, number>>,
    paths: SymbolPaths = materialSymbolPaths,
    { waitForFont = false }: { waitForFont?: boolean } = {}
) {
    return function MaterialSymbol(props: MaterialSymbolProps) {
        return renderSymbol(props, fontFamily, codepoints, paths, waitForFont);
    };
}

export const MaterialSymbol = createMaterialSymbolRenderer(materialSymbolsFontFamily, materialSymbolCodepoints);

type PaperIconProps = Parameters<NonNullable<NonNullable<ProviderProps['settings']>['icon']>>[0];
/** A custom settings.icon still takes precedence at the Provider boundary. */
export function renderMaterialIcon(props: PaperIconProps) {
    return <MaterialSymbol {...props} />;
}
