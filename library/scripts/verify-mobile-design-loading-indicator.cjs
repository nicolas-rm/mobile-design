/**
 * Executes LoadingIndicator with bounded React/shared-value doubles, then passes
 * its actual transform output through the installed Reanimated transform parser.
 * SVG path geometry and interruption/cancellation are inspected; no native render
 * or FPS claim. This catches the SVG rotate(angle cx cy) native crash regression.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const compile = (file, modules = {}) => {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        fileName: file,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(
        code,
        {
            exports,
            require: (name) => {
                const platformBoundary = require('./mobile-design-native-boundaries.cjs')(name, modules);
                if (platformBoundary) return platformBoundary;
                assert.ok(modules[name], `${file}: ${name}`);
                return modules[name];
            },
        },
        { filename: file }
    );
    return exports;
};
const reanimatedRoot = path.dirname(require.resolve('react-native-reanimated/package.json'));
const guards = compile(path.join(reanimatedRoot, 'src/common/utils/guards.ts'));
const { processTransform } = compile(path.join(reanimatedRoot, 'src/common/style/processors/transform.ts'), { '../../utils': guards });
assert.throws(
    () => processTransform('rotate(90 24 24)'),
    /Invalid transform property/,
    'the installed parser reproduces the previous native-invalid syntax'
);

let active;
let reduced = false;
let checks = 0;
const equal = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const hook = (create) => {
    const i = active.cursor++;
    return active.hooks[i] ?? (active.hooks[i] = create());
};
const React = {
    useEffect(fn, deps) {
        const slot = hook(() => ({}));
        if (!equal(slot.deps, deps)) {
            slot.deps = deps;
            active.effects.push(() => {
                slot.cleanup?.();
                slot.cleanup = fn();
            });
        }
    },
};
const animation = (kind, to, config, callback) => ({ animation: true, kind, to, config, callback });
const reanimated = {
    View: 'AnimatedView',
    createAnimatedComponent: (component) => component,
    useSharedValue(value) {
        return hook(() => ({
            value,
            animation: undefined,
            get() {
                return this.value;
            },
            set(next) {
                if (next?.animation) this.animation = next;
                else {
                    this.animation = undefined;
                    this.value = next;
                }
            },
        }));
    },
    useAnimatedProps: (compute) => ({ compute }),
    useAnimatedStyle: (compute) => ({ compute }),
    cancelAnimation(shared) {
        shared.animation = undefined;
    },
    ReduceMotion: { Never: 'never' },
    withTiming: (to, config, callback) => {
        assert.equal(config.reduceMotion, 'never', 'timing follows the resolved Paper preference');
        return animation('timing', to, config, callback);
    },
    withSpring: (to, config, callback) => {
        assert.equal(config.reduceMotion, 'never', 'spring follows the resolved Paper preference');
        return animation('spring', to, config, callback);
    },
    withRepeat: (to, count, reverse, callback, reduceMotion) => {
        assert.equal(reduceMotion, 'never', 'repeat follows the resolved Paper preference');
        return animation('repeat', to, { count, reverse, reduceMotion }, callback);
    },
    Easing: { linear: (v) => v },
};
reanimated.default = reanimated;
const jsx = (type, props, key) => ({ type, props, key });
const theme = {
    animation: {
        get scale() {
            return reduced ? 0 : 1;
        },
    },
    colors: { primaryContainer: '#abc', onPrimaryContainer: '#123', primary: '#456' },
};
const { LoadingIndicator } = compile(path.join(root, 'packages/mobile-design/src/components/loading-indicator.tsx'), {
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', StyleSheet: { absoluteFill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 } } },
    'react-native-paper': { useTheme: () => theme },
    'react-native-reanimated': reanimated,
    'react-native-svg': { default: 'Svg', Path: 'Path' },
});
const walk = (node) => (!node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)]);
const style = (value) => (Array.isArray(value) ? Object.assign({}, ...value.map(style)) : value?.compute ? value.compute() : (value ?? {}));
class Runner {
    constructor(props = {}) {
        this.hooks = [];
        this.render(props);
    }
    render(props = this.props) {
        this.props = props;
        active = this;
        this.cursor = 0;
        this.effects = [];
        this.tree = LoadingIndicator(props);
        this.effects.forEach((fn) => fn());
        return this;
    }
    unmount() {
        this.hooks.forEach((slot) => slot.cleanup?.());
    }
    verify() {
        assert.ok(this.tree);
        const nodes = walk(this.tree);
        const viewport = nodes.find((node) => node.type === 'AnimatedView');
        assert.ok(viewport, 'rotation belongs on a native viewport');
        const transform = style(viewport.props.style).transform;
        assert.ok(Array.isArray(transform));
        assert.equal(transform.length, 1);
        const rotate = transform[0].rotate;
        assert.ok(guards.isAngle(rotate), `valid native angle: ${rotate}`);
        assert.ok(Number.isFinite(parseFloat(rotate)));
        assert.equal(processTransform(transform), transform);
        assert.equal(processTransform(`rotate(${rotate})`)[0].rotate, rotate);
        const animatedPath = nodes.find((node) => node.type === 'Path');
        const props = animatedPath.props.animatedProps.compute();
        assert.deepEqual(Object.keys(props), ['d'], 'SVG receives the path only, never RN-processed SVG transform text');
        assert.ok(/^M/.test(props.d) && /Z$/.test(props.d));
        assert.ok(!/NaN|Infinity/.test(props.d));
        const coords = props.d.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g).map(Number);
        assert.equal(coords.length, 674, '112 cubic segments and one move');
        assert.ok(coords.every(Number.isFinite));
        checks++;
        return rotate;
    }
}
let loop = new Runner();
for (let index = 0; index < 7; index++)
    for (const morph of [0, 0.01, 0.25, 0.5, 0.75, 1, 1.08])
        for (const rotation of [0, 90.5, 359.99, 720]) {
            loop.hooks[1].set(index);
            loop.hooks[2].set(morph);
            loop.hooks[3].set(rotation);
            loop.verify();
        }
loop.unmount();
loop = new Runner();
assert.equal(loop.tree.props.accessible, true, 'the progress role is exposed as a standalone accessibility element');
assert.ok(loop.hooks[0].animation && loop.hooks[2].animation && loop.hooks[3].animation, 'indeterminate clocks started');
loop.render({ animating: false });
assert.ok(
    [0, 2, 3].every((i) => !loop.hooks[i].animation),
    'pause cancels every loop'
);
loop.verify();
loop.render({ gestureProgress: 0.5 });
assert.equal(loop.verify(), '-90deg', 'pull gesture rotates the native viewport without SVG transform text');
assert.ok(
    [0, 2, 3].every((i) => !loop.hooks[i].animation),
    'determinate transition keeps clocks cancelled'
);
for (const progress of [0, 0.1, 0.333, 0.75, 1, -1, 2, NaN, Infinity]) {
    loop.render({ gestureProgress: progress, size: NaN });
    loop.verify();
    assert.equal(style(loop.tree.props.style).width, 48);
}
const gestureProgress = {
    value: 0,
    get() {
        return this.value;
    },
};
loop.render({ gestureProgress });
for (const progress of [0, 0.25, 0.75, 1, 1.4, -1, NaN, Infinity]) {
    gestureProgress.value = progress; // Gesture updates do not render React.
    assert.equal(loop.verify(), `${Number.isFinite(progress) ? -Math.max(0, Math.min(1, progress)) * 180 : 0}deg`);
    assert.equal(loop.tree.props.accessibilityValue.now, undefined, 'a pull gesture never publishes task percentage');
    assert.equal(loop.tree.props.accessibilityValue.text, 'Desliza para actualizar');
}
reduced = true;
loop.render({ gestureProgress: 0.5 });
assert.equal(loop.verify(), '0deg');
loop.render({});
assert.equal(loop.verify(), '0deg');
assert.ok(
    [0, 2, 3].every((i) => !loop.hooks[i].animation),
    'motion reduction cancels all loops'
);
reduced = false;
loop.render({});
assert.ok(loop.hooks[0].animation);
loop.render({ visible: false });
assert.equal(loop.tree, null);
assert.ok(
    [0, 2, 3].every((i) => !loop.hooks[i].animation),
    'hidden indicator cancels loops'
);
loop.render({});
loop.unmount();
assert.ok(
    [0, 2, 3].every((i) => !loop.hooks[i].animation),
    'unmount cancels loops'
);
console.log(
    `OK: ${checks} LoadingIndicator frames through installed Reanimated parser; seven morphs, determinate, finite geometry, pause/reduce/hide/unmount cancellation.`
);
