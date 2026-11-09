/**
 * Shared color contract: generator CLI reproducibility, app/CSS parity, actual
 * semantic contrast and declaration safety. CLI runs use a disposable project
 * tree; this check never regenerates the repository's checked-in theme files.
 * Native rendering, device color profiles and press animation remain separate.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const canonicalPath = path.join(root, 'packages/mobile-design-tokens/src/generated/material-colors.js');
const canonical = require(canonicalPath);
const compatibilityRoles = ['surfaceDisabled', 'onSurfaceDisabled', 'backdrop'];
// Test-only loader: execute Paper's actual mapping and palette without importing
// its React Native barrel. The production generator reads only the JSON input.
function loadPaperModule(file) {
    const module = { exports: {} };
    const localRequire = createRequire(fs.realpathSync(file));
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(
        code,
        {
            module,
            exports: module.exports,
            require: (request) =>
                request.startsWith('.') ? loadPaperModule(path.resolve(path.dirname(file), `${request}.js`)) : localRequire(request),
        },
        { filename: file }
    );
    return module.exports;
}
const paperTokensDirectory = path.join(path.dirname(require.resolve('react-native-paper')), 'theme/tokens');
const { buildScheme } = loadPaperModule(path.join(paperTokensDirectory, 'sys/color.js'));
const { palette } = loadPaperModule(path.join(paperTokensDirectory, 'ref/palette.js'));
function paperColors(mode) {
    return Object.fromEntries(
        Object.entries(buildScheme(palette, { mode, contrast: 'standard' })).flatMap(([role, value]) =>
            role === 'elevation'
                ? Object.entries(value).map(([level, color]) => [`elevation${level[0].toUpperCase()}${level.slice(1)}`, color])
                : [[role, value]]
        )
    );
}
let cases = 0;
function test(name, run) {
    run();
    cases++;
    console.log(`PASS ${name}`);
}
function rgba(color) {
    if (color === 'transparent') return [0, 0, 0, 0];
    const parts = /^rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)$/.exec(color);
    assert.ok(parts, `native rgba color: ${color}`);
    const channels = parts.slice(1).map(Number);
    assert.ok(
        channels.slice(0, 3).every((channel) => channel >= 0 && channel <= 255),
        color
    );
    assert.ok(channels[3] >= 0 && channels[3] <= 1, color);
    return channels;
}
function luminance(color) {
    return rgba(color)
        .slice(0, 3)
        .map((channel) => channel / 255)
        .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
        .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
}
function contrast(left, right) {
    const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
}
test('the workspace and React Native package resolve the same canonical palette object', () => {
    assert.equal(require('@mobile-design/tokens/colors'), canonical);
    assert.equal(require('./require-mobile-design-shared.cjs')('@mobile-design/tokens/colors'), canonical);
    assert.equal(canonical.materialColorPreset, 'md3-baseline');
    assert.equal(canonical.materialColorSeed, '#6750A4');
});
test('both schemes expose the complete same generated API and valid native colors', () => {
    assert.equal(new Set(canonical.materialColorRoles).size, canonical.materialColorRoles.length, 'no duplicate semantic roles');
    for (const mode of ['light', 'dark']) {
        assert.deepEqual(Object.keys(canonical.appColorTokens[mode]).sort(), [...canonical.materialColorRoles].sort());
        for (const color of Object.values(canonical.appColorTokens[mode])) rgba(color);
    }
});
test('default primary pairs and backgrounds match the exact MD3 baseline in both schemes', () => {
    assert.deepEqual(rgba(canonical.appColorTokens.light.primary), [103, 80, 164, 1]);
    assert.deepEqual(rgba(canonical.appColorTokens.light.onPrimary), [255, 255, 255, 1]);
    assert.deepEqual(rgba(canonical.appColorTokens.dark.primary), [208, 188, 255, 1]);
    assert.deepEqual(rgba(canonical.appColorTokens.dark.onPrimary), [56, 30, 114, 1]);
    assert.deepEqual(rgba(canonical.appColorTokens.light.background), [254, 247, 255, 1]);
    assert.deepEqual(rgba(canonical.appColorTokens.dark.background), [20, 18, 24, 1]);
    for (const mode of ['light', 'dark']) assert.equal(canonical.appColorTokens[mode].surface, canonical.appColorTokens[mode].background);
});
test('all 55 native roles match actual installed Paper; three CSS compatibility roles derive from that scheme', () => {
    const baseline = require('./theme/md3-baseline-colors.json');
    assert.equal(baseline.attribution.package, 'react-native-paper');
    assert.equal(baseline.attribution.version, require('react-native-paper/package.json').version);
    assert.equal(baseline.attribution.license, 'MIT');
    assert.equal(canonical.materialColorRoles.length, 58);
    for (const mode of ['light', 'dark']) {
        const expected = paperColors(mode);
        const actual = canonical.appColorTokens[mode];
        assert.equal(Object.keys(expected).length, 55);
        assert.deepEqual(Object.keys(baseline[mode]).sort(), Object.keys(expected).sort());
        assert.deepEqual(
            canonical.materialColorRoles.filter((role) => !compatibilityRoles.includes(role)).sort(),
            Object.keys(expected).sort()
        );
        for (const [role, color] of Object.entries(expected)) {
            assert.equal(actual[role], color, `${mode}.${role} equals Paper buildScheme`);
            assert.equal(baseline[mode][role], color, `${mode}.${role} input is current`);
        }
        assert.deepEqual(rgba(actual.surfaceDisabled), [...rgba(expected.onSurface).slice(0, 3), 0.12]);
        assert.deepEqual(rgba(actual.onSurfaceDisabled), [...rgba(expected.onSurface).slice(0, 3), 0.38]);
        assert.deepEqual(rgba(actual.backdrop), [...rgba(expected.scrim).slice(0, 3), 0.4]);
    }
});
test('semantic text pairs meet 4.5:1 in light and dark, including fixed roles', () => {
    const pairs = [
        ['primary', 'onPrimary'],
        ['primaryContainer', 'onPrimaryContainer'],
        ['secondary', 'onSecondary'],
        ['secondaryContainer', 'onSecondaryContainer'],
        ['tertiary', 'onTertiary'],
        ['tertiaryContainer', 'onTertiaryContainer'],
        ['background', 'onBackground'],
        ['surface', 'onSurface'],
        ['surfaceVariant', 'onSurfaceVariant'],
        ['inverseSurface', 'inverseOnSurface'],
        ['error', 'onError'],
        ['errorContainer', 'onErrorContainer'],
    ];
    for (const family of ['primary', 'secondary', 'tertiary']) {
        const capitalized = family[0].toUpperCase() + family.slice(1);
        pairs.push([`${family}Fixed`, `on${capitalized}Fixed`], [`${family}FixedDim`, `on${capitalized}FixedVariant`]);
    }
    for (const mode of ['light', 'dark']) {
        const scheme = canonical.appColorTokens[mode];
        for (const [background, foreground] of pairs) {
            const ratio = contrast(scheme[background], scheme[foreground]);
            assert.ok(ratio >= 4.5, `${mode} ${background}/${foreground}: ${ratio.toFixed(2)}:1`);
        }
        console.log(`  ${mode} primary/onPrimary ${contrast(scheme.primary, scheme.onPrimary).toFixed(2)}:1`);
    }
});
test('fixed roles stay fixed across modes and MD3 elevation/state alphas retain their behavior', () => {
    for (const role of canonical.materialColorRoles.filter((role) => /fixed/i.test(role))) {
        assert.equal(canonical.appColorTokens.light[role], canonical.appColorTokens.dark[role], role);
    }
    for (const mode of ['light', 'dark']) {
        const scheme = canonical.appColorTokens[mode];
        assert.equal(scheme.elevationLevel0, 'transparent');
        assert.deepEqual(
            ['stateLayerPressed', 'surfaceDisabled', 'onSurfaceDisabled', 'backdrop'].map((role) => rgba(scheme[role])[3]),
            [0.1, 0.12, 0.38, 0.4]
        );
        for (let level = 2; level <= 5; level++) {
            const previous = luminance(scheme[`elevationLevel${level - 1}`]);
            const current = luminance(scheme[`elevationLevel${level}`]);
            assert.ok(mode === 'light' ? current <= previous : current >= previous, `${mode} elevation ${level}`);
        }
    }
});
console.log(`PASS ${cases} generated palette contracts.`);
