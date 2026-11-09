/**
 * Focused Tabs controller checks against the real package TSX.
 * Run: node scripts/verify-mobile-design-tabs.cjs
 *
 * Hooks, native leaves, focus and animation scheduling are bounded doubles.
 * Animations can be interrupted and completed out of order to exercise the
 * actual controller. The companion navigation-layout suite runs installed
 * React Native Yoga on the actual hierarchy. Neither suite claims native
 * font shaping, ripple pixels, keyboard dispatch, screen-reader traversal,
 * animation frame rate or gesture verification.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
let active;
let rtl = false;
let fontScale = 1;
let platform = 'web';
const theme = {
    animation: { scale: 1 },
    colors: {
        surface: '#fef7ff',
        primary: '#6750a4',
        onSurface: '#1d1b20',
        onSurfaceVariant: '#49454f',
        outlineVariant: '#cac4d0',
    },
    fonts: { titleSmall: { fontFamily: 'Roboto', fontSize: 14, lineHeight: 20, fontWeight: '500' } },
    motion: {
        duration: { short2: 100, medium2: 300 },
        spring: {
            default: { spatial: { stiffness: 380, damping: 0.8 }, effects: { stiffness: 1600, damping: 1 } },
            fast: { spatial: { stiffness: 800, damping: 0.6 }, effects: { stiffness: 3800, damping: 1 } },
        },
    },
};
const depsEqual = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
const hook = (create) => {
    const index = active.cursor++;
    return active.hooks[index] ?? (active.hooks[index] = create());
};
const React = {
    useState(initial) {
        const owner = active;
        const slot = hook(() => ({ value: typeof initial === 'function' ? initial() : initial }));
        return [
            slot.value,
            (update) => {
                assert.ok(!owner.unmounted, 'disposed Tabs must not update state');
                const next = typeof update === 'function' ? update(slot.value) : update;
                if (!Object.is(slot.value, next)) {
                    slot.value = next;
                    owner.dirty = true;
                }
            },
        ];
    },
    useRef: (current) => hook(() => ({ current })),
    useMemo(compute, dependencies) {
        const slot = hook(() => ({}));
        if (!depsEqual(slot.dependencies, dependencies)) {
            slot.dependencies = dependencies;
            slot.value = compute();
        }
        return slot.value;
    },
    useEffect(create, dependencies) {
        const slot = hook(() => ({}));
        if (!depsEqual(slot.dependencies, dependencies)) {
            slot.dependencies = dependencies;
            active.effects.push(() => {
                slot.cleanup?.();
                slot.cleanup = create();
            });
        }
    },
};
let nextId = 0;
React.useId = () => hook(() => ({ value: `qa-${++nextId}` })).value;
React.useCallback = (callback, dependencies) => React.useMemo(() => callback, dependencies);
React.useLayoutEffect = React.useEffect;
const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
const flatten = (style) =>
    Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : style?.compute ? flatten(style.compute()) : (style ?? {});
function cancelAnimation(shared) {
    const animation = shared.animation;
    shared.animation = null;
    animation?.callback?.(false);
}
const animated = {
    View: 'AnimatedView',
    ScrollView: 'AnimatedScrollView',
    createAnimatedComponent: (component) => component,
    useSharedValue(initial) {
        const owner = active;
        return hook(() => {
            const shared = {
                current: initial,
                animation: null,
                get() {
                    return this.current;
                },
                set(value) {
                    cancelAnimation(this);
                    if (value && typeof value === 'object' && value.kind) {
                        if (value.config.duration === 0) {
                            this.current = value.to;
                            value.callback?.(true);
                        } else this.animation = value;
                    } else this.current = value;
                },
            };
            owner.shared.push(shared);
            return shared;
        });
    },
    useAnimatedStyle: (compute) => ({ compute }),
    useAnimatedRef: () => React.useRef(null),
    useAnimatedReaction(prepare, react) {
        const slot = hook(() => ({ initialized: false }));
        slot.prepare = prepare;
        slot.react = react;
        active.reactions.add(slot);
    },
    useAnimatedScrollHandler: (handlers) => handlers,
    scrollTo: (_ref, x, y, animate) => active.commands.push({ x, y, animated: animate }),
    cancelAnimation,
    withTiming: (to, config, callback) => ({ kind: 'timing', to, config, callback }),
    withSpring: (to, config, callback) => ({ kind: 'spring', to, config, callback }),
    interpolateColor: (value, _range, colors) => colors[value < 0.5 ? 0 : 1],
    ReduceMotion: { Never: 'never', Always: 'always', System: 'system' },
};
animated.default = animated;
const modules = {
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': {
        View: 'View',
        Text: 'Text',
        ScrollView: 'ScrollView',
        FlatList: 'FlatList',
        Share: { share: (payload) => active.commands.push({ type: 'share', payload }) },
        Keyboard: { dismiss: () => active.commands.push({ type: 'keyboard-dismiss' }) },
        Platform: {
            get OS() {
                return platform;
            },
            select: (choices) => choices[platform] ?? choices.default,
        },
        I18nManager: {
            get isRTL() {
                return rtl;
            },
        },
        StyleSheet: { create: (styles) => styles, flatten, absoluteFill: { position: 'absolute', inset: 0 } },
        useWindowDimensions: () => ({ width: 390, height: 844, fontScale }),
    },
    'react-native-paper': {
        Icon: 'Icon',
        Text: 'Text',
        TouchableRipple: 'TouchableRipple',
        useTheme: () => theme,
        useLocale: () => ({ direction: rtl ? 'rtl' : 'ltr' }),
    },
    'react-native-reanimated': animated,
    'react-native-worklets': {
        scheduleOnRN: (callback, ...args) => active.queued.push(() => callback(...args)),
    },
    'mobile-design/react-native': { useMobileTheme: () => theme },
    '../core': { useMobileTheme: () => theme },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }) },
    '@react-navigation/native': { useIsFocused: () => true },
    'react-native-svg': { __esModule: true, default: 'Svg', Image: 'SvgImage' },
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    '../color': { withAlpha: (color, opacity) => `${color}@${opacity}` },
    './content': { Badge: 'Badge', BadgedBox: 'BadgedBox' },
};
const moduleCache = new Map();
function load(file) {
    const absolute = path.resolve(root, file);
    if (moduleCache.has(absolute)) return moduleCache.get(absolute);
    const exports = {};
    moduleCache.set(absolute, exports);
    const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, {
        exports,
        require(name) {
            const platformBoundary = require('./mobile-design-native-boundaries.cjs')(name, modules);
            if (platformBoundary) return platformBoundary;
            if (modules[name]) return modules[name];
            if (name.startsWith('./assets/tabs/') && name.endsWith('.png')) {
                const asset = path.resolve(path.dirname(absolute), name);
                assert.ok(fs.existsSync(asset), `reference artwork asset ${name} exists`);
                return asset;
            }
            if (name.startsWith('./tabs')) {
                const base = path.resolve(path.dirname(absolute), name);
                const resolved = ['.tsx', '.ts'].map((extension) => base + extension).find(fs.existsSync);
                assert.ok(resolved, `Tabs local dependency ${name} exists`);
                return load(resolved);
            }
            assert.fail(`explicit test boundary required for ${name}`);
        },
        requestAnimationFrame(callback) {
            const id = ++active.lastFrame;
            active.frames.set(id, callback);
            return id;
        },
        cancelAnimationFrame: (id) => active.frames.delete(id),
    });
    return exports;
}
const walk = (tree) =>
    Array.isArray(tree) ? tree.flatMap(walk) : tree && typeof tree === 'object' ? [tree, ...walk(tree.props?.children)] : [];
class Runner {
    constructor(component, props) {
        Object.assign(this, {
            component,
            props,
            hooks: [],
            shared: [],
            commands: [],
            focus: [],
            nodes: new Map(),
            frames: new Map(),
            lastFrame: 0,
            effects: [],
            cursor: 0,
            children: new Map(),
            queued: [],
            reactions: new Set(),
        });
        this.rootHooks = this.hooks;
        this.render();
    }
    expand(tree, route = 'root') {
        if (Array.isArray(tree)) return tree.map((child, index) => this.expand(child, `${route}/${child?.key ?? index}`));
        if (!tree || typeof tree !== 'object') return tree;
        if (typeof tree.type === 'function') {
            const instance = `${route}:${tree.type.name}`;
            this.visited.add(instance);
            const hooks = this.children.get(instance) ?? [];
            this.children.set(instance, hooks);
            const previous = this.hooks,
                cursor = this.cursor;
            this.hooks = hooks;
            this.cursor = 0;
            const result = tree.type(tree.props);
            this.hooks = previous;
            this.cursor = cursor;
            return this.expand(result, `${instance}/result`);
        }
        return { ...tree, props: { ...tree.props, children: this.expand(tree.props?.children, `${route}/children`) } };
    }
    render(props = this.props) {
        this.props = props;
        let passes = 0;
        do {
            assert.ok(++passes < 30, 'Tabs effects must settle without a render loop');
            active = this;
            this.hooks = this.rootHooks;
            this.cursor = 0;
            this.dirty = false;
            this.effects = [];
            this.visited = new Set();
            this.tree = this.expand(this.component(this.props));
            for (const [instance, hooks] of this.children)
                if (!this.visited.has(instance)) {
                    hooks.forEach((slot) => slot.cleanup?.());
                    this.children.delete(instance);
                }
            for (const element of walk(this.tree)) {
                const ref = element.props?.ref;
                if (!ref) continue;
                const id = element.props.testID ?? element.key ?? element.type;
                if (!this.nodes.has(id))
                    this.nodes.set(id, { focus: () => this.focus.push(id), scrollTo: (command) => this.commands.push(command) });
                if (typeof ref === 'function') ref(this.nodes.get(id));
                else ref.current = this.nodes.get(id);
            }
            this.effects.forEach((create) => create());
        } while (this.dirty);
        return this;
    }
    update(props) {
        return this.render({ ...this.props, ...props });
    }
    event(callback, ...args) {
        assert.equal(typeof callback, 'function', 'requested event is wired');
        active = this;
        callback(...args);
        return this.dirty && !this.unmounted ? this.render() : this;
    }
    find(id) {
        const element = walk(this.tree).find((node) => node.props?.testID === id);
        assert.ok(element, `Tabs element ${id} exists`);
        return element;
    }
    has(id) {
        return walk(this.tree).some((node) => node.props?.testID === id);
    }
    native(type) {
        const element = walk(this.tree).find((node) => node.type === type);
        assert.ok(element, `native boundary ${type} exists`);
        return element;
    }
    press(id) {
        const node = this.find(id);
        if (!node.props.disabled) this.event(node.props.onPress);
        return this;
    }
    layout(id, geometry) {
        return this.event(this.find(id).props.onLayout, { nativeEvent: { layout: geometry } });
    }
    framesNow() {
        const pending = [...this.frames.values()];
        this.frames.clear();
        pending.forEach((callback) => this.event(callback, 0));
        return this;
    }
    flush() {
        for (const callback of this.queued.splice(0)) this.event(callback);
        return this;
    }
    pulseUI() {
        if (this.unmounted) return this;
        active = this;
        for (const reaction of this.reactions) {
            const next = reaction.prepare();
            if (!reaction.initialized || JSON.stringify(next) !== JSON.stringify(reaction.value)) {
                const previous = reaction.initialized ? reaction.value : null;
                reaction.value = next;
                reaction.initialized = true;
                reaction.react(next, previous);
            }
        }
        return this;
    }
    complete(shared) {
        assert.ok(shared?.animation, 'there is an animation to complete');
        const animation = shared.animation;
        shared.animation = null;
        shared.current = animation.to;
        if (animation.callback) this.event(animation.callback, true);
        return this;
    }
    finish() {
        for (const shared of this.shared) if (shared.animation) this.complete(shared);
        return this;
    }
    unmount() {
        active = this;
        for (const hooks of [this.rootHooks, ...this.children.values()]) hooks.forEach((slot) => slot.cleanup?.());
        this.unmounted = true;
    }
}

modules['./press-scope'] = load('packages/mobile-design/src/components/press-scope.ts');
const { Tabs } = load('packages/mobile-design/src/components/tabs.tsx');
const { TabsPager: TabsContentPager } = load('packages/mobile-design/src/components/tabs-pager.tsx');
Object.assign(modules['mobile-design/react-native'], {
    Tabs,
    TabsPager: TabsContentPager,
    Text: 'Text',
    Button: 'Button',
    Card: 'Card',
    DatePicker: 'DatePicker',
    FullScreenDialog: 'FullScreenDialog',
    Icon: 'Icon',
    IconButton: 'IconButton',
    NavigationDrawerModal: 'NavigationDrawerModal',
    SearchView: 'SearchView',
    TopAppBar: 'TopAppBar',
    List: { Item: 'ListItem' },
    FAB: { Menu: 'FABMenu' },
    Portal: 'Portal',
    Menu: Object.assign(
        function MenuBoundary(props) {
            return jsx('Menu', props);
        },
        { Item: 'MenuItem' }
    ),
    Dialog: Object.assign(
        function DialogBoundary(props) {
            return jsx('Dialog', props);
        },
        { Title: 'DialogTitle', Content: 'DialogContent', Actions: 'DialogActions' }
    ),
});
const failures = [];
let cases = 0;
function test(name, run) {
    cases++;
    const previousScale = theme.animation.scale;
    try {
        run();
    } catch (error) {
        failures.push({ name, error });
    } finally {
        rtl = false;
        fontScale = 1;
        platform = 'web';
        theme.animation.scale = previousScale;
    }
}

// Controller and accessibility cases below exercise accepted user behavior;
// dimensions are cross-checked against MD3 specs in the real Yoga suite.
const items = [
    { key: 'first', label: 'First' },
    { key: 'locked', label: 'Locked', disabled: true },
    { key: 'last', label: 'Last' },
];
const make = (overrides = {}) =>
    new Runner(Tabs, {
        items,
        value: 'first',
        onValueChange() {},
        testID: 'tabs',
        ...overrides,
    });
const indicator = (owner) => flatten(owner.find('tabs-indicator').props.style);
const key = (owner, tab, value) => {
    const event = {
        key: value,
        nativeEvent: { key: value },
        prevented: false,
        preventDefault() {
            this.prevented = true;
        },
    };
    owner.event(owner.find(`tabs-${tab}`).props.onKeyDown, event);
    return event;
};
const measure = (owner, tab, x, width = 100, labelWidth = 40) => {
    owner.layout(`tabs-${tab}`, { x, y: 0, width, height: 48 });
    const label = owner.has(`tabs-${tab}-label-group`) ? `${tab}-label-group` : `${tab}-label`;
    if (owner.has(`tabs-${label}`)) owner.layout(`tabs-${label}`, { x: 0, y: 0, width: labelWidth, height: 20 });
    return owner;
};
const scrollFixture = (overrides = {}) => {
    const owner = make({ scrollable: true, value: 'last', ...overrides });
    owner.layout('tabs', { x: 0, y: 0, width: 300, height: 48 });
    owner.layout('tabs-row', { x: 0, y: 0, width: 1000, height: 48 });
    measure(owner, 'last', 800);
    return owner;
};

for (const variant of ['primary', 'secondary']) {
    test(`${variant}: disabled targets are inert and accepted selection stays controlled`, () => {
        const requests = [];
        const owner = make({ variant, onValueChange: (value) => requests.push(value) });
        owner.press('tabs-locked').press('tabs-last');
        assert.deepEqual(requests, ['last']);
        assert.equal(owner.find('tabs-first').props.accessibilityState.selected, true);
        assert.equal(owner.find('tabs-last').props.accessibilityState.selected, false);
        owner.update({ value: 'last' });
        assert.equal(owner.find('tabs-last').props.accessibilityState.selected, true);
        assert.equal(owner.find('tabs-first').props.accessibilityState.selected, false);
    });
    test(`${variant}: pressing the selected tab does not restart the destination`, () => {
        const requests = [];
        make({ variant, onValueChange: (value) => requests.push(value) }).press('tabs-first');
        assert.deepEqual(requests, []);
    });
    test(`${variant}: no implicit selection or orphan indicator after active item removal`, () => {
        const requests = [];
        const owner = make({ variant, value: 'last', onValueChange: (value) => requests.push(value) });
        measure(owner, 'last', 200).finish();
        assert.equal(owner.has('tabs-indicator'), true);
        owner.update({ items: items.slice(0, 2) });
        assert.equal(owner.has('tabs-indicator'), false);
        assert.deepEqual(requests, [], 'the application owns any replacement selection');
        assert.equal(owner.find('tabs-first').props.accessibilityState.selected, false);
    });
    test(`${variant}: an empty collection is a harmless controlled tab list`, () => {
        const requests = [];
        const owner = make({ variant, items: [], value: '', onValueChange: (value) => requests.push(value) });
        assert.equal(owner.has('tabs-indicator'), false);
        assert.equal(walk(owner.tree).filter((node) => node.props.accessibilityRole === 'tab').length, 0);
        assert.deepEqual(requests, []);
    });
}

test('tab list and child semantics expose one label, selected state and disabled state', () => {
    const owner = make({
        accessibilityLabel: 'Library sections',
        items: [
            { key: 'first', label: 'Songs', icon: 'music_note' },
            { key: 'locked', label: 'Downloads', disabled: true },
        ],
    });
    assert.equal(owner.tree.props.accessibilityRole, 'tablist');
    assert.equal(owner.tree.props.accessibilityLabel, 'Library sections');
    assert.equal(owner.find('tabs-first').props.accessibilityRole, 'tab');
    assert.equal(owner.find('tabs-first').props.accessibilityState.selected, true);
    assert.equal(owner.find('tabs-locked').props.accessibilityState.disabled, true);
    assert.equal(owner.find('tabs-first-decoration').props.accessible, false);
    assert.equal(owner.find('tabs-first-decoration').props.importantForAccessibility, 'no-hide-descendants');
});

test('badge announcements are optional, overrideable and do not create an extra keyboard target', () => {
    const owner = make({
        items: [
            { key: 'first', label: 'Messages', icon: 'mail', badge: 3 },
            { key: 'last', label: 'News', badge: true, accessibilityLabel: 'News, unread stories' },
        ],
    });
    assert.match(owner.find('tabs-first').props.accessibilityLabel, /Messages.*3/);
    assert.equal(owner.find('tabs-last').props.accessibilityLabel, 'News, unread stories');
    assert.equal(walk(owner.tree).filter((node) => node.props.tabIndex === 0).length, 1);
    owner.update({ items: owner.props.items.map((item) => ({ ...item, badge: false })) });
    assert.equal(owner.find('tabs-first').props.accessibilityLabel, 'Messages');
});

for (const direction of ['ltr', 'rtl']) {
    test(`${direction}: directional keys move focus without selecting and skip disabled tabs`, () => {
        rtl = direction === 'rtl';
        const requests = [];
        const owner = make({ onValueChange: (value) => requests.push(value) });
        const event = key(owner, 'first', rtl ? 'ArrowLeft' : 'ArrowRight');
        owner.framesNow();
        assert.equal(event.prevented, true);
        assert.deepEqual(requests, [], 'arrow navigation moves focus without activating its panel');
        assert.equal(owner.focus.at(-1), 'tabs-last');
        assert.equal(owner.find('tabs-first').props.accessibilityState.selected, true, 'focus cannot override the controlled value');
        key(owner, 'last', 'Enter');
        assert.deepEqual(requests, ['last']);
        owner.update({ value: 'last' });
        key(owner, 'last', rtl ? 'ArrowRight' : 'ArrowLeft');
        owner.framesNow();
        assert.deepEqual(requests, ['last']);
        assert.equal(owner.focus.at(-1), 'tabs-first');
        key(owner, 'first', ' ');
        assert.deepEqual(requests, ['last', 'first']);
    });
    test(`${direction}: Home and End target the first and final enabled items`, () => {
        rtl = direction === 'rtl';
        const requests = [];
        const owner = make({
            items: [
                { key: 'locked-start', label: 'Unavailable', disabled: true },
                ...items,
                { key: 'locked-end', label: 'Unavailable', disabled: true },
            ],
            onValueChange: (value) => requests.push(value),
        });
        key(owner, 'first', 'End');
        owner.framesNow();
        assert.deepEqual(requests, []);
        assert.equal(owner.focus.at(-1), 'tabs-last');
        key(owner, 'last', 'Home');
        owner.framesNow();
        assert.deepEqual(requests, []);
        assert.equal(owner.focus.at(-1), 'tabs-first');
    });
}

test('keyboard activation accepts Enter and Space, and unrelated keys keep normal behavior', () => {
    const requests = [];
    const owner = make({ onValueChange: (value) => requests.push(value) });
    key(owner, 'last', 'Enter');
    key(owner, 'last', ' ');
    const unrelated = key(owner, 'first', 'PageDown');
    assert.deepEqual(requests, ['last', 'last']);
    assert.equal(unrelated.prevented, false);
});

test('roving focus admits one tab, including a safe fallback for an invalid controlled key', () => {
    const owner = make();
    assert.equal(owner.find('tabs-first').props.tabIndex, 0);
    assert.equal(owner.find('tabs-locked').props.tabIndex, -1);
    assert.equal(owner.find('tabs-last').props.tabIndex, -1);
    owner.update({ value: 'missing' });
    assert.equal(owner.find('tabs-first').props.tabIndex, 0);
    assert.equal(owner.find('tabs-last').props.tabIndex, -1);
    owner.update({ items: [{ key: 'locked', label: 'Locked', disabled: true }] });
    assert.equal(owner.find('tabs-locked').props.tabIndex, -1);
});

test('primary indicator follows measured text with published inset and minimum width', () => {
    const owner = make();
    measure(owner, 'first', 0, 100, 40).finish();
    assert.equal(indicator(owner).height, 3);
    assert.equal(indicator(owner).width, 36);
    assert.equal(indicator(owner).left, 32);
    measure(owner, 'first', 0, 100, 12).finish();
    assert.equal(indicator(owner).width, 24);
    assert.equal(indicator(owner).left, 38);
    measure(owner, 'first', 0, 100, 64).finish();
    assert.equal(indicator(owner).width, 60);
    assert.equal(indicator(owner).left, 20);
});

test('secondary indicator follows the entire measured tab rather than primary text width', () => {
    const owner = make({ variant: 'secondary' });
    measure(owner, 'first', 20, 120, 40).finish();
    assert.equal(indicator(owner).height, 2);
    assert.equal(indicator(owner).width, 120);
    assert.equal(indicator(owner).left, 20);
});

test('rapid indicator retargeting ends at the accepted current tab and disposes all running motion', () => {
    const owner = make();
    measure(owner, 'first', 0, 100, 40).finish();
    measure(owner, 'last', 200, 100, 60);
    owner.update({ value: 'last' });
    assert.ok(
        owner.shared.some((shared) => shared.animation),
        'selection starts spatial motion'
    );
    owner.update({ value: 'first' }).finish();
    assert.equal(indicator(owner).left, 32);
    assert.equal(indicator(owner).width, 36);
    owner.update({ value: 'last' }).unmount();
    assert.equal(
        owner.shared.some((shared) => shared.animation),
        false
    );
});

for (const direction of ['ltr', 'rtl']) {
    test(`${direction}: selected tab reveal is centered and clamped to physical content bounds`, () => {
        rtl = direction === 'rtl';
        const owner = scrollFixture();
        owner.finish();
        assert.deepEqual(owner.commands.at(-1), { x: 700, y: 0, animated: false });
        owner.update({ value: 'first' });
        measure(owner, 'first', 52).finish();
        assert.deepEqual(owner.commands.at(-1), { x: 0, y: 0, animated: false });
    });
}

test('manual scrolling cancels automatic reveal and stale animation completion cannot jump back', () => {
    const owner = scrollFixture();
    const scrolling = owner.shared.find((shared) => shared.animation?.to === 700);
    assert.ok(scrolling, 'offscreen selection schedules a reveal');
    const staleCompletion = scrolling.animation.callback;
    const scroll = owner.native('AnimatedScrollView');
    owner.event(scroll.props.onScroll.onBeginDrag);
    owner.event(scroll.props.onScroll.onScroll, { contentOffset: { x: 320 } });
    const commands = owner.commands.length;
    if (staleCompletion) owner.event(staleCompletion, true);
    assert.equal(scrolling.animation, null);
    assert.equal(owner.commands.length, commands, 'completed old request must not override a drag');
});

test('new selection invalidates a previous reveal even when its completion arrives late', () => {
    const owner = scrollFixture();
    const scrolling = owner.shared.find((shared) => shared.animation?.to === 700);
    const staleCompletion = scrolling.animation.callback;
    measure(owner, 'first', 52);
    owner.update({ value: 'first' });
    const commands = owner.commands.length;
    if (staleCompletion) owner.event(staleCompletion, true);
    assert.equal(owner.commands.length, commands);
    owner.finish();
    assert.equal(owner.commands.at(-1).x, 0);
    assert.equal(owner.commands.at(-1).animated, false);
});

test('viewport changes retarget reveal to the new bound without retaining a portrait offset', () => {
    const owner = scrollFixture().finish();
    owner.layout('tabs', { x: 0, y: 0, width: 600, height: 48 }).finish();
    assert.deepEqual(owner.commands.at(-1), { x: 400, y: 0, animated: false });
    owner.layout('tabs', { x: 0, y: 0, width: 1200, height: 48 }).finish();
    assert.deepEqual(owner.commands.at(-1), { x: 0, y: 0, animated: false });
});

test('reduced motion settles indicator and reveal immediately through the same selection contract', () => {
    theme.animation.scale = 0;
    const owner = scrollFixture();
    measure(owner, 'first', 52);
    owner.update({ value: 'first' });
    assert.equal(
        owner.shared.some((shared) => shared.animation),
        false
    );
    assert.equal(indicator(owner).left, 84);
    assert.equal(owner.commands.at(-1).x, 0);
    assert.equal(owner.commands.at(-1).animated, false);
});

for (const direction of ['ltr', 'rtl']) {
    test(`${direction}: fractional pager progress moves the indicator and tab colors before controlled selection`, () => {
        rtl = direction === 'rtl';
        const position = {
            value: 0,
            get() {
                return this.value;
            },
        };
        const owner = make({
            position,
            items: [
                { key: 'first', label: 'First', icon: 'flight' },
                { key: 'last', label: 'Last', icon: 'explore' },
            ],
        });
        const labelColor = (key) => flatten(owner.find(`tabs-${key}-label`).props.style).color;
        const iconHighlight = (key) => flatten(owner.find(`tabs-${key}-icon`).props.children.props.children[1].props.style).opacity;
        measure(owner, 'first', rtl ? 200 : 0, 100, 40);
        measure(owner, 'last', rtl ? 0 : 200, 100, 60);
        position.value = 0.5;
        const style = indicator(owner);
        assert.equal(style.left, 127);
        assert.equal(style.width, 46);
        assert.equal(owner.find('tabs-first').props.accessibilityState.selected, true);
        assert.equal(owner.find('tabs-last').props.accessibilityState.selected, false);
        assert.equal(iconHighlight('first'), 0.5);
        assert.equal(iconHighlight('last'), 0.5);
        position.value = 0.75;
        assert.equal(labelColor('first'), theme.colors.onSurfaceVariant);
        assert.equal(labelColor('last'), theme.colors.primary);
        position.value = 1;
        assert.equal(indicator(owner).left, rtl ? 22 : 222);
        assert.equal(indicator(owner).width, 56);
        assert.equal(iconHighlight('last'), 1);
        assert.equal(owner.find('tabs-first').props.accessibilityState.selected, true);
    });
}

test('indicator rejects nonfinite measurements and recovers on the next real layout event', () => {
    const owner = make();
    owner.layout('tabs-first', { x: NaN, width: Infinity, height: 48 });
    assert.equal(owner.has('tabs-indicator'), false);
    measure(owner, 'first', 0).finish();
    assert.equal(Number.isFinite(indicator(owner).left), true);
    assert.equal(Number.isFinite(indicator(owner).width), true);
});

test('horizontal scrollbars remain opt-in on the original scrollable component', () => {
    const owner = make({ scrollable: true });
    assert.equal(owner.native('AnimatedScrollView').props.showsHorizontalScrollIndicator, false);
    owner.update({ scrollIndicators: { horizontal: true } });
    assert.equal(owner.native('AnimatedScrollView').props.showsHorizontalScrollIndicator, true);
});

test('offscreen keyboard focus reveals the target without moving the selected indicator or panel', () => {
    const requests = [];
    const owner = scrollFixture({ value: 'first', onValueChange: (value) => requests.push(value) });
    measure(owner, 'first', 52).finish();
    key(owner, 'first', 'End');
    owner.finish();
    assert.equal(owner.commands.at(-1).x, 700);
    assert.equal(indicator(owner).left, 84);
    assert.deepEqual(requests, []);
    key(owner, 'last', 'Enter');
    assert.deepEqual(requests, ['last']);
});

test('an external selection supersedes an earlier focus reveal, while later arrows still reveal keyboard focus', () => {
    const requests = [];
    const owner = make({
        items: ['a', 'b', 'c', 'd'].map((key) => ({ key, label: key.toUpperCase() })),
        value: 'a',
        scrollable: true,
        onValueChange: (value) => requests.push(value),
    });
    owner.layout('tabs', { x: 0, y: 0, width: 300, height: 48 });
    owner.layout('tabs-row', { x: 0, y: 0, width: 1500, height: 48 });
    for (const [tab, x] of [
        ['a', 52],
        ['b', 400],
        ['c', 800],
        ['d', 1200],
    ])
        measure(owner, tab, x);
    owner.finish();
    key(owner, 'a', 'ArrowRight');
    owner.finish();
    assert.equal(owner.commands.at(-1).x, 300, 'focus B is revealed while value is A');
    owner.update({ value: 'c' }).finish();
    assert.equal(owner.commands.at(-1).x, 700, 'the external destination C wins over the old reveal of B');
    assert.equal(owner.find('tabs-c').props.accessibilityState.selected, true);
    key(owner, 'b', 'ArrowRight');
    key(owner, 'c', 'ArrowRight');
    owner.finish();
    assert.equal(owner.commands.at(-1).x, 1100, 'new keyboard focus D is revealed within the current selection session');
    assert.equal(owner.find('tabs-c').props.accessibilityState.selected, true);
    assert.deepEqual(requests, [], 'focus navigation has not activated another destination');
});

test('the native text host explicitly follows the component locale in both writing directions', () => {
    for (const direction of ['ltr', 'rtl']) {
        rtl = direction === 'rtl';
        const owner = make({ items: [{ key: 'first', label: rtl ? 'موسيقى' : 'Music' }] });
        assert.equal(flatten(owner.find('tabs-first-label').props.style).writingDirection, direction);
    }
});

test('fractional content progress also reveals the scrollable row on the UI path in both directions', () => {
    for (const direction of ['ltr', 'rtl']) {
        rtl = direction === 'rtl';
        const position = makePosition();
        const owner = make({ items: [items[0], items[2]], scrollable: true, position });
        owner.layout('tabs', { x: 0, y: 0, width: 300, height: 48 });
        owner.layout('tabs-row', { x: 0, y: 0, width: 1000, height: 48 });
        measure(owner, 'first', rtl ? 800 : 52);
        measure(owner, 'last', rtl ? 52 : 800);
        owner.pulseUI();
        assert.equal(owner.commands.at(-1).x, rtl ? 700 : 0);
        position.set(0.5);
        owner.pulseUI();
        assert.equal(owner.commands.at(-1).x, 326);
        position.set(1);
        owner.pulseUI();
        assert.equal(owner.commands.at(-1).x, rtl ? 0 : 700);
    }
});

test('keyboard wrapping changes focus only and still skips unavailable destinations', () => {
    const requests = [];
    const owner = make({ value: 'last', onValueChange: (value) => requests.push(value) });
    key(owner, 'last', 'ArrowRight');
    assert.equal(owner.focus.at(-1), 'tabs-first');
    assert.deepEqual(requests, []);
    assert.equal(owner.find('tabs-last').props.accessibilityState.selected, true);
});

test('tab activation is reported independently from a controlled selection change', () => {
    const activations = [],
        requests = [];
    const owner = make({ onTabPress: (value) => activations.push(value), onValueChange: (value) => requests.push(value) });
    owner.press('tabs-first').press('tabs-last').press('tabs-locked');
    assert.deepEqual(activations, ['first', 'last']);
    assert.deepEqual(requests, ['last']);
    key(owner, 'first', 'ArrowRight');
    assert.deepEqual(activations, ['first', 'last'], 'moving keyboard focus is not activation');
    key(owner, 'last', 'Enter');
    assert.deepEqual(activations, ['first', 'last', 'last']);
});

test('unselected hover, focus and press use onSurface and cancellation restores the inactive color', () => {
    theme.animation.scale = 0;
    const owner = make();
    const label = () => flatten(owner.find('tabs-last-label').props.style);
    assert.equal(label().color, theme.colors.onSurfaceVariant);
    owner.event(owner.find('tabs-last').props.onHoverIn);
    assert.equal(label().color, theme.colors.onSurface);
    assert.equal(flatten(owner.find('tabs-last-state-layer').props.style).opacity, 0.08);
    owner.event(owner.find('tabs-last').props.onFocus, {});
    owner.event(owner.find('tabs-last').props.onHoverOut);
    assert.equal(label().color, theme.colors.onSurface);
    assert.equal(flatten(owner.find('tabs-last-state-layer').props.style).opacity, 0.1);
    owner.event(owner.find('tabs-last').props.onBlur, {});
    owner.event(owner.find('tabs-last').props.onPressIn);
    assert.equal(label().color, theme.colors.onSurface);
    owner.event(owner.find('tabs-last').props.onTouchCancel);
    assert.equal(label().color, theme.colors.onSurfaceVariant);
    assert.equal(owner.has('tabs-last-state-layer'), false);
});

test('primary and secondary active label colors follow their own semantic roles', () => {
    theme.animation.scale = 0;
    const owner = make();
    assert.equal(flatten(owner.find('tabs-first-label').props.style).color, theme.colors.primary);
    owner.update({ variant: 'secondary' });
    assert.equal(flatten(owner.find('tabs-first-label').props.style).color, theme.colors.onSurface);
});

test('a primary inactive tab presses with onSurface state color and an active tab presses with primary', () => {
    const owner = make();
    assert.equal(owner.find('tabs-last').props.rippleColor, `${theme.colors.onSurface}@0.1`);
    assert.equal(owner.find('tabs-last').props.underlayColor, `${theme.colors.onSurface}@0.1`);
    assert.equal(owner.find('tabs-first').props.rippleColor, `${theme.colors.primary}@0.1`);
    owner.update({ variant: 'secondary' });
    assert.equal(owner.find('tabs-first').props.rippleColor, `${theme.colors.onSurface}@0.1`);
});

test('disabling a hovered focused tab removes interactive state and keyboard access immediately', () => {
    theme.animation.scale = 0;
    const owner = make();
    owner.event(owner.find('tabs-last').props.onHoverIn);
    owner.event(owner.find('tabs-last').props.onFocus, {});
    owner.event(owner.find('tabs-last').props.onPressIn);
    assert.equal(owner.has('tabs-last-state-layer'), true);
    owner.update({ items: items.map((item) => (item.key === 'last' ? { ...item, disabled: true } : item)) });
    assert.equal(owner.has('tabs-last-state-layer'), false);
    assert.equal(owner.find('tabs-last').props.tabIndex, -1);
    assert.equal(owner.find('tabs-last').props.disabled, true);
    owner.update({ items });
    assert.equal(
        flatten(owner.find('tabs-last-label').props.style).color,
        theme.colors.onSurfaceVariant,
        'reenabling cannot restore a stale hover or held press'
    );
});

test('selection color uses default effects to enter and fast effects to leave without overshoot', () => {
    const owner = make().finish();
    owner.update({ value: 'last' });
    const entering = owner.shared.find((value) => value.animation?.to === 1);
    const leaving = owner.shared.find((value) => value.animation?.to === 0);
    assert.ok(entering && leaving, 'both old and new labels animate their selection color');
    assert.equal(entering.animation.config.stiffness, theme.motion.spring.default.effects.stiffness);
    assert.equal(leaving.animation.config.stiffness, theme.motion.spring.fast.effects.stiffness);
    assert.equal(entering.animation.config.overshootClamping, true);
    assert.equal(leaving.animation.config.overshootClamping, true);
    owner.unmount();
    assert.equal(
        owner.shared.some((shared) => shared.animation),
        false
    );
});

const pagerItems = [
    { key: 'first', label: 'First' },
    { key: 'middle', label: 'Middle' },
    { key: 'last', label: 'Last' },
];
function makePosition(initial = 0) {
    return {
        value: initial,
        get() {
            return this.value;
        },
        set(value) {
            this.value = value;
        },
    };
}
const pager = (overrides = {}) => {
    const position = makePosition();
    const requests = [];
    const owner = new Runner(TabsContentPager, {
        items: pagerItems,
        value: 'first',
        position,
        onValueChange: (value) => requests.push(value),
        renderPage: (item) => jsx('ScrollView', { testID: `body-${item.key}`, nestedScrollEnabled: true }),
        testID: 'pages',
        ...overrides,
    });
    owner.layout('pages', { x: 0, y: 0, width: 300, height: 480 });
    return { owner, position, requests };
};
const pageEvent = (owner, handler, x, velocity = 0, details = {}) =>
    owner.event(owner.find('pages-scroll').props.onScroll[handler], {
        contentOffset: { x },
        velocity: { x: velocity },
        ...details,
    });
const pageDecelerate = (owner, x, details) => {
    pageEvent(owner, 'onEndDrag', x, 0.3, details);
    pageEvent(owner, 'onMomentumBegin', x, 0, details);
};

for (const direction of ['ltr', 'rtl']) {
    test(`${direction}: page swipes share fractional indicator progress and activate the final visible panel`, () => {
        rtl = direction === 'rtl';
        const { owner, position, requests } = pager();
        assert.equal(owner.commands.at(-1).x, rtl ? 600 : 0);
        assert.equal(owner.find('pages-scroll').props.pagingEnabled, true);
        assert.equal(owner.find('pages-scroll').props.bounces, false);
        pageEvent(owner, 'onBeginDrag', rtl ? 600 : 0);
        pageEvent(owner, 'onScroll', rtl ? 450 : 150);
        assert.equal(position.get(), 0.5);
        assert.deepEqual(requests, []);
        pageDecelerate(owner, rtl ? 450 : 150);
        pageEvent(owner, 'onMomentumEnd', 300);
        assert.equal(position.get(), 1);
        assert.deepEqual(requests, [], 'native UI progress is committed once queued RN work is delivered');
        owner.flush();
        assert.deepEqual(requests, ['middle']);
        owner.update({ value: 'middle' });
        assert.equal(owner.find('pages-page-middle').props.accessibilityElementsHidden, false);
        assert.equal(owner.find('pages-page-first').props.accessibilityElementsHidden, true);
        const rendered = owner.find('pages-scroll').props.children;
        assert.equal(rendered[0].props.testID, `pages-page-${rtl ? 'last' : 'first'}`);
    });
    test(`${direction}: taps move the pager to the matching physical destination and preserve sibling pages`, () => {
        rtl = direction === 'rtl';
        const { owner } = pager();
        const ids = () =>
            walk(owner.tree)
                .filter((node) => String(node.props.testID).startsWith('body-'))
                .map((node) => node.props.testID)
                .sort();
        const before = ids();
        owner.update({ value: 'last' });
        assert.equal(owner.commands.at(-1).x, rtl ? 0 : 600);
        assert.equal(owner.commands.at(-1).animated, true);
        assert.deepEqual(ids(), before, 'vertical page containers remain mounted across selections');
        assert.ok(
            walk(owner.tree)
                .filter((node) => String(node.props.testID).startsWith('body-'))
                .every((node) => node.props.nestedScrollEnabled)
        );
    });
}

test('pager resize settles the selected page immediately at its new width', () => {
    const { owner, position, requests } = pager({ value: 'middle' });
    owner.layout('pages', { x: 0, y: 0, width: 600, height: 300 });
    assert.equal(owner.commands.at(-1).x, 600);
    assert.equal(owner.commands.at(-1).animated, false);
    assert.equal(position.get(), 1);
    assert.equal(owner.find('pages-page-middle').props.style.width, 600);
    assert.deepEqual(requests, []);
});

test('a reduced-motion tap settles the pager without a native scrolling animation', () => {
    theme.animation.scale = 0;
    const { owner, position } = pager();
    owner.update({ value: 'last' });
    assert.equal(owner.commands.at(-1).x, 600);
    assert.equal(owner.commands.at(-1).animated, false);
    assert.equal(position.get(), 2);
});

test('a drag that ends exactly on a page boundary commits even without momentum', () => {
    const { owner, requests } = pager();
    pageEvent(owner, 'onBeginDrag', 0);
    pageEvent(owner, 'onEndDrag', 300);
    owner.flush();
    assert.deepEqual(requests, ['middle']);
});

test('a release at a page boundary waits when native paging projects a different destination', () => {
    const { owner, requests } = pager();
    pageEvent(owner, 'onBeginDrag', 0);
    pageEvent(owner, 'onEndDrag', 300, 0, { targetContentOffset: { x: 600 } });
    owner.flush();
    assert.deepEqual(requests, []);
    pageEvent(owner, 'onMomentumBegin', 300);
    pageEvent(owner, 'onMomentumEnd', 600);
    owner.flush();
    assert.deepEqual(requests, ['last']);
});

test('a partial drag waits for the final page and clamps overscroll rather than wrapping', () => {
    const { owner, position, requests } = pager();
    pageEvent(owner, 'onBeginDrag', 0);
    pageEvent(owner, 'onEndDrag', 150, 0.3);
    owner.flush();
    assert.deepEqual(requests, []);
    pageEvent(owner, 'onScroll', -50);
    assert.equal(position.get(), 0);
    pageEvent(owner, 'onMomentumBegin', 150);
    pageEvent(owner, 'onMomentumEnd', 900);
    owner.flush();
    assert.equal(position.get(), 2);
    assert.deepEqual(requests, ['last']);
});

test('queued swipe completion cannot override a subsequent tap to another page', () => {
    const { owner, requests } = pager();
    pageEvent(owner, 'onBeginDrag', 0);
    pageDecelerate(owner, 180);
    pageEvent(owner, 'onMomentumEnd', 300);
    owner.update({ value: 'last' });
    owner.flush();
    assert.deepEqual(requests, [], 'a later controlled selection supersedes the old gesture');
});

test('queued swipe completion cannot select a page after resize or unmount', () => {
    const { owner, requests } = pager();
    pageEvent(owner, 'onBeginDrag', 0);
    pageDecelerate(owner, 180);
    pageEvent(owner, 'onMomentumEnd', 300);
    owner.layout('pages', { x: 0, y: 0, width: 600, height: 300 });
    owner.flush();
    assert.deepEqual(requests, []);
    pageEvent(owner, 'onBeginDrag', 0);
    pageDecelerate(owner, 320);
    pageEvent(owner, 'onMomentumEnd', 600);
    owner.unmount();
    owner.flush();
    assert.deepEqual(requests, []);
});

test('drag-end and momentum-end for the same page do not emit duplicate activations', () => {
    const { owner, requests } = pager();
    pageEvent(owner, 'onBeginDrag', 0);
    pageEvent(owner, 'onEndDrag', 300);
    pageEvent(owner, 'onMomentumEnd', 300);
    owner.flush();
    assert.deepEqual(requests, ['middle']);
});

test('late native momentum from a previous drag cannot override a newer tab tap', () => {
    for (const oldHandler of [false, true]) {
        const { owner, requests } = pager();
        pageEvent(owner, 'onBeginDrag', 0);
        pageDecelerate(owner, 180);
        const staleMomentum = owner.find('pages-scroll').props.onScroll.onMomentumEnd;
        owner.update({ value: 'last' });
        owner.event(oldHandler ? staleMomentum : owner.find('pages-scroll').props.onScroll.onMomentumEnd, { contentOffset: { x: 300 } });
        owner.flush();
        assert.deepEqual(requests, [], 'gesture revision belongs to the old drag, even when the event arrives natively after a tap');
    }
});

test('programmatic scroll completions do not invent a new destination', () => {
    const { owner, requests } = pager();
    owner.update({ value: 'last' });
    pageEvent(owner, 'onMomentumEnd', 300);
    owner.flush();
    assert.deepEqual(requests, [], 'only a valid current user drag commits a pager destination');
});

test('a child can own swipes while tab taps retain animated pager and indicator movement', () => {
    for (const direction of ['ltr', 'rtl']) {
        rtl = direction === 'rtl';
        const { owner, position, requests } = pager({ swipeEnabled: false });
        assert.equal(owner.find('pages-scroll').props.scrollEnabled, false);
        owner.update({ value: 'last' });
        assert.equal(owner.commands.at(-1).animated, true);
        assert.equal(owner.commands.at(-1).x, rtl ? 0 : 600);
        pageEvent(owner, 'onScroll', 300);
        assert.equal(position.get(), 1, 'the native programmatic scroll still drives the shared indicator');
        pageEvent(owner, 'onBeginDrag', 300);
        pageEvent(owner, 'onMomentumEnd', 300);
        owner.flush();
        assert.deepEqual(requests, [], 'a disabled user gesture cannot commit the intermediate animated offset');
        owner.unmount();
    }
});

test('transferring swipe ownership invalidates both queued and late native gesture completion', () => {
    for (const queued of [false, true]) {
        const { owner, requests } = pager();
        pageEvent(owner, 'onBeginDrag', 0);
        pageDecelerate(owner, 180);
        const oldEnd = owner.find('pages-scroll').props.onScroll.onMomentumEnd;
        if (queued) pageEvent(owner, 'onMomentumEnd', 300);
        owner.update({ swipeEnabled: false });
        if (!queued) owner.event(oldEnd, { contentOffset: { x: 300 } });
        owner.flush();
        assert.deepEqual(requests, []);
        assert.equal(owner.find('pages-scroll').props.scrollEnabled, false);
        owner.unmount();
    }
});

test('a stale native scroll callback cannot move the indicator after the pager has been disabled and snapped', () => {
    const { owner, position, requests } = pager();
    const oldScroll = owner.find('pages-scroll').props.onScroll.onScroll;
    pageEvent(owner, 'onBeginDrag', 0);
    pageEvent(owner, 'onScroll', 150);
    assert.equal(position.get(), 0.5);
    owner.update({ enabled: false });
    assert.equal(position.get(), 0);
    owner.event(oldScroll, { contentOffset: { x: 150 } });
    assert.equal(position.get(), 0, 'the canceled native gesture must not restore an interrupted fractional indicator');
    assert.deepEqual(requests, []);
});

test('finishing a swipe on a disabled destination restores the accepted page and indicator position', () => {
    for (const direction of ['ltr', 'rtl']) {
        for (const reduced of [false, true]) {
            rtl = direction === 'rtl';
            theme.animation.scale = reduced ? 0 : 1;
            const { owner, position, requests } = pager({
                items: pagerItems.map((item) => (item.key === 'middle' ? { ...item, disabled: true } : item)),
            });
            pageEvent(owner, 'onBeginDrag', rtl ? 600 : 0);
            pageEvent(owner, 'onScroll', 300);
            const commands = owner.commands.length;
            pageDecelerate(owner, 300);
            pageEvent(owner, 'onMomentumEnd', 300);
            owner.flush();
            assert.deepEqual(requests, [], `${direction}/${reduced}: disabled content cannot become selected`);
            assert.ok(owner.commands.length > commands, `${direction}/${reduced}: rejected swipe explicitly requests a return`);
            assert.equal(owner.commands.at(-1).x, rtl ? 600 : 0, `${direction}/${reduced}: native pager returns to the accepted page`);
            assert.equal(position.get(), 0, `${direction}/${reduced}: the logical indicator must return with the content`);
            assert.equal(owner.find('pages-page-first').props.accessibilityElementsHidden, false);
            assert.equal(owner.find('pages-page-middle').props.accessibilityElementsHidden, true);
        }
    }
});

test('a second user drag supersedes an earlier queued page commit before the controlled value changes', () => {
    const { owner, requests } = pager();
    pageEvent(owner, 'onBeginDrag', 0);
    pageDecelerate(owner, 180);
    pageEvent(owner, 'onMomentumEnd', 300);
    pageEvent(owner, 'onBeginDrag', 300);
    owner.flush();
    assert.deepEqual(requests, [], 'the first completed gesture no longer owns selection once another drag starts');
    pageDecelerate(owner, 480);
    pageEvent(owner, 'onMomentumEnd', 600);
    owner.flush();
    assert.deepEqual(requests, ['last']);
});

test('an earlier momentum completion cannot pull a second drag back to the middle page', () => {
    const { owner, position, requests } = pager();
    pageEvent(owner, 'onBeginDrag', 0);
    pageDecelerate(owner, 180);
    pageEvent(owner, 'onBeginDrag', 300);
    pageEvent(owner, 'onScroll', 450);
    pageEvent(owner, 'onMomentumEnd', 300);
    owner.flush();
    assert.equal(position.get(), 1.5, 'a completion from the previous swipe cannot rewind the indicator');
    assert.deepEqual(requests, []);
    pageEvent(owner, 'onEndDrag', 600);
    owner.flush();
    assert.deepEqual(requests, ['last']);
});

test('an out-of-order native event cannot finish a newer swipe that is already decelerating', () => {
    const { owner, position, requests } = pager();
    pageEvent(owner, 'onBeginDrag', 0, 0, { timestamp: 1 });
    pageDecelerate(owner, 180, { timestamp: 2 });
    pageEvent(owner, 'onBeginDrag', 300, 0, { timestamp: 4 });
    pageDecelerate(owner, 450, { timestamp: 5 });
    pageEvent(owner, 'onScroll', 450, 0, { timestamp: 6 });
    pageEvent(owner, 'onScroll', 300, 0, { timestamp: 3 });
    pageEvent(owner, 'onMomentumEnd', 300, 0, { timestamp: 3 });
    owner.flush();
    assert.equal(position.get(), 1.5);
    assert.deepEqual(requests, []);
    pageEvent(owner, 'onMomentumEnd', 600, 0, { timestamp: 7 });
    owner.flush();
    assert.deepEqual(requests, ['last']);
});

test('accepting page two from a swipe cannot cancel an already active swipe to page three', () => {
    const requests = [];
    const { owner, position } = pager({
        onValueChange(value) {
            requests.push(value);
            // The controlled owner accepts this request in the same React batch.
            // The UI thread may start another gesture before that batch commits.
            owner.props = { ...owner.props, value };
            if (value === 'middle') {
                pageEvent(owner, 'onBeginDrag', 300);
                pageEvent(owner, 'onScroll', 450);
            }
        },
    });
    pageEvent(owner, 'onBeginDrag', 0);
    pageEvent(owner, 'onEndDrag', 300);
    const commands = owner.commands.length;
    owner.flush();
    assert.deepEqual(requests, ['middle']);
    assert.equal(owner.find('pages-page-middle').props.accessibilityElementsHidden, false);
    assert.equal(owner.commands.length, commands, 'acknowledging a swipe cannot issue a competing scroll command');
    assert.equal(position.get(), 1.5);
    pageEvent(owner, 'onEndDrag', 600);
    owner.flush();
    assert.deepEqual(requests, ['middle', 'last']);
    assert.equal(owner.find('pages-page-last').props.accessibilityElementsHidden, false);
    pageEvent(owner, 'onMomentumEnd', 300);
    owner.flush();
    assert.equal(position.get(), 2);
    assert.deepEqual(requests, ['middle', 'last']);
});

test('pointer focus does not leave a keyboard ring but keyboard activation restores it', () => {
    theme.animation.scale = 0;
    const owner = make();
    owner.event(owner.find('tabs-last').props.onFocus, { currentTarget: { matches: () => false } });
    assert.equal(owner.has('tabs-last-focus-ring'), false);
    owner.event(owner.find('tabs-last').props.onHoverIn);
    owner.event(owner.find('tabs-last').props.onHoverOut);
    assert.equal(owner.has('tabs-last-state-layer'), false);
    owner.event(owner.find('tabs-last').props.onKeyDown, { nativeEvent: { key: 'Enter' }, preventDefault() {} });
    assert.equal(owner.has('tabs-last-focus-ring'), true);
    assert.equal(flatten(owner.find('tabs-last-focus-ring').props.style).borderWidth, 3);
    owner.event(owner.find('tabs-last').props.onPressIn, { nativeEvent: { pageX: 10 } });
    assert.equal(owner.has('tabs-last-focus-ring'), false);
});
test('linked tabs expose controls while panels use their supplied stable IDs', () => {
    const linked = pagerItems.map(item => ({ ...item, nativeID: `tab-${item.key}`, panelID: `panel-${item.key}` }));
    const tabs = make({ items: linked });
    assert.equal(tabs.find('tabs-first').props['aria-controls'], 'panel-first');
    const { owner } = pager({ items: linked });
    assert.equal(owner.find('pages-page-first').props.nativeID, 'panel-first');
});
test('a declined swipe requests a return to the accepted controlled page', () => {
    const { owner, requests, position } = pager();
    pageEvent(owner, 'onBeginDrag', 0);
    pageEvent(owner, 'onScroll', 300);
    pageDecelerate(owner, 300);
    pageEvent(owner, 'onMomentumEnd', 300);
    owner.flush();
    assert.deepEqual(requests, ['middle']);
    assert.equal(owner.commands.at(-1).x, 0);
    assert.equal(owner.find('pages-page-first').props.accessibilityElementsHidden, false);
    pageEvent(owner, 'onScroll', 0);
    assert.equal(position.get(), 0);
});

test('tab feedback has one native child in every focus state', () => {
    const owner = make();
    for (const element of walk(owner.tree).filter(node => node.type === 'TouchableRipple'))
        assert.ok(element.props.children && !Array.isArray(element.props.children));
    owner.event(owner.find('tabs-last').props.onFocus, { currentTarget: { matches: () => true } });
    for (const element of walk(owner.tree).filter(node => node.type === 'TouchableRipple'))
        assert.ok(element.props.children && !Array.isArray(element.props.children));
});

test('a tab disabled while focused cannot resurrect a stale roving focus when re-enabled', () => {
    const owner = make();
    owner.event(owner.find('tabs-last').props.onFocus, { currentTarget: { matches: () => true } });
    const items = owner.props.items;
    owner.update({ items: items.map(item => item.key === 'last' ? { ...item, disabled: true } : item) });
    assert.equal(owner.find('tabs-first').props.tabIndex, 0);
    owner.update({ items });
    assert.equal(owner.find('tabs-first').props.tabIndex, 0);
    assert.equal(owner.find('tabs-last').props.tabIndex, -1);
});

for (const { name, error } of failures) console.error(`FAIL ${name}\n${error.stack}`);
assert.equal(failures.length, 0, `${failures.length}/${cases} Tabs cases failed`);
console.log(`PASS ${cases} focused Tabs controller cases (native interaction remains device verification).`);
