/**
 * Runs the real ButtonGroup/GroupItem layout contracts against fractional native-text
 * measurements at a390dp viewport. Minimal hook/shared-value/JSX doubles inspect the
 * actual width, icon, border and animated padding props. No Yoga/font rendering/FPS.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const requireShared = require('./require-mobile-design-shared.cjs');
const root = path.resolve(__dirname, '..');
let active;
let fontScale = 1;
let direction = 'ltr';
let platform = 'ios';
let cases = 0;
let springCalls = 0;
const springConfigs = [];
const theme = {
    animation: { scale: 1 },
    fonts: {
        labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
        titleMedium: { fontSize: 16, lineHeight: 24 },
        headlineSmall: { fontSize: 24, lineHeight: 32 },
        headlineLarge: { fontSize: 32, lineHeight: 40 },
    },
    shapes: { corner: { small: 8, extraSmall: 4, medium: 12, largeIncreased: 20 } },
    colors: Object.fromEntries(
        [
            'primary',
            'onPrimary',
            'secondary',
            'onSecondary',
            'secondaryContainer',
            'onSecondaryContainer',
            'surfaceContainer',
            'surfaceContainerLow',
            'onSurface',
            'onSurfaceVariant',
            'outlineVariant',
            'inverseSurface',
            'inverseOnSurface',
            'stateLayerPressed',
        ].map((name) => [name, name])
    ),
    motion: { spring: { fast: { spatial: { stiffness: 800, damping: 0.6 } }, default: { effects: { stiffness: 1600, damping: 1 } } } },
};
const hook = (create) => {
    const i = active.cursor++;
    return active.hooks[i] ?? (active.hooks[i] = create());
};
const equal = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
function effect(queue, fn, deps) {
    const slot = hook(() => ({}));
    if (!equal(slot.deps, deps)) {
        slot.deps = deps;
        active[queue].push(() => {
            slot.cleanup?.();
            slot.cleanup = fn();
        });
    }
}
const React = {
    useRef(value) {
        return hook(() => ({ current: value }));
    },
    useState(initial) {
        const owner = active;
        const slot = hook(() => ({ value: typeof initial === 'function' ? initial() : initial }));
        return [
            slot.value,
            (v) => {
                const next = typeof v === 'function' ? v(slot.value) : v;
                if (!Object.is(slot.value, next)) {
                    slot.value = next;
                    owner.dirty = true;
                }
            },
        ];
    },
    useMemo(fn) {
        return fn();
    },
    useEffect: (fn, deps) => effect('effects', fn, deps),
    useLayoutEffect: (fn, deps) => effect('layoutEffects', fn, deps),
};
const reanimated = {
    View: 'AnimatedView',
    createAnimatedComponent: (component) => component,
    useSharedValue(value) {
        return hook(() => ({
            value,
            get() {
                return this.value;
            },
            set(next) {
                this.value = next;
            },
        }));
    },
    useDerivedValue: (compute) => ({ get: compute }),
    useAnimatedProps: (compute) => ({ compute }),
    useAnimatedStyle: (compute) => ({ compute }),
    ReduceMotion: { Never: 'never' },
    useAnimatedReaction() {},
    cancelAnimation() {},
    withSpring: (value, config) => {
        assert.equal(config.reduceMotion, 'never', 'the resolved Paper preference, rather than the OS default, governs animations');
        springCalls++;
        springConfigs.push(config);
        return value;
    },
};
reanimated.default = reanimated;
const jsx = (type, props, key) => ({
    type,
    props: type === 'Surface' && props.geometry ? { ...props, style: [props.style, props.geometry] } : props,
    key,
});
const paper = Object.fromEntries(['Icon', 'IconButton', 'Surface', 'Text', 'TouchableRipple'].map((name) => [name, name]));
paper.useTheme = () => theme;
paper.useLocale = () => ({ direction });
const modules = {
    '@mobile-design/tokens': requireShared('@mobile-design/tokens'),
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native-paper': paper,
    'react-native-reanimated': reanimated,
    'react-native': {
        View: 'View',
        Platform: {
            get OS() {
                return platform;
            },
        },
        PixelRatio: { get: () => 3 },
        useWindowDimensions: () => ({ width: 438, height: 956, fontScale }),
    },
    '../color': { withAlpha: (value) => value },
    './menu': { Menu: Object.assign('Menu', {}) },
};
// This suite delimits the overflow button/tooltip; actions executes the real IconButton.
modules['./icon-button'] = { IconButton: 'IconButton' };
modules['./tooltip'] = { Tooltip: 'Tooltip' };
modules['./action-surface'] = { AnimatedActionSurface: 'Surface' };
const rippleExports = {};
vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(root, 'packages/mobile-design/src/ripple.tsx'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    { exports: rippleExports, require: (name) => modules[name] }
);
modules['../ripple'] = rippleExports;
// This geometry suite commits UI transactions immediately. The actions suite
// separately exercises delayed RN writes and queued short-tap press/release jobs.
modules['react-native-worklets'] = { scheduleOnUI: (callback, ...args) => callback(...args) };
modules['./menu'].Menu = Object.assign(function Menu() {}, { Item: 'MenuItem' });
const pressScopeExports = {};
vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(root, 'packages/mobile-design/src/components/press-scope.ts'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports: pressScopeExports, require: (name) => modules[name] }
);
modules['./press-scope'] = pressScopeExports;
const exportsObject = {};
const code = ts.transpileModule(fs.readFileSync(path.join(root, 'packages/mobile-design/src/components/button-group.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
vm.runInNewContext(code, {
    exports: exportsObject,
    require: (name) => {
        assert.ok(modules[name], name);
        return modules[name];
    },
});
const walk = (node) => (!node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)]);
function style(value) {
    return Array.isArray(value) ? Object.assign({}, ...value.map(style)) : value?.compute ? value.compute() : (value ?? {});
}
class Runner {
    constructor(component, props) {
        Object.assign(this, { component, props, hooks: [] });
        this.render();
    }
    render(props = this.props) {
        this.props = props;
        do {
            active = this;
            this.cursor = 0;
            this.dirty = false;
            this.layoutEffects = [];
            this.effects = [];
            this.tree = this.component(props);
            this.layoutEffects.forEach((fn) => fn());
            this.effects.forEach((fn) => fn());
        } while (this.dirty);
        return this;
    }
    measure(widths, width = 390) {
        this.tree.props.onLayout({ nativeEvent: { layout: { width } } });
        const labels = walk(this.tree).filter((node) => node.props?.onTextLayout);
        labels.forEach((node) => {
            const width = widths[node.props.children];
            // Yoga's onLayout can round down; typographic metrics preserve the fraction.
            node.props.onLayout({ nativeEvent: { layout: { width: Math.floor(width * 3) / 3 } } });
            node.props.onTextLayout({ nativeEvent: { lines: [{ width }] } });
        });
        return this.render();
    }
    items() {
        return walk(this.tree).filter((node) => node.props?.item && node.props?.presses);
    }
}
function labelBudget(node, measured) {
    const child = new Runner(node.type, node.props);
    const container = style(child.tree.props.style);
    const ripple = walk(child.tree).find((n) => n.type === 'TouchableRipple');
    const content = style(ripple.props.children.props.style);
    const icon = walk(child.tree).find((n) => n.type === 'Icon');
    const available =
        container.width - 2 * (container.borderWidth ?? 0) - 2 * content.paddingHorizontal - (icon ? icon.props.size + content.gap : 0);
    assert.ok(available + 1e-8 >= measured, `${node.props.item.label}: glyph width${measured} exceeds slot${available}`);
    if (icon) assert.equal(icon.props.size, 20, 'official ButtonSmallTokens.IconSize');
    cases++;
    return { width: container.width, padding: content.paddingHorizontal };
}
const standardItems = [
    { value: 'edit', label: 'Editar', icon: 'pencil' },
    { value: 'share', label: 'Compartir', icon: 'share-variant' },
    { value: 'save', label: 'Guardar', icon: 'content-save-outline' },
];
const standardMeasures = { Editar: 34.01, Compartir: 60.55, Guardar: 49.44 };
const standard = new Runner(exportsObject.ButtonGroup, { items: standardItems }).measure(standardMeasures);
assert.equal(standard.items().length, 3, 'three intrinsic buttons fit at390dp without artificial viewport growth');
const baseTotal = standard.items().reduce((sum, node) => sum + labelBudget(node, standardMeasures[node.props.item.label]).width, 0);
for (const pressedIndex of [0, 1, 2])
    for (const fraction of [0.25, 0.5, 0.75, 1]) {
        const nodes = standard.items();
        nodes[0].props.presses.set(nodes.map((_, i) => (i === pressedIndex ? fraction : 0)));
        const total = nodes.reduce((sum, node) => sum + labelBudget(node, standardMeasures[node.props.item.label]).width, 0);
        assert.ok(Math.abs(total - baseTotal) < 1e-6, 'pressing conserves group width');
    }
const connectedItems = [
    { value: 'day', label: 'Día' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
];
const connectedMeasures = { Día: 20.44, Semana: 51.21, Mes: 27.66 };
const connected = new Runner(exportsObject.ButtonGroup, {
    items: connectedItems,
    variant: 'connected',
    value: 'day',
    buttonVariant: 'outlined',
}).measure(connectedMeasures);
const before = connected.items().map((node) => node.props.width);
assert.equal(before.length, 3);
for (const node of connected.items()) labelBudget(node, connectedMeasures[node.props.item.label]);
connected.render({ ...connected.props, value: 'week' });
assert.deepEqual(
    connected.items().map((node) => node.props.width),
    before,
    'selected check icon has a stable reserved slot'
);
for (const node of connected.items()) labelBudget(node, connectedMeasures[node.props.item.label]);
direction = 'rtl';
connected.render();
for (const node of connected.items()) labelBudget(node, connectedMeasures[node.props.item.label]);
fontScale = 2;
connected.render().measure({ Día: 40.88, Semana: 102.42, Mes: 55.32 });
assert.ok(connected.items().length < 3, 'large type uses overflow rather than crushing labels');
for (const node of connected.items()) labelBudget(node, { Día: 40.88, Semana: 102.42, Mes: 55.32 }[node.props.item.label]);
const renamed = [{ value: 'day', label: 'Día completo' }];
connected.render({ ...connected.props, items: renamed }).measure({ 'Día completo': 140.42 });
assert.ok(connected.items()[0].props.width > before[0], 'same value with a changed label is measured again');
labelBudget(connected.items()[0], 140.42);
const splitExports = {};
const splitCode = ts.transpileModule(fs.readFileSync(path.join(root, 'packages/mobile-design/src/components/split-button.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
vm.runInNewContext(splitCode, {
    exports: splitExports,
    require: (name) => {
        assert.ok(modules[name], name);
        return modules[name];
    },
});
const split = new Runner(splitExports.SplitButton, {
    label: 'Guardar',
    onPress() {},
    actions: [{ key: 'other', label: 'Otra acción', onPress() {} }],
});
const halfProps = walk(split.tree).find((node) => node.props?.testID === 'mobile-split-button-primary');
const half = new Runner(halfProps.type, halfProps.props);
const halfRipple = walk(half.tree).find((node) => node.type === 'TouchableRipple');
const beforePress = springCalls;
halfRipple.props.onPressIn();
halfRipple.props.onPressOut();
assert.equal(springCalls - beforePress, 2, 'both SplitButton press transitions use an explicit resolved-motion spring');
theme.animation.scale = 0;
const beforeReduced = springCalls;
new Runner(halfProps.type, halfProps.props);
connected.render();
connected.items()[0].props.onPressChange(0, true);
connected.items()[0].props.onPressChange(0, false);
assert.equal(springCalls, beforeReduced, 'resolved reduced motion directly updates Group/Split state without starting springs');
theme.animation.scale = 1;
fontScale = 1;
direction = 'ltr';
let interactionCases = 0;
const check = (run) => {
    run();
    interactionCases++;
};
const child = (group, index = 0) => {
    const node = group.items()[index];
    return new Runner(node.type, node.props);
};
const ripple = (item) => walk(item.tree).find((node) => node.type === 'TouchableRipple');
const menu = (group) => walk(group.tree).find((node) => node.type === modules['./menu'].Menu);
// Fixed reference budgets, not a copy of the production algorithm. AndroidX
// ButtonGroupMeasurePolicy: central transfer is identical on both sides and
// bounded by the smaller neighbour's real content end padding.
for (const [widths, limits, ratio, index, expected] of [
    [[200, 200, 200], [24, 24, 24], 0.15, 0, [24, -24, 0]],
    [[200, 200, 200], [24, 24, 24], 0.15, 1, [-15, 30, -15]],
    [[200, 200, 200], [24, 24, 24], 0.15, 2, [0, -24, 24]],
    [[200, 200, 200], [8, 24, 48], 0.15, 1, [-8, 16, -8]],
    [[400, 400, 400], [48, 48, 48], 0.15, 1, [-30, 60, -30]],
    [[600, 600, 600], [64, 64, 64], 0.15, 1, [-45, 90, -45]],
    [[80, 48, 80], [8, 4, 8], 0.15, 0, [0, 0, 0]],
    [[48, 80, 80], [4, 8, 8], 0.15, 1, [0, 0, 0]],
    [[80], [16], 0.15, 0, [0]],
    [[100, 100, 100], [24, 24, 24], 0, 1, [0, 0, 0]],
    [[100, 100, 100], [24, 24, 24], 1, 1, [-24, 48, -24]],
])
    check(() => {
        const actual = Array.from(exportsObject.buttonGroupPressDeltas(widths, limits, ratio)[index]);
        assert.deepEqual(
            actual.map((amount) => amount || 0),
            expected
        );
        assert.equal(
            actual.reduce((sum, amount) => sum + amount, 0),
            0,
            'space only moves between immediate neighbours'
        );
        actual.forEach((amount, i) => assert.ok(widths[i] + amount >= 48, '48dp minimum interactive slot survives compression'));
    });
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems, expandedRatio: 0 }).measure(standardMeasures);
    runner.items().forEach((node) => assert.ok(node.props.deltas.flat().every((amount) => amount === 0)));
});
for (const progress of [
    [1.25, 0, 0],
    [0, 1.25, 0],
    [0.8, 0, 0.8],
    [-0.12, 1.2, -0.12],
    [0.4, 0.8, 0.6],
])
    check(() => {
        const items = [
            { value: 'a', label: 'A', icon: 'star', iconOnly: true },
            { value: 'b', label: 'B', icon: 'star', iconOnly: true },
            { value: 'c', label: 'C', icon: 'star', iconOnly: true },
        ];
        const runner = new Runner(exportsObject.ButtonGroup, { items, size: 'medium' }).measure({ A: 0, B: 0, C: 0 });
        const nodes = runner.items();
        nodes[0].props.presses.set(progress);
        const actual = nodes.map((node) => style(new Runner(node.type, node.props).tree.props.style).width);
        assert.ok(
            actual.every((width) => width >= 24 - 1e-8),
            'interrupted/overshooting presses preserve the actual icon content'
        );
        runner.items().forEach((node) => {
            const item = new Runner(node.type, node.props);
            const host = ripple(item);
            const target = style(host.props.animatedProps).hitSlop;
            const visual = style(item.tree.props.style).width;
            assert.ok(visual + target.left + target.right >= 48 - 1e-8, 'transparent targets remain48dp when icon visuals compress');
        });
        assert.ok(
            Math.abs(actual.reduce((sum, width) => sum + width, 0) - 168) < 1e-8,
            'multiple in-flight press values cannot make the group jump wider'
        );
    });
check(() => {
    const items = [
        { value: 'a', label: 'A', size: 'medium' },
        { value: 'b', label: 'B', size: 'large' },
        { value: 'c', label: 'C', size: 'extra-large' },
    ];
    const runner = new Runner(exportsObject.ButtonGroup, { items, size: 'extra-large' }).measure({ A: 500, B: 500, C: 500 }, 2500);
    const nodes = runner.items();
    const central = Array.from(nodes[0].props.deltas[1]);
    assert.equal(central[0], central[2], 'mixed-size middle button takes an equal amount from both sides');
    assert.equal(central[0], -24, 'the smaller neighbouring medium padding bounds growth');
});
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems }).measure(standardMeasures);
    let nodes = runner.items();
    nodes[0].props.onPressChange(0, true);
    assert.equal(nodes[0].props.presses.get()[0], 1);
    runner.render({ ...runner.props, items: standardItems.map((item, i) => ({ ...item, disabled: i === 0 })) });
    nodes = runner.items();
    assert.ok(
        nodes[0].props.presses.get().every((value) => value === 0),
        'disabling the held item clears neighbour motion without PressOut'
    );
});
for (const next of [{ variant: 'connected' }, { size: 'medium' }, { expandedRatio: 0 }, { disabled: true }])
    check(() => {
        const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems }).measure(standardMeasures);
        runner.items()[0].props.onPressChange(0, true);
        runner.render({ ...runner.props, ...next });
        assert.ok(
            runner
                .items()[0]
                .props.presses.get()
                .every((value) => value === 0),
            'configuration changes invalidate an in-flight press'
        );
    });
for (const next of [
    { fullWidth: true },
    { buttonVariant: 'outlined' },
    { density: -2 },
    { items: standardItems.map((item, i) => (i === 0 ? { ...item, label: 'New label', shape: 'square' } : item)) },
    { items: standardItems.map((item, i) => (i === 0 ? { ...item, variant: 'outlined' } : item)) },
])
    check(() => {
        const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems }).measure(standardMeasures);
        runner.items()[0].props.onPressChange(0, true);
        runner.render({ ...runner.props, ...next });
        assert.ok(
            runner
                .items()[0]
                .props.presses.get()
                .every((value) => value === 0),
            'geometry changes cancel press motion without depending on a lost release'
        );
    });
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems, selectionMode: 'single', value: 'edit' }).measure(
        standardMeasures
    );
    runner.items()[0].props.onPressChange(1, true);
    runner.render({ ...runner.props, value: 'share' });
    assert.equal(runner.items()[0].props.presses.get()[1], 1, 'ordinary selection changes retain the current press feedback');
});
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems }).measure(standardMeasures);
    runner.items()[0].props.onPressChange(1, true);
    runner.render({ ...runner.props, items: standardItems.slice(1) });
    assert.deepEqual(
        Array.from(runner.items()[0].props.presses.get()),
        [0, 0],
        'removing the pressed item resets positions before indexes are reused'
    );
});
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems }).measure(standardMeasures);
    runner.items()[0].props.onPressChange(0, true);
    const content = walk(runner.tree).find((node) => node.type === 'View' && style(node.props.style).gap != null);
    content.props.onLayout({ nativeEvent: { layout: { width: 250 } } });
    runner.render();
    assert.ok(runner.items().length < 3, 'actual content-box width governs overflow when callers add padding');
    assert.ok(
        runner
            .items()[0]
            .props.presses.get()
            .every((value) => value === 0)
    );
});
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems, maxVisibleItems: 1 }).measure(standardMeasures);
    let overflow = menu(runner);
    const anchor = walk(overflow.props.anchor).find((node) => node.type === 'IconButton');
    anchor.props.onPress();
    runner.render();
    assert.equal(menu(runner).props.visible, true);
    runner.render({ ...runner.props, disabled: true });
    assert.equal(menu(runner).props.visible, false);
    runner.render({ ...runner.props, disabled: false });
    assert.equal(menu(runner).props.visible, false, 'a dismissed disabled popup cannot revive on re-enable');
});
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems, maxVisibleItems: 0 }).measure(standardMeasures);
    assert.equal(runner.items().length, 0, 'zero visible items deliberately puts every action in overflow');
    assert.equal(walk(menu(runner)).filter((node) => node.type === 'MenuItem').length, 3);
});
for (const [selectionMode, showSelectedIcon, expected] of [
    ['none', true, 'pencil'],
    ['single', false, 'pencil'],
    ['single', true, 'check'],
])
    check(() => {
        const runner = new Runner(exportsObject.ButtonGroup, {
            items: standardItems,
            value: 'edit',
            selectionMode,
            showSelectedIcon,
            maxVisibleItems: 0,
        }).measure(standardMeasures);
        const firstMenuItem = walk(menu(runner)).find((node) => node.type === 'MenuItem');
        assert.equal(
            firstMenuItem.props.leadingIcon,
            expected,
            'overflow preserves the same selection/check policy as the visible controls'
        );
    });
for (const limit of [NaN, Infinity, -Infinity])
    check(() => {
        const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems, maxVisibleItems: limit }).measure(standardMeasures);
        assert.equal(runner.items().length, 3, 'invalid visibility limits fall back to all fitting items');
    });
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems }).measure(standardMeasures);
    runner.items()[0].props.onPressChange(0, true);
    runner.render({ ...runner.props, items: [] });
    const row = walk(runner.tree).find((node) => node.type === 'View' && style(node.props.style).gap != null);
    assert.equal(style(row.props.style).minHeight, 0, 'removing every action leaves no empty48dp interactive row');
    assert.equal(runner.items().length, 0);
    assert.equal(menu(runner), undefined);
});
check(() => {
    const calls = [];
    const items = [{ value: 'a', label: 'A', onPress: () => calls.push('press') }];
    const runner = new Runner(exportsObject.ButtonGroup, {
        items,
        variant: 'connected',
        value: 'a',
        onValueChange: (next) => calls.push(next),
    }).measure({ A: 20 });
    ripple(child(runner)).props.onPress();
    assert.deepEqual(calls, ['press', 'a'], 'required single selection never toggles its last value off');
    runner.render({ ...runner.props, allowEmptySelection: true });
    ripple(child(runner)).props.onPress();
    assert.deepEqual(calls.slice(-2), ['press', '']);
    runner.render({ ...runner.props, disabled: true });
    assert.equal(ripple(child(runner)).props.onPress, undefined);
});
check(() => {
    const values = [];
    const runner = new Runner(exportsObject.ButtonGroup, {
        items: standardItems,
        selectionMode: 'multiple',
        value: ['edit', 'save'],
        onValueChange: (next) => values.push(Array.from(next)),
    }).measure(standardMeasures);
    const first = child(runner);
    assert.equal(ripple(first).props.accessibilityState.disabled, false);
    assert.equal(ripple(first).props.accessibilityState.checked, true);
    assert.equal(ripple(first).props.accessibilityRole, 'checkbox');
    ripple(first).props.onPress();
    ripple(child(runner, 1)).props.onPress();
    assert.deepEqual(values, [['save'], ['edit', 'save', 'share']]);
});
check(() => {
    const actions = [],
        selections = [];
    const items = [
        { value: 'mic', label: 'Microphone', icon: 'mic', iconOnly: true },
        { value: 'chat', label: 'Chat', icon: 'chat', iconOnly: true, selectionMode: 'none', onPress: () => actions.push('chat') },
        {
            value: 'reactions',
            label: 'Reactions',
            icon: 'sentiment_satisfied',
            iconOnly: true,
            selectionMode: 'none',
            onPress: () => actions.push('reactions'),
        },
    ];
    const runner = new Runner(exportsObject.ButtonGroup, {
        items,
        selectionMode: 'multiple',
        value: ['mic', 'chat'],
        onValueChange: (value) => selections.push(Array.from(value)),
    }).measure({ Microphone: 70, Chat: 30, Reactions: 60 });
    const mic = ripple(child(runner)),
        chat = ripple(child(runner, 1)),
        reactions = ripple(child(runner, 2));
    assert.equal(mic.props.accessibilityRole, 'checkbox');
    assert.equal(mic.props.accessibilityState.checked, true);
    for (const command of [chat, reactions]) {
        assert.equal(command.props.accessibilityRole, 'button');
        assert.equal(command.props.accessibilityState.checked, undefined, 'commands do not announce a selection state');
        command.props.onPress();
    }
    assert.deepEqual(actions, ['chat', 'reactions']);
    assert.deepEqual(selections, [], 'opening Chat/Reactions cannot emit a toggle selection');
    assert.equal(
        walk(child(runner, 1).tree).find((node) => node.type === 'Icon').props.source,
        'chat',
        'a stale command value never renders a check'
    );
    runner.render({ ...runner.props, maxVisibleItems: 0 });
    const entries = walk(menu(runner)).filter((node) => node.type === 'MenuItem');
    assert.equal(entries[0].props.accessibilityState.checked, true);
    assert.equal(entries[1].props.accessibilityState.checked, undefined);
    assert.equal(entries[1].props.leadingIcon, 'chat');
    assert.equal(entries[1].props.accessibilityLabel, 'Chat');
    entries[1].props.onPress();
    menu(runner).props.onClosed();
    entries[2].props.onPress();
    menu(runner).props.onClosed();
    assert.deepEqual(selections, [], 'overflow commands preserve the same command behavior');
    assert.deepEqual(actions, ['chat', 'reactions', 'chat', 'reactions']);
});
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, {
        selectionMode: 'single',
        items: [
            { value: 'mic', label: 'Mic' },
            { value: 'chat', label: 'Chat', selectionMode: 'none' },
        ],
    }).measure({ Mic: 20, Chat: 30 });
    const nodes = runner.items();
    assert.ok(Math.abs(nodes[1].props.width - (62 + 1 / 3)) < 1e-8, 'a label-only command does not reserve a selected check slot');
    assert.equal(runner.tree.props.accessibilityRole, undefined, 'a mixed command group is not announced as an exclusive radio group');
    assert.equal(ripple(child(runner)).props.accessibilityRole, 'radio');
    assert.equal(ripple(child(runner, 1)).props.accessibilityRole, 'button');
});
check(() => {
    const selections = [];
    const runner = new Runner(exportsObject.ButtonGroup, {
        variant: 'connected',
        selectionMode: 'multiple',
        value: ['mic'],
        items: [
            { value: 'mic', label: 'Microphone' },
            { value: 'chat', label: 'Chat', selectionMode: 'none' },
        ],
        onValueChange: (value) => selections.push(Array.from(value)),
    }).measure({ Microphone: 70, Chat: 30 });
    assert.equal(ripple(child(runner, 1)).props.accessibilityRole, 'checkbox', 'connected groups retain uniform selection semantics');
    ripple(child(runner, 1)).props.onPress();
    assert.deepEqual(selections, [['mic', 'chat']]);
});
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems, value: 'edit', selectionMode: 'none' }).measure(
        standardMeasures
    );
    assert.equal(runner.items()[0].props.selected, false, 'an action group ignores a stale selection value');
    const first = child(runner);
    assert.equal(ripple(first).props.accessibilityRole, 'button');
    assert.equal(ripple(first).props.accessibilityState.checked, undefined);
    assert.equal(runner.tree.props.accessible, false, 'the host cannot swallow its individual accessible controls');
});
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems }).measure(standardMeasures);
    const first = child(runner);
    ripple(first).props.onFocus();
    ripple(first).props.onHoverIn();
    ripple(first).props.onPressIn();
    first.render({ ...first.props, disabled: true });
    first.render({ ...first.props, disabled: false });
    assert.equal(first.tree.props.elevation, 0, 're-enabled buttons do not resurrect old hover elevation');
    assert.equal(style(first.tree.props.style).outlineWidth, 0, 're-enabled buttons do not resurrect old focus rings');
});
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems }).measure(standardMeasures);
    const first = child(runner);
    ripple(first).props.onPressIn();
    first.render();
    assert.equal(style(first.tree.props.style).borderTopLeftRadius, 8);
    runner.render({ ...runner.props, items: standardItems.map((item, index) => (index === 0 ? { ...item, label: 'Renamed' } : item)) });
    first.render(runner.items()[0].props);
    assert.equal(
        style(first.tree.props.style).borderTopLeftRadius,
        20,
        'a canceled layout transaction cannot leave the local morph in pressed shape'
    );
});
for (const iconOnly of [true, false])
    check(() => {
        const items = [
            { value: 'play', label: 'Play', icon: 'play_arrow', iconOnly },
            { value: 'favorite', label: 'Favorite', icon: 'favorite', iconOnly },
        ];
        const runner = new Runner(exportsObject.ButtonGroup, { items }).measure({ Play: 30, Favorite: 50 });
        const first = child(runner);
        ripple(first).props.onPressIn();
        first.render();
        runner.render({
            ...runner.props,
            items: [{ ...items[0], label: 'Pause', icon: 'pause' }, items[1]],
        });
        first.render(runner.items()[0].props);
        assert.equal(
            runner.items()[0].props.presses.get()[0],
            iconOnly ? 1 : 0,
            iconOnly
                ? 'changing an icon-only accessible name preserves the press impulse'
                : 'changing visible text invalidates its measured geometry'
        );
        assert.equal(
            style(first.tree.props.style).borderTopLeftRadius,
            iconOnly ? 8 : 20,
            iconOnly ? 'Play/Pause keeps its current pressed morph' : 'visible label changes clear the canceled morph'
        );
    });
for (const [selectionMode, expectedStiffness] of [
    ['none', 800],
    ['single', 800],
    ['multiple', 800],
])
    check(() => {
        const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems, selectionMode }).measure(standardMeasures);
        const first = child(runner);
        ripple(first).props.onPressIn();
        assert.equal(springConfigs.at(-1).stiffness, 800, 'neighbour width always uses the theme FastSpatial');
        assert.equal(springConfigs.at(-2).stiffness, expectedStiffness, 'text button corners use current Button FastSpatial tokens');
    });
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems }).measure(standardMeasures);
    const first = child(runner);
    ripple(first).props.children.props.onLayout({ nativeEvent: { layout: { height: 64 } } });
    first.render();
    assert.equal(style(first.tree.props.style).marginVertical, 0, 'large native text consumes the extra target padding');
    assert.equal(ripple(first).props.hitSlop.top, 0);
    assert.equal(ripple(first).props.hitSlop.bottom, 0);
});
for (const variant of ['standard', 'connected'])
    for (const [density, height] of [
        [0, 40],
        [-1, 36],
        [-2, 32],
        [-3, 28],
    ])
        check(() => {
            const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems, variant, density }).measure(standardMeasures);
            const first = child(runner);
            const host = ripple(first);
            const content = style(host.props.children.props.style);
            assert.equal(style(host.props.style).minHeight, height);
            assert.equal(content.minHeight, height);
            assert.equal(content.justifyContent, 'center');
            assert.equal(content.alignItems, 'center');
            assert.equal(
                walk(first.tree).find((node) => node.type === 'Text').props.variant,
                'labelLarge',
                'density never reduces typography'
            );
            assert.equal(height + 2 * host.props.hitSlop.top, 48, 'all four densities keep their48dp target');
            assert.equal(
                style(first.tree.props.style).marginVertical,
                (48 - height) / 2,
                'target expansion remains unclipped by the visual shape'
            );
        });
for (const size of ['extra-small', 'small'])
    check(() => {
        const runner = new Runner(exportsObject.ButtonGroup, { items: [{ value: 'a', label: 'A' }], size, density: -3 }).measure({
            A: 100,
        });
        const first = child(runner);
        // The native text renderer has produced a40dp line at enlarged text.
        // Feed its actual layout rather than asserting a fabricated font metric.
        ripple(first).props.children.props.onLayout({ nativeEvent: { layout: { height: 40 } } });
        first.render();
        assert.equal(ripple(first).props.hitSlop.top, 4);
        assert.equal(style(first.tree.props.style).marginVertical, 4);
        assert.equal(style(ripple(first).props.children.props.style).paddingVertical, 0);
        assert.equal(style(first.tree.props.style).borderTopLeftRadius, 20, 'shape follows the measured text-grown visual height');
    });
check(() => {
    const items = [{ value: 'a', label: 'A', buttonColor: 'customContainer', textColor: 'customContent' }];
    const runner = new Runner(exportsObject.ButtonGroup, { items }).measure({ A: 20 });
    let first = child(runner);
    assert.equal(style(first.tree.props.style).backgroundColor, 'customContainer');
    assert.equal(walk(first.tree).find((node) => node.type === 'Text').props.style.color, 'customContent');
    runner.render({ ...runner.props, variant: 'connected' });
    first = child(runner);
    assert.equal(
        style(first.tree.props.style).backgroundColor,
        'secondaryContainer',
        'connected buttons ignore individual color overrides'
    );
    assert.equal(walk(first.tree).find((node) => node.type === 'Text').props.style.color, 'onSecondaryContainer');
    runner.render({ ...runner.props, variant: 'standard', disabled: true });
    first = child(runner);
    assert.equal(style(first.tree.props.style).backgroundColor, 'transparent', 'disabled tokens override enabled custom colors');
    assert.equal(walk(first.tree).find((node) => node.type === 'Text').props.style.color, 'onSurface');
});
check(() => {
    const items = [
        { value: 'zero', label: '0', icon: 'circle', iconOnly: true, weight: 1 },
        { value: 'decimal', label: '.', icon: 'circle', iconOnly: true, weight: 1 },
        { value: 'equals', label: '=', icon: 'equal', iconOnly: true, weight: 2 },
    ];
    const runner = new Runner(exportsObject.ButtonGroup, { items, size: 'medium', fullWidth: true }).measure({ 0: 0, '.': 0, '=': 0 }, 400);
    assert.deepEqual(
        runner.items().map((node) => node.props.width),
        [96, 96, 192],
        'calculator equality occupies two explicit slots'
    );
    runner.items()[0].props.onPressChange(2, true);
    const actual = runner.items().map((node) => style(new Runner(node.type, node.props).tree.props.style).width);
    assert.ok(Math.abs(actual.reduce((sum, width) => sum + width, 0) - 384) < 1e-8, 'weighted rows retain their group width on press');
    runner.render({ ...runner.props, items: items.map((item) => ({ ...item, weight: undefined })) });
    assert.deepEqual(
        runner.items().map((node) => node.props.width),
        [72, 72, 72],
        'implicit icon slots keep their documented wide maximum'
    );
});
check(() => {
    const items = [
        { value: 'long', label: 'Long title', weight: 1 },
        { value: 'icon', label: 'Icon', icon: 'star', iconOnly: true, weight: 3 },
    ];
    const runner = new Runner(exportsObject.ButtonGroup, { items, size: 'medium', fullWidth: true }).measure(
        { 'Long title': 80, Icon: 0 },
        300
    );
    const widths = runner.items().map((node) => node.props.width);
    assert.ok(Math.abs(widths[0] - (128 + 1 / 3)) < 1e-8, 'a long label retains its intrinsic minimum when a weight share is smaller');
    assert.ok(Math.abs(widths[0] + widths[1] + 8 - 300) < 1e-8, 'remaining weight receives only the available budget');
});
check(() => {
    const items = [
        { value: 'a', label: 'A', icon: 'star', iconOnly: true },
        { value: 'b', label: 'B', icon: 'star', iconOnly: true, weight: 1 },
        { value: 'c', label: 'C', icon: 'star', iconOnly: true, weight: 2 },
    ];
    const runner = new Runner(exportsObject.ButtonGroup, { items, size: 'medium', fullWidth: true }).measure({ A: 0, B: 0, C: 0 }, 400);
    const widths = runner.items().map((node) => node.props.width);
    assert.equal(widths[0], 56, 'unweighted actions retain their natural width');
    assert.ok(Math.abs(widths[2] - 2 * widths[1]) < 1e-8);
    runner.render({ ...runner.props, variant: 'connected' });
    const connectedWidths = runner.items().map((node) => node.props.width);
    assert.equal(connectedWidths[0], 56, 'unweighted connected items retain their natural width');
    assert.ok(
        Math.abs(connectedWidths[2] - 2 * connectedWidths[1]) < 1e-8,
        'connected groups honor explicit weights without changing their styles'
    );
});
check(() => {
    const items = [
        { value: 'a', label: 'A', icon: 'star', iconOnly: true, weight: 1 },
        { value: 'b', label: 'B', icon: 'star', iconOnly: true, weight: 2 },
    ];
    const runner = new Runner(exportsObject.ButtonGroup, { items, size: 'medium', fullWidth: true }).measure({ A: 0, B: 0 }, 400);
    runner.items()[0].props.onPressChange(0, true);
    runner.render({ ...runner.props, items: items.map((item) => ({ ...item, weight: 1 })) });
    assert.deepEqual(Array.from(runner.items()[0].props.presses.get()), [0, 0], 'changing explicit weights invalidates old press geometry');
    assert.deepEqual(
        runner.items().map((node) => node.props.width),
        [196, 196]
    );
});
check(() => {
    const items = [
        { value: 'short', label: 'Short', weight: 1 },
        { value: 'long', label: 'Long label', weight: 1 },
    ];
    const runner = new Runner(exportsObject.ButtonGroup, { variant: 'connected', items }).measure({ Short: 20, 'Long label': 70 }, 390);
    assert.deepEqual(
        runner.items().map((node) => node.props.width),
        [194, 194],
        'explicit equal weights reproduce connected figure cells with different label widths'
    );
    assert.ok(
        runner.items().every((node) => node.props.variant === 'tonal' && node.props.size === 'small'),
        'weight cannot alter connected color or size uniformity'
    );
});
// Primary IconButton size tokens supply the visual; the transparent target is
// independent. Test real GroupItem props throughout width motion, without
// pretending these worklet evaluations render native ink or measure FPS.
for (const [size, height, gap, widths] of [
    ['extra-small', 32, 18, { narrow: 28, default: 32, wide: 40 }],
    ['small', 40, 12, { narrow: 32, default: 40, wide: 52 }],
])
    for (const [widthVariant, expectedWidth] of Object.entries(widths))
        for (const buttonVariant of ['tonal', 'outlined'])
            for (const locale of ['ltr', 'rtl'])
                check(() => {
                    direction = locale;
                    const items = ['a', 'b', 'c'].map((value) => ({ value, label: value, icon: 'star', iconOnly: true, widthVariant }));
                    const runner = new Runner(exportsObject.ButtonGroup, { items, size, buttonVariant }).measure({ a: 0, b: 0, c: 0 });
                    const nodes = runner.items();
                    const row = walk(runner.tree).find((node) => node.type === 'View' && style(node.props.style).gap != null);
                    assert.equal(style(row.props.style).gap, gap, 'visual surfaces keep the actual standard spacing token');
                    assert.deepEqual(
                        nodes.map((node) => node.props.width),
                        [expectedWidth, expectedWidth, expectedWidth]
                    );
                    for (const progress of [
                        [0, 0, 0],
                        [0.5, 0, 0],
                        [1, 0, 0],
                        [0, 1, 0],
                        [0.8, 0, 0.8],
                        [1.2, -0.1, 0],
                        [0, 0, 0],
                    ]) {
                        nodes[0].props.presses.set(progress);
                        let total = 0;
                        for (const node of nodes) {
                            const item = new Runner(node.type, node.props);
                            const surface = style(item.tree.props.style),
                                host = ripple(item);
                            const target = style(host.props.animatedProps).hitSlop;
                            total += surface.width;
                            assert.ok(surface.width >= (size === 'extra-small' ? 20 : 24) - 1e-8, 'compression protects the actual glyph');
                            assert.ok(
                                Math.abs(surface.width + target.left + target.right - Math.max(48, surface.width)) < 1e-8,
                                'horizontal target stays centered and at least48dp at rest, press and release'
                            );
                            assert.equal(
                                height + target.top + target.bottom,
                                48,
                                'the visual height does not inflate the target or background'
                            );
                            assert.equal(target.left, target.right);
                            assert.equal(surface.marginHorizontal ?? 0, 0, 'transparent targets cannot inflate the visible gap');
                            assert.equal(
                                style(host.props.style).overflow,
                                'hidden',
                                'only the indication host clips its visual silhouette'
                            );
                            assert.notEqual(
                                surface.overflow,
                                'hidden',
                                'target expansion remains outside the surface without ancestor clipping'
                            );
                        }
                        assert.ok(Math.abs(total - expectedWidth * 3) < 1e-8, 'all press phases conserve the total visual group width');
                    }
                    assert.deepEqual(
                        nodes.map((node) => node.props.actualWidths.get()[node.props.index]),
                        [expectedWidth, expectedWidth, expectedWidth],
                        'settled release restores exact token widths'
                    );
                });
direction = 'ltr';
for (const [size, widthVariant, expected] of [
    ['extra-small', 'narrow', 48],
    ['extra-small', 'default', 48],
    ['extra-small', 'wide', 48],
    ['small', 'narrow', 48],
    ['small', 'default', 48],
    ['small', 'wide', 52],
])
    check(() => {
        const runner = new Runner(exportsObject.ButtonGroup, {
            variant: 'connected',
            fullWidth: false,
            size,
            items: [{ value: 'a', label: 'A', icon: 'star', iconOnly: true, widthVariant }],
        }).measure({ A: 0 });
        assert.equal(runner.items()[0].props.width, expected, 'the separate connected XS/S minimum48dp is preserved');
    });
platform = 'web';
for (const rtl of [false, true])
    check(() => {
        direction = rtl ? 'rtl' : 'ltr';
        const items = standardItems.map((item, index) => ({ ...item, disabled: index === 1 }));
        const runner = new Runner(exportsObject.ButtonGroup, { items }).measure(standardMeasures);
        const focused = [];
        runner.items().forEach((node, index) => node.props.focusRef({ focus: () => focused.push(index) }));
        assert.deepEqual(
            runner.items().map((node) => node.props.tabIndex),
            [0, -1, -1]
        );
        let prevented = 0;
        const pressKey = (index, key, extra = {}) =>
            runner.items()[index].props.onKeyDown({ key, preventDefault: () => prevented++, ...extra });
        pressKey(0, rtl ? 'ArrowLeft' : 'ArrowRight');
        runner.render();
        assert.deepEqual(focused, [2], 'arrow keys skip disabled buttons and follow the visual reading direction');
        assert.deepEqual(
            runner.items().map((node) => node.props.tabIndex),
            [-1, -1, 0]
        );
        pressKey(2, rtl ? 'ArrowLeft' : 'ArrowRight');
        runner.render();
        assert.equal(focused.at(-1), 0, 'roving focus wraps within the group');
        pressKey(0, 'End');
        pressKey(2, 'Home');
        assert.deepEqual(focused.slice(-2), [2, 0]);
        pressKey(0, 'ArrowRight', { ctrlKey: true });
        pressKey(0, 'Enter');
        pressKey(0, ' ');
        assert.equal(prevented, 4, 'modified keys and native Enter/Space activation remain with Pressable');
        const first = child(runner);
        assert.equal(ripple(first).props.tabIndex, 0, 'web native host receives roving tabIndex');
        assert.equal(typeof ripple(first).props.onKeyDown, 'function');
    });
platform = 'ios';
direction = 'ltr';
check(() => {
    const runner = new Runner(exportsObject.ButtonGroup, { items: standardItems }).measure(standardMeasures);
    const host = ripple(child(runner));
    assert.equal(host.props.onKeyDown, undefined, 'unsupported web keyboard events are never passed to the native Pressable');
    assert.equal(host.props.tabIndex, undefined);
});
console.log(
    `OK: ${cases} real ButtonGroup text-budget cases; ${interactionCases} interaction/accessibility/overflow regressions (padding-limited equal-neighbour transfer, configuration cancellation, required/optional/multiple selection, native targets and web roving focus). Group/Split resolved-motion springs and reduced direct updates.`
);
