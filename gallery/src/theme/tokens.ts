import { createMobileDesignColors } from 'mobile-design/react-native';
import materialColors from '@mobile-design/tokens/colors';

type AppColorTokens = typeof materialColors.appColorTokens;
type StringTokenMap<TTokenMap> = {
    readonly [Key in keyof TTokenMap]: string;
};

export const appColorTokens = materialColors.appColorTokens as AppColorTokens;
export const materialColorSeed = materialColors.materialColorSeed;
export const materialColorPreset = materialColors.materialColorPreset;
export const materialColorRoles = materialColors.materialColorRoles as ReadonlyArray<keyof AppColorTokens['light']>;
/** Compatibility artwork roles derive from the same generated MD3 palette. */
export const authenticationColorTokens = {
    artwork: {
        background: appColorTokens.dark.background,
        backgroundDeep: appColorTokens.dark.surfaceContainerLowest,
        blueGlow: appColorTokens.dark.primary,
        darkPlanet: appColorTokens.dark.surfaceContainerHigh,
        lime: appColorTokens.dark.tertiaryContainer,
        orbit: appColorTokens.dark.outlineVariant,
        orbitShadow: appColorTokens.dark.scrim,
        text: appColorTokens.dark.onSurface,
        textMuted: appColorTokens.dark.onSurfaceVariant,
        whiteGlow: appColorTokens.dark.onPrimaryContainer,
    },
    welcome: {
        background: appColorTokens.dark.background,
        accent: appColorTokens.dark.primary,
        title: appColorTokens.dark.onSurface,
        titleShadow: appColorTokens.dark.scrim,
        keywords: appColorTokens.dark.onSurfaceVariant,
    },
} as const;

export type AppColorModeTokens = StringTokenMap<AppColorTokens['light']>;

export const createPaperColors = createMobileDesignColors;

function toCssVariableName(role: string) {
    return role.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function createThemeVariables(colorTokens: AppColorModeTokens) {
    return Object.fromEntries(
        materialColorRoles.map((role) => [`--app-color-${toCssVariableName(String(role))}`, colorTokens[role]])
    ) as Record<`--${string}`, string>;
}
