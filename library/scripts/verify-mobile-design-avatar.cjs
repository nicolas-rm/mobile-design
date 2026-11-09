/**
 * Executes the exported AvatarButton with bounded React/Paper doubles. Checks
 * circular indication, state precedence, disabling and callback contracts.
 * Native ripple pixels, pointer hit-testing and keyboard focus need a device.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
let active,
    cases = 0;
const theme = { colors: { onSurface: '#1d1b20', stateLayerPressed: '#00000019' } };
const same = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
const hook = (create) => {
    const index = active.cursor++;
    return active.hooks[index] ?? (active.hooks[index] = create());
};
const React = {
    useState(initial) {
        const owner = active,
            slot = hook(() => ({ value: initial }));
        return [
            slot.value,
            (value) => {
                if (!Object.is(slot.value, value)) {
                    slot.value = value;
                    owner.dirty = true;
                }
            },
        ];
    },
    useEffect(create, dependencies) {
        const slot = hook(() => ({}));
        if (!same(slot.dependencies, dependencies)) {
            slot.dependencies = dependencies;
            active.effects.push(create);
        }
    },
};
const jsx = (type, props) => ({ type, props: props ?? {} });
const PaperAvatar = { Icon: 'PaperAvatarIcon', Image: 'PaperAvatarImage', Text: 'PaperAvatarText' };
const modules = {
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', StyleSheet: { absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } } },
    'react-native-paper': { Avatar: PaperAvatar, TouchableRipple: 'TouchableRipple' },
    '../core': { useMobileTheme: (override) => override ?? theme },
    '../color': { withAlpha: (color, opacity) => `${color}@${opacity}` },
};
const exportsObject = {};
vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(root, 'packages/mobile-design/src/components/avatar.tsx'), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    {
        exports: exportsObject,
        require(name) {
            const platformBoundary = require('./mobile-design-native-boundaries.cjs')(name, modules);
            if (platformBoundary) return platformBoundary;
            assert.ok(modules[name], `explicit boundary: ${name}`);
            return modules[name];
        },
    }
);
const { Avatar, AvatarButton } = exportsObject;
class Host {
    constructor(props = {}) {
        this.hooks = [];
        this.render({
            accessibilityLabel: 'Open account',
            onPress() {},
            children: jsx(PaperAvatar.Text, { label: 'A', size: 32 }),
            ...props,
        });
    }
    render(props = this.props) {
        this.props = props;
        let passes = 0;
        do {
            assert.ok(passes++ < 10);
            active = this;
            this.cursor = 0;
            this.dirty = false;
            this.effects = [];
            this.tree = AvatarButton(props);
            this.effects.forEach((create) => create());
        } while (this.dirty);
        return this;
    }
    event(name, event = {}) {
        this.tree.props[name](event);
        return this.render();
    }
}
const flatten = (value) =>
    Array.isArray(value) ? value.reduce((result, entry) => Object.assign(result, flatten(entry)), {}) : (value ?? {});
const find = (node, testID) => {
    if (!node) return undefined;
    if (Array.isArray(node)) return node.map((entry) => find(entry, testID)).find(Boolean);
    return node.props?.testID === testID ? node : find(node.props?.children, testID);
};
const layer = (host) => find(host.tree, 'mobile-avatar-button-state-layer');
const check = (name, run) => {
    try {
        run();
        cases += 1;
    } catch (error) {
        error.message = `${name}: ${error.message}`;
        throw error;
    }
};

check('visual avatar API remains Paper and never becomes implicitly interactive', () => {
    assert.equal(Avatar.Text, PaperAvatar.Text);
    assert.equal(Avatar.Image, PaperAvatar.Image);
    assert.equal(Avatar.Icon, PaperAvatar.Icon);
    assert.equal(Avatar.Button, AvatarButton);
    assert.equal(PaperAvatar.Button, undefined, 'Paper namespace is not mutated');
});
check('a 32dp avatar has one circular 48dp target with clipped feedback', () => {
    const host = new Host({ style: { marginStart: 12 } });
    assert.equal(host.tree.type, 'TouchableRipple');
    const style = flatten(host.tree.props.style);
    for (const [name, expected] of Object.entries({ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', marginStart: 12 }))
        assert.equal(style[name], expected, name);
    assert.equal(host.tree.props.borderless, false);
    assert.equal(host.tree.props.rippleColor, '#1d1b20@0.1');
    assert.equal(host.tree.props.accessibilityLabel, 'Open account');
    assert.equal(host.tree.props.accessibilityRole, 'button');
    assert.equal(host.tree.props.children.props.pointerEvents, 'none');
    assert.equal(host.tree.props.children.props.importantForAccessibility, 'no-hide-descendants');
    assert.equal(layer(host), undefined);
});
check('hover/focus share one circular state layer and focus takes precedence', () => {
    const host = new Host().event('onHoverIn');
    assert.equal(flatten(layer(host).props.style).opacity, 0.08);
    host.event('onFocus');
    assert.equal(flatten(layer(host).props.style).opacity, 0.1);
    assert.equal(flatten(layer(host).props.style).borderRadius, 24);
    host.event('onBlur');
    assert.equal(flatten(layer(host).props.style).opacity, 0.08);
    host.event('onHoverOut');
    assert.equal(layer(host), undefined);
});
check('press removes hover/focus overlays while retaining circular geometry', () => {
    const host = new Host().event('onHoverIn').event('onFocus').event('onPressIn');
    assert.equal(layer(host), undefined, 'Paper owns the sole press indication');
    assert.equal(flatten(host.tree.props.style).borderRadius, 24, 'avatars never morph into rounded squares');
    host.event('onPressOut');
    assert.equal(flatten(layer(host).props.style).opacity, 0.1, 'release restores current focus');
    host.event('onBlur').event('onHoverOut');
    assert.equal(layer(host), undefined, 'all feedback clears after leaving interaction');
});
check('caller receives original press, hover, focus, long-press and layout events', () => {
    const received = [];
    const callbacks = Object.fromEntries(
        ['onPress', 'onPressIn', 'onPressOut', 'onHoverIn', 'onHoverOut', 'onFocus', 'onBlur', 'onLongPress', 'onLayout'].map((name) => [
            name,
            (event) => received.push([name, event]),
        ])
    );
    const host = new Host(callbacks);
    for (const name of Object.keys(callbacks)) {
        const event = { name };
        host.event(name, event);
        assert.equal(received.at(-1)[0], name);
        assert.equal(received.at(-1)[1], event);
    }
    assert.equal(received.length, Object.keys(callbacks).length);
});
check('disable during a press clears stale state before re-enabling', () => {
    let presses = 0;
    const host = new Host({ onPress: () => presses++, accessibilityState: { busy: true } })
        .event('onHoverIn')
        .event('onFocus')
        .event('onPressIn');
    host.render({ ...host.props, disabled: true });
    assert.equal(layer(host), undefined);
    assert.equal(host.tree.props.disabled, true);
    assert.equal(host.tree.props.accessibilityState.disabled, true);
    assert.equal(host.tree.props.accessibilityState.busy, true);
    assert.equal(flatten(host.tree.props.style).opacity, 0.38);
    host.event('onPress').event('onPressIn').event('onHoverIn').event('onFocus');
    assert.equal(presses, 0);
    host.render({ ...host.props, disabled: false });
    assert.equal(layer(host), undefined, 're-enable does not resurrect the previous hover or focus');
    host.event('onPress');
    assert.equal(presses, 1);
});
check('custom indication colors, theme and external layout props reach the shared host', () => {
    const override = { colors: { onSurface: '#112233', stateLayerPressed: '#445566' } };
    const host = new Host({
        theme: override,
        rippleColor: '#abcdef',
        underlayColor: '#fedcba',
        style: { marginTop: 8, backgroundColor: '#ffeedd' },
        testID: 'account',
    });
    assert.equal(host.tree.props.theme, override);
    assert.equal(host.tree.props.rippleColor, '#abcdef');
    assert.equal(host.tree.props.underlayColor, '#fedcba');
    assert.equal(flatten(host.tree.props.style).backgroundColor, '#ffeedd');
    host.event('onHoverIn');
    assert.equal(flatten(find(host.tree, 'account-state-layer').props.style).backgroundColor, '#112233');
});

console.log(`PASS: ${cases} shared avatar interaction cases. Native pixels and focus are not simulated.`);
