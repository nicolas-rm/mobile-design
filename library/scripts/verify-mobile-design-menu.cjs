/**
 * node scripts/verify-mobile-design-menu.cjs
 * Runs the actual Menu controller with explicit React/native/Popup/TextField doubles.
 * Checks filtering, selection/dismissal chains, submenu levels, slots and overflow policy.
 * Native measurement, focus traversal, modal stacking, Reanimated physics and pixels are
 * outside this harness. popupPosition has its separate pure geometry verification.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
let active,
    nextID = 0;
const platform = { OS: 'ios' };
let windowSize = { width: 390, height: 844 };
const theme = {
    animation: { scale: 1 },
    colors: Object.fromEntries(
        [
            'surfaceContainerLow',
            'surfaceContainer',
            'tertiaryContainer',
            'onTertiaryContainer',
            'tertiary',
            'onTertiary',
            'secondaryContainer',
            'onSecondaryContainer',
            'onSurface',
            'onSurfaceVariant',
            'outlineVariant',
            'stateLayerPressed',
            'secondary',
        ].map((key) => [key, key])
    ),
    motion: { spring: { fast: { spatial: { stiffness: 800, damping: 0.6 } }, default: { spatial: { stiffness: 380, damping: 0.8 } } } },
};
const jsx = (type, props = {}, key) => ({ type, props, key });
function slot(create) {
    const index = active.cursor++;
    return active.hooks[index] ?? (active.hooks[index] = create());
}
const React = {
    Fragment: 'Fragment',
    createContext(current) {
        const context = { current };
        context.Provider = { context };
        return context;
    },
    useContext: (context) => context.current,
    useId: () => slot(() => `id-${++nextID}`),
    useRef: (current) => slot(() => ({ current })),
    useCallback: (callback, deps) => React.useMemo(() => callback, deps),
    useImperativeHandle(ref, create, deps = []) {
        React.useEffect(() => {
            const value = create();
            if (typeof ref === 'function') ref(value);
            else if (ref) ref.current = value;
            return () => {
                if (typeof ref === 'function') ref(null);
                else if (ref) ref.current = null;
            };
        }, [ref, ...deps]);
    },
    useState(initial) {
        const owner = active,
            state = slot(() => ({ value: typeof initial === 'function' ? initial() : initial }));
        return [
            state.value,
            (value) => {
                assert.ok(!owner.disposed);
                value = typeof value === 'function' ? value(state.value) : value;
                if (!Object.is(value, state.value)) {
                    state.value = value;
                    owner.host.dirty = true;
                }
            },
        ];
    },
    useMemo(create, deps) {
        const state = slot(() => ({}));
        if (
            !state.deps ||
            !deps ||
            state.deps.length !== deps.length ||
            state.deps.some((value, index) => !Object.is(value, deps[index]))
        ) {
            state.deps = deps;
            state.value = create();
        }
        return state.value;
    },
    useEffect(create, deps) {
        const owner = active;
        const effect = slot(() => ({}));
        if (!effect.deps || !deps || effect.deps.length !== deps.length || effect.deps.some((value, index) => !Object.is(value, deps[index]))) {
            effect.deps = deps;
            owner.host.effects.push(() => {
                effect.cleanup?.();
                effect.cleanup = create();
            });
        }
    },
    Children: { toArray: (children) => [children].flat(Infinity).filter((child) => child != null && child !== false) },
    isValidElement: (child) => Boolean(child && typeof child === 'object' && 'type' in child),
    cloneElement: (child, props) => ({ ...child, key: props.key ?? child.key, props: { ...child.props, ...props } }),
};
React.useLayoutEffect = React.useEffect;
const builder = new Proxy({}, { get: () => () => builder });
function Popup(props) {
    return jsx('PopupBoundary', { children: [props.anchor, props.visible ? jsx('PopupLayer', { ...props, anchor: undefined }) : null] });
}
const modules = {
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': { View: 'View', Platform: platform, useWindowDimensions: () => windowSize },
    'react-native-paper': { Icon: 'Icon', Text: 'Text', TouchableRipple: 'TouchableRipple', useLocale: () => ({ direction: 'ltr' }) },
    'react-native-reanimated': {
        View: 'AnimatedView',
        LinearTransition: builder,
        ReduceMotion: { Never: 'never' },
        useSharedValue: (initial) =>
            slot(() => ({
                current: initial,
                get() {
                    return this.current;
                },
                set(value) {
                    this.current = value?.to ?? value;
                },
            })),
        useAnimatedStyle: (compute) => ({ compute }),
        withSpring: (to, config) => ({ to, config }),
        cancelAnimation() {},
    },
    '../core': { useMobileTheme: () => theme },
    '../color': { withAlpha: (color, alpha) => `${color}/${alpha}` },
    './popup': { AnchoredPopup: Popup },
    './text-field': { TextField: (props) => jsx('FilterField', props) },
    './button': { Button: 'Button' },
    './icon-button': { IconButton: 'IconButton' },
    './content': { Chip: 'Chip', Divider: 'Divider' },
};
const file = path.join(root, 'packages/mobile-design/src/components/menu.tsx');
// The adapter changes only the native ref type; its runtime value is Paper's control.
modules['../ripple'] = { TouchableRipple: modules['react-native-paper'].TouchableRipple };
const focusOrder = {};
vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(root, 'packages/mobile-design/src/components/focus-order.ts'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports: focusOrder }
);
modules['./focus-order'] = focusOrder;
const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const exported = {};
vm.runInNewContext(
    output,
    {
        exports: exported,
        // Browser-only focus effects are outside this render/selection harness.
        document: { activeElement: null },
        HTMLElement: class HTMLElement {},
        require(request) {
            assert.ok(modules[request], `explicit boundary ${request}`);
            return modules[request];
        },
    },
    { filename: file }
);
const { Menu } = exported;
const typeIDs = new WeakMap();
class Host {
    constructor(props) {
        Object.assign(this, { props, nodes: new Map(), effects: [], dirty: false });
        this.flush();
    }
    render(element, key = 'root') {
        if (element == null || typeof element !== 'object') return element;
        if (Array.isArray(element)) return element.map((child, index) => this.render(child, `${key}.${index}`));
        if (element.type?.context) {
            const context = element.type.context,
                previous = context.current;
            context.current = element.props.value;
            const children = this.render(element.props.children, `${key}.provider`);
            context.current = previous;
            return { ...element, type: 'Provider', props: { ...element.props, children } };
        }
        if (typeof element.type === 'function') {
            if (!typeIDs.has(element.type)) typeIDs.set(element.type, ++nextID);
            const id = `${key}:${typeIDs.get(element.type)}:${element.key ?? ''}`;
            if (!this.nodes.has(id)) this.nodes.set(id, { host: this, hooks: [] });
            const owner = this.nodes.get(id),
                previous = active;
            Object.assign(owner, { cursor: 0, seen: true });
            active = owner;
            const output = element.type(element.props);
            active = previous;
            return this.render(output, id);
        }
        return { ...element, props: { ...element.props, children: this.render(element.props.children, `${key}.child`) } };
    }
    flush() {
        let iterations = 0;
        do {
            assert.ok(++iterations < 20, 'state/effect updates settle');
            this.dirty = false;
            for (const owner of this.nodes.values()) owner.seen = false;
            this.tree = this.render(jsx(Menu, this.props));
            this.effects.splice(0).forEach((create) => create());
            for (const [id, owner] of this.nodes)
                if (!owner.seen) {
                    owner.hooks.forEach((hook) => hook.cleanup?.());
                    owner.disposed = true;
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
    find(testID) {
        const element = this.all().find((element) => element.props.testID === testID);
        assert.ok(element, testID);
        return element;
    }
    exists(testID) {
        return this.all().some((element) => element.props.testID === testID);
    }
    press(id) {
        this.find(id).props.onPress();
        return this.flush();
    }
    setProps(props) {
        this.props = { ...this.props, ...props };
        return this.flush();
    }
    unmount() {
        for (const owner of this.nodes.values()) {
            owner.hooks.forEach((hook) => hook.cleanup?.());
            owner.disposed = true;
        }
        this.nodes.clear();
        this.tree = null;
    }
}
let cases = 0;
function test(name, run) {
    run();
    cases++;
    console.log(`PASS ${name}`);
}
const item = (id, title, props = {}) => jsx(Menu.Item, { title, testID: id, ...props }, id);
function hostProps(extra = {}) {
    return { visible: true, anchor: jsx('Button'), onDismiss() {}, testID: 'menu', ...extra };
}
function gapCount(host) {
    return host.all().filter((element) => element.type === 'View' && element.props.style?.height === 2).length;
}
function flatStyle(style) {
    if (Array.isArray(style)) return Object.assign({}, ...style.map(flatStyle));
    return style?.compute ? style.compute() : style ?? {};
}
function rowShape(host, id) {
    return flatStyle(host.all().filter((node) => node.type === 'AnimatedView' && host.all(node).some((child) => child.props.testID === id)).at(-1).props.style);
}

test('filtering is accent-insensitive and removes empty groups and separators', () => {
    const host = new Host(
        hostProps({
            filterable: true,
            children: [
                jsx(Menu.Group, { label: 'Drinks', children: [item('cafe', 'Café'), item('tea', 'Tea')] }, 'drinks'),
                jsx(Menu.Group, { label: 'Food', children: [item('bread', 'Bread')] }, 'food'),
            ],
        })
    );
    host.find('menu-filter').props.onChangeText('cafe');
    host.flush();
    assert.ok(host.exists('cafe'));
    assert.ok(!host.exists('tea'));
    assert.ok(!host.exists('bread'));
    host.find('menu-filter').props.onChangeText('xyz');
    host.flush();
    assert.ok(host.exists('menu-empty'));
});
test('controlled filter requests a value without replacing the owner value', () => {
    const queries = [];
    const host = new Host(
        hostProps({
            filterable: true,
            filterValue: 'Tea',
            onFilterChange: (value) => queries.push(value),
            children: [item('tea', 'Tea'), item('coffee', 'Coffee')],
        })
    );
    host.find('menu-filter').props.onChangeText('Coffee');
    host.flush();
    assert.deepEqual(queries, ['Coffee']);
    assert.ok(host.exists('tea'));
    assert.ok(!host.exists('coffee'));
});
test('fragments preserve filtering and group end shapes', () => {
    const host = new Host(hostProps({ filterable: true, layout: 'grouped', children: jsx('Fragment', { children: [
        jsx(Menu.Group, { children: jsx('Fragment', { children: [item('a', 'Apple'), item('b', 'Banana')] }) }),
        jsx(Menu.Group, { children: item('c', 'Coffee') }),
    ] }) }));
    assert.equal(gapCount(host), 1);
    assert.equal(rowShape(host, 'a').borderTopLeftRadius, 12);
    assert.equal(rowShape(host, 'b').borderBottomLeftRadius, 12);
    host.find('menu-filter').props.onChangeText('Coffee');
    host.flush();
    assert.ok(host.exists('c'));
    assert.ok(!host.exists('a'));
    assert.equal(rowShape(host, 'c').borderTopLeftRadius, 12);
    assert.equal(rowShape(host, 'c').borderBottomLeftRadius, 12);
});
test('action/single selection dismiss while multi-selection stays open and disabled is inert', () => {
    let dismisses = 0,
        actions = 0;
    const host = new Host(
        hostProps({
            onDismiss: () => dismisses++,
            children: [
                item('action', 'Action', { onPress: () => actions++ }),
                item('single', 'Single', { selectionMode: 'single' }),
                item('multi', 'Multi', { selectionMode: 'multiple' }),
                item('disabled', 'Disabled', { disabled: true, onPress: () => actions++ }),
            ],
        })
    );
    host.press('multi');
    assert.equal(dismisses, 0);
    host.press('single');
    host.press('action');
    assert.equal(host.find('disabled').props.onPress, undefined, 'disabled rows have no press handler');
    assert.equal(host.find('disabled').props.accessibilityState.disabled, true);
    assert.equal(dismisses, 2);
    assert.equal(actions, 1);
});
test('submenus select through the dismissal chain but Back closes one level only', () => {
    let dismisses = 0;
    const host = new Host(
        hostProps({
            onDismiss: () => dismisses++,
            children: jsx(Menu.Submenu, { title: 'More', testID: 'more', children: item('nested-action', 'Nested') }),
        })
    );
    host.press('more');
    assert.equal(host.find('more-popup').props.placement, 'below');
    host.find('more-popup').props.onDismiss();
    host.flush();
    assert.ok(!host.exists('more-popup'));
    assert.equal(dismisses, 0);
    host.press('more').press('nested-action');
    assert.ok(!host.exists('more-popup'));
    assert.equal(dismisses, 1);
});
test('wide submenus use the logical side and keep only one sibling open', () => {
    windowSize = { width: 844, height: 800 };
    try {
        const host = new Host(
            hostProps({
                children: [
                    jsx(Menu.Submenu, { title: 'First', testID: 'first', children: item('one', 'One') }),
                    jsx(Menu.Submenu, { title: 'Second', testID: 'second', children: item('two', 'Two') }),
                ],
            })
        );
        host.press('first');
        assert.equal(host.find('first-popup').props.placement, 'side');
        host.press('second');
        assert.ok(!host.exists('first-popup'));
        assert.ok(host.exists('second-popup'));
    } finally {
        windowSize = { width: 390, height: 844 };
    }
});
test('an expanded submenu is active without becoming a selected command', () => {
    const host = new Host(hostProps({ children: jsx(Menu.Submenu, { title: 'More', testID: 'more', children: item('nested', 'Nested') }) }));
    host.press('more');
    const trigger = host.find('more');
    assert.equal(trigger.props.accessibilityState.expanded, true);
    assert.equal(trigger.props.accessibilityState.selected, undefined);
});
test('grouped gaps stop at two and become dividers for overflow or web', () => {
    const groups = Array.from({ length: 4 }, (_, index) => jsx(Menu.Group, { children: item(`group-${index}`, `Group ${index}`) }, index));
    const host = new Host(hostProps({ layout: 'grouped', children: groups }));
    assert.equal(gapCount(host), 2);
    assert.equal(gapCount(new Host(hostProps({ variant: 'baseline', layout: 'grouped', children: groups }))), 0);
    host.find('menu').props.onOverflowChange(true);
    host.flush();
    assert.equal(gapCount(host), 0);
    platform.OS = 'web';
    try {
        assert.equal(gapCount(new Host(hostProps({ layout: 'grouped', children: groups }))), 0);
    } finally {
        platform.OS = 'ios';
    }
});
test('expressive selection uses a clipped 12dp shape while baseline stays square', () => {
    const host = new Host(hostProps({ children: item('selected', 'Selected', { selected: true, position: 'only', style: { overflow: 'visible' } }) }));
    const shape = rowShape(host, 'selected');
    assert.equal(shape.borderRadius, 12);
    assert.equal(shape.borderTopLeftRadius, 12);
    assert.equal(shape.overflow, 'hidden');
    assert.equal(host.find('selected').props.style.minHeight, 48);
    host.setProps({ variant: 'baseline' });
    assert.equal(rowShape(host, 'selected').borderRadius, 0);
    assert.equal(rowShape(host, 'selected').borderTopLeftRadius, undefined);
});
test('press and focus morph the same row without replacing the native ripple', () => {
    const host = new Host(hostProps({ children: item('row', 'Row') }));
    assert.equal(rowShape(host, 'row').borderRadius, 4);
    assert.equal(host.find('row').type, 'TouchableRipple');
    host.find('row').props.onPressIn();
    host.flush();
    assert.equal(rowShape(host, 'row').borderRadius, 12);
    assert.equal(host.find('row').props.rippleColor, 'onSurface/0.1');
    host.find('row').props.onPressOut();
    host.flush();
    assert.equal(rowShape(host, 'row').borderRadius, 4);
    host.find('row').props.onFocus();
    host.flush();
    assert.equal(rowShape(host, 'row').borderRadius, 12);
});
test('trailing selection preserves the leading symbol and MD3 text roles', () => {
    const host = new Host(hostProps({ children: item('business', 'Business', {
        selected: true, selectionMode: 'single', selectionIndicatorPosition: 'trailing', leadingIcon: 'business_center',
        supportingText: 'Company number', trailingText: 'Default',
    }) }));
    const nodes = host.all(host.find('business'));
    assert.deepEqual(nodes.filter((node) => node.type === 'Icon').map((node) => node.props.source), ['business_center', 'check']);
    assert.deepEqual(nodes.filter((node) => node.type === 'Text').map((node) => node.props.variant), ['labelLarge', 'bodySmall', 'labelLarge']);
    assert.equal(host.find('business').props.accessibilityState.checked, true);
});
test('retained events cannot act after disabling, closing, reopening or unmounting', () => {
    let actions = 0, dismisses = 0;
    const row = (disabled = false) => item('row', 'Row', { disabled, onPress: () => actions++ });
    const host = new Host(hostProps({ children: row(), onDismiss: () => dismisses++ }));
    const old = host.find('row').props;
    host.setProps({ children: row(true) });
    old.onPress(); old.onPressIn(); old.onFocus();
    host.flush();
    assert.equal(actions, 0);
    host.setProps({ children: row() });
    const open = host.find('row').props;
    const oldDismiss = host.find('menu').props.onDismiss;
    host.setProps({ visible: false }).setProps({ visible: true });
    open.onPress(); open.onPressIn(); oldDismiss();
    host.flush();
    assert.equal(actions, 0);
    assert.equal(dismisses, 0);
    host.press('row');
    assert.equal(actions, 1);
    assert.equal(dismisses, 1);
    const latest = host.find('row').props;
    const dismiss = host.find('menu').props.onDismiss;
    host.unmount();
    latest.onPress(); latest.onPressIn(); latest.onFocus(); dismiss();
    assert.equal(actions, 1);
    assert.equal(dismisses, 1);
});
test('visual slots remain decorative and leave one row action', () => {
    let actions = 0;
    const host = new Host(
        hostProps({
            children: item('slot-row', 'Blue', {
                content: jsx('ColorSwatch', { testID: 'swatch' }),
                leading: jsx('Image'),
                trailing: jsx('Progress'),
                onPress: () => actions++,
            }),
        })
    );
    const slot = host
        .all()
        .find(
            (element) =>
                element.props.pointerEvents === 'none' &&
                element.props.importantForAccessibility === 'no-hide-descendants' &&
                host.all(element).some((child) => child.props.testID === 'swatch')
        );
    assert.ok(slot, 'custom content does not introduce another pointer/AX action');
    assert.equal(host.find('slot-row').props.accessibilityLabel, 'Blue');
    host.press('slot-row');
    assert.equal(actions, 1);
});
test('reduced motion disables positional layout transitions', () => {
    theme.animation.scale = 0;
    try {
        const host = new Host(hostProps({ filterable: true, children: [item('a', 'A'), item('b', 'B')] }));
        assert.ok(
            host
                .all()
                .filter((element) => element.type === 'AnimatedView')
                .every((element) => element.props.layout === undefined)
        );
    } finally {
        theme.animation.scale = 1;
    }
});
test('web decorative slots block nested focus and submenu triggers expose expansion', () => {
    platform.OS = 'web';
    try {
        const host = new Host(hostProps({ children: [
            item('slot-row', 'Blue', { leading: jsx('NestedButton', { testID: 'nested-control' }) }),
            jsx(Menu.Submenu, { title: 'More', testID: 'more', children: item('nested', 'Nested') }),
        ] }));
        const boundary = host.all().find((node) => node.props.inert && host.all(node).some((child) => child.props.testID === 'nested-control'));
        assert.ok(boundary);
        assert.equal(boundary.props['aria-hidden'], true);
        assert.equal(host.find('more').props['aria-haspopup'], 'menu');
        assert.equal(host.find('more').props['aria-expanded'], false);
        host.press('more');
        assert.equal(host.find('more').props['aria-expanded'], true);
        assert.equal(host.find('more').props['aria-selected'], undefined);
    } finally {
        platform.OS = 'ios';
    }
});
console.log(`OK: ${cases} Menu controller cases; explicit Popup/native boundaries, no native focus/visual claims.`);
