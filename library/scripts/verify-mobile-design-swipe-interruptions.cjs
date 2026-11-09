/**
 * Regression cases for the real SwipeListItem controller. Reuse only the
 * existing list suite's explicit React/GH/Reanimated bootstrap, without its
 * scenarios or example-screen imports. This is a lifecycle/geometry contract,
 * not native gesture recognition, rendered pixels, accessibility service or FPS.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const harnessFile = path.join(__dirname, 'verify-mobile-design-lists.cjs');
const source = fs.readFileSync(harnessFile, 'utf8');
const boundary = source.indexOf('\ntest(');
assert.ok(boundary > 0, 'the shared test bootstrap is distinct from its scenario cases');
const bootstrap = source.slice(0, boundary);

function regressions() {
    test('direct mode rejects multiple actions rather than silently changing their interaction', () => {
        assert.throws(
            () => rowHost({ leadingSwipeMode: 'direct', leadingActions: [action('archive'), action('save')] }),
            /direct swipe requires exactly one action/
        );
        const { host } = rowHost({ leadingSwipeMode: 'direct', leadingActions: [] });
        host.layout('row', 48).settled();
        assert.equal(host.offset(), 0, 'an empty action collection remains valid and closed');
        host.unmount();
    });
    test('revealed actions must fit without losing callbacks, adding controls or shrinking targets', () => {
        const { host, ref } = rowHost({ trailingActions: [action('save'), action('read'), action('delete')] });
        host.layout('row', 204);
        ref.current.open('trailing');
        host.settled();
        assert.equal(host.offset(), -204);
        assert.ok(!host.exists('row-overflow-close'));
        assert.ok(!host.exists('row-trailing-overflow'));
        assert.throws(() => host.layout('row', 200), /need 204dp but the row has 200dp/);
        host.unmount();
    });
    test('zero-width first layout defers geometry validation until a valid measurement', () => {
        const ref = { current: null };
        const host = new Host(SwipeListItem, {
            ref,
            id: 'row',
            testID: 'row',
            trailingActions: [action('save'), action('read'), action('delete')],
            children: jsx('OriginalRow'),
        });
        assert.doesNotThrow(() => host.layout('row', 0));
        assert.throws(() => host.layout('row', 160), /need 204dp but the row has 160dp/);
        host.unmount();
    });
    test('changing the primary swipe mode revokes a completion already queued for RN', () => {
        let calls = 0;
        const { host } = rowHost({ leadingSwipeMode: 'direct', leadingActions: [action('archive', () => calls++)] });
        swipe(host, 280).complete();
        host.setProps({ leadingSwipeMode: 'disabled' }).deliver();
        assert.equal(calls, 0, 'a prior full swipe cannot commit after full swipe is disabled');
        assert.equal(host.offset(), 0);
        host.unmount();
    });
    test('turning on reduced motion during a settle finishes its selected destination immediately', () => {
        const { host, ref } = rowHost({ trailingActions: [action('save')] });
        ref.current.open('trailing');
        assert.ok(host.shared.some((shared) => shared.animation));
        theme.animation.scale = 0;
        try {
            host.flush().deliver();
            assert.equal(host.offset(), -68);
            assert.ok(host.exists('row-close'), 'the pending open finishes without waiting for the old spring');
            assert.ok(!host.shared.some((shared) => shared.animation), 'no spatial animation survives reduced motion');
        } finally {
            theme.animation.scale = 1;
            host.unmount();
        }
    });
    test('a pressed reveal action releases its morph when disabled or closed without press-out', () => {
        const { host, ref } = rowHost({ trailingActions: [action('save')] });
        ref.current.open('trailing');
        host.settled();
        const backgrounds = () => host.all().filter((node) => node.type === 'AnimatedView' && Array.isArray(node.props.style));
        const backgroundRadius = () =>
            backgrounds()
                .find((node) => node.props.style.some((style) => style?.backgroundColor))
                .props.style.find((style) => style?.compute)
                .compute().borderRadius;
        host.find('row-trailing-save').props.onPressIn();
        host.flush().settled();
        assert.equal(backgroundRadius(), 8);
        host.setProps({ trailingActions: [action('save', () => {}, { disabled: true })] }).settled();
        host.setProps({ trailingActions: [action('save')] });
        ref.current.open('trailing');
        host.settled();
        assert.equal(backgroundRadius(), 32, 're-enabling does not restore a stale held corner');
        host.find('row-trailing-save').props.onPressIn();
        host.flush().settled();
        ref.current.close();
        host.settled();
        ref.current.open('trailing');
        host.settled();
        assert.equal(backgroundRadius(), 32, 'reopening does not restore a stale held corner');
        host.unmount();
    });
    test('a full-swipe action derives its resting corner from the actual enlarged row height', () => {
        const { host } = rowHost({ leadingActions: [action('archive')], leadingSwipeMode: 'direct' });
        host.layout('row', 358, 120);
        host.pan('onActivate').pan('onUpdate', { translationX: 300 });
        const background = host
            .all()
            .find(
                (node) =>
                    node.type === 'AnimatedView' &&
                    Array.isArray(node.props.style) &&
                    node.props.style.some((style) => style?.backgroundColor)
            );
        assert.equal(background.props.style.find((style) => style?.compute).compute().borderRadius, 60);
        host.unmount();
    });
    test('Group.closeAll revokes a primary action even before its queued UI write executes', () => {
        let calls = 0;
        const group = { current: null };
        const Pair = () =>
            jsx(SwipeListGroup, {
                ref: group,
                children: jsx(SwipeListItem, {
                    id: 'row',
                    testID: 'row',
                    leadingSwipeMode: 'direct',
                    leadingActions: [action('archive', () => calls++)],
                    children: jsx('OriginalRow'),
                }),
            });
        const host = new Host(Pair, {}).layout();
        swipe(host, 280).complete();
        deferredUI = true;
        try {
            host.context();
            group.current.closeAll();
            host.deliver();
            assert.equal(calls, 0, 'closing the group immediately invalidates old RN callbacks');
            host.drainUI().settled();
            assert.equal(host.offset(), 0);
        } finally {
            deferredUI = false;
            host.unmount();
        }
    });
    test('opening a peer revokes a queued primary before UI processes the new peer command', () => {
        let calls = 0;
        const second = { current: null };
        const Pair = () =>
            jsx(SwipeListGroup, {
                children: [
                    jsx(
                        SwipeListItem,
                        {
                            id: 'row',
                            testID: 'row',
                            leadingSwipeMode: 'direct',
                            leadingActions: [action('archive', () => calls++)],
                            children: jsx('OriginalRow'),
                        },
                        'a'
                    ),
                    jsx(
                        SwipeListItem,
                        { id: 'peer', testID: 'peer', ref: second, trailingActions: [action('save')], children: jsx('OriginalRow') },
                        'b'
                    ),
                ],
            });
        const host = new Host(Pair, {}).layout().layout('peer');
        swipe(host, 280).complete();
        deferredUI = true;
        try {
            host.context();
            second.current.open('trailing');
            host.deliver();
            assert.equal(calls, 0);
            host.drainUI().settled();
            assert.equal(host.offset(), 0);
            assert.equal(host.offset('peer'), -68);
        } finally {
            deferredUI = false;
            host.unmount();
        }
    });
    test('reduced motion finishes a primary action once and rejects the replaced spring completion', () => {
        let calls = 0;
        const { host } = rowHost({ trailingSwipeMode: 'direct', trailingActions: [action('delete', () => calls++)] });
        swipe(host, -280);
        const previous = host.shared.find((shared) => shared.animation?.to === -358).animation;
        theme.animation.scale = 0;
        try {
            host.flush().deliver();
            assert.equal(calls, 1);
            assert.equal(host.offset(), 0);
            onUI(host, () => previous.callback(true));
            host.deliver();
            assert.equal(calls, 1);
        } finally {
            theme.animation.scale = 1;
            host.unmount();
        }
    });
    test('action focus and hover paint bounded state layers, and stale native handlers stay inert after disposal', () => {
        const { host, ref } = rowHost({ trailingActions: [action('save')] });
        ref.current.open('trailing');
        host.settled();
        const touch = () => host.find('row-trailing-save');
        const layer = () =>
            host
                .all(touch())
                .find((node) => node.type === 'View' && Array.isArray(node.props.style))
                .props.style.at(-1);
        assert.equal(touch().props.accessibilityState.disabled, false);
        assert.equal(touch().props.rippleColor, 'onSecondaryContainer@0.1');
        touch().props.onHoverIn();
        host.flush();
        assert.equal(layer().opacity, 0.08);
        touch().props.onFocus();
        host.flush();
        assert.equal(layer().opacity, 0.1);
        const focusRing = () =>
            host.all().find((node) => node.type === 'AnimatedView' && node.props.style?.some?.((style) => style?.borderWidth === 3));
        assert.equal(
            focusRing()
                .props.style.find((style) => style?.compute)
                .compute().borderRadius,
            32
        );
        touch().props.onPressIn();
        host.flush().settled();
        assert.equal(layer().opacity, 0, 'pressed ripple does not stack with the hover/focus layer');
        assert.equal(
            focusRing()
                .props.style.find((style) => style?.compute)
                .compute().borderRadius,
            8,
            'the focus ring follows the held shape'
        );
        const stale = touch().props;
        host.unmount();
        for (const handler of ['onPressIn', 'onPressOut', 'onFocus', 'onBlur', 'onHoverIn', 'onHoverOut'])
            assert.doesNotThrow(() => stale[handler](), `${handler} after disposal cannot update React`);
    });
    console.log(`PASS ${cases} focused SwipeListItem interruption regressions; native feel remains separate.`);
}

vm.runInNewContext(
    `${bootstrap}\n(${regressions.toString()})();`,
    {
        require: createRequire(harnessFile),
        __dirname,
        console,
    },
    { filename: __filename }
);
