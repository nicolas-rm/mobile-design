/** Real TSX contracts for reference completion and icons.
 * Explicit native/Paper/animation boundaries: not a renderer, FPS or pixel comparison.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const requireShared = require('./require-mobile-design-shared.cjs');
const root = path.resolve(__dirname, '..');
let owner,
    cases = 0,
    symbolsReady = false;
const rnQueue = [],
    running = new Set();
const jsx = (type, props) => ({ type, props: props ?? {} });
const equal = (a, b) => a?.length === b?.length && a.every((value, index) => Object.is(value, b[index]));
const React = {
    useState(initial) {
        const target = owner,
            index = target.cursor++;
        const slot = (target.hooks[index] ??= { value: typeof initial === 'function' ? initial() : initial });
        return [
            slot.value,
            (value) => {
                const next = typeof value === 'function' ? value(slot.value) : value;
                if (!Object.is(next, slot.value)) {
                    slot.value = next;
                    target.dirty = true;
                }
            },
        ];
    },
    useRef(initial) {
        const index = owner.cursor++;
        return (owner.hooks[index] ??= { current: initial });
    },
    useCallback(fn, deps) {
        const index = owner.cursor++,
            old = owner.hooks[index];
        if (old && equal(old.deps, deps)) return old.fn;
        owner.hooks[index] = { fn, deps };
        return fn;
    },
    useEffect(fn, deps) {
        const index = owner.cursor++,
            old = owner.hooks[index];
        if (!old || !equal(old.deps, deps)) {
            owner.effects.push(() => {
                old?.cleanup?.();
                const cleanup = fn();
                owner.hooks[index] = { deps, cleanup };
            });
        }
    },
};
const theme = { colors: { primary: '#6750a4', onSurface: '#1d1b20' }, animation: { scale: 1 }, motion: { duration: { long2: 500 } } };
const shared = (initial) => ({
    current: initial,
    animation: null,
    get() {
        return this.current;
    },
    set(value) {
        if (value && typeof value === 'object' && value.kind) {
            this.animation = value;
            running.add(this);
        } else {
            this.current = value;
            this.animation = null;
            running.delete(this);
        }
    },
});
const reanimated = {
    __esModule: true,
    default: { createAnimatedComponent: (x) => x, View: 'AnimatedView' },
    ReduceMotion: { Never: 'never' },
    Easing: { linear: (value) => value },
    useSharedValue(initial) {
        const index = owner.cursor++;
        return (owner.hooks[index] ??= shared(initial));
    },
    useAnimatedProps: (fn) => ({ read: fn }),
    useAnimatedStyle: (fn) => ({ read: fn }),
    cancelAnimation(value) {
        value.animation = null;
        running.delete(value);
    },
    withTiming: (to, config, callback) => ({ kind: 'timing', to, config, callback }),
    withSequence: (...steps) => ({ kind: 'sequence', steps }),
};
const Dialog = Object.assign(function Dialog() {}, {
    Icon: 'DialogIcon',
    Title: 'DialogTitle',
    Content: 'DialogContent',
    ScrollArea: 'DialogScrollArea',
    Actions: 'DialogActions',
});
const mobile = {
    Avatar: { Text: 'Avatar' },
    Button: 'Button',
    Dialog,
    FullScreenDialog: 'FullScreenDialog',
    List: { Item: 'ListItem', Group: 'ListGroup' },
    Menu: Object.assign(function Menu() {}, { Item: 'MenuItem' }),
    RadioButton: Object.assign(function Radio() {}, { Group: 'RadioGroup', Item: 'RadioItem' }),
    Text: 'Text',
    TextField: 'TextField',
};
const mocks = {
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': { View: 'View', ScrollView: 'ScrollView', Text: 'NativeText', Platform: { OS: 'ios' } },
    'expo-font': { isLoaded: () => symbolsReady },
    'react-native-paper': { Text: 'Text' },
    'react-native-paper/lib/module/components/MaterialCommunityIcon': { __esModule: true, default: 'PaperFallback' },
    'react-native-svg': { __esModule: true, default: 'Svg', Path: 'Path' },
    'react-native-reanimated': reanimated,
    'react-native-worklets': { scheduleOnRN: (fn, ...args) => rnQueue.push(() => fn(...args)) },
    'mobile-design/react-native': mobile,
};
const cache = new Map();
function load(relative) {
    const file = path.resolve(root, relative);
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true,
        },
    }).outputText;
    vm.runInNewContext(
        code,
        {
            exports,
            require(request) {
                if (request in mocks) return mocks[request];
                if (request.startsWith('@mobile-design/')) return requireShared(request);
                if (request === '../core') return { useMobileTheme: () => theme };
                if (request === './progress-indicator') return { ProgressIndicator: 'ProgressIndicator' };
                assert.ok(request.startsWith('.'), `Explicit boundary required: ${request}`);
                const base = path.resolve(path.dirname(file), request);
                return load([base + '.tsx', base + '.ts'].find(fs.existsSync));
            },
        },
        { filename: file }
    );
    return exports;
}
function render(fn, props) {
    const target = { hooks: [], effects: [], cursor: 0, dirty: true, props, disposed: false };
    target.update = (next) => {
        target.props = { ...target.props, ...next };
        target.dirty = true;
        return target.flush();
    };
    target.flush = () => {
        let pass = 0;
        while (target.dirty) {
            assert.ok(pass++ < 12);
            target.dirty = false;
            target.cursor = 0;
            target.effects = [];
            owner = target;
            target.tree = fn(target.props);
            target.effects.forEach((effect) => effect());
        }
        return target.tree;
    };
    target.dispose = () => {
        target.disposed = true;
        target.hooks.forEach((slot) => slot?.cleanup?.());
    };
    target.flush();
    return target;
}
function nodes(node, predicate, output = []) {
    if (Array.isArray(node)) node.forEach((child) => nodes(child, predicate, output));
    else if (node && typeof node === 'object') {
        if (predicate(node)) output.push(node);
        nodes(node.props?.children, predicate, output);
    }
    return output;
}
function id(view, value) {
    return nodes(view.flush(), (node) => node.props.testID === value)[0];
}
function flushRN() {
    rnQueue.splice(0).forEach((fn) => fn());
}
function completeAnimationStage() {
    for (const value of [...running]) {
        const animation = value.animation;
        if (!animation) continue;
        const timing = animation.kind === 'sequence' ? animation.steps.shift() : animation;
        value.current = timing.to;
        timing.callback?.(true);
        if (animation.kind !== 'sequence' || !animation.steps.length) {
            value.animation = null;
            running.delete(value);
        }
    }
}
function test(name, fn) {
    fn();
    cases++;
    console.log('PASS ' + name);
}
const status = load('packages/mobile-design/src/components/circular-progress-status.tsx');
const icons = requireShared.loadMaterialIcons(mocks);
const { materialSymbolPaths: paths } = require('../packages/mobile-design/src/material-symbol-paths.ts');

test('reference ring retracts in a fixed footprint before a rounded check is drawn', () => {
    for (const size of [24, 48, 96])
        for (let time = 0; time <= 1300; time += 10) {
            const frame = status.progressStatusGeometry(time, 500, 500, 200, size, 4);
            assert.ok(!/NaN|Infinity/.test(frame.ring));
            assert.ok(frame.check >= 0 && frame.check <= 1);
            if (time < 1000) assert.equal(frame.check, 0);
            if (time >= 1000) assert.equal(frame.ring, '');
        }
});
test('success caption and completion follow the two actual UI animation stages', () => {
    let completed = 0;
    const view = render(status.CircularProgressStatus, { status: 'progress', progress: 0.4, onSuccessAnimationEnd: () => completed++ });
    view.update({ status: 'success', progress: 1 });
    assert.equal(view.tree.props.accessibilityLabel, 'Processing payment…');
    completeAnimationStage();
    flushRN();
    view.flush();
    assert.equal(view.tree.props.accessibilityLabel, 'Payment complete');
    assert.equal(completed, 0);
    completeAnimationStage();
    flushRN();
    view.flush();
    assert.equal(completed, 1);
    view.dispose();
});
test('reset discards a success notification that is already waiting on RN', () => {
    let completed = 0;
    const view = render(status.CircularProgressStatus, { status: 'progress', progress: 0.4, onSuccessAnimationEnd: () => completed++ });
    view.update({ status: 'success', progress: 1 });
    completeAnimationStage();
    completeAnimationStage();
    view.update({ status: 'progress', progress: 0 });
    flushRN();
    view.flush();
    assert.equal(completed, 0);
    assert.equal(view.tree.props.accessibilityState.busy, true);
    assert.equal(view.tree.props.accessibilityLabel, 'Processing payment…');
    view.dispose();
});
test('unmount cancels the clock and rejects an already queued completion', () => {
    let completed = 0;
    const view = render(status.CircularProgressStatus, { status: 'success', progress: 1, onSuccessAnimationEnd: () => completed++ });
    completeAnimationStage();
    completeAnimationStage();
    view.dispose();
    flushRN();
    assert.equal(completed, 0);
});
test('reduced motion shows the result immediately and re-enabling motion does not replay it', () => {
    let completed = 0;
    theme.animation.scale = 0;
    const view = render(status.CircularProgressStatus, { status: 'success', onSuccessAnimationEnd: () => completed++ });
    assert.equal(view.tree.props.accessibilityLabel, 'Payment complete');
    assert.equal(completed, 1);
    theme.animation.scale = 1;
    view.update({});
    assert.equal(running.size, 0);
    assert.equal(completed, 1);
    view.dispose();
});
test('web completion exposes one named task and clears numeric progress on success', () => {
    mocks['react-native'].Platform.OS = 'web';
    try {
        const view = render(status.CircularProgressStatus, { status: 'progress', progress: 0.4, animated: false });
        assert.equal(view.tree.props.role, 'progressbar');
        assert.equal(view.tree.props['aria-valuenow'], 40);
        assert.equal(view.tree.props['aria-busy'], true);
        assert.equal(view.tree.props.children[0].props['aria-hidden'], true, 'animated graphic layers are decorative');
        assert.equal(view.tree.props.children[1].props['aria-hidden'], true, 'caption is represented by the named task');
        view.update({ progress: undefined });
        assert.equal(view.tree.props['aria-valuenow'], undefined, 'unknown work never invents a percentage');
        assert.equal(view.tree.props['aria-valuetext'], 'En curso');
        view.update({ status: 'success', progress: 1 });
        assert.equal(view.tree.props.role, 'status');
        assert.equal(view.tree.props['aria-valuenow'], undefined);
        assert.equal(view.tree.props['aria-busy'], false);
        assert.equal(view.tree.props.accessibilityLabel, 'Payment complete');
        view.dispose();
    } finally {
        mocks['react-native'].Platform.OS = 'ios';
    }
});
test('symbols use actual pinned SVG data, preserve fill variants and mirror on requested RTL', () => {
    const search = icons.MaterialSymbol({ name: 'magnify', color: '#6750a4', size: 24 });
    assert.equal(search.props.viewBox, paths.search.viewBox);
    assert.equal(nodes(search, (node) => node.type === 'Path')[0].props.d, paths.search.paths[0]);
    const outline = icons.MaterialSymbol({ name: 'home-outline' }),
        filled = icons.MaterialSymbol({ name: 'home' });
    assert.notEqual(nodes(outline, (n) => n.type === 'Path')[0].props.d, nodes(filled, (n) => n.type === 'Path')[0].props.d);
    const rtl = icons.MaterialSymbol({ name: 'arrow-left', direction: 'rtl' });
    assert.equal(rtl.props.style.transform[0].scaleX, -1);
    assert.equal(icons.MaterialSymbol({ name: 'consumer-custom-icon' }).props.name, 'consumer-custom-icon');
});
test('loaded base font covers symbols beyond the bootstrap SVGs and applies all four native axes', () => {
    symbolsReady = true;
    const { materialSymbolCodepoints: map } = require('../packages/mobile-design/src/material-symbol-codepoints.ts');
    const name = Object.keys(map).find((name) => !(name in paths));
    const symbol = icons.MaterialSymbol({ name, size: 48, filled: true, weight: 700, grade: 200, opticalSize: 48, direction: 'rtl' });
    const glyph = nodes(symbol, (node) => node.type === 'NativeText')[0];
    assert.equal(glyph.props.children, String.fromCodePoint(map[name]));
    assert.deepEqual(JSON.parse(JSON.stringify(glyph.props.style.fontVariationSettings)), { FILL: 1, wght: 700, GRAD: 200, opsz: 48 });
    assert.equal(symbol.props.style.width, 48);
    assert.equal(symbol.props.style.transform[0].scaleX, -1);
    assert.equal(glyph.props.allowFontScaling, false);
    const filled = icons.MaterialSymbol({ name: 'home' }),
        outline = icons.MaterialSymbol({ name: 'home', filled: false });
    assert.equal(nodes(filled, (node) => node.type === 'NativeText')[0].props.style.fontVariationSettings.FILL, 1);
    assert.equal(nodes(outline, (node) => node.type === 'NativeText')[0].props.style.fontVariationSettings.FILL, 0);
    const bounded = nodes(
        icons.MaterialSymbol({ name: 'search', weight: 900, grade: -900, opticalSize: 99 }),
        (node) => node.type === 'NativeText'
    )[0];
    assert.equal(bounded.props.style.fontVariationSettings.wght, 700);
    assert.equal(bounded.props.style.fontVariationSettings.GRAD, -50);
    assert.equal(bounded.props.style.fontVariationSettings.opsz, 48);
    symbolsReady = false;
});
test('full icons reserve space for known glyphs without SVG while loading their own font', () => {
    let requested;
    const full = requireShared.loadMaterialIcons({
        ...mocks,
        'expo-font': {
            isLoaded: () => symbolsReady,
            useFonts(fonts) {
                requested = fonts;
                return [symbolsReady, null];
            },
        },
    }, 'full');
    const props = { name: 'bakery_dining', size: 32, color: '#6750a4', testID: 'bakery-symbol' };
    assert.equal(icons.renderIcon(props).type, 'PaperFallback');
    const pending = full.renderIcon(props);
    assert.equal(pending.type, 'View');
    assert.equal(pending.props.style.width, 32);
    assert.equal(pending.props.style.height, 32);
    assert.equal(pending.props.accessible, false);
    assert.equal(pending.props.testID, 'bakery-symbol');
    assert.equal(requested?.[0].fontFamily, 'MobileDesignMaterialSymbolsRoundedFull');
    assert.equal(full.renderIcon({ name: 'magnify' }).type, 'Svg');
    assert.equal(full.renderIcon({ name: 'consumer-custom-icon' }).type, 'PaperFallback');
    symbolsReady = true;
    try {
        assert.equal(icons.renderIcon(props).type, 'PaperFallback');
        const glyph = nodes(full.renderIcon(props), (node) => node.type === 'NativeText')[0];
        assert.equal(glyph.props.children.codePointAt(0), 59987);
        assert.equal(glyph.props.style.fontFamily, 'MobileDesignMaterialSymbolsRoundedFull');
    } finally {
        symbolsReady = false;
    }
});
test('iOS symbols preserve the font natural line box inside the fixed icon canvas', () => {
    // Read the bundled SFNT metrics independently of the renderer's constants.
    const binary = fs.readFileSync(path.join(root, 'packages/mobile-design/assets/fonts/MaterialSymbolsRounded.ttf'));
    const tables = {};
    for (let index = 0; index < binary.readUInt16BE(4); index++) {
        const at = 12 + index * 16;
        tables[binary.toString('ascii', at, at + 4)] = binary.readUInt32BE(at + 8);
    }
    const em = binary.readUInt16BE(tables.head + 18),
        ascent = binary.readInt16BE(tables.hhea + 4),
        descent = binary.readInt16BE(tables.hhea + 6);
    symbolsReady = true;
    for (const size of [17.5, 20, 24, 32, 40, 48])
        for (const name of ['arrow_back', 'close', 'search', 'home'])
            for (const filled of [false, true]) {
                const view = icons.MaterialSymbol({ name, size, filled });
                const text = nodes(view, (node) => node.type === 'NativeText')[0].props.style;
                assert.equal(view.props.style.width, size);
                assert.equal(view.props.style.height, size);
                assert.equal(text.fontSize, size);
                assert.equal(text.width, size);
                assert.ok(
                    Math.abs(text.height - (size * (ascent - descent)) / em) < 1e-10,
                    'iOS must not compress the original font line box'
                );
                assert.equal(text.lineHeight, text.height);
                assert.equal(text.flexShrink, 0);
                const baseline = (size - text.height) / 2 + (size * ascent) / em;
                assert.ok(Math.abs(baseline - size) < 1e-10, 'original y0..960 em canvas retains its baseline at the icon bottom');
            }
    mocks['react-native'].Platform.OS = 'android';
    const android = icons.MaterialSymbol({ name: 'arrow_back', size: 24 });
    const text = nodes(android, (node) => node.type === 'NativeText')[0].props.style;
    assert.equal(text.height, 24);
    assert.equal(text.lineHeight, 24);
    assert.equal(text.includeFontPadding, false);
    mocks['react-native'].Platform.OS = 'ios';
    symbolsReady = false;
});
console.log(`OK: ${cases} reference completion and icon contracts with explicit native boundaries.`);
