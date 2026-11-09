/**
 * Run with: node scripts/verify-mobile-design-overlays.cjs
 *
 * Executes the real TypeScript presence, sheet, navigation and search controllers.
 * User invariants cover interrupted dismissal, disposed callbacks, controlled
 * selection, keyboard focus and cleanup. Animation completions, native Back and
 * requestAnimationFrame can deliberately arrive late or in a different order.
 *
 * Limits: hook/JSX/native-view doubles are not React's concurrent scheduler,
 * Reanimated's native engine, Paper's press engine or Gorhom's gesture physics.
 * A native press honours the primitive's disabled/pointer-events contract; this
 * suite checks that the actual component supplies and wires that contract.
 * It does not render pixels, measure layout/FPS, assert visual curves, exercise
 * keyboard insets, or substitute for VoiceOver/TalkBack and device interaction.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
let active;
const failures = [];
let cases = 0;
const theme = {
    animation: { scale: 1 },
    colors: {
        primary: '#6750a4',
        secondary: '#625b71',
        onSurface: '#1d1b20',
        onSurfaceVariant: '#49454f',
        secondaryContainer: '#e8def8',
        onSecondaryContainer: '#1d192b',
        surface: '#fef7ff',
        surfaceContainer: '#f3edf7',
        surfaceContainerLow: '#f7f2fa',
        surfaceContainerHigh: '#ece6f0',
        surfaceContainerHighest: '#e6e0e9',
        surfaceVariant: '#e7e0ec',
        outline: '#79747e',
        outlineVariant: '#cac4d0',
        inverseSurface: '#322f35',
        inverseOnSurface: '#f5eff7',
        inversePrimary: '#d0bcff',
        scrim: '#000000',
        stateLayerPressed: '#1d1b201a',
        error: '#b3261e',
        onError: '#ffffff',
    },
    fonts: {
        bodyLarge: { fontFamily: 'Roboto', fontSize: 16 },
        labelSmall: { fontFamily: 'Roboto', fontWeight: '500', fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },
        titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: 0.1 },
        labelMedium: { lineHeight: 16 },
        titleLarge: { lineHeight: 28 },
        headlineMedium: { lineHeight: 36 },
        displaySmall: { lineHeight: 44 },
    },
    motion: {
        duration: { medium2: 300, medium4: 400, long2: 500 },
        easing: { emphasized: [0.2, 0, 0, 1], standard: [0.2, 0, 0, 1] },
        spring: {
            default: { spatial: { stiffness: 380, damping: 0.8 }, effects: { stiffness: 1600, damping: 1 } },
            fast: { spatial: { stiffness: 800, damping: 0.6 }, effects: { stiffness: 3800, damping: 1 } },
            slow: { spatial: { stiffness: 200, damping: 0.8 } },
        },
    },
};
const dimensions = { width: 390, height: 844, fontScale: 1 };
const insets = { top: 44, right: 0, bottom: 34, left: 0 };
const direction = { isRTL: false };

function test(name, run) {
    cases += 1;
    try {
        run();
    } catch (error) {
        failures.push({ name, error });
    }
}

function sameDependencies(previous, next) {
    return previous && next && previous.length === next.length && previous.every((value, index) => Object.is(value, next[index]));
}

function hook(initialize) {
    const owner = active;
    const index = owner.cursor++;
    return owner.hooks[index] ?? (owner.hooks[index] = initialize());
}

function effect(kind, create, dependencies) {
    const owner = active;
    const slot = hook(() => ({}));
    if (!sameDependencies(slot.dependencies, dependencies)) {
        slot.dependencies = dependencies;
        owner[kind].push(() => {
            slot.cleanup?.();
            slot.cleanup = create();
        });
    }
}

let nextFocusIdentity = 0;
const React = {
    useId: () => React.useMemo(() => `overlay-focus-${++nextFocusIdentity}`, []),
    createContext(initial) {
        const context = { value: initial };
        context.Provider = function ContextProvider() {};
        context.Provider.context = context;
        return context;
    },
    useContext: (context) => context.value,
    useState(initial) {
        const owner = active;
        const slot = hook(() => ({ value: typeof initial === 'function' ? initial() : initial }));
        return [
            slot.value,
            (value) => {
                assert.ok(!owner.unmounted, 'a disposed component cannot update React state');
                const next = typeof value === 'function' ? value(slot.value) : value;
                if (!Object.is(next, slot.value)) {
                    slot.value = next;
                    owner.dirty = true;
                }
            },
        ];
    },
    useRef: (current) => hook(() => ({ current })),
    useReducer(reducer, initial, initialize) {
        const owner = active;
        const slot = hook(() => ({ value: initialize ? initialize(initial) : initial }));
        slot.reducer = reducer;
        return [
            slot.value,
            (action) => {
                assert.ok(!owner.unmounted, 'a disposed scenario cannot update its records');
                const next = slot.reducer(slot.value, action);
                if (!Object.is(next, slot.value)) {
                    slot.value = next;
                    owner.dirty = true;
                }
            },
        ];
    },
    useMemo(compute, dependencies) {
        const slot = hook(() => ({}));
        if (!sameDependencies(slot.dependencies, dependencies)) {
            slot.dependencies = dependencies;
            slot.value = compute();
        }
        return slot.value;
    },
    useCallback: (callback, dependencies) => React.useMemo(() => callback, dependencies),
    useEffect: (create, dependencies) => effect('effects', create, dependencies),
    useLayoutEffect: (create, dependencies) => effect('layoutEffects', create, dependencies),
    useImperativeHandle: (ref, create, dependencies) => effect('layoutEffects', () => {
        if (ref) ref.current = create();
        return () => { if (ref) ref.current = null; };
    }, dependencies),
};

function cancelAnimation(shared) {
    const animation = shared.animation;
    shared.animation = null;
    animation?.callback?.(false);
}

const reanimated = {
    View: 'AnimatedView',
    ScrollView: 'AnimatedScrollView',
    createAnimatedComponent: (component) => component,
    useReducedMotion: () => false,
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
                    if (owner.deferRNWrites && !owner.inUI) {
                        owner.ui.push(() => this.set(value));
                        return;
                    }
                    cancelAnimation(this);
                    if (value && typeof value === 'object' && value.kind) {
                        if (value.config.duration === 0) {
                            this.current = value.to;
                            value.callback?.(true);
                        } else {
                            this.animation = value;
                        }
                    } else {
                        this.current = value;
                    }
                },
            };
            owner.shared.push(shared);
            return shared;
        });
    },
    useAnimatedStyle: (compute) => ({ compute }),
    useAnimatedProps: (compute) => ({ compute }),
    useAnimatedRef: () => React.useRef(null),
    useAnimatedReaction: () => {},
    useAnimatedScrollHandler: (handlers) => handlers,
    scrollTo: (_ref, x, y, animated) => active.commands.push({ type: 'scroll', x, y, animated }),
    interpolateColor: (value, _range, colors) => colors[value < 0.5 ? 0 : 1],
    cancelAnimation,
    withTiming: (to, config, callback) => ({ kind: 'timing', to, config, callback }),
    withSpring: (to, config, callback) => ({ kind: 'spring', to, config, callback }),
    Easing: { bezier: (...curve) => curve },
    ReduceMotion: { Always: 'always', System: 'system', Never: 'never' },
};
reanimated.default = reanimated;

function createGesture() {
    const gesture = { handlers: {}, options: {} };
    let proxy;
    proxy = new Proxy(gesture, {
        get(target, name) {
            if (name in target) return target[name];
            return (value) => {
                if (typeof value === 'function') target.handlers[name] = value;
                else target.options[name] = value;
                return proxy;
            };
        },
    });
    return proxy;
}

const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
class NativeAnimatedValue {
    constructor(value) {
        this.value = value;
    }
    stopAnimation() {}
    setValue(value) {
        this.value = value;
    }
}
const modules = {
    'react-native-paper/lib/module/theme/accessibility/ReduceMotionContext': { ReduceMotionContext: { value: false } },
    '../typography': { Text: 'Text' },
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': {
        Text: 'Text',
        View: 'View',
        TextInput: 'TextInput',
        ScrollView: 'ScrollView',
        FlatList: 'FlatList',
        Modal: 'Modal',
        Pressable: 'Pressable',
        KeyboardAvoidingView: 'KeyboardAvoidingView',
        I18nManager: direction,
        Platform: { OS: 'ios', select(values) { return values[this.OS] ?? values.default; } },
        Animated: {
            Value: NativeAnimatedValue,
            spring: (value, config) => ({
                start() {
                    value.latest = config;
                },
                stop() {},
            }),
        },
        AccessibilityInfo: {
            announceForAccessibility() {},
            announceForAccessibilityWithOptions() {},
            isScreenReaderEnabled: () => Promise.resolve(false),
            addEventListener: () => ({ remove() {} }),
        },
        StyleSheet: {
            absoluteFill: { position: 'absolute', inset: 0 },
            flatten: (style) => (Array.isArray(style) ? Object.assign({}, ...style) : style),
        },
        useWindowDimensions: () => dimensions,
        Keyboard: {
            dismiss: () => {
                active.keyboardDismissals += 1;
            },
        },
        BackHandler: {
            addEventListener(_event, callback) {
                const owner = active;
                owner.backListeners.add(callback);
                return { remove: () => owner.backListeners.delete(callback) };
            },
        },
    },
    'react-native-paper': {
        Badge: 'Badge',
        Divider: 'Divider',
        Icon: 'Icon',
        IconButton: 'IconButton',
        Text: 'Text',
        Surface: 'Surface',
        TouchableRipple: 'TouchableRipple',
        ActivityIndicator: 'ActivityIndicator',
        Searchbar: 'Searchbar',
        Drawer: { Item: 'DrawerItem' },
        Card: Object.assign(() => {}, { Title: 'CardTitle', Content: 'CardContent', Cover: 'CardCover', Actions: 'CardActions' }),
        ThemeProvider: 'ThemeProvider',
        List: { Item: 'ListItem', Icon: 'ListIcon', Collection: 'ListCollection' },
        useTheme: () => theme,
        useLocale: () => ({ direction: direction.isRTL ? 'rtl' : 'ltr' }),
    },
    '@gorhom/bottom-sheet': {
        __esModule: true,
        default: 'BottomSheet',
        BottomSheetBackdrop: 'BottomSheetBackdrop',
        BottomSheetView: 'BottomSheetView',
        BottomSheetScrollView: 'BottomSheetScrollView',
        BottomSheetFlatList: 'BottomSheetFlatList',
        BottomSheetSectionList: 'BottomSheetSectionList',
        BottomSheetTextInput: 'BottomSheetTextInput',
    },
    './bottom-sheet-text-input': { BottomSheetTextInput: 'BottomSheetTextInput' },
    'react-native-gesture-handler': {
        Gesture: { Tap: createGesture, Pan: createGesture },
        GestureDetector: 'GestureDetector',
        usePanGesture: (config) => config,
        GestureHandlerRootView: 'GestureHandlerRootView',
    },
    'react-native-reanimated': reanimated,
    'react-native-safe-area-context': { useSafeAreaInsets: () => insets },
    'react-native-worklets': {
        scheduleOnRN: (callback, ...args) => active.queued.push(() => callback(...args)),
        scheduleOnUI: (callback, ...args) => active.ui.push(() => callback(...args)),
    },
    './icon-button': { IconButton: 'IconButton' },
    './button': { Button: 'Button' },
    './menu': { Menu: Object.assign(function MenuBoundary() {}, { Item: 'MenuItem' }) },
    '../core': { useMobileTheme: () => theme },
    '../native-modal': { NativeModal: 'Modal' },
    './content': { Badge: 'Badge', BadgedBox: 'BadgedBox', List: { Collection: 'ListCollection', Item: 'ListItem', Icon: 'ListIcon' } },
};

function load(file) {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, {
        exports,
        require(name) {
            const platformBoundary = require('./mobile-design-native-boundaries.cjs')(name, modules);
            if (platformBoundary) return platformBoundary;
            assert.ok(modules[name], `explicit test double is required for ${name}`);
            return modules[name];
        },
        requestAnimationFrame(callback) {
            const id = ++active.lastFrame;
            active.frames.set(id, callback);
            return id;
        },
        cancelAnimationFrame: (id) => active.frames.delete(id),
        setTimeout(callback, delay) {
            const id = ++active.lastTimer;
            active.timers.set(id, { callback, deadline: active.clock + delay });
            return id;
        },
        clearTimeout: (id) => active.timers.delete(id),
    });
    return exports;
}

modules['./press-scope'] = load('packages/mobile-design/src/components/press-scope.ts');
modules['../ripple'] = load('packages/mobile-design/src/ripple.tsx');
modules['./navigation-focus'] = load('packages/mobile-design/src/components/navigation-focus.ts');
modules['./focus-order'] = load('packages/mobile-design/src/components/focus-order.ts');
modules['./list-focus'] = load('packages/mobile-design/src/components/list-focus.tsx');
modules['../color'] = load('packages/mobile-design/src/color.ts');
const sheets = (modules['./sheets'] = load('packages/mobile-design/src/components/sheets.tsx'));
const { BottomSheet, SideSheet, useOverlayPresence } = sheets;
modules['./drawer'] = load('packages/mobile-design/src/components/drawer.tsx');
modules['./navigation-bar'] = load('packages/mobile-design/src/components/navigation-bar.tsx');
modules['./navigation-rail-layout'] = load('packages/mobile-design/src/components/navigation-rail-layout.ts');
modules['./tabs'] = load('packages/mobile-design/src/components/tabs.tsx');
const { Tabs, NavigationRail, NavigationDrawerModal, NavigationRailModal } = load('packages/mobile-design/src/components/navigation.tsx');
const { NavigationBar } = modules['./navigation-bar'];
modules['./appbar-layout'] = load('packages/mobile-design/src/components/appbar-layout.ts');
modules['./appbar-scroll-behavior'] = load('packages/mobile-design/src/components/appbar-scroll-behavior.tsx');
const { TopAppBar } = load('packages/mobile-design/src/components/appbar.tsx');
modules['./search-icon-button'] = load('packages/mobile-design/src/components/search-icon-button.tsx');
const { Searchbar: MobileSearchbar } = load('packages/mobile-design/src/components/searchbar.tsx');
// Keep the SearchView boundary inspectable; execute the actual shared wrapper
// independently below, rather than confusing it with Paper's native input engine.
modules['./searchbar'] = { Searchbar: 'Searchbar' };
const { SearchTrigger } = (modules['./search-trigger'] = load('packages/mobile-design/src/components/search-trigger.tsx'));
const { SearchView } = load('packages/mobile-design/src/components/search-view.tsx');
// Shared shadow geometry is rendered by web/native checks, not this host double.
modules['./action-surface'] = { AnimatedActionSurface: 'ActionSurface' };
const { Toolbar } = load('packages/mobile-design/src/components/toolbar.tsx');
modules['./choice-types'] = load('packages/mobile-design/src/components/choice-types.ts');
modules['./choice-motion'] = { ChoiceIndicator: 'ChoiceIndicator', useChoicePresence: visible=>({present:visible,style:{},origin:{set(){}}}) };
modules['./popup'] = { AnchoredPopup: 'AnchoredPopup' };
modules['./text-field'] = { TextField: 'TextField' };
modules['../outside-interaction'] = { useOutsideInteraction() {} };
const { Select: NativeSelect, Autocomplete: NativeAutocomplete } = load('packages/mobile-design/src/components/choice.tsx');

const { Card } = load('packages/mobile-design/src/components/card.tsx');
const { Snackbar } = load('packages/mobile-design/src/components/snackbar.tsx');
const { Badge, BadgedBox, Divider, Chip, ListItem } = load('packages/mobile-design/src/components/content.tsx');
modules['react-native-svg'] = { __esModule: true, default: 'Svg', Circle: 'SvgCircle', Path: 'SvgPath', Text: 'SvgText' };
const { TabsPager: TabsContentPager } = load('packages/mobile-design/src/components/tabs-pager.tsx');

function walk(tree, result = []) {
    if (Array.isArray(tree)) {
        tree.forEach((child) => walk(child, result));
    } else if (tree && typeof tree === 'object') {
        result.push(tree);
        walk(tree.props?.children, result);
    }
    return result;
}

function pathTo(tree, target) {
    if (tree === target) return [tree];
    const children = Array.isArray(tree) ? tree : tree?.props?.children;
    for (const child of Array.isArray(children) ? children : [children]) {
        if (!child) continue;
        const found = pathTo(child, target);
        if (found) return [tree, ...found];
    }
    return undefined;
}

class Runner {
    constructor(component, props) {
        Object.assign(this, {
            component,
            props,
            hooks: [],
            shared: [],
            queued: [],
            ui: [],
            inUI: false,
            frames: new Map(),
            lastFrame: 0,
            timers: new Map(),
            lastTimer: 0,
            clock: 0,
            refNodes: new Map(),
            attachedRefs: new Set(),
            backListeners: new Set(),
            focusCalls: 0,
            blurCalls: 0,
            keyboardDismissals: 0,
            commands: [],
            tabChildren: new Map(),
        });
        this.rootHooks = this.hooks;
        this.render();
    }
    expandTabs(tree, route = 'tabs-root') {
        if (Array.isArray(tree)) return tree.map((child, index) => this.expandTabs(child, `${route}/${child?.key ?? index}`));
        if (!tree || typeof tree !== 'object') return tree;
        if (typeof tree.type === 'function') {
            const instance = `${route}:${tree.type.name}`;
            this.tabVisited.add(instance);
            const hooks = this.tabChildren.get(instance) ?? [];
            this.tabChildren.set(instance, hooks);
            const previous = this.hooks,
                cursor = this.cursor;
            this.hooks = hooks;
            this.cursor = 0;
            const result = tree.type(tree.props);
            this.hooks = previous;
            this.cursor = cursor;
            return this.expandTabs(result, `${instance}/result`);
        }
        return { ...tree, props: { ...tree.props, children: this.expandTabs(tree.props?.children, `${route}/children`) } };
    }
    render(props = this.props) {
        this.props = props;
        let passes = 0;
        do {
            assert.ok(++passes < 30, 'hook effects must settle without a render loop');
            active = this;
            this.hooks = this.rootHooks;
            this.cursor = 0;
            this.dirty = false;
            this.layoutEffects = [];
            this.effects = [];
            this.tree = this.component(this.props);
            if ([Tabs, TabsContentPager].includes(this.component)) {
                this.tabVisited = new Set();
                this.tree = this.expandTabs(this.tree);
                for (const [instance, hooks] of this.tabChildren)
                    if (!this.tabVisited.has(instance)) {
                        hooks.forEach((slot) => slot.cleanup?.());
                        this.tabChildren.delete(instance);
                    }
            }
            this.commitRefs();
            this.layoutEffects.forEach((create) => create());
            this.effects.forEach((create) => create());
        } while (this.dirty);
        return this;
    }
    commitRefs() {
        const nextRefs = new Set();
        for (const node of walk(this.tree)) {
            const ref = node.props?.ref;
            if (!ref || typeof ref !== 'object') continue;
            nextRefs.add(ref);
            if (!this.refNodes.has(ref)) {
                this.refNodes.set(ref, {
                    focus: () => {
                        this.focusCalls += 1;
                    },
                    blur: () => {
                        this.blurCalls += 1;
                    },
                    clear: () => this.commands.push({ type: 'clear' }),
                    isFocused: () => true,
                    setNativeProps: (args) => this.commands.push({ type: 'input-props', args }),
                    setSelection: (start, end) => this.commands.push({ type: 'selection', start, end }),
                    measureInWindow: (callback) => callback(24, 96, 342, 56),
                    snapToIndex: (index, config) => this.commands.push({ type: 'snap', index, config }),
                    forceClose: (config) => this.commands.push({ type: 'forceClose', config }),
                    scrollTo: (command) => this.commands.push(command),
                });
            }
            ref.current = this.refNodes.get(ref);
        }
        for (const ref of this.attachedRefs) if (!nextRefs.has(ref)) ref.current = null;
        this.attachedRefs = nextRefs;
    }
    event(callback, ...args) {
        active = this;
        callback(...args);
        if (this.dirty && !this.unmounted) this.render();
        return this;
    }
    flush() {
        active = this;
        for (const callback of this.queued.splice(0)) callback();
        if (this.dirty && !this.unmounted) this.render();
        return this;
    }
    uiEvent(callback, ...args) {
        this.inUI = true;
        try {
            return this.event(callback, ...args);
        } finally {
            this.inUI = false;
        }
    }
    flushUI() {
        active = this;
        for (const callback of this.ui.splice(0)) this.uiEvent(callback);
        return this;
    }
    framesNow() {
        active = this;
        const frames = [...this.frames.values()];
        this.frames.clear();
        frames.forEach((callback) => callback(0));
        if (this.dirty && !this.unmounted) this.render();
        return this;
    }
    advance(milliseconds) {
        this.clock += milliseconds;
        const due = [...this.timers].filter(([, timer]) => timer.deadline <= this.clock);
        for (const [id, timer] of due) {
            if (!this.timers.has(id)) continue;
            this.timers.delete(id);
            this.event(timer.callback);
        }
        return this;
    }
    complete(shared = this.shared[0]) {
        const animation = shared.animation;
        assert.ok(animation, 'there is an animation to complete');
        shared.animation = null;
        shared.current = animation.to;
        return this.event(() => animation.callback?.(true));
    }
    find(id) {
        const node = walk(this.tree).find((item) => item.props?.testID === id);
        assert.ok(node, `visible element ${id} exists`);
        return node;
    }
    native(type) {
        const node = walk(this.tree).find((item) => item.type === type);
        assert.ok(node, `${type} exists`);
        return node;
    }
    pressNode(node) {
        // Paper and native disabled controls do not dispatch a user press.
        const path = pathTo(this.tree, node) ?? [node];
        if (!node.props.disabled && path.every((element) => element?.props?.pointerEvents !== 'none')) this.event(node.props.onPress);
        return this;
    }
    press(id) {
        return this.pressNode(this.find(id));
    }
    bottomHandle() {
        const provider=walk(this.tree).find(node=>node.type?.context && node.props.value?.testID===`${this.props.testID}-handle`);
        assert.ok(provider,'Missing sheet handle state boundary');
        const context=provider.type.context, previous=context.value;
        try {
            context.value=provider.props.value;
            return new Runner(this.native('BottomSheet').props.handleComponent, {}).tree;
        } finally { context.value=previous; }
    }
    layoutBottomSheet(width = dimensions.width) {
        return this.event(this.find(this.props.testID).props.onLayout, { nativeEvent: { layout: { width } } });
    }
    unmount() {
        active = this;
        for (const hooks of [this.rootHooks, ...this.tabChildren.values()]) hooks.forEach((slot) => slot.cleanup?.());
        for (const ref of this.attachedRefs) ref.current = null;
        this.attachedRefs.clear();
        this.unmounted = true;
    }
}

const Presence = ({ open, duration = 400 }) => useOverlayPresence(open, duration);

test('a closed overlay appears only on request and remains until its exit finishes', () => {
    const owner = new Runner(Presence, { open: false });
    assert.equal(owner.tree.present, false);
    owner.render({ open: true }).complete().flush();
    assert.equal(owner.tree.present, true);
    owner.render({ open: false });
    assert.equal(owner.tree.present, true, 'exit keeps the overlay mounted');
    owner.complete().flush();
    assert.equal(owner.tree.present, false, 'completed exit removes the overlay');
});

test('a cancelled outgoing animation cannot hide a visible overlay', () => {
    const owner = new Runner(Presence, { open: true });
    owner.complete().render({ open: false });
    const cancelled = owner.shared[0].animation.callback;
    owner.event(cancelled, false).flush();
    assert.equal(owner.tree.present, true);
});

test('an exit completion queued before rapid reopen cannot dismiss the new session', () => {
    const owner = new Runner(Presence, { open: true });
    owner.complete().render({ open: false }).complete();
    assert.equal(owner.queued.length, 1, 'the old UI completion is waiting on the RN thread');
    owner.render({ open: true }).flush();
    assert.equal(owner.tree.present, true);
    owner.complete().render({ open: false }).complete().flush();
    assert.equal(owner.tree.present, false, 'a subsequent intentional close still works');
});

test('a disposed overlay cancels motion and ignores an already queued completion', () => {
    const owner = new Runner(Presence, { open: true });
    owner.complete().render({ open: false }).complete();
    owner.unmount();
    owner.flush();
    assert.ok(owner.shared.every((shared) => shared.animation === null));
});

test('zero-duration reduced motion still closes through the controlled presence contract', () => {
    const owner = new Runner(Presence, { open: true, duration: 0 });
    owner.render({ open: false, duration: 0 }).flush();
    assert.equal(owner.tree.present, false);
});

test('the resolved Paper motion preference controls overlays even when the OS initially requests reduction', () => {
    const previous = reanimated.useReducedMotion;
    reanimated.useReducedMotion = () => true;
    try {
        const side = new Runner(SideSheet, { open: true, onOpenChange() {}, testID: 'motion-side' });
        const search = new Runner(SearchView, {
            open: true,
            value: '',
            onOpenChange() {},
            onChangeText() {},
            onSearch() {},
            testID: 'motion-search',
        });
        const toolbar = new Runner(Toolbar, { actions: [], testID: 'motion-toolbar' });
        const rail = new Runner(NavigationRail, { items: [], value: '', onValueChange() {}, testID: 'motion-rail' });
        for (const owner of [side, search, toolbar, rail])
            assert.equal(
                owner.shared[0].animation.config.reduceMotion,
                'never',
                'the animation engine must not reapply an OS preference overridden by Paper'
            );
        assert.equal(side.shared[0].animation.config.duration, 400);
        assert.equal(toolbar.shared[0].animation.kind, 'spring');
        assert.equal(search.shared[0].animation.config.stiffness, 200, 'SearchBarState opens with SlowSpatial');
        const bottom = new Runner(BottomSheet, {
            open: true,
            snapPoints: [180],
            onOpenChange() {},
            testID: 'motion-bottom',
        }).layoutBottomSheet();
        assert.equal(bottom.native('BottomSheet').props.overrideReduceMotion, 'never');
        theme.animation.scale = 0;
        bottom.render();
        side.render();
        assert.equal(bottom.native('BottomSheet').props.overrideReduceMotion, 'always');
        assert.equal(bottom.native('BottomSheet').props.animationConfigs.duration, 0);
        assert.equal(side.shared[0].animation, null, 'a resolved reduced theme has no spatial animation');
    } finally {
        reanimated.useReducedMotion = previous;
        theme.animation.scale = 1;
    }
});

test('side-sheet Back requests closure and exit content cannot receive another press', () => {
    const requests = [];
    const owner = new Runner(SideSheet, { open: true, onOpenChange: (value) => requests.push(value), testID: 'side' });
    owner.event(owner.native('Modal').props.onRequestClose);
    assert.deepEqual(requests, [false]);
    owner.render({ ...owner.props, open: false });
    assert.equal(owner.find('side').props.pointerEvents, 'none');
    assert.equal(owner.find('side').props.importantForAccessibility, 'no-hide-descendants');
});

test('a non-dismissible side sheet refuses Back, scrim and drag dismissal', () => {
    const requests = [];
    const owner = new Runner(SideSheet, {
        open: true,
        dismissible: false,
        onOpenChange: (value) => requests.push(value),
        testID: 'side-locked',
    });
    owner.event(owner.native('Modal').props.onRequestClose).press('side-locked-scrim');
    assert.equal(owner.native('GestureDetector').props.gesture.options.enabled, false);
    assert.deepEqual(requests, []);
});

test('side-sheet unmount removes Back handling and cancels its native motion', () => {
    const owner = new Runner(SideSheet, { open: true, onOpenChange() {}, testID: 'side-dispose' });
    assert.equal(owner.backListeners.size, 1);
    owner.unmount();
    assert.equal(owner.backListeners.size, 0);
    assert.ok(owner.shared.every((shared) => shared.animation === null));
});

test('a drag-dismiss callback queued before unmount cannot change owner state', () => {
    const requests = [];
    const owner = new Runner(SideSheet, { open: true, onOpenChange: (value) => requests.push(value), testID: 'side-drag' });
    owner.complete();
    const gesture = owner.native('GestureDetector').props.gesture;
    owner.event(gesture.handlers.onStart);
    owner.event(gesture.handlers.onUpdate, { translationX: 240 });
    owner.event(gesture.handlers.onEnd, { velocityX: 600 });
    assert.equal(owner.queued.length, 1);
    owner.unmount();
    owner.flush();
    assert.deepEqual(requests, []);
});

test('end-edge drag dismissal follows logical RTL direction', () => {
    const requests = [];
    direction.isRTL = true;
    try {
        const owner = new Runner(SideSheet, { open: true, edge: 'end', onOpenChange: (value) => requests.push(value), testID: 'side-rtl' });
        owner.complete();
        const gesture = owner.native('GestureDetector').props.gesture;
        owner.event(gesture.handlers.onStart);
        owner.event(gesture.handlers.onUpdate, { translationX: -240 });
        owner.event(gesture.handlers.onEnd, { velocityX: -600 }).flush();
        assert.deepEqual(requests, [false]);
    } finally {
        direction.isRTL = false;
    }
});

test('side-sheet queued dismissals respect a newly locked configuration and a reopened session', () => {
    for (const change of ['locked', 'reopened']) {
        const requests = [];
        const owner = new Runner(SideSheet, { open: true, onOpenChange: value => requests.push(value), testID: 'side-revision' });
        owner.complete();
        const gesture = owner.native('GestureDetector').props.gesture;
        const oldBack = owner.native('Modal').props.onRequestClose;
        owner.event(gesture.handlers.onStart).event(gesture.handlers.onUpdate, { translationX: 250 });
        owner.event(gesture.handlers.onEnd, { velocityX: 600 });
        if (change === 'locked') {
            owner.render({ ...owner.props, dismissible: false });
            owner.event(oldBack);
        } else {
            owner.render({ ...owner.props, open: false });
            owner.render({ ...owner.props, open: true });
        }
        owner.flush();
        assert.deepEqual(requests, [], change + ' invalidates a gesture committed by the previous configuration');
    }
});

test('a side gesture cannot resume after its direction or interaction configuration changes', () => {
    const owner = new Runner(SideSheet, { open: true, onOpenChange() {}, testID: 'side-config' });
    owner.complete();
    const old = owner.native('GestureDetector').props.gesture;
    owner.event(old.handlers.onStart);
    owner.render({ ...owner.props, edge: 'start', draggable: false });
    const value = owner.shared[0].current;
    owner.event(old.handlers.onUpdate, { translationX: 200 }).event(old.handlers.onFinalize, {}, false).flush();
    assert.equal(owner.shared[0].current, value);
    assert.equal(owner.shared[0].animation, null);
});

test('a detached modal exits beyond its inset rather than leaving a visible edge', () => {
    const owner = new Runner(SideSheet, { open: true, detached: true, width: 320, onOpenChange() {}, testID: 'side-detached-exit' });
    owner.shared[0].current = 0;
    assert.equal(resolvedStyle(owner.find('side-detached-exit').props.style).transform[0].translateX, 336);
});

test('side-sheet header spacing accounts for the glyph inside its minimum touch target', () => {
    for (const rtl of [false, true]) {
        direction.isRTL = rtl;
        try {
            const owner = new Runner(SideSheet, { open: true, title: 'Details', onBackPress() {}, onOpenChange() {}, testID: 'side-header' });
            const header = pathTo(owner.tree, owner.find('side-header-title')).at(-2);
            assert.equal(header.props.style.paddingLeft, rtl ? 12 : 4);
            assert.equal(header.props.style.paddingRight, rtl ? 4 : 12);
            assert.equal(header.props.style.gap, 0, '12dp between glyph and headline comes from the touch target inset');
            assert.equal(owner.native('Modal').props.accessibilityLabel, 'Details');
        } finally { direction.isRTL = false; }
    }
});

test('an embedded standard sheet leaves safe areas to its parent region', () => {
    const owner = new Runner(SideSheet, { variant: 'standard', open: true, onOpenChange() {}, testID: 'side-safe-area' });
    const style = resolvedStyle(owner.native('Surface').props.style);
    assert.equal(style.paddingTop, 0);
    assert.equal(style.paddingBottom, 0);
});

test('a side sheet without a headline keeps its close action without an empty heading', () => {
    const owner = new Runner(SideSheet, { open: true, onOpenChange() {}, testID: 'side-no-title' });
    assert.equal(walk(owner.tree).filter(node => node.props?.accessibilityRole === 'header').length, 0);
    assert.ok(owner.find('side-no-title-close'));
    assert.equal(owner.native('Modal').props.accessibilityLabel, 'Hoja lateral');
});

test('a controlled bottom sheet waits for its native exit before notifying closed', () => {
    const closed = [];
    const owner = new Runner(BottomSheet, {
        open: true,
        snapPoints: [180, 400],
        onOpenChange() {},
        onClosed: () => closed.push('closed'),
        testID: 'bottom',
    }).layoutBottomSheet();
    owner.render({ ...owner.props, open: false });
    assert.equal(owner.native('BottomSheet').props.index, -1);
    assert.equal(closed.length, 0);
    owner.event(owner.native('BottomSheet').props.onClose);
    assert.equal(owner.tree, null);
    assert.deepEqual(closed, ['closed']);
});

test('a gesture close finishes even when Gorhom retained its animation-start callback', () => {
    const requests = [];
    const closed = [];
    const owner = new Runner(BottomSheet, {
        open: true,
        snapPoints: [180, 400],
        onOpenChange: (value) => requests.push(value),
        onClosed: () => closed.push('closed'),
        testID: 'bottom-gesture',
    }).layoutBottomSheet();
    const nativeAtAnimationStart = owner.native('BottomSheet');
    // Gorhom captures handleOnClose in animateToPositionCompleted when it starts
    // the native animation, before the owner can reflect onAnimate's request.
    owner.event(nativeAtAnimationStart.props.onAnimate, 0, -1);
    assert.deepEqual(requests, [false]);
    owner.render({ ...owner.props, open: false });
    owner.event(nativeAtAnimationStart.props.onClose);
    assert.equal(owner.tree, null, 'a finished gesture must remove the native modal instead of trapping an invisible overlay');
    assert.deepEqual(closed, ['closed']);
    owner.event(nativeAtAnimationStart.props.onClose);
    assert.deepEqual(closed, ['closed'], 'a duplicate native completion cannot notify closed twice');
});

test('a late bottom-sheet close cannot undo rapid reopening at a new snap point', () => {
    const requests = [];
    const closed = [];
    const owner = new Runner(BottomSheet, {
        open: true,
        index: 0,
        snapPoints: [180, 400],
        onOpenChange: (value) => requests.push(value),
        onClosed: () => closed.push('closed'),
        testID: 'bottom-reopen',
    }).layoutBottomSheet();
    const oldClose = owner.native('BottomSheet').props.onClose;
    owner.render({ ...owner.props, open: false });
    owner.render({ ...owner.props, open: true, index: 1 });
    owner.event(oldClose);
    assert.deepEqual(requests, []);
    assert.deepEqual(closed, []);
    assert.equal(owner.native('BottomSheet').props.index, 1);
    assert.ok(
        owner.commands.filter((command) => command.type === 'snap').every((command) => command.index === 1),
        'restoration cannot command the previous snap point'
    );
});

test('a late bottom-sheet close remains stale after the new native position is reported', () => {
    const requests = [];
    const owner = new Runner(BottomSheet, {
        open: true,
        index: 0,
        snapPoints: [180, 400],
        onOpenChange: (value) => requests.push(value),
        testID: 'bottom-position',
    }).layoutBottomSheet();
    const oldClose = owner.native('BottomSheet').props.onClose;
    owner.render({ ...owner.props, open: false }).render({ ...owner.props, open: true, index: 1 });
    owner.event(owner.native('BottomSheet').props.onChange, 1);
    owner.event(oldClose);
    assert.deepEqual(requests, [], 'a callback from the previous session cannot close the visible sheet');
    assert.equal(owner.native('BottomSheet').props.index, 1);
});

test('half-full-half-save interrupts the snap and cannot leave an invisible native modal', () => {
    const closed = [];
    const owner = new Runner(BottomSheet, {
        open: true,
        index: 1,
        snapPoints: ['30%', '50%', '95%'],
        onOpenChange() {},
        onClosed: () => closed.push('closed'),
        testID: 'bottom-save',
    }).layoutBottomSheet();
    owner
        .render({ ...owner.props, index: 2 })
        .render({ ...owner.props, index: 1 })
        .render({ ...owner.props, open: false });
    const command = owner.commands.at(-1);
    assert.equal(command.type, 'forceClose', 'closing must explicitly interrupt native snapping, rather than depend on index=-1');
    assert.ok(owner.native('Modal'), 'the real closing animation may finish before unmount');
    owner.advance(2000);
    assert.equal(owner.tree, null, 'a missing/already-closed native callback cannot trap the user behind a scrim');
    assert.deepEqual(closed, ['closed']);
    assert.equal(owner.timers.size, 0);
});

test('reopening during forceClose restores the newest snap target and cancels the old deadline', () => {
    const owner = new Runner(BottomSheet, {
        open: true,
        index: 0,
        snapPoints: [180, 400],
        onOpenChange() {},
        testID: 'bottom-force-reopen',
    }).layoutBottomSheet();
    const oldClose = owner.native('BottomSheet').props.onClose;
    owner.render({ ...owner.props, open: false });
    const oldDeadline = [...owner.timers.values()][0].callback;
    owner.render({ ...owner.props, open: true, index: 1 });
    assert.equal(owner.timers.size, 0);
    owner.event(oldDeadline).event(oldClose).advance(2000);
    assert.equal(owner.native('BottomSheet').props.index, 1);
    assert.equal(owner.commands.at(-1).index, 1, 'the close completion must retry the request that forceClose temporarily blocks');
});

test('bottom-sheet native callbacks and Back are harmless after unmount', () => {
    const requests = [];
    const positions = [];
    const closed = [];
    const owner = new Runner(BottomSheet, {
        open: true,
        snapPoints: [180],
        onOpenChange: (value) => requests.push(value),
        onIndexChange: (value) => positions.push(value),
        onClosed: () => closed.push('closed'),
        testID: 'bottom-dispose',
    }).layoutBottomSheet();
    const native = owner.native('BottomSheet');
    const back = owner.native('Modal').props.onRequestClose;
    owner.render({ ...owner.props, open: false });
    assert.equal(owner.timers.size, 1, 'a closing sheet has one bounded native-exit deadline');
    owner.unmount();
    assert.equal(owner.timers.size, 0, 'unmount cancels the native-exit deadline');
    owner.event(native.props.onClose).event(native.props.onChange, 0).event(back);
    assert.equal(owner.backListeners.size, 0);
    assert.deepEqual(requests, []);
    assert.deepEqual(positions, []);
    assert.deepEqual(closed, []);
});

test('bottom-sheet decorative backgrounds receive the visible container without taking accessibility focus', () => {
    let received;
    const decoration = { type: 'gradient', props: {} };
    const owner = new Runner(BottomSheet, {
        open: true,
        snapPoints: [180],
        onOpenChange() {},
        backgroundContent: (props) => {
            received = props;
            return decoration;
        },
        testID: 'bottom-decoration',
    }).layoutBottomSheet();
    owner.event(owner.find('bottom-decoration').props.onLayout, { nativeEvent: { layout: { width: 390, height: 844 } } });
    const native = owner.native('BottomSheet');
    const position = { value: 200 };
    const background = native.props.backgroundComponent({ style: { borderTopLeftRadius: 28 }, animatedPosition: position });
    assert.equal(received.animatedPosition, position);
    assert.equal(
        received.containerHeight,
        844 - native.props.topInset,
        'the gradient and animatedPosition use the same inset-adjusted viewport'
    );
    assert.equal(background.props.children, decoration);
    assert.equal(background.props.pointerEvents, 'none');
    assert.equal(background.props.importantForAccessibility, 'no-hide-descendants');
    owner.unmount();
});

test('bottom-sheet controls remain individually accessible and handle adjustments change snap points', () => {
    const positions = [];
    const owner = new Runner(BottomSheet, {
        open: true,
        index: 0,
        snapPoints: [180, 400, 700],
        onOpenChange() {},
        onIndexChange: (value) => positions.push(value),
        testID: 'bottom-accessibility',
    }).layoutBottomSheet();
    const native = owner.native('BottomSheet');
    assert.equal(native.props.accessible, false, 'the content cannot group its TextInput/buttons into one adjustable element');
    assert.equal(native.props.accessibilityRole, null, 'the content container has no inherited slider role');
    const background = native.props.backgroundComponent({ style: { backgroundColor: '#f7f2fa' } });
    assert.equal(background.props.accessible, false, 'the decorative background is not another focus stop');
    assert.equal(background.props.importantForAccessibility, 'no-hide-descendants');
    const handle = owner.bottomHandle();
    assert.equal(handle.props.accessibilityRole, 'button');
    assert.equal(typeof handle.props.onPress, 'function', 'the handle is a tappable control as well as adjustable through actions');
    assert.equal(handle.props.accessibilityValue.text, '180 dp');
    const adjust = (name) => owner.event(handle.props.onAccessibilityAction, { nativeEvent: { actionName: name } });
    adjust('increment');
    adjust('increment');
    adjust('increment');
    adjust('decrement');
    assert.deepEqual(
        owner.commands.map((command) => command.index),
        [1, 2, 1],
        'screen-reader adjustment moves and clamps the actual sheet'
    );
    owner.event(owner.native('BottomSheet').props.onChange, 1);
    assert.deepEqual(positions, [1], 'the native result is reported through the normal controlled callback');
    owner.unmount();
    adjust('increment');
    assert.equal(owner.commands.length, 3, 'a disposed handle cannot move a later native surface');
    const percentages = new Runner(BottomSheet, {
        open: true,
        index: 1,
        snapPoints: ['30%', '50%', '95%'],
        onOpenChange() {},
        testID: 'bottom-percentage',
    }).layoutBottomSheet();
    assert.equal(
        percentages.bottomHandle().props.accessibilityValue.text,
        '50 %',
        'announce the real height rather than a normalized ordinal percentage'
    );
});

test('sheet handles keep their component identity across index and label changes', () => {
    const owner=new Runner(BottomSheet,{open:true,snapPoints:[180,400],onOpenChange(){},testID:'stable-handle'}).layoutBottomSheet();
    const handle=owner.native('BottomSheet').props.handleComponent;
    owner.event(owner.native('BottomSheet').props.onChange,1);
    assert.equal(owner.native('BottomSheet').props.handleComponent,handle);
    assert.equal(owner.bottomHandle().props.accessibilityValue.text,'400 dp');
    owner.render({...owner.props,accessibilityLabel:'Updated label'});
    assert.equal(owner.native('BottomSheet').props.handleComponent,handle);
    assert.equal(owner.bottomHandle().props.accessibilityLabel,'Updated label, altura');
});

test('a queued bottom-sheet dismissal reads the current dismissible configuration', () => {
    const requests=[];
    const owner=new Runner(BottomSheet,{open:true,snapPoints:[180,400],onOpenChange:value=>requests.push(value),testID:'current-dismiss'}).layoutBottomSheet();
    const previousBack=owner.native('Modal').props.onRequestClose;
    const backdrop=owner.native('BottomSheet').props.backdropComponent({});
    assert.equal(backdrop.props.children.props.pressBehavior,'none');
    assert.equal(backdrop.props.children.props.accessible,false);
    owner.render({...owner.props,dismissible:false});
    owner.event(previousBack).event(backdrop.props.gesture.handlers.onEnd,{},true).flush();
    assert.deepEqual(requests,[]);
    owner.render({...owner.props,dismissible:true});
    owner.event(backdrop.props.gesture.handlers.onEnd,{},true).flush();
    assert.deepEqual(requests,[false]);
});

test('an exiting bottom sheet cannot report a late expanded index', () => {
    const positions=[];
    const owner=new Runner(BottomSheet,{open:true,snapPoints:[180,400],onOpenChange(){},onIndexChange:i=>positions.push(i),testID:'exiting-position'}).layoutBottomSheet();
    owner.render({...owner.props,open:false});
    owner.event(owner.native('BottomSheet').props.onChange,1);
    assert.deepEqual(positions,[]);
});

test('bottom-sheet clearance follows its own host and supports an explicit safe top without offsetting the modal', () => {
    const width=dimensions.width;
    try {
        dimensions.width=960;
        const owner=new Runner(BottomSheet,{open:true,variant:'standard',snapPoints:[180],onOpenChange(){},testID:'host-clearance'}).layoutBottomSheet(320);
        assert.equal(owner.native('BottomSheet').props.topInset,72);
        owner.render({...owner.props,topInset:44});
        assert.equal(owner.native('BottomSheet').props.topInset,44);
        owner.render({...owner.props,minimized:true});
        assert.equal(owner.native('BottomSheet').props.backgroundStyle.borderTopLeftRadius,0);
        owner.render({...owner.props,variant:'modal'});
        assert.equal(owner.native('BottomSheet').props.backgroundStyle.borderTopLeftRadius,28);
        assert.equal(owner.native('Modal').props.accessibilityLabel,'Hoja inferior');
    } finally {dimensions.width=width;}
});

const items = [
    { key: 'first', label: 'First', icon: 'home' },
    { key: 'locked', label: 'Locked', icon: 'lock', disabled: true },
    { key: 'last', label: 'Last', icon: 'star' },
];

test('disabled tabs cannot select; enabled tabs report the actual requested key', () => {
    const requests = [];
    const owner = new Runner(Tabs, { items, value: 'first', onValueChange: (value) => requests.push(value), testID: 'tabs' });
    owner.press('tabs-locked').press('tabs-last');
    assert.deepEqual(requests, ['last']);
    assert.equal(
        owner.find('tabs-first').props.accessibilityState.selected,
        true,
        'selection remains controlled until the owner accepts it'
    );
    owner.render({ ...owner.props, value: 'last' });
    assert.equal(owner.find('tabs-last').props.accessibilityState.selected, true);
});

test('a removed selected tab does not leave an orphan active indicator', () => {
    const owner = new Runner(Tabs, { items, value: 'last', onValueChange() {}, testID: 'tabs-remove' });
    owner.event(owner.find('tabs-remove-last').props.onLayout, { nativeEvent: { layout: { x: 200, width: 100 } } });
    assert.ok(owner.find('tabs-remove-indicator'));
    owner.render({ ...owner.props, items: items.slice(0, 2) });
    assert.equal(
        walk(owner.tree).some((node) => node.props?.testID === 'tabs-remove-indicator'),
        false
    );
});

test('disabled rail destinations and drawer items never request navigation or close', () => {
    const selected = [];
    const closed = [];
    const rail = new Runner(NavigationRail, { items, value: 'first', onValueChange: (value) => selected.push(value), testID: 'rail' });
    const disabledRailItem = rail.find('rail-locked');
    new Runner(disabledRailItem.type, disabledRailItem.props).press('rail-locked');
    const enabledRailItem = rail.find('rail-last');
    new Runner(enabledRailItem.type, enabledRailItem.props).press('rail-last');
    const drawer = new Runner(NavigationDrawerModal, {
        open: true,
        items,
        value: 'first',
        onOpenChange: (value) => closed.push(value),
        onValueChange: (value) => selected.push(value),
        testID: 'drawer',
    });
    const drawerContent = drawer.find('drawer-content');
    const drawerItems = new Runner(drawerContent.type, drawerContent.props);
    const disabledDrawerItem = drawerItems.find('drawer-locked');
    new Runner(disabledDrawerItem.type, disabledDrawerItem.props).press('drawer-locked');
    assert.deepEqual(closed, []);
    const enabledDrawerItem = drawerItems.find('drawer-last');
    new Runner(enabledDrawerItem.type, enabledDrawerItem.props).press('drawer-last');
    assert.deepEqual(selected, ['last', 'last']);
    assert.deepEqual(closed, [false]);
});

test('rail ink stays in the content pill while native and React targets span the row', () => {
    const rail = new Runner(NavigationRail, { items, value: 'first', expanded: true, onValueChange() {}, testID: 'rail-ink' });
    const destination = rail.find('rail-ink-first');
    const owner = new Runner(destination.type, destination.props);
    const touch = owner.find('rail-ink-first');
    const frame = touch.props.style[1].compute();
    assert.equal(touch.type, 'TouchableRipple', 'Paper retains its native ripple and settings context');
    assert.equal(touch.props.style[0].overflow, 'hidden', 'the ink host itself clips to the pill');
    assert.equal(frame.height, 56);
    assert.ok(frame.width < destination.props.targetRailWidth, 'the default expanded indicator hugs its content');
    for (const ancestor of pathTo(owner.tree, touch).slice(0, -1)) {
        const styles = Array.isArray(ancestor.props?.style) ? ancestor.props.style : [ancestor.props?.style];
        assert.ok(
            styles.every((style) => style?.overflow !== 'hidden'),
            'a smaller ancestor cannot clip the host hitSlop'
        );
    }
    const nativeHitSlop = touch.props.animatedProps.compute().hitSlop;
    for (const hitSlop of [touch.props.hitSlop, nativeHitSlop]) {
        assert.equal(frame.left - hitSlop.left, 0);
        assert.equal(frame.left + frame.width + hitSlop.right, 256);
        assert.equal(frame.top - hitSlop.top, 0);
        assert.equal(frame.top + frame.height + hitSlop.bottom, 56);
    }
    assert.equal(
        walk(owner.tree).filter((node) => node.props.accessibilityRole === 'tab').length,
        1,
        'the decorative icon and labels do not introduce another destination'
    );
    const decorative = walk(owner.tree).filter((node) => node.props.pointerEvents === 'none');
    assert.ok(decorative.length >= 2);
    for (const node of decorative) {
        assert.equal(node.props.accessibilityElementsHidden, true, 'iOS hides decorative descendants');
        assert.equal(node.props.importantForAccessibility, 'no-hide-descendants', 'Android hides decorative descendants');
    }
});

test('a rail press begun mid-morph refreshes the JS release region from current geometry', () => {
    direction.isRTL = true;
    try {
        const rail = new Runner(NavigationRail, { items, value: 'first', expanded: true, onValueChange() {}, testID: 'rail-mid' });
        const destination = rail.find('rail-mid-first');
        destination.props.expansion.current = 0.5;
        destination.props.railWidth.current = 176;
        const owner = new Runner(destination.type, destination.props);
        const nativeRegion = owner.find('rail-mid-first').props.animatedProps.compute().hitSlop;
        owner.event(owner.find('rail-mid-first').props.onPressIn);
        const touch = owner.find('rail-mid-first');
        for (const edge of ['top', 'right', 'bottom', 'left'])
            assert.equal(touch.props.hitSlop[edge], nativeRegion[edge], `JS ${edge} agrees with the native start region`);
        const frame = touch.props.style[1].compute();
        assert.equal(frame.left - touch.props.hitSlop.left, 0);
        assert.equal(frame.left + frame.width + touch.props.hitSlop.right, 176);
        assert.equal(
            frame.top + frame.height + touch.props.hitSlop.bottom,
            60,
            'release/cancellation uses the complete current row, plus native Pressability retention'
        );
        owner.event(touch.props.onPressOut);
        assert.equal(
            owner.find('rail-mid-first').props.hitSlop.left,
            destination.props.targetRailWidth - 20 - 64,
            'the settled RTL React configuration is restored after release'
        );
    } finally {
        direction.isRTL = false;
    }
});

test('modal rail menu dismisses navigation and its content shares the modal surface', () => {
    const closed = [];
    const modal = new Runner(NavigationRailModal, {
        open: true,
        items,
        value: 'first',
        onOpenChange: (value) => closed.push(value),
        onValueChange() {},
        testID: 'modal-rail',
    });
    const content = modal.find('modal-rail-content');
    assert.equal(content.props.style.backgroundColor, modal.tree.props.style.backgroundColor);
    const rail = new Runner(content.type, content.props);
    assert.equal(rail.find('modal-rail-content-toggle').props.accessibilityLabel, 'Cerrar navegación');
    rail.press('modal-rail-content-toggle');
    assert.deepEqual(closed, [false]);
});

function searchProps(extra = {}) {
    return { open: true, value: '', onOpenChange() {}, onChangeText() {}, onSearch() {}, testID: 'search', ...extra };
}

test('Search default and custom capsule entries share a bounded indication even when caller styles request visible overflow', () => {
    const entry = new Runner(SearchTrigger, {
        style: { backgroundColor: 'transparent', overflow: 'visible', borderRadius: 0 },
        onPress() {},
        children: jsx('Text', { children: 'Search' }),
    });
    const ripple = entry.native('TouchableRipple');
    assert.equal(resolvedStyle(ripple.props.style).overflow, 'hidden');
    assert.equal(resolvedStyle(ripple.props.style).borderRadius, 28);
    assert.equal(resolvedStyle(ripple.props.style).minHeight, 56);
    assert.equal(ripple.props.borderless, false);
    assert.equal(ripple.props.rippleColor, theme.colors.stateLayerPressed);
    assert.equal(ripple.props.accessibilityRole, 'button');
    const search = new Runner(SearchView, searchProps({ open: false }));
    assert.equal(search.find('search-bar').type, SearchTrigger, 'the original SearchView consumes the same indication as custom capsules');
});

test('contained Search ends its exit at the entry point instead of waiting through a spring oscillation', () => {
    for (const presentation of ['full-screen', 'docked']) {
        const closed = [];
        const owner = new Runner(SearchView, searchProps({ presentation, onClosed: () => closed.push('closed') }));
        assert.equal(owner.shared[0].animation.config.overshootClamping, false, 'opening retains expressive overshoot');
        owner.complete().render({ ...owner.props, open: false });
        const exit = owner.shared[0].animation;
        assert.equal(exit.config.overshootClamping, true, 'arrival at zero removes the modal without an invisible settling tail');
        assert.equal(exit.to, 0);
        owner.complete().flush();
        assert.equal(walk(owner.tree).some(node => node.type === 'Modal'), false);
        assert.equal(owner.tree.props.children[0].props.pointerEvents, 'auto', 'entry is usable as soon as the return completes');
        assert.deepEqual(closed, ['closed']);
    }
});

test('outgoing Search controls fade with the return instead of remaining fully visible over the collapsed entry', () => {
    const owner = new Runner(SearchView, searchProps({
        trailingContent: jsx('AvatarButton', { testID: 'account' }),
        trailingActions: [{ key: 'history', icon: 'history', label: 'Recent searches', onPress() {} }],
    })).complete();
    const header = () => owner.find('search-header').props.animatedStyle.compute();
    assert.equal(header().opacity, 1);
    owner.render({ ...owner.props, open: false });
    owner.shared[0].current = 0.5;
    assert.equal(header().opacity, 0.5);
    owner.shared[0].current = 0;
    assert.equal(header().opacity, 0, 'the back button and editable text cannot linger at the closed position');
    owner.complete().flush();
    assert.equal(owner.tree.props.children[0].props.accessibilityElementsHidden, false);
    assert.equal(owner.find('search-trailing-content').props.style.opacity, 1, 'avatar and history belong to the restored entry');
    assert.ok(owner.find('account'));
    assert.ok(owner.find('search-action-history'));
});

test('Search obeys the provider reduced-motion preference through opening, interruption and removal', () => {
    const preference = modules['react-native-paper/lib/module/theme/accessibility/ReduceMotionContext'].ReduceMotionContext;
    const previous = preference.value;
    try {
        preference.value = true;
        const owner = new Runner(SearchView, searchProps());
        assert.equal(owner.shared[0].get(), 1);
        assert.equal(owner.shared[0].animation, null, 'the provider can suppress the spatial spring without changing theme.animation.scale');
        owner.render({ ...owner.props, open: false }).flush();
        assert.equal(walk(owner.tree).some(node => node.type === 'Modal'), false);
        owner.render({ ...owner.props, open: true }).framesNow();
        assert.ok(owner.find('search-input'));
        assert.equal(owner.shared[0].get(), 1);
        assert.equal(owner.shared[0].animation, null);
    } finally {
        preference.value = previous;
    }
});

test('switching search styles cannot retain a transparent docked background or an outgoing results opacity', () => {
    const owner = new Runner(SearchView, searchProps({presentation:'docked'})).complete();
    const background = () => walk(owner.tree).find(node=>node.key==='background').props.style.at(-1).compute();
    const body = () => owner.find('search-body').props.style.at(-1).compute();
    const previousBackground = background();
    assert.equal(previousBackground.opacity,0,'contained docked paints separate bar/results surfaces');
    owner.render({...owner.props,open:false}).complete();
    const outgoingBody = body();
    assert.equal(outgoingBody.opacity,0);
    owner.flush().render({...owner.props,open:true,variant:'divided',presentation:'full-screen'}).complete();
    // Reanimated retains native properties that a later animated style omits.
    assert.equal(Object.assign({},previousBackground,background()).opacity,1,'divided must cover the underlying screen');
    assert.equal(Object.assign({},outgoingBody,body()).opacity,1,'divided must restore the results');
    owner.render({...owner.props,open:false}).complete();
    const outgoingRoot = owner.find('search-view').props.style.at(-1).compute();
    owner.flush().render({...owner.props,open:true,variant:'contained'}).complete();
    assert.equal(Object.assign({},outgoingRoot,owner.find('search-view').props.style.at(-1).compute()).opacity,1,'returning to contained restores its root');
});

test('a queued custom clear cannot erase a query after search starts loading', () => {
    const changes = [];
    const owner = new Runner(SearchView, searchProps({value:'Monterrey',inputTrailingContent:jsx('Action',{testID:'input-action'}),onChangeText:value=>changes.push(value)}));
    const actions = () => walk(owner.find('search-input').props.right());
    const clear = actions().find(node=>node.props?.testID==='search-clear').props.onPress;
    owner.render({...owner.props,loading:true});
    owner.event(clear);
    assert.deepEqual(changes,[]);
    assert.equal(actions().some(node=>node.props?.testID==='search-clear'),false);
    assert.ok(actions().some(node=>node.props?.testID==='input-action'),'loading preserves the caller-owned independent action');
    owner.render({...owner.props,loading:false});
    owner.pressNode(actions().find(node=>node.props?.testID==='search-clear'));
    assert.deepEqual(changes,['']);
    assert.equal(owner.focusCalls,1);
});

test('Search can keep its footer outside keyboard avoidance while retaining the default behavior', () => {
    const footerContent = jsx('MiniPlayer', { testID: 'fixed-mini' });
    const standard = new Runner(SearchView, searchProps({ footerContent }));
    assert.ok(walk(standard.native('KeyboardAvoidingView')).some((node) => node.props?.testID === 'fixed-mini'));
    standard.unmount();
    const covered = new Runner(SearchView, searchProps({ footerContent, footerAvoidsKeyboard: false }));
    assert.ok(!walk(covered.native('KeyboardAvoidingView')).some((node) => node.props?.testID === 'fixed-mini'));
    assert.equal(walk(covered.tree).filter((node) => node.props?.testID === 'fixed-mini').length, 1);
    assert.equal(covered.find('search-fixed-footer').props.style.display, 'flex');
    covered.unmount();
});

test('A covered Android search footer hides controls during resize and returns after keyboard dismissal', () => {
    const native = modules['react-native'];
    const previousOS = native.Platform.OS,
        keyboard = native.Keyboard;
    const listeners = new Map();
    let visible = false;
    native.Platform.OS = 'android';
    native.Keyboard = {
        ...keyboard,
        isVisible: () => visible,
        addListener: (event, callback) => {
            listeners.set(event, callback);
            return { remove: () => listeners.delete(event) };
        },
    };
    let owner;
    try {
        owner = new Runner(
            SearchView,
            searchProps({ autoFocus: false, footerAvoidsKeyboard: false, footerContent: jsx('MiniPlayer', { testID: 'covered-mini' }) })
        );
        owner.event(() => {
            visible = true;
            listeners.get('keyboardDidShow')();
        });
        assert.equal(owner.find('search-fixed-footer').props.style.display, 'none');
        assert.equal(owner.find('search-fixed-footer').props.pointerEvents, 'none');
        assert.equal(owner.find('search-fixed-footer').props.importantForAccessibility, 'no-hide-descendants');
        owner.event(() => {
            visible = false;
            listeners.get('keyboardDidHide')();
        });
        assert.equal(owner.find('search-fixed-footer').props.style.display, 'flex');
        assert.equal(owner.find('search-fixed-footer').props.pointerEvents, 'auto');
        owner.unmount();
        owner = null;
        assert.equal(listeners.size, 0);
    } finally {
        owner?.unmount();
        native.Platform.OS = previousOS;
        native.Keyboard = keyboard;
    }
});

test('Back before the first focus frame cannot reopen the keyboard', () => {
    const requests = [];
    const owner = new Runner(SearchView, searchProps({ onOpenChange: (value) => requests.push(value) }));
    const pendingFocus = [...owner.frames.values()][0];
    assert.equal(typeof pendingFocus, 'function');
    const back = owner.native('Modal').props.onRequestClose;
    owner.event(back).render({ ...owner.props, open: false });
    owner.event(pendingFocus).framesNow();
    assert.deepEqual(requests, [false]);
    assert.equal(owner.focusCalls, 0);
    assert.equal(owner.find('search-view').props.pointerEvents, 'none');
});

test('rapid Back after the owner closes search cannot request dismissal twice', () => {
    const requests = [];
    const owner = new Runner(SearchView, searchProps({ onOpenChange: (value) => requests.push(value) }));
    const back = owner.native('Modal').props.onRequestClose;
    owner.event(back).render({ ...owner.props, open: false });
    owner.event(back).event(owner.native('Modal').props.onShow).framesNow();
    assert.deepEqual(requests, [false]);
    assert.equal(owner.focusCalls, 0);
});

test('external close before a scheduled focus is also safe', () => {
    const owner = new Runner(SearchView, searchProps());
    owner.render({ ...owner.props, open: false }).framesNow();
    assert.equal(owner.focusCalls, 0);
    assert.ok(owner.keyboardDismissals > 0);
});

test('an inactive SearchView cannot dismiss the keyboard of another search when the viewport changes', () => {
    const width = dimensions.width;
    try {
        const owner = new Runner(SearchView, searchProps({open: false}));
        assert.equal(owner.keyboardDismissals, 0);
        dimensions.width = 960;
        owner.render({...owner.props});
        assert.equal(owner.keyboardDismissals, 0);
    } finally { dimensions.width = width; }
});

test('rapid search reopen ignores the old exit and focuses the new input once', () => {
    const owner = new Runner(SearchView, searchProps());
    owner.render({ ...owner.props, open: false }).complete();
    owner
        .render({ ...owner.props, open: true })
        .flush()
        .framesNow();
    assert.ok(owner.find('search-input'));
    assert.equal(owner.focusCalls, 1);
});

test('search unmount cancels focus and a delayed native Back cannot affect owner state', () => {
    const requests = [];
    const owner = new Runner(SearchView, searchProps({ onOpenChange: (value) => requests.push(value) }));
    const pendingFocus = [...owner.frames.values()][0];
    const back = owner.native('Modal').props.onRequestClose;
    owner.unmount();
    assert.equal(owner.frames.size, 0);
    owner.event(pendingFocus).event(back).flush();
    assert.equal(owner.focusCalls, 0);
    assert.deepEqual(requests, []);
});

test('search submits the current query and suppresses submit while disabled or loading', () => {
    const queries = [];
    const owner = new Runner(SearchView, searchProps({ value: 'Mérida', onSearch: (query) => queries.push(query) }));
    owner.event(owner.find('search-input').props.onSubmitEditing);
    owner.render({ ...owner.props, disabled: true });
    owner.event(owner.find('search-input').props.onSubmitEditing);
    owner.render({ ...owner.props, disabled: false, loading: true });
    owner.event(owner.find('search-input').props.onSubmitEditing);
    assert.deepEqual(queries, ['Mérida']);
});

test('a disabled search result cannot select or dismiss; an enabled result can', () => {
    const selected = [];
    const closed = [];
    const results = [
        { key: 'locked', title: 'Unavailable', disabled: true },
        { key: 'valid', title: 'Available' },
    ];
    const owner = new Runner(
        SearchView,
        searchProps({ results, onOpenChange: (value) => closed.push(value), onResultPress: (result) => selected.push(result.key) })
    );
    const renderResult = owner.find('search-results').props.renderItem;
    owner.pressNode(renderResult({ item: results[0] }));
    assert.deepEqual(selected, []);
    assert.deepEqual(closed, []);
    owner.pressNode(renderResult({ item: results[1] }));
    assert.deepEqual(selected, ['valid']);
    assert.deepEqual(closed, [false]);
});

test('selecting without closing search dismisses editing and preserves the caller-owned view', () => {
    const selected = [], closed = [];
    const results = [{ key: 'valid', title: 'Available' }];
    const owner = new Runner(SearchView, searchProps({
        results, closeOnSelect: false,
        onOpenChange: value => closed.push(value),
        onResultPress: result => selected.push(result.key),
    }));
    const dismissals = owner.keyboardDismissals;
    owner.pressNode(owner.find('search-results').props.renderItem({ item: results[0] }));
    assert.deepEqual(selected, ['valid']);
    assert.deepEqual(closed, []);
    assert.equal(owner.keyboardDismissals, dismissals + 1);
});

test('Searchbar grows for enlarged native text without moving its independent 48dp targets', () => {
    const previous = dimensions.fontScale;
    try {
        dimensions.fontScale = 3;
        const owner = new Runner(MobileSearchbar, {value: '', testID: 'scaled-search'});
        assert.equal(owner.native('Surface').props.style[0].minHeight, 80);
        assert.equal(owner.find('scaled-search-icon').props.style.height, 48);
        owner.render({...owner.props, allowFontScaling: false});
        assert.equal(owner.native('Surface').props.style[0].minHeight, 56);
    } finally { dimensions.fontScale = previous; }
});

test('tapping the sheet handle changes real detents and dismisses from the last detent', () => {
    const requests = [];
    const owner = new Runner(BottomSheet, {
        open: true,
        snapPoints: [180, 400],
        onOpenChange: (value) => requests.push(value),
        testID: 'handle-cycle',
    }).layoutBottomSheet();
    owner.pressNode(owner.bottomHandle());
    assert.equal(owner.commands.at(-1).index, 1);
    owner.pressNode(owner.bottomHandle());
    assert.deepEqual(requests, [false], 'the last detent has a single-pointer path to close');
});

test('the current short navigation bar keeps labels and allows the active destination to reset its panel', () => {
    const requests = [];
    const owner = new Runner(NavigationBar, { items, value: 'first', onValueChange: (value) => requests.push(value), testID: 'navbar' });
    const mountItem = (id) => {
        const child = owner.find(id);
        return new Runner(child.type, child.props);
    };
    const first = mountItem('navbar-first');
    first.press('navbar-first');
    mountItem('navbar-locked').press('navbar-locked');
    assert.deepEqual(requests, ['first'], 'repeat selection is meaningful while disabled navigation is inert');
    const label = walk(first.tree).find((node) => node.type === 'Text' && node.props.children === 'First');
    const decorativeContent = walk(first.tree).find((node) => node.props.pointerEvents === 'none' && node.props.importantForAccessibility === 'no-hide-descendants');
    assert.equal(decorativeContent.props.accessibilityElementsHidden, true, 'visual labels and icons must not duplicate the named native destination');
    assert.equal(label.props.style.color, '#625b71', 'the current vertical active-label role is secondary');
    assert.equal(owner.tree.props.style[0].backgroundColor, '#f3edf7', 'the current container role is surfaceContainer');
    owner.render({ ...owner.props, variant: 'standard' });
    assert.equal(owner.tree.props.style[0].backgroundColor, '#fef7ff', 'the baseline bar keeps its distinct surface role');
});

test('tab dimensions follow the published label fixture and the divider does not add height', () => {
    const owner = new Runner(Tabs, {
        items: items.map(({ icon, ...item }) => item),
        value: 'first',
        onValueChange() {},
        testID: 'tabs-fixture',
    });
    owner.event(owner.find('tabs-fixture-first').props.onLayout, { nativeEvent: { layout: { x: 0, width: 100 } } });
    const label = owner.find('tabs-fixture-first-label-group');
    owner.event(label.props.onLayout, { nativeEvent: { layout: { width: 40 } } });
    assert.equal(owner.find('tabs-fixture-first').props.style.minHeight, 48);
    const indicator = owner.find('tabs-fixture-indicator');
    owner.complete(owner.shared.find((shared) => shared.animation?.to === 36));
    assert.equal(indicator.props.style[1].compute().width, 36, 'a40dp label has2dp inset on each edge');
    assert.equal(owner.tree.props.style[0].borderBottomWidth, undefined, 'the1dp divider overlays the48dp container');
});

test('tab reveal reaches the centered bounded target and a drag cancels the automated scroll', () => {
    const owner = new Runner(Tabs, { items, value: 'last', scrollable: true, onValueChange() {}, testID: 'tabs-reveal' });
    owner.event(owner.tree.props.onLayout, { nativeEvent: { layout: { width: 300 } } });
    const row = owner.native('AnimatedScrollView').props.children;
    owner.event(row.props.onLayout, { nativeEvent: { layout: { width: 1000 } } });
    owner.event(owner.find('tabs-reveal-last').props.onLayout, { nativeEvent: { layout: { x: 800, width: 100 } } });
    const scrolling = owner.shared.find((shared) => shared.animation?.to === 700);
    assert.ok(scrolling, 'the rightmost100dp tab in1000dp content centers at the700dp scroll bound');
    owner.complete(scrolling);
    assert.deepEqual(owner.commands.at(-1), { type: 'scroll', x: 700, y: 0, animated: false });
    owner.render({ ...owner.props, value: 'first' });
    owner.event(owner.find('tabs-reveal-first').props.onLayout, { nativeEvent: { layout: { x: 52, width: 100 } } });
    owner.event(owner.native('AnimatedScrollView').props.onScroll.onBeginDrag);
    assert.equal(scrolling.animation, null, 'a user drag wins over the old reveal request');
});

test('a flexible app bar grows to its measured headline instead of adding a nominal line to the token height', () => {
    const owner = new Runner(TopAppBar, { title: 'A longer page headline', variant: 'medium-flexible', statusBarHeight: 0 });
    const initial = walk(owner.tree)
        .find((node) => node.type === 'AnimatedView')
        .props.style[1].compute().height;
    assert.equal(initial, 112);
    owner.event(owner.find('mobile-top-appbar-expanded-content').props.onLayout, { nativeEvent: { layout: { width: 300, height: 72 } } });
    const grown = walk(owner.tree)
        .find((node) => node.type === 'AnimatedView')
        .props.style[1].compute().height;
    assert.equal(grown, 136, 'AndroidX measures64dp compact row +max(48dp expanded row,72dp content), without an extra12dp');
});

test('Back invalidates stale result and submit events as well as pending keyboard focus', () => {
    const actions = [];
    const result = { key: 'result', title: 'Result' };
    const owner = new Runner(
        SearchView,
        searchProps({ onSearch: () => actions.push('submit'), onResultPress: () => actions.push('select') })
    );
    const submit = owner.find('search-input').props.onSubmitEditing;
    const item = owner.find('search-results').props.renderItem({ item: result });
    owner.render({ ...owner.props, open: false });
    owner.event(submit).pressNode(item);
    assert.deepEqual(actions, [], 'an exiting search cannot execute queued actions on the underlying destination');
});

test('contained search uses a rounded56dp field while the divided baseline uses the72dp view mode', () => {
    const owner = new Runner(SearchView, searchProps());
    assert.equal(owner.find('search-input').props.mode, 'bar');
    assert.equal(owner.find('search-input').props.style.borderRadius, 28);
    assert.equal(owner.find('search-input').props.placeholderTextColor, '#49454f');
    assert.equal(owner.find('search-input').props.inputStyle.color, '#1d1b20');
    owner.render({ ...owner.props, variant: 'divided' });
    assert.equal(owner.find('search-input').props.mode, 'view');
    owner.render({ ...owner.props, presentation: 'docked' });
    assert.equal(owner.find('search-input').props.mode, 'bar');
    assert.ok(owner.find('search-outside').props.onPress, 'docked results retain an outside-dismiss action');
});

test('card variants use current container roles and do not inherit Paper elevated pressed2', () => {
    for (const [mode, color, resting] of [
        ['elevated', '#f7f2fa', 1],
        ['contained', '#e6e0e9', 0],
        ['outlined', '#fef7ff', 0],
    ]) {
        const owner = new Runner(Card, { mode, onPress() {}, children: 'Card', testID: 'card' });
        const surface = owner.native('Surface');
        assert.equal(surface.props.style[0].backgroundColor, color);
        owner.event(owner.find('card').props.onPressIn, {});
        assert.equal(surface.props.elevation.latest.toValue, resting, `${mode} keeps its own pressed elevation`);
    }
});

test('a hovered elevated card rises but a pressed card returns to its declared pressed level', () => {
    const owner = new Runner(Card, { onPress() {}, children: 'Card', testID: 'card-hover' });
    owner.event(owner.find('card-hover').props.onHoverIn, {});
    assert.equal(owner.native('Surface').props.elevation.latest.toValue, 2);
    owner.event(owner.find('card-hover').props.onPressIn, {});
    assert.equal(owner.native('Surface').props.elevation.latest.toValue, 1);
    owner.event(owner.find('card-hover').props.onPressOut, {});
    assert.equal(owner.native('Surface').props.elevation.latest.toValue, 2, 'release restores the still-hovered state');
});

test('a selected disabled card exposes the controlled state and cannot activate', () => {
    const requests = [];
    const owner = new Runner(Card, {
        disabled: true,
        accessibilityRole: 'checkbox',
        accessibilityState: { checked: true },
        onPress: () => requests.push('selected'),
        children: 'Card',
        testID: 'card-disabled',
    });
    const target = owner.find('card-disabled');
    assert.equal(target.props.accessibilityRole, 'checkbox');
    assert.equal(target.props.accessibilityState.checked, true);
    assert.equal(target.props.accessibilityState.disabled, true);
    owner.press('card-disabled');
    assert.deepEqual(requests, []);
});

function snackbarProps(extra = {}) {
    return { visible: true, children: 'Saved', onDismiss() {}, testID: 'snackbar', ...extra };
}

test('badge counts and status labels never exceed the reference four characters', () => {
    for (const [children, expected] of [
        [1, 1],
        [999, 999],
        [1200, '999+'],
        ['12345', '123+'],
        ['NUEVO', 'NUE+'],
    ]) {
        const owner = new Runner(Badge, { children });
        assert.equal(owner.tree.props.children, expected);
    }
});

test('numeric badge thresholds fit the reference limit without reporting a truncated false maximum', () => {
    for (const [children, maximum, expected] of [
        [1001, 1000, '999+'],
        [10000, 9999, '999+'],
        [1, -1, '0+'],
        [1000, NaN, '999+'],
        [1000, Infinity, '999+'],
        [100, 99.9, '99+'],
        [0, 99, 0],
        ['New', 2, 'New'],
    ]) {
        const owner = new Runner(Badge, { children, maximum });
        assert.equal(owner.tree.props.children, expected);
    }
});

test('large badge keeps its themed text and minimum size without clipping scaled text to sixteen dp', () => {
    const original = theme.fonts.labelSmall;
    try {
        for (const [fontSize, lineHeight] of [
            [11, 16],
            [16.5, 24],
            [22, 32],
        ]) {
            theme.fonts.labelSmall = { ...original, fontSize, lineHeight };
            const owner = new Runner(Badge, { children: 999 });
            const style = resolvedStyle(owner.tree.props.style);
            assert.equal(style.height, undefined, 'native Text owns its measured height');
            assert.equal(style.minHeight, 16);
            assert.equal(style.minWidth, 16);
            assert.equal(style.paddingHorizontal, 4);
            assert.equal(style.fontSize, fontSize, 'theme typography is not replaced by a hardcoded eleven');
            assert.equal(style.lineHeight, lineHeight);
            assert.equal(style.color, theme.colors.onError);
            assert.equal(style.backgroundColor, theme.colors.error);
            assert.equal(style.borderRadius, 9999, 'expanded text keeps a capsule');
            assert.equal(owner.tree.props.allowFontScaling, undefined, 'native scaling stays enabled');
        }
        const dot = new Runner(Badge, { variant: 'dot', children: 'ignored' });
        const style = resolvedStyle(dot.tree.props.style);
        assert.equal(style.height, 6);
        assert.equal(style.minWidth, 6);
        assert.equal(style.paddingHorizontal, 0);
        assert.equal(style.borderRadius, 3);
        assert.equal(dot.tree.props.children, undefined);
    } finally {
        theme.fonts.labelSmall = original;
    }
});

test('a standalone invisible badge cannot remain a second accessible notification', () => {
    const owner = new Runner(Badge, { children: 10, visible: true, accessibilityLabel: 'Ten notifications' });
    owner.render({ ...owner.props, visible: false });
    assert.equal(owner.tree.props.visible, false, 'Paper retains its existing reduced-motion-aware fade engine');
    assert.equal(owner.tree.props.accessibilityElementsHidden, true);
    assert.equal(owner.tree.props.importantForAccessibility, 'no-hide-descendants');
    owner.render({ ...owner.props, visible: true });
    assert.equal(owner.tree.props.accessibilityElementsHidden, undefined);
    assert.equal(owner.tree.props.importantForAccessibility, undefined);
    assert.equal(owner.tree.props.accessibilityLabel, 'Ten notifications');
});

test('BadgedBox anchors the bottom overlap to the icon and mirrors only the logical edge', () => {
    try {
        for (const rtl of [false, true]) {
            direction.isRTL = rtl;
            const owner = new Runner(BadgedBox, { children: jsx('Icon', { size: 24 }), badge: 1, testID: 'badge-box' });
            owner.event(owner.find('badge-box-anchor').props.onLayout, { nativeEvent: { layout: { width: 24, height: 24 } } });
            let badge = owner.find('badge-box-badge');
            let style = resolvedStyle(badge.props.style);
            assert.equal(style[rtl ? 'right' : 'left'], 12);
            assert.equal(style[rtl ? 'left' : 'right'], undefined);
            assert.equal(style.bottom, 10, 'the lower edge remains fourteen dp below the icon top at any label height');
            assert.equal(style.top, undefined, 'a fixed top would shift the reference overlap when text grows');
            assert.equal(badge.props.pointerEvents, 'none');
            assert.equal(badge.props.accessibilityElementsHidden, true);
            owner.render({ ...owner.props, badge: true });
            badge = owner.find('badge-box-badge');
            style = resolvedStyle(badge.props.style);
            assert.equal(style[rtl ? 'right' : 'left'], 18);
            assert.equal(style.bottom, 18);
            owner.render({ ...owner.props, badge: false });
            assert.equal(
                walk(owner.tree).some((node) => node.props?.testID === 'badge-box-badge'),
                false
            );
        }
    } finally {
        direction.isRTL = false;
    }
});

test('vertical dividers occupy a one-dp line while horizontal insets stay logical', () => {
    const vertical = new Runner(Divider, { orientation: 'vertical' });
    assert.equal(resolvedStyle(vertical.tree.props.style).width, 1);
    assert.equal(resolvedStyle(vertical.tree.props.style).alignSelf, 'stretch');
    const horizontal = new Runner(Divider, { leftInset: true });
    assert.equal(resolvedStyle(horizontal.tree.props.style).marginStart, 16);
    assert.equal(resolvedStyle(horizontal.tree.props.style).marginLeft, undefined);
    assert.equal(resolvedStyle(horizontal.tree.props.style).alignSelf, 'stretch');
    assert.equal(horizontal.tree.props.accessibilityElementsHidden, true);
    assert.equal(horizontal.tree.props.pointerEvents, 'none');
});

test('snackbar action layout respects the local RTL direction', () => {
    direction.isRTL = true;
    try {
        const owner = new Runner(Snackbar, snackbarProps({ actionOnNewLine: true, action: { label: 'Undo' }, onIconPress() {} }));
        const actionRow = walk(owner.tree).find((node) => node?.type === 'View' && node.props.style?.paddingBottom === 2);
        assert.equal(actionRow.props.style.flexDirection, 'row-reverse');
    } finally {
        direction.isRTL = false;
    }
});

test('a snackbar action persists until a real action and then requests dismissal exactly once', () => {
    const events = [];
    const owner = new Runner(
        Snackbar,
        snackbarProps({
            duration: 4000,
            action: { label: 'Undo', onPress: () => events.push('undo') },
            onDismiss: () => events.push('dismiss'),
        })
    );
    owner.advance(20000);
    assert.equal(owner.timers.size, 0, 'actionable messages do not expire while someone is deciding');
    assert.deepEqual(events, []);
    owner.press('snackbar-action').press('snackbar-action');
    assert.deepEqual(events, ['undo', 'dismiss']);
});

test('a snackbar timer from the previous message cannot dismiss its replacement', () => {
    const events = [];
    const owner = new Runner(Snackbar, snackbarProps({ onDismiss: () => events.push('dismiss') }));
    const old = [...owner.timers.values()][0].callback;
    owner.advance(3000).render({ ...owner.props, children: 'New message' });
    owner.event(old).advance(1000);
    assert.deepEqual(events, [], 'replacing content starts its own duration');
    owner.advance(3000);
    assert.deepEqual(events, ['dismiss']);
});

test('snackbar rapid reopen and unmount invalidate stale animation and timeout completions', () => {
    const events = [];
    const owner = new Runner(Snackbar, snackbarProps({ onDismiss: () => events.push('dismiss') }));
    const timeout = [...owner.timers.values()][0].callback;
    owner.render({ ...owner.props, visible: false }).complete();
    owner.render({ ...owner.props, visible: true }).flush();
    assert.ok(owner.find('snackbar'), 'the old exit cannot remove a reopened message');
    owner.unmount();
    owner.event(timeout).flush().advance(20000);
    assert.deepEqual(events, []);
    assert.equal(owner.timers.size, 0);
});

test('web snackbar automatic dismissal requires the explicit inline-feedback contract', () => {
    const platform = modules['react-native'].Platform;
    platform.OS = 'web';
    try {
        const owner = new Runner(Snackbar, snackbarProps());
        assert.equal(owner.timers.size, 0);
        owner.render({ ...owner.props, inlineFeedback: true });
        assert.equal(owner.timers.size, 1, 'an accessible inline result permits the optional timeout');
        owner.unmount();
    } finally {
        platform.OS = 'ios';
    }
});

test('repeating identical snackbar text with a new key gives the new notification its full lifetime', () => {
    const events = [];
    const owner = new Runner(Snackbar, snackbarProps({ messageKey: 1, onDismiss: () => events.push('dismiss') }));
    const stale = [...owner.timers.values()][0].callback;
    owner.advance(3000).render({ ...owner.props, messageKey: 2 });
    owner.event(stale).advance(1000);
    assert.deepEqual(events, []);
    owner.advance(3000);
    assert.deepEqual(events, ['dismiss']);
});

test('a reentrant snackbar action cannot execute itself twice before dismissal', () => {
    const events = [];
    let owner;
    owner = new Runner(
        Snackbar,
        snackbarProps({
            action: {
                label: 'Undo',
                onPress: () => {
                    events.push('undo');
                    owner.press('snackbar-action');
                },
            },
            onDismiss: () => events.push('dismiss'),
        })
    );
    owner.press('snackbar-action');
    assert.deepEqual(events, ['undo', 'dismiss']);
});

test('snackbar politely queues native announcements instead of interrupting the current announcement', () => {
    const api = modules['react-native'].AccessibilityInfo;
    const previous = api.announceForAccessibilityWithOptions;
    const calls = [];
    api.announceForAccessibilityWithOptions = (...args) => calls.push(args);
    try {
        const owner = new Runner(Snackbar, snackbarProps());
        owner.render({ ...owner.props, children: 'Updated' });
        assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
            ['Saved', { queue: true }],
            ['Updated', { queue: true }],
        ]);
        owner.unmount();
    } finally {
        api.announceForAccessibilityWithOptions = previous;
    }
});

test('snackbar newline configuration is ignored without a related action', () => {
    const owner = new Runner(Snackbar, snackbarProps({ actionOnNewLine: true, onIconPress() {} }));
    assert.equal(walk(owner.tree).some(node => node?.props?.style?.paddingBottom === 2), false);
});

test('snackbar padding surrounds the line-clamped text instead of extending its clipping area', () => {
    const owner = new Runner(Snackbar, snackbarProps());
    const text = owner.find('snackbar-message');
    assert.equal(text.props.style.paddingVertical, undefined);
    assert.equal(pathTo(owner.tree, text).at(-2).props.style.paddingVertical, 12);
    assert.equal(text.props.numberOfLines, 2);
});

test('snackbar closing content cannot execute a queued action', () => {
    const events = [];
    const owner = new Runner(Snackbar, snackbarProps({ action: { label: 'Undo', onPress: () => events.push('undo') } }));
    const action = owner.find('snackbar-action');
    owner.render({ ...owner.props, visible: false });
    owner.event(action.props.onPress, {});
    assert.deepEqual(events, []);
    assert.equal(owner.find('snackbar-presence').props.pointerEvents, 'none');
});

test('chip main and close are independent48dp targets outside the32dp visual surface', () => {
    const actions = [];
    const owner = new Runner(Chip, {
        children: 'Places',
        onPress: () => actions.push('primary'),
        onClose: () => actions.push('close'),
        testID: 'chip-target',
    });
    const primary = owner.find('chip-target');
    const close = owner.find('chip-target-close');
    assert.equal(primary.type, 'Pressable');
    assert.equal(primary.props.style.minHeight, 48);
    assert.equal(close.props.style.minHeight, 48);
    assert.equal(close.props.style.width, 48);
    assert.equal(close.props.style.right, 0, 'the LTR close hit area stays inside the parent bounds');
    assert.ok(
        !pathTo(owner.tree, primary).some((node) => node?.type === 'Surface'),
        'the actual main hit target cannot be clipped by its32dp decorative surface'
    );
    assert.ok(walk(primary).some((node) => node.type === 'View' && node.props.style?.minHeight === 32));
    owner.press('chip-target');
    let stopped = false;
    owner.event(close.props.onPress, {
        stopPropagation() {
            stopped = true;
        },
    });
    assert.equal(stopped, true);
    assert.deepEqual(actions, ['primary', 'close'], 'closing never invokes the primary action');
});

test('a disabled chip blocks both targets while a remove-only input chip exposes one named action', () => {
    const actions = [];
    const owner = new Runner(Chip, {
        disabled: true,
        children: 'Places',
        onPress: () => actions.push('primary'),
        onClose: () => actions.push('close'),
        testID: 'chip-disabled',
    });
    owner.press('chip-disabled').press('chip-disabled-close');
    assert.deepEqual(actions, []);
    owner.render({ ...owner.props, disabled: false, onPress: undefined });
    assert.equal(owner.find('chip-disabled').props.accessible, true);
    assert.equal(owner.find('chip-disabled').props.disabled, false);
    assert.equal(owner.find('chip-disabled-close').props.accessible, false, 'the decorative X does not duplicate the removal focus stop');
    assert.match(owner.find('chip-disabled').props.accessibilityLabel, /Places/);
    owner.event(owner.find('chip-disabled-close').props.onPress, { stopPropagation() {} });
    assert.deepEqual(actions, ['close']);
});

test('a list with multiple actions keeps primary and trailing activation independent', () => {
    const actions = [];
    const trailing = jsx('SecondaryButton', { onPress: () => actions.push('trailing'), testID: 'list-trailing' });
    const owner = new Runner(ListItem, {
        title: 'Collection',
        multiAction: true,
        trailing,
        onPress: () => actions.push('primary'),
        testID: 'list-actions',
    });
    owner.press('list-actions-primary').press('list-trailing');
    assert.deepEqual(actions, ['primary', 'trailing']);
    const ancestors = pathTo(owner.tree, owner.find('list-trailing')).slice(0, -1);
    assert.ok(
        ancestors.every((node) => !node?.props?.onPress),
        'the trailing action has no row-wide press ancestor'
    );
    assert.equal(owner.find('list-actions-primary').props.accessibilityRole, 'button');
});

test('an informational multi-action row groups its text without announcing an unavailable action', () => {
    const actions = [];
    const trailing = jsx('SecondaryButton', { onPress: () => actions.push('play'), testID: 'list-track-play' });
    const owner = new Runner(ListItem, {
        title: 'Shadow twin',
        description: 'Sole R. Rey',
        multiAction: true,
        trailing,
        testID: 'list-track',
    });
    const primary = owner.find('list-track-primary');
    assert.equal(primary.type, 'View');
    assert.equal(primary.props.accessible, true, 'title and artist remain one readable information group');
    assert.equal(primary.props.accessibilityRole, 'text');
    assert.equal(primary.props.accessibilityState.disabled, false);
    assert.equal(primary.props.disabled, undefined, 'no Pressable disabled prop can override the informational semantics');
    assert.equal(primary.props.onPress, undefined);
    assert.equal(primary.props.onFocus, undefined, 'informational text cannot create a button focus mark');
    assert.deepEqual(
        walk(primary)
            .filter((node) => node.type === 'Text')
            .map((node) => node.props.children),
        ['Shadow twin', 'Sole R. Rey']
    );
    assert.equal(pathTo(owner.tree, owner.find('list-track-play')).includes(primary), false);
    owner.press('list-track-play');
    assert.deepEqual(actions, ['play']);

    owner.render({ ...owner.props, accessibilityLabel: 'Shadow twin, Sole R. Rey', accessibilityRole: 'summary', disabled: true });
    const unavailable = owner.find('list-track-primary');
    assert.equal(unavailable.props.accessibilityRole, 'summary', 'the explicit informational role is preserved');
    assert.equal(unavailable.props.accessibilityLabel, 'Shadow twin, Sole R. Rey');
    assert.equal(unavailable.props.accessibilityState.disabled, true, 'a genuinely disabled row remains unavailable');
    owner.press('list-track-play');
    assert.deepEqual(actions, ['play'], 'a genuinely disabled row still blocks its trailing control');
});

test('a disabled multi-action list cannot execute its primary or trailing action', () => {
    const actions = [];
    const owner = new Runner(ListItem, {
        title: 'Collection',
        disabled: true,
        multiAction: true,
        trailing: jsx('SecondaryButton', { onPress: () => actions.push('trailing'), testID: 'list-disabled-trailing' }),
        onPress: () => actions.push('primary'),
        testID: 'list-disabled',
    });
    owner.press('list-disabled-primary').press('list-disabled-trailing');
    assert.deepEqual(actions, []);
});

function resolvedStyle(style) {
    if (Array.isArray(style)) return Object.assign({}, ...style.map(resolvedStyle));
    return style?.compute ? style.compute() : (style ?? {});
}

test('a cancelled side drag delivered after controlled close cannot strand the native modal', () => {
    const owner = new Runner(SideSheet, { open: true, onOpenChange() {}, testID: 'side-late-cancel' });
    owner.complete();
    const oldGesture = owner.native('GestureDetector').props.gesture;
    owner.event(oldGesture.handlers.onStart);
    owner.render({ ...owner.props, open: false });
    const outgoing = owner.shared[0].animation;
    owner.event(oldGesture.handlers.onFinalize, {}, false).flush();
    assert.equal(owner.shared[0].animation, outgoing, 'late gesture cancellation must preserve the current exit, not restore the panel');
    owner.complete().flush();
    assert.equal(
        walk(owner.tree).some((node) => node.type === 'Modal'),
        false
    );
});

test('standard side sheet reveals content from its first partial width without a second offscreen translation', () => {
    const owner = new Runner(SideSheet, {
        open: true,
        variant: 'standard',
        width: 360,
        edge: 'end',
        onOpenChange() {},
        testID: 'side-partial',
    });
    owner.shared[0].current = 0.25;
    const panel = owner.find('side-partial');
    assert.equal(resolvedStyle(panel.props.style).width, 90, 'a quarter of360dp occupies90dp beside the real body');
    assert.equal(
        resolvedStyle(panel.props.style).transform,
        undefined,
        'an already clipped standard panel must not be translated outside its occupied width again'
    );
    assert.equal(
        resolvedStyle(panel.props.children.props.style).width,
        360,
        'the inner layout remains stable while the outer clip reveals it'
    );
    assert.deepEqual(resolvedStyle(panel.props.children.props.style).transform, undefined);
});

test('collapsing a rail preserves its selected destination even when other optional destinations hide', () => {
    const optional = { key: 'archive', label: 'Archive', icon: 'archive', hiddenWhenCollapsed: true };
    const owner = new Runner(NavigationRail, {
        items: [...items, optional],
        value: 'archive',
        expanded: true,
        onValueChange() {},
        testID: 'rail-active',
    });
    owner.render({ ...owner.props, expanded: false });
    assert.equal(owner.find('rail-active-archive').props.selected, true);
    owner.render({ ...owner.props, value: 'first' });
    assert.equal(
        walk(owner.tree).some((node) => node.props?.testID === 'rail-active-archive'),
        false
    );
    const scroll = owner.native('ScrollView');
    assert.equal(scroll.props.contentContainerStyle.paddingHorizontal, undefined, 'the destination target occupies the full rail width');
});

test('rail reserves its header above centered destinations and gives the destination group a name', () => {
    const owner = new Runner(NavigationRail, { items, value: 'first', expanded: true, alignment: 'center', onValueChange() {}, onExpandedChange() {}, fab: jsx('FAB', {}), accessibilityLabel: 'Clock destinations', testID: 'rail-centered' });
    const header = owner.find('rail-centered-header');
    assert.equal(resolvedStyle(header.props.style).position, undefined);
    assert.equal(resolvedStyle(header.props.style).marginBottom, 40);
    assert.equal(owner.native('ScrollView').props.accessibilityLabel, 'Clock destinations');
    assert.equal(owner.native('ScrollView').props.contentContainerStyle.justifyContent, 'center');
});

test('expanded rail labels grow the row and indicator while retaining their vertical padding', () => {
    const rail = new Runner(NavigationRail, { items, value: 'first', expanded: true, onValueChange() {}, testID: 'rail-scaled' });
    const element = rail.find('rail-scaled-first');
    const item = new Runner(element.type, element.props);
    const text = walk(item.tree).find((node) => node.type === 'Text' && node.props.variant === 'labelLarge');
    item.event(text.props.onLayout, {nativeEvent:{layout:{width:104,height:80}}});
    const indicator = item.find('rail-scaled-first').props.style[1].compute();
    assert.equal(indicator.height, 112);
    assert.equal(item.tree.props.style[1].compute().height, 112);
});

test('expanded modal rail names its dialog and preserves the completed-exit callback', () => {
    const onClosed = () => {};
    const rail = new Runner(NavigationRailModal, {open:true,onOpenChange(){},onClosed,items,value:'first',onValueChange(){},title:'Clock',testID:'rail-named'});
    assert.equal(rail.find('rail-named').props.accessibilityLabel, 'Clock');
    assert.equal(rail.find('rail-named').props.onClosed, onClosed);
    assert.equal(rail.find('rail-named-content').props.accessibilityLabel, 'Clock');
});

test('drawer labels retain flexible row space and native selected semantics instead of Paper extra end margins', () => {
    const drawer = new Runner(modules['./drawer'].NavigationDrawer, { items, value: 'first', onValueChange() {}, testID: 'drawer-label' });
    const destination = drawer.find('drawer-label-first');
    const owner = new Runner(destination.type, destination.props);
    const target = owner.find('drawer-label-first');
    assert.equal(target.props.accessibilityRole, 'tab');
    assert.equal(target.props.accessibilityState.selected, true);
    const decorative = walk(owner.tree).find((node) => node.props?.importantForAccessibility === 'no-hide-descendants');
    assert.equal(decorative.props.accessibilityElementsHidden, true, 'a named drawer destination is a single native target');
    const label = walk(owner.tree).find((node) => node.type === 'Text' && node.props.children === 'First');
    assert.equal(resolvedStyle(label.props.style).flex, 1);
    assert.equal(
        resolvedStyle(label.props.style).marginRight,
        undefined,
        'a long label can consume the row space not occupied by icon and badge'
    );
});

test('modal drawer caps its width, names the surface and exposes one completed-exit callback', () => {
    const exits = [];
    const drawer = new Runner(NavigationDrawerModal, {
        open: true, items, value: 'first', width: 480, title: 'Correo', onValueChange() {}, onOpenChange() {},
        onClosed: () => exits.push('closed'), testID: 'drawer-exit',
    });
    const element = drawer.find('drawer-exit');
    assert.equal(element.props.width, 360);
    assert.equal(element.props.accessibilityLabel, 'Correo');
    const sheet = new Runner(element.type, element.props).complete().flush();
    assert.deepEqual(exits, []);
    sheet.render({ ...sheet.props, open: false }).complete().flush();
    assert.deepEqual(exits, ['closed']);
    sheet.render({ ...sheet.props, onClosed: () => exits.push('duplicate') }).flush();
    assert.deepEqual(exits, ['closed']);
});

test('a disabled drawer destination cannot retain focus when the web modal trap probes it', () => {
    const platform = modules['react-native'].Platform;
    const previous = platform.OS;
    platform.OS = 'web';
    try {
        const drawer = new Runner(modules['./drawer'].NavigationDrawer, { items, value: 'first', onValueChange() {}, testID: 'drawer-disabled-focus' });
        const row = walk(drawer.tree).find((node) => node.props?.item?.disabled);
        assert.ok(row);
        const owner = new Runner(row.type, row.props);
        const ripple = owner.find(row.props.testID);
        let blurred = 0;
        ripple.props.onFocus({ currentTarget: { blur: () => { blurred += 1; } } });
        assert.equal(blurred, 1);
        assert.equal(ripple.props.accessibilityState.disabled, true);
    } finally {
        platform.OS = previous;
    }
});

test('search notifies final removal once and preserves a reopened view against a stale exit', () => {
    const closed = [];
    const owner = new Runner(SearchView, searchProps({ open: false, onClosed: () => closed.push('old') }));
    assert.deepEqual(closed, [], 'initially closed is not a completed exit');
    owner
        .render({ ...owner.props, open: true })
        .complete()
        .flush();
    owner.render({ ...owner.props, open: false });
    const staleExit = owner.shared[0].animation;
    assert.deepEqual(closed, [], 'selection can wait while the morph returns to its entry');
    owner.render({ ...owner.props, open: true, onClosed: () => closed.push('latest') });
    staleExit.callback(true);
    owner.flush().complete().flush();
    assert.deepEqual(closed, [], 'interrupted exit must not navigate away from a reopened search');
    owner
        .render({ ...owner.props, open: false })
        .complete()
        .flush();
    assert.deepEqual(closed, ['latest']);
    owner.render({ ...owner.props, onClosed: () => closed.push('duplicate') }).flush();
    assert.deepEqual(closed, ['latest'], 'callback identity changes do not repeat a completed exit');
});

test('search app-bar entry can inherit its container and alignment without restyling focused search', () => {
    const owner = new Runner(SearchView, searchProps({ barContainerColor: 'transparent', barTextAlign: 'center' }));
    const closed = owner.native('Searchbar');
    assert.equal(closed.props.style.backgroundColor, 'transparent');
    assert.equal(closed.props.inputStyle.textAlign, 'center');
    const focused = owner.find('search-input');
    assert.equal(focused.props.style.backgroundColor, 'transparent');
    assert.equal(owner.find('search-capsule').props.style[0].backgroundColor, theme.colors.surfaceContainerHigh);
    assert.equal(focused.props.inputStyle.textAlign, undefined, 'editing retains the normal logical input alignment');
    owner.render({ ...owner.props, barContainerColor: undefined, barTextAlign: undefined });
    assert.equal(owner.native('Searchbar').props.style.backgroundColor, theme.colors.surfaceContainerHigh);
    assert.equal(owner.native('Searchbar').props.inputStyle.textAlign, 'left');
});

test('search trailing controls are independently reachable and removed controls release entry text space', () => {
    const avatar = jsx('Pressable', { testID: 'account', children: 'Account' });
    const owner = new Runner(SearchView, searchProps({ open: false, trailingContent: avatar }));
    const path = pathTo(owner.tree, owner.find('account'));
    assert.ok(path.every((node) => node.props?.pointerEvents !== 'none' && node.props?.accessibilityElementsHidden !== true));
    const trailing = owner.find('search-trailing-content');
    assert.equal(trailing.props.style.top, '50%');
    assert.equal(trailing.props.style.transform[0].translateY, -24, 'the target stays centered when text makes the bar taller');
    owner.event(trailing.props.onLayout, { nativeEvent: { layout: { width: 48 } } });
    assert.equal(owner.native('Searchbar').props.right().props.style.width, 48);
    owner.render({ ...owner.props, trailingContent: undefined });
    assert.equal(
        owner.native('Searchbar').props.right().props.style.width,
        0,
        'a previous avatar measurement cannot keep an empty trailing reservation'
    );
});

test('search navigation action draws one glyph at the MD3 28dp center in LTR and RTL', () => {
    try {
        for (const rtl of [false, true]) {
            direction.isRTL = rtl;
            const actions = [],
                requests = [];
            const owner = new Runner(
                SearchView,
                searchProps({
                    open: false,
                    leadingIcon: 'menu',
                    onLeadingPress: () => actions.push('navigation'),
                    onOpenChange: (open) => requests.push(open),
                })
            );
            const bar = owner.native('Searchbar');
            assert.equal(
                typeof bar.props.icon,
                'function',
                'the original Paper slot reserves space without drawing the navigation icon again'
            );
            const placeholder = bar.props.icon({ size: 24, color: 'ignored' });
            assert.equal(placeholder.type, 'View');
            assert.equal(placeholder.props.style.width, 24);
            assert.equal(placeholder.props.style.height, 24);
            assert.equal(walk(placeholder).filter((node) => node.type === 'Icon').length, 0);
            const action = owner.find('search-leading-action');
            const style = resolvedStyle(action.props.style);
            assert.equal(action.props.icon, 'menu');
            assert.equal(style[rtl ? 'right' : 'left'] + 48 / 2, 28, '48dp target shares the MD3 glyph center');
            assert.equal(style[rtl ? 'left' : 'right'], undefined);
            assert.equal(style.top, '50%');
            assert.equal(style.transform[0].translateY, -24);
            assert.ok(
                pathTo(owner.tree, action).every(
                    (node) => node.props?.pointerEvents !== 'none' && node.props?.accessibilityElementsHidden !== true
                ),
                'only the independent navigation action is reachable'
            );
            owner.press('search-leading-action');
            assert.deepEqual(actions, ['navigation']);
            assert.deepEqual(requests, [], 'navigation does not activate the sibling search target');
            owner.render({ ...owner.props, disabled: true });
            owner.press('search-leading-action');
            assert.deepEqual(actions, ['navigation']);
            owner.render({ ...owner.props, disabled: false, onLeadingPress: undefined });
            assert.equal(
                owner.native('Searchbar').props.icon,
                'menu',
                'without the separate action Paper renders the single original glyph'
            );
            assert.equal(
                walk(owner.tree).some((node) => node.props?.testID === 'search-leading-action'),
                false
            );
        }
    } finally {
        direction.isRTL = false;
    }
});

test('Searchbar offers clear only for content, including spaces, and retains a custom trailing slot', () => {
    for (const mode of ['bar','view']) {
        const owner=new Runner(MobileSearchbar,{mode,value:'',testID:'original-search'});
        const hasClear=()=>walk(owner.tree).some(node=>node.props?.testID==='original-search-clear-icon');
        assert.equal(hasClear(),false);
        owner.render({...owner.props,value:'Mérida'});assert.equal(hasClear(),true);
        owner.render({...owner.props,value:'   '});assert.equal(hasClear(),true);
        owner.render({...owner.props,value:''});assert.equal(hasClear(),false);
        const right=()=>jsx('View',{testID:'custom-search-action'});
        owner.render({...owner.props,value:'Mérida',right});assert.equal(hasClear(),false);
        assert.equal(walk(owner.tree).some(node=>node.props?.testID==='custom-search-action'),mode==='bar');
    }
});
test('Searchbar preserves native input controls, caller glyphs and platform colors without a decorative button', () => {
    const change=()=>{},inputRef={current:null};
    const owner=new Runner(MobileSearchbar,{value:'Mérida',onChangeText:change,ref:inputRef,testID:'original-search'});
    assert.equal(owner.native('TextInput').props.onChangeText,change);
    assert.equal(owner.native('TextInput').props.accessibilityLabel,'Buscar');
    assert.equal(owner.native('TextInput').props.autoCorrect,false);
    assert.equal(owner.native('TextInput').props.autoCapitalize,'none');
    assert.equal(owner.find('original-search-icon').props.accessible,false);
    assert.equal(owner.native('Icon').props.source,'search');
    inputRef.current.focus();inputRef.current.clear();inputRef.current.setSelection(1,2);
    assert.equal(owner.focusCalls,1);assert.equal(inputRef.current.isFocused(),true);
    assert.deepEqual(owner.commands,[{type:'clear'},{type:'selection',start:1,end:2}]);
    const customIcon=()=>jsx('View',{}),customColor={dynamic:{light:'#abcdef',dark:'#fedcba'}};
    owner.render({...owner.props,icon:customIcon,iconColor:customColor,autoCorrect:true,autoCapitalize:'words'});
    assert.equal(owner.native('Icon').props.source,customIcon);
    assert.equal(owner.native('Icon').props.color,customColor);
    assert.equal(owner.native('TextInput').props.autoCorrect,true);
    assert.equal(owner.native('TextInput').props.autoCapitalize,'words');
});
test('Searchbar clearing uses current callbacks and rejects queued presses after read-only or removal', () => {
    const changes=[];
    const owner=new Runner(MobileSearchbar,{value:'Mérida',testID:'original-search',onChangeText:value=>changes.push('old:'+value)});
    const clear=owner.find('original-search-clear-icon').props.onPress;
    owner.render({...owner.props,onChangeText:value=>changes.push('new:'+value)});
    owner.event(clear,{});assert.deepEqual(changes,['new:']);
    owner.render({...owner.props,editable:false});owner.event(clear,{});assert.deepEqual(changes,['new:']);
    owner.render({...owner.props,editable:true});const removed=owner.find('original-search-clear-icon').props.onPress;
    owner.render({...owner.props,readOnly:true});owner.event(removed,{});assert.deepEqual(changes,['new:']);
    owner.unmount();owner.event(removed,{});assert.deepEqual(changes,['new:']);
});
test('queued search edits cannot change the query after close, disable or unmount', () => {
    const changes=[];
    const owner=new Runner(SearchView,searchProps({onChangeText:value=>changes.push(value)}));
    const change=owner.find('search-input').props.onChangeText;
    owner.event(change,'first');assert.deepEqual(changes,['first']);
    owner.render({...owner.props,open:false});owner.event(change,'late');assert.deepEqual(changes,['first']);
    owner.render({...owner.props,open:true,disabled:true});owner.event(change,'blocked');assert.deepEqual(changes,['first']);
    owner.unmount();owner.event(change,'removed');assert.deepEqual(changes,['first']);
});

test('search clearing keeps the controlled change lifecycle without submitting, dismissing or refocusing', () => {
    const changes = [],
        submissions = [],
        requests = [];
    const owner = new Runner(
        SearchView,
        searchProps({
            value: 'Oaxaca',
            onChangeText: (value) => changes.push(value),
            onSearch: (value) => submissions.push(value),
            onOpenChange: (open) => requests.push(open),
        })
    ).framesNow();
    assert.equal(owner.focusCalls, 1);
    // PaperSearchbar's clear handler delegates the new empty query through this
    // callback; the parent then supplies the controlled value on its next render.
    owner.event(owner.find('search-input').props.onChangeText, '');
    assert.deepEqual(changes, ['']);
    assert.equal(owner.find('search-input').props.value, 'Oaxaca', 'the owner retains control until it supplies the changed value');
    owner.render({ ...owner.props, value: changes.at(-1) }).framesNow();
    assert.equal(owner.find('search-input').props.value, '');
    const shared = new Runner(MobileSearchbar, owner.find('search-input').props);
    assert.equal(walk(shared.tree).some(node=>node.props?.testID==='search-input-clear-icon'),false);
    assert.equal(owner.props.open, true);
    assert.equal(owner.focusCalls, 1);
    assert.deepEqual(submissions, []);
    assert.deepEqual(requests, []);
});

test('a retained custom search trigger cannot open after disable or disposal', () => {
    const requests = [];
    let trigger;
    const owner = new Runner(
        SearchView,
        searchProps({
            open: false,
            onOpenChange: (open) => requests.push(open),
            renderTrigger: (state) => {
                trigger = state.open;
                return null;
            },
        })
    );
    const retained = trigger;
    owner.render({ ...owner.props, disabled: true });
    owner.event(retained);
    owner.unmount();
    owner.event(retained);
    assert.deepEqual(requests, []);
});

const selectOptions = [{value:'a',label:'A'},{value:'b',label:'B'},{value:'c',label:'C',disabled:true}];
function nativeSelectHost(onValueChange = () => {}) { return new Runner(NativeSelect,{id:'select-session',label:'Choice',value:'a',options:selectOptions,onValueChange}); }
function selectPopup(owner) { return owner.find('select-session-popup'); }
function openSelect(owner) { owner.event(walk(selectPopup(owner).props.anchor).find(node=>node.props?.testID==='select-session').props.onPress); }
test('native Select cannot choose while closed or from a retained closing menu',()=>{
    const values=[],owner=nativeSelectHost(value=>values.push(value));
    selectPopup(owner).props.children.props.onChoose(selectOptions[1]);assert.deepEqual(values,[]);
    openSelect(owner);const choose=selectPopup(owner).props.children.props.onChoose;
    owner.event(selectPopup(owner).props.onDismiss);owner.event(choose,selectOptions[1]);assert.deepEqual(values,[]);
});
test('native Select revokes old callbacks after disable/re-enable and reopening',()=>{
    const values=[],owner=nativeSelectHost(value=>values.push(value));openSelect(owner);
    const choose=selectPopup(owner).props.children.props.onChoose;
    owner.render({...owner.props,disabled:true});owner.render({...owner.props,disabled:false});openSelect(owner);
    owner.event(choose,selectOptions[1]);assert.deepEqual(values,[]);
    owner.event(selectPopup(owner).props.children.props.onChoose,selectOptions[1]);assert.deepEqual(values,['b']);
});
test('native Select resolves the current option and current change handler',()=>{
    const values=[],owner=nativeSelectHost(value=>values.push('old:'+value));openSelect(owner);
    const choose=selectPopup(owner).props.children.props.onChoose;
    owner.render({...owner.props,onValueChange:value=>values.push('current:'+value)});
    owner.event(choose,selectOptions[1]);assert.deepEqual(values,['current:b']);
});
test('native Select discards options removed or disabled during a pending press',()=>{
    const values=[],owner=nativeSelectHost(value=>values.push(value));openSelect(owner);
    const choose=selectPopup(owner).props.children.props.onChoose;
    owner.render({...owner.props,options:[selectOptions[0],{...selectOptions[1],disabled:true}]});
    owner.event(choose,selectOptions[1]);owner.event(selectPopup(owner).props.children.props.onChoose,selectOptions[1]);
    assert.deepEqual(values,[]);
});
test('confirming an already selected native Select value closes without emitting a change',()=>{
    const values=[],owner=nativeSelectHost(value=>values.push(value));openSelect(owner);
    owner.event(selectPopup(owner).props.children.props.onChoose,selectOptions[0]);
    assert.deepEqual(values,[]);assert.equal(selectPopup(owner).props.visible,false);
});
test('native Select starts accessible discovery at the selected available option',()=>{
    const owner=nativeSelectHost();owner.render({...owner.props,value:'b'});openSelect(owner);
    const rows=selectPopup(owner).props.children;const rendered=new Runner(rows.type,rows.props);
    assert.equal(rendered.find('select-session-options-b').props.ref,rows.props.firstOptionRef);
    assert.equal(rendered.find('select-session-options-c').props.disabled,true);
});

function autocompleteHost(props={}) {return new Runner(NativeAutocomplete,{id:'auto-session',label:'City',value:'',options:selectOptions,onValueChange(){},...props});}
function autocompletePopup(owner){return owner.find('auto-session-popup');}
function autoInput(owner){return walk(autocompletePopup(owner).props.anchor).find(node=>node.props?.testID==='auto-session');}
function openAutocomplete(owner){owner.event(autoInput(owner).props.onFocus);}
test('Autocomplete rejects choices after closing, disabling, changing the query or removing a result',()=>{
    for (const change of ['close','disable','query','remove']) {
        const values=[],owner=autocompleteHost({onValueChange:value=>values.push(value)});openAutocomplete(owner);
        const choose=autocompletePopup(owner).props.children.props.onChoose;
        if(change==='close') owner.event(autocompletePopup(owner).props.onDismiss);
        if(change==='disable') {owner.render({...owner.props,disabled:true});owner.render({...owner.props,disabled:false});openAutocomplete(owner);}
        if(change==='query') owner.render({...owner.props,value:'A'});
        if(change==='remove') owner.render({...owner.props,options:[selectOptions[0]]});
        owner.event(choose,selectOptions[1]);assert.deepEqual(values,[],change);
    }
});
test('Autocomplete selects current metadata and callbacks only once, even before a render',()=>{
    const events=[],owner=autocompleteHost();openAutocomplete(owner);
    const choose=autocompletePopup(owner).props.children.props.onChoose;
    owner.render({...owner.props,options:[selectOptions[0],{...selectOptions[1],label:'Updated B'},selectOptions[2]],onValueChange:value=>events.push(value),onSelect:option=>events.push(option.label)});
    owner.event(()=>{choose(selectOptions[1]);choose(selectOptions[1]);});
    assert.deepEqual(events,['Updated B','Updated B']);assert.equal(autocompletePopup(owner).props.visible,false);
});
test('Autocomplete blur and outside dismissal preserve text; explicit Escape signals cancellation once',()=>{
    let escapes=0;
    const owner=autocompleteHost({value:'A',onEscape:()=>escapes++});openAutocomplete(owner);
    owner.event(autocompletePopup(owner).props.onDismiss);assert.equal(escapes,0);
    assert.equal(autoInput(owner).props.value,'A');
    openAutocomplete(owner);const escape=autocompletePopup(owner).props.onEscape;
    owner.event(()=>{escape();escape();});assert.equal(escapes,1);
});
test('Autocomplete openOnFocus=false still opens on typing, and blocked old edit callbacks stay revoked',()=>{
    const values=[],owner=autocompleteHost({openOnFocus:false,onValueChange:value=>values.push(value)});
    owner.event(autoInput(owner).props.onFocus);assert.equal(autocompletePopup(owner).props.visible,false);
    const edit=autoInput(owner).props.onChangeText;
    owner.event(edit,'B');assert.equal(autocompletePopup(owner).props.visible,true);assert.deepEqual(values,['B']);
    owner.render({...owner.props,disabled:true});owner.render({...owner.props,disabled:false});owner.event(edit,'stale');
    owner.unmount();owner.event(edit,'disposed');assert.deepEqual(values,['B']);
});
test('Autocomplete preserves externally ranked results when filtering is delegated',()=>{
    const owner=autocompleteHost({value:'external tag',filter:false});openAutocomplete(owner);
    assert.deepEqual(autocompletePopup(owner).props.children.props.options,selectOptions);
    owner.render({...owner.props,filter:true});assert.deepEqual(autocompletePopup(owner).props.children.props.options,[]);
});

test('toolbar uses available spacing for five actions and moves extra actions into a working menu', () => {
    const events = [];
    const actions = Array.from({ length: 7 }, (_, index) => ({
        key: `action${index}`,
        icon: 'star',
        label: `Action${index}`,
        onPress: () => events.push(index),
        disabled: index === 6,
    }));
    const owner = new Runner(Toolbar, { actions: actions.slice(0, 5), safeArea: false, testID: 'tools-fit' });
    owner.event(owner.find('tools-fit').props.onLayout, { nativeEvent: { layout: { width: 320 } } });
    const row = walk(owner.tree).find((node) => node.props?.accessibilityLabel === 'Herramientas');
    const style = resolvedStyle(row.props.style);
    assert.equal(style.gap, 12, 'five48dp actions + four12dp gaps + two16dp margins fit320dp');
    assert.equal(
        walk(owner.tree).some((node) => node.type === modules['./menu'].Menu),
        false
    );
    owner.render({ ...owner.props, actions });
    let menu = owner.native(modules['./menu'].Menu);
    owner.event(menu.props.anchor.props.onPress);
    menu = owner.native(modules['./menu'].Menu);
    assert.equal(menu.props.visible, true);
    owner.press('tools-fit-overflow-action6');
    assert.deepEqual(events, [], 'disabled overflow tools remain inert');
    owner.press('tools-fit-overflow-action4');
    owner.event(owner.native(modules['./menu'].Menu).props.onClosed);
    assert.deepEqual(events, [4], 'overflow must invoke the same real action moved out of the row');
    assert.equal(owner.native(modules['./menu'].Menu).props.visible, false);
});

test('web renderer does not treat its unconditional screen-reader stub as a real setting', () => {
    const platform=modules['react-native'].Platform;
    const api=modules['react-native'].AccessibilityInfo;
    const old=api.isScreenReaderEnabled;
    let queried=0;
    platform.OS='web';
    api.isScreenReaderEnabled=()=>({then(callback){queried++;callback(true);}});
    try {
        const owner=new Runner(Toolbar,{variant:'floating',expanded:false,visible:false,actions:[],fab:{key:'save',icon:'save',label:'Save',onPress(){}},testID:'web-tools'});
        assert.equal(queried,0);
        assert.equal(owner.find('web-tools').props.inert,true);
        assert.equal(owner.find('web-tools-controls').props.interactive,false);
        assert.equal(owner.find('web-tools-fab').props.disabled,true);
        owner.unmount();
    } finally {platform.OS='ios';api.isScreenReaderEnabled=old;}
});
test('queued toolbar actions use the current callback and are revoked when their distribution changes', () => {
    const events=[];
    const actions=[{key:'a',icon:'star',label:'A',onPress:()=>events.push('old')},{key:'b',icon:'star',label:'B',onPress(){}}];
    const owner=new Runner(Toolbar,{actions,testID:'current-tools'});
    const old=owner.find('current-tools-a').props.onPress;
    owner.render({...owner.props,actions:[{...actions[0],onPress:()=>events.push('current')},actions[1]]});
    owner.event(old);
    assert.deepEqual(events,['current']);
    const queued=owner.find('current-tools-a').props.onPress;
    owner.render({...owner.props,maxVisibleActions:0});
    owner.event(queued);
    assert.deepEqual(events,['current']);
    owner.unmount();owner.event(queued);
    assert.deepEqual(events,['current']);
});
test('a constrained vertical toolbar moves excess actions into its real menu',()=>{
    const actions=Array.from({length:20},(_,index)=>({key:String(index),icon:'star',label:String(index),onPress(){}}));
    const owner=new Runner(Toolbar,{actions,variant:'floating',orientation:'vertical',style:{maxHeight:240},testID:'vertical-tools'});
    assert.ok(owner.native(modules['./menu'].Menu));
    assert.ok(walk(owner.tree).filter(node=>node.props?.testID?.startsWith('vertical-tools-overflow-')).length>=17);
});
test('a toolbar does not reopen a stale overflow menu after hiding and showing', () => {
    const actions = Array.from({ length: 6 }, (_, index) => ({ key: String(index), icon: 'star', label: String(index), onPress() {} }));
    const owner = new Runner(Toolbar, { actions, maxVisibleActions: 2, testID: 'tools-reopen' });
    owner.event(owner.native(modules['./menu'].Menu).props.anchor.props.onPress);
    assert.equal(owner.native(modules['./menu'].Menu).props.visible, true);
    owner.render({ ...owner.props, visible: false });
    owner.render({ ...owner.props, visible: true });
    assert.equal(owner.native(modules['./menu'].Menu).props.visible, false);
});

test('a navigation drawer has no inherited close icon while scrim, Back, swipe, selection and supplementary-sheet close remain functional', () => {
    for (const action of ['scrim', 'back', 'swipe', 'escape']) {
        const requests = [];
        const drawer = new Runner(NavigationDrawerModal, {
            open: true,
            items,
            value: 'first',
            title: 'Correo',
            onValueChange() {},
            onOpenChange: (open) => requests.push(open),
            testID: `drawer-dismiss-${action}`,
        });
        const sheetElement = drawer.find(`drawer-dismiss-${action}`);
        const sheet = new Runner(sheetElement.type, sheetElement.props);
        assert.equal(
            walk(sheet.tree).some((node) => node.props?.testID === `drawer-dismiss-${action}-close`),
            false,
            'the generic SideSheet close icon is not part of the drawer anatomy'
        );
        assert.ok(
            walk(sheet.tree).some((node) => node.type === 'Text' && node.props.children === 'Correo'),
            'removing the inherited icon preserves the drawer headline'
        );
        if (action === 'scrim') sheet.press(`drawer-dismiss-${action}-scrim`);
        if (action === 'back') sheet.event(sheet.native('Modal').props.onRequestClose);
        if (action === 'escape') sheet.event(sheet.find(`drawer-dismiss-${action}`).props.onAccessibilityEscape);
        if (action === 'swipe') {
            sheet.complete();
            const gesture = sheet.native('GestureDetector').props.gesture;
            sheet.event(gesture.handlers.onStart).event(gesture.handlers.onUpdate, { translationX: -250 });
            sheet.event(gesture.handlers.onEnd, { velocityX: -600 }).flush();
        }
        assert.deepEqual(requests, [false], `${action} still requests closure without a visible X`);
        sheet.render({ ...sheet.props, open: false });
        sheet.complete().flush();
        assert.equal(
            walk(sheet.tree).some((node) => node.type === 'Modal'),
            false,
            'a legitimate dismissal still removes the native overlay'
        );
    }
    const selected = [],
        closed = [];
    const drawer = new Runner(NavigationDrawerModal, {
        open: true,
        items,
        value: 'first',
        onValueChange: (value) => selected.push(value),
        onOpenChange: (open) => closed.push(open),
        testID: 'drawer-select-no-x',
    });
    const contentElement = drawer.find('drawer-select-no-x-content');
    const content = new Runner(contentElement.type, contentElement.props);
    const destination = content.find('drawer-select-no-x-last');
    new Runner(destination.type, destination.props).press('drawer-select-no-x-last');
    assert.deepEqual(selected, ['last']);
    assert.deepEqual(closed, [false]);
    const supplementary = new Runner(SideSheet, {
        open: true,
        title: 'Detalles',
        onOpenChange: (open) => closed.push(open),
        testID: 'supplementary-close',
    });
    supplementary.press('supplementary-close-close');
    assert.deepEqual(closed, [false, false], 'a real supplementary SideSheet retains its documented close icon');
});

test('scroll indicators are per-instance and Gorhom refs/overrides survive the adapter', () => {
    for (const Component of [sheets.BottomSheetScrollView, sheets.BottomSheetFlatList, sheets.BottomSheetSectionList]) {
        const ref = { current: null };
        const plain = Component({ ref });
        const enabled = Component({ ref, showsVerticalScrollIndicator: true });
        assert.equal(plain.props.showsVerticalScrollIndicator, false);
        assert.equal(plain.props.showsHorizontalScrollIndicator, false);
        assert.equal(enabled.props.showsVerticalScrollIndicator, true);
        assert.equal(enabled.props.showsHorizontalScrollIndicator, false);
        assert.equal(enabled.props.ref, ref);
        assert.equal(Component({ showsVerticalScrollIndicator: undefined }).props.showsVerticalScrollIndicator, false);
    }
    const tabs = new Runner(Tabs, {
        items: [{ key: 'songs', label: 'Canciones' }],
        value: 'songs',
        onValueChange() {},
        scrollable: true,
        scrollIndicators: { horizontal: true },
    });
    assert.equal(tabs.native('AnimatedScrollView').props.showsHorizontalScrollIndicator, true);
    tabs.unmount();
});
if (failures.length) {
    for (const { name, error } of failures) console.error(`FAIL: ${name}\n${error.stack}`);
    console.error(`${failures.length} of ${cases} overlay/selection cases failed.`);
    process.exitCode = 1;
} else {
    console.log(`PASS: ${cases} Mobile Design overlay/selection cases (interruption, disposal, controlled actions and keyboard focus).`);
}
