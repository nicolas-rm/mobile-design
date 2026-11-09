/**
 * node scripts/verify-mobile-design-selection.cjs
 *
 * Executes the actual Slider/RangeSlider and TimePicker TSX with controllable
 * gesture callbacks, delayed UI completions and queued UI→RN notifications.
 * These are lifecycle/selection invariants, not snapshots of the implementation.
 *
 * Limits: native views, Paper presses, React scheduling, keyboard events and
 * Reanimated interpolation/physics are explicit doubles. Opt-in delayed RN
 * writes preserve the old UI value until flushUI(), so an RN set/get pair cannot
 * accidentally be treated as an atomic UI transaction. This does not render
 * pixels, synthesize OS gestures, verify accessibility traversal, measure FPS,
 * or replace iOS/Android visual and interaction checks.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
let active;
let focused;
let localeDirection = 'ltr';
let uiVersion = 0;
const activatedGestures = [];
let windowSize = { width: 390, height: 844, fontScale: 1 };
const theme = {
    animation: { scale: 1 },
    shapes: { corner: { small: 8, extraLarge: 28 } },
    elevation: { level3: 3 },
    fonts: Object.fromEntries(
        ['bodyLarge', 'bodySmall', 'labelLarge', 'labelMedium', 'titleMedium', 'displayLarge', 'displayMedium'].map((key) => [
            key,
            { fontFamily: 'Roboto' },
        ])
    ),
    colors: Object.fromEntries(
        [
            'primary',
            'onPrimary',
            'primaryContainer',
            'onPrimaryContainer',
            'secondary',
            'secondaryContainer',
            'onSecondaryContainer',
            'onSurface',
            'onSurfaceVariant',
            'surface',
            'surfaceContainerHigh',
            'surfaceContainerHighest',
            'tertiaryContainer',
            'onTertiaryContainer',
            'outline',
            'error',
            'onError',
            'onErrorContainer',
            'inverseSurface',
            'inverseOnSurface',
            'scrim',
        ].map((key) => [key, key])
    ),
    motion: {
        duration: { short2: 100, short3: 150, medium4: 400 },
        easing: { standard: [0.2, 0, 0, 1], emphasized: [0.2, 0, 0, 1], emphasizedAccelerate: [0.3, 0, 0.8, 0.15] },
        spring: {
            fast: { spatial: { stiffness: 800, damping: 0.6 }, effects: { stiffness: 3800, damping: 1 } },
            default: { spatial: { stiffness: 380, damping: 0.8 }, effects: { stiffness: 1600, damping: 1 } },
            slow: { effects: { stiffness: 800, damping: 1 } },
        },
    },
};
const same = (left, right) =>
    Array.isArray(left) && Array.isArray(right)
        ? left.length === right.length && left.every((value, index) => Object.is(value, right[index]))
        : Object.is(left, right);
const sameDeps = (left, right) => left && right && same(left, right);
function hook(create) {
    const node = active.node;
    const index = node.cursor++;
    return node.hooks[index] ?? (node.hooks[index] = create());
}
function effect(create, deps, layout = false) {
    const node = active.node;
    const slot = hook(() => ({}));
    if (!sameDeps(slot.deps, deps)) {
        slot.deps = deps;
        node.host.effects.push({ slot, create, layout });
    }
}
let nextFocusIdentity = 0;
const React = {
    useId: () => React.useMemo(() => `selection-focus-${++nextFocusIdentity}`, []),
    createContext(value) {
        const context = { current: value };
        context.Provider = { context };
        return context;
    },
    useContext: (context) => context.current,
    memo: (component) => component,
    forwardRef: (render) => (props) => render(props, props.ref),
    Children: { toArray: (children) => [children].flat(Infinity).filter((value) => value != null && value !== false) },
    isValidElement: (element) => Boolean(element && typeof element === 'object' && 'type' in element),
    cloneElement: (element, props) => ({ ...element, props: { ...element.props, ...props } }),
    useRef: (current) => hook(() => ({ current })),
    useState(initial) {
        const node = active.node;
        const slot = hook(() => ({ value: typeof initial === 'function' ? initial() : initial }));
        return [
            slot.value,
            (next) => {
                assert.ok(!node.disposed, 'a disposed component cannot update state');
                next = typeof next === 'function' ? next(slot.value) : next;
                if (!Object.is(next, slot.value)) {
                    slot.value = next;
                    node.host.dirty = true;
                }
            },
        ];
    },
    useMemo(create, deps) {
        const slot = hook(() => ({}));
        if (!sameDeps(slot.deps, deps)) {
            slot.deps = deps;
            slot.value = create();
        }
        return slot.value;
    },
    useCallback: (callback, deps) => React.useMemo(() => callback, deps),
    useEffect: (create, deps) => effect(create, deps),
    useLayoutEffect: (create, deps) => effect(create, deps, true),
    useImperativeHandle(ref, create, deps) {
        effect(
            () => {
                if (ref) ref.current = create();
                return () => {
                    if (ref) ref.current = null;
                };
            },
            deps,
            true
        );
    },
};
function cancelAnimation(shared) {
    const animation = shared.animation;
    shared.animation = null;
    if (animation?.kind === 'delay') animation.inner.callback?.(false);
    else animation?.callback?.(false);
}
const builder = new Proxy({}, { get: () => () => builder });
const reanimated = {
    View: 'AnimatedView',
    Text: 'AnimatedText',
    ReduceMotion: { Never: 'never', System: 'system', Always: 'always' },
    createAnimatedComponent: (component) => component,
    FadeIn: builder,
    FadeOut: builder,
    LinearTransition: builder,
    cancelAnimation,
    useSharedValue(initial) {
        const host = active.node.host;
        return hook(() => {
            const shared = {
                current: initial,
                animation: null,
                get() {
                    return this.current;
                },
                set(next) {
                    const apply = () => {
                        cancelAnimation(this);
                        if (typeof next === 'function') next = next(this.current);
                        if (next?.kind) {
                            this.animation = { ...next, from: this.current, elapsed: 0 };
                            if (next.kind === 'delay') return;
                            next = next.to;
                        }
                        if (!Object.is(next, this.current)) {
                            this.current = next;
                            uiVersion++;
                        }
                    };
                    if (host.deferRNWrites) host.uiWrites.push(apply);
                    else apply();
                },
            };
            host.shared.push(shared);
            return shared;
        });
    },
    useAnimatedStyle: (compute) => ({ compute }),
    useAnimatedProps: (compute) => ({ compute }),
    useAnimatedReaction(prepare, react) {
        const node = active.node;
        const slot = hook(() => {
            const item = {};
            node.reactions.push(item);
            return item;
        });
        Object.assign(slot, { prepare, react });
    },
    Easing: { cubic: (value) => value, out: (value) => value, bezier: (...curve) => curve },
    withTiming: (to, config, callback) => ({ kind: 'timing', to, config, callback }),
    withSpring: (to, config) => ({ kind: 'spring', to, config }),
    withDelay: (delay, inner, reduceMotion) => ({ kind: 'delay', delay, inner, reduceMotion }),
    interpolateColor: (progress, _range, colors) => (progress >= 0.5 ? colors[1] : colors[0]),
};
const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
const modules = {
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
        View: 'View',
        TextInput: 'TextInput',
        Modal: 'Modal',
        Pressable: 'Pressable',
        ScrollView: 'ScrollView',
        KeyboardAvoidingView: 'KeyboardAvoidingView',
        Platform: { OS: 'ios' },
        StyleSheet: {
            create: (value) => value,
            absoluteFill: {},
            flatten: (style) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean)),
        },
        useWindowDimensions: () => windowSize,
        Keyboard: { dismiss() {}, addListener: () => ({ remove() {} }) },
        AccessibilityInfo: {
            isScreenReaderEnabled: () => ({ then: (callback) => callback(false) }),
            addEventListener: () => ({ remove() {} }),
        },
    },
    'react-native-paper': {
        Icon: 'Icon',
        Button: 'Button',
        Text: 'Text',
        Surface: 'Surface',
        Portal: 'Portal',
        TouchableRipple: 'TouchableRipple',
        Badge: 'PaperBadge',
        List: { Item: 'PaperListItem' },
        useTheme: () => theme,
        useLocale: () => ({ direction: localeDirection, isRTL: localeDirection === 'rtl' }),
    },
    'react-native-gesture-handler': {
        GestureStateManager: { activate: (tag) => activatedGestures.push(tag) },
        GestureDetector: 'GestureDetector',
        GestureHandlerRootView: 'GestureRoot',
        usePanGesture: (config) => config,
        useTapGesture: (config) => config,
        useExclusiveGestures: (...gestures) => ({ gestures, enabled: gestures.some((gesture) => gesture.enabled !== false) }),
    },
    'react-native-reanimated': reanimated,
    'react-native-worklets': {
        scheduleOnRN: (callback, ...args) => active.node.host.queued.push(() => callback(...args)),
        scheduleOnUI: (callback, ...args) => {
            const host = active.node.host;
            const run = () => {
                const previous = host.deferRNWrites;
                host.deferRNWrites = false;
                try {
                    callback(...args);
                } finally {
                    host.deferRNWrites = previous;
                }
            };
            if (host.deferRNWrites) host.uiWrites.push(run);
            else run();
        },
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) },
    'react-native-svg': { default: 'Svg', Path: 'Path', Circle: 'Circle', ClipPath: 'ClipPath', Defs: 'Defs', G: 'G', Text: 'SvgText' },
    '../core': { useMobileTheme: () => theme },
    '../color': { withAlpha: (color, alpha) => `${color}/${alpha}` },
    // Window/Portal composition is exercised by the foundation suite; this suite owns clock/field interactions.
    '../native-modal': { NativeModal: 'Modal' },
};
function load(name) {
    const file = path.join(root, 'packages/mobile-design/src/components', name.endsWith('.ts') ? name : `${name}.tsx`);
    const exports = {};
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
            require: (name) => {
                const platformBoundary = require('./mobile-design-native-boundaries.cjs')(name, modules);
                if (platformBoundary) return platformBoundary;
                assert.ok(modules[name], `explicit boundary ${name}`);
                return modules[name];
            },
            setTimeout: (callback) => {
                const host = active.node.host;
                host.timers.push(callback);
                return host.timers.length;
            },
            clearTimeout() {},
            console,
        },
        { filename: file }
    );
    return exports;
}
modules['../web-accessibility'] = load('../web-accessibility.ts');
modules['../ripple'] = load('../ripple');
const { Slider, RangeSlider } = load('slider');
modules['./press-scope'] = load('press-scope.ts');
modules['../ripple'] = load('../ripple');
modules['./focus-order'] = load('focus-order.ts');
modules['./list-focus'] = load('list-focus');
const { TimePicker } = load('time-picker');
const selectionControls = load('selection-controls');
modules['./selection-controls'] = selectionControls;
const { TextField } = load('text-field');
const { Checkbox, RadioButton } = selectionControls;
const { Switch } = load('switch');
const { SegmentedButtons } = load('segmented-buttons');
const { Chip, ListItem } = load('content');
let componentID = 0;
const componentIDs = new WeakMap();
class Host {
    constructor(component, props) {
        Object.assign(this, {
            component,
            props,
            nodes: new Map(),
            shared: [],
            effects: [],
            queued: [],
            timers: [],
            dirty: false,
            uiWrites: [],
            deferRNWrites: false,
        });
        this.flush();
    }
    renderElement(element, key = 'root') {
        if (element == null || typeof element !== 'object') return element;
        if (Array.isArray(element)) {
            // React needs sibling identities to stay distinct when a press host
            // is replaced on disable; an index-only fixture used to miss this.
            const keys = element.filter((item) => item?.key != null).map((item) => String(item.key));
            assert.equal(new Set(keys).size, keys.length, `Duplicate sibling keys at ${key}: ${keys.join(', ')}`);
            return element.map((item, index) => this.renderElement(item, `${key}.${index}`));
        }
        const { type, props, key: elementKey } = element;
        if (type?.context) {
            const previous = type.context.current;
            type.context.current = props.value;
            const children = this.renderElement(props.children, `${key}.provider`);
            type.context.current = previous;
            return { ...element, type: 'ContextProvider', props: { ...props, children } };
        }
        if (typeof type === 'function') {
            if (!componentIDs.has(type)) componentIDs.set(type, ++componentID);
            const id = `${key}:${componentIDs.get(type)}:${elementKey ?? ''}`;
            let node = this.nodes.get(id);
            if (!node) {
                node = { host: this, hooks: [], reactions: [] };
                this.nodes.set(id, node);
            }
            Object.assign(node, { cursor: 0, seen: true });
            const previous = active;
            active = { node };
            const output = type(props);
            active = previous;
            return this.renderElement(output, id);
        }
        if (props.ref && typeof props.ref === 'object')
            props.ref.current = {
                focus: () => {
                    focused = props.testID;
                },
                blur() {},
            };
        return { ...element, props: { ...props, children: this.renderElement(props.children, `${key}.child`) } };
    }
    context() {
        active = { node: { host: this } };
    }
    flush() {
        let renders = 0;
        do {
            assert.ok(++renders < 25, 'render/effect loop terminates');
            this.dirty = false;
            for (const node of this.nodes.values()) node.seen = false;
            this.tree = this.renderElement(jsx(this.component, this.props));
            for (const { slot, create } of this.effects.splice(0).sort((a, b) => Number(b.layout) - Number(a.layout))) {
                this.context();
                slot.cleanup?.();
                slot.cleanup = create();
            }
            for (const [id, node] of this.nodes)
                if (!node.seen) {
                    node.disposed = true;
                    node.hooks.forEach((slot) => slot.cleanup?.());
                    this.nodes.delete(id);
                }
        } while (this.dirty);
        return this;
    }
    setProps(next) {
        Object.assign(this.props, next);
        return this.flush();
    }
    all(element) {
        if (arguments.length === 0) element = this.tree;
        if (!element || typeof element !== 'object') return [];
        if (Array.isArray(element)) return element.flatMap((item) => this.all(item));
        return [element, ...(element.props.children === undefined ? [] : this.all(element.props.children))];
    }
    find(id) {
        const result = this.all().find((element) => element.props.testID === id);
        assert.ok(result, id);
        return result;
    }
    press(id) {
        this.context();
        const props = this.find(id).props;
        assert.ok(!props.disabled, `${id} enabled`);
        props.onPress();
        return this.flush();
    }
    change(id, text) {
        this.context();
        this.find(id).props.onChangeText(text);
        return this.flush();
    }
    pan(handler, event) {
        this.context();
        const composition = this.all().find((element) => element.type === 'GestureDetector').props.gesture;
        const gesture = composition.gestures?.[0] ?? composition;
        assert.notEqual(gesture.enabled, false, 'disabled gesture is not dispatched');
        gesture[handler](event);
        return this.reactions();
    }
    reactions() {
        let rounds = 0,
            previous;
        do {
            assert.ok(++rounds < 20, 'UI reactions settle');
            previous = uiVersion;
            this.context();
            for (const node of this.nodes.values())
                for (const reaction of node.reactions) {
                    const next = reaction.prepare();
                    if (!same(next, reaction.previous)) {
                        reaction.react(next, reaction.previous);
                        reaction.previous = next;
                    }
                }
        } while (uiVersion !== previous);
        return this;
    }
    deliver() {
        this.context();
        for (const job of this.queued.splice(0)) job();
        return this.unmounted ? this : this.flush().reactions();
    }
    flushUI() {
        this.context();
        for (const job of this.uiWrites.splice(0)) job();
        return this.reactions();
    }
    advance(ms) {
        this.context();
        for (const shared of this.shared) {
            const animation = shared.animation;
            if (!animation) continue;
            animation.elapsed += ms;
            const duration = animation.kind === 'delay' ? animation.delay : animation.kind === 'spring' ? 0 : animation.config.duration;
            if (animation.elapsed >= duration) {
                shared.animation = null;
                const completed = animation.kind === 'delay' ? animation.inner : animation;
                shared.current = completed.to;
                completed.callback?.(true);
            }
        }
        return this.reactions();
    }
    unmount() {
        this.context();
        this.unmounted = true;
        for (const node of this.nodes.values()) {
            node.disposed = true;
            node.hooks.forEach((slot) => slot.cleanup?.());
        }
    }
}
const event = (x, y = 24, translationX = 0, translationY = 0) => ({ x, y, translationX, translationY, canceled: false });
function layout(host, width = 248, height = 48) {
    host.context();
    host.all()
        .find((element) => element.props.onLayout)
        .props.onLayout({ nativeEvent: { layout: { width, height } } });
    return host.flush().reactions();
}
let cases = 0;
function test(name, run) {
    run();
    cases++;
    console.log(`PASS ${name}`);
}

test('discrete tap snaps and emits one change plus completion', () => {
    const values = [],
        completed = [];
    const host = layout(
        new Host(Slider, {
            value: 20,
            minimumValue: 0,
            maximumValue: 100,
            step: 10,
            onValueChange: (value) => values.push(value),
            onSlidingComplete: (value) => completed.push(value),
        })
    );
    host.pan('onActivate', event(149)).pan('onFinalize', event(149)).deliver();
    assert.deepEqual(values, [60]);
    assert.deepEqual(completed, [60]);
});
test('range drag respects separation and discrete detents', () => {
    const values = [];
    const host = layout(
        new Host(RangeSlider, {
            value: [40, 60],
            minimumValue: 0,
            maximumValue: 100,
            step: 10,
            minimumRange: 10,
            onValueChange: (value) => values.push(Array.from(value)),
        })
    );
    host.pan('onActivate', event(104))
        .pan('onUpdate', event(204, 24, 100))
        .pan('onFinalize', event(204))
        .deliver();
    assert.deepEqual(values.at(-1), [50, 60]);
});
for (const { Component, initialValue, interruptedValue, nextValue } of [
    { Component: Slider, initialValue: 20, interruptedValue: 40, nextValue: 50 },
    { Component: RangeSlider, initialValue: [20, 80], interruptedValue: [40, 80], nextValue: [50, 80] },
]) {
    test(`${Component.name} cancels a changed drag once and completes the next drag`, () => {
        const calls = [];
        const record = (kind, value) => calls.push([kind, Array.isArray(value) ? Array.from(value) : value]);
        function Controlled() {
            const [value, setValue] = React.useState(initialValue);
            return jsx(Component, {
                value,
                maximumValue: 100,
                step: 10,
                onSlidingStart: (next) => record('start', next),
                onValueChange: (next) => {
                    record('change', next);
                    setValue(next);
                },
                onSlidingCancel: (next) => record('cancel', next),
                onSlidingComplete: (next) => record('complete', next),
            });
        }
        const host = layout(new Host(Controlled, {}));
        host.pan('onBegin', event(64)).pan('onActivate', event(64)).pan('onUpdate', event(104, 24, 40)).deliver();
        assert.deepEqual(calls, [
            ['start', initialValue],
            ['change', interruptedValue],
        ]);

        // Cancel at a different coordinate to verify it reports the last drag value.
        const canceled = { ...event(144), canceled: true };
        host.pan('onFinalize', canceled).deliver();
        host.pan('onFinalize', canceled).deliver();
        assert.deepEqual(calls.slice(2), [['cancel', interruptedValue]]);

        host.pan('onBegin', event(104))
            .pan('onActivate', event(104))
            .pan('onUpdate', event(124, 24, 20))
            .pan('onFinalize', event(124))
            .deliver();
        assert.deepEqual(calls.slice(3), [
            ['start', interruptedValue],
            ['change', nextValue],
            ['complete', nextValue],
        ]);
    });
}
test('coincident range thumbs choose the first drag direction', () => {
    const values = [];
    const host = layout(
        new Host(RangeSlider, {
            value: [50, 50],
            minimumValue: 0,
            maximumValue: 100,
            onValueChange: (value) => values.push(Array.from(value)),
        })
    );
    host.pan('onActivate', event(124))
        .pan('onUpdate', event(164, 24, 40))
        .pan('onFinalize', event(164))
        .deliver();
    assert.deepEqual(values.at(-1), [50, 70]);
});
test('vertical values increase upward and hardware boundaries remain usable', () => {
    const values = [];
    const host = layout(
        new Host(Slider, {
            value: 50,
            orientation: 'vertical',
            length: 248,
            minimumValue: 0,
            maximumValue: 100,
            onValueChange: (value) => values.push(value),
        }),
        48,
        248
    );
    host.pan('onActivate', event(24, 204))
        .pan('onUpdate', event(24, 44, 0, -160))
        .pan('onFinalize', event(24, 44))
        .deliver();
    assert.equal(values.at(-1), 90);
    host.find('slider-thumb').props.onKeyDown({ nativeEvent: { key: 'End' } });
    assert.equal(values.at(-1), 100);
});
test('disabled slider disables native recognition and accessibility adjustment', () => {
    const host = layout(
        new Host(Slider, {
            value: 50,
            disabled: true,
            onValueChange() {
                throw Error('disabled change');
            },
        })
    );
    assert.equal(host.all().find((element) => element.type === 'GestureDetector').props.gesture.enabled, false);
    host.find('slider-thumb').props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
});
test('disposed sliders discard queued gesture notifications', () => {
    let changes = 0;
    const host = layout(new Host(Slider, { value: 0, onValueChange: () => changes++ }));
    host.pan('onActivate', event(149)).pan('onFinalize', event(149));
    host.unmount();
    host.deliver();
    assert.equal(changes, 0);
});

function timeHost(extra = {}) {
    const confirmations = [],
        dismissed = [];
    let host;
    host = new Host(TimePicker, {
        visible: true,
        value: { hours: 15, minutes: 45 },
        onConfirm: (value) => {
            confirmations.push({ ...value });
            host.setProps({ visible: false, value });
        },
        onDismiss: () => {
            dismissed.push(true);
            host.setProps({ visible: false });
        },
        ...extra,
    });
    return { host, confirmations, dismissed };
}
test('time punctuation and AM/PM share the numeric scale inside fixed selector geometry', () => {
    const flatten = (style) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
    const { host } = timeHost();
    const digits = host.all().filter((element) => element.props.editable === false && element.props.animatedProps);
    assert.equal(digits.length, 2);
    const scale = digits[0].props.maxFontSizeMultiplier;
    const separator = host.find('time-picker-separator');
    assert.equal(separator.props.maxFontSizeMultiplier, scale);
    assert.equal(separator.props.numberOfLines, 1);
    for (const property of ['fontSize', 'lineHeight']) {
        assert.equal(flatten(separator.props.style)[property], flatten(digits[0].props.style)[property]);
    }
    const periods = host.all().filter((element) => element.type === 'Text' && ['AM', 'PM'].includes(element.props.children));
    assert.equal(periods.length, 2);
    periods.forEach((period) => {
        assert.equal(period.props.maxFontSizeMultiplier, scale);
        assert.equal(period.props.numberOfLines, 1);
    });
    const { host: inputHost } = timeHost({ initialDisplayMode: 'input' });
    for (const property of ['fontSize', 'lineHeight']) {
        assert.equal(
            flatten(inputHost.find('time-picker-separator').props.style)[property],
            flatten(inputHost.find('time-picker-hour-input').props.style)[property]
        );
    }
});
test('manual invalid input cannot confirm or leave the keyboard; Cancel discards it', () => {
    const { host, confirmations, dismissed } = timeHost({ initialDisplayMode: 'input' });
    host.change('time-picker-hour-input', '13');
    assert.equal(host.find('time-picker-confirm').props.disabled, true);
    host.press('time-picker-toggle-mode');
    assert.ok(host.find('time-picker-hour-input'));
    host.press('time-picker-cancel').advance(220).deliver();
    assert.equal(confirmations.length, 0);
    assert.equal(dismissed.length, 1);
    host.setProps({ visible: true });
    assert.equal(host.find('time-picker-hour-input').props.value, '03');
});
test('manual Next focuses minutes and PM confirmation emits exactly once', () => {
    const { host, confirmations } = timeHost({ initialDisplayMode: 'input' });
    host.change('time-picker-hour-input', '11').change('time-picker-minute-input', '07');
    host.find('time-picker-hour-input').props.onSubmitEditing();
    assert.equal(focused, 'time-picker-minute-input');
    const confirm = host.find('time-picker-confirm').props.onPress;
    confirm();
    confirm();
    assert.deepEqual(confirmations, [{ hours: 23, minutes: 7 }]);
});
test('24h inner ring selects noon and changes to minutes only after the delay', () => {
    const { host, confirmations } = timeHost({ is24Hour: true });
    host.pan('onActivate', event(128, 59)).pan('onFinalize', event(128, 59)).deliver();
    assert.ok(host.find('time-picker-dial-hours-12'));
    host.advance(99).deliver();
    assert.ok(host.find('time-picker-dial-hours-12'));
    host.advance(1).deliver();
    assert.ok(host.find('time-picker-dial-minutes-5'));
    host.press('time-picker-confirm');
    assert.deepEqual(confirmations, [{ hours: 12, minutes: 45 }]);
});
test('minute taps choose five-minute marks while dragging permits an exact minute', () => {
    const tap = timeHost({ initialSelection: 'minutes' });
    const x = 128 + Math.sin((42 * Math.PI) / 180) * 101;
    const y = 128 - Math.cos((42 * Math.PI) / 180) * 101;
    tap.host.pan('onActivate', event(x, y)).pan('onFinalize', event(x, y)).deliver().press('time-picker-confirm');
    assert.equal(tap.confirmations[0].minutes, 5);
    const drag = timeHost({ initialSelection: 'minutes' });
    drag.host
        .pan('onActivate', event(x, y))
        .pan('onUpdate', event(x, y, 12, 0))
        .pan('onFinalize', event(x, y, 12, 0))
        .deliver()
        .press('time-picker-confirm');
    assert.equal(drag.confirmations[0].minutes, 7);
});
test('an RN hour numeral press publishes the chosen PM hour before queued UI writes execute', () => {
    const { host, confirmations } = timeHost({ autoSwitchToMinutes: false });
    host.deferRNWrites = true;
    host.press('time-picker-dial-hours-9');
    assert.ok(host.uiWrites.length > 0, 'the native UI has not applied the RN writes yet');
    assert.equal(host.find('time-picker-select-hours').props.accessibilityLabel, 'Hour, 09');
    assert.equal(host.find('time-picker-dial-hours-9').props.accessibilityState.selected, true);
    assert.equal(host.find('time-picker-pm').props.accessibilityState.checked, true);
    host.press('time-picker-confirm');
    assert.deepEqual(confirmations, [{ hours: 21, minutes: 45 }]);
});
test('an RN minute numeral press publishes the new minute before queued UI writes execute', () => {
    const { host, confirmations } = timeHost({ initialSelection: 'minutes', is24Hour: true });
    host.deferRNWrites = true;
    host.press('time-picker-dial-minutes-5');
    assert.ok(host.uiWrites.length > 0, 'the test must retain the old UI value during RN dispatch');
    assert.equal(host.find('time-picker-select-minutes').props.accessibilityLabel, 'Minute, 05');
    assert.equal(host.find('time-picker-dial-minutes-5').props.accessibilityState.selected, true);
    host.press('time-picker-confirm');
    assert.deepEqual(confirmations, [{ hours: 15, minutes: 5 }]);
});
test('rapid reopening resets both draft and dial and rejects an old automatic switch', () => {
    const { host } = timeHost();
    host.pan('onActivate', event(229, 128)).pan('onFinalize', event(229, 128)).advance(100);
    const oldSwitch = host.queued.splice(0);
    host.press('time-picker-cancel').setProps({ visible: true });
    oldSwitch.forEach((callback) => callback());
    host.flush();
    assert.ok(host.find('time-picker-dial-hours-3'));
    assert.equal(host.find('time-picker-select-hours').props.accessibilityLabel, 'Hour, 03');
});
test('disposed time pickers reject an already queued automatic minute switch', () => {
    const { host } = timeHost();
    host.pan('onActivate', event(229, 128)).pan('onFinalize', event(229, 128)).advance(100);
    host.unmount();
    host.deliver();
});
test('Paper theme is the single motion authority for slider and clock transitions', () => {
    const slider = layout(new Host(Slider, { value: 0, onValueChange() {} }));
    slider.pan('onActivate', event(149));
    assert.ok(slider.shared.some((shared) => shared.animation?.config?.duration === 400));
    for (const shared of slider.shared) if (shared.animation) assert.equal(shared.animation.config.reduceMotion, 'never');
    const clock = timeHost().host;
    clock.pan('onActivate', event(229, 128)).pan('onFinalize', event(229, 128));
    for (const shared of clock.shared)
        if (shared.animation) {
            if (shared.animation.kind === 'delay') {
                assert.equal(shared.animation.reduceMotion, 'never');
                assert.equal(shared.animation.inner.config.reduceMotion, 'never');
            } else assert.equal(shared.animation.config.reduceMotion, 'never');
        }
    theme.animation.scale = 0;
    const reduced = layout(new Host(Slider, { value: 0, onValueChange() {} }));
    reduced.pan('onActivate', event(149));
    for (const shared of reduced.shared) if (shared.animation) assert.equal(shared.animation.config.duration, 0);
    theme.animation.scale = 1;
});
test('empty labeled fields keep the native input visible and accessible before focus', () => {
    const host = new Host(TextField, { value: '', onChangeText() {}, label: 'Name', testID: 'empty-field' });
    const input = host.find('empty-field-input').props;
    const flatten = (style) =>
        Object.assign(
            {},
            ...[style]
                .flat(Infinity)
                .filter(Boolean)
                .map((item) => (item.compute ? item.compute() : item))
        );
    assert.equal(flatten(input.style).opacity, 1, 'iOS must not omit an unfocused native field from accessibility');
    assert.equal(input.accessibilityLabel, 'Name');
    assert.equal(input.editable, true);
    host.setProps({ disabled: true });
    assert.equal(flatten(host.find('empty-field-input').props.style).opacity, 0.38, 'disabled content opacity applies once');
});
test('a composite field can own focus appearance without focusing or editing the input', () => {
    const previousFocus=focused;
    const host=new Host(TextField,{value:'',onChangeText(){},label:'Choice',readOnly:true,focused:true,testID:'composite-field'});
    const flatten=style=>Object.assign({},...[style].flat(Infinity).filter(Boolean).map(item=>item.compute?item.compute():item));
    assert.equal(focused,previousFocus,'appearance must not request native input focus');
    assert.equal(host.find('composite-field-input').props.editable,false);
    const labelColor=()=>{const color=flatten(host.find('composite-field-label').props.style).color;return color?.kind==='spring'?color.to:color;};
    assert.equal(labelColor(),theme.colors.primary);
    host.setProps({focused:false});
    assert.equal(labelColor(),theme.colors.onSurfaceVariant);
    host.setProps({focused:true,disabled:true});
    assert.equal(labelColor(),theme.colors.onSurface);
});
test('field edit and submit events cannot escape a blocked or disposed input', () => {
    const changes = [], submits = [];
    const host = new Host(TextField, {value: '', label: 'Name', onChangeText: value => changes.push(value), onSubmitEditing: event => submits.push(event)});
    const queued = host.find('text-field-input').props;
    host.setProps({readOnly: true}).setProps({readOnly: false});
    queued.onChangeText('stale'); queued.onSubmitEditing({});
    assert.deepEqual(changes, []); assert.deepEqual(submits, []);
    host.change('text-field-input', 'current');
    assert.deepEqual(changes, ['current']);
    const late = host.find('text-field-input').props;
    host.unmount();
    late.onChangeText('disposed'); late.onFocus({}); late.onBlur({});
    late.onContentSizeChange({nativeEvent: {contentSize: {height: 500}}});
    assert.deepEqual(changes, ['current']);
});
test('field affix identities remain associated with their own input and counter', () => {
    modules['react-native'].Platform.OS = 'web';
    try {
        const host = new Host(TextField, {value: '20', label: 'Importe', onChangeText() {}, prefix: '$', suffix: 'MXN', prefixAccessibilityLabel: 'Pesos', counter: 10, supportingText: 'Importe'});
        const input = host.find('text-field-input').props;
        const ids = input['aria-describedby'].split(' ');
        for (const id of ['prefix', 'suffix', 'supporting', 'counter']) assert.ok(ids.includes(host.find('text-field-' + id).props.nativeID));
        assert.equal(host.find('text-field-prefix').props.accessibilityLabel, 'Pesos');
        assert.equal(new Set(ids).size, 4);
        host.setProps({value: ''});
        assert.equal(host.find('text-field-input').props['aria-describedby'].split(' ').length, 2);
    } finally { modules['react-native'].Platform.OS = 'ios'; }
});
test('adjacent labels keep affixes visible even before editing an empty field', () => {
    const host = new Host(TextField, {value: '', onChangeText() {}, accessibilityLabel: 'Price', prefix: '$', suffix: 'MXN'});
    assert.equal(host.find('text-field-prefix').props.children, '$');
    assert.equal(host.find('text-field-suffix').props.children, 'MXN');
    host.setProps({label: 'Price'});
    assert.equal(host.all().some(node => node.props.testID === 'text-field-prefix'), false);
    host.find('text-field-input').props.onFocus({});host.flush();
    assert.equal(host.find('text-field-prefix').props.children, '$');
});
test('web return semantics preserve focus for submit and never submit composition or Shift+Enter', () => {
    modules['react-native'].Platform.OS = 'web';
    try {
        const submits = [];
        const host = new Host(TextField, {value: 'Draft', onChangeText() {}, multiline: true, submitBehavior: 'submit', onSubmitEditing: event => submits.push(event.nativeEvent.text)});
        const key = extra => {
            let prevented = false;
            const event = {nativeEvent: {key: 'Enter', ...extra}, shiftKey: extra?.shiftKey, preventDefault() { prevented = true; }, isDefaultPrevented() { return prevented; }};
            host.find('text-field-input').props.onKeyPress(event);
            return prevented;
        };
        assert.equal(key({isComposing: true}), false);
        assert.equal(key({shiftKey: true}), false);
        assert.equal(key({keyCode: 229}), false);
        assert.deepEqual(submits, []);
        assert.equal(key({}), true); assert.deepEqual(submits, ['Draft']);
        host.setProps({submitBehavior: 'newline'});
        assert.equal(key({}), false); assert.equal(submits.length, 1);
        host.setProps({readOnly: true, submitBehavior: 'submit'});
        assert.equal(key({}), false); assert.equal(submits.length, 1);
    } finally { modules['react-native'].Platform.OS = 'ios'; }
});
test('checkbox rows expose one mixed control and dispatch one controlled action', () => {
    let pressed = 0;
    const host = new Host(Checkbox.Item, { label: 'All', status: 'indeterminate', onPress: () => pressed++, testID: 'mixed-row' });
    const controls = host.all().filter((element) => element.props.accessibilityRole === 'checkbox');
    assert.equal(controls.length, 1, 'the decorative inner glyph must not duplicate the accessible row');
    assert.equal(controls[0].props.accessibilityState.checked, 'mixed');
    host.press('mixed-row');
    assert.equal(pressed, 1);
    assert.equal(
        host.find('mixed-row').props.accessibilityState.checked,
        'mixed',
        'controlled status changes only when the owner updates it'
    );
    const queuedPress = host.find('mixed-row').props.onPress;
    host.setProps({ disabled: true });
    queuedPress({});
    assert.equal(pressed, 1, 'a queued row press must be discarded when the checkbox is disabled');
});
test('radio groups preserve exclusivity and prioritize the group action over item callbacks', () => {
    const changes = [];
    const host = new Host(RadioButton.Group, {
        value: 'a',
        onValueChange: (value) => changes.push(value),
        children: [
            jsx(RadioButton.Item, { value: 'a', label: 'A', testID: 'radio-a' }),
            jsx(RadioButton.Item, {
                value: 'b',
                label: 'B',
                onPress: () => {
                    throw Error('duplicate item callback');
                },
                testID: 'radio-b',
            }),
            jsx(RadioButton.Item, { value: 'c', label: 'C', disabled: true, testID: 'radio-c' }),
        ],
    });
    assert.equal(host.find('radio-a').props.accessibilityState.checked, true);
    assert.equal(host.find('radio-b').props.accessibilityState.checked, false);
    host.press('radio-b').setProps({ value: 'b' });
    assert.deepEqual(changes, ['b']);
    assert.equal(host.find('radio-a').props.accessibilityState.checked, false);
    assert.equal(host.find('radio-b').props.accessibilityState.checked, true);
    host.find('radio-c').props.onPress();
    assert.deepEqual(changes, ['b']);
});
test('radio items revoke queued presses when disabled, replaced or unmounted', () => {
    let changes = 0;
    const host = new Host(RadioButton.Item, {
        value: 'a',
        label: 'A',
        status: 'unchecked',
        testID: 'radio-queued',
        onPress: () => changes++,
    });
    const pending = host.find('radio-queued').props.onPress;
    host.setProps({ disabled: true });
    pending({});
    assert.equal(changes, 0);
    host.setProps({ disabled: false });
    host.press('radio-queued');
    assert.equal(changes, 1);
    const replaced = host.find('radio-queued').props.onPress;
    host.setProps({ value: 'b' });
    replaced({});
    assert.equal(changes, 1);
    const removed = host.find('radio-queued').props.onPress;
    host.unmount();
    removed({});
    assert.equal(changes, 1);
});
test('already selected radios retain their value even through an earlier press callback', () => {
    for (const component of [RadioButton, RadioButton.Item]) {
        let changes = 0;
        const host = new Host(component, {
            value: 'a',
            label: 'A',
            status: 'unchecked',
            testID: 'radio-current',
            onPress: () => changes++,
        });
        const previous = host.find('radio-current').props.onPress;
        host.setProps({ status: 'checked' });
        previous({});
        assert.equal(changes, 0);
        host.unmount();
    }
});
test('radio labels and supporting descriptions keep distinct accessible meanings', () => {
    const host = new Host(RadioButton.Item, {
        value: 'a',
        label: 'Home',
        description: '123 Main Street',
        status: 'checked',
        testID: 'radio-described',
    });
    const row = host.find('radio-described');
    assert.equal(row.props.accessibilityLabel, 'Home');
    assert.equal(row.props.accessibilityHint, '123 Main Street');
    assert.equal(host.find('radio-described-control').props.accessible, false);
    host.unmount();
});
test('switch stays controlled, commits on press and rejects disabled actions', () => {
    const changes = [];
    const host = new Host(Switch, {
        value: false,
        checkedIcon: 'check',
        uncheckedIcon: 'close',
        onValueChange: (value) => changes.push(value),
    });
    host.press('mobile-switch');
    assert.deepEqual(changes, [true]);
    assert.equal(host.find('mobile-switch').props.accessibilityState.checked, false);
    host.setProps({ value: true, disabled: true });
    host.find('mobile-switch').props.onPress();
    assert.deepEqual(changes, [true]);
});
function switchStyle(host, id) {
    return Object.assign({}, ...host.find(id).props.style.flat(Infinity).filter(Boolean).map(style => style.compute ? style.compute() : style));
}
test('switch paint uses FastEffects while its handle uses FastSpatial', () => {
    const host = new Host(Switch, {value:false,onValueChange() {}});
    host.setProps({value:true});
    const paint=switchStyle(host,'mobile-switch-track-paint');
    assert.equal(paint.backgroundColor.kind,'spring');
    assert.equal(paint.backgroundColor.config.stiffness,3800);
    assert.equal(host.shared[0].animation.config.stiffness,800);
    assert.equal(switchStyle(host,'mobile-switch-handle').width,24);
    host.unmount();
});
test('switch pressure grows the handle immediately and releases to its accepted state', () => {
    const host = new Host(Switch, {value:false,onValueChange() {}});
    host.context();host.find('mobile-switch').props.onPressIn({nativeEvent:{}});host.flush();
    assert.equal(switchStyle(host,'mobile-switch-handle').width,28);
    host.find('mobile-switch').props.onPressOut();host.flush();
    assert.equal(switchStyle(host,'mobile-switch-handle').width,16);
    host.unmount();
});
test('switch horizontal drag requests one value while a rejected controlled value settles back', () => {
    const changes=[];const host=new Host(Switch,{value:false,onValueChange:value=>changes.push(value)});
    host.pan('onBegin',{}).pan('onActivate',{translationX:10}).deliver();
    host.pan('onUpdate',{translationX:16});
    assert.ok(switchStyle(host,'mobile-switch-handle').left>2);
    host.pan('onFinalize',{canceled:false}).deliver();
    assert.deepEqual(changes,[true]);
    assert.equal(switchStyle(host,'mobile-switch-handle').width,16);
    host.press('mobile-switch');
    assert.deepEqual(changes,[true],'a click following the pan must not toggle a second time');
    host.unmount();
});
test('switch cancellation and a newly disabled scope revoke pending drag commits', () => {
    const changes=[];const host=new Host(Switch,{value:false,onValueChange:value=>changes.push(value)});
    host.pan('onBegin',{}).pan('onActivate',{translationX:16}).deliver();
    host.pan('onFinalize',{canceled:true}).deliver();
    assert.deepEqual(changes,[]);
    host.pan('onBegin',{}).pan('onActivate',{translationX:18}).deliver();
    host.pan('onFinalize',{canceled:false});
    host.setProps({disabled:true}).setProps({disabled:false}).deliver();
    assert.deepEqual(changes,[]);
    host.unmount();
});
test('switch RTL drag follows the logical direction and unmount revokes queued callbacks', () => {
    localeDirection='rtl';
    try {
        const changes=[];const host=new Host(Switch,{value:false,onValueChange:value=>changes.push(value)});
        host.pan('onBegin',{}).pan('onActivate',{translationX:-18}).deliver();
        host.pan('onFinalize',{canceled:false}).deliver();
        assert.deepEqual(changes,[true]);
        host.pan('onBegin',{}).pan('onActivate',{translationX:-18});
        host.pan('onFinalize',{canceled:false});host.unmount();host.deliver();
        assert.deepEqual(changes,[true]);
    } finally {localeDirection='ltr';}
});
test('a switch without its own callback is decorative and creates no duplicate focus target', () => {
    const host=new Host(Switch,{value:true});
    const props=host.find('mobile-switch').props;
    assert.equal(props.accessible,false);assert.equal(props.focusable,false);assert.equal(props.accessibilityElementsHidden,true);
    assert.equal(props.disabled,true);assert.equal(props.accessibilityRole,undefined);
    host.unmount();
});
test('old switch presses cannot overwrite a value accepted after they were captured', () => {
    const changes=[];const host=new Host(Switch,{value:false,onValueChange:value=>changes.push(value)});
    const old=host.find('mobile-switch').props.onPress;
    host.setProps({value:true});old();
    assert.deepEqual(changes,[]);host.unmount();
});
test('a coalesced drag start and release still settle a rejected controlled value', () => {
    const host=new Host(Switch,{value:false,onValueChange() {}});
    host.pan('onBegin',{}).pan('onActivate',{translationX:18});
    host.pan('onFinalize',{canceled:false}).deliver();
    assert.equal(switchStyle(host,'mobile-switch-handle').width,16);
    host.unmount();
});
test('vertical pointer movement cancels a switch tap and a fresh touch can activate it', () => {
    const changes=[];const host=new Host(Switch,{value:false,onValueChange:value=>changes.push(value)});
    host.pan('onTouchesDown',{numberOfTouches:1,allTouches:[{absoluteX:100,absoluteY:100}]});
    host.pan('onTouchesMove',{allTouches:[{absoluteX:100,absoluteY:120}]});
    host.find('mobile-switch').props.onPress({nativeEvent:{pageX:100,pageY:120}});
    assert.deepEqual(changes,[]);
    host.pan('onTouchesDown',{numberOfTouches:1,allTouches:[{absoluteX:100,absoluteY:100}]});
    host.find('mobile-switch').props.onPress({nativeEvent:{pageX:100,pageY:100}});
    assert.deepEqual(changes,[true]);host.unmount();
});
test('virtual activation remains reachable after a consumed pointer gesture', () => {
    const changes=[];const host=new Host(Switch,{value:false,onValueChange:value=>changes.push(value)});
    host.pan('onBegin',{}).pan('onActivate',{translationX:18}).pan('onFinalize',{canceled:true}).deliver();
    host.find('mobile-switch').props.onPress({nativeEvent:{}});
    assert.deepEqual(changes,[true]);host.unmount();
});
test('switch blur and hover exit remain valid across a controlled value update', () => {
    const host=new Host(Switch,{value:false,onValueChange() {}});
    host.find('mobile-switch').props.onFocus({currentTarget:{matches:()=>true}});
    host.find('mobile-switch').props.onHoverIn();host.flush();
    const previous=host.find('mobile-switch').props;
    host.setProps({value:true});previous.onBlur();previous.onHoverOut();host.flush();
    assert.equal(host.all().some(node=>node.props.testID==='mobile-switch-focus-ring'),false);
    assert.equal(host.all().some(node=>node.props.testID==='mobile-switch-state-layer'),false);
    host.unmount();
});
test('a pointer release cannot use the latest callback to overwrite a value changed during the press', () => {
    const changes=[];const host=new Host(Switch,{value:false,onValueChange:value=>changes.push(value)});
    host.find('mobile-switch').props.onPressIn({nativeEvent:{pageX:10,pageY:10}});host.flush();
    host.setProps({value:true});
    host.find('mobile-switch').props.onPress({nativeEvent:{pageX:10,pageY:10}});
    assert.deepEqual(changes,[]);
    host.pan('onTouchesDown',{numberOfTouches:1,allTouches:[{absoluteX:10,absoluteY:10}]});
    host.find('mobile-switch').props.onPress({nativeEvent:{pageX:10,pageY:10}});
    assert.deepEqual(changes,[false]);host.unmount();
});
test('single segments cannot deselect the current option and disabled options cannot emit', () => {
    const changes = [];
    const host = new Host(SegmentedButtons, {
        value: 'a',
        onValueChange: (value) => changes.push(value),
        buttons: [
            { value: 'a', label: 'A', testID: 'seg-a' },
            { value: 'b', label: 'B', testID: 'seg-b' },
            { value: 'c', label: 'C', disabled: true, testID: 'seg-c' },
        ],
    });
    host.press('seg-a').press('seg-b');
    assert.deepEqual(changes, ['b']);
    host.find('seg-c').props.onPress();
    assert.deepEqual(changes, ['b']);
    assert.equal(host.find('seg-b').props.accessibilityRole, 'radio');
});
test('multi segments support selecting all and clearing the last selected option', () => {
    const changes = [];
    const host = new Host(SegmentedButtons, {
        multiSelect: true,
        value: ['a'],
        onValueChange: (value) => changes.push(Array.from(value)),
        buttons: [
            { value: 'a', label: 'A', testID: 'multi-a' },
            { value: 'b', label: 'B', testID: 'multi-b' },
        ],
    });
    host.press('multi-b')
        .setProps({ value: ['a', 'b'] })
        .press('multi-a')
        .setProps({ value: ['b'] })
        .press('multi-b');
    assert.deepEqual(changes, [['a', 'b'], ['b'], []]);
    assert.equal(host.find('multi-a').props.accessibilityRole, 'checkbox');
});
test('multiline fields expand with content while a fixed text area remains fixed', () => {
    const flatten = (style) =>
        Object.assign(
            {},
            ...[style]
                .flat(Infinity)
                .filter(Boolean)
                .map((item) => (item.compute ? item.compute() : item))
        );
    const host = new Host(TextField, { value: 'Long text', label: 'Message', onChangeText() {}, multiline: true, error: true, counter: 0 });
    host.find('text-field-input').props.onContentSizeChange({ nativeEvent: { contentSize: { height: 96.2 } } });
    host.flush();
    assert.equal(flatten(host.find('text-field-input').props.style).minHeight, 97);
    assert.equal(host.find('text-field-input').props.selectionColor, theme.colors.error, 'iOS caret and selection follow the error role');
    assert.ok(host.find('text-field-counter'));
    host.setProps({ autoGrow: false, inputStyle: { height: 72 } });
    assert.equal(flatten(host.find('text-field-input').props.style).height, 72);
});
test('a constrained time picker falls back to input rather than scrolling the dial', () => {
    windowSize = { width: 390, height: 360, fontScale: 1 };
    try {
        const { host, confirmations } = timeHost();
        assert.ok(host.find('time-picker-hour-input'));
        assert.equal(
            host.all().some((element) => element.props.testID === 'time-picker-dial'),
            false
        );
        assert.equal(host.find('time-picker-toggle-mode').props.disabled, true);
        host.press('time-picker-confirm');
        assert.deepEqual(confirmations, [{ hours: 15, minutes: 45 }]);
    } finally {
        windowSize = { width: 390, height: 844, fontScale: 1 };
    }
});
test('wide constrained time pickers retain a dial and allow returning from input', () => {
    windowSize = { width: 844, height: 390, fontScale: 1 };
    try {
        const { host } = timeHost();
        assert.ok(host.find('time-picker-dial'));
        host.press('time-picker-toggle-mode');
        assert.equal(host.find('time-picker-toggle-mode').props.disabled, false);
        host.press('time-picker-toggle-mode');
        assert.ok(host.find('time-picker-dial'));
    } finally {
        windowSize = { width: 390, height: 844, fontScale: 1 };
    }
});
test('Space plus arrows changes a continuous slider by a larger interval and releases cleanly', () => {
    const values = [];
    let host;
    host = layout(
        new Host(Slider, {
            value: 0,
            minimumValue: 0,
            maximumValue: 100,
            onValueChange: (value) => {
                values.push(value);
                host.props.value = value;
            },
        })
    );
    const key = (value) => ({ nativeEvent: { key: value }, preventDefault() {} });
    host.find('slider-thumb').props.onKeyDown(key('ArrowRight'));
    host.flush();
    host.find('slider-thumb').props.onKeyDown(key(' '));
    host.find('slider-thumb').props.onKeyDown(key('ArrowRight'));
    host.flush();
    host.find('slider-thumb').props.onKeyUp(key(' '));
    host.find('slider-thumb').props.onKeyDown(key('ArrowRight'));
    host.flush();
    assert.deepEqual(values, [1, 11, 12]);
});
test('a queued automatic minute switch cannot override a later explicit hour selection', () => {
    const { host } = timeHost();
    host.press('time-picker-dial-hours-9').advance(100);
    const oldCallbacks = host.queued.splice(0);
    host.press('time-picker-select-hours');
    host.context();
    oldCallbacks.forEach((callback) => callback());
    host.flush();
    assert.ok(host.find('time-picker-dial-hours-9'));
    assert.equal(
        host.all().some((element) => element.props.testID === 'time-picker-dial-minutes-5'),
        false
    );
});
test('input-to-dial reads the queued keyboard value inside the UI transaction', () => {
    const { host } = timeHost({ initialDisplayMode: 'input', autoSwitchToMinutes: false });
    host.change('time-picker-hour-input', '09').change('time-picker-minute-input', '10');
    host.deferRNWrites = true;
    host.press('time-picker-toggle-mode').flushUI().deliver();
    const hand = host
        .all()
        .find(
            (element) => Array.isArray(element.props.style) && element.props.style[0]?.left === 128 && element.props.style[0]?.width === 0
        );
    assert.ok(hand, 'clock hand exists');
    assert.equal(hand.props.style[1].compute().transform[0].rotate, '270deg');
    assert.equal(host.find('time-picker-select-hours').props.accessibilityLabel, 'Hour, 09');
});
test('slider focus narrows the handle while preserving the six-dp physical track gap', () => {
    const host = layout(new Host(Slider, { value: 50, minimumValue: 0, maximumValue: 100, onValueChange() {} }));
    const activeTrack = () =>
        host
            .all()
            .find((element) => Array.isArray(element.props.style) && element.props.style[1]?.backgroundColor === theme.colors.primary)
            .props.style[2].compute();
    assert.equal(activeTrack().width, 92);
    host.find('slider-thumb').props.onFocus();
    host.flush();
    assert.equal(activeTrack().width, 93, 'the edge moves one dp as half-handle changes2→1');
    host.find('slider-thumb').props.onBlur();
    host.flush();
    assert.equal(activeTrack().width, 92);
});
test('RTL text fields place affixes and supporting counters in logical order', () => {
    localeDirection = 'rtl';
    try {
        const host = new Host(TextField, {
            value: '25',
            onChangeText() {},
            label: 'Amount',
            prefix: '$',
            suffix: 'USD',
            supportingText: 'Help',
            counter: 10,
        });
        const rows = host.all().filter((element) => Array.isArray(element.props.style) && element.props.style[0]?.flexDirection === 'row');
        assert.ok(rows.length >= 2);
        rows.forEach((row) => assert.equal(row.props.style[1].flexDirection, 'row-reverse'));
        host.setProps({leadingIcon: 'search'});
        let row = Object.assign({}, ...host.find('text-field-input-row').props.style);
        assert.equal(row.paddingLeft, 16); assert.equal(row.paddingRight, 4);
        host.setProps({leadingIcon: undefined, trailingIcon: 'close'});
        row = Object.assign({}, ...host.find('text-field-input-row').props.style);
        assert.equal(row.paddingLeft, 4); assert.equal(row.paddingRight, 16);
    } finally {
        localeDirection = 'ltr';
    }
});
test('input chips reserve removal targets and use their distinct leading-icon roles', () => {
    const host = new Host(Chip, {
        variant: 'input',
        selected: true,
        icon: 'account',
        onPress() {},
        onClose() {},
        children: 'Ana',
        testID: 'input-chip',
    });
    assert.ok(host.tree.props.style[0].minWidth >= 88);
    assert.equal(host.find('input-chip-close').props.style.width, 48);
    assert.ok(host.all().some((element) => element.type === 'Text' && element.props.style[0].minWidth === 42));
    const leading = host.all().find((element) => element.type === 'Icon' && element.props.source === 'account');
    assert.equal(leading.props.color, theme.colors.primary);
    host.setProps({ selected: false });
    assert.equal(
        host.all().find((element) => element.type === 'Icon' && element.props.source === 'account').props.color,
        theme.colors.onSurfaceVariant
    );
    host.find('input-chip').props.onHoverIn();
    host.flush();
    assert.equal(
        host.all().find((element) => element.type === 'Icon' && element.props.source === 'account').props.color,
        theme.colors.primary
    );
    assert.equal(
        host.all().find((element) => element.type === 'Surface').props.elevation,
        0,
        'input hover must not inherit filter elevation'
    );
    host.setProps({ disabled: true });
    assert.equal(host.find('input-chip-close').props.disabled, true);
    host.setProps({ disabled: false });
    assert.equal(host.find('input-chip-close').props.disabled, false);
});
test('filter trailing menu and close actions do not dispatch the primary action', () => {
    const calls = [];
    const host = new Host(Chip, {
        variant: 'filter',
        trailingIcon: 'menu-down',
        onPress: () => calls.push('primary'),
        onTrailingIconPress: () => calls.push('menu'),
        trailingIconAccessibilityLabel: 'Menu',
        children: 'Place',
        testID: 'filter-chip',
    });
    host.find('filter-chip-trailing').props.onPress({ stopPropagation: () => calls.push('stop') });
    assert.deepEqual(calls, ['stop', 'menu']);
});
test('baseline list press keeps square corners and tall media aligns all slots at the top', () => {
    const host = new Host(ListItem, {
        title: 'Title',
        description: 'Description',
        variant: 'baseline',
        leading: jsx('Image', { style: { height: 100 } }),
        onPress() {},
    });
    host.find('mobile-list-item').props.onPressIn();
    host.flush();
    const row = host.all().find((element) => element.type === 'AnimatedView' && element.props.ref);
    assert.equal(row.props.style[1].compute().borderRadius, 0);
    const leading = host
        .all()
        .find((element) => element.type === 'View' && element.props.onLayout && host.all(element).some((node) => node.type === 'Image'));
    leading.props.onLayout({ nativeEvent: { layout: { height: 100 } } });
    host.flush();
    const body = host.find('mobile-list-item').props.children;
    assert.equal(body.props.style.alignItems, 'flex-start');
});
test('slider reports the live accessible value before the drag completes', () => {
    const host = layout(new Host(Slider, { value: 20, maximumValue: 100, onValueChange() {} }));
    host.pan('onActivate', event(64)).pan('onUpdate', event(184)).deliver();
    assert.equal(host.find('slider-thumb').props.accessibilityValue.now, 80);
});
test('keyboard start reports the accepted value before changing it', () => {
    const calls = [];
    const host = layout(
        new Host(Slider, {
            value: 20,
            maximumValue: 100,
            step: 10,
            onSlidingStart: (value) => calls.push(['start', value]),
            onValueChange: (value) => calls.push(['change', value]),
            onSlidingComplete: (value) => calls.push(['complete', value]),
        })
    );
    host.find('slider-thumb').props.onKeyDown({ nativeEvent: { key: 'ArrowRight' }, preventDefault() {} });
    assert.deepEqual(calls, [
        ['start', 20],
        ['change', 30],
        ['complete', 30],
    ]);
});
test('keyboard and accessibility visit the last regular stop before a partial maximum', () => {
    const values = [];
    const host = layout(
        new Host(RangeSlider, {
            value: [0, 100],
            maximumValue: 100,
            step: 30,
            minimumRange: 10,
            onValueChange: (value) => values.push(Array.from(value)),
        })
    );
    const thumb = host.find('range-slider-end').props;
    thumb.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } });
    thumb.onKeyDown({ nativeEvent: { key: 'ArrowRight' }, preventDefault() {} });
    thumb.onKeyDown({ nativeEvent: { key: 'ArrowLeft' }, preventDefault() {} });
    assert.deepEqual(values, [[0, 90], [0, 100], [0, 90]]);
});
test('a relocated leading inset icon stays by the handle, away from the end stop', () => {
    for (const reversed of [false, true]) {
        const host = layout(
            new Host(Slider, {
                value: 0,
                size: 'md',
                maximumValue: 100,
                leadingIcon: 'volume-off',
                reversed,
                onValueChange() {},
            })
        );
        const icon = host.all().find((node) => node.props.style?.[0]?.width === 24 && node.props.style?.[0]?.height === 24);
        const placement = icon.props.style[1].compute();
        const handle = host.find('slider-thumb').props.style[3].compute();
        assert.equal(placement.opacity, 1);
        assert.equal(reversed ? handle.left + 24 - (placement.left + 24) : placement.left - (handle.left + 24), 18);
    }
});
test('slider keyboard focus uses a bounded capsule and decorative values cannot receive focus', () => {
    const host = layout(new Host(Slider, { value: 20, maximumValue: 100, onValueChange() {}, valueIndicator: 'on-drag' }));
    host.find('slider-thumb').props.onFocus();
    host.flush();
    const ring = host.find('slider-thumb-focus-ring').props.style;
    assert.equal(ring.width, 12);
    assert.equal(ring.height, 48);
    assert.equal(ring.borderWidth, 3);
    assert.equal(host.find('slider-thumb-handle').props.style[2].compute().height, 38);
    assert.equal(host.find('slider-thumb').props.style[1].width, 48);
    const text = host.all().find((node) => node.props.editable === false);
    assert.equal(text.props.focusable, false);
    assert.notEqual(text.props.tabIndex, 0);
    assert.equal(host.find('slider-thumb-indicator').props.importantForAccessibility, 'no-hide-descendants');
});
test('fractional stop labels retain their precision and edge ticks stay inside rounded caps', () => {
    const host = layout(new Host(Slider, { value: 0.0001, maximumValue: 0.001, step: 0.0001, onValueChange() {} }));
    assert.equal(host.find('slider-thumb').props.accessibilityValue.text, '0.0001');
    const ticks = host.all().filter((node) => node.props.style?.[0]?.width === 4 && node.props.style?.[0]?.height === 4);
    for (const tick of ticks) {
        const position = tick.props.style[1].compute().left;
        assert.ok(position >= 24 && position <= 224, 'a stop dot must fit inside the track');
    }
});
test('track taps animate geometry but publish the selected value immediately', () => {
    const calls = [];
    function Controlled() {
        const [value, setValue] = React.useState(20);
        return jsx(Slider, {
            value,
            maximumValue: 100,
            onValueChange: (next) => {
                calls.push(next);
                setValue(next);
            },
        });
    }
    const host = layout(new Host(Controlled, {}));
    host.context();
    const tap = host.all().find((node) => node.type === 'GestureDetector').props.gesture.gestures[1];
    tap.onBegin({ numberOfPointers: 1 });
    tap.onActivate(event(184));
    host.deliver();
    assert.deepEqual(calls, [80]);
    assert.equal(host.find('slider-thumb').props.accessibilityValue.now, 80);
    assert.ok(host.shared.some((value) => value.animation?.to === 80 && value.animation.config.duration === 150));
    host.pan('onActivate', event(124));
    assert.equal(
        host.shared.some((value) => value.animation?.to === 80),
        false,
        'dragging interrupts the tap transition'
    );
});
test('holding a slider reveals its feedback without committing a value', () => {
    const calls = [];
    const host = layout(
        new Host(Slider, { value: 20, maximumValue: 100, valueIndicator: 'on-drag', onValueChange: (value) => calls.push(value) })
    );
    host.pan('onBegin', event(64));
    assert.ok(host.shared.some((value) => value.animation?.to === 1 && value.animation.config.duration === 400));
    assert.deepEqual(calls, []);
    host.pan('onFinalize', { ...event(64), canceled: true }).deliver();
    assert.equal(host.find('slider-thumb').props.accessibilityValue.now, 20);
    assert.deepEqual(calls, []);
});
test('value indicators reserve their enlarged text geometry and stay inside both axes', () => {
    const old = windowSize;
    windowSize = { ...old, fontScale: 2 };
    try {
        const horizontal = layout(
            new Host(Slider, {
                value: 100,
                maximumValue: 100,
                valueIndicator: 'on-drag',
                valuePrecision: 0,
                valueSuffix: ' %',
                onValueChange() {},
            })
        );
        const bubble = horizontal.find('slider-thumb-indicator').props.style[2];
        assert.equal(bubble.height, 64);
        assert.equal(horizontal.tree.props.style[0].paddingTop, 66);
        const horizontalOffset =
            horizontal.find('slider-thumb').props.style[3].compute().left +
            horizontal.find('slider-thumb-indicator').props.style[3].compute().left;
        assert.equal(horizontalOffset + bubble.width, 248);
        for (const direction of ['ltr', 'rtl']) {
            localeDirection = direction;
            const vertical = layout(
                new Host(Slider, {
                    value: 0,
                    maximumValue: 100,
                    valueIndicator: 'always',
                    valuePrecision: 0,
                    valueSuffix: ' %',
                    valueLabel: '',
                    orientation: 'vertical',
                    onValueChange() {},
                }),
                48,
                240
            );
            const [_, side, dimensions, placement] = vertical.find('slider-thumb-indicator').props.style;
            const rootStyle = vertical.tree.props.style[0];
            const track = vertical.all().find((node) => node.props.onLayout);
            const axisStart = vertical.find('slider-thumb').props.style[3].compute().top + placement.compute().top;
            assert.equal(track.props.style[1].height, 240);
            assert.equal(rootStyle.height, 280);
            assert.equal(vertical.find('slider-value').props.animatedProps.compute().text, '0 %');
            assert.equal(axisStart + dimensions.height, 240);
            assert.ok(rootStyle.paddingLeft + side.left >= 0);
            assert.ok(rootStyle.paddingLeft + side.left + dimensions.width <= rootStyle.width);
            assert.ok(placement.compute().transformOrigin.startsWith(direction === 'rtl' ? 'right ' : 'left '));
        }
    } finally {
        windowSize = old;
        localeDirection = 'ltr';
    }
});
test('indicator text uses the accessible precision without rounding the continuous value itself', () => {
    const host = layout(
        new Host(Slider, {
            value: 43.508,
            maximumValue: 100,
            valueIndicator: 'on-drag',
            valuePrecision: 0,
            valueSuffix: ' %',
            valueLabel: 'Volumen',
            onValueChange() {},
        })
    );
    const thumb = host.find('slider-thumb').props;
    const indicatorText = host.find('slider-thumb-indicator').props.children.props;
    const readout = host.find('slider-value').props;
    assert.equal(thumb.accessibilityValue.now, 43.508);
    assert.equal(thumb.accessibilityValue.text, '44 %');
    assert.equal(indicatorText.defaultValue, '44 %');
    assert.equal(indicatorText.animatedProps.compute().text, '44 %');
    assert.equal(readout.animatedProps.compute().text, 'Volumen: 44 %');
    host.pan('onActivate', event(184));
    assert.equal(thumb.accessibilityValue.now, 43.508, 'the RN callback has not arrived yet');
    assert.equal(indicatorText.animatedProps.compute().text, '80 %');
    assert.equal(readout.animatedProps.compute().text, 'Volumen: 80 %');
});
test('a track tap shows the value briefly and its dismissal cannot hide a later drag', () => {
    function Controlled() {
        const [value, onValueChange] = React.useState(20);
        return jsx(Slider, { value, onValueChange, maximumValue: 100, valueIndicator: 'on-drag' });
    }
    const host = layout(new Host(Controlled, {}));
    const tap = host.all().find((node) => node.type === 'GestureDetector').props.gesture.gestures[1];
    const visible = () => host.find('slider-thumb-indicator').props.style[3].compute().opacity;
    tap.onBegin({ numberOfPointers: 1 });
    tap.onActivate(event(184));
    host.deliver().advance(399);
    assert.equal(visible(), 1);
    host.advance(1);
    assert.equal(visible(), 0);
    tap.onBegin({ numberOfPointers: 1 });
    tap.onActivate(event(144));
    host.deliver().advance(200);
    host.pan('onBegin', event(144)).pan('onActivate', event(144)).advance(400);
    assert.equal(visible(), 1);
    host.pan('onFinalize', { ...event(144), canceled: true }).deliver();
    assert.equal(visible(), 0);
});
test('native vertical sliders claim their track before a same-axis scroll can take the drag', () => {
    const host = layout(new Host(Slider, { orientation: 'vertical', value: 50, maximumValue: 100, onValueChange() {} }));
    const pan = host.all().find((node) => node.type === 'GestureDetector').props.gesture.gestures[0];
    assert.equal(pan.manualActivation, true);
    host.pan('onTouchesDown', { ...event(24, 100), numberOfTouches: 1, handlerTag: 17 });
    assert.equal(activatedGestures.at(-1), 17);
    const horizontal = layout(new Host(Slider, { value: 50, maximumValue: 100, onValueChange() {} }));
    const other = horizontal.all().find((node) => node.type === 'GestureDetector').props.gesture.gestures[0];
    assert.equal(other.manualActivation, false);
});
test('range value indicators give pointer interaction priority over an earlier keyboard focus', () => {
    const host = layout(new Host(RangeSlider, { value: [20, 80], maximumValue: 100, valueIndicator: 'always', onValueChange() {} }));
    host.find('range-slider-start').props.onFocus();
    host.flush().reactions();
    assert.equal(host.find('range-slider-start-indicator').props.style[3].compute().opacity, 1);
    assert.equal(host.find('range-slider-end-indicator').props.style[3].compute().opacity, 0);
    host.pan('onActivate', event(184));
    assert.equal(host.find('range-slider-start-indicator').props.style[3].compute().opacity, 0);
    assert.equal(host.find('range-slider-end-indicator').props.style[3].compute().opacity, 1);
});
console.log(`OK: ${cases} selection interaction/lifecycle cases; mocked native and UI-clock boundaries, no visual/FPS claims.`);
