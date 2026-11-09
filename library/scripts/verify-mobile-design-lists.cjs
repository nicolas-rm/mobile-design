/**
 * node scripts/verify-mobile-design-lists.cjs
 *
 * Executes actual ListItem/Group/Accordion, SwipeListItem/Group and example TSX. React,
 * native views, Paper controls, GH recognition and Reanimated spring sampling
 * are explicit doubles. Completion and UI→RN delivery are controlled separately
 * to reproduce interrupted/stale callbacks. This checks behavior and geometry;
 * it does not render pixels, measure FPS, synthesize OS swipes, test native
 * scroll arbitration, or replace iOS/Android and screen-reader verification.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const requireShared = require('./require-mobile-design-shared.cjs');
const NativeReact = require('react');
const root = path.resolve(__dirname, '..');
let active,
    uiVersion = 0,
    nextFocusIdentity = 0,
    direction = 'ltr',
    runtime = 'rn',
    deferredUI = false;
const theme = {
    animation: { scale: 1 },
    fonts: { bodyLarge: {}, bodyMedium: {}, labelSmall: {} },
    colors: Object.fromEntries(
        [
            'primary',
            'onPrimary',
            'secondary',
            'secondaryContainer',
            'onSecondaryContainer',
            'error',
            'onError',
            'errorContainer',
            'onErrorContainer',
            'surface',
            'surfaceContainerLow',
            'surfaceContainer',
            'onSurface',
            'onSurfaceVariant',
            'outline',
        ].map((key) => [key, key])
    ),
    motion: {
        duration: { short1: 50, short2: 100, short3: 150 },
        spring: { fast: { spatial: { stiffness: 800, damping: 0.6 } }, default: { spatial: { stiffness: 380, damping: 0.8 } } },
    },
};
const same = (a, b) =>
    Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((value, index) => Object.is(value, b[index])) : Object.is(a, b);
function hook(create) {
    const node = active.node,
        index = node.cursor++;
    return node.hooks[index] ?? (node.hooks[index] = create());
}
function effect(create, deps, layout = false) {
    const node = active.node,
        slot = hook(() => ({}));
    if (!slot.deps || !same(slot.deps, deps)) {
        slot.deps = deps;
        node.host.effects.push({ slot, create, layout });
    }
}
const React = {
    createContext(value) {
        const context = { current: value };
        context.Provider = { context };
        return context;
    },
    useContext: (context) => context.current,
    forwardRef: (render) => (props) => render(props, props.ref),
    useRef: (current) => hook(() => ({ current })),
    useId: () => hook(() => ({ value: `list-focus-${++nextFocusIdentity}` })).value,
    useCallback: (callback, deps) => React.useMemo(() => callback, deps),
    useState(initial) {
        const node = active.node,
            slot = hook(() => ({ value: typeof initial === 'function' ? initial() : initial }));
        return [
            slot.value,
            (next) => {
                assert.ok(!node.disposed, 'disposed nodes cannot update state');
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
        if (!slot.deps || !same(slot.deps, deps)) {
            slot.deps = deps;
            slot.value = create();
        }
        return slot.value;
    },
    useEffect: (create, deps) => effect(create, deps),
    useLayoutEffect: (create, deps) => effect(create, deps, true),
    Children: { toArray: (children) => [children].flat(Infinity).filter((child) => child != null && child !== false) },
    isValidElement: (value) => Boolean(value && typeof value === 'object' && 'type' in value),
    cloneElement: (element, props) => ({ ...element, props: { ...element.props, ...props } }),
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
function onUI(host, callback) {
    const previous = runtime;
    runtime = 'ui';
    host.context();
    try {
        return callback();
    } finally {
        runtime = previous;
    }
}
function cancelAnimation(shared) {
    const cancel = () => {
        const animation = shared.animation;
        shared.animation = null;
        animation?.callback?.(false);
    };
    if (deferredUI && runtime === 'rn') active.node.host.uiQueued.push(cancel);
    else cancel();
}
const jsx = (type, props = {}, key) => {
    if (type === 'TouchableRipple') {
        // Exercise Paper's actual single-element boundary even though native
        // rendering is doubled. A closed swipe action still mounts its ripple.
        const asElement = (child) =>
            child && typeof child === 'object' && 'type' in child ? NativeReact.createElement('View', null) : child;
        NativeReact.Children.only(Array.isArray(props.children) ? props.children.map(asElement) : asElement(props.children));
    }
    return { type, props, key };
};
const flatten = (styles) =>
    Array.isArray(styles) ? Object.assign({}, ...styles.map(flatten)) : styles?.compute ? styles.compute() : (styles ?? {});
const builder = new Proxy({}, { get: () => () => builder });
const reanimated = {
    View: 'AnimatedView',
    LinearTransition: builder,
    FadeIn: builder,
    FadeOut: builder,
    ReduceMotion: { Never: 'never', Always: 'always' },
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
                    if (typeof next === 'function') next = next(this.current);
                    const apply = () => {
                        cancelAnimation(this);
                        let value = next;
                        if (value?.kind) {
                            this.animation = value;
                            value = value.to;
                        }
                        if (!Object.is(this.current, value)) {
                            this.current = value;
                            uiVersion++;
                        }
                    };
                    // Native RN writes are enqueued; an immediate RN get still
                    // observes the last UI value. Pure web/Jest-style synchronous
                    // doubles miss revision races in imperative animation APIs.
                    if (deferredUI && runtime === 'rn') host.uiQueued.push(apply);
                    else apply();
                },
            };
            host.shared.push(shared);
            return shared;
        });
    },
    useAnimatedStyle: (compute) => ({ compute }),
    useAnimatedProps: (compute) => ({ compute }),
    useAnimatedReaction(prepare, react, dependencies) {
        assert.equal(dependencies, undefined, 'native Reanimated derives worklet dependencies from its closure');
        const slot = hook(() => {
            const value = {};
            active.node.reactions.push(value);
            return value;
        });
        Object.assign(slot, { prepare, react });
    },
    withSpring: (to, config, callback) => ({ kind: 'spring', to, config, callback }),
    interpolateColor: (value, inputs, outputs) => (value >= inputs.at(-1) ? outputs.at(-1) : outputs[0]),
    FlatList: (props) =>
        jsx('FlatListBoundary', {
            ...props,
            children: props.data.length
                ? props.data.map((item, index) => jsx('Cell', { children: props.renderItem({ item, index }) }, props.keyExtractor(item)))
                : props.ListEmptyComponent,
        }),
};
const modules = {
    '@mobile-design/tokens': requireShared('@mobile-design/tokens'),
    '@mobile-design/icons/react-native': { MaterialSymbol: 'MaterialSymbol' },
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
        Platform: { OS: 'android' },
        View: 'View',
        Pressable: 'Pressable',
        ScrollView: 'ScrollView',
        Image: 'Image',
        Linking: { openURL: async () => {} },
        StyleSheet: {
            create: (value) => value,
            absoluteFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
            flatten: (style) => flatten(style),
        },
    },
    'react-native-paper': {
        Icon: 'Icon',
        TouchableRipple: 'TouchableRipple',
        Text: 'Text',
        Surface: 'Surface',
        Badge: 'PaperBadge',
        List: {
            AccordionGroup: 'PaperAccordionGroup',
            Icon: 'PaperListIcon',
            Image: 'PaperListImage',
            Section: 'PaperListSection',
            Subheader: 'PaperListSubheader',
        },
        useLocale: () => ({ direction }),
    },
    'react-native-reanimated': reanimated,
    'react-native-gesture-handler': { GestureDetector: 'GestureDetector', usePanGesture: (value) => value },
    'react-native-worklets': {
        scheduleOnRN: (callback, ...args) => active.node.host.queued.push(() => callback(...args)),
        scheduleOnUI: (callback, ...args) => {
            const host = active.node.host;
            if (deferredUI) host.uiQueued.push(() => callback(...args));
            else onUI(host, () => callback(...args));
        },
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }) },
    '../core': { useMobileTheme: () => theme },
    '../color': { withAlpha: (role, alpha) => `${role}@${alpha}` },
};
function load(relative) {
    const filename = path.join(root, relative),
        exports = {};
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true,
        },
    }).outputText;
    vm.runInNewContext(
        output,
        {
            exports,
            require(name) {
                if (name.endsWith('.png')) return 'ImageAssetBoundary';
                assert.ok(modules[name], `explicit boundary ${name}`);
                return modules[name];
            },
        },
        { filename }
    );
    return exports;
}
modules['../ripple'] = load('packages/mobile-design/src/ripple.tsx');
modules['../web-accessibility'] = load('packages/mobile-design/src/web-accessibility.ts');
const { SwipeListItem, SwipeListGroup, swipeListTarget, swipeActionGeometry } = load(
    'packages/mobile-design/src/components/swipe-list-item.tsx'
);
modules['../ripple'] = load('packages/mobile-design/src/ripple.tsx');
modules['./focus-order'] = load('packages/mobile-design/src/components/focus-order.ts');
modules['./list-focus'] = load('packages/mobile-design/src/components/list-focus.tsx');
modules['./press-scope'] = load('packages/mobile-design/src/components/press-scope.ts');
const { List: PackageList, ListItem, ListGroup, ListAccordion, ListCollection } = load('packages/mobile-design/src/components/content.tsx');
const { ListReorderGroup } = load('packages/mobile-design/src/components/list-reorder.tsx');
function Menu(props) {
    return jsx('MenuBoundary', { children: [props.anchor, props.visible ? props.children : null] });
}
Menu.Item = 'MenuItem';
const List = {
    Group: (props) => jsx('ListGroupBoundary', props),
    Item: (props) =>
        jsx('ListItemBoundary', {
            ...props,
            children: [
                props.leading,
                typeof props.trailing === 'function'
                    ? props.trailing({
                          color: 'onSurfaceVariant',
                          height: 72,
                          style: { height: 72, marginVertical: 0 },
                          disabled: false,
                          selected: false,
                      })
                    : props.trailing,
            ],
        }),
    Accordion: (props) => jsx('AccordionBoundary', props),
};
modules['mobile-design/react-native'] = {
    SwipeListItem,
    SwipeListGroup,
    List,
    Menu,
    Avatar: { Text: 'AvatarText', Icon: 'AvatarIcon' },
    Badge: 'Badge',
    Button: 'Button',
    IconButton: 'IconButton',
    Text: 'Text',
    Icon: 'Icon',
    MaterialSymbol: 'MaterialSymbol',
    Divider: 'Divider',
    Dialog: Object.assign((props) => props.visible ? jsx('DialogBoundary', props) : null, {
        Title: 'DialogTitle', Content: 'DialogContent', Actions: 'DialogActions',
    }),
    LocaleProvider: ({ children }) => children,
    ThemeProvider: ({ children }) => children,
    Switch: 'Switch',
    Checkbox: 'Checkbox',
    RadioButton: 'RadioButton',
    useMobileTheme: () => theme,
    SegmentedButtons: (props) =>
        jsx('SegmentsBoundary', {
            children: props.buttons.map((button) =>
                jsx('SegmentBoundary', { ...button, onPress: () => props.onValueChange(button.value) }, button.value)
            ),
        }),
    FullScreenDialog: (props) => (props.visible ? jsx('DialogBoundary', props) : null),
    Snackbar: (props) =>
        props.visible
            ? jsx('SnackbarBoundary', {
                  ...props,
                  children: [
                      props.children,
                      jsx('SnackbarActionBoundary', {
                          ...props.action,
                          onPress: () => {
                              props.action.onPress();
                              props.onDismiss();
                          },
                      }),
                  ],
              })
            : null,
};
let typeID = 0;
const typeIDs = new WeakMap();
class Host {
    constructor(component, props) {
        Object.assign(this, { component, props, nodes: new Map(), shared: [], queued: [], uiQueued: [], effects: [], dirty: false });
        this.flush().reactions();
    }
    context() {
        active = { node: { host: this } };
    }
    render(element, key = 'root') {
        if (element == null || typeof element !== 'object') return element;
        if (Array.isArray(element)) return element.map((child, index) => this.render(child, `${key}.${child?.key ?? index}`));
        const { type, props } = element;
        if (type?.context) {
            const previous = type.context.current;
            type.context.current = props.value;
            const children = this.render(props.children, `${key}.provider`);
            type.context.current = previous;
            return { ...element, type: 'Provider', props: { ...props, children } };
        }
        if (typeof type === 'function') {
            if (!typeIDs.has(type)) typeIDs.set(type, ++typeID);
            const id = `${key}:${typeIDs.get(type)}:${element.key ?? ''}`;
            if (!this.nodes.has(id)) this.nodes.set(id, { host: this, hooks: [], reactions: [] });
            const node = this.nodes.get(id),
                previous = active;
            Object.assign(node, { cursor: 0, seen: true });
            active = { node };
            const output = type(props);
            active = previous;
            return this.render(output, id);
        }
        return { ...element, props: { ...props, children: this.render(props.children, `${key}.child`) } };
    }
    flush() {
        let iterations = 0;
        do {
            assert.ok(++iterations < 25, 'React effects settle');
            this.dirty = false;
            for (const node of this.nodes.values()) node.seen = false;
            this.tree = this.render(jsx(this.component, this.props));
            for (const { slot, create } of this.effects.splice(0).sort((a, b) => Number(b.layout) - Number(a.layout))) {
                this.context();
                slot.cleanup?.();
                slot.cleanup = create();
            }
            for (const [id, node] of this.nodes)
                if (!node.seen) {
                    this.context();
                    node.disposed = true;
                    node.hooks.forEach((slot) => slot.cleanup?.());
                    this.nodes.delete(id);
                }
        } while (this.dirty);
        return this;
    }
    all(element) {
        if (arguments.length === 0) element = this.tree;
        if (!element || typeof element !== 'object') return [];
        if (Array.isArray(element)) return element.flatMap((child) => this.all(child));
        return [element, ...this.all(element.props.children)];
    }
    find(id) {
        const element = this.all().find((child) => child.props.testID === id);
        assert.ok(element, `exists ${id}`);
        return element;
    }
    exists(id) {
        return this.all().some((child) => child.props.testID === id);
    }
    setProps(props) {
        Object.assign(this.props, props);
        return this.flush().reactions();
    }
    press(id) {
        this.context();
        const props = this.find(id).props;
        assert.ok(!props.disabled, `${id} is enabled`);
        props.onPress();
        return this.flush().reactions();
    }
    layout(id = 'row', width = 358, height = 88) {
        this.context();
        this.find(id).props.onLayout({ nativeEvent: { layout: { width, height } } });
        return this.flush().reactions();
    }
    pan(handler, event = {}, id = 'row') {
        this.context();
        const gesture = this.all(this.find(id)).find((child) => child.type === 'GestureDetector').props.gesture;
        assert.notEqual(gesture.enabled, false);
        onUI(this, () => gesture[handler]({ translationX: 0, velocityX: 0, canceled: false, ...event }));
        return this.reactions();
    }
    reactions() {
        let iterations = 0,
            previous;
        do {
            assert.ok(++iterations < 30, 'UI reactions settle');
            previous = uiVersion;
            onUI(this, () => {
                for (const node of this.nodes.values())
                    for (const reaction of node.reactions) {
                        const next = reaction.prepare();
                        if (!same(next, reaction.previous)) {
                            reaction.react(next, reaction.previous);
                            reaction.previous = next;
                        }
                    }
            });
        } while (uiVersion !== previous);
        return this;
    }
    drainUI() {
        while (this.uiQueued.length) onUI(this, this.uiQueued.shift());
        return this.reactions();
    }
    complete() {
        onUI(this, () => {
            for (const shared of this.shared) {
                const animation = shared.animation;
                if (animation) {
                    shared.animation = null;
                    shared.current = animation.to;
                    animation.callback?.(true);
                }
            }
        });
        return this.reactions();
    }
    deliver() {
        this.context();
        for (const callback of this.queued.splice(0)) callback();
        return this.unmounted ? this : this.flush().reactions();
    }
    settled() {
        return this.complete().deliver();
    }
    offset(id = 'row') {
        const gesture = this.all(this.find(id)).find((child) => child.type === 'GestureDetector');
        return gesture.props.children.props.style.compute().transform[0].translateX;
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
const action = (key, onPress = () => {}, props = {}) => ({ key, label: key, icon: 'star', onPress, ...props });
function rowHost(props = {}) {
    const ref = { current: null };
    const host = new Host(SwipeListItem, { id: 'row', testID: 'row', ref, children: jsx('OriginalRow'), ...props }).layout();
    return { host, ref };
}
function swipe(host, translationX, velocityX = 0, id = 'row') {
    return host
        .pan('onActivate', {}, id)
        .pan('onUpdate', { translationX }, id)
        .pan('onDeactivate', { translationX, velocityX }, id)
        .pan('onFinalize', {}, id);
}
let cases = 0;
function test(name, run) {
    run();
    cases++;
    console.log(`PASS ${name}`);
}

function reorderHost({ adopt = true, ...overrides } = {}) {
    const commits = [];
    let host;
    host = new Host(ListReorderGroup, {
        items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        keyExtractor: (item) => item.id,
        itemHeight: 96,
        renderItem: ({ item, dragged, renderHandle }) =>
            jsx('ReorderContent', {
                dragged,
                testID: `content-${item.id}`,
                children: renderHandle(jsx('HandleGlyph'), `Reorder ${item.id}`),
            }),
        onReorder: (items) => {
            commits.push(Array.from(items, (item) => item.id));
            if (adopt) host.setProps({ items: Array.from(items) });
        },
        testID: 'reorder',
        ...overrides,
    });
    return { host, commits };
}
const rowTop = (host, key) => {
    const top = flatten(host.find(`reorder-${key}`).props.style).top;
    return top?.kind ? top.to : top;
};
test('reordering stays on the drag handle, previews insertion on UI and commits one stable-key order on drop', () => {
    const { host, commits } = reorderHost();
    assert.equal(host.all(host.find('reorder-a')).filter((node) => node.type === 'GestureDetector').length, 1);
    host.pan('onActivate', {}, 'reorder-a').pan('onUpdate', { translationY: 190 }, 'reorder-a');
    assert.equal(rowTop(host, 'a'), 190);
    assert.equal(rowTop(host, 'b'), 0);
    assert.equal(rowTop(host, 'c'), 98);
    assert.equal(flatten(host.find('reorder-insertion').props.style).top, 196);
    assert.equal(flatten(host.find('reorder-insertion').props.style).height, 96);
    assert.deepEqual(commits, [], 'moving a handle cannot change the data before release');
    host.deliver();
    assert.equal(host.find('content-a').props.dragged, true);
    host.pan('onDeactivate', {}, 'reorder-a').pan('onFinalize', {}, 'reorder-a').deliver();
    assert.deepEqual(commits, [['b', 'c', 'a']]);
    assert.deepEqual(
        host.props.items.map((item) => item.id),
        ['b', 'c', 'a']
    );
    assert.equal(rowTop(host, 'a'), 196);
    assert.equal(host.find('content-a').props.dragged, false);
    host.unmount();
});
test('cancelled or failed reorder gestures return every row without publishing an order', () => {
    for (const cancelled of [true, false]) {
        const { host, commits } = reorderHost();
        host.pan('onActivate', {}, 'reorder-b').pan('onUpdate', { translationY: -80 }, 'reorder-b');
        if (cancelled) host.pan('onDeactivate', { canceled: true }, 'reorder-b');
        host.pan('onFinalize', {}, 'reorder-b').deliver();
        assert.deepEqual(commits, []);
        assert.equal(rowTop(host, 'a'), 0);
        assert.equal(rowTop(host, 'b'), 98);
        assert.equal(flatten(host.find('reorder-insertion').props.style).opacity, 0);
        host.unmount();
    }
});
test('reorder callbacks queued before disable, key replacement or unmount cannot change data', () => {
    for (const interruption of ['disabled', 'keys', 'unmount']) {
        const { host, commits } = reorderHost();
        host.pan('onActivate', {}, 'reorder-a').pan('onUpdate', { translationY: 100 }, 'reorder-a').pan('onDeactivate', {}, 'reorder-a');
        if (interruption === 'disabled') host.setProps({ disabled: true });
        else if (interruption === 'keys') host.setProps({ items: [{ id: 'a' }, { id: 'd' }, { id: 'c' }] });
        else host.unmount();
        host.deliver();
        assert.deepEqual(commits, [], interruption);
        if (!host.unmounted) host.unmount();
    }
});
test('accessible reorder actions preserve targets, bounds and controlled order without extra buttons', () => {
    const { host, commits } = reorderHost();
    const move = (id, actionName) => {
        host.context();
        host.find(`reorder-${id}-handle`).props.onAccessibilityAction({ nativeEvent: { actionName } });
        host.flush();
    };
    const handle = host.find('reorder-a-handle');
    assert.equal(handle.props.accessibilityRole, 'adjustable');
    assert.equal(handle.props.style.minWidth, 48);
    assert.equal(handle.props.style.minHeight, 48);
    assert.equal(host.all().filter((node) => node.type === 'Pressable').length, 0);
    move('a', 'decrement');
    assert.deepEqual(commits, []);
    move('a', 'increment');
    assert.deepEqual(commits, [['b', 'a', 'c']]);
    assert.equal(host.find('reorder-a-handle').props.accessibilityValue.now, 2);
    move('a', 'decrement');
    assert.deepEqual(commits.at(-1), ['a', 'b', 'c']);
    host.setProps({ disabled: true });
    move('a', 'increment');
    assert.equal(commits.length, 2);
    host.unmount();
});
test('batched accessible moves count every event before React and queued native shared writes catch up', () => {
    for (const lastAction of ['increment', 'decrement']) {
        const { host, commits } = reorderHost({ adopt: false });
        const move = host.find('reorder-a-handle').props.onAccessibilityAction;
        deferredUI = true;
        try {
            host.context();
            move({ nativeEvent: { actionName: 'increment' } });
            move({ nativeEvent: { actionName: lastAction } });
            assert.deepEqual(commits, [['b', 'a', 'c'], lastAction === 'increment' ? ['b', 'c', 'a'] : ['a', 'b', 'c']]);
            host.flush().drainUI();
        } finally {
            deferredUI = false;
            host.unmount();
        }
    }
});
test('reduced-motion reordering settles without a spring and a non-adopting consumer retains its controlled order', () => {
    theme.animation.scale = 0;
    const { host, commits } = reorderHost({ adopt: false });
    host.pan('onActivate', {}, 'reorder-a')
        .pan('onUpdate', { translationY: 100 }, 'reorder-a')
        .pan('onDeactivate', {}, 'reorder-a')
        .deliver();
    assert.deepEqual(commits, [['b', 'a', 'c']]);
    assert.equal(flatten(host.find('reorder-a').props.style).top, 0);
    assert.deepEqual(
        host.props.items.map((item) => item.id),
        ['a', 'b', 'c']
    );
    host.unmount();
    theme.animation.scale = 1;
});
test('reorder requires an explicit target-safe row height and unique item identities', () => {
    assert.throws(() => reorderHost({ itemHeight: 40 }), /at least 48dp/);
    assert.throws(() => reorderHost({ items: [{ id: 'a' }, { id: 'a' }] }), /unique/);
    assert.throws(() => reorderHost({ gap: -2 }), /non-negative/);
});

function listShape(host) {
    return flatten(host.all().find((node) => node.type === 'AnimatedView' && node.props.ref).props.style);
}
function listIndication(host, id = 'independent-row') {
    return flatten(host.find(`${id}-primary`).props.style).backgroundColor;
}
function independentRow(props = {}) {
    const calls = { primary: 0, secondary: 0, secondaryIn: 0, secondaryOut: 0 };
    const secondaryProps = {
        accessibilityRole: 'button',
        accessibilityLabel: 'Play track',
        rippleColor: 'secondary-ink@0.1',
        onPress: () => calls.secondary++,
        onPressIn: () => calls.secondaryIn++,
        onPressOut: () => calls.secondaryOut++,
        testID: 'independent-secondary',
    };
    const host = new Host(ListItem, {
        title: 'Track',
        multiAction: true,
        onPress: () => calls.primary++,
        trailing: () => jsx('IndependentAction', secondaryProps),
        testID: 'independent-row',
        ...props,
    });
    const primary = () => host.find('independent-row-primary');
    const secondary = () => host.find('independent-secondary');
    const event = (target, handler) => {
        host.context();
        target().props[handler]({ currentTarget: target().props.testID, nativeEvent: {} });
        host.flush();
    };
    return { host, calls, primary, secondary, secondaryProps, event };
}
test('multi-action row keeps the same native indication as a single action without sharing gesture ownership', () => {
    const { host, calls, primary, secondary, secondaryProps } = independentRow();
    assert.equal(primary().type, 'TouchableRipple');
    assert.equal(primary().props.accessibilityRole, 'button');
    const single = new Host(ListItem, { title: 'Track', onPress() {}, testID: 'single-row' });
    assert.equal(primary().type, single.find('single-row').type);
    assert.equal(primary().props.rippleColor, single.find('single-row').props.rippleColor);
    assert.equal(primary().props.underlayColor, single.find('single-row').props.underlayColor);
    single.unmount();
    assert.equal(secondary().props.rippleColor, 'secondary-ink@0.1', 'the slot retains its own native indication');
    assert.equal(secondary().props.accessibilityLabel, 'Play track');
    assert.ok(!host.all(primary()).includes(secondary()), 'a supplementary action is outside the primary target');
    assert.equal(secondary().props.onPressIn, secondaryProps.onPressIn, 'the row does not replace a secondary gesture owner');
    assert.equal(secondary().props.onPressOut, secondaryProps.onPressOut);
    host.press('independent-secondary');
    assert.deepEqual(calls, { primary: 0, secondary: 1, secondaryIn: 0, secondaryOut: 0 });
    host.press('independent-row-primary');
    assert.deepEqual(calls, { primary: 1, secondary: 1, secondaryIn: 0, secondaryOut: 0 });
    host.unmount();
});
test('primary press, hover and focus do not take over secondary feedback or dispatch either action', () => {
    const { host, calls, primary, secondary, event } = independentRow();
    event(primary, 'onFocus');
    event(primary, 'onHoverIn');
    event(primary, 'onPressIn');
    assert.equal(listIndication(host), 'transparent', 'native press indication replaces rather than compounds hover or focus paint');
    assert.equal(secondary().props.rippleColor, 'secondary-ink@0.1');
    event(secondary, 'onPressIn');
    event(primary, 'onPressOut');
    event(primary, 'onBlur');
    assert.equal(listIndication(host), 'onSurface@0.08', 'primary hover remains after its focus releases');
    event(secondary, 'onPressOut');
    event(primary, 'onHoverOut');
    assert.equal(listIndication(host), 'transparent');
    assert.deepEqual(calls, { primary: 0, secondary: 0, secondaryIn: 1, secondaryOut: 1 });
    host.unmount();
});
test('replacing a supplementary action leaves primary state owned by the primary, while disabling clears its state', () => {
    const { host, primary, event } = independentRow();
    const trailing = host.props.trailing;
    event(primary, 'onFocus');
    event(primary, 'onPressIn');
    host.setProps({ trailing: undefined });
    assert.equal(host.exists('independent-secondary'), false);
    assert.equal(listIndication(host), 'transparent', 'a held primary retains its native press indication');
    host.setProps({ trailing: () => null });
    event(primary, 'onPressOut');
    assert.equal(listIndication(host), 'onSurface@0.1', 'secondary absence cannot blur a still-focused primary');
    host.setProps({ disabled: true });
    assert.equal(primary().props.disabled, true);
    assert.equal(listIndication(host), 'transparent');
    host.setProps({ disabled: false, trailing });
    assert.equal(listIndication(host), 'transparent', 're-enabling does not revive the previous focus');
    assert.equal(host.exists('independent-secondary'), true);
    host.unmount();
});
test('retained native events cannot revive a disabled, replaced or disposed primary gesture owner', () => {
    for (const [inactive, restored] of [
        [{ disabled: true }, { disabled: false }],
        [{ onPress: undefined }, { onPress() {} }],
        [{ multiAction: false }, { multiAction: true }],
    ]) {
        const { host, primary, event } = independentRow();
        const retained = primary().props;
        event(primary, 'onPressIn');
        host.setProps(inactive);
        host.setProps(restored);
        for (const handler of ['onPressIn', 'onFocus', 'onHoverIn']) retained[handler]();
        host.flush();
        assert.equal(listShape(host).borderRadius, 4, 'an obsolete native event cannot restore the former pressed shape');
        assert.equal(listIndication(host), 'transparent');
        event(primary, 'onPressIn');
        for (const handler of ['onPressOut', 'onBlur', 'onHoverOut']) retained[handler]();
        host.flush();
        assert.equal(listShape(host).borderRadius, 16, 'an obsolete release cannot cancel the replacement primary press');
        assert.equal(listIndication(host), 'transparent');
        host.unmount();
        assert.doesNotThrow(() => {
            for (const handler of ['onPressIn', 'onPressOut', 'onFocus', 'onBlur']) retained[handler]();
        });
    }
});
test('multi-action native indication extends under independent controls while labels and focus retain their bounds', () => {
    for (const variant of ['expressive', 'baseline']) {
        const { host, primary, secondary, calls, event } = independentRow({ variant, position: 'only', style: { overflow: 'visible' } });
        assert.equal(host.exists('independent-row-state-layer'), false, 'no flat substitute for the native press indication');
        const trailing = host.all().find((node) => node.props.onLayout && flatten(node.props.style).zIndex === 1);
        host.context();
        trailing.props.onLayout({ nativeEvent: { layout: { width: 96 } } });
        host.flush();
        assert.equal(flatten(primary().props.style).marginEnd, -112, 'the indication reaches across both controls and the end inset');
        assert.equal(flatten(primary().props.children.props.style).paddingEnd, (variant === 'expressive' ? 12 : 16) + 112);
        assert.ok(host.all(primary()).some((node) => node.type === 'Text'), 'primary content remains inside its native accessibility owner');
        assert.ok(host.all().indexOf(primary()) < host.all().indexOf(secondary()), 'the primary precedes supplementary controls in traversal');
        event(primary, 'onFocus');
        const outline = host.all(primary()).find((node) => flatten(node.props.style).borderWidth === 3);
        assert.equal(flatten(outline.props.style).marginEnd, 112, 'the primary focus ring excludes the independent controls');
        event(primary, 'onBlur');
        assert.equal(listShape(host).overflow, 'hidden');
        event(secondary, 'onPressIn');
        assert.equal(listIndication(host), 'transparent', 'secondary feedback stays inside its own control');
        event(secondary, 'onPressOut');
        for (let cycle = 0; cycle < 2; cycle++) {
            event(primary, 'onPressIn');
            assert.equal(listIndication(host), 'transparent', 'the native press owns the only indication');
            assert.equal(listShape(host).borderRadius, variant === 'expressive' ? 16 : 0);
            event(primary, 'onPressOut');
            assert.equal(listIndication(host), 'transparent', 'release clears paint without a timer blocking the next press');
        }
        host.context();
        trailing.props.onLayout({ nativeEvent: { layout: { width: 48 } } });
        host.flush();
        assert.equal(flatten(primary().props.style).marginEnd, -64, 'replacing two controls with one updates the native extent');
        host.setProps({ trailing: null });
        assert.equal(flatten(primary().props.style).marginEnd, -16, 'removing the slot retains only the end inset extension');
        assert.deepEqual(calls, { primary: 0, secondary: 0, secondaryIn: 1, secondaryOut: 1 });
        host.unmount();
    }
});
test('original List clears held/focus/hover state across disable and removes the old touch host', () => {
    const host = new Host(ListItem, { title: 'Saved', onPress() {}, testID: 'original-list' });
    const action = () => host.find('original-list');
    action().props.onFocus();
    action().props.onHoverIn();
    action().props.onPressIn();
    host.flush();
    const key = action().key;
    assert.equal(listShape(host).borderRadius, 16);
    host.setProps({ disabled: true });
    assert.notEqual(action().key, key, 'disabling resets a held native underlay');
    host.setProps({ disabled: false });
    assert.equal(listShape(host).borderRadius, 4, 're-enabling cannot revive the old morph');
    assert.equal(action().props.style.backgroundColor, 'transparent', 'old hover/focus paint stays cleared');
    host.unmount();
    assert.ok(
        host.shared.every((value) => value.animation == null),
        'unmount cancels row shape work'
    );
});
test('original baseline action rows keep square corners while pressed', () => {
    const host = new Host(ListItem, { title: 'Baseline', variant: 'baseline', onPress() {}, testID: 'baseline-row' });
    host.find('baseline-row').props.onPressIn();
    host.flush();
    assert.equal(listShape(host).borderRadius, 0);
    host.unmount();
});
test('List groups preserve square Baseline rows and the Baseline container spacing', () => {
    for (const variant of ['standard', 'segmented']) {
        const host = new Host(ListGroup, {
            variant,
            children: [
                jsx(ListItem, { title: 'First', variant: 'baseline', onPress() {}, testID: 'baseline-first' }),
                jsx(ListItem, { title: 'Last', variant: 'baseline', onPress() {}, testID: 'baseline-last' }),
            ],
        });
        const group = host.all().find((node) => node.type === 'View' && node.props.style?.overflow === 'hidden' && 'gap' in node.props.style);
        assert.equal(group.props.style.borderRadius, 0, 'a group must not round its square Baseline children');
        assert.equal(group.props.style.gap, 0, 'Baseline has no Expressive segmented gaps');
        assert.equal(group.props.style.paddingVertical, 8);
        host.press('baseline-first');
        assert.equal(flatten(group.props.style).borderRadius, 0);
        host.unmount();
    }
});
test('List indication stays clipped when a layout style requests visible overflow', () => {
    for (const variant of ['expressive', 'baseline']) {
        for (const multiAction of [false, true]) {
            const host = new Host(ListItem, {
                title: 'Clipped row', variant, multiAction, onPress() {},
                style: { overflow: 'visible', marginTop: 12 }, testID: 'clipped-row',
            });
            assert.equal(listShape(host).overflow, 'hidden');
            assert.equal(listShape(host).marginTop, 12, 'layout overrides still apply');
            host.find(multiAction ? 'clipped-row-primary' : 'clipped-row').props.onPressIn();
            host.flush();
            assert.equal(listShape(host).overflow, 'hidden');
            assert.equal(listShape(host).borderRadius, variant === 'baseline' ? 0 : 16);
            host.unmount();
        }
    }
});
test('Baseline selection exposes its native control state without adopting Expressive container paint', () => {
    const host = new Host(ListItem, {
        title: 'Baseline choice',
        variant: 'baseline',
        selected: true,
        selectionMode: 'single',
        onPress() {},
        testID: 'baseline-choice',
    });
    assert.equal(host.find('baseline-choice').props.accessibilityState.checked, true);
    assert.equal(listShape(host).borderRadius, 0);
    assert.equal(
        host.all().some((node) => flatten(node.props.style).backgroundColor === 'secondaryContainer'),
        false
    );
    assert.equal(host.all().find((node) => node.type === 'Text').props.style.color, 'onSurface');
    host.unmount();
});
test('original informational list rows expose text without an unavailable press owner', () => {
    const host = new Host(ListItem, { title: 'Information', description: 'No action', testID: 'info-row' });
    const row = host.find('info-row');
    assert.equal(row.type, 'View');
    assert.equal(row.props.accessible, true);
    assert.equal(row.props.accessibilityState.disabled, false);
    assert.equal(row.props.onPress, undefined);
    assert.equal(row.props.onFocus, undefined);
    host.unmount();
});
test('long-press-only rows remain actionable and preserve the Paper delay in both ownership modes', () => {
    for (const multiAction of [false, true]) {
        let calls = 0;
        const host = new Host(ListItem, {
            title: 'Select by holding',
            multiAction,
            onLongPress: () => calls++,
            delayLongPress: 450,
            testID: 'hold-row',
        });
        const primary = host.find(multiAction ? 'hold-row-primary' : 'hold-row');
        assert.equal(primary.type, 'TouchableRipple');
        assert.equal(primary.props.disabled, false);
        assert.equal(primary.props.accessibilityRole, 'button');
        assert.equal(primary.props.delayLongPress, 450);
        host.context();
        primary.props.onLongPress({ nativeEvent: {} });
        assert.equal(calls, 1);
        host.setProps({ disabled: true });
        assert.equal(host.find(multiAction ? 'hold-row-primary' : 'hold-row').props.disabled, true);
        host.unmount();
    }
});
test('supporting text allows three lines and actual wrapping promotes the row to tall alignment', () => {
    const host = new Host(ListItem, {
        title: 'Long headline',
        description: 'Supporting text wraps across the available content slot.',
        titleNumberOfLines: 2,
        descriptionNumberOfLines: 3,
        onPress() {},
        testID: 'wrap-row',
    });
    const text = (value) => host.all().find((node) => node.type === 'Text' && node.props.children === value);
    assert.equal(text('Long headline').props.numberOfLines, 2);
    assert.equal(text('Supporting text wraps across the available content slot.').props.numberOfLines, 3);
    assert.equal(host.find('wrap-row').props.children.props.style.minHeight, 72);
    host.context();
    text('Supporting text wraps across the available content slot.').props.onTextLayout({ nativeEvent: { lines: [{}, {}] } });
    host.flush();
    assert.equal(host.find('wrap-row').props.children.props.style.minHeight, 88);
    assert.equal(host.find('wrap-row').props.children.props.style.alignItems, 'flex-start');
    host.unmount();
});
test('default spoken labels contain headline/support rather than decorative avatar or trailing metadata', () => {
    const host = new Host(ListItem, {
        title: 'City',
        description: 'Nearby places',
        leading: jsx('Text', { children: 'AC' }),
        trailing: '12',
        testID: 'spoken-row',
    });
    assert.equal(host.find('spoken-row').props.accessibilityLabel, 'City, Nearby places');
    host.setProps({ accessibilityLabel: 'Custom place label' });
    assert.equal(host.find('spoken-row').props.accessibilityLabel, 'Custom place label');
    host.unmount();
});
test('selected row state layers and icon callbacks use onSurface while labels retain selection ink', () => {
    const host = new Host(ListItem, {
        title: 'Saved',
        selected: true,
        selectionMode: 'multiple',
        onPress() {},
        leading: ({ color }) => jsx('LeadingToken', { color }),
        trailing: ({ color }) => jsx('TrailingToken', { color }),
        testID: 'color-row',
    });
    const action = () => host.find('color-row');
    const slotColor = () => host.all().find((node) => node.type === 'LeadingToken').props.color;
    assert.equal(slotColor(), 'onSecondaryContainer');
    assert.equal(action().props.rippleColor, 'onSurface@0.1');
    action().props.onHoverIn();
    host.flush();
    assert.equal(slotColor(), 'onSurface');
    assert.equal(host.all().find((node) => node.type === 'TrailingToken').props.color, 'onSurface');
    assert.equal(action().props.style.backgroundColor, 'onSurface@0.08');
    assert.equal(host.all().find((node) => node.type === 'Text').props.style.color, 'onSecondaryContainer');
    action().props.onPressIn();
    host.flush();
    assert.equal(action().props.style.backgroundColor, 'transparent', 'native pressed indication replaces rather than compounds hover');
    action().props.onPressOut();
    host.flush();
    assert.equal(action().props.style.backgroundColor, 'onSurface@0.08');
    host.unmount();
});
test('selection roles, checked state and explicit informational roles stay controlled', () => {
    for (const [selectionMode, role] of [
        ['single', 'radio'],
        ['multiple', 'checkbox'],
    ]) {
        const host = new Host(ListItem, { title: 'Choice', selectionMode, selected: true, onPress() {}, testID: 'choice-row' });
        assert.equal(host.find('choice-row').props.accessibilityRole, role);
        assert.equal(host.find('choice-row').props.accessibilityState.checked, true);
        host.setProps({ selected: false, disabled: true });
        assert.equal(host.find('choice-row').props.accessibilityState.checked, false);
        assert.equal(host.find('choice-row').props.accessibilityState.disabled, true);
        host.unmount();
    }
    const info = new Host(ListItem, { title: 'Details', multiAction: true, accessibilityRole: 'summary', testID: 'summary-row' });
    assert.equal(info.find('summary-row-primary').props.accessibilityRole, 'summary');
    info.unmount();
});
test('action, informational and multi-action rows cannot acquire a persistent selected state', () => {
    for (const props of [{ onPress() {} }, {}, { multiAction: true, onPress() {}, selectionMode: 'multiple' }]) {
        const host = new Host(ListItem, { title: 'Action', selected: true, testID: 'nonselect-row', ...props });
        const row = host.find(props.multiAction ? 'nonselect-row-primary' : 'nonselect-row');
        assert.equal(row.props.accessibilityState.selected, undefined);
        assert.equal(row.props.accessibilityState.checked, undefined);
        assert.equal(listShape(host).borderRadius, 4);
        assert.equal(
            host.all().some((node) => flatten(node.props.style).backgroundColor === 'secondaryContainer'),
            false
        );
        host.unmount();
    }
});
test('selected disabled painting follows the published figure without multiplying two disabled layers', () => {
    const host = new Host(ListItem, {
        title: 'Choice',
        selected: true,
        selectionMode: 'single',
        disabled: true,
        onPress() {},
        testID: 'disabled-choice',
    });
    const fill = host
        .all()
        .find((node) => node.props.pointerEvents === 'none' && flatten(node.props.style).backgroundColor === 'onSurface');
    assert.equal(flatten(fill.props.style).opacity, 0.1);
    assert.equal(host.find('disabled-choice').props.style.backgroundColor, 'transparent');
    assert.equal(host.find('disabled-choice').props.children.props.style.opacity, 0.38);
    host.unmount();
});
test('the trailing render slot grows and shrinks from content measurements rather than its previous own height', () => {
    const host = new Host(ListItem, {
        title: 'Adaptive action',
        testID: 'slot-row',
        trailing: (props) => jsx('MeasuredAction', { ...props, testID: 'measured-action' }),
    });
    assert.equal(host.find('measured-action').props.height, 56);
    assert.equal(host.find('measured-action').props.style.marginVertical, -10);
    const label = () => host.all().find((node) => node.type === 'View' && node.props.onLayout && node.props.style.flex === 1);
    host.context();
    label().props.onLayout({ nativeEvent: { layout: { height: 84 } } });
    host.flush();
    assert.equal(host.find('measured-action').props.height, 104);
    host.context();
    label().props.onLayout({ nativeEvent: { layout: { height: 24 } } });
    host.flush();
    assert.equal(host.find('measured-action').props.height, 56, 'the previous action height cannot pin the row open');
    host.setProps({ multiAction: true });
    assert.equal(host.find('measured-action').props.style.marginVertical, 0, 'multi-action layout has no outer vertical padding to cancel');
    host.unmount();
});
test('List exposes its own components and supported Paper slots', () => {
    const { Icon, Image, Section, Subheader } = modules['react-native-paper'].List;
    assert.deepEqual(
        { ...PackageList },
        { Accordion: ListAccordion, Collection: ListCollection, Group: ListGroup, Icon, Image, Item: ListItem, Section, Subheader }
    );
});

test('original Accordion retains every rapid toggle and cancels its arrow on unmount', () => {
    const host = new Host(ListAccordion, { title: 'Folder', children: jsx('NestedText'), testID: 'folder' });
    const activate = host.find('folder').props.onPress;
    host.context();
    activate();
    activate();
    host.flush();
    assert.equal(host.find('folder').props.accessibilityState.expanded, false, 'two activations before a render return to closed');
    host.press('folder');
    assert.equal(host.find('folder').props.accessibilityState.expanded, true);
    host.unmount();
    assert.ok(
        host.shared.every((value) => value.animation == null),
        'unmount cancels both item shape and arrow work'
    );
});

test('Accordion keeps the parent/child container, checked child state and disabled header independent', () => {
    const host = new Host(ListAccordion, {
        title: 'Folder',
        description: 'Supplies',
        disabled: true,
        testID: 'rich-folder',
        children: jsx(ListGroup, {
            children: [
                jsx(ListItem, { title: 'Paper', onPress() {}, testID: 'child-paper' }),
                jsx(ListItem, { title: 'Pencils', selected: true, selectionMode: 'multiple', onPress() {}, testID: 'child-pencils' }),
            ],
        }),
    });
    assert.equal(host.find('rich-folder').props.disabled, true);
    host.context();
    host.find('rich-folder').props.onPress();
    host.flush();
    assert.equal(host.exists('child-paper'), false, 'a disabled header cannot expand');
    host.setProps({ disabled: false });
    host.press('rich-folder');
    assert.equal(host.find('child-pencils').props.accessibilityState.checked, true);
    const shapeOf = (testID) => {
        const target = host.find(testID);
        return host.all().find((node) => node.type === 'AnimatedView' && node.props.ref && host.all(node).includes(target));
    };
    assert.equal(
        flatten(shapeOf('child-paper').props.style).borderTopLeftRadius,
        undefined,
        'children join the parent instead of acquiring a second outer top corner'
    );
    assert.equal(flatten(shapeOf('child-pencils').props.style).borderBottomLeftRadius, 16);
    assert.equal(flatten(shapeOf('child-paper').props.style).backgroundColor, 'surfaceContainer');
    host.press('rich-folder');
    assert.equal(host.exists('child-paper'), false);
    host.unmount();
});
test('source stable-position thresholds distinguish indirect/direct/disabled', () => {
    assert.equal(swipeListTarget(60, 800, 204, 358, 'indirect', false), 'open');
    assert.equal(swipeListTarget(250, 800, 204, 358, 'indirect', true), 'primary');
    assert.equal(swipeListTarget(60, 800, 68, 358, 'direct', false), 'primary');
    assert.equal(swipeListTarget(300, 0, 204, 358, 'indirect', false), 'primary');
    assert.equal(swipeListTarget(100, 0, 204, 358, 'indirect', false), 'closed');
    assert.equal(swipeListTarget(110, 0, 204, 358, 'indirect', false), 'open');
    assert.equal(swipeListTarget(340, -800, 204, 358, 'indirect', true), 'closed');
    assert.equal(swipeListTarget(340, 800, 204, 358, 'disabled', true), 'open');
});
test('action geometry grows only primary and keeps stable targets separated', () => {
    for (const leading of [false, true]) {
        const normal = [0, 1, 2].map((index) => swipeActionGeometry(204, 358, 3, index, leading));
        normal.forEach((geometry) => assert.equal(geometry.width, 64));
        assert.equal(normal[1].center - normal[0].center, 68);
        const full = [0, 1, 2].map((index) => swipeActionGeometry(358, 358, 3, index, leading));
        full.forEach((geometry, index) => {
            const primary = leading ? index === 0 : index === 2;
            assert.equal(geometry.width, primary ? 334 : 6);
            assert.equal(geometry.opacity, primary ? 1 : 0);
        });
    }
});
test('indirect reveal does not execute; second swipe commits final trailing action once', () => {
    const called = [];
    const { host } = rowHost({
        trailingSwipeMode: 'indirect',
        trailingActions: [action('save', () => called.push('save')), action('read'), action('delete', () => called.push('delete'))],
    });
    swipe(host, -90, -800).settled();
    assert.equal(host.offset(), -204);
    assert.deepEqual(called, []);
    swipe(host, -100, -800).complete();
    assert.deepEqual(called, []);
    host.deliver();
    assert.deepEqual(called, ['delete']);
    assert.equal(host.offset(), 0);
    host.deliver();
    assert.deepEqual(called, ['delete']);
});
test('direct leading swipe commits while ordinary revealed action uses latest callback', () => {
    const called = [];
    const { host, ref } = rowHost({ leadingSwipeMode: 'direct', leadingActions: [action('archive', () => called.push('old'))] });
    swipe(host, 220).complete();
    host.setProps({ leadingActions: [action('archive', () => called.push('current'))] }).deliver();
    assert.deepEqual(called, ['current']);
    ref.current.open('leading');
    host.settled().press('row-leading-archive');
    assert.deepEqual(called, ['current', 'current']);
    assert.equal(host.offset(), 0);
});
test('close/reopen/close discards an already queued primary completion', () => {
    let called = 0;
    const { host, ref } = rowHost({ trailingSwipeMode: 'direct', trailingActions: [action('delete', () => called++)] });
    swipe(host, -250).complete();
    ref.current.close();
    ref.current.open('trailing');
    ref.current.close();
    host.deliver().settled();
    assert.equal(called, 0);
    assert.equal(host.offset(), 0);
});
test('grabbing and cancelling an open row returns to its prior stable position', () => {
    const { host, ref } = rowHost({ trailingActions: [action('save'), action('read')] });
    ref.current.open('trailing');
    host.settled();
    host.pan('onActivate').pan('onUpdate', { translationX: 80 }).pan('onFinalize', { canceled: true }).settled();
    assert.equal(host.offset(), -136);
    host.press('row-close').settled();
    assert.equal(host.offset(), 0);
});
test('UI coordinator closes peer rows and explicit closeAll', () => {
    const a = { current: null },
        b = { current: null },
        group = { current: null };
    const Pair = () =>
        jsx(SwipeListGroup, {
            ref: group,
            children: ['a', 'b'].map((id, index) =>
                jsx(
                    SwipeListItem,
                    { id, testID: id, ref: index ? b : a, trailingActions: [action('save')], children: jsx('OriginalRow') },
                    id
                )
            ),
        });
    const host = new Host(Pair, {}).layout('a').layout('b');
    a.current.open('trailing');
    host.reactions().settled();
    assert.equal(host.offset('a'), -68);
    b.current.open('trailing');
    host.reactions().settled();
    assert.equal(host.offset('a'), 0);
    assert.equal(host.offset('b'), -68);
    group.current.closeAll();
    host.reactions().settled();
    assert.equal(host.offset('b'), 0);
});
test('RTL reverses physical drag but retains logical action ordering', () => {
    direction = 'rtl';
    try {
        const called = [];
        const { host } = rowHost({
            trailingSwipeMode: 'indirect',
            trailingActions: [action('save'), action('delete', () => called.push('delete'))],
        });
        swipe(host, 100, 800).settled();
        assert.equal(host.offset(), 136);
        assert.deepEqual(called, []);
        host.press('row-trailing-delete');
        assert.deepEqual(called, ['delete']);
    } finally {
        direction = 'ltr';
    }
});
test('disable, geometry change and disposal invalidate old gesture callbacks', () => {
    let called = 0;
    const { host, ref } = rowHost({ trailingSwipeMode: 'direct', trailingActions: [action('delete', () => called++)] });
    swipe(host, -250).complete();
    host.setProps({ disabled: true }).deliver();
    assert.equal(called, 0);
    const gesture = host.all().find((element) => element.type === 'GestureDetector').props.gesture;
    assert.equal(gesture.enabled, false);
    host.setProps({ disabled: false });
    ref.current.open('trailing');
    host.settled().layout('row', 500);
    assert.equal(host.offset(), 0);
    swipe(host, -350).complete();
    host.unmount();
    host.deliver();
    assert.equal(called, 0);
});
test('disabled primary cannot commit and hidden/dragging action callbacks cannot run', () => {
    let called = 0;
    const { host, ref } = rowHost({
        trailingSwipeMode: 'indirect',
        trailingActions: [action('save', () => called++), action('delete', () => called++, { disabled: true })],
    });
    host.find('row-trailing-save').props.onPress();
    assert.equal(called, 0);
    swipe(host, -340, -900).settled();
    assert.equal(host.offset(), -136);
    assert.equal(called, 0);
    host.pan('onActivate');
    host.find('row-trailing-save').props.onPress();
    assert.equal(called, 0);
    host.pan('onFinalize', { canceled: true }).settled();
    ref.current.close();
    host.settled();
});
test('action arrays that cannot fit their real targets require a consumer menu instead of an invented overflow row', () => {
    const { host } = rowHost({ trailingActions: [action('save'), action('read'), action('delete')] });
    assert.throws(() => host.layout('row', 160), /need 204dp/);
});
test('provider reduced motion settles without a second OS override', () => {
    theme.animation.scale = 0;
    try {
        const { host } = rowHost({ trailingActions: [action('save')] });
        swipe(host, -60).deliver();
        assert.equal(host.offset(), -68);
        assert.ok(host.exists('row-close'));
    } finally {
        theme.animation.scale = 1;
    }
});
test('native deferred RN writes still publish imperative spring completion and accessibility', () => {
    const states = [];
    const { host, ref } = rowHost({ trailingActions: [action('save'), action('delete')], onOpenChange: (side) => states.push(side) });
    deferredUI = true;
    try {
        host.context();
        ref.current.open('trailing');
        host.drainUI().complete().deliver();
        assert.ok(host.exists('row-close'), 'a completed imperative open publishes its React open state');
        const actions = host.all().filter((element) => element.props.importantForAccessibility === 'auto' && element.props.animatedProps);
        assert.equal(actions.length, 1, 'only the revealed action bar is exposed to accessibility');
        assert.equal(actions[0].props.accessibilityElementsHidden, false);
        assert.deepEqual(states, ['trailing']);
        host.context();
        ref.current.close();
        host.drainUI().complete().deliver();
        assert.ok(!host.exists('row-close'));
        assert.deepEqual(states, ['trailing', null]);
    } finally {
        deferredUI = false;
    }
});
test('new RN commands reject an older UI completion before pending UI writes execute', () => {
    const states = [];
    const { host, ref } = rowHost({ trailingActions: [action('save')], onOpenChange: (side) => states.push(side) });
    deferredUI = true;
    try {
        host.context();
        ref.current.open('trailing');
        host.drainUI().complete();
        // The old UI→RN open completion is already queued. A newer close/open/
        // close command has not reached UI yet, so shared revision alone cannot
        // distinguish it. The RN command epoch must reject that old publication.
        host.context();
        ref.current.close();
        ref.current.open('trailing');
        ref.current.close();
        host.deliver();
        assert.ok(!host.exists('row-close'));
        assert.deepEqual(states, []);
        host.drainUI().complete().deliver();
        assert.equal(host.offset(), 0);
        assert.deepEqual(states, []);
    } finally {
        deferredUI = false;
    }
});
console.log(`Verified ${cases} list behavior cases with actual controller TSX and explicit native/animation boundaries.`);
