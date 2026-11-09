import { useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, LightTheme, PaperProvider, useTheme, type ProviderProps, type Theme } from 'react-native-paper';
import { OutsideInteractionBoundary } from './outside-interaction';
import { PaperMotionBridge } from './paper-motion-bridge';
import { renderMaterialIcon } from './material-symbols';
import { isLoaded, loadAsync, useFonts, type FontFamilyDefinition } from 'expo-font';
import { mobileDesignRobotoFont, mobileDesignSymbolsFont } from './font-assets';
import { createMobileDesignColors } from './color-scheme';
import materialColors from '@mobile-design/tokens/colors';
import { languageLineHeights, spatialMotionTokens, type LanguageHeight } from '@mobile-design/tokens';

export type MobileDesignTheme = Theme;
export type MobileDesignThemeOptions = {
    colorScheme?: 'light' | 'dark';
    theme?: ProviderProps['theme'];
    fontFamily?: string;
    motion?: 'standard' | 'expressive';
    /** Line-height profile of the content language. Small preserves the Latin scale. */
    languageHeight?: LanguageHeight;
};

/** Recursive theme merge that treats native platform/dynamic color sentinels and arrays as leaves. */
export function mergeMobileDesignTheme<T>(base: T, overrides: unknown): T {
    if (overrides === undefined || overrides === null) return base;
    const sentinel = (value: unknown) =>
        Boolean(value && typeof value === 'object' && ('semantic' in value || 'dynamic' in value || 'resource_paths' in value));
    if (
        !base ||
        typeof base !== 'object' ||
        typeof overrides !== 'object' ||
        Array.isArray(base) ||
        Array.isArray(overrides) ||
        sentinel(base) ||
        sentinel(overrides)
    )
        return overrides as T;
    const result = { ...base } as Record<string, unknown>;
    for (const [key, value] of Object.entries(overrides)) result[key] = mergeMobileDesignTheme(result[key], value);
    return result as T;
}

/** Keeps Paper's semantic roles and complete nested token sets; never imports app preferences. */
export function createMobileDesignTheme({
    colorScheme = 'light',
    theme,
    fontFamily = 'Roboto',
    motion = 'expressive',
    languageHeight = 'small',
}: MobileDesignThemeOptions = {}): Theme {
    const mode = (theme?.dark ?? colorScheme === 'dark') ? 'dark' : 'light';
    const base = mode === 'dark' ? DarkTheme : LightTheme;
    const fonts = Object.fromEntries(
        Object.entries(base.fonts).map(([key, value]) => {
            const role = key.replace(/Emphasized$/, '') as keyof typeof languageLineHeights;
            const heights = languageLineHeights[role];
            return [
                key,
                {
                    ...value,
                    ...(heights
                        ? { lineHeight: heights[(['small', 'medium', 'large', 'extraLarge'] as const).indexOf(languageHeight)] }
                        : {}),
                    ...(fontFamily ? { fontFamily } : {}),
                },
            ];
        })
    ) as Theme['fonts'];
    const spatial = motion === 'expressive' ? spatialMotionTokens.expressive : spatialMotionTokens.standard;
    return mergeMobileDesignTheme<Theme>(
        {
            ...base,
            dark: theme?.dark ?? colorScheme === 'dark',
            colors: createMobileDesignColors(materialColors.appColorTokens[mode]),
            fonts,
            shapes: base.shapes,
            elevation: base.elevation,
            animation: base.animation,
            motion: {
                ...base.motion,
                duration: base.motion.duration,
                easing: base.motion.easing,
                spring: Object.fromEntries(
                    (['fast', 'default', 'slow'] as const).map((key) => [
                        key,
                        {
                            spatial: { ...base.motion.spring[key].spatial, ...spatial[key] },
                            effects: base.motion.spring[key].effects,
                        },
                    ])
                ) as Theme['motion']['spring'],
            },
        },
        theme
    );
}

export type MobileDesignProviderProps = Omit<ProviderProps, 'theme'> & MobileDesignThemeOptions;

function useRuntimeDefaultFonts(fonts: FontFamilyDefinition[]) {
    const [result, setResult] = useState<{ fonts: FontFamilyDefinition[]; error: Error | null }>();
    const currentResult = result?.fonts === fonts ? result : undefined;
    const ready = currentResult?.error === null || fonts.every(({ fontFamily }) => isLoaded(fontFamily));
    useEffect(() => {
        if (ready) return;
        let active = true;
        loadAsync(fonts).then(
            () => {
                if (active) setResult({ fonts, error: null });
            },
            (error) => {
                if (active) setResult({ fonts, error });
            }
        );
        return () => {
            active = false;
        };
    }, [fonts, ready]);
    return [ready, ready ? null : currentResult?.error] as const;
}

// Expo's static hook registers the selected font faces while rendering web HTML.
const useDefaultFonts = typeof window === 'undefined' ? useFonts : useRuntimeDefaultFonts;

/** One Paper theme/settings/locale/Portal context, including OS reduced-motion updates. */
export function MobileDesignProvider({
    colorScheme,
    fontFamily,
    motion,
    languageHeight,
    theme,
    settings,
    ...props
}: MobileDesignProviderProps) {
    const systemScheme = useColorScheme();
    const resolved = colorScheme ?? (systemScheme === 'dark' ? 'dark' : 'light');
    const value = useMemo(
        () => createMobileDesignTheme({ colorScheme: resolved, fontFamily, motion, languageHeight, theme }),
        [resolved, fontFamily, motion, languageHeight, theme]
    );
    const iconSettings = useMemo(() => (settings?.icon ? settings : { ...settings, icon: renderMaterialIcon }), [settings]);
    const usesRoboto = Object.values(value.fonts).some(({ fontFamily }) => fontFamily === mobileDesignRobotoFont.fontFamily);
    const usesMaterialSymbols = iconSettings.icon === renderMaterialIcon;
    const defaultFonts = useMemo(
        () => [...(usesRoboto ? [mobileDesignRobotoFont] : []), ...(usesMaterialSymbols ? [mobileDesignSymbolsFont] : [])],
        [usesRoboto, usesMaterialSymbols]
    );
    const [fontsReady, fontError] = useDefaultFonts(defaultFonts);
    const selection = useMemo(() => ({ theme: value, settings: iconSettings }), [value, iconSettings]);
    const [lastReady, setLastReady] = useState<typeof selection>();
    useEffect(() => {
        if (fontsReady) setLastReady(selection);
    }, [fontsReady, selection]);
    const applied = fontsReady ? selection : lastReady;
    if (fontError) throw fontError;
    if (!applied) return null;
    return (
        <OutsideInteractionBoundary>
            <PaperProvider {...props} {...applied}>
                <PaperMotionBridge>{props.children}</PaperMotionBridge>
            </PaperProvider>
        </OutsideInteractionBoundary>
    );
}

export function useMobileTheme(overrides?: ProviderProps['theme']) {
    const theme = useTheme<MobileDesignTheme>();
    return useMemo(() => (overrides ? mergeMobileDesignTheme(theme, overrides) : theme), [theme, overrides]);
}
