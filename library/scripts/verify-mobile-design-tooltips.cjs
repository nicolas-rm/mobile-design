/**
 * Run: node scripts/verify-mobile-design-tooltips.cjs
 *
 * Executes the real transpiled useTooltipTrigger with explicit React-hook,
 * element and timer doubles. Tests user-visible ownership, delay, cancellation,
 * disabled reactivation, long-press suppression and mutual exclusion.
 *
 * These doubles model synchronous committed hooks and deterministic JS timers.
 * They do not simulate concurrent React, native hover/press dispatch, popup
 * positioning, pixels, animation/FPS or screen-reader focus. No production
 * source is rewritten and no dependency/native runtime is mocked implicitly.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const source = ts.transpileModule(fs.readFileSync(path.join(root, 'packages/mobile-design/src/components/tooltip.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
let count = 0;
const failures = [];

function test(name, run) {
    count += 1;
    const runtime = createRuntime();
    try {
        run(runtime);
    } catch (error) {
        failures.push({ name, error });
    } finally {
        runtime.dispose();
    }
}

function createRuntime() {
    let active;
    let clock = 0;
    let nextTimer = 0;
    const timers = new Map();
    const owners = new Set();
    const same = (previous, next) =>
        previous && next && previous.length === next.length && previous.every((value, index) => Object.is(value, next[index]));
    const hook = (initialize) => {
        const index = active.cursor++;
        return active.hooks[index] ?? (active.hooks[index] = initialize());
    };
    const React = {
        useState(initial) {
            const owner = active;
            const slot = hook(() => ({ value: typeof initial === 'function' ? initial() : initial }));
            return [
                slot.value,
                (value) => {
                    assert.ok(!owner.unmounted, 'a disposed trigger cannot update state');
                    const next = typeof value === 'function' ? value(slot.value) : value;
                    if (!Object.is(next, slot.value)) {
                        slot.value = next;
                        owner.dirty = true;
                    }
                },
            ];
        },
        useRef: (current) => hook(() => ({ current })),
        useCallback(callback, dependencies) {
            const slot = hook(() => ({}));
            if (!same(slot.dependencies, dependencies)) {
                slot.dependencies = dependencies;
                slot.callback = callback;
            }
            return slot.callback;
        },
        useEffect(create, dependencies) {
            const owner = active;
            const slot = hook(() => ({}));
            if (!same(slot.dependencies, dependencies)) {
                slot.dependencies = dependencies;
                owner.effects.push(() => {
                    slot.cleanup?.();
                    slot.cleanup = create();
                });
            }
        },
        cloneElement: (element, props) => ({ ...element, props: { ...element.props, ...props } }),
    };
    const modules = {
        react: React,
        'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
        'react-native-paper': { Text: 'Text' },
        'react-native': { Platform: { OS: 'ios' } },
        '../core': {
            useMobileTheme() {
                throw new Error('the visual Tooltip was not requested in this controller harness');
            },
        },
        './popup': { AnchoredPopup: 'AnchoredPopup' },
    };
    const exports = {};
    vm.runInNewContext(source, {
        exports,
        require(name) {
            assert.ok(modules[name], `explicit test double required for ${name}`);
            return modules[name];
        },
        setTimeout(callback, delay) {
            const id = ++nextTimer;
            timers.set(id, { callback, deadline: clock + delay });
            return id;
        },
        clearTimeout: (id) => timers.delete(id),
    });
    const flush = () => {
        let passes = 0;
        while ([...owners].some((owner) => owner.dirty && !owner.unmounted)) {
            assert.ok(++passes < 30, 'trigger effects settle without a render loop');
            for (const owner of owners) if (owner.dirty && !owner.unmounted) owner.render();
        }
    };
    class Trigger {
        constructor(props = {}, options = {}) {
            this.props = props;
            this.options = options;
            this.hooks = [];
            owners.add(this);
            this.render();
            flush();
        }
        render(props = this.props, options = this.options) {
            active = this;
            this.props = props;
            this.options = options;
            this.cursor = 0;
            this.effects = [];
            this.dirty = false;
            this.result = exports.useTooltipTrigger({ type: 'Button', props }, options);
            this.effects.forEach((effect) => effect());
            return this;
        }
        update(props = this.props, options = this.options) {
            this.render(props, options);
            flush();
            return this;
        }
        event(name, ...args) {
            active = this;
            this.result.anchor.props[name](...args);
            flush();
            return this;
        }
        unmount() {
            active = this;
            this.hooks.forEach((slot) => slot.cleanup?.());
            this.unmounted = true;
        }
    }
    return {
        Trigger,
        timers,
        advance(milliseconds) {
            clock += milliseconds;
            let timer;
            while ((timer = [...timers].find(([, value]) => value.deadline <= clock))) {
                const [id, value] = timer;
                timers.delete(id);
                value.callback();
                flush();
            }
        },
        dispose() {
            for (const owner of owners) if (!owner.unmounted) owner.unmount();
        },
    };
}

test('hover shows immediately and departure waits the leave delay', ({ Trigger, advance }) => {
    const owner = new Trigger();
    owner.event('onHoverIn');
    assert.equal(owner.result.visible, true);
    owner.event('onHoverOut');
    advance(1499);
    assert.equal(owner.result.visible, true);
    advance(1);
    assert.equal(owner.result.visible, false);
});

test('touch entry delegates the long-press delay to the native trigger', ({ Trigger, advance }) => {
    const owner = new Trigger();
    assert.equal(owner.result.anchor.props.delayLongPress, 500);
    owner.event('onPressIn');
    advance(499);
    assert.equal(owner.result.visible, false);
    owner.event('onLongPress');
    assert.equal(owner.result.visible, true);
});

test('disabled hover cancellation requires a new interaction after reactivation', ({ Trigger, advance, timers }) => {
    const owner = new Trigger();
    owner.event('onHoverIn');
    advance(250);
    owner.update({ disabled: true });
    assert.equal(timers.size, 0, 'disable removes the pending hover timer');
    owner.update({ disabled: false });
    advance(1000);
    assert.equal(owner.result.visible, false, 'reactivation alone must not revive an old hover');
    owner.event('onHoverIn');
    assert.equal(owner.result.visible, true);
});

test('disabling a visible trigger releases its tooltip and prevents a focused reopening', ({ Trigger, advance }) => {
    const owner = new Trigger();
    owner.event('onFocus');
    assert.equal(owner.result.visible, true);
    owner.update({ disabled: true });
    assert.equal(owner.result.visible, false);
    owner.event('onFocus');
    advance(3000);
    assert.equal(owner.result.visible, false);
});

test('a long press suppresses its activation but the next ordinary tap still works', ({ Trigger, advance }) => {
    const actions = [];
    const owner = new Trigger({ onPress: () => actions.push('tap') });
    owner.event('onPressIn').event('onLongPress').event('onPressOut').event('onPress');
    assert.equal(owner.result.visible, true);
    assert.deepEqual(actions, []);
    advance(1500);
    owner.event('onPressIn').event('onPressOut').event('onPress');
    assert.deepEqual(actions, ['tap']);
});

test('showing a second tooltip replaces the first instead of stacking both', ({ Trigger }) => {
    const first = new Trigger();
    const second = new Trigger();
    first.event('onFocus');
    assert.equal(first.result.visible, true);
    second.event('onFocus');
    assert.equal(first.result.visible, false);
    assert.equal(second.result.visible, true);
    first.unmount();
    second.event('onFocus');
    assert.equal(second.result.visible, true, 'disposing an old trigger cannot close the active owner');
});

test('unmount cancels owned departure timers and retained callbacks cannot reopen', ({ Trigger, timers }) => {
    const owner = new Trigger();
    owner.event('onHoverIn');
    owner.event('onHoverOut');
    const released = [...timers.values()][0].callback;
    owner.unmount();
    assert.equal(timers.size, 0);
    released();
});

test('repeated leave signals cannot retain a hide timer that closes a newly hovered tooltip', ({ Trigger, advance, timers }) => {
    const owner = new Trigger();
    owner.event('onHoverIn');
    advance(500);
    owner.event('onPressOut');
    advance(100);
    owner.event('onHoverOut');
    advance(100);
    owner.event('onHoverIn');
    advance(500);
    assert.equal(owner.result.visible, true);
    advance(900);
    assert.equal(owner.result.visible, true, 'a stale press-out timeout cannot dismiss the current hover session');
    owner.unmount();
    assert.equal(timers.size, 0, 'every allocated timer must belong to the current session or be cleared');
});

test('mutual exclusion dismisses an already hidden tooltip only once', ({ Trigger }) => {
    const events = [];
    const first = new Trigger({}, { onDismiss: () => events.push('first') });
    first.event('onFocus');
    first.result.dismiss();
    first.update();
    assert.deepEqual(events, ['first']);
    const second = new Trigger();
    second.event('onFocus');
    assert.deepEqual(events, ['first'], 'opening another tooltip cannot emit another dismissal for an already closed owner');
});

test('keyboard focus keeps a tooltip open when the pointer leaves its anchor', ({ Trigger, advance }) => {
    const owner = new Trigger();
    owner.event('onHoverIn').event('onFocus').event('onHoverOut');
    advance(2000);
    assert.equal(owner.result.visible, true);
    owner.event('onBlur'); advance(1500);
    assert.equal(owner.result.visible, false);
});
test('crossing from anchor to content cancels departure and leaves actions readable', ({ Trigger, advance }) => {
    const owner = new Trigger();
    owner.event('onHoverIn').event('onHoverOut'); advance(300);
    owner.result.contentEvents.onPointerEnter(); advance(2500);
    assert.equal(owner.result.visible, true);
    owner.result.contentEvents.onPointerLeave(); advance(1499);
    assert.equal(owner.result.visible, true); advance(1);
    assert.equal(owner.result.visible, false);
});
test('focus can move into rich content without a stale anchor blur dismissing it', ({ Trigger, advance }) => {
    const owner = new Trigger();
    owner.event('onFocus').event('onBlur');
    owner.result.contentEvents.onFocus(); advance(3000);
    assert.equal(owner.result.visible, true);
    owner.result.contentEvents.onBlur(); advance(1500);
    assert.equal(owner.result.visible, false);
});
test('retained callbacks cannot act after disable and re-enable', ({ Trigger }) => {
    let presses = 0;
    const owner = new Trigger({ onPress: () => presses++ });
    const stale = owner.result.anchor.props;
    owner.update({ disabled: true }).update({ disabled: false, onPress: () => presses++ });
    stale.onLongPress(); stale.onPress(); stale.onFocus();
    assert.equal(owner.result.visible, false); assert.equal(presses, 0);
    owner.event('onPress'); assert.equal(presses, 1);
});
test('persistent help ignores hover/focus/hold and opens only on activation', ({ Trigger, advance }) => {
    const owner = new Trigger({}, { persistent: true });
    owner.event('onHoverIn').event('onFocus').event('onLongPress');
    assert.equal(owner.result.visible, false);
    owner.event('onPress'); assert.equal(owner.result.visible, true);
    owner.event('onHoverOut').event('onBlur'); advance(5000);
    assert.equal(owner.result.visible, true);
    owner.result.dismiss(); owner.update(); assert.equal(owner.result.visible, false);
});
test('ordinary activation uses the current handler rather than an older render', ({ Trigger }) => {
    const events = [];
    const owner = new Trigger({ onPress: () => events.push('old') });
    const old = owner.result.anchor.props.onPress;
    owner.update({ onPress: () => events.push('current') });
    old(); assert.deepEqual(events, ['current']);
});

if (failures.length) {
    for (const { name, error } of failures) console.error(`FAIL: ${name}\n${error.stack}`);
    console.error(`${failures.length} of ${count} tooltip lifecycle cases failed.`);
    process.exitCode = 1;
} else {
    console.log(`PASS: ${count} Mobile Design tooltip lifecycle cases (delays, reactivation, suppression, ownership and cleanup).`);
}
