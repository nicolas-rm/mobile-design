/**
 * Official numeric/semantic fixtures against the real action components. React,
 * layout and animation clocks are bounded doubles: these assertions verify props,
 * transitions, cleanup and callbacks, not Yoga, native focus, gestures or FPS.
 * The short-tap regression defers RN shared writes and scheduleOnUI jobs until
 * flushUI(); within a UI transaction shared writes remain synchronous.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const requireShared = require('./require-mobile-design-shared.cjs');
const root = path.resolve(__dirname, '..');
let current;
let checks = 0;
let direction = 'ltr';
let platform = 'ios';
let window = { width: 390, height: 844, fontScale: 1 };
const backHandlers = new Set();
const requests = [];
const rnJobs = [];
const theme = {
    animation: { scale: 1 },
    colors: Object.fromEntries(
        [
            'primary',
            'onPrimary',
            'secondary',
            'onSecondary',
            'tertiary',
            'onTertiary',
            'primaryContainer',
            'onPrimaryContainer',
            'secondaryContainer',
            'onSecondaryContainer',
            'tertiaryContainer',
            'onTertiaryContainer',
            'surfaceContainer',
            'surfaceContainerLow',
            'onSurface',
            'onSurfaceVariant',
            'outlineVariant',
            'inverseSurface',
            'inverseOnSurface',
            'stateLayerPressed',
        ].map((role) => [role, role])
    ),
    shapes: { corner: { extraSmall: 4, small: 8, medium: 12, large: 16, largeIncreased: 20, extraLarge: 28 } },
    fonts: {
        labelLarge: { fontSize: 14, lineHeight: 20 },
        titleMedium: { fontSize: 16, lineHeight: 24 },
        titleLarge: { fontSize: 22, lineHeight: 28 },
        headlineSmall: { fontSize: 24, lineHeight: 32 },
        headlineLarge: { fontSize: 32, lineHeight: 40 },
    },
    motion: {
        spring: {
            fast: { spatial: { stiffness: 800, damping: 0.6 }, effects: { stiffness: 3800, damping: 1 } },
            default: { effects: { stiffness: 1600, damping: 1 } },
            slow: { effects: { stiffness: 800, damping: 1 } },
        },
    },
};
const hook = (make) => {
    const i = current.cursor++;
    return current.hooks[i] ?? (current.hooks[i] = make());
};
const depsEqual = (a, b) => a && b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
const React = {
    createContext(value) {
        return { current: value, Provider: 'ContextProvider' };
    },
    useRef(value) {
        return hook(() => ({ current: value }));
    },
    useCallback(fn) {
        return fn;
    },
    useState(initial) {
        const owner = current;
        const slot = hook(() => ({ value: typeof initial === 'function' ? initial() : initial }));
        return [
            slot.value,
            (value) => {
                value = typeof value === 'function' ? value(slot.value) : value;
                if (!Object.is(value, slot.value)) {
                    slot.value = value;
                    owner.dirty = true;
                }
            },
        ];
    },
    useEffect(fn, deps) {
        const slot = hook(() => ({}));
        if (!depsEqual(slot.deps, deps)) {
            slot.deps = deps;
            current.effects.push(() => {
                slot.cleanup?.();
                slot.cleanup = fn();
            });
        }
    },
    useLayoutEffect(fn, deps) {
        return React.useEffect(fn, deps);
    },
    useMemo(fn) {
        return fn();
    },
};
const reanimated = {
    View: 'AnimatedView',
    ScrollView: 'AnimatedScrollView',
    createAnimatedComponent: (component) => component,
    useAnimatedScrollHandler: (callback) => callback,
    ReduceMotion: { Never: 'never' },
    useSharedValue(value) {
        const owner = current;
        return hook(() => ({
            value,
            animation: undefined,
            get() {
                return this.value;
            },
            set(next) {
                const apply = () => {
                    if (next?.animation) {
                        this.animation = next;
                        this.value = next.to;
                    } else {
                        this.animation = undefined;
                        this.value = next;
                    }
                };
                if (owner.deferRNWrites && !owner.inUI) owner.uiWrites.push(apply);
                else apply();
            },
        }));
    },
    useAnimatedStyle: (compute) => ({ compute }),
    useAnimatedProps: (compute) => ({ compute }),
    useDerivedValue: (compute) => ({ get: compute }),
    useAnimatedReaction(compute, reaction) {
        const slot = hook(() => ({ previous: undefined }));
        current.reactions.push(() => {
            const value = compute();
            reaction(value, slot.previous);
            slot.previous = value;
        });
    },
    cancelAnimation(shared) {
        shared.cancellations = (shared.cancellations ?? 0) + 1;
        shared.animation = undefined;
    },
    withSpring(to, config) {
        assert.equal(config.reduceMotion, 'never', 'resolved provider preference wins over System');
        requests.push({ to, config });
        return { animation: true, to, config };
    },
};
reanimated.default = reanimated;
// The surface boundary keeps animated geometry inspectable in component tests;
// the real two-layer native adapter is executed separately below.
const jsx = (type, props, key) => ({
    type,
    props: type === 'Surface' && props.geometry ? { ...props, style: [props.style, props.geometry] } : props,
    key,
});
const paper = Object.fromEntries(['Icon', 'Surface', 'Text', 'ThemeProvider', 'TouchableRipple', 'IconButton'].map((name) => [name, name]));
paper.useTheme = () => theme;
paper.useLocale = () => ({ direction });
const Menu = Object.assign(function Menu() {}, { Item: 'MenuItem' });
const modules = {
    '@mobile-design/tokens': requireShared('@mobile-design/tokens'),
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
        View: 'View',
        ScrollView: 'ScrollView',
        Animated: { View: 'NativeAnimatedView' },
        PixelRatio: { get: () => 3 },
        useWindowDimensions: () => window,
        StyleSheet: {
            absoluteFill: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 },
            create: (x) => x,
            flatten: (styles) => style(styles),
        },
        Platform: {
            get OS() {
                return platform;
            },
        },
        BackHandler: {
            addEventListener(name, fn) {
                assert.equal(name, 'hardwareBackPress');
                backHandlers.add(fn);
                return { remove: () => backHandlers.delete(fn) };
            },
        },
    },
    'react-native-paper': paper,
    'react-native-reanimated': reanimated,
    'react-native-worklets': {
        scheduleOnRN(callback, ...args) {
            rnJobs.push(() => callback(...args));
        },
        scheduleOnUI(callback, ...args) {
            const owner = current;
            const invoke = () => {
                const previous = owner.inUI;
                owner.inUI = true;
                try {
                    callback(...args);
                } finally {
                    owner.inUI = previous;
                }
            };
            if (owner.deferRNWrites) owner.uiWrites.push(invoke);
            else invoke();
        },
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
    '../core': { useMobileTheme: () => theme },
    '../color': { withAlpha: (color, alpha) => `${color}@${alpha}` },
    './menu': { Menu },
    '../paper-motion-bridge': { PaperMotionBridge: 'PaperMotionBridge' },
    './progress-indicator': { ProgressIndicator: 'ProgressIndicator' },
};
function compileFile(file) {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        fileName: file,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(
        code,
        {
            exports,
            require: (name) => {
                assert.ok(modules[name], name);
                return modules[name];
            },
        },
        { filename: file }
    );
    return exports;
}
function compile(name) {
    return compileFile(path.join(root, 'packages/mobile-design/src/components', `${name}.tsx`));
}
modules['./action-surface'] = { AnimatedActionSurface: 'Surface' };
modules['../ripple'] = compileFile(path.join(root, 'packages/mobile-design/src/ripple.tsx'));
assert.equal(modules['../ripple'].TouchableRipple, paper.TouchableRipple, 'the native-ref adapter preserves the actual Paper component');
modules['./focus-order'] = compileFile(path.join(root, 'packages/mobile-design/src/components/focus-order.ts'));
modules['./press-scope'] = compileFile(path.join(root, 'packages/mobile-design/src/components/press-scope.ts'));
const buttonModule = compile('button');
modules['./button'] = buttonModule;
const { Button, ButtonForIcon } = buttonModule;
const iconModule = compile('icon-button');
const { IconButton } = iconModule;
modules['./icon-button'] = iconModule;
const { SearchIconButton } = compile('search-icon-button');
modules['./tooltip'] = { Tooltip: 'Tooltip' };
const { ButtonGroup } = compile('button-group');
const { SplitButton } = compile('split-button');
const { FAB, resolveFABMenuPath, fabMenuViewport } = compile('fab');
modules['react-native-svg'] = { default: 'Svg', Path: 'Path' };
modules['./selection-controls'] = compile('selection-controls');
const { SegmentedButtons } = compile('segmented-buttons');
const walk = (node) => (!node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)]);
const style = (styles) =>
    Array.isArray(styles) ? Object.assign({}, ...styles.map(style)) : styles?.compute ? styles.compute() : (styles ?? {});
const { AnimatedActionSurface } = compile('action-surface');
class Runner {
    constructor(component, props) {
        Object.assign(this, { component, props, hooks: [], uiWrites: [], deferRNWrites: false, inUI: false });
        this.render();
    }
    render(props = this.props) {
        this.props = props;
        let passes = 0;
        do {
            assert.ok(++passes < 20, 'render settles');
            current = this;
            this.cursor = 0;
            this.effects = [];
            this.reactions = [];
            this.dirty = false;
            this.tree = this.component(this.props);
            this.effects.forEach((effect) => effect());
            this.reactions.forEach((reaction) => reaction());
        } while (this.dirty);
        return this;
    }
    nodes(type) {
        return walk(this.tree).filter((node) => node.type === type);
    }
    flushUI() {
        current = this;
        for (const job of this.uiWrites.splice(0)) job();
        this.inUI = true;
        try {
            this.reactions.forEach((reaction) => reaction());
        } finally {
            this.inUI = false;
        }
        return this;
    }
    unmount() {
        this.hooks.forEach((slot) => slot.cleanup?.());
    }
}
const check = (fn) => {
    fn();
    checks++;
};
check(() => {
    theme.colors.shadow = '#000000';
    let radius = 20,
        width = 100;
    const geometry = { compute: () => ({ width, borderRadius: radius }) };
    const surface = new Runner(AnimatedActionSurface, { elevation: 3, style: { backgroundColor: 'primary', borderRadius: 20 }, geometry });
    const nativeLayers = surface.nodes('AnimatedView');
    assert.equal(nativeLayers.length, 2);
    for (const frame of [
        [20, 100],
        [8, 115],
        [20, 100],
    ]) {
        [radius, width] = frame;
        assert.ok(
            nativeLayers.every((node) => style(node.props.style).borderRadius === radius && style(node.props.style).width === width),
            'both shadow/fill layers update without a React rerender'
        );
        assert.ok(
            nativeLayers.every((node) => style(node.props.style).backgroundColor === 'primary'),
            'opaque native paint follows the morph and preserves an efficient shadow path'
        );
        assert.ok(
            nativeLayers.every((node) => style(node.props.style).overflow !== 'hidden'),
            'content clipping cannot crop either shadow'
        );
    }
    assert.equal(style(nativeLayers[0].props.style).shadowOffset.height, 4);
    assert.equal(style(nativeLayers[0].props.style).shadowRadius, 4, 'CSS blur8 means iOS sigma4');
    assert.equal(style(nativeLayers[0].props.style).shadowOpacity, 0.15);
    assert.equal(style(nativeLayers[1].props.style).shadowOffset.height, 1);
    assert.equal(style(nativeLayers[1].props.style).shadowRadius, 1.5, 'CSS blur3 means iOS sigma1.5');
    assert.equal(style(nativeLayers[1].props.style).shadowOpacity, 0.3);
});
for (const [level, android] of [
    [0, 0],
    [1, 1],
    [2, 3],
    [3, 6],
    [4, 8],
    [5, 12],
])
    check(() => {
        platform = 'android';
        const surface = new Runner(AnimatedActionSurface, { elevation: level, style: { backgroundColor: 'primary' } });
        assert.equal(surface.nodes('AnimatedView').length, 1);
        assert.equal(style(surface.tree.props.style).elevation, android);
        platform = 'ios';
    });
check(() => {
    platform = 'web';
    const surface = new Runner(AnimatedActionSurface, { elevation: 3, style: { backgroundColor: 'primary' } });
    const shadows = style(surface.tree.props.style).boxShadow;
    assert.equal(shadows.length, 2);
    assert.deepEqual(
        Array.from(shadows, (layer) => [layer.offsetY, layer.blurRadius]),
        [
            [4, 8],
            [1, 3],
        ]
    );
    platform = 'ios';
});
const buttonSizeCases = [
    ['extra-small', 32, 20, 12, 8],
    ['small', 40, 20, 12, 8],
    ['medium', 56, 24, 16, 12],
    ['large', 96, 32, 28, 16],
    ['extra-large', 136, 40, 28, 16],
];
for (const icon of ['arrow_back', 'close', 'history'])
    check(() => {
        let actions = 0;
        const search = new Runner(SearchIconButton, { icon, selected: false, onPress: () => actions++ });
        const wrapper = new Runner(search.tree.type, search.tree.props);
        const runner = new Runner(wrapper.tree.type, wrapper.tree.props);
        const touch = () => runner.nodes('TouchableRipple')[0];
        assert.equal(style(touch().props.style).borderRadius, 20);
        touch().props.onPressIn({});
        runner.render();
        assert.equal(style(touch().props.style).borderRadius, 20, `${icon} stays circular while held`);
        assert.notEqual(touch().props.rippleColor, 'transparent', 'the round configuration preserves visible press feedback');
        touch().props.onPress({});
        assert.equal(actions, 1);
        touch().props.onPressOut({});
        runner.render({ ...runner.props, selected: true });
        assert.equal(style(touch().props.style).borderRadius, 20, 'selection changes state without squaring the search action');
        assert.equal(touch().props.accessibilityState.selected, true);
        runner.unmount();
        wrapper.unmount();
        search.unmount();
    });
check(() => {
    const runner = new Runner(ButtonForIcon, { icon: 'play_arrow', iconOnly: true, rippleColor: 'transparent', onPress() {} });
    const touch = () => runner.nodes('TouchableRipple')[0];
    assert.equal(touch().props.rippleColor, 'transparent', 'a caller can override the native ripple color');
    touch().props.onPressIn({});
    runner.render();
    assert.equal(style(touch().props.style).borderRadius, 8, 'the original button keeps its pressed morph');
    assert.equal(touch().props.rippleColor, 'transparent');
    touch().props.onPressOut({});
    runner.render({ ...runner.props, rippleColor: undefined });
    assert.equal(touch().props.rippleColor, 'onPrimary@0.1', 'omitting the override restores the normal token-derived press');
    runner.unmount();
});
for (const block of ['disabled', 'loading'])
    check(() => {
        const releases = [];
        let actions = 0;
        const runner = new Runner(Button, {
            onPress: () => actions++,
            onPressOut: (event) => {
                if (event.currentTarget === 20) {
                    assert.equal(
                        typeof event.preventDefault,
                        'function',
                        'the cancellation snapshot retains SyntheticEvent prototype methods'
                    );
                    event.preventDefault();
                    assert.equal(event.prevented, true);
                }
                releases.push([event.currentTarget, event.nativeEvent.target]);
            },
        });
        const touch = () => runner.nodes('TouchableRipple')[0];
        const oldHost = touch().props;
        let dispatchTarget = 20;
        const nativeEvent = { target: 20 };
        // RN 0.88 exposes these fields through inherited getter-only accessors.
        // The release snapshot must survive both that shape and later dispatch
        // cleanup without writing through those accessors or mutating the event.
        const event = Object.create({
            get currentTarget() {
                return dispatchTarget;
            },
            get nativeEvent() {
                return nativeEvent;
            },
            preventDefault() {
                this.prevented = true;
            },
        });
        oldHost.onPressIn(event);
        // SyntheticEvent fields can be cleared after dispatch; cancellation needs
        // the original target, not this mutable event object or a targetless Out.
        dispatchTarget = null;
        event.nativeEvent.target = null;
        runner.render({ ...runner.props, [block]: true });
        assert.deepEqual(releases, [[20, 20]]);
        oldHost.onPressOut({ currentTarget: 20, nativeEvent: { target: 20 } });
        assert.equal(releases.length, 1, 'late native Out after cancellation cannot duplicate release');
        runner.render({ ...runner.props, [block]: false });
        oldHost.onPressIn({ currentTarget: 20, nativeEvent: { target: 20 } });
        touch().props.onPressIn({ currentTarget: 30, nativeEvent: { target: 30 } });
        oldHost.onPressOut({ currentTarget: 20, nativeEvent: { target: 20 } });
        assert.equal(releases.length, 1, 'old host callbacks cannot release a new-generation press');
        touch().props.onPressOut({ currentTarget: 30, nativeEvent: { target: 30 } });
        assert.deepEqual(releases, [
            [20, 20],
            [30, 30],
        ]);
        assert.equal(actions, 0, 'visual cancellation cannot dispatch the button action');
        runner.unmount();
        assert.equal(releases.length, 2);
    });
check(() => {
    const releases = [];
    const runner = new Runner(Button, { onPressOut: (event) => releases.push(event.currentTarget) });
    const oldHost = runner.nodes('TouchableRipple')[0].props;
    oldHost.onPressIn({ currentTarget: 20, nativeEvent: { target: 20 } });
    runner.unmount();
    assert.deepEqual(releases, [20], 'removing a held target releases its visual owner');
    oldHost.onPressOut({ currentTarget: 20, nativeEvent: { target: 20 } });
    oldHost.onPressIn({ currentTarget: 20, nativeEvent: { target: 20 } });
    assert.deepEqual(releases, [20], 'unmounted handlers stay inert');
});
check(() => {
    const releases = [];
    const runner = new Runner(Button, { onPressOut: (event) => releases.push(['original', event.currentTarget]) });
    runner.nodes('TouchableRipple')[0].props.onPressIn({ currentTarget: 20, nativeEvent: { target: 20 } });
    runner.render({ ...runner.props, onPressOut: (event) => releases.push(['replacement', event.currentTarget]) });
    assert.deepEqual(releases, [], 'an inline callback rerender is not a target unmount');
    runner.unmount();
    assert.deepEqual(releases, [['original', 20]], 'cleanup matches the callback/owner of the active In');
});
check(() => {
    const releases = [];
    const runner = new Runner(Button, { onPressOut: (event) => releases.push(event.currentTarget) });
    const host = runner.nodes('TouchableRipple')[0].props;
    host.onPressIn({ currentTarget: 20, nativeEvent: { target: 20 } });
    host.onBlur({ currentTarget: 20, nativeEvent: { target: 20 } });
    host.onPressOut({ currentTarget: 20, nativeEvent: { target: 20 } });
    assert.deepEqual(releases, [20], 'blur cancels an active press exactly once');
    runner.unmount();
});
check(() => {
    const wrapper = new Runner(IconButton, { icon: 'play_arrow' });
    const runner = new Runner(wrapper.tree.type, wrapper.tree.props);
    const touch = () => runner.nodes('TouchableRipple')[0];
    const localFill = () =>
        runner.nodes('AnimatedView').filter((node) => {
            const value = style(node.props.style);
            return value.backgroundColor === 'onSurfaceVariant' && value.opacity === 0.1;
        });
    touch().props.onFocus({});
    runner.render();
    assert.equal(localFill().length, 1);
    touch().props.onPressIn({});
    runner.render();
    assert.equal(localFill().length, 0, 'native press feedback replaces the local focus fill while pressed');
    assert.ok(
        runner.nodes('AnimatedView').some((node) => style(node.props.style).borderWidth === 3),
        'focus ring remains visible'
    );
    assert.equal(style(touch().props.style).borderRadius, 8, 'a focused icon button keeps its pressed morph');
    touch().props.onPressOut({});
    runner.render();
    assert.equal(localFill().length, 1, 'the local focus fill returns after release');
    runner.unmount();
});
for (const [size, height, icon, square, pressed] of buttonSizeCases)
    check(() => {
        const runner = new Runner(Button, { size, icon: 'plus', children: 'Crear' });
        let ripple = runner.nodes('TouchableRipple')[0];
        assert.equal(style(ripple.props.children.props.style).minHeight, height);
        assert.equal(runner.nodes('Icon')[0].props.size, icon);
        ripple.props.onPressIn({});
        runner.render();
        assert.equal(style(runner.nodes('Surface')[0].props.style).borderRadius, pressed);
        assert.equal(
            style(runner.nodes('TouchableRipple')[0].props.style).borderRadius,
            pressed,
            'the indication host follows the animated pressed shape rather than keeping a stale capsule clip'
        );
        ripple = runner.nodes('TouchableRipple')[0];
        ripple.props.onPressOut({});
        runner.render({ ...runner.props, selected: true });
        assert.equal(style(runner.nodes('Surface')[0].props.style).borderRadius, square);
        runner.render({ ...runner.props, shape: 'square' });
        assert.equal(style(runner.nodes('Surface')[0].props.style).borderRadius, height / 2);
        assert.equal(requests.at(-1).config.stiffness, 800, 'current M3 Button corner-size maps to FastSpatial');
        assert.equal(requests.at(-1).config.damping, 2 * 0.6 * Math.sqrt(800));
        runner.unmount();
    });
// Geometry fixtures + the installed RN hit-test rules, not a native gesture test.
// RCTViewComponentView.mm pointInside/betterHitTest first expands the host's
// rect by hitSlop, but a clipped ancestor rejects an outside point first.
// YogaLayoutableShadowNode.cpp getContentBounds propagates child hitSlop through
// overflow-visible ancestors. Android TouchTargetHelper.kt uses the same order.
function pathTo(node, target) {
    if (node === target) return [node];
    if (!node || typeof node !== 'object') return null;
    for (const child of [node.props?.children].flat(Infinity)) {
        const found = pathTo(child, target);
        if (found) return [node, ...found];
    }
    return null;
}
function hitByNativeRules(ancestors, host, rect, point) {
    const hitSlop = style(host.props.animatedProps).hitSlop ?? host.props.hitSlop;
    const inside = (box) => point.x >= box.left && point.x < box.right && point.y >= box.top && point.y < box.bottom;
    const hit = {
        left: rect.left - (hitSlop.left ?? 0),
        right: rect.right + (hitSlop.right ?? 0),
        top: rect.top - (hitSlop.top ?? 0),
        bottom: rect.bottom + (hitSlop.bottom ?? 0),
    };
    if (host.props.disabled || !inside(hit)) return false;
    // The intermediate native surface layers have the same visual bounds;
    // the outer allocation is48dp and is not clipped. An overflow-visible
    // ancestor receives the union of its child's rect + hitSlop from RN.
    return ancestors.every((node) => style(node.props?.style).overflow !== 'hidden' || inside(rect));
}
const cornerKeys = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius'];
// Small icon surfaces remain smaller than their48dp target in both axes. The
// animated host owns the hitSlop; the real iOS shadow adapter must pass it through.
for (const [size, height] of [
    ['extra-small', 32],
    ['small', 40],
])
    for (const widthVariant of ['narrow', 'default', 'wide'])
        for (const locale of ['ltr', 'rtl'])
            check(() => {
                direction = locale;
                const group = new Runner(ButtonGroup, {
                    size,
                    items: ['a', 'b', 'c'].map((value) => ({ value, label: value, icon: 'star', iconOnly: true, widthVariant })),
                });
                group.tree.props.onLayout({ nativeEvent: { layout: { width: 390 } } });
                group.render();
                const nodes = walk(group.tree).filter((node) => node.props?.item);
                for (const progress of [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0.8, 0, 0.8],
                    [0, 0, 0],
                ]) {
                    nodes[0].props.presses.set(progress);
                    for (const node of nodes) {
                        const item = new Runner(node.type, node.props);
                        const host = item.nodes('TouchableRipple')[0],
                            surface = item.nodes('Surface')[0];
                        const width = style(surface.props.style).width;
                        const native = new Runner(AnimatedActionSurface, surface.props);
                        const ancestors = pathTo(native.tree, host).slice(0, -1);
                        const targetWidth = Math.max(48, width),
                            left = (targetWidth - width) / 2;
                        const rect = { left, right: left + width, top: (48 - height) / 2, bottom: (48 + height) / 2 };
                        for (const point of [
                            { x: 0.5, y: 24 },
                            { x: targetWidth - 0.5, y: 24 },
                        ]) {
                            assert.equal(
                                hitByNativeRules(ancestors, host, rect, point),
                                true,
                                'horizontal target edges pass through every overflow-visible native shadow layer'
                            );
                            if (width < 47)
                                assert.equal(
                                    hitByNativeRules([...ancestors, { props: { style: { overflow: 'hidden' } } }], host, rect, point),
                                    false,
                                    'negative control: an ancestor clip would discard the horizontal target'
                                );
                        }
                        native.unmount();
                        item.unmount();
                    }
                }
                group.unmount();
                direction = 'ltr';
            });
function assertCompoundTarget(runner, height, label) {
    const host = runner.nodes('TouchableRipple')[0];
    const surface = runner.nodes('Surface')[0];
    const hostStyle = style(host.props.style),
        surfaceStyle = style(surface.props.style);
    assert.equal(hostStyle.overflow, 'hidden', `${label}: the indication's own host clips`);
    for (const key of cornerKeys) assert.equal(hostStyle[key], surfaceStyle[key], `${label}: ink and shadow share ${key}`);
    // Run the actual iOS two-layer adapter too, rather than omitting native
    // shadow wrappers from the hit-test path.
    const native = new Runner(AnimatedActionSurface, surface.props);
    const ancestors = pathTo(native.tree, host).slice(0, -1);
    assert.ok(
        ancestors.every((node) => style(node.props?.style).overflow !== 'hidden'),
        `${label}: no visual ancestor clips the target or shadows`
    );
    for (const layer of native.nodes('AnimatedView').slice(0, 2)) {
        for (const key of cornerKeys)
            assert.equal(style(layer.props.style)[key], surfaceStyle[key], `${label}: both native shadow shapes follow ${key}`);
    }
    const rect = { left: 0, right: 88, top: (48 - height) / 2, bottom: (48 + height) / 2 };
    for (const point of [
        { x: 44, y: 1 },
        { x: 44, y: 47 },
    ]) {
        assert.equal(hitByNativeRules(ancestors, host, rect, point), true, `${label}: the full48dp vertical target remains selectable`);
        assert.equal(
            hitByNativeRules([...ancestors, { props: { style: { overflow: 'hidden' } } }], host, rect, point),
            false,
            `${label}: the previous ancestor clip rejects this target edge`
        );
    }
    native.unmount();
}
for (const [size, height] of [
    ['extra-small', 32],
    ['small', 40],
]) {
    for (const variant of ['standard', 'connected'])
        for (const locale of ['ltr', 'rtl'])
            check(() => {
                direction = locale;
                const group = new Runner(ButtonGroup, {
                    size,
                    variant,
                    buttonVariant: 'elevated',
                    items: [
                        { value: 'a', label: 'Uno' },
                        { value: 'b', label: 'Dos' },
                        { value: 'c', label: 'Tres' },
                    ],
                });
                group.tree.props.onLayout({ nativeEvent: { layout: { width: 390 } } });
                group.render();
                for (const node of walk(group.tree).filter((node) => node.props?.item)) {
                    const item = new Runner(node.type, node.props);
                    const label = `${size}/${variant}/${locale}/${node.props.index}`;
                    const rest = Object.fromEntries(cornerKeys.map((key) => [key, style(item.nodes('Surface')[0].props.style)[key]]));
                    assertCompoundTarget(item, height, `${label}/rest`);
                    current = item;
                    item.nodes('TouchableRipple')[0].props.onPressIn({});
                    item.render();
                    assertCompoundTarget(item, height, `${label}/pressed`);
                    current = item;
                    item.nodes('TouchableRipple')[0].props.onPressOut({});
                    group.render();
                    item.render();
                    for (const key of cornerKeys)
                        assert.equal(
                            style(item.nodes('TouchableRipple')[0].props.style)[key],
                            rest[key],
                            `${label}: release restores the original ${key}`
                        );
                    item.unmount();
                }
                group.unmount();
                direction = 'ltr';
            });
    for (const locale of ['ltr', 'rtl'])
        check(() => {
            direction = locale;
            const split = new Runner(SplitButton, {
                size,
                variant: 'elevated',
                label: 'Enviar',
                onPress() {},
                actions: [{ key: 'draft', label: 'Borrador', onPress() {} }],
            });
            const primary = walk(split.tree).find((node) => node.props?.testID === 'mobile-split-button-primary');
            const trailing = split.nodes(Menu)[0].props.anchor;
            for (const [name, node] of [
                ['primary', primary],
                ['trailing', trailing],
            ]) {
                const half = new Runner(node.type, node.props);
                const label = `${size}/split/${locale}/${name}`;
                const rest = Object.fromEntries(cornerKeys.map((key) => [key, style(half.nodes('Surface')[0].props.style)[key]]));
                assertCompoundTarget(half, height, `${label}/rest`);
                half.nodes('TouchableRipple')[0].props.onPressIn({});
                half.render();
                assertCompoundTarget(half, height, `${label}/pressed`);
                half.nodes('TouchableRipple')[0].props.onPressOut({});
                half.render();
                for (const key of cornerKeys)
                    assert.equal(
                        style(half.nodes('TouchableRipple')[0].props.style)[key],
                        rest[key],
                        `${label}: release restores the original ${key}`
                    );
                half.unmount();
            }
            split.unmount();
            direction = 'ltr';
        });
}
// Paper owns the pressed indication. Hover/focus and expanded state must not
// add another full state plane behind that same pressed indication.
for (const family of ['group', 'split'])
    check(() => {
        const parent =
            family === 'group'
                ? new Runner(ButtonGroup, {
                      items: [
                          { value: 'a', label: 'Uno' },
                          { value: 'b', label: 'Dos' },
                      ],
                  })
                : new Runner(SplitButton, { label: 'Enviar', onPress() {}, actions: [{ key: 'draft', label: 'Borrador', onPress() {} }] });
        const node = family === 'group' ? walk(parent.tree).find((node) => node.props?.item) : parent.nodes(Menu)[0].props.anchor;
        const runner = new Runner(node.type, node.props);
        const stateLayers = () =>
            walk(runner.tree).filter(
                (node) =>
                    node.props?.pointerEvents === 'none' &&
                    ['onPrimary', 'onSecondaryContainer'].includes(style(node.props?.style).backgroundColor) &&
                    [0.08, 0.1].includes(style(node.props?.style).opacity)
            );
        runner.nodes('TouchableRipple')[0].props.onHoverIn({});
        runner.render();
        assert.equal(stateLayers().length, 1, `${family}: hover has one state layer`);
        for (const key of cornerKeys)
            assert.equal(
                style(stateLayers()[0].props.style)[key],
                style(runner.nodes('TouchableRipple')[0].props.style)[key],
                `${family}: hover paint follows ${key} without an ancestor clip`
            );
        runner.nodes('TouchableRipple')[0].props.onPressIn({});
        runner.render();
        assert.equal(stateLayers().length, 0, `${family}: Paper's pressed indication is not darkened by another hover layer`);
        runner.nodes('TouchableRipple')[0].props.onPressOut({});
        runner.render();
        assert.equal(stateLayers().length, 1, `${family}: release restores the remaining hover state`);
        runner.nodes('TouchableRipple')[0].props.onHoverOut({});
        runner.render();
        runner.nodes('TouchableRipple')[0].props.onFocus({});
        runner.render();
        assert.equal(stateLayers().length, 1, `${family}: focus has one state layer`);
        runner.nodes('TouchableRipple')[0].props.onPressIn({});
        runner.render();
        assert.equal(stateLayers().length, 0, `${family}: focus does not double the pressed indication`);
        runner.nodes('TouchableRipple')[0].props.onBlur({});
        runner.render();
        assert.equal(stateLayers().length, 0, `${family}: leaving focus cancels the active mark`);
        runner.render({ ...runner.props, disabled: true });
        const disabledLayer = walk(runner.tree).find(
            (node) => node.props?.pointerEvents === 'none' && style(node.props?.style).backgroundColor === 'onSurface'
        );
        assert.ok(disabledLayer, `${family}: disabled container paint remains present`);
        for (const key of cornerKeys)
            assert.equal(
                style(disabledLayer.props.style)[key],
                style(runner.nodes('TouchableRipple')[0].props.style)[key],
                `${family}: disabled paint follows ${key} without an ancestor clip`
            );
        runner.unmount();
        parent.unmount();
    });
for (const [size, height, icon] of [
    ['extra-small', 32, 20],
    ['small', 40, 24],
]) {
    for (const [widthVariant, horizontalPadding] of size === 'extra-small'
        ? [
              ['narrow', 4],
              ['default', 6],
              ['wide', 10],
          ]
        : [
              ['narrow', 4],
              ['default', 8],
              ['wide', 14],
          ])
        check(() => {
            const wrapper = new Runner(IconButton, { sizeClass: size, widthVariant, icon: 'arrow-back', onPress() {} });
            const runner = new Runner(wrapper.tree.type, wrapper.tree.props);
            const host = runner.nodes('TouchableRipple')[0];
            const visualWidth = icon + horizontalPadding * 2;
            const allocationWidth = Math.max(48, visualWidth);
            const rect = {
                left: (allocationWidth - visualWidth) / 2,
                right: (allocationWidth + visualWidth) / 2,
                top: (48 - height) / 2,
                bottom: (48 + height) / 2,
            };
            const ancestors = pathTo(runner.tree, host).slice(0, -1);
            assert.equal(runner.nodes('TouchableRipple').length, 1, 'one action/AX owner');
            assert.equal(style(host.props.style).overflow, 'hidden', 'only the indication host clips');
            for (const point of [
                { x: 1, y: 24 },
                { x: allocationWidth - 1, y: 24 },
                { x: allocationWidth / 2, y: 1 },
                { x: allocationWidth / 2, y: 47 },
            ]) {
                assert.equal(hitByNativeRules(ancestors, host, rect, point), true, `${size}/${widthVariant} must activate all48dp`);
            }
            const edge = { x: allocationWidth / 2, y: 1 };
            assert.equal(
                hitByNativeRules([...ancestors, { props: { style: { overflow: 'hidden' } } }], host, rect, edge),
                false,
                'negative control: the old clipped visual ancestor rejects the outer target'
            );
            host.props.onPressIn({});
            runner.render();
            assert.equal(style(runner.nodes('TouchableRipple')[0].props.style).borderRadius, 8, 'M3 XS/S pressed radius remains8dp');
            runner.unmount();
            wrapper.unmount();
        });
    check(() => {
        const runner = new Runner(Button, { size, children: 'Guardar', onPress() {} });
        const host = runner.nodes('TouchableRipple')[0];
        const rect = { left: 0, right: 88, top: (48 - height) / 2, bottom: (48 + height) / 2 };
        assert.equal(
            hitByNativeRules(pathTo(runner.tree, host).slice(0, -1), host, rect, { x: 44, y: 1 }),
            true,
            'text Button keeps its48dp vertical touch region'
        );
        assert.equal(hitByNativeRules(pathTo(runner.tree, host).slice(0, -1), host, rect, { x: 44, y: 47 }), true);
        runner.unmount();
    });
}
check(() => {
    const runner = new Runner(Button, { loading: true, children: 'Guardar' });
    assert.equal(runner.nodes('ProgressIndicator')[0].props.variant, 'circular');
    assert.equal(runner.nodes('ProgressIndicator')[0].props.showTrack, false);
    assert.equal(runner.nodes('TouchableRipple')[0].props.disabled, true);
});
check(() => {
    const runner = new Runner(Button, { accessibilityState: { busy: true }, icon: 'custom-loading', children: 'Comprobando' });
    assert.equal(
        runner.nodes('TouchableRipple')[0].props.accessibilityState.busy,
        true,
        'custom LoadingIndicator icon retains its declared busy state'
    );
});
check(() => {
    let commits = 0;
    const runner = new Runner(Button, { icon: 'update', children: 'Comprobar', onPress: () => commits++ });
    const previous = runner.nodes('TouchableRipple')[0];
    previous.props.onPressIn({});
    let paint;
    runner.render({
        ...runner.props,
        iconSize: 24,
        loading: (props) => {
            paint = props;
            return jsx('CustomLoading', props);
        },
    });
    const host = runner.nodes('TouchableRipple')[0];
    assert.equal(paint.size, 24);
    assert.equal(paint.color, theme.colors.onPrimary, 'an ongoing action retains enabled contrast');
    assert.equal(host.props.disabled, true);
    assert.equal(host.props.accessibilityState.busy, true);
    assert.equal(runner.nodes('ProgressIndicator').length, 0, 'custom loading does not duplicate the default indicator');
    previous.props.onPress({});
    host.props.onPress({});
    assert.equal(commits, 0, 'held and repeated presses cannot restart custom loading');
    runner.render({ ...runner.props, loading: false });
    runner.nodes('TouchableRipple')[0].props.onPress({});
    assert.equal(commits, 1);
    runner.unmount();
});
// Exercise cancellation/recovery through each public API, not a second local
// implementation of its state machine. Pressability itself is the native
// boundary: blur/release callbacks here do not certify an outside-drag gesture.
for (const [family, Component] of [
    ['Button', Button],
    ['IconButton', IconButton],
]) {
    const mountAction = (props) => {
        const wrapper = new Runner(Component, props);
        const action = Component === Button ? wrapper : new Runner(wrapper.tree.type, wrapper.tree.props);
        return {
            action,
            update(patch) {
                wrapper.render({ ...wrapper.props, ...patch });
                if (action !== wrapper) action.render(wrapper.tree.props);
            },
            unmount() {
                action.unmount();
                if (action !== wrapper) wrapper.unmount();
            },
        };
    };
    check(() => {
        const events = [];
        const owner = mountAction({
            icon: 'bookmark',
            children: 'Save',
            selected: true,
            onPress: () => events.push('commit'),
            onPressIn: () => events.push('in'),
            onPressOut: () => events.push('out'),
            onBlur: () => events.push('blur'),
        });
        const host = () => owner.action.nodes('TouchableRipple')[0];
        host().props.onFocus({});
        host().props.onPressIn({});
        owner.action.render();
        host().props.onBlur({});
        owner.action.render();
        assert.deepEqual(events, ['in', 'out', 'blur'], `${family}: cancellation releases feedback without committing the action`);
        assert.equal(host().props.accessibilityState.selected, true, `${family}: cancellation preserves controlled selection`);
        assert.equal(
            style(owner.action.nodes('Surface')[0].props.style).borderRadius,
            12,
            `${family}: blur restores selected resting shape`
        );
        assert.equal(
            owner.action.nodes('AnimatedView').some((node) => style(node.props.style).borderWidth === 3),
            false,
            `${family}: a cancelled focus cannot leave its ring behind`
        );
        host().props.onPressIn({});
        owner.action.render();
        host().props.onPressOut({});
        host().props.onPress({});
        owner.action.render();
        assert.deepEqual(
            events,
            ['in', 'out', 'blur', 'in', 'out', 'commit'],
            `${family}: a fresh interaction commits exactly once after cancellation`
        );
        owner.unmount();
    });
    for (const blocker of ['disabled', 'loading'])
        check(() => {
            let commits = 0;
            const owner = mountAction({ icon: 'bookmark', children: 'Save', selected: true, onPress: () => commits++ });
            const host = () => owner.action.nodes('TouchableRipple')[0];
            host().props.onFocus({});
            host().props.onHoverIn({});
            host().props.onPressIn({});
            owner.action.render();
            const heldKey = host().key;
            owner.update({ [blocker]: true });
            assert.notEqual(host().key, heldKey, `${family}/${blocker}: the held Pressability host is replaced`);
            host().props.onPress({});
            assert.equal(commits, 0, `${family}/${blocker}: blocked action is inert`);
            assert.equal(host().props.accessibilityState.disabled, true);
            assert.equal(host().props.accessibilityState.busy, blocker === 'loading');
            assert.equal(host().props.accessibilityState.selected, true, 'blocking never erases the consumer selection');
            owner.update({ [blocker]: false });
            const layers = owner.action.nodes('AnimatedView').filter((node) => {
                const layer = style(node.props.style);
                return layer.borderWidth === 3 || layer.opacity === 0.08 || layer.opacity === 0.1;
            });
            assert.equal(layers.length, 0, `${family}/${blocker}: re-enabling cannot revive focus/hover/disabled paint`);
            assert.equal(
                style(owner.action.nodes('Surface')[0].props.style).borderRadius,
                12,
                'the selected resting shape survives recovery'
            );
            host().props.onPressIn({});
            owner.action.render();
            host().props.onPressOut({});
            host().props.onPress({});
            assert.equal(commits, 1, `${family}/${blocker}: the next valid press works once`);
            owner.unmount();
        });
}
// Current public M3 button tokens differ from the older AndroidX token export:
// Button corners use FastSpatial and disabled content uses onSurface. The
// separate IconButton API keeps its own no-bounce DefaultEffects contract.
for (const iconOnly of [false, true])
    check(() => {
        const runner = new Runner(ButtonForIcon, { iconOnly, icon: 'bookmark', selected: false, children: 'Guardar', onPress() {} });
        const radius = runner.hooks.find((slot) => typeof slot.get === 'function');
        for (let tap = 0; tap < 4; tap++) {
            runner.nodes('TouchableRipple')[0].props.onPressIn({});
            runner.render();
            runner.nodes('TouchableRipple')[0].props.onPressOut({});
            runner.render({ ...runner.props, selected: !runner.props.selected });
            assert.equal(
                radius.cancellations ?? 0,
                0,
                'rapid reversals leave the previous spring attached for Reanimated velocity handoff'
            );
        }
        runner.render({ ...runner.props, loading: true });
        assert.equal(radius.cancellations ?? 0, 0, 'blocking retargets to rest without discarding spring momentum');
        const beforeReduced = requests.length;
        theme.animation.scale = 0;
        runner.render({ ...runner.props, loading: false });
        assert.equal(requests.length, beforeReduced, 'enabling reduced motion immediately settles instead of starting a spring');
        assert.equal(radius.animation, undefined, 'reduced motion cancels the active animation through the immediate shared write');
        runner.unmount();
        assert.equal(radius.cancellations, 1, 'the final unmount still cancels remaining work');
        theme.animation.scale = 1;
    });
for (const [variant, normalElevation, hoverElevation] of [
    ['filled', 0, 0],
    ['tonal', 0, 0],
    ['elevated', 1, 1],
    ['outlined', 0, 0],
    ['text', 0, 0],
])
    check(() => {
        const runner = new Runner(Button, { variant, children: 'Guardar', onPress() {} });
        const surface = () => runner.nodes('Surface')[0];
        const host = () => runner.nodes('TouchableRipple')[0];
        assert.equal(surface().props.elevation, normalElevation);
        host().props.onHoverIn({});
        runner.render();
        assert.equal(surface().props.elevation, hoverElevation);
        host().props.onPressIn({});
        runner.render();
        assert.equal(surface().props.elevation, normalElevation, 'current M3 deprecates hover elevation, including filled/tonal');
        host().props.onPressOut({});
        runner.render();
        assert.equal(surface().props.elevation, hoverElevation, 'release keeps the resting elevation');
        host().props.onFocus({});
        runner.render();
        assert.equal(surface().props.elevation, normalElevation, 'keyboard focus uses focused elevation');
        runner.render({ ...runner.props, disabled: true, textColor: 'customEnabledInk' });
        assert.equal(surface().props.elevation, 0);
        assert.equal(style(runner.nodes('Text')[0].props.style).color, 'onSurface', 'enabled custom ink cannot defeat disabled tokens');
        assert.equal(style(host().props.children.props.style).opacity, 0.38);
        runner.render({ ...runner.props, disabled: false });
        assert.equal(surface().props.elevation, normalElevation, 'reenabling cannot resurrect the old hover/focus state');
        assert.equal(
            runner.nodes('AnimatedView').some((node) => style(node.props.style).borderWidth === 3),
            false
        );
        runner.unmount();
    });
for (const [size, height, , square, pressed] of buttonSizeCases)
    for (const shape of ['round', 'square'])
        check(() => {
            let calls = 0;
            const runner = new Runner(Button, {
                size,
                shape,
                selected: false,
                children: 'Guardar',
                onPress() {
                    calls++;
                },
            });
            const host = () => runner.nodes('TouchableRipple')[0];
            const radius = () => style(runner.nodes('Surface')[0].props.style).borderRadius;
            for (let tap = 0; tap < 6; tap++) {
                host().props.onPressIn({});
                runner.render();
                assert.equal(radius(), pressed);
                runner.render({ ...runner.props, selected: !runner.props.selected });
                assert.equal(radius(), pressed, 'a controlled selection change cannot lift a still-held button');
                host().props.onPressOut({});
                runner.render();
                const expected = runner.props.selected
                    ? shape === 'round'
                        ? square
                        : height / 2
                    : shape === 'round'
                      ? height / 2
                      : square;
                assert.equal(radius(), expected, 'release always resolves the latest controlled shape');
            }
            host().props.onPressIn({});
            runner.render();
            const interactiveKey = host().key;
            runner.render({ ...runner.props, loading: true });
            assert.notEqual(host().key, interactiveKey, 'blocking unmounts the held native Pressability underlay');
            host().props.onPress({});
            assert.equal(calls, 0, 'loading cannot commit an action');
            runner.render({ ...runner.props, loading: false });
            assert.equal(radius(), shape === 'round' ? height / 2 : square, 'loading cancellation clears the old pressed morph');
            host().props.onPress({});
            assert.equal(calls, 1, 'the next enabled action is delivered once');
            const shared = runner.hooks.filter((slot) => typeof slot.get === 'function');
            runner.unmount();
            assert.ok(
                shared.every((slot) => slot.animation === undefined),
                'unmount cancels remaining corner springs'
            );
        });
for (const [size, height] of buttonSizeCases)
    check(() => {
        const runner = new Runner(Button, {
            size,
            icon: 'download',
            children: 'Download playlist for offline access',
            style: { width: 320 },
        });
        const host = runner.nodes('TouchableRipple')[0];
        const row = style(host.props.children.props.style);
        const text = runner.nodes('Text')[0];
        const line = style(text.props.style).lineHeight;
        assert.equal(
            row.paddingVertical * 2 + Math.max(line, runner.nodes('Icon')[0].props.size),
            height,
            'normal text + padding gives the published height'
        );
        assert.equal(text.props.numberOfLines, 2, 'the documented 200% label can wrap to a second line');
        assert.equal(style(text.props.style).textAlign, 'center');
        assert.equal(style(runner.nodes('Surface')[0].props.style).alignSelf, 'stretch', 'responsive width reaches the visual surface');
        host.props.children.props.onLayout({ nativeEvent: { layout: { height: height + line } } });
        runner.render();
        assert.equal(
            style(runner.nodes('Surface')[0].props.style).borderRadius,
            (height + line) / 2,
            'a grown multiline container retains a full round corner'
        );
        assert.equal(
            runner.nodes('TouchableRipple')[0].props.hitSlop.top,
            0,
            'a grown48dp+ label does not retain the old small-button slop'
        );
        runner.unmount();
    });
check(() => {
    const runner = new Runner(Button, { children: 'Guardar', onPress() {} });
    runner.nodes('TouchableRipple')[0].props.onFocus({});
    runner.render();
    const ring = runner.nodes('AnimatedView').find((node) => style(node.props.style).borderWidth === 3);
    assert.equal(style(ring.props.style).margin, -5, '3dp ring plus2dp outer gap');
    const radius = runner.hooks.find((slot) => typeof slot.get === 'function');
    radius.set(11);
    assert.equal(style(ring.props.style).borderRadius, 16, 'focus geometry follows the same UI-thread corner without a React frame');
    runner.unmount();
});
check(() => {
    const runner = new Runner(Button, { variant: 'text', selected: true, children: 'Guardar' });
    assert.equal(runner.nodes('TouchableRipple')[0].props.accessibilityState.selected, undefined, 'there is no text toggle button');
    assert.equal(style(runner.nodes('Surface')[0].props.style).borderRadius, 20);
    const wrapper = new Runner(IconButton, { icon: 'bookmark', selected: true });
    const icon = new Runner(wrapper.tree.type, wrapper.tree.props);
    assert.equal(
        icon.nodes('TouchableRipple')[0].props.accessibilityState.selected,
        true,
        'standard IconButton retains its distinct toggle contract'
    );
    assert.equal(requests.at(-1).config.stiffness, 1600);
    icon.unmount();
    wrapper.unmount();
    runner.unmount();
});
check(() => {
    const expressive = theme.motion.spring.fast.spatial;
    theme.motion.spring.fast.spatial = { stiffness: 1400, damping: 0.9 };
    const runner = new Runner(Button, { children: 'Guardar', onPress() {} });
    runner.nodes('TouchableRipple')[0].props.onPressIn({});
    runner.render();
    assert.equal(requests.at(-1).config.stiffness, 1400, 'the standard-profile reference examples resolve the same FastSpatial token');
    assert.equal(requests.at(-1).config.damping, 2 * 0.9 * Math.sqrt(1400));
    runner.unmount();
    theme.motion.spring.fast.spatial = expressive;
});
check(() => {
    const runner = new Runner(Button, { variant: 'elevated', selected: true, children: 'Guardar' });
    assert.ok(walk(runner.tree).some((node) => style(node.props?.style).backgroundColor === 'primary'));
    assert.equal(style(runner.nodes('Text')[0].props.style).color, 'onPrimary');
    runner.nodes('TouchableRipple')[0].props.onHoverIn({});
    runner.render();
    assert.equal(runner.nodes('Surface')[0].props.elevation, 1, 'current M3 hover elevation token is explicitly deprecated');
});
for (const [mode, expected] of [
    [undefined, 'onSurfaceVariant'],
    ['contained', 'onPrimary'],
    ['contained-tonal', 'onSecondaryContainer'],
    ['outlined', 'onSurfaceVariant'],
])
    check(() => {
        let wrapper = new Runner(IconButton, { mode, icon: 'bookmark' });
        let runner = new Runner(wrapper.tree.type, wrapper.tree.props);
        assert.equal(runner.nodes('Icon')[0].props.color, expected);
        wrapper.render({ ...wrapper.props, disabled: true });
        runner = new Runner(wrapper.tree.type, wrapper.tree.props);
        assert.equal(runner.nodes('Icon')[0].props.color, 'onSurface');
        if (mode === 'contained' || mode === 'contained-tonal')
            assert.ok(
                walk(runner.tree).some(
                    (node) => style(node.props?.style).backgroundColor === 'onSurface' && style(node.props.style).opacity === 0.1
                )
            );
    });
check(() => {
    const icon = new Runner(IconButton, { icon: 'heart', selected: true });
    const runner = new Runner(icon.tree.type, icon.tree.props);
    assert.equal(runner.nodes('Icon')[0].props.color, 'primary');
});
for (const [size, height] of buttonSizeCases)
    check(() => {
        const items = [
            { value: 'a', label: 'Uno' },
            { value: 'b', label: 'Dos' },
        ];
        const runner = new Runner(ButtonGroup, { items, size, variant: 'standard' });
        assert.equal(style(runner.nodes('View').at(-1).props.style).minHeight, Math.max(48, height));
        const row = runner.nodes('View').find((node) => style(node.props.style).gap != null);
        assert.equal(style(row.props.style).gap, { 'extra-small': 18, small: 12, medium: 8, large: 8, 'extra-large': 8 }[size]);
        const child = walk(runner.tree).find((node) => node.props?.item);
        const groupItem = new Runner(child.type, child.props);
        assert.equal(style(groupItem.nodes('TouchableRipple')[0].props.style).minHeight, height);
    });
// Rendered M3 connected-size tokens, not an inferred scale of the Small token.
for (const [size, normal, pressed] of [
    ['extra-small', 8, 4],
    ['small', 8, 4],
    ['medium', 8, 4],
    ['large', 16, 12],
    ['extra-large', 20, 16],
])
    check(() => {
        const runner = new Runner(ButtonGroup, {
            size,
            variant: 'connected',
            items: [
                { value: 'a', label: 'Uno' },
                { value: 'b', label: 'Dos' },
                { value: 'c', label: 'Tres' },
            ],
        });
        const item = walk(runner.tree).filter((node) => node.props?.item)[1];
        const child = new Runner(item.type, item.props);
        let surface = child.nodes('Surface')[0];
        assert.equal(style(surface.props.style).borderTopLeftRadius, normal);
        assert.equal(style(surface.props.style).borderTopRightRadius, normal);
        child.nodes('TouchableRipple')[0].props.onPressIn({});
        child.render();
        surface = child.nodes('Surface')[0];
        assert.equal(style(surface.props.style).borderTopLeftRadius, pressed);
        assert.equal(style(surface.props.style).borderTopRightRadius, pressed);
        child.unmount();
        runner.unmount();
    });
check(() => {
    const group = new Runner(ButtonGroup, {
        items: [
            { value: 'a', label: 'Uno' },
            { value: 'b', label: 'Dos' },
        ],
    });
    const item = walk(group.tree).find((node) => node.props?.item);
    const child = new Runner(item.type, item.props);
    const initialWidth = style(child.nodes('Surface')[0].props.style).width;
    group.deferRNWrites = true;
    // A short native tap can deliver both RN events before UI applies PressIn.
    current = group;
    child.nodes('TouchableRipple')[0].props.onPressIn({});
    child.nodes('TouchableRipple')[0].props.onPressOut({});
    assert.ok(group.uiWrites.length > 0, 'the UI queue must still be pending during PressOut');
    group.flushUI();
    assert.equal(
        style(child.nodes('Surface')[0].props.style).width,
        initialWidth,
        'released short taps must not leave a neighbouring button compressed'
    );
    child.unmount();
    group.unmount();
});
for (const [size, height, leading] of buttonSizeCases)
    check(() => {
        const trailingSize = { 'extra-small': 22, small: 22, medium: 26, large: 38, 'extra-large': 50 }[size];
        const offset = { 'extra-small': 1, small: 1, medium: 2, large: 3, 'extra-large': 6 }[size];
        const runner = new Runner(SplitButton, {
            size,
            label: 'Enviar',
            icon: 'send',
            onPress() {},
            actions: [{ key: 'draft', label: 'Borrador', onPress() {} }],
        });
        const primary = walk(runner.tree).find((node) => node.props?.testID === 'mobile-split-button-primary');
        const main = new Runner(primary.type, primary.props);
        assert.equal(main.nodes('Icon')[0].props.size, leading);
        const menu = runner.nodes(Menu)[0];
        assert.equal(menu.props.anchorGap, 4);
        const half = new Runner(menu.props.anchor.type, menu.props.anchor.props);
        assert.equal(half.nodes('Icon')[0].props.size, trailingSize);
        const glyph = half.nodes('AnimatedView').find((node) => style(node.props.style).transform);
        assert.equal(style(glyph.props.style).transform[0].translateX, -offset);
        half.render({ ...half.props, expanded: true });
        assert.equal(
            style(half.nodes('AnimatedView').find((node) => style(node.props.style).transform).props.style).transform[1].rotate,
            '180deg'
        );
        assert.ok(
            half.nodes('AnimatedView').some((node) => style(node.props.style).opacity === 0.1),
            'selected trailing layer follows the animated shape'
        );
        direction = 'rtl';
        half.render();
        assert.equal(
            style(half.nodes('AnimatedView').find((node) => style(node.props.style).transform).props.style).transform[1].rotate,
            '-180deg'
        );
        direction = 'ltr';
        main.unmount();
        half.unmount();
    });

for (const [size, height, icon, radius] of [
    ['default', 56, 24, 16],
    ['medium', 80, 28, 20],
    ['large', 96, 36, 28],
])
    check(() => {
        const fab = new Runner(FAB, { size, icon: 'plus' });
        const shellNode = walk(fab.tree).find((node) => node.props?.children && node.props?.theme && node.props?.width != null);
        const shell = new Runner(shellNode.type, shellNode.props);
        assert.equal(style(shell.tree.props.style).width, height);
        assert.equal(style(shell.tree.props.style).height, height);
        assert.equal(style(shell.nodes('Surface')[0].props.style).borderRadius, radius);
        assert.equal(fab.nodes('Icon')[0].props.size, icon);
        shell.render({ ...shell.props, visible: false });
        assert.equal(shell.tree.props.pointerEvents, 'none');
        assert.equal(shell.tree.props.accessibilityElementsHidden, true);
        assert.equal(style(shell.tree.props.style).transform[0].scale, 0.2);
        shell.unmount();
    });
check(() => {
    const extended = new Runner(FAB.Extended, { size: 'large', icon: 'pencil', label: 'Redactar', expanded: true });
    extended
        .nodes('Text')
        .find((node) => node.props.onTextLayout)
        .props.onTextLayout({ nativeEvent: { lines: [{ width: 95.25, height: 32 }] } });
    extended.render();
    const shell = walk(extended.tree).find((node) => node.props?.animatedGeometry);
    assert.equal(style(shell.props.animatedGeometry).width, 28 + 36 + 16 + 97 + 28);
    extended.render({ ...extended.props, expanded: false });
    assert.equal(style(walk(extended.tree).find((node) => node.props?.animatedGeometry).props.animatedGeometry).width, 96);
    assert.equal(requests.at(-2).config.stiffness, 800, 'collapse FastSpatial');
    assert.equal(requests.at(-1).config.stiffness, 3800, 'collapse FastEffects');
    extended.unmount();
});
const events = [];
const menuProps = {
    expanded: false,
    onDismiss: () => events.push('close'),
    trigger: { icon: 'plus', size: 'large', onPress: () => events.push('open'), accessibilityLabel: 'Crear' },
    items: [
        { icon: 'pencil', label: 'Escribir', onPress: () => events.push('item') },
        { icon: 'camera', label: 'Foto', onPress() {} },
    ],
};
check(() => {
    const wrapper = new Runner(FAB.Menu, menuProps);
    const menu = new Runner(wrapper.tree.type, wrapper.tree.props);
    menu.render({ ...menu.props, expanded: true });
    const morphShell = walk(menu.tree).find((node) => node.props?.animatedGeometry);
    assert.equal(style(morphShell.props.animatedGeometry).width, 56);
    assert.equal(morphShell.props.accessibilityLabel, 'Cerrar menú');
    assert.equal(morphShell.props.accessibilityState.expanded, true);
    const slot = walk(menu.tree).find((node) => style(node.props?.style).position === 'absolute' && style(node.props?.style).height === 96);
    assert.equal(style(slot.props.style).bottom, 0, 'fixed96dp trigger slot anchors the shrinking close button at its top');
    assert.equal(
        style(menu.nodes('ScrollView')[0].props.contentContainerStyle).paddingBottom,
        104,
        'items can scroll behind the close button'
    );
    assert.ok(
        requests.some(({ to, config }) => to === 2 && config.stiffness === 800 && config.damping === 2 * Math.sqrt(800)),
        'one SlowEffects count'
    );
    const itemNode = walk(menu.tree).find((node) => node.props?.revealCount);
    const item = new Runner(itemNode.type, itemNode.props);
    item.nodes('Text')
        .find((node) => node.props.onTextLayout)
        .props.onTextLayout({ nativeEvent: { lines: [{ width: 68, height: 24 }] } });
    item.render();
    assert.equal(style(item.nodes('Surface')[0].props.style).width, 149);
    assert.equal(item.nodes('Surface')[0].props.elevation, 0, 'MD3 menu-item elevation is level 0');
    assert.equal(item.nodes('Surface')[0].props.mode, 'flat');
    assert.ok(
        !JSON.stringify(item.nodes('AnimatedView').map((node) => style(node.props.style))).includes('scaleX'),
        'text is clipped by width, never squashed'
    );
    item.nodes('TouchableRipple')[0].props.onPress({});
    assert.deepEqual(events.slice(-2), ['item', 'close']);
    assert.equal(backHandlers.size, 1);
    Array.from(backHandlers)[0]();
    assert.equal(events.at(-1), 'close');
    menu.render({ ...menu.props, expanded: false });
    assert.equal(backHandlers.size, 0);
    item.unmount();
    menu.unmount();
});
check(() => {
    platform = 'web';
    const wrapper = new Runner(FAB.Menu, { ...menuProps, expanded: true });
    const menu = new Runner(wrapper.tree.type, wrapper.tree.props);
    assert.equal(menu.nodes(Menu)[0].props.variant, 'baseline');
    assert.equal(menu.nodes(Menu)[0].props.anchorGap, 4);
    assert.equal(menu.nodes('ScrollView').length, 0, 'web uses anchored menu instead of native stack');
    const expressiveWrapper = new Runner(FAB.Menu, { ...menuProps, expanded: true, presentation: 'expressive' });
    const expressive = new Runner(expressiveWrapper.tree.type, expressiveWrapper.tree.props);
    assert.equal(expressive.nodes(Menu).length, 0, 'explicit Expressive presentation keeps the original pill engine on web');
    assert.ok(walk(expressive.tree).some((node) => node.props?.animatedGeometry));
    expressive.unmount();
    platform = 'ios';
});
check(() => {
    theme.animation.scale = 0;
    const before = requests.length;
    new Runner(Button, { children: 'Guardar' });
    const wrapper = new Runner(FAB.Menu, { ...menuProps, expanded: true });
    const menu = new Runner(wrapper.tree.type, wrapper.tree.props);
    const node = walk(menu.tree).find((node) => node.props?.animatedGeometry);
    const shell = new Runner(node.type, node.props);
    assert.equal(requests.length, before, 'reduced motion starts no springs in Button/FAB/Menu');
    menu.unmount();
    shell.unmount();
    theme.animation.scale = 1;
});
// Regressions from the25 October per-family audit. Fixtures follow executable
// ButtonDefaults, IconButtonDefaults and SegmentedButtonDefaults.Icon at the pin.
check(() => {
    const runner = new Runner(Button, { loading: false, children: 'Crear' });
    const row = runner.nodes('TouchableRipple')[0].props.children;
    assert.equal(walk(row).filter((node) => node.type === 'View').length, 1, 'loading=false cannot reserve an empty glyph column');
    direction = 'rtl';
    runner.render({ ...runner.props, icon: 'plus' });
    assert.equal(runner.nodes('Icon').length, 1, 'adding a leading icon keeps one glyph slot');
    // Actual leading-edge geometry across locale/native-direction combinations
    // is exercised by verify-mobile-design-navigation-layout.cjs using Yoga.
    direction = 'ltr';
    runner.unmount();
});
check(() => {
    const runner = new Runner(Button, { size: 'extra-small', icon: 'plus', children: 'Crear' });
    const row = style(runner.nodes('TouchableRipple')[0].props.children.props.style);
    assert.equal(row.paddingHorizontal, 12, 'ButtonDefaults explicit XS correction overrides generated16');
    assert.equal(row.gap, 4, 'ButtonDefaults.ExtraSmallIconSpacing');
});
check(() => {
    for (const [component, expectedOpacity] of [
        [Button, 1],
        [IconButton, 0.38],
    ]) {
        const wrapper = new Runner(
            component,
            component === Button
                ? { variant: 'outlined', disabled: true, children: 'Crear' }
                : { mode: 'outlined', disabled: true, icon: 'pencil' }
        );
        const runner = component === Button ? wrapper : new Runner(wrapper.tree.type, wrapper.tree.props);
        const outline = runner.nodes('AnimatedView').find((node) => style(node.props.style).borderWidth === 1);
        assert.equal(
            style(outline.props.style).opacity,
            expectedOpacity,
            'current Button outlineVariant and IconButton disabled border differ'
        );
    }
});
check(() => {
    const group = new Runner(ButtonGroup, {
        items: [
            { value: 'edit', label: 'Editar' },
            { value: 'share', label: 'Compartir' },
        ],
    });
    const node = walk(group.tree).find((node) => node.props?.item);
    const item = new Runner(node.type, node.props);
    item.nodes('TouchableRipple')[0].props.onHoverIn({});
    item.render();
    const surface = item.nodes('Surface')[0];
    assert.equal(surface.props.mode, 'elevated', 'the shared Surface retains elevation support');
    assert.equal(surface.props.elevation, 0, 'current filled buttons retain resting elevation on hover');
    assert.notEqual(style(surface.props.style).overflow, 'hidden', 'the shadow-bearing Surface must not clip itself');
    assert.equal(
        style(item.nodes('TouchableRipple')[0].props.style).overflow,
        'hidden',
        'the native indication host clips to the morphing silhouette'
    );
});
check(() => {
    const items = [
        { value: 'a', label: 'A', icon: 'play', iconOnly: true, variant: 'filled', size: 'large', shape: 'square', widthVariant: 'wide' },
        { value: 'b', label: 'B', variant: 'outlined' },
    ];
    const group = new Runner(ButtonGroup, { items, size: 'medium' });
    const children = walk(group.tree).filter((node) => node.props?.item);
    assert.equal(children[0].props.size, 'large');
    assert.equal(children[0].props.variant, 'filled');
    assert.equal(children[0].props.groupShape, 'square');
    assert.equal(children[0].props.width, 128, 'large icon wide32+48×2');
    group.render({ ...group.props, variant: 'connected' });
    const connected = walk(group.tree).filter((node) => node.props?.item);
    assert.ok(
        connected.every((node) => node.props.size === 'medium' && node.props.variant === 'tonal' && node.props.groupShape === 'round'),
        'connected groups cannot accidentally mix a standard item override'
    );
});
for (const [size, gap] of [
    ['extra-small', 4],
    ['small', 8],
    ['medium', 8],
    ['large', 12],
    ['extra-large', 16],
])
    check(() => {
        const runner = new Runner(SplitButton, {
            size,
            label: '',
            icon: 'send',
            onPress() {},
            actions: [{ key: 'draft', label: 'Borrador', onPress() {} }],
        });
        const mainNode = walk(runner.tree).find((node) => node.props?.testID === 'mobile-split-button-primary');
        const main = new Runner(mainNode.type, mainNode.props);
        const surface = main.nodes('Surface')[0];
        assert.equal(surface.props.mode, 'elevated');
        assert.notEqual(style(surface.props.style).overflow, 'hidden');
        const row = main.nodes('View').find((node) => node.props.onLayout);
        assert.equal(style(row.props.style).minWidth, 48, 'LeadingButtonMinWidth applies even to the XS icon-only primary');
        assert.equal(style(row.props.style).gap, gap);
    });
check(() => {
    const runner = new Runner(SplitButton, { label: 'Enviar', onPress() {}, actions: [{ key: 'draft', label: 'Borrador', onPress() {} }] });
    const menu = () => runner.nodes(Menu)[0];
    menu().props.anchor.props.onPress();
    runner.render();
    assert.equal(menu().props.visible, true);
    runner.render({ ...runner.props, actions: [] });
    assert.equal(menu().props.visible, false, 'removing alternate actions closes the popup');
    runner.render({ ...runner.props, actions: [{ key: 'later', label: 'Después', onPress() {} }] });
    assert.equal(menu().props.visible, false, 'restoring actions does not reopen a stale internal request');
});
check(() => {
    let delivered = 0;
    const runner = new Runner(SplitButton, {
        label: '1×',
        expanded: true,
        onPress() {},
        actions: [{ key: 'normal', label: '1×', selected: true, onPress: () => delivered++ }],
    });
    const menu = () => runner.nodes(Menu)[0];
    const choose = () => menu().props.children[0].props.onPress();
    const setExpanded = (expanded) => runner.render({ ...runner.props, expanded });

    assert.equal(menu().props.children[0].props.selectionMode, 'single');
    choose();
    setExpanded(false);
    assert.equal(delivered, 0, 'wait for the exit before invoking the alternate action');
    setExpanded(true);
    setExpanded(false);
    menu().props.onClosed();
    assert.equal(delivered, 0, 'reopening interrupts delivery from the previous exit');
    setExpanded(true);
    choose();
    setExpanded(false);
    menu().props.onClosed();
    menu().props.onClosed();
    assert.equal(delivered, 1, 'a completed selection delivers its action exactly once');
    runner.unmount();
});
check(() => {
    const runner = new Runner(SplitButton, {
        size: 'small',
        label: 'Enviar',
        icon: 'send',
        onPress() {},
        actions: [{ key: 'draft', label: 'Borrador', onPress() {} }],
    });
    const node = walk(runner.tree).find((node) => node.props?.testID === 'mobile-split-button-primary');
    direction = 'rtl';
    const primary = new Runner(node.type, node.props);
    const row = style(primary.nodes('View').find((node) => node.props.onLayout).props.style);
    assert.equal(row.paddingRight, 16);
    assert.equal(row.paddingLeft, 12, 'asymmetric leading padding follows Paper locale rather than the OS I18nManager');
    direction = 'ltr';
    primary.unmount();
});
check(() => {
    const wrapper = new Runner(FAB, { icon: 'pencil', elevation: 0 });
    const shellNode = walk(wrapper.tree).find((node) => node.props?.theme && node.props?.width != null);
    const shell = new Runner(shellNode.type, shellNode.props);
    assert.equal(shell.nodes('Surface')[0].props.mode, 'elevated');
    assert.equal(shell.nodes('Surface')[0].props.elevation, 0);
    shell.nodes('TouchableRipple')[0].props.onHoverIn({});
    shell.render();
    assert.equal(shell.nodes('Surface')[0].props.elevation, 0, 'rail-embedded hover must not add a shadow');
    shell.render({ ...shell.props, elevation: 3 });
    assert.equal(shell.nodes('Surface')[0].props.elevation, 4, 'standalone hover is level4 with actual shadows enabled');
});
check(() => {
    const wrapper = new Runner(FAB.Menu, { ...menuProps, expanded: true });
    const menu = new Runner(wrapper.tree.type, wrapper.tree.props);
    const viewport = menu.nodes('AnimatedView').find((node) => style(node.props.style).top === 0 && style(node.props.style).width === 368);
    assert.ok(viewport);
    assert.equal(style(viewport.props.style).right, -5);
    assert.equal(
        style(menu.nodes('ScrollView')[0].props.contentContainerStyle).paddingHorizontal,
        5,
        'net trailing offset is0, while focus retains5dp'
    );
    const itemNode = walk(menu.tree).find((node) => node.props?.revealCount);
    assert.equal(itemNode.props.maxWidth, 358, 'item receives the full390−2×16 viewport');
    const item = new Runner(itemNode.type, itemNode.props);
    assert.equal(item.nodes('Surface')[0].props.mode, 'flat');
    item.nodes('TouchableRipple')[0].props.onHoverIn({});
    item.render();
    assert.ok(
        item.nodes('View').some((node) => style(node.props.style).opacity === 0.08),
        'hover adds semantic ink state layer'
    );
    item.unmount();
    menu.unmount();
});
// FAB submenus and extended lists are explicit Mobile Design extensions. These
// contracts exercise the real component's navigation, safe geometry and bounded
// UI/RN scroll handoff; they do not claim native layout or gesture/FPS coverage.
const makeFABMenu = (props) => {
    const wrapper = new Runner(FAB.Menu, props);
    return new Runner(wrapper.tree.type, wrapper.tree.props);
};
const fabLevelItems = (menu) => walk(menu.tree).filter((node) => node.props?.revealCount && node.props.item.key !== '__back');
const fabBack = (menu) => walk(menu.tree).find((node) => node.props?.testID === 'mobile-fab-menu-back');
const flushRNJobs = () => {
    while (rnJobs.length) rnJobs.shift()();
};
const extendedFABItems = (onPress = () => {}) => [
    {
        key: 'more',
        label: 'Más opciones',
        icon: 'more_horiz',
        items: Array.from({ length: 9 }, (_, index) => ({
            key: `option-${index}`,
            label: `Opción ${index + 1}`,
            onPress,
        })),
    },
    { key: 'direct', label: 'Acción directa', onPress },
];
check(() => {
    for (platform of ['android', 'ios']) {
        const calls = [];
        const menu = makeFABMenu({
            ...menuProps,
            expanded: true,
            overflow: 'scroll',
            maxHeight: 240,
            items: extendedFABItems(() => calls.push('action'))[0].items,
            onDismiss: () => calls.push('close'),
        });
        const scroll = menu.nodes('ScrollView')[0];
        // Android ReactScrollView.onTouchEvent rejects BOX_NONE even after it
        // intercepts a drag from a pill. The scrolling viewport must own touches.
        assert.equal(scroll.props.pointerEvents, 'auto', `${platform}: the long action list accepts native drag gestures`);
        assert.equal(scroll.props.scrollEnabled, true);
        const root = menu.nodes('View').find((node) => node.props.onAccessibilityEscape);
        assert.equal(root.props.pointerEvents, 'box-none', 'the full-screen wrapper still passes touches outside the list');
        const commands = [];
        scroll.props.ref.current = { scrollToEnd: (options) => commands.push(options) };
        scroll.props.onLayout({ nativeEvent: { layout: { height: 240 } } });
        scroll.props.onContentSizeChange(300, 700);
        assert.ok(commands.length > 0, 'opening positions the list beside the FAB');
        commands.length = 0;
        scroll.props.onTouchStart();
        scroll.props.onScrollBeginDrag();
        scroll.props.onScroll({ contentOffset: { y: 160 } });
        scroll.props.onContentSizeChange(300, 710);
        scroll.props.onLayout({ nativeEvent: { layout: { height: 240 } } });
        assert.equal(commands.length, 0, 'a layout update cannot snap the list back after a user drag');
        assert.deepEqual(calls, [], 'dragging neither activates an action nor dismisses the menu');
        assert.equal(
            menu.nodes('View').some((node) => node.props.testID === 'mobile-fab-menu-scroll-controls'),
            false
        );
        menu.render({ ...menu.props, expanded: false });
        assert.ok(
            menu.nodes('AnimatedView').some((node) => node.props.pointerEvents === 'none' && node.props.accessibilityElementsHidden),
            'a closed action stack cannot intercept gestures'
        );
        menu.unmount();
        flushRNJobs();
    }
    platform = 'ios';
});
check(() => {
    const items = extendedFABItems();
    const selected = resolveFABMenuPath(items, ['more']);
    assert.equal(selected.items.length, 9);
    assert.equal(selected.title, 'Más opciones');
    assert.deepEqual([...selected.path], ['more']);
    const localized = [{ ...items[0], label: 'More options' }, items[1]];
    assert.equal(resolveFABMenuPath(localized, ['more']).items.length, 9, 'stable keys preserve a branch when labels change');
    assert.equal(resolveFABMenuPath([{ ...items[0], disabled: true }, items[1]], ['more']).path.length, 0);
    assert.equal(resolveFABMenuPath([{ ...items[0], items: [] }, items[1]], ['more']).path.length, 0);
    assert.equal(
        resolveFABMenuPath(items, ['more', 'removed']).path.length,
        1,
        'removed descendants fall back to the nearest live ancestor'
    );
});
check(() => {
    for (const fixture of [
        { width: 390, height: 844, insets: { top: 62, bottom: 34, left: 0, right: 0 }, margin: 16, triggerHeight: 56 },
        { width: 844, height: 390, insets: { top: 0, bottom: 21, left: 62, right: 62 }, margin: 16, triggerHeight: 96 },
        { width: 320, height: 150, insets: { top: 44, bottom: 34, left: 0, right: 0 }, margin: 16, triggerHeight: 96 },
    ]) {
        const viewport = fabMenuViewport(fixture);
        assert.ok(viewport.height >= 0 && viewport.width >= 0);
        assert.ok(viewport.width + fixture.insets.left + fixture.insets.right + fixture.margin * 2 <= fixture.width);
        assert.ok(
            viewport.height <=
                Math.max(0, fixture.height - fixture.insets.top - fixture.insets.bottom - fixture.margin * 2 - fixture.triggerHeight - 8)
        );
    }
    const normal = { width: 390, height: 844, insets: { top: 62, bottom: 34, left: 0, right: 0 }, margin: 16, triggerHeight: 56 };
    assert.equal(fabMenuViewport({ ...normal, maxHeight: 240 }).height, 240, 'a requested cap excludes the close FAB');
    assert.equal(fabMenuViewport({ ...normal, maxHeight: 900 }).height, 652, 'a cap cannot escape the safe viewport');
    assert.equal(fabMenuViewport({ ...normal, maxHeight: -20 }).height, 0);
    assert.equal(fabMenuViewport({ ...normal, maxHeight: NaN }).height, 652, 'nonfinite caps fall back to safe dimensions');
});
check(() => {
    const calls = [];
    const menu = makeFABMenu({
        ...menuProps,
        expanded: true,
        items: extendedFABItems(() => calls.push('leaf')),
        onDismiss: () => calls.push('close'),
    });
    const oldDirect = fabLevelItems(menu)[1];
    fabLevelItems(menu)[0].props.onPress({});
    oldDirect.props.onPress({});
    menu.render();
    assert.equal(calls.length, 0, 'opening a branch neither closes the FAB nor activates a queued old root row');
    assert.equal(fabLevelItems(menu).length, 9, 'an opt-in branch can safely show more than six actions');
    assert.equal(menu.nodes('ScrollView')[0].props.scrollEnabled, true);
    assert.equal(menu.nodes('ScrollView')[0].props.showsVerticalScrollIndicator, false, 'overflow indicator is a separate opt-in');
    assert.ok(fabBack(menu));
    assert.equal(menu.nodes(Menu).length, 0, 'the submenu stays inside the action pile');
    assert.equal(walk(menu.tree).filter((node) => String(node.type).includes('Dialog')).length, 0);
    oldDirect.props.onPress({});
    assert.equal(calls.length, 0, 'a stale handler from another committed level cannot act');
    fabBack(menu).props.onPress({});
    menu.render();
    assert.equal(fabLevelItems(menu).length, 2);
    assert.equal(fabBack(menu), undefined);
    menu.unmount();
});
check(() => {
    let closed = 0;
    const inner = [{ key: 'leaf', label: 'Continuar', onPress() {} }];
    const items = [{ key: 'first', label: 'Primero', items: [{ key: 'second', label: 'Segundo', items: inner }] }, menuProps.items[1]];
    const menu = makeFABMenu({ ...menuProps, expanded: true, items, onDismiss: () => closed++ });
    fabLevelItems(menu)[0].props.onPress({});
    menu.render();
    fabLevelItems(menu)[0].props.onPress({});
    menu.render();
    assert.equal(fabLevelItems(menu)[0].props.item.label, 'Continuar');
    Array.from(backHandlers).at(-1)();
    menu.render();
    assert.equal(fabLevelItems(menu)[0].props.item.label, 'Segundo', 'hardware Back returns exactly one branch');
    menu.nodes('View')
        .find((node) => node.props.onAccessibilityEscape)
        .props.onAccessibilityEscape();
    menu.render();
    assert.equal(fabLevelItems(menu)[0].props.item.label, 'Primero');
    menu.nodes('View')
        .find((node) => node.props.onAccessibilityEscape)
        .props.onAccessibilityEscape();
    assert.equal(closed, 1, 'escape dismisses only after reaching the root');
    menu.unmount();
});
check(() => {
    const items = extendedFABItems();
    const menu = makeFABMenu({ ...menuProps, expanded: true, items });
    fabLevelItems(menu)[0].props.onPress({});
    menu.render();
    menu.render({ ...menu.props, items: [{ ...items[0], disabled: true }, items[1]] });
    assert.equal(fabLevelItems(menu).length, 2, 'disabling the current parent removes inaccessible descendants');
    assert.equal(fabBack(menu), undefined);
    menu.render({ ...menu.props, items });
    assert.equal(fabLevelItems(menu).length, 2, 'restoring a removed branch cannot reopen stale state');
    menu.unmount();
});
check(() => {
    const calls = [];
    const items = extendedFABItems(() => calls.push('leaf'));
    const menu = makeFABMenu({ ...menuProps, expanded: true, items, onDismiss: () => calls.push('close') });
    fabLevelItems(menu)[0].props.onPress({});
    menu.render();
    const action = fabLevelItems(menu)[0];
    action.props.onPress({});
    action.props.onPress({});
    assert.deepEqual(calls, ['leaf', 'close'], 'a leaf acts once and closes after its callback, including rapid duplicate taps');
    menu.render({ ...menu.props, expanded: false });
    assert.equal(fabLevelItems(menu).length, 9, 'closing retains the current rows throughout their outgoing animation');
    action.props.onPress({});
    assert.equal(calls.length, 2, 'a queued press cannot execute after closing');
    menu.render({ ...menu.props, expanded: true });
    assert.equal(fabLevelItems(menu).length, 2, 'every new opening starts at the root');
    fabLevelItems(menu)[1].props.onPress({});
    assert.deepEqual(calls, ['leaf', 'close', 'leaf', 'close'], 'reopening releases the old activation lock');
    menu.unmount();
});
check(() => {
    let calls = 0;
    const menu = makeFABMenu({
        ...menuProps,
        expanded: true,
        items: [
            { key: 'empty', label: 'Vacío', items: [] },
            { key: 'disabled', label: 'No disponible', disabled: true, items: extendedFABItems() },
        ],
        onDismiss: () => calls++,
    });
    for (const node of fabLevelItems(menu)) {
        node.props.onPress({});
        const row = new Runner(node.type, node.props);
        assert.equal(row.nodes('TouchableRipple')[0].props.disabled, true);
        assert.equal(row.nodes('TouchableRipple')[0].props.accessibilityState.disabled, true);
        row.unmount();
    }
    menu.render();
    assert.equal(calls, 0);
    assert.equal(fabBack(menu), undefined);
    menu.render({ ...menu.props, trigger: { ...menu.props.trigger, visible: false } });
    const root = menu.nodes('View').find((node) => node.props.onAccessibilityEscape);
    root.props.onAccessibilityEscape();
    assert.equal(calls, 0, 'a hidden menu does not consume accessibility actions');
    menu.unmount();
});
check(() => {
    const menu = makeFABMenu({ ...menuProps, expanded: true, items: extendedFABItems(), maxHeight: 100 });
    fabLevelItems(menu)[0].props.onPress({});
    menu.render();
    const scroll = menu.nodes('ScrollView')[0];
    assert.ok(
        walk(scroll).some((node) => node.props?.testID === 'mobile-fab-menu-back'),
        'short viewports scroll Back with the content'
    );
    const stack = menu.nodes('AnimatedView').find((node) => style(node.props.style).height === 100);
    assert.equal(style(stack.props.style).bottom, 104, 'the complete extended pile stays above the fixed large trigger');
    assert.equal(style(stack.props.style).width, 368);
    menu.unmount();
});
check(() => {
    // Resolve the actual differently sized MenuItem surfaces and their rendered
    // alignSelf/gutters. This bounded one-axis flex calculation tests the shared
    // anchor, not native Yoga pixels or the animation between measured endpoints.
    const measuredItem = (node, textWidth) => {
        const item = new Runner(node.type, node.props);
        item.nodes('Text')
            .find((entry) => entry.props.onTextLayout)
            .props.onTextLayout({
                nativeEvent: { lines: [{ width: textWidth, height: 24 }] },
            });
        item.render();
        const width = style(item.nodes('Surface')[0].props.style).width;
        const align = style(item.nodes('View')[0].props.style).alignSelf;
        item.nodes('TouchableRipple')[0].props.onFocus({});
        item.render();
        const focus = style(item.nodes('Surface')[0].props.style);
        assert.equal(focus.outlineWidth + focus.outlineOffset, 5, 'real item focus retains its full external gutter');
        assert.notEqual(focus.overflow, 'hidden', 'the item shadow is not clipped');
        item.unmount();
        return { width, align };
    };
    const anchor = (item, width, gutter) => (item.align === 'center' ? width / 2 : item.align === 'flex-end' ? width - gutter : gutter);
    for (direction of ['ltr', 'rtl']) {
        for (const maxHeight of [240, 100]) {
            const menu = makeFABMenu({ ...menuProps, expanded: true, items: extendedFABItems(), maxHeight });
            fabLevelItems(menu)[0].props.onPress({});
            menu.render();
            const scroll = menu.nodes('ScrollView')[0];
            const back = fabBack(menu);
            const action = fabLevelItems(menu)[0];
            const stack = menu.nodes('AnimatedView').find((node) => [node.props.children].flat(Infinity).includes(scroll));
            const stackWidth = style(stack.props.style).width;
            const optionGutter = style(scroll.props.contentContainerStyle).paddingHorizontal;
            const insideScroll = walk(scroll).includes(back);
            assert.equal(insideScroll, maxHeight === 100, 'short viewports retain the integrated Back fallback');
            const frame = insideScroll ? undefined : menu.nodes('View').find((node) => node.props.children === back);
            const backGutter = insideScroll ? optionGutter : (style(frame.props.style).paddingHorizontal ?? 0);
            if (frame) assert.notEqual(style(frame.props.style).overflow, 'hidden', 'the fixed Back wrapper preserves focus/shadow');
            assert.equal(backGutter, optionGutter, `${direction}: fixed and scrolling Back use the options’ content edge`);
            assert.equal(stackWidth - optionGutter * 2, action.props.maxWidth, 'both gutters remain outside the safe item viewport');
            assert.equal(back.props.maxWidth, action.props.maxWidth);
            assert.equal(back.props.item.icon, direction === 'rtl' ? 'arrow_forward' : 'arrow_back');
            const optionGeometry = measuredItem(action, 120);
            const backGeometry = measuredItem(back, 75);
            assert.equal(optionGeometry.align, backGeometry.align);
            assert.equal(
                anchor(optionGeometry, stackWidth, optionGutter),
                anchor(backGeometry, stackWidth, backGutter),
                'different pill widths share the same logical anchor'
            );
            for (const [geometry, gutter] of [
                [optionGeometry, optionGutter],
                [backGeometry, backGutter],
            ]) {
                const position = anchor(geometry, stackWidth, gutter);
                const left =
                    geometry.align === 'center'
                        ? position - geometry.width / 2
                        : geometry.align === 'flex-end'
                          ? position - geometry.width
                          : position;
                assert.ok(
                    left >= gutter && left + geometry.width <= stackWidth - gutter,
                    'the visible pill remains inside both safe gutters'
                );
            }
            menu.unmount();
            flushRNJobs();
        }
    }
    direction = 'ltr';
});
check(() => {
    for (const [variant, container, content] of [
        ['tonalPrimary', 'primaryContainer', 'onPrimaryContainer'],
        ['secondary', 'secondaryContainer', 'onSecondaryContainer'],
        ['tonalTertiary', 'tertiaryContainer', 'onTertiaryContainer'],
    ]) {
        const menu = makeFABMenu({
            ...menuProps,
            trigger: { ...menuProps.trigger, variant },
            expanded: true,
            items: extendedFABItems()[0].items,
            overflow: 'scroll',
            maxHeight: 240,
        });
        const scroll = menu.nodes('ScrollView')[0];
        scroll.props.onLayout({ nativeEvent: { layout: { height: 240 } } });
        scroll.props.onContentSizeChange(300, 700);
        menu.render();
        flushRNJobs();
        menu.render();
        assert.equal(
            menu.nodes('View').some((node) => node.props.testID === 'mobile-fab-menu-scroll-controls'),
            false
        );
        assert.equal(
            menu.nodes('Text').some((node) => node.props.testID === 'mobile-fab-menu-count'),
            false
        );
        const item = fabLevelItems(menu)[0];
        const pill = new Runner(item.type, item.props);
        assert.equal(style(pill.nodes('Surface')[0].props.style).backgroundColor, theme.colors[container]);
        assert.equal(style(pill.nodes('Text')[0].props.style).color, theme.colors[content]);
        pill.unmount();
        menu.unmount();
        flushRNJobs();
    }
});
check(() => {
    const menu = makeFABMenu({
        ...menuProps,
        expanded: true,
        items: extendedFABItems()[0].items,
        overflow: 'scroll',
        maxHeight: 240,
    });
    const commands = [];
    let scroll = menu.nodes('ScrollView')[0];
    scroll.props.ref.current = {
        scrollTo: (options) => commands.push(options),
        scrollToEnd: (options) => commands.push({ end: true, ...options }),
    };
    scroll.props.onLayout({ nativeEvent: { layout: { height: 240 } } });
    scroll.props.onContentSizeChange(300, 700);
    menu.render();
    flushRNJobs();
    menu.render();
    assert.equal(
        menu.nodes('View').some((node) => node.props.testID === 'mobile-fab-menu-scroll-controls'),
        false
    );
    assert.equal(
        menu.nodes('Text').some((node) => node.props.testID === 'mobile-fab-menu-count'),
        false
    );
    assert.equal(
        menu.nodes('ScrollView')[0].props.showsVerticalScrollIndicator,
        false,
        'overflow keeps scrolling without a visible scrollbar'
    );
    assert.ok(menu.nodes('ScrollView')[0].props.accessibilityActions.some((action) => action.name === 'scrollForward'));
    scroll = menu.nodes('ScrollView')[0];
    scroll.props.onLayout({ nativeEvent: { layout: { height: 192 } } });
    scroll.props.onScroll({ contentOffset: { y: 0 } });
    menu.flushUI();
    flushRNJobs();
    menu.render();
    menu.nodes('ScrollView')[0].props.onAccessibilityAction({ nativeEvent: { actionName: 'scrollForward' } });
    assert.ok(Math.abs(commands.at(-1).y - 153.6) < 0.001, 'accessible scrolling advances a viewport page');
    assert.equal(commands.at(-1).animated, true);
    scroll.props.onScroll({ contentOffset: { y: 508 } });
    menu.flushUI();
    flushRNJobs();
    menu.render();
    menu.nodes('ScrollView')[0].props.onAccessibilityAction({ nativeEvent: { actionName: 'scrollForward' } });
    assert.equal(commands.at(-1).y, 508, 'accessible scrolling clamps at the final page');
    scroll = menu.nodes('ScrollView')[0];
    theme.animation.scale = 0;
    menu.render();
    menu.nodes('ScrollView')[0].props.onAccessibilityAction({ nativeEvent: { actionName: 'scrollBackward' } });
    assert.equal(commands.at(-1).animated, false, 'accessible scrolling honors effective reduced motion');
    const stale = menu.nodes('ScrollView')[0].props.onAccessibilityAction;
    menu.unmount();
    const before = commands.length;
    stale({ nativeEvent: { actionName: 'scrollForward' } });
    assert.equal(commands.length, before, 'queued accessible actions do nothing after unmount');
    theme.animation.scale = 1;
    flushRNJobs();
});
check(() => {
    const menu = makeFABMenu({
        ...menuProps,
        expanded: true,
        items: extendedFABItems()[0].items,
        overflow: 'scroll',
        maxHeight: 240,
    });
    const scroll = menu.nodes('ScrollView')[0];
    scroll.props.onLayout({ nativeEvent: { layout: { height: 240 } } });
    scroll.props.onContentSizeChange(300, 700);
    menu.render();
    flushRNJobs();
    menu.render();
    scroll.props.onScroll({ contentOffset: { y: 10 } });
    menu.flushUI();
    flushRNJobs();
    menu.render();
    const before = rnJobs.length;
    for (const y of [11, 12, 13, 14, 15]) {
        scroll.props.onScroll({ contentOffset: { y } });
        menu.flushUI();
    }
    assert.equal(rnJobs.length, before, 'scroll frames with the same edge availability do not dispatch React updates');
    menu.render({ ...menu.props, expanded: false });
    assert.equal(
        menu.nodes('View').some((node) => node.props.testID === 'mobile-fab-menu-scroll-controls'),
        false
    );
    menu.unmount();
    flushRNJobs();
    assert.equal(menu.dirty, false, 'queued scroll notifications cannot update an unmounted menu');
});
check(() => {
    platform = 'web';
    const menu = makeFABMenu({ ...menuProps, expanded: true, items: extendedFABItems() });
    assert.equal(menu.nodes(Menu).length, 0, 'web extensions use the same inline pile rather than a nested popup');
    fabLevelItems(menu)[0].props.onPress({});
    menu.render();
    let prevented = 0;
    const root = menu.nodes('View').find((node) => node.props.onKeyDown);
    root.props.onKeyDown({ key: 'Escape', preventDefault: () => prevented++ });
    menu.render();
    assert.equal(fabLevelItems(menu).length, 2);
    assert.equal(prevented, 1);
    menu.unmount();
    platform = 'ios';
});
const segmentProps = {
    option: { value: 'a', label: 'Día' },
    theme,
    selected: false,
    disabled: false,
    density: 'regular',
    first: true,
    last: false,
    isRTL: false,
    multiSelect: false,
    onPress() {},
};
const makeSegment = (props = {}) => {
    const parent = new Runner(SegmentedButtons, {
        value: 'a',
        onValueChange() {},
        buttons: [segmentProps.option, { value: 'b', label: 'Semana' }],
    });
    const node = walk(parent.tree).find((node) => node.props?.option);
    return new Runner(node.type, { ...node.props, ...segmentProps, ...props });
};
for (const [density, height] of [
    ['regular', 40],
    ['small', 36],
    ['medium', 32],
    ['high', 28],
])
    check(() => {
        const runner = makeSegment({ density });
        const ripple = runner.nodes('TouchableRipple')[0];
        assert.equal(style(runner.tree.props.style).minHeight, 48);
        assert.equal(style(ripple.props.style).height, height);
        assert.equal(style(ripple.props.style).overflow, 'hidden', 'ripple clips to the visual height, not the48dp target');
        assert.equal(ripple.props.hitSlop.top, (48 - height) / 2);
        assert.equal(ripple.props.rippleColor, 'onSurface@0.1');
        ripple.props.onFocus({});
        runner.render();
        assert.ok(runner.nodes('View').some((node) => style(node.props.style).borderWidth === 3));
        assert.ok(
            !walk(runner.nodes('TouchableRipple')[0]).some((node) => style(node.props?.style).borderWidth === 3),
            'focus stays outside the clipped ripple'
        );
    });
check(() => {
    const runner = makeSegment({ option: { value: 'a', label: 'Día', icon: 'calendar' } });
    const before = requests.length;
    runner.render({ ...runner.props, selected: true });
    const added = requests.slice(before);
    assert.equal(
        added.filter((request) => request.config.stiffness === 800).length,
        1,
        'only the label offset uses FastSpatial when replacing an icon'
    );
    assert.equal(
        added.filter((request) => request.config.stiffness === 1600).length,
        1,
        'the icon-to-check transition crossfades with DefaultEffects'
    );
    const checkNode = runner
        .nodes('AnimatedView')
        .find((node) => walk(node).some((child) => child.type === 'Icon' && child.props.source === 'check'));
    assert.equal(style(checkNode.props.style).transform[0].scale, 1);
    runner.unmount();
});
check(() => {
    const runner = makeSegment({ isRTL: true, first: false, last: true, option: { value: 'a', label: 'Día', icon: 'calendar' } });
    assert.equal(style(runner.tree.props.style).marginRight, -1);
    assert.equal(style(runner.tree.props.style).marginLeft, 0);
    assert.ok(
        runner
            .nodes('View')
            .some(
                (node) =>
                    style(node.props.style).width === 18 &&
                    style(node.props.style).marginLeft === 8 &&
                    style(node.props.style).marginRight === 0
            ),
        'icon/label gap remains on the inside in a local RTL preview'
    );
    runner.unmount();
});
check(() => {
    const runner = makeSegment();
    let before = requests.length;
    runner.render({ ...runner.props, selected: true });
    assert.equal(
        requests.slice(before).filter((request) => request.config.stiffness === 800).length,
        2,
        'new check and label enter with FastSpatial'
    );
    const checkNode = runner
        .nodes('AnimatedView')
        .find((node) => walk(node).some((child) => child.type === 'Icon' && child.props.source === 'check'));
    assert.equal(style(checkNode.props.style).transformOrigin, '0% 100%');
    before = requests.length;
    runner.render({ ...runner.props, selected: false });
    assert.equal(requests.slice(before).length, 1, 'ExitTransition.None: only the label moves when the check is removed');
    assert.equal(requests.at(-1).to, -13);
    runner.unmount();
    assert.ok(
        runner.hooks.filter((slot) => slot?.get).every((shared) => !shared.animation),
        'all three shared animations cancel on unmount'
    );
});
check(() => {
    const runner = new Runner(SegmentedButtons, {
        value: 'a',
        onValueChange() {},
        buttons: [
            { value: 'a', label: 'Día' },
            { value: 'b', label: 'Semana' },
        ],
    });
    runner
        .nodes('Text')
        .filter((node) => node.props.onTextLayout)
        .forEach((node) => node.props.onTextLayout({ nativeEvent: { lines: [{ width: node.props.children === 'Día' ? 21 : 50 }] } }));
    runner.render();
    assert.equal(style(runner.tree.props.style).width, 201, '(51label+12×2+18glyph+8gap)×2−1overlap');
    assert.equal(style(runner.tree.props.style).maxWidth, '100%');
    assert.equal(style(runner.tree.props.style).alignSelf, 'flex-start', 'intrinsic row does not stretch into a tablet pane');
});
check(() => {
    theme.animation.scale = 0;
    const before = requests.length;
    const runner = makeSegment();
    runner.render({ ...runner.props, selected: true });
    assert.equal(requests.length, before, 'resolved reduced motion starts no Segmented spring');
    runner.unmount();
    theme.animation.scale = 1;
});
check(() => {
    const enabled = makeFABMenu({ ...menuProps, expanded: true, scrollIndicators: { vertical: true } });
    const sibling = makeFABMenu({ ...menuProps, expanded: true });
    assert.equal(enabled.nodes('ScrollView')[0].props.showsVerticalScrollIndicator, true);
    assert.equal(enabled.nodes('ScrollView')[0].props.showsHorizontalScrollIndicator, false);
    assert.equal(
        sibling.nodes('ScrollView')[0].props.showsVerticalScrollIndicator,
        false,
        'opting in on one FAB cannot change its sibling'
    );
    enabled.render({ ...enabled.props, scrollIndicators: { horizontal: true } });
    assert.equal(
        enabled.nodes('ScrollView')[0].props.showsVerticalScrollIndicator,
        false,
        'omitted axes return to their own hidden default'
    );
    assert.equal(enabled.nodes('ScrollView')[0].props.showsHorizontalScrollIndicator, true);
    enabled.unmount();
    sibling.unmount();
    flushRNJobs();
});
check(() => {
    const options = { vertical: true, horizontal: false };
    const split = new Runner(SplitButton, {
        label: 'Crear lista',
        onPress() {},
        actions: [{ key: 'select', label: 'Seleccionar', onPress() {} }],
        scrollIndicators: options,
    });
    assert.equal(split.nodes(Menu)[0].props.scrollIndicators, options, 'the split forwards only its own options to its menu');
    split.unmount();
});
console.log(
    `OK: ${checks} real action-component contracts; official geometry/colors/springs, RTL, false-loading spacing, unclipped shadows, group treatments, embedded FAB, aligned menu and Segmented enter/crossfade/exit/focus/width/cleanup.`
);
