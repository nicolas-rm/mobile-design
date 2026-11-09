/**
 * node scripts/verify-mobile-design-foundation.cjs
 *
 * Executes the actual theme factory/merge/hooks/provider and motion bridges. Theme fixtures
 * come from the installed Paper source plus the generated shared color palette.
 * Frozen inputs detect mutation.
 * The Paper Portal double drops ReduceMotionContext at its boundary, then checks the
 * actual Portal integration restores it. NativeModal owns its own physical window,
 * theme, gesture root and Portal host. The Menu popup engine is outside this unit.
 * Barrel exports are resolved statically through the actual
 * TypeScript sources, including namespaces and Object.assign static members.
 *
 * Limits: minimal hooks/context/JSX/native doubles are not React scheduling, AccessibilityInfo
 * event delivery, Paper focus/measurement, the native renderer, animation physics or FPS.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('typescript');
const requireShared = require('./require-mobile-design-shared.cjs');
const root = path.resolve(__dirname, '..');
const paperRoot = path.join(root, 'node_modules/react-native-paper');
const packageRoot = path.join(root, 'packages/mobile-design');
const installedPaper = JSON.parse(fs.readFileSync(path.join(paperRoot, 'package.json'), 'utf8'));
const publicPaperEntry = path.join(
    paperRoot,
    typeof installedPaper['react-native'] === 'string' ? installedPaper['react-native'] : (installedPaper.module ?? installedPaper.main)
);
const runtimePaperDirectory = path.dirname(publicPaperEntry);
let tests = 0;
const failures = [];
function test(name, fn) {
    tests++;
    try {
        fn();
    } catch (error) {
        failures.push({ name, error });
    }
}
const plain = (value) => JSON.parse(JSON.stringify(value));
function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
    }
    return value;
}
function source(file) {
    return ts.createSourceFile(
        file,
        fs.readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
}
function resolveModule(from, request) {
    let location;
    if (request === 'react-native-paper') location = path.join(paperRoot, 'src/index.tsx');
    else if (request.startsWith('.')) location = path.resolve(path.dirname(from), request);
    else {
        const packageFile = createRequire(fs.realpathSync(from)).resolve(`${request}/package.json`);
        const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
        location = path.resolve(
            path.dirname(packageFile),
            typeof pkg['react-native'] === 'string' ? pkg['react-native'] : (pkg.source ?? pkg.module ?? pkg.main)
        );
    }
    for (const candidate of [
        location,
        `${location}.ts`,
        `${location}.tsx`,
        `${location}.js`,
        path.join(location, 'index.ts'),
        path.join(location, 'index.tsx'),
        path.join(location, 'index.js'),
    ]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
    throw Error(`Cannot resolve ${request} from ${from}`);
}

let currentTheme;
let colorScheme = 'light';
let osReduced = false;
const jsx = (type, props) => ({ type, props });
const React = {
    useMemo: (fn) => fn(),
    useContext: (target) => target.current,
    useRef: (current) => ({ current }),
    useEffect() {},
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    createContext(value) {
        const target = { current: value };
        target.Provider = { context: target };
        return target;
    },
};
const context = React.createContext(false);
function PaperPortal(props) {
    return props.children;
}
PaperPortal.Host = function PortalHost() {};
function PaperProvider(props) {
    return props.children;
}
function ThemeProvider(props) {
    return props.children;
}
function RNModal(props) {
    return props.children;
}
function GestureHandlerRootView(props) {
    return props.children;
}
function View(props) {
    return props.children;
}
let nativeWindow = 'root',
    portalHostWindow = 'root',
    gestureWindow = 'root',
    windowRevision = 0;
let fontsReady = true,
    fontLoadError = null;
const mobileDesignRobotoFont = { fontFamily: 'Roboto' };
const mobileDesignSymbolsFont = { fontFamily: 'MobileDesignMaterialSymbolsRounded' };
const registeredFontNames = [];
const mocks = {
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
        Modal: RNModal,
        View,
        useColorScheme: () => colorScheme,
        Platform: {
            OS: 'android',
            select: (values) => values.android ?? values.native ?? values.default,
            constants: { reactNativeVersion: { minor: 88 } },
        },
        Animated: { Value: class Value {}, ValueXY: class ValueXY {} },
    },
    'react-native-paper/lib/module/theme/accessibility/ReduceMotionContext': { ReduceMotionContext: context },
    './material-symbols': { renderMaterialIcon: function MaterialIconBoundary() {} },
    'expo-font': {
        useFonts(definitions) {
            registeredFontNames.push(...definitions.map(({ fontFamily }) => fontFamily));
            return [fontsReady, fontLoadError];
        },
        isLoaded: () => fontsReady,
    },
    './font-assets': {
        mobileDesignRobotoFont,
        mobileDesignSymbolsFont,
        mobileDesignFonts: [mobileDesignRobotoFont, mobileDesignSymbolsFont],
        materialSymbolsFontFamily: mobileDesignSymbolsFont.fontFamily,
    },
    'react-native-gesture-handler': { GestureHandlerRootView },
};
const cache = new Map();
function load(file, runtime) {
    if (!runtime && cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    if (!runtime) cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true,
        },
    }).outputText;
    const localRequire = createRequire(fs.realpathSync(file));
    const bindings = runtime ? { ...mocks, ...runtime.mocks } : mocks;
    vm.runInNewContext(
        code,
        {
            module,
            exports: module.exports,
            __DEV__: false,
            process,
            ...runtime?.globals,
            require: (request) =>
                request in bindings
                    ? bindings[request]
                    : request.startsWith('.') || request.startsWith('@/')
                      ? load(resolveModule(file, request))
                      : localRequire(request),
        },
        { filename: file }
    );
    return module.exports;
}
const coreFile = path.join(packageRoot, 'src/core.tsx');
const runtimeExtension = publicPaperEntry.endsWith('.tsx') ? '.tsx' : '.js';
const light = load(path.join(runtimePaperDirectory, `theme/schemes/LightTheme${runtimeExtension}`)).LightTheme;
const dark = load(path.join(runtimePaperDirectory, `theme/schemes/DarkTheme${runtimeExtension}`)).DarkTheme;
mocks['react-native-paper'] = {
    LightTheme: light,
    DarkTheme: dark,
    useTheme: () => currentTheme,
    PaperProvider,
    ThemeProvider,
    Portal: PaperPortal,
};
currentTheme = light;
const materialColors = requireShared('@mobile-design/tokens/colors');
const colorTokens = materialColors.appColorTokens;
const originalColors = plain(materialColors);
freeze(materialColors);
const core = load(coreFile);
const motion = load(path.join(packageRoot, 'src/paper-motion.tsx'));
const catalogue = load(path.join(packageRoot, 'src/catalog.ts'));
const { NativeModal } = load(path.join(packageRoot, 'src/native-modal.tsx'));
const originalLight = plain(light);
const originalDark = plain(dark);
freeze(light);
freeze(dark);

function assertGeneratedColors(colors, scheme, paperColors) {
    assert.deepEqual(Object.keys(colors).sort(), Object.keys(paperColors).sort(), 'complete installed Paper color API');
    for (const [role, value] of Object.entries(colors)) {
        if (role === 'elevation') {
            for (const [level, color] of Object.entries(value))
                assert.equal(color, scheme[`elevation${level[0].toUpperCase()}${level.slice(1)}`]);
        } else assert.equal(value, scheme[role], `generated role ${role}`);
    }
}

test('default factory uses all shared light colors while preserving complete Paper tokens and bundled MD3 Roboto', () => {
    const value = core.createMobileDesignTheme();
    assert.equal(value.dark, false);
    assertGeneratedColors(value.colors, colorTokens.light, light.colors);
    assert.deepEqual(plain(value.shapes), plain(light.shapes));
    assert.deepEqual(
        plain(value.fonts),
        Object.fromEntries(Object.entries(plain(light.fonts)).map(([role, style]) => [role, { ...style, fontFamily: 'Roboto' }]))
    );
    assert.deepEqual(plain(value.motion), plain(light.motion));
});
test('language-height profiles reach baseline/emphasized fonts without changing size or mutating Paper', () => {
    const profiles = {
        small: [64, 24, 16],
        medium: [73, 27, 18],
        large: [89, 31, 21],
        extraLarge: [120, 41, 30],
    };
    for (const [languageHeight, expected] of Object.entries(profiles)) {
        const theme = core.createMobileDesignTheme({ languageHeight });
        for (const [index, variant] of ['displayLarge', 'bodyLarge', 'labelMedium'].entries()) {
            assert.equal(theme.fonts[variant].lineHeight, expected[index], languageHeight + ' ' + variant);
            assert.equal(theme.fonts[variant + 'Emphasized'].lineHeight, expected[index]);
            assert.equal(theme.fonts[variant].fontSize, light.fonts[variant].fontSize);
            assert.equal(theme.fonts[variant + 'Emphasized'].fontWeight, light.fonts[variant + 'Emphasized'].fontWeight);
        }
    }
    assert.equal(light.fonts.bodyLarge.lineHeight, 24);
    assert.equal(
        core.createMobileDesignTheme({ languageHeight: 'medium', theme: { fonts: { bodyLarge: { lineHeight: 44 } } } }).fonts.bodyLarge
            .lineHeight,
        44
    );
});
test('dark selection uses shared dark colors even when theme.dark overrides colorScheme', () => {
    assertGeneratedColors(core.createMobileDesignTheme({ colorScheme: 'dark' }).colors, colorTokens.dark, dark.colors);
    assertGeneratedColors(
        core.createMobileDesignTheme({ colorScheme: 'light', theme: { dark: true } }).colors,
        colorTokens.dark,
        dark.colors
    );
    assertGeneratedColors(
        core.createMobileDesignTheme({ colorScheme: 'dark', theme: { dark: false } }).colors,
        colorTokens.light,
        light.colors
    );
});
test('standard and expressive motion are independent of override object identity', () => {
    const standard = core.createMobileDesignTheme({ motion: 'standard' });
    assert.deepEqual(plain(standard.motion.spring.fast.spatial), { stiffness: 1400, damping: 0.9 });
    assert.deepEqual(plain(standard.motion.spring.default.spatial), { stiffness: 700, damping: 0.9 });
    assert.deepEqual(plain(standard.motion.spring.slow.spatial), { stiffness: 300, damping: 0.9 });
    assert.deepEqual(plain(standard.motion.spring.fast.effects), plain(light.motion.spring.fast.effects));
    assert.deepEqual(plain(core.createMobileDesignTheme().motion.spring.fast.spatial), { stiffness: 800, damping: 0.6 });
});
test('partial nested overrides retain all sibling tokens and remain immutable', () => {
    const overrides = freeze({
        colors: { primary: '#123456', elevation: { level2: '#654321' } },
        fonts: { titleLarge: { fontWeight: '700' } },
        shapes: { corner: { small: 9 } },
        motion: {
            spring: { fast: { spatial: { damping: 0.31 }, effects: { stiffness: 2345 } } },
            duration: { short1: 17 },
            easing: { standard: [0.1, 0.2, 0.7, 1] },
        },
        animation: { scale: 0 },
        elevation: { level2: 4 },
    });
    const snapshot = plain(overrides);
    const value = core.createMobileDesignTheme({ theme: overrides, motion: 'standard', fontFamily: 'Body' });
    assert.equal(value.colors.primary, '#123456');
    assert.equal(value.colors.secondary, colorTokens.light.secondary);
    assert.equal(value.colors.elevation.level2, '#654321');
    assert.equal(value.colors.elevation.level3, colorTokens.light.elevationLevel3);
    assert.equal(value.fonts.titleLarge.fontWeight, '700');
    assert.equal(value.fonts.titleLarge.fontSize, light.fonts.titleLarge.fontSize);
    assert.equal(value.fonts.titleLarge.fontFamily, 'Body');
    assert.equal(value.shapes.corner.small, 9);
    assert.equal(value.shapes.corner.large, light.shapes.corner.large);
    assert.equal(value.motion.spring.fast.spatial.stiffness, 1400);
    assert.equal(value.motion.spring.fast.spatial.damping, 0.31);
    assert.equal(value.motion.spring.fast.effects.stiffness, 2345);
    assert.equal(value.motion.spring.fast.effects.damping, light.motion.spring.fast.effects.damping);
    assert.equal(value.motion.duration.short1, 17);
    assert.equal(value.motion.duration.long1, light.motion.duration.long1);
    assert.deepEqual(plain(value.motion.easing.standard), [0.1, 0.2, 0.7, 1]);
    assert.equal(value.animation.scale, 0);
    assert.equal(value.elevation.level2, 4);
    assert.deepEqual(plain(overrides), snapshot);
});
test('alpha overrides keep their literal channels and all generated dark siblings', () => {
    const overrides = freeze({ colors: { primary: 'rgba(19, 37, 53, 0.42)', elevation: { level2: 'rgba(17, 29, 41, 0.65)' } } });
    const snapshot = plain(overrides);
    const value = core.createMobileDesignTheme({ colorScheme: 'dark', theme: overrides });
    assert.equal(value.colors.primary, 'rgba(19, 37, 53, 0.42)');
    assert.equal(value.colors.elevation.level2, 'rgba(17, 29, 41, 0.65)');
    assert.equal(value.colors.secondary, colorTokens.dark.secondary);
    assert.equal(value.colors.elevation.level3, colorTokens.dark.elevationLevel3);
    assert.deepEqual(plain(overrides), snapshot);
});
test('font family applies globally but an explicit typescale family wins', () => {
    const value = core.createMobileDesignTheme({ fontFamily: 'Global', theme: { fonts: { titleLarge: { fontFamily: 'Heading' } } } });
    assert.equal(value.fonts.bodyMedium.fontFamily, 'Global');
    assert.equal(value.fonts.titleLarge.fontFamily, 'Heading');
    assert.equal(value.fonts.labelSmall.lineHeight, light.fonts.labelSmall.lineHeight);
});
for (const [name, sentinel] of Object.entries({
    ios: { semantic: ['labelColor'] },
    dynamic: { dynamic: { light: '#fff', dark: '#000' } },
    android: { resource_paths: ['?attr/colorPrimary'] },
})) {
    test(`native ${name} color sentinel is an atomic leaf`, () => {
        freeze(sentinel);
        const value = core.createMobileDesignTheme({ theme: { colors: { primary: sentinel } } });
        assert.equal(value.colors.primary, sentinel);
        const merged = core.mergeMobileDesignTheme({ color: { semantic: ['oldColor'] } }, { color: sentinel });
        assert.equal(merged.color, sentinel);
        assert.deepEqual(Object.keys(merged.color), Object.keys(sentinel));
    });
}
test('recursive merge replaces arrays and preserves falsy scalar overrides', () => {
    const base = freeze({ nested: { enabled: true, count: 2, label: 'old', untouched: 7 }, array: [0, 1, 2, 3] });
    const overrides = freeze({ nested: { enabled: false, count: 0, label: '' }, array: [0.2, 0, 0, 1] });
    const value = core.mergeMobileDesignTheme(base, overrides);
    assert.deepEqual(plain(value), { nested: { enabled: false, count: 0, label: '', untouched: 7 }, array: [0.2, 0, 0, 1] });
    assert.notEqual(value, base);
    assert.notEqual(value.nested, base.nested);
    assert.equal(value.array, overrides.array, 'immutable merge may share leaf arrays; it does not mutate them');
    assert.equal(core.mergeMobileDesignTheme(base, undefined), base);
    assert.equal(core.mergeMobileDesignTheme(base, null), base);
});
test('useMobileTheme preserves context identity or creates a complete local override', () => {
    currentTheme = light;
    assert.equal(core.useMobileTheme(), light);
    const result = core.useMobileTheme({ motion: { spring: { slow: { spatial: { damping: 0.45 } } } } });
    assert.equal(result.motion.spring.slow.spatial.stiffness, light.motion.spring.slow.spatial.stiffness);
    assert.equal(result.motion.spring.slow.spatial.damping, 0.45);
    assert.equal(result.colors.primary, light.colors.primary);
});
test('theme factory and hook never mutate installed light/dark or generated shared fixtures', () => {
    assert.deepEqual(plain(light), originalLight);
    assert.deepEqual(plain(dark), originalDark);
    assert.deepEqual(plain(materialColors), originalColors);
});

// Portal deliberately loses the private context. NativeModal's physical window
// drops both theme and private context; production integrations restore them.
let paperProviderProps;
let paperProviderCount = 0;
function render(node) {
    if (node == null || typeof node !== 'object') return node;
    if (Array.isArray(node)) return node.map(render);
    if (node.type === RNModal) {
        // Deliberately lose private/theme context at the physical-window double.
        // The production host must explicitly provide the captured values again.
        const previous = { nativeWindow, context: context.current, theme: currentTheme };
        nativeWindow = `modal-${++windowRevision}`;
        context.current = false;
        currentTheme = light;
        try {
            return render(node.props.children);
        } finally {
            nativeWindow = previous.nativeWindow;
            context.current = previous.context;
            currentTheme = previous.theme;
        }
    }
    if (node.type === ThemeProvider) {
        const previous = currentTheme;
        currentTheme = node.props.theme;
        try {
            return render(node.props.children);
        } finally {
            currentTheme = previous;
        }
    }
    if (node.type === GestureHandlerRootView) {
        const previous = gestureWindow;
        gestureWindow = nativeWindow;
        try {
            return render(node.props.children);
        } finally {
            gestureWindow = previous;
        }
    }
    if (node.type === PaperPortal.Host) {
        const previous = portalHostWindow;
        portalHostWindow = nativeWindow;
        try {
            return render(node.props.children);
        } finally {
            portalHostWindow = previous;
        }
    }
    if (node.type?.context) {
        const target = node.type.context;
        const previous = target.current;
        target.current = node.props.value;
        try {
            return render(node.props.children);
        } finally {
            target.current = previous;
        }
    }
    if (node.type === PaperPortal) {
        const previous = context.current;
        context.current = false;
        try {
            return render(node.props.children);
        } finally {
            context.current = previous;
        }
    }
    if (node.type === PaperProvider) {
        paperProviderProps = node.props;
        paperProviderCount++;
        const previousTheme = currentTheme;
        const previous = context.current;
        const reduced = node.props.reduceMotion === 'on' || (node.props.reduceMotion !== 'off' && osReduced);
        currentTheme = {
            ...node.props.theme,
            animation: { ...node.props.theme.animation, scale: reduced ? 0 : node.props.theme.animation.scale },
        };
        context.current = reduced;
        try {
            return render(node.props.children);
        } finally {
            currentTheme = previousTheme;
            context.current = previous;
        }
    }
    if (typeof node.type === 'function') return render(node.type(node.props));
    return node;
}
const probe = () => ({ reduced: React.useContext(context), scale: currentTheme.animation.scale });
const probeNode = jsx(probe, {});
function renderProvider(props) {
    const before = paperProviderCount;
    const content = render(core.MobileDesignProvider(props));
    assert.equal(paperProviderCount, before + 1, 'content has one Paper provider');
    return { props: paperProviderProps, content };
}
test('Portal double exposes a context loss that the real integration must restore', () => {
    currentTheme = light;
    context.current = true;
    assert.equal(render(jsx(PaperPortal, { children: probeNode })).reduced, false);
});
for (const [inherited, scale] of [
    [true, 1],
    [false, 0],
    [false, 1],
])
    test(`Portal retains reduced=${inherited} / theme.scale=${scale} across the boundary`, () => {
        context.current = inherited;
        currentTheme = { ...light, animation: { scale } };
        assert.equal(render(jsx(motion.Portal, { children: probeNode })).reduced, inherited || scale === 0);
        assert.equal(context.current, inherited, 'context scope is restored after rendering');
    });
test('Portal honours a local theme.scale0 and forwards its theme and content', () => {
    currentTheme = light;
    context.current = false;
    const theme = { ...light, animation: { ...light.animation, scale: 0 } };
    const node = motion.Portal({ theme, children: probeNode });
    assert.equal(node.type, PaperPortal);
    assert.equal(node.props.theme, theme);
    assert.equal(node.props.children.props.children, probeNode);
    assert.equal(render(node).reduced, true);
});
test('bridge and nested portals preserve reduction without changing the shared theme', () => {
    currentTheme = { ...light, animation: { scale: 0 } };
    context.current = false;
    const tree = jsx(motion.PaperMotionBridge, { children: jsx(motion.Portal, { children: jsx(motion.Portal, { children: probeNode }) }) });
    assert.deepEqual(plain(render(tree)), { reduced: true, scale: 0 });
});
test('Portal.Host retains the current Paper host identity', () => {
    assert.equal(motion.Portal.Host, PaperPortal.Host);
});
test('provider forwards settings/direction/preference and wraps content once', () => {
    const settings = { rippleEffectEnabled: false, icon: () => null };
    const { props, content } = renderProvider({ colorScheme: 'dark', settings, direction: 'rtl', reduceMotion: 'on', children: probeNode });
    assert.equal(props.settings, settings);
    assert.equal(props.direction, 'rtl');
    assert.equal(props.reduceMotion, 'on');
    assert.equal(props.theme.dark, true);
    assert.equal(props.children.type, motion.PaperMotionBridge);
    assert.equal(content.reduced, true);
});
test('provider follows system colour scheme while explicit colour scheme wins', () => {
    colorScheme = 'dark';
    assert.equal(renderProvider({}).props.theme.dark, true);
    assert.equal(renderProvider({ colorScheme: 'light' }).props.theme.dark, false);
    colorScheme = null;
    assert.equal(renderProvider({}).props.theme.dark, false);
});
test('provider waits for original fonts and surfaces a load failure before rendering fallback glyphs', () => {
    fontsReady = false;
    assert.equal(core.MobileDesignProvider({ children: probeNode }), null);
    fontLoadError = new Error('font asset could not load');
    assert.throws(() => core.MobileDesignProvider({}), /font asset could not load/);
    fontLoadError = null;
    fontsReady = true;
    assert.equal(core.createMobileDesignTheme().fonts.bodyLarge.fontFamily, 'Roboto');
});
test('provider installs the local Material Symbols renderer without dropping other settings', () => {
    const { props } = renderProvider({ settings: { rippleEffectEnabled: false } });
    assert.equal(props.settings.rippleEffectEnabled, false);
    assert.equal(typeof props.settings.icon, 'function');
    assert.equal(props.settings.icon.name, 'MaterialIconBoundary');
});
const defaultIconRenderer = mocks['./material-symbols'].renderMaterialIcon;
const customIconRenderer = () => null;
for (const [description, props, expectedFonts] of [
    ['both defaults', {}, [mobileDesignRobotoFont, mobileDesignSymbolsFont]],
    ['custom typography', { fontFamily: 'Inter' }, [mobileDesignSymbolsFont]],
    ['custom icons', { settings: { icon: customIconRenderer } }, [mobileDesignRobotoFont]],
    ['both custom', { fontFamily: 'Inter', settings: { icon: customIconRenderer } }, []],
    ['explicit Material Symbols', { fontFamily: 'Inter', settings: { icon: defaultIconRenderer } }, [mobileDesignSymbolsFont]],
]) {
    test(`provider registers only its selected static fonts with ${description}`, () => {
        registeredFontNames.length = 0;
        const { props: paperProps } = renderProvider(props);
        assert.deepEqual(registeredFontNames, expectedFonts.map(({ fontFamily }) => fontFamily));
        assert.equal(paperProps.theme.fonts.bodyLarge.fontFamily, props.fontFamily ?? 'Roboto');
        assert.equal(paperProps.settings.icon, props.settings?.icon ?? defaultIconRenderer);
    });
}
test('runtime provider preserves its children and last ready selection while switching back to defaults', () => {
    let cursor = 0;
    const hooks = [];
    const effects = [];
    const loadedFamilies = new Set();
    const loads = [];
    const nextHook = () => (hooks[cursor++] ??= {});
    function updateDependencies(slot, dependencies) {
        const previous = slot.dependencies;
        slot.dependencies = dependencies;
        return (
            !previous ||
            previous.length !== dependencies.length ||
            !previous.every((value, index) => Object.is(value, dependencies[index]))
        );
    }
    const runtime = load(coreFile, {
        globals: { window: {} },
        mocks: {
            react: {
                ...React,
                useMemo(create, dependencies) {
                    const slot = nextHook();
                    if (updateDependencies(slot, dependencies)) slot.value = create();
                    return slot.value;
                },
                useState(initial) {
                    const slot = nextHook();
                    if (!('value' in slot)) slot.value = typeof initial === 'function' ? initial() : initial;
                    return [slot.value, (value) => (slot.value = value)];
                },
                useEffect(effect, dependencies) {
                    const slot = nextHook();
                    if (!updateDependencies(slot, dependencies)) return;
                    effects.push(() => {
                        slot.cleanup?.();
                        slot.cleanup = effect();
                    });
                },
            },
            'expo-font': {
                isLoaded: (family) => loadedFamilies.has(family),
                loadAsync(definitions) {
                    const families = Array.from(definitions, ({ fontFamily }) => fontFamily);
                    return {
                        then(resolve) {
                            loads.push({
                                families,
                                finish() {
                                    for (const family of families) loadedFamilies.add(family);
                                    resolve();
                                },
                            });
                        },
                    };
                },
            },
        },
    });
    function update(props) {
        cursor = 0;
        const tree = runtime.MobileDesignProvider({ ...props, children: probeNode });
        for (const effect of effects.splice(0)) effect();
        const provider = tree.props.children;
        assert.equal(provider.type, PaperProvider);
        assert.equal(provider.props.children.props.children, probeNode);
        return provider.props;
    }
    const custom = { fontFamily: 'Inter', settings: { icon: customIconRenderer } };
    assert.equal(update(custom).theme.fonts.bodyLarge.fontFamily, 'Inter');
    assert.equal(loads.length, 0);
    const pending = update({});
    assert.equal(pending.theme.fonts.bodyLarge.fontFamily, 'Inter');
    assert.equal(pending.settings.icon, customIconRenderer);
    assert.deepEqual(loads.map(({ families }) => families), [[mobileDesignRobotoFont.fontFamily, mobileDesignSymbolsFont.fontFamily]]);
    loads[0].finish();
    const ready = update({});
    assert.equal(ready.theme.fonts.bodyLarge.fontFamily, 'Roboto');
    assert.equal(ready.settings.icon, defaultIconRenderer);
    assert.equal(loads.length, 1);
});
test('provider on/off/auto changes remain visible through NativeModal and Portal', () => {
    colorScheme = 'light';
    osReduced = true;
    context.current = false;
    const children = jsx(NativeModal, { visible: true, children: jsx(motion.Portal, { children: probeNode }) });
    assert.equal(render(core.MobileDesignProvider({ children, reduceMotion: 'auto' })).reduced, true);
    assert.equal(render(core.MobileDesignProvider({ children, reduceMotion: 'off' })).reduced, false);
    assert.equal(render(core.MobileDesignProvider({ children, reduceMotion: 'on' })).reduced, true);
    osReduced = false;
    assert.equal(render(core.MobileDesignProvider({ children, reduceMotion: 'auto' })).reduced, false);
    assert.equal(
        render(core.MobileDesignProvider({ children, reduceMotion: 'off', theme: { animation: { scale: 0 } } })).reduced,
        true,
        'a zero animation scale also disables component motion'
    );
});

const windowProbe = () => ({
    reduced: React.useContext(context),
    scale: currentTheme.animation.scale,
    surface: currentTheme.colors.surface,
    nativeWindow,
    portalHostWindow,
    gestureWindow,
});
for (const [inherited, scale] of [
    [true, 1],
    [false, 0],
    [false, 1],
])
    test(`NativeModal restores theme/reduction and owns gesture/Portal window (${inherited}/${scale})`, () => {
        currentTheme = { ...dark, animation: { scale } };
        context.current = inherited;
        const result = render(jsx(NativeModal, { visible: true, children: jsx(motion.Portal, { children: jsx(windowProbe, {}) }) }));
        assert.equal(result.surface, dark.colors.surface);
        assert.equal(result.scale, scale);
        assert.equal(result.reduced, inherited || scale === 0);
        assert.notEqual(result.nativeWindow, 'root');
        assert.equal(result.portalHostWindow, result.nativeWindow, 'portal belongs to the visible native window');
        assert.equal(result.gestureWindow, result.nativeWindow, 'gestures belong to the native window');
        assert.equal(nativeWindow, 'root');
        assert.equal(portalHostWindow, 'root');
        assert.equal(gestureWindow, 'root');
    });
test('nested native dialogs target the innermost portal/gesture window', () => {
    currentTheme = dark;
    context.current = true;
    const before = windowRevision;
    const result = render(
        jsx(NativeModal, {
            visible: true,
            children: jsx(NativeModal, { visible: true, children: jsx(motion.Portal, { children: jsx(windowProbe, {}) }) }),
        })
    );
    assert.equal(windowRevision, before + 2);
    assert.equal(result.nativeWindow, `modal-${before + 2}`);
    assert.equal(result.portalHostWindow, result.nativeWindow);
    assert.equal(result.gestureWindow, result.nativeWindow);
    assert.equal(result.reduced, true);
});
test('NativeModal forwards native close/visibility props without substituting callbacks', () => {
    const onRequestClose = () => {};
    const node = NativeModal({
        visible: true,
        transparent: true,
        animationType: 'none',
        onRequestClose,
        testID: 'window',
        children: probeNode,
    });
    assert.equal(node.type, RNModal);
    assert.equal(node.props.visible, true);
    assert.equal(node.props.transparent, true);
    assert.equal(node.props.animationType, 'none');
    assert.equal(node.props.onRequestClose, onRequestClose);
    assert.equal(node.props.testID, 'window');
});

// Resolve runtime symbols, not merely strings mentioned in a barrel. No native module executes.
const manifestCache = new Map();
function bindingNames(name) {
    if (ts.isIdentifier(name)) return [name.text];
    return name.elements.flatMap((element) => (ts.isBindingElement(element) ? bindingNames(element.name) : []));
}
function manifest(file) {
    if (manifestCache.has(file)) return manifestCache.get(file);
    const out = new Map();
    manifestCache.set(file, out);
    const tree = source(file);
    const declarations = new Map();
    const imports = new Map();
    const record = (name) => ({ kind: 'declaration', file, binding: name });
    for (const statement of tree.statements) {
        if (ts.isImportDeclaration(statement) && statement.importClause && !statement.importClause.isTypeOnly) {
            const target = statement.moduleSpecifier.text;
            const clause = statement.importClause;
            if (clause.name) imports.set(clause.name.text, { request: target, binding: 'default' });
            if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings))
                imports.set(clause.namedBindings.name.text, { request: target, namespace: true });
            if (clause.namedBindings && ts.isNamedImports(clause.namedBindings))
                for (const entry of clause.namedBindings.elements)
                    if (!entry.isTypeOnly)
                        imports.set(entry.name.text, { request: target, binding: entry.propertyName?.text ?? entry.name.text });
        }
        if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) && statement.name)
            declarations.set(statement.name.text, statement);
        if (ts.isVariableStatement(statement))
            for (const declaration of statement.declarationList.declarations)
                for (const name of bindingNames(declaration.name)) declarations.set(name, declaration);
    }
    const binding = (name) => {
        if (imports.has(name)) {
            const input = imports.get(name);
            const targetFile = resolveModule(file, input.request);
            if (input.namespace) return { kind: 'namespace', file: targetFile };
            const value = manifest(targetFile).get(input.binding);
            assert.ok(value, `${file}: import ${input.binding} exists in ${input.request}`);
            return value;
        }
        assert.ok(declarations.has(name), `${file}: runtime declaration ${name} exists`);
        return record(name);
    };
    for (const statement of tree.statements) {
        if (ts.isExportDeclaration(statement)) {
            if (statement.isTypeOnly) continue;
            const target = statement.moduleSpecifier ? manifest(resolveModule(file, statement.moduleSpecifier.text)) : undefined;
            if (!statement.exportClause) {
                for (const [key, value] of target) if (key !== 'default') out.set(key, value);
            } else if (ts.isNamedExports(statement.exportClause))
                for (const entry of statement.exportClause.elements) {
                    if (entry.isTypeOnly) continue;
                    const original = entry.propertyName?.text ?? entry.name.text;
                    const value = target ? target.get(original) : binding(original);
                    assert.ok(
                        value,
                        `${file}: export ${original} from ${statement.moduleSpecifier?.text ?? 'local'} resolves to an actual runtime symbol`
                    );
                    out.set(entry.name.text, value);
                }
        }
        if (ts.isExportAssignment(statement))
            out.set('default', ts.isIdentifier(statement.expression) ? binding(statement.expression.text) : record('default'));
        const exported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
        if (!exported) continue;
        if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) {
            if (statement.name) out.set(statement.name.text, record(statement.name.text));
            if (statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword))
                out.set('default', record(statement.name?.text ?? 'default'));
        }
        if (ts.isVariableStatement(statement))
            for (const declaration of statement.declarationList.declarations)
                for (const name of bindingNames(declaration.name)) out.set(name, record(name));
    }
    return out;
}
function member(value, name) {
    if (value.kind === 'namespace') return manifest(value.file).get(name);
    const tree = source(value.file);
    for (const statement of tree.statements) {
        if (ts.isVariableStatement(statement))
            for (const declaration of statement.declarationList.declarations) {
                if (!ts.isIdentifier(declaration.name) || declaration.name.text !== value.binding || !declaration.initializer) continue;
                const init = declaration.initializer;
                const object = ts.isObjectLiteralExpression(init)
                    ? init
                    : ts.isCallExpression(init) && init.expression.getText(tree) === 'Object.assign'
                      ? init.arguments.find(ts.isObjectLiteralExpression)
                      : undefined;
                if (object?.properties.some((property) => property.name?.getText(tree).replaceAll("'", '').replaceAll('"', '') === name))
                    return { kind: 'member', file: value.file, binding: `${value.binding}.${name}` };
            }
        if (ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression)) {
            if (statement.expression.left.getText(tree) === `${value.binding}.${name}`)
                return { kind: 'member', file: value.file, binding: `${value.binding}.${name}` };
        }
    }
}
const ids = [
    'button-groups',
    'buttons',
    'extended-fab',
    'fab-menu',
    'floating-action-button',
    'icon-buttons',
    'segmented-buttons',
    'split-button',
    'date-pickers',
    'time-pickers',
    'loading-indicator',
    'progress-indicators',
    'navigation-bar',
    'navigation-drawer',
    'navigation-rail',
    'bottom-sheets',
    'side-sheets',
    'app-bars',
    'badges',
    'cards',
    'carousel',
    'checkbox',
    'chips',
    'dialogs',
    'divider',
    'lists',
    'menus',
    'radio-button',
    'search',
    'sliders',
    'snackbar',
    'switch',
    'tabs',
    'text-fields',
    'toolbars',
    'tooltips',
];
test('catalogue preserves the 36 Material 3 families and lists package extensions separately', () => {
    const entries = catalogue.mobileDesignCatalog;
    const extensions = Array.from(entries).filter((entry) => entry.group === 'extensions');
    const materialEntries = Array.from(entries).filter((entry) => entry.group !== 'extensions');
    assert.deepEqual(materialEntries.map((entry) => entry.id).sort(), ids.slice().sort());
    assert.deepEqual(
        extensions.map((entry) => entry.id),
        ['select', 'autocomplete']
    );
    assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
    for (const entry of entries) {
        assert.ok(
            entry.title && (entry.variants.length || entry.configurations?.length) && entry.exports.length && entry.notes.length,
            entry.id
        );
        assert.equal(entry.reference, entry.group === 'extensions' ? undefined : `https://m3.material.io/components/${entry.id}/overview`);
        assert.ok(['actions', 'communication', 'containment', 'navigation', 'selection', 'input'].includes(entry.category));
        assert.ok(['paper', 'paper-composition', 'mobile-design'].includes(entry.implementation));
        assert.equal(catalogue.getMobileDesignComponent(entry.id), entry);
    }
    assert.equal(catalogue.getMobileDesignComponent('missing'), undefined);
});
test('public component imports resolve through the two platform entry points', () => {
    const barrel = path.join(packageRoot, 'src/index.ts');
    assert.equal(require.resolve('mobile-design/react-native'), barrel);
    assert.equal(require.resolve('mobile-design/react-native-web'), barrel);
    assert.throws(() => require.resolve('mobile-design'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
    assert.throws(() => require.resolve('mobile-design/web'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
});
test('every catalogue export resolves through the real runtime barrel and namespace members', () => {
    const exports = manifest(path.join(packageRoot, 'src/index.ts'));
    for (const entry of catalogue.mobileDesignCatalog)
        for (const name of entry.exports) {
            const [first, ...rest] = name.split('.');
            let value = exports.get(first);
            assert.ok(value, `${entry.id}: public export ${first} exists`);
            for (const property of rest) {
                value = member(value, property);
                assert.ok(value, `${entry.id}: namespace ${name} exists`);
            }
        }
    assert.equal(exports.get('Portal').file, path.join(packageRoot, 'src/paper-motion.tsx'));
    assert.equal(exports.get('Menu').file, path.join(packageRoot, 'src/components/menu.tsx'));
    assert.equal(exports.get('TextField').file, path.join(packageRoot, 'src/components/text-field.tsx'));
    for (const removed of ['Provider', 'PaperProvider', 'TextInput']) assert.equal(exports.has(removed), false, removed);
    for (const name of Object.keys(requireShared('@mobile-design/tokens'))) {
        assert.equal(exports.has(name), false, `${name} is consumed directly from @mobile-design/tokens`);
    }
    assert.equal(exports.get('Button').file, path.join(packageRoot, 'src/components/button.tsx'));
});
test('private Paper context dependency is exact-version pinned and targets a real exported object', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
    const installed = JSON.parse(fs.readFileSync(path.join(paperRoot, 'package.json'), 'utf8'));
    assert.equal(pkg.peerDependencies['react-native-paper'], installed.version);
    assert.equal(installed.version, '6.0.0-alpha.0');
    const target = path.join(paperRoot, 'lib/module/theme/accessibility/ReduceMotionContext.js');
    assert.ok(fs.existsSync(target), 'published module path exists');
    const code = fs.readFileSync(target, 'utf8');
    assert.match(code, /export const ReduceMotionContext/);
    assert.match(code, /createContext\(false\)/);
});
test('private context path targets the same tree as the selected public Paper entry', () => {
    // A src entry paired with a lib deep import would create two different Context objects.
    const privatePath = path.join(paperRoot, 'lib/module/theme/accessibility/ReduceMotionContext.js');
    const provider = path.join(runtimePaperDirectory, `core/PaperProvider${runtimeExtension}`);
    const sourceText = fs.readFileSync(provider, 'utf8');
    assert.match(sourceText, /from ['"]\.\.\/theme\/accessibility\/ReduceMotionContext['"]/);
    const providerContext = path.resolve(
        path.dirname(provider),
        `../theme/accessibility/ReduceMotionContext${runtimeExtension === '.tsx' ? '.tsx' : '.js'}`
    );
    assert.equal(
        fs.realpathSync(privatePath),
        fs.realpathSync(providerContext),
        'bridge and provider must import one physical Context module'
    );
});

if (failures.length) {
    for (const failure of failures) console.error(`FAIL: ${failure.name}\n${failure.error.stack}`);
    console.error(`${failures.length}/${tests} foundation cases failed.`);
    process.exitCode = 1;
} else
    console.log(
        `OK: ${tests} Mobile Design foundation cases; real Paper tokens, immutable theme merges, 36 families/exports and reduced-motion Portal/provider/NativeModal-window contracts.`
    );
