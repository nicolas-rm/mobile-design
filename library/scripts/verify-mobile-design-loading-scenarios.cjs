/**
 * Executes the actual PullToRefresh gesture worklets.
 * Hook/timer/gesture/animation doubles are bounded; no Yoga, native recognizer
 * arbitration, UI-runtime serialization, frame-rate or accessibility-focus claim.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
let active,
    checks = 0,
    focused = true,
    now = 0,
    timerId = 0;
const timers = new Map(),
    frames = new Map(),
    queued = [];
let deferRNSharedWrites = false,
    inUI = false;
const uiJobs = [];
function onUI(fn) {
    const previous = inUI;
    inUI = true;
    try {
        return fn();
    } finally {
        inUI = previous;
    }
}
function flushUI() {
    while (uiJobs.length) onUI(uiJobs.shift());
}
const check = async (name, fn) => {
    try {
        await fn();
        checks++;
    } catch (error) {
        error.message = `${name}: ${error.message}`;
        throw error;
    }
};
const depsEqual = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
const hook = (create) => {
    const i = active.cursor++;
    return active.hooks[i] ?? (active.hooks[i] = create());
};
function effect(kind, fn, deps) {
    const slot = hook(() => ({}));
    if (!depsEqual(slot.deps, deps)) {
        slot.deps = deps;
        active[kind].push(() => {
            slot.cleanup?.();
            slot.cleanup = fn();
        });
    }
}
const React = {
    useState(initial) {
        const owner = active;
        const slot = hook(() => ({ value: typeof initial === 'function' ? initial() : initial }));
        return [
            slot.value,
            (value) => {
                assert.ok(!owner.disposed, 'no updates after unmount');
                slot.value = typeof value === 'function' ? value(slot.value) : value;
            },
        ];
    },
    useRef: (current) => hook(() => ({ current })),
    useMemo(fn, deps) {
        const slot = hook(() => ({}));
        if (!depsEqual(slot.deps, deps)) {
            slot.deps = deps;
            slot.value = fn();
        }
        return slot.value;
    },
    useCallback: (fn, deps) => React.useMemo(() => fn, deps),
    useEffect: (fn, deps) => effect('effects', fn, deps),
    useLayoutEffect: (fn, deps) => effect('layoutEffects', fn, deps),
};
const theme = {
    animation: { scale: 1 },
    colors: { onSurfaceVariant: 'onSurfaceVariant', primaryContainer: 'primaryContainer', onPrimaryContainer: 'onPrimaryContainer' },
    motion: { spring: { default: { spatial: { stiffness: 380, damping: 0.8 }, effects: { stiffness: 1600, damping: 1 } } } },
};
const animationCalls = [];
const reanimated = {
    View: 'AnimatedView',
    ScrollView: 'AnimatedScrollView',
    ReduceMotion: { Never: 'never' },
    useSharedValue(value) {
        return hook(() => ({
            value,
            get() {
                return this.value;
            },
            set(value) {
                if (deferRNSharedWrites && !inUI)
                    uiJobs.push(() => {
                        this.value = value;
                    });
                else this.value = value;
            },
        }));
    },
    useDerivedValue: (fn) => ({ get: fn }),
    useAnimatedStyle: (compute) => ({ compute }),
    useAnimatedScrollHandler: (fn) => fn,
    cancelAnimation() {},
    withSpring(to, config) {
        assert.equal(config.reduceMotion, 'never');
        animationCalls.push({ to, config });
        return to;
    },
};
reanimated.default = reanimated;
reanimated.LinearTransition = {
    springify() {
        const transition = {
            config: {},
            mass(value) {
                this.config.mass = value;
                return this;
            },
            stiffness(value) {
                this.config.stiffness = value;
                return this;
            },
            damping(value) {
                this.config.damping = value;
                return this;
            },
            reduceMotion(value) {
                assert.equal(value, 'never');
                this.config.reduceMotion = value;
                return this;
            },
        };
        return transition;
    },
};
function gesture() {
    const target = { handlers: {}, options: {} };
    let proxy;
    proxy = new Proxy(target, {
        get(object, key) {
            if (key in object) return object[key];
            return (...args) => {
                if (typeof args[0] === 'function') object.handlers[key] = args[0];
                else object.options[key] = args;
                return proxy;
            };
        },
    });
    return proxy;
}
const jsx = (type, props, key) => ({ type, props, key });
const modules = {
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    '@react-navigation/native': { useIsFocused: () => focused },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', StyleSheet: { absoluteFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } } },
    'react-native-gesture-handler': {
        Gesture: { Native: gesture, Pan: gesture, Simultaneous: (...gestures) => ({ gestures }) },
        GestureDetector: 'GestureDetector',
    },
    'react-native-reanimated': reanimated,
    'react-native-worklets': {
        scheduleOnRN: (fn, ...args) => queued.push(() => fn(...args)),
        scheduleOnUI: (fn, ...args) => {
            if (deferRNSharedWrites) uiJobs.push(() => fn(...args));
            else onUI(() => fn(...args));
        },
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }) },
    '../core': { useMobileTheme: () => theme },
    './loading-indicator': { LoadingIndicator: 'LoadingIndicator' },
    // This suite exercises loading and the SplitButton editor. Button group
    // gallery/use contracts run separately against their actual TSX modules.
    './mobile-design-button-group-examples': { ButtonGroupExamples: 'ButtonGroupExamples' },
    './mobile-design-button-examples': { ButtonExamples: 'ButtonExamples' },
    './mobile-design-tooltip-examples': { TooltipExamples: 'TooltipExamples' },
};
function load(relative) {
    const exports = {},
        fileName = path.join(root, relative);
    const code = ts.transpileModule(fs.readFileSync(fileName, 'utf8'), {
        fileName,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, {
        exports,
        require(name) {
            const boundary = require('./mobile-design-native-boundaries.cjs')(name, modules);
            if (boundary) return boundary;
            assert.ok(modules[name], `explicit double: ${name}`);
            return modules[name];
        },
        setTimeout(fn, delay) {
            const id = ++timerId;
            timers.set(id, { at: now + delay, fn });
            return id;
        },
        clearTimeout: (id) => timers.delete(id),
        requestAnimationFrame(fn) {
            const id = ++timerId;
            frames.set(id, fn);
            return id;
        },
        cancelAnimationFrame: (id) => frames.delete(id),
    });
    return exports;
}
const { PullToRefresh, pullToRefreshOffset } = load('packages/mobile-design/src/components/pull-to-refresh.tsx');
const walk = (node) => (!node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)]);
const style = (value) => (Array.isArray(value) ? Object.assign({}, ...value.map(style)) : value?.compute ? value.compute() : (value ?? {}));
class Runner {
    constructor(component, props) {
        Object.assign(this, { component, props, hooks: [] });
        this.render();
    }
    render(props = this.props) {
        this.props = props;
        active = this;
        this.cursor = 0;
        this.effects = [];
        this.layoutEffects = [];
        this.tree = this.component(props);
        this.layoutEffects.forEach((fn) => fn());
        this.effects.forEach((fn) => fn());
        return this;
    }
    nodes(type) {
        return walk(this.tree).filter((node) => node.type === type);
    }
    unmount() {
        this.hooks.forEach((slot) => slot.cleanup?.());
        this.disposed = true;
    }
}
async function flush() {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}
async function advance(milliseconds) {
    now += milliseconds;
    for (const [id, timer] of [...timers])
        if (timer.at <= now) {
            timers.delete(id);
            timer.fn();
        }
    await flush();
}
function nativeFrame() {
    while (queued.length) queued.shift()();
    const pending = [...frames];
    frames.clear();
    pending.forEach(([, fn]) => fn());
}
(async () => {
    await check('official80dp threshold,0.5 drag and nonlinear tension fixtures', () => {
        for (const [distance, expected] of [
            [0, 0],
            [80, 40],
            [160, 80],
            [240, 115],
            [320, 140],
            [480, 160],
            [800, 160],
        ])
            assert.equal(pullToRefreshOffset(distance), expected);
    });
    const make = () => {
        let requests = 0;
        const runner = new Runner(PullToRefresh, { refreshing: false, onRefresh: () => requests++, children: 'list' });
        const pan = runner.nodes('GestureDetector')[0].props.gesture.gestures[1];
        return { runner, pan, count: () => requests };
    };
    await check('release beyond threshold requests once; frame checks controlled state', () => {
        const { runner, pan, count } = make();
        pan.handlers.onStart({ translationY: 8 });
        pan.handlers.onUpdate({ translationY: 178 });
        pan.handlers.onEnd({ velocityY: 0 });
        assert.equal(
            animationCalls.at(-1).config.stiffness,
            1500,
            'Compose Animatable default spring, not an invented pull-specific duration'
        );
        assert.equal(animationCalls.at(-1).config.damping, 2 * Math.sqrt(1500));
        assert.equal(count(), 0, 'refresh crosses to RN once at release');
        nativeFrame();
        assert.equal(count(), 1);
        assert.equal(
            style(runner.nodes('AnimatedView').find((node) => style(node.props.style).zIndex === 1).props.style).opacity,
            0,
            'a host that does not set refreshing hides next frame'
        );
        runner.unmount();
    });
    await check('threshold reversal and cancelled drag never refresh', () => {
        const { runner, pan, count } = make();
        pan.handlers.onStart({ translationY: 8 });
        pan.handlers.onUpdate({ translationY: 240 });
        pan.handlers.onUpdate({ translationY: 80 });
        pan.handlers.onEnd({ velocityY: -100 });
        nativeFrame();
        assert.equal(count(), 0);
        pan.handlers.onStart({ translationY: 8 });
        pan.handlers.onUpdate({ translationY: 250 });
        pan.handlers.onFinalize({}, false);
        nativeFrame();
        assert.equal(count(), 0);
        runner.unmount();
    });
    await check('scroll coordination waits for top and rejects horizontal intent', () => {
        const { runner, pan } = make();
        let activated = 0,
            failed = 0;
        const manager = { activate: () => activated++, fail: () => failed++ };
        const touch = (x, y) => ({ allTouches: [{ absoluteX: x, absoluteY: y }] });
        runner.nodes('AnimatedScrollView')[0].props.onScroll({ contentOffset: { y: 100 } });
        pan.handlers.onTouchesDown(touch(0, 0));
        pan.handlers.onTouchesMove(touch(0, 50), manager);
        assert.equal(activated, 0);
        runner.nodes('AnimatedScrollView')[0].props.onScroll({ contentOffset: { y: 0 } });
        pan.handlers.onTouchesMove(touch(0, 80), manager);
        assert.equal(activated, 1);
        pan.handlers.onTouchesMove(touch(50, 5), manager);
        assert.equal(failed, 1);
        runner.unmount();
    });
    await check('a virtualized viewport receives pull coordination without a nested ScrollView', () => {
        let requests = 0;
        const runner = new Runner(PullToRefresh, {
            refreshing: false,
            onRefresh: () => requests++,
            contentContainerStyle: { paddingBottom: 24 },
            renderScrollComponent: (props) => ({ type: 'AnimatedFlatList', props }),
        });
        assert.equal(runner.nodes('AnimatedScrollView').length, 0, 'FlatList owns the only scroll viewport');
        const list = runner.nodes('AnimatedFlatList')[0];
        assert.equal(list.props.scrollEventThrottle, 16);
        assert.equal(list.props.showsVerticalScrollIndicator, false);
        assert.equal(list.props.bounces, false, 'native overscroll cannot compete with the MD3 gesture');
        assert.equal(list.props.contentContainerStyle.paddingBottom, 24);
        const pan = runner.nodes('GestureDetector')[0].props.gesture.gestures[1];
        let activated = 0;
        const manager = { activate: () => activated++, fail() {} };
        const touch = (y) => ({ allTouches: [{ absoluteX: 0, absoluteY: y }] });
        list.props.onScroll({ contentOffset: { y: 100 } });
        pan.handlers.onTouchesDown(touch(0));
        pan.handlers.onTouchesMove(touch(180), manager);
        assert.equal(activated, 0, 'a scrolled FlatList cannot start a refresh');
        list.props.onScroll({ contentOffset: { y: 0 } });
        pan.handlers.onTouchesMove(touch(180), manager);
        assert.equal(activated, 1, 'the same list can pull only after reaching its top');
        pan.handlers.onStart({ translationY: 8 });
        pan.handlers.onUpdate({ translationY: 180 });
        pan.handlers.onEnd({ velocityY: 0 });
        nativeFrame();
        assert.equal(requests, 1);
        runner.render({ ...runner.props, refreshing: true, indicatorMode: 'adjacent' });
        assert.equal(style(runner.nodes('AnimatedFlatList')[0].props.style).transform[0].translateY, 80);
        runner.unmount();
    });
    await check('controlled refresh pins48dp indicator at32; adjacent moves content80', () => {
        const { runner } = make();
        runner.render({ ...runner.props, refreshing: true, indicatorMode: 'adjacent' });
        const indicator = runner.nodes('AnimatedView').find((node) => style(node.props.style).zIndex === 1);
        assert.equal(style(indicator.props.style).transform[0].translateY, 32);
        assert.equal(indicator.props.accessibilityState.busy, true);
        assert.equal(style(runner.nodes('AnimatedScrollView')[0].props.style).transform[0].translateY, 80);
        const layers = runner.nodes('LoadingIndicator');
        assert.equal(layers.length, 2);
        assert.ok(layers.every((node) => node.props.color === theme.colors.onPrimaryContainer && node.props.variant !== 'contained'));
        assert.ok(
            runner.nodes('View').some((node) => {
                const backing = style(node.props.style);
                return backing.borderRadius === 24 && backing.backgroundColor === theme.colors.primaryContainer;
            }),
            'both glyphs share one contained surface during the crossfade'
        );
        runner.render({ ...runner.props, indicatorMode: 'overlay' });
        assert.equal(style(runner.nodes('AnimatedScrollView')[0].props.style).transform[0].translateY, 0);
        runner.unmount();
    });
    await check('motion reduction and unmount suppress stale release callbacks', () => {
        const { runner, pan, count } = make();
        theme.animation.scale = 0;
        runner.render();
        const before = animationCalls.length;
        // This is the previous gesture closure, deliberately delivered late.
        pan.handlers.onStart({ translationY: 8 });
        pan.handlers.onUpdate({ translationY: 180 });
        pan.handlers.onEnd({ velocityY: 0 });
        assert.equal(animationCalls.length, before, 'shared current preference wins over stale gesture closure');
        runner.unmount();
        nativeFrame();
        assert.equal(count(), 0);
        theme.animation.scale = 1;
    });
    await check('disabling after release invalidates a queued refresh request', () => {
        const { runner, pan, count } = make();
        pan.handlers.onStart({ translationY: 8 });
        pan.handlers.onUpdate({ translationY: 180 });
        pan.handlers.onEnd({ velocityY: 0 });
        runner.render({ ...runner.props, enabled: false });
        nativeFrame();
        assert.equal(count(), 0);
        runner.render({ ...runner.props, enabled: true });
        const currentPan = runner.nodes('GestureDetector')[0].props.gesture.gestures[1];
        currentPan.handlers.onStart({ translationY: 8 });
        currentPan.handlers.onUpdate({ translationY: 180 });
        currentPan.handlers.onEnd({ velocityY: 0 });
        nativeFrame();
        assert.equal(count(), 1);
        runner.unmount();
    });
    await check('deferred RN writes apply reduce and settle in one UI transaction', () => {
        deferRNSharedWrites = true;
        const { runner, pan, count } = make();
        flushUI();
        onUI(() => {
            pan.handlers.onStart({ translationY: 8 });
            pan.handlers.onUpdate({ translationY: 180 });
        });
        theme.animation.scale = 0;
        const before = animationCalls.length;
        runner.render({ ...runner.props, refreshing: true });
        assert.equal(animationCalls.length, before, 'RN must not decide a spring using the previous UI preference');
        flushUI();
        assert.equal(animationCalls.length, before, 'the transaction uses the newly supplied reduced flag');
        assert.equal(
            style(runner.nodes('AnimatedView').find((node) => style(node.props.style).zIndex === 1).props.style).transform[0].translateY,
            32
        );
        onUI(() => pan.handlers.onEnd({ velocityY: 0 }));
        nativeFrame();
        flushUI();
        assert.equal(count(), 0, 'late gesture cannot refresh during controlled refresh');
        runner.unmount();
        flushUI();
        deferRNSharedWrites = false;
        theme.animation.scale = 1;
    });
    await check('RN generation rejects release before delayed UI invalidation applies', () => {
        deferRNSharedWrites = true;
        const { runner, pan, count } = make();
        flushUI();
        onUI(() => {
            pan.handlers.onStart({ translationY: 8 });
            pan.handlers.onUpdate({ translationY: 180 });
            pan.handlers.onEnd({ velocityY: 0 });
        });
        runner.render({ ...runner.props, enabled: false }); // UI invalidation deliberately remains queued.
        nativeFrame();
        assert.equal(count(), 0, 'RN ownership changes immediately');
        flushUI();
        runner.render({ ...runner.props, enabled: true });
        flushUI();
        const fresh = runner.nodes('GestureDetector')[0].props.gesture.gestures[1];
        onUI(() => {
            fresh.handlers.onStart({ translationY: 8 });
            fresh.handlers.onUpdate({ translationY: 180 });
            fresh.handlers.onEnd({ velocityY: 0 });
        });
        nativeFrame();
        flushUI();
        assert.equal(count(), 1);
        runner.unmount();
        flushUI();
        deferRNSharedWrites = false;
    });
    console.log(
        `OK: ${checks} real pull-to-refresh contracts; geometry, threshold reversal, scroll coordination, controlled placement and reduced-motion cleanup.`
    );
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
