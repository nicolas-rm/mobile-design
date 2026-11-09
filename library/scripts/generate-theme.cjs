const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const materialColorsPath = path.join(root, 'packages/mobile-design-tokens/src/generated/material-colors.js');
const materialColorsTypesPath = materialColorsPath.replace(/\.js$/, '.d.ts');
const defaultPreset = 'md3-baseline';
const baselineSeed = '#6750A4';
const neutralPreset = 'shadcn-neutral';

const paperColorRoles = [
    'primary',
    'onPrimary',
    'primaryContainer',
    'onPrimaryContainer',
    'secondary',
    'onSecondary',
    'secondaryContainer',
    'onSecondaryContainer',
    'tertiary',
    'onTertiary',
    'tertiaryContainer',
    'onTertiaryContainer',
    'error',
    'onError',
    'errorContainer',
    'onErrorContainer',
    'background',
    'onBackground',
    'surface',
    'onSurface',
    'surfaceVariant',
    'onSurfaceVariant',
    'outline',
    'outlineVariant',
    'inverseSurface',
    'inverseOnSurface',
    'inversePrimary',
    'shadow',
    'scrim',
    'surfaceDisabled',
    'onSurfaceDisabled',
    'backdrop',
];

const elevationColorRoles = [
    'elevationLevel0',
    'elevationLevel1',
    'elevationLevel2',
    'elevationLevel3',
    'elevationLevel4',
    'elevationLevel5',
];

const paper6ColorRoles = [
    'surfaceDim',
    'surfaceBright',
    'surfaceContainerLowest',
    'surfaceContainerLow',
    'surfaceContainer',
    'surfaceContainerHigh',
    'surfaceContainerHighest',
    'primaryFixed',
    'primaryFixedDim',
    'onPrimaryFixed',
    'onPrimaryFixedVariant',
    'secondaryFixed',
    'secondaryFixedDim',
    'onSecondaryFixed',
    'onSecondaryFixedVariant',
    'tertiaryFixed',
    'tertiaryFixedDim',
    'onTertiaryFixed',
    'onTertiaryFixedVariant',
    'stateLayerPressed',
];

// Retain the compatibility roles exported by the tokens package.
const materialColorRoles = [...paperColorRoles, ...elevationColorRoles, ...paper6ColorRoles];

async function main() {
    // A literal hex keeps the existing custom Material source-color workflow.
    // The baseline is an exact published palette, not a source-color approximation.
    const themeInput = (process.env.MOBILE_DESIGN_THEME_SEED ?? process.argv[2] ?? defaultPreset).trim();
    const normalizedInput = themeInput.toLowerCase();
    const preset = ['md3', defaultPreset].includes(normalizedInput)
        ? defaultPreset
        : ['neutral', neutralPreset].includes(normalizedInput)
          ? neutralPreset
          : 'material-source';
    const seedColor = preset === defaultPreset ? baselineSeed : preset === neutralPreset ? '#171717' : normalizeSeedColor(themeInput);
    const appColorTokens = await createAppColorTokens(seedColor, preset);

    writeMaterialColorModule(appColorTokens, seedColor, preset);
}

async function createAppColorTokens(seedColor, preset = seedColor === undefined ? defaultPreset : 'material-source') {
    if (preset === defaultPreset) {
        const baseline = require('./theme/md3-baseline-colors.json');
        const modes = Object.fromEntries(
            ['light', 'dark'].map((mode) => {
                const scheme = baseline[mode];
                const onSurface = parseRgbaColor(scheme.onSurface);
                const scrim = parseRgbaColor(scheme.scrim);
                const tokens = {
                    ...scheme,
                    surfaceDisabled: formatRgbaColor(onSurface, 0.12),
                    onSurfaceDisabled: formatRgbaColor(onSurface, 0.38),
                    backdrop: formatRgbaColor(scrim, 0.4),
                };
                // Keep the same deterministic role order for every generation mode.
                return [mode, Object.fromEntries(materialColorRoles.map((role) => [role, tokens[role]]))];
            })
        );
        return modes;
    }

    // v0.4.0's root barrel imports unrelated modules with broken ESM paths.
    // Load the palette utilities directly from the installed package instead.
    const utilitiesRoot = path.dirname(require.resolve('@material/material-color-utilities'));
    const [{ themeFromSourceColor }, { argbFromHex, hexFromArgb }, { TonalPalette }] = await Promise.all([
        import(pathToFileURL(path.join(utilitiesRoot, 'utils/theme_utils.js')).href),
        import(pathToFileURL(path.join(utilitiesRoot, 'utils/string_utils.js')).href),
        import(pathToFileURL(path.join(utilitiesRoot, 'palettes/tonal_palette.js')).href),
    ]);
    const theme = themeFromSourceColor(argbFromHex(seedColor));
    if (preset === neutralPreset) {
        const neutralPalette = TonalPalette.fromHueAndChroma(0, 0);
        return {
            light: createNeutralModeColorTokens(theme, neutralPalette, false, hexFromArgb),
            dark: createNeutralModeColorTokens(theme, neutralPalette, true, hexFromArgb),
        };
    }

    return {
        light: createModeColorTokens(theme.schemes.light.toJSON(), theme.palettes, false, hexFromArgb),
        dark: createModeColorTokens(theme.schemes.dark.toJSON(), theme.palettes, true, hexFromArgb),
    };
}

function createNeutralModeColorTokens(theme, neutralPalette, isDark, hexFromArgb) {
    const mode = isDark ? 'dark' : 'light';
    const palettes = {
        ...theme.palettes,
        neutral: neutralPalette,
        primary: neutralPalette,
        secondary: neutralPalette,
        tertiary: neutralPalette,
    };
    const tokens = createModeColorTokens(theme.schemes[mode].toJSON(), palettes, isDark, hexFromArgb);
    const color = (hex) => hexToRgba(hex);
    // shadcn/ui's official default neutral primary/foreground pairs, converted to
    // sRGB for React Native. Keep MD3's semantic roles, containers and elevation.
    // Source: https://ui.shadcn.com/docs/theming#default-theme-css
    const primary = isDark ? '#E5E5E5' : '#171717';
    const onPrimary = isDark ? '#171717' : '#FAFAFA';
    const foreground = isDark ? '#FAFAFA' : '#0A0A0A';
    Object.assign(tokens, {
        primary: color(primary),
        onPrimary: color(onPrimary),
        primaryContainer: color(isDark ? '#404040' : '#E5E5E5'),
        onPrimaryContainer: color(isDark ? '#FAFAFA' : '#171717'),
        background: color(isDark ? '#0A0A0A' : '#FFFFFF'),
        surface: color(isDark ? '#0A0A0A' : '#FFFFFF'),
        surfaceDim: isDark ? color('#0A0A0A') : tokens.surfaceDim,
        surfaceBright: isDark ? tokens.surfaceBright : color('#FFFFFF'),
        onBackground: color(foreground),
        onSurface: color(foreground),
        surfaceVariant: color(isDark ? '#262626' : '#F5F5F5'),
        onSurfaceVariant: color(isDark ? '#A3A3A3' : '#525252'),
        outline: color('#737373'),
        outlineVariant: color(isDark ? '#404040' : '#D4D4D4'),
        inverseSurface: color(isDark ? '#E5E5E5' : '#262626'),
        inverseOnSurface: color(isDark ? '#171717' : '#FAFAFA'),
        inversePrimary: color(isDark ? '#171717' : '#E5E5E5'),
        shadow: color('#000000'),
        scrim: color('#000000'),
        stateLayerPressed: formatRgbaColor(hexToRgb(foreground), 0.1),
        surfaceDisabled: formatRgbaColor(hexToRgb(foreground), 0.12),
        onSurfaceDisabled: formatRgbaColor(hexToRgb(foreground), 0.38),
        backdrop: formatRgbaColor(hexToRgb('#000000'), 0.4),
    });
    for (const family of ['secondary', 'tertiary']) {
        const capitalized = family[0].toUpperCase() + family.slice(1);
        tokens[family] = color(isDark ? '#D4D4D4' : '#525252');
        tokens[`on${capitalized}`] = color(isDark ? '#171717' : '#FFFFFF');
        tokens[`${family}Container`] = color(isDark ? '#262626' : '#F5F5F5');
        tokens[`on${capitalized}Container`] = color(isDark ? '#FAFAFA' : '#171717');
    }
    return tokens;
}

function createModeColorTokens(schemeColors, palettes, isDark, hexFromArgb) {
    const colorTokens = Object.fromEntries(paperColorRoles.map((role) => [role, formatSchemeColor(schemeColors[role], hexFromArgb)]));
    const neutralColor = (tone) => formatSchemeColor(palettes.neutral.tone(tone), hexFromArgb);
    // Match Paper 6.0.0-alpha.0's standard-contrast neutral role tones.
    const surfaceTones = isDark
        ? {
              surface: 6,
              background: 6,
              surfaceDim: 6,
              surfaceBright: 24,
              surfaceContainerLowest: 4,
              surfaceContainerLow: 10,
              surfaceContainer: 12,
              surfaceContainerHigh: 17,
              surfaceContainerHighest: 22,
          }
        : {
              surface: 98,
              background: 98,
              surfaceDim: 87,
              surfaceBright: 98,
              surfaceContainerLowest: 100,
              surfaceContainerLow: 96,
              surfaceContainer: 94,
              surfaceContainerHigh: 92,
              surfaceContainerHighest: 90,
          };
    for (const [role, tone] of Object.entries(surfaceTones)) {
        colorTokens[role] = neutralColor(tone);
    }

    const elevationTones = isDark ? [10, 12, 17, 17, 22] : [96, 94, 92, 92, 90];
    colorTokens.elevationLevel0 = 'transparent';
    elevationTones.forEach((tone, index) => {
        colorTokens[`elevationLevel${index + 1}`] = neutralColor(tone);
    });

    // Fixed roles have identical tones in both modes: 90, 80, 10 and 30.
    for (const family of ['primary', 'secondary', 'tertiary']) {
        const capitalized = family[0].toUpperCase() + family.slice(1);
        const paletteColor = (tone) => formatSchemeColor(palettes[family].tone(tone), hexFromArgb);
        colorTokens[`${family}Fixed`] = paletteColor(90);
        colorTokens[`${family}FixedDim`] = paletteColor(80);
        colorTokens[`on${capitalized}Fixed`] = paletteColor(10);
        colorTokens[`on${capitalized}FixedVariant`] = paletteColor(30);
    }
    if (isDark) {
        colorTokens.onErrorContainer = formatSchemeColor(palettes.error.tone(80), hexFromArgb);
    }

    colorTokens.stateLayerPressed = formatRgbaColor(argbToRgb(schemeColors.onSurface), 0.1);
    colorTokens.surfaceDisabled = formatRgbaColor(argbToRgb(schemeColors.onSurface), 0.12);
    colorTokens.onSurfaceDisabled = formatRgbaColor(argbToRgb(schemeColors.onSurface), 0.38);
    colorTokens.backdrop = formatRgbaColor(argbToRgb(schemeColors.scrim), 0.4);

    return colorTokens;
}

function writeMaterialColorModule(appColorTokens, seedColor, preset) {
    const currentContent = fs.existsSync(materialColorsPath) ? fs.readFileSync(materialColorsPath, 'utf8') : '';
    const lineEnding = detectLineEnding(currentContent);
    const fileContent = [
        '// Generated by scripts/generate-theme.cjs. Do not edit by hand.',
        `const materialColorPreset = '${preset}';`,
        `const materialColorSeed = '${seedColor}';`,
        '',
        `const appColorTokens = ${formatGeneratedObject(appColorTokens)};`,
        '',
        `const materialColorRoles = ${formatGeneratedObject(materialColorRoles)};`,
        '',
        'module.exports = {',
        '    materialColorPreset,',
        '    materialColorSeed,',
        '    appColorTokens,',
        '    materialColorRoles,',
        '};',
        '',
    ]
        .join('\n')
        .replace(/\n/g, lineEnding);

    fs.mkdirSync(path.dirname(materialColorsPath), { recursive: true });
    fs.writeFileSync(materialColorsPath, fileContent);
    const roleUnion = materialColorRoles.map((role) => `    | '${role}'`).join('\n');
    fs.writeFileSync(
        materialColorsTypesPath,
        [
            '// Generated by scripts/generate-theme.cjs. Do not edit by hand.',
            `type MaterialColorRole =\n${roleUnion};`,
            '',
            'declare const materialColors: {',
            "    materialColorPreset: 'md3-baseline' | 'shadcn-neutral' | 'material-source';",
            '    materialColorSeed: string;',
            '    appColorTokens: {',
            '        light: Record<MaterialColorRole, string>;',
            '        dark: Record<MaterialColorRole, string>;',
            '    };',
            '    materialColorRoles: MaterialColorRole[];',
            '};',
            '',
            'export = materialColors;',
            '',
        ].join('\n')
    );
}

function normalizeSeedColor(seedColor) {
    const normalized = seedColor.trim();
    const expanded = normalized.replace(/^#([\da-f])([\da-f])([\da-f])$/i, '#$1$1$2$2$3$3');

    if (!/^#[\da-f]{6}$/i.test(expanded)) {
        throw new Error(`Invalid theme seed color "${seedColor}". Use a hex color like #2E79FF.`);
    }

    return expanded.toUpperCase();
}

function formatSchemeColor(argbColor, hexFromArgb) {
    return hexToRgba(hexFromArgb(argbColor));
}

function hexToRgba(hexColor) {
    return formatRgbaColor(hexToRgb(hexColor), 1);
}

function hexToRgb(hexColor) {
    const hexValue = hexColor.replace('#', '');

    return {
        r: Number.parseInt(hexValue.slice(0, 2), 16),
        g: Number.parseInt(hexValue.slice(2, 4), 16),
        b: Number.parseInt(hexValue.slice(4, 6), 16),
    };
}

function argbToRgb(argbColor) {
    return {
        r: (argbColor >> 16) & 255,
        g: (argbColor >> 8) & 255,
        b: argbColor & 255,
    };
}

function parseRgbaColor(value) {
    const [, r, g, b] = /^rgba\((\d+), (\d+), (\d+), [\d.]+\)$/.exec(value);
    return { r: Number(r), g: Number(g), b: Number(b) };
}

function formatRgbaColor(color, alpha) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function formatGeneratedObject(value) {
    return serializeGeneratedValue(value);
}

function detectLineEnding(value) {
    return value.includes('\r\n') ? '\r\n' : '\n';
}

function serializeGeneratedValue(value, level = 0) {
    if (typeof value === 'string') {
        return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    }

    if (Array.isArray(value)) {
        const nextIndent = createIndent(level + 1);
        const items = value.map((item) => `${nextIndent}${serializeGeneratedValue(item, level + 1)},`);

        return ['[', ...items, `${createIndent(level)}]`].join('\n');
    }

    if (value && typeof value === 'object') {
        const nextIndent = createIndent(level + 1);
        const entries = Object.entries(value).map(([key, item]) => `${nextIndent}${key}: ${serializeGeneratedValue(item, level + 1)},`);

        return ['{', ...entries, `${createIndent(level)}}`].join('\n');
    }

    return String(value);
}

function createIndent(level) {
    return '    '.repeat(level);
}

module.exports = { createAppColorTokens, normalizeSeedColor, materialColorRoles };

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
