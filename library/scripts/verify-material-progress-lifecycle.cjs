/**
 * Run with: node scripts/verify-material-progress-lifecycle.cjs
 *
 * Loads the actual TypeScript components with the project's installed compiler.
 * These cases cover callback ordering, cleanup, and pause/resume using minimal
 * hook, shared-value, JSX and controllable-clock doubles.
 *
 * Limits: this is not React's scheduler or Reanimated's native runtime. It does
 * not render SVG/native views, advance animation frames, measure layout/FPS,
 * or verify visual curves. Geometry fixtures live in verify-material-components;
 * device interaction and visual verification remain separate requirements.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const mobileDesign = true;
const componentDirectory = 'packages/mobile-design/src/components';
const theme = {
    shapes: { corner: { large: 24, medium: 12 } },
    animation: { scale: 1 },
    motion: {
        duration: { long2: 500 },
        easing: {
            standard: [0.2, 0, 0, 1],
            emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
        },
    },
    colors: { primary: '#123456', secondaryContainer: '#dedede' },
};
let active;
let deferRNSharedWrites = false,
    inUI = false;
const uiWrites = [];
function flushUIWrites() {
    const previous = inUI;
    inUI = true;
    try {
        while (uiWrites.length) uiWrites.shift()();
    } finally {
        inUI = previous;
    }
}

function depsEqual(previous, next) {
    return previous && next && previous.length === next.length && previous.every((value, index) => Object.is(value, next[index]));
}

function hook(initialize) {
    const runner = active;
    const index = runner.index++;
    if (!runner.hooks[index]) {
        runner.hooks[index] = initialize();
    }
    return runner.hooks[index];
}

const React = {
    useState(initial) {
        const runner = active;
        const slot = hook(() => ({ value: typeof initial === 'function' ? initial() : initial }));
        const setValue = (value) => {
            if (runner.unmounted) {
                throw new Error('State update after unmount');
            }
            const next = typeof value === 'function' ? value(slot.value) : value;
            if (!Object.is(next, slot.value)) {
                slot.value = next;
                runner.dirty = true;
            }
        };
        return [slot.value, setValue];
    },
    useRef(value) {
        return hook(() => ({ current: value }));
    },
    useMemo(compute, deps) {
        const slot = hook(() => ({}));
        if (!depsEqual(slot.deps, deps)) {
            slot.value = compute();
            slot.deps = deps;
        }
        return slot.value;
    },
    useCallback(callback, deps) {
        const slot = hook(() => ({}));
        if (!depsEqual(slot.deps, deps)) {
            slot.callback = callback;
            slot.deps = deps;
        }
        return slot.callback;
    },
    useEffect(effect, deps) {
        const runner = active;
        const slot = hook(() => ({}));
        if (!depsEqual(slot.deps, deps)) {
            slot.deps = deps;
            runner.effects.push(() => {
                slot.cleanup?.();
                slot.cleanup = effect();
            });
        }
    },
};

function cancel(shared) {
    if (deferRNSharedWrites && !inUI) {
        uiWrites.push(() => cancel(shared));
        return;
    }
    if (shared.animation) {
        const animation = shared.animation;
        shared.animation = null;
        animation.callback?.(false);
    }
}

const reanimated = {
    ReduceMotion: { Never: 'never' },
    createAnimatedComponent: (component) => component,
    useSharedValue(value) {
        const runner = active;
        return hook(() => {
            const shared = {
                current: value,
                animation: null,
                get() {
                    return this.current;
                },
                set(next) {
                    if (deferRNSharedWrites && !inUI) {
                        uiWrites.push(() => this.set(next));
                        return;
                    }
                    cancel(this);
                    if (next && typeof next === 'object' && next.kind) {
                        this.animation = next;
                    } else {
                        this.current = next;
                    }
                },
            };
            runner.shared.push(shared);
            return shared;
        });
    },
    useReducedMotion: () => false,
    useAnimatedProps: (compute) => ({ compute }),
    useAnimatedReaction(prepare, react) {
        const slot = hook(() => ({ previous: null }));
        active.effects.push(() => {
            const next = prepare();
            react(next, slot.previous);
            slot.previous = next;
        });
    },
    cancelAnimation: cancel,
    Easing: {
        linear: (value) => value,
        bezier: (...curve) => Object.assign((value) => value, { curve }),
    },
    withTiming: (to, config, callback) => ({ kind: 'timing', to, config, callback }),
    withSpring: (to, config) => ({ kind: 'spring', to, config }),
    withRepeat: (animation) => ({ kind: 'repeat', animation }),
};
reanimated.default = reanimated;

const jsx = (type, props, key) => ({ type, props, key });
const modules = {
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    'react-native-paper': { useLocale: () => ({ direction: 'ltr' }) },
    react: React,
    'react-native': { I18nManager: { isRTL: false }, View: 'View' },
    'react-native-reanimated': reanimated,
    'react-native-svg': { default: 'Svg', Circle: 'Circle', Path: 'Path' },
    'react-native-worklets': {
        scheduleOnRN: (callback, ...args) => active.queued.push(() => callback(...args)),
    },
    '@/theme/paper': { usePaperTheme: () => theme },
    '../core': { usePaperTheme: () => theme, useMobileTheme: () => theme },
    '../primitives': { Button: 'Button', IconButton: 'IconButton', Text: 'Text' },
    '../color': { withAlpha: (color) => color, toIconColor: (color) => color },
    './text-field': { TextField: 'TextInput' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) },
    'react/jsx-runtime': { jsx, jsxs: jsx },
};

function load(relative) {
    const exports = {};
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    const code = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const createTimer = (callback, ms, once = false) => {
        const id = ++active.lastTimer;
        active.timers.set(id, { fn: callback, ms, once });
        return id;
    };
    vm.runInNewContext(code, {
        exports,
        require: (name) => {
            const platformBoundary = require('./mobile-design-native-boundaries.cjs')(name, modules);
            if (platformBoundary) return platformBoundary;
            assert.ok(modules[name], `mock module ${name}`);
            return modules[name];
        },
        Math,
        Number,
        Array,
        Date: class extends Date {
            static now() {
                return active.clock ?? 0;
            }
        },
        setInterval: (callback, ms) => createTimer(callback, ms),
        clearInterval: (id) => active.timers.delete(id),
        setTimeout: (callback, ms) => createTimer(callback, ms, true),
        clearTimeout: (id) => active.timers.delete(id),
    });
    return exports;
}

modules['./progress-indicator-paths'] = load(`${componentDirectory}/progress-indicator-paths.ts`);
const ProgressIndicator = load(`${componentDirectory}/progress-indicator.tsx`).ProgressIndicator;

class Runner {
    constructor(props, component = ProgressIndicator) {
        this.component = component;
        this.hooks = [];
        this.shared = [];
        this.queued = [];
        this.timers = new Map();
        this.lastTimer = 0;
        this.clock = 0;
        this.props = props;
        this.render();
    }
    render(next = this.props) {
        this.props = next;
        let count = 0;
        do {
            if (++count > 20) {
                throw Error('render loop');
            }
            this.dirty = false;
            this.index = 0;
            this.effects = [];
            active = this;
            this.tree = this.component(this.props);
            for (const effect of this.effects) effect();
        } while (this.dirty);
        return this;
    }
    flush() {
        active = this;
        for (const job of this.queued.splice(0)) job();
        if (this.dirty) {
            this.render();
        }
    }
    unmount() {
        active = this;
        for (const h of this.hooks) h.cleanup?.();
        this.unmounted = true;
    }
    get motion() {
        const [phase, wave, progress, completion, amplitude] = this.shared;
        return { phase, wave, progress, completion, amplitude };
    }
    graphic() {
        return this.tree.props.children.props;
    }
}
// Interrupted outgoing motion must not commit stale callbacks.
const runner = new Runner({ variant: 'circular', appearance: 'wavy' });
assert.equal(runner.motion.phase.current, 0, 'animated mount must start at official phase zero');
runner.motion.phase.current = 0.37;
runner.motion.wave.current = 0.23;
runner.render({ variant: 'circular', appearance: 'wavy', progress: 0.5 });
assert.equal(runner.motion.phase.animation.kind, 'repeat', 'rotation must continue during outgoing arc closure');
const staleCompletionCallback = runner.motion.completion.animation.callback;
active = runner;
staleCompletionCallback(true);
assert.equal(runner.queued.length, 1);
runner.render({ variant: 'circular', appearance: 'wavy' });
runner.flush();
assert.equal(runner.graphic().indeterminate, true, 'queued completion from old transition must not override new mode');
runner.render({ variant: 'circular', appearance: 'wavy', progress: 0.5 });
runner.motion.completion.current = 0.6;
runner.render({ variant: 'circular', appearance: 'wavy', progress: 0.5, paused: true });
assert.equal(runner.motion.completion.animation, null, 'pause must cancel closure without resetting its timeline');
assert.equal(runner.motion.completion.current, 0.6);
runner.render({ variant: 'circular', appearance: 'wavy', progress: 0.5, paused: false });
assert.equal(runner.motion.completion.animation.config.duration, 200, 'resumed closure must retain remaining 200ms of original 500 ms');

// Pausing freezes live values; explicit manual changes remain usable.
const pausedIndicator = new Runner({ variant: 'circular', appearance: 'wavy', progress: 0.5 });
pausedIndicator.motion.phase.current = 0.4;
pausedIndicator.motion.wave.current = 0.7;
pausedIndicator.motion.progress.current = 0.42;
pausedIndicator.motion.amplitude.current = 0.65;
pausedIndicator.render({ variant: 'circular', appearance: 'wavy', progress: 0.5, paused: true });
assert.equal(pausedIndicator.motion.progress.current, 0.42, 'pause must not snap current progress to target .5');
assert.equal(pausedIndicator.motion.amplitude.current, 0.65, 'pause must not snap current amplitude to 1');
assert.equal(pausedIndicator.motion.wave.animation, null);
pausedIndicator.render({ variant: 'circular', appearance: 'wavy', progress: 0.6, paused: true });
assert.equal(pausedIndicator.motion.progress.animation.to, 0.6, 'explicit manual change while paused must still update progress');
pausedIndicator.render({ variant: 'circular', appearance: 'wavy', progress: 0.6, paused: false });
assert.equal(pausedIndicator.motion.wave.animation.animation.to, 1.7, 'wave must resume from retained .7 phase');

// A queued UI completion must be harmless after unmount.
const disposedIndicator = new Runner({ variant: 'circular' });
disposedIndicator.render({ variant: 'circular', progress: 0.7 });
active = disposedIndicator;
disposedIndicator.motion.completion.animation.callback(true);
disposedIndicator.unmount();
disposedIndicator.flush();
assert(
    disposedIndicator.shared.every((slot) => slot.animation === null),
    'unmount cancels all animated values'
);
if (mobileDesign) {
    for (const variant of ['linear', 'circular']) {
        for (const configuration of [{ animated: false }, { paused: true }]) {
            const changedPreview = new Runner({ variant, progress: 0.5, ...configuration });
            changedPreview.render({ variant, ...configuration });
            assert.equal(changedPreview.motion.phase.current, 0.2, 'entering an unknown task without motion keeps a visible active segment');
            assert.equal(changedPreview.motion.phase.animation, null);
            changedPreview.unmount();
        }
        const staticPreview = new Runner({ variant, animated: false });
        assert.equal(staticPreview.motion.phase.current, 0.2);
        deferRNSharedWrites = true;
        staticPreview.render({ variant, animated: true });
        assert.equal(staticPreview.motion.phase.current, 0.2, 'RN set(0) is intentionally still pending');
        flushUIWrites();
        assert.equal(staticPreview.motion.phase.current, 0);
        assert.equal(staticPreview.motion.phase.animation.animation.to, 1, 'the first cycle must end at1, not stale preview .2+1');
        staticPreview.motion.phase.current = 0.43;
        staticPreview.render({ variant, paused: true });
        flushUIWrites();
        staticPreview.render({ variant, paused: false });
        flushUIWrites();
        assert.equal(staticPreview.motion.phase.animation.animation.to, 1.43, 'subsequent resume retains the current UI phase');
        staticPreview.unmount();
        flushUIWrites();
        assert(staticPreview.shared.every((slot) => slot.animation === null));
        deferRNSharedWrites = false;
    }
}
console.log(
    `PASS ${mobileDesign ? 'mobile-design' : 'app'}: ${mobileDesign ? 19 : 13} lifecycle cases (queued interruption, unmount, pause/resume, remaining closure duration, manual adjustment${mobileDesign ? ', deferred RN preview-to-motion writes' : ''}).`
);
