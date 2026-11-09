/**
 * Actual navigation, badge, list and mixed-height Button/IconButton
 * TSX -> installed RN Yoga.
 * Run: node scripts/verify-mobile-design-navigation-layout.cjs
 * Add --tabs-only to run only Tabs geometry.
 *
 * Native view/Paper leaves, React hooks and immediate animation endpoints are
 * bounded doubles. Icon24, text and badge intrinsic metrics are explicit inputs;
 * the source component hierarchy/styles and Yoga layout engine are real.
 * persistence is isolated, while source preview data and row callbacks run.
 * This catches centering, parent-width/percent-position regressions, logical
 * badge offsets, separate native action regions and independent callbacks.
 * It does not assert font shaping, rendered pixels, native press
 * handling, accessibility traversal, animation curves or frame rate.
 *
 * Reference: m3.material.io/components/{tabs,navigation-bar,badges}/specs;
 * AndroidX Badge.kt @ d153d87ed76372ece0c99dac837ff07ab845d495, offsets6/12,
 * bottom offsets6/14. Fabric defaults YGErrataAll, not Yoga's default None.
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const tabsOnly = process.argv.includes('--tabs-only');
const yoga = path.join(root, 'node_modules/react-native/ReactCommon/yoga');
const fixture = path.join(__dirname, 'fixtures/mobile-design-navigation-layout.cpp');
const version = require(path.join(root, 'node_modules/react-native/package.json')).version;
const hash = crypto.createHash('sha256').update(fs.readFileSync(fixture)).update(version).digest('hex').slice(0, 12);
const binary = path.join(os.tmpdir(), `mobile-design-navigation-yoga-${hash}`);
const sources = (directory) =>
    fs
        .readdirSync(directory, { withFileTypes: true })
        .flatMap((entry) =>
            entry.isDirectory()
                ? sources(path.join(directory, entry.name))
                : entry.name.endsWith('.cpp')
                  ? [path.join(directory, entry.name)]
                  : []
        );
if (!fs.existsSync(binary)) {
    const compiler = process.env.CXX || 'clang++';
    const result = spawnSync(compiler, ['-std=c++20', '-O1', `-I${yoga}`, fixture, ...sources(path.join(yoga, 'yoga')), '-o', binary], {
        encoding: 'utf8',
    });
    assert.equal(result.status, 0, `installed Yoga C++ fixture must compile (${compiler} required):\n${result.stderr}`);
}

let active,
    rtl = false,
    fontScale = 1,
    windowWidth = 390;
const theme = {
    animation: { scale: 0 },
    colors: new Proxy({}, { get: (_, key) => String(key) }),
    fonts: {
        labelSmall: { fontSize: 11, lineHeight: 16 },
        labelMedium: { fontSize: 12, lineHeight: 16 },
        labelMediumEmphasized: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
        labelLarge: { fontSize: 14, lineHeight: 20 },
        bodyLarge: { fontSize: 16, lineHeight: 24 },
        bodyMedium: { fontSize: 14, lineHeight: 20 },
        titleMedium: { fontSize: 16, lineHeight: 24 },
        titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: 0.1 },
        headlineSmall: { fontSize: 24, lineHeight: 32 },
    },
    motion: {
        duration: { short1: 50, short2: 100, short3: 150 },
        spring: {
            fast: { spatial: { stiffness: 800, damping: 0.6 }, effects: { stiffness: 3800, damping: 1 } },
            default: { spatial: { stiffness: 380, damping: 0.8 }, effects: { stiffness: 1600, damping: 1 } },
        },
    },
};
const dependenciesEqual = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
const hook = (create) => {
    const index = active.cursor++;
    return active.hooks[index] ?? (active.hooks[index] = create());
};
const React = {
    createContext: (current) => ({ current, Provider: 'ContextProvider' }),
    useContext: (context) => context.current,
    useState(initial) {
        const host = active.host;
        const slot = hook(() => ({ value: typeof initial === 'function' ? initial() : initial }));
        return [
            slot.value,
            (next) => {
                const value = typeof next === 'function' ? next(slot.value) : next;
                if (!Object.is(value, slot.value)) {
                    slot.value = value;
                    host.dirty = true;
                }
            },
        ];
    },
    useRef: (current) => hook(() => ({ current })),
    useId: () => hook(() => ({ value: 'component-layout-fixture' })).value,
    useMemo(compute, dependencies) {
        const slot = hook(() => ({}));
        if (!dependenciesEqual(slot.dependencies, dependencies)) {
            slot.dependencies = dependencies;
            slot.value = compute();
        }
        return slot.value;
    },
    useEffect(create, dependencies) {
        const slot = hook(() => ({}));
        if (!dependenciesEqual(slot.dependencies, dependencies)) {
            slot.dependencies = dependencies;
            active.host.effects.push(() => {
                slot.cleanup?.();
                slot.cleanup = create();
            });
        }
    },
    Children: { toArray: (children) => [children].flat(Infinity).filter(Boolean) },
    isValidElement: (value) => value && typeof value === 'object' && 'type' in value,
    cloneElement: (element, props) => ({ ...element, props: { ...element.props, ...props } }),
};
React.useCallback = (compute, dependencies) => React.useMemo(() => compute, dependencies);
React.useLayoutEffect = React.useEffect;
const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
const flatten = (style) =>
    Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : style?.compute ? flatten(style.compute()) : (style ?? {});
const builder = new Proxy({}, { get: () => () => builder });
const reanimated = {
    View: 'View',
    ScrollView: 'ScrollView',
    createAnimatedComponent: (component) => component,
    useSharedValue: (initial) =>
        hook(() => ({
            value: initial,
            get() {
                return this.value;
            },
            set(value) {
                this.value = value;
            },
        })),
    useAnimatedStyle: (compute) => ({ compute }),
    useAnimatedProps: (compute) => ({ compute }),
    useAnimatedReaction() {},
    useAnimatedRef: () => React.useRef(null),
    useAnimatedScrollHandler: (handlers) => handlers,
    withSpring: (to) => to,
    withTiming: (to) => to,
    interpolateColor: (value, _range, colors) => colors[value < 0.5 ? 0 : 1],
    cancelAnimation() {},
    scrollTo() {},
    ReduceMotion: { Never: 'never', Always: 'always' },
    LinearTransition: builder,
    FadeIn: builder,
    FadeOut: builder,
};
reanimated.default = reanimated;
const modules = {
    '../typography': { Text: 'Text' },
    '@mobile-design/tokens': require('./require-mobile-design-shared.cjs')('@mobile-design/tokens'),
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': {
        Platform: { OS: 'android' },
        View: 'View',
        Text: 'Text',
        ScrollView: 'ScrollView',
        Pressable: 'Pressable',
        Animated: { View: 'View' },
        StyleSheet: { create: (value) => value, flatten, absoluteFill: { position: 'absolute', inset: 0 } },
        useWindowDimensions: () => ({ width: windowWidth, height: 844, fontScale }),
    },
    'react-native-paper': {
        Icon: 'Icon',
        Text: 'Text',
        Badge: 'PaperBadge',
        List: {},
        Surface: 'Surface',
        TouchableRipple: 'TouchableRipple',
        ThemeProvider: ({ children }) => children,
        useTheme: () => theme,
        useLocale: () => ({ direction: rtl ? 'rtl' : 'ltr' }),
    },
    'react-native-reanimated': reanimated,
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) },
    '../core': { useMobileTheme: () => theme },
    '../color': { withAlpha: (color) => color },
    './sheets': { SideSheet: 'SideSheet' },
    './drawer': { NavigationDrawer: 'Drawer' },
    './icon-button': { IconButton: 'IconButton' },
    './action-surface': {
        AnimatedActionSurface: ({ geometry, style, ...props }) => jsx('Surface', { ...props, style: [style, geometry] }),
    },
    './progress-indicator': { ProgressIndicator: 'ProgressIndicator' },
    '../paper-motion-bridge': { PaperMotionBridge: ({ children }) => children },
};
function load(file) {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, {
        exports,
        process: { env: { EXPO_OS: 'android' } },
        require(name) {
            const platformBoundary = require('./mobile-design-native-boundaries.cjs')(name, modules);
            if (platformBoundary) return platformBoundary;
            assert.ok(modules[name], `explicit boundary for ${name}`);
            return modules[name];
        },
    });
    return exports;
}
modules['../ripple'] = load('packages/mobile-design/src/ripple.tsx');
modules['./focus-order'] = load('packages/mobile-design/src/components/focus-order.ts');
modules['./list-focus'] = load('packages/mobile-design/src/components/list-focus.tsx');
modules['./navigation-focus'] = load('packages/mobile-design/src/components/navigation-focus.ts');
modules['./press-scope'] = load('packages/mobile-design/src/components/press-scope.ts');
const { Badge, BadgedBox, ListItem } = (modules['./content'] = load('packages/mobile-design/src/components/content.tsx'));
const { NavigationBar } = (modules['./navigation-bar'] = load('packages/mobile-design/src/components/navigation-bar.tsx'));
modules['./navigation-rail-layout'] = load('packages/mobile-design/src/components/navigation-rail-layout.ts');
modules['./tabs'] = load('packages/mobile-design/src/components/tabs.tsx');
const { Tabs, NavigationRail } = load('packages/mobile-design/src/components/navigation.tsx');
const { Button } = (modules['./button'] = load('packages/mobile-design/src/components/button.tsx'));
const { IconButton } = load('packages/mobile-design/src/components/icon-button.tsx');

modules['react-native-svg'] = { default: 'Svg', Defs: 'Defs', LinearGradient: 'LinearGradient', Path: 'Path', Rect: 'Rect', Stop: 'Stop' };
modules['react-native-worklets'] = { scheduleOnRN: (callback, ...args) => callback(...args) };
const { TabsPager: TabsContentPager } = load('packages/mobile-design/src/components/tabs-pager.tsx');

function render(element, host, route = '0') {
    if (element == null || typeof element === 'boolean' || typeof element === 'string' || typeof element === 'number') return [];
    if (Array.isArray(element)) return element.flatMap((child, index) => render(child, host, `${route}/${child?.key ?? index}`));
    if (element.type === 'Fragment') return render(element.props.children, host, route);
    if (typeof element.type === 'function') {
        const key = `${route}:${element.type.name}`;
        const owner = host.instances.get(key) ?? { host, hooks: [] };
        host.instances.set(key, owner);
        owner.cursor = 0;
        const previous = active;
        active = owner;
        const result = element.type(element.props);
        active = previous;
        return render(result, host, `${route}/function`);
    }
    const node = {
        type: element.type,
        props: element.props,
        intrinsicTextScale: host.intrinsicTextScale,
        children: render(element.props.children, host, `${route}/children`),
    };
    if (element.type === 'ScrollView') {
        // RN ScrollView inserts a distinct content-container Yoga node and
        // applies its horizontal row style before the caller's content style.
        node.children = [
            {
                type: 'View',
                props: { style: [element.props.horizontal && { flexDirection: 'row' }, element.props.contentContainerStyle] },
                children: node.children,
            },
        ];
    }
    return [node];
}
const textMetrics = { Guardado: 64, Compartido: 80, Inicio: 36, Correo: 40, Biblioteca: 64, Buscar: 42, Fotos: 40 };
function styleFor(node) {
    const style = flatten(node.props.style);
    if (node.type === 'Icon') return { width: node.props.size, height: node.props.size, flexShrink: 0, ...style };
    if (node.type === 'Text' && node.intrinsicTextScale) {
        // Music labels are single-line native Text. Explicit intrinsic metrics
        // enter as measure functions so Yoga can constrain/truncate their width;
        // fixed-width doubles would hide overflow in the real flexible slots.
        const font = theme.fonts[node.props.variant] ?? theme.fonts.bodyLarge;
        const scale = node.props.allowFontScaling === false ? 1 : node.intrinsicTextScale;
        const size = style.fontSize ?? font.fontSize;
        node.measure = {
            width: String(node.props.children).length * size * 0.5 * scale,
            height: (style.lineHeight ?? font.lineHeight) * scale,
        };
        return style;
    }
    if (node.type === 'Text')
        return {
            width: textMetrics[node.props.children] ?? String(node.props.children).length * 7,
            height: style.lineHeight ?? (node.props.variant?.startsWith('labelMedium') ? 16 : 20),
            ...style,
        };
    if (node.type === 'PaperBadge') {
        const text = node.props.children;
        // Nominal text metrics are explicit inputs (999+ is26dp plus two4dp
        // paddings). Yoga must supply real AtMost/Exactly/Undefined constraints;
        // forcing a width style here would hide an absolute-wrapper regression.
        node.measure = {
            width: text == null ? 0 : String(text).length * 6.5 * fontScale,
            height: text == null ? 0 : (style.lineHeight ?? node.props.size / fontScale) * fontScale,
        };
        return { alignSelf: 'flex-end', minWidth: node.props.size, height: node.props.size, paddingHorizontal: 3, ...style };
    }
    return style;
}
const geometry =
    /^(width|height|minWidth|minHeight|maxWidth|flex|flexGrow|flexShrink|gap|position|direction|flexDirection|alignItems|alignSelf|justifyContent|padding(?:Left|Right|Top|Bottom|Horizontal|Vertical|Start|End)?|margin(?:Left|Right|Top|Bottom|Horizontal|Vertical|Start|End)?|left|right|top|bottom|inset)$/;
function layout(tree, rootDirection = 'ltr') {
    const nodes = [],
        lines = [];
    function append(node, parent) {
        node.id = nodes.length;
        node.parent = parent;
        nodes.push(node);
        lines.push(`node ${node.id} ${parent}`);
        const style = styleFor(node);
        if (node.measure) lines.push(`measure ${node.id} ${node.measure.width} ${node.measure.height}`);
        for (const [key, value] of Object.entries(style)) {
            if (geometry.test(key) && (typeof value === 'number' || typeof value === 'string'))
                lines.push(`style ${node.id} ${key} ${value}`);
        }
        if (style.transform?.length) lines.push(`style ${node.id} formsContainingBlock 1`);
        node.children.forEach((child) => append(child, node.id));
    }
    append(tree, -1);
    const result = spawnSync(binary, [rootDirection], { input: lines.join('\n'), encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    result.stdout
        .trim()
        .split('\n')
        .forEach((line) => {
            const [id, parent, x, y, width, height] = line.split(' ').map(Number);
            nodes[id].frame = {
                x,
                y,
                width,
                height,
                left: x + (parent < 0 ? 0 : nodes[parent].frame.left),
                top: y + (parent < 0 ? 0 : nodes[parent].frame.top),
            };
        });
    return nodes;
}
function mount(
    Component,
    props,
    {
        width = 390,
        direction = 'ltr',
        rootDirection = 'ltr',
        fontScale: scale = 1,
        viewportWidth = 390,
        measureText = false,
        wrapperStyle,
    } = {}
) {
    rtl = direction === 'rtl';
    fontScale = scale;
    windowWidth = viewportWidth;
    const host = { instances: new Map(), effects: [], layouts: new Map(), dirty: true, intrinsicTextScale: measureText ? scale : 0 };
    host.update = (next) => {
        props = { ...props, ...next };
        host.dirty = true;
        return settle();
    };
    function settle() {
        let iteration = 0;
        do {
            assert.ok(iteration++ < 12, 'onLayout hooks must stabilize');
            host.dirty = false;
            const children = render(jsx(Component, props), host);
            const tree = { type: 'View', props: { style: { width, ...wrapperStyle } }, children };
            host.effects.splice(0).forEach((effect) => effect());
            host.nodes = layout(tree, rootDirection);
            host.nodes.forEach((node) => {
                if (!node.props.onLayout) return;
                const layout = { x: node.frame.x, y: node.frame.y, width: node.frame.width, height: node.frame.height };
                const key = `${node.id}:${node.type}:${node.props.testID ?? ''}`;
                const measurement = JSON.stringify(layout);
                // RN emits onLayout after a frame change, not after every
                // React render. A fresh measured-state object alone must not
                // synthesize another native layout event forever.
                if (host.layouts.get(key) !== measurement) {
                    host.layouts.set(key, measurement);
                    node.props.onLayout({ nativeEvent: { layout } });
                }
            });
        } while (host.dirty);
        return host;
    }
    return settle();
}
const find = (host, predicate) => {
    const result = host.nodes.find(predicate);
    assert.ok(result, 'expected native node');
    return result;
};
const id = (host, value) => find(host, (node) => node.props.testID === value);
const descendants = (host, parent, predicate) =>
    host.nodes.filter((node) => {
        let current = node;
        while (current.parent >= 0) {
            current = host.nodes[current.parent];
            if (current === parent) return predicate(node);
        }
        return false;
    });
const center = (node) => node.frame.left + node.frame.width / 2;
const near = (a, b, label) => assert.ok(Math.abs(a - b) <= 0.34, `${label}: ${a} ≠ ${b}`);
const size24 = (node) => {
    near(node.frame.width, 24, 'glyph width');
    near(node.frame.height, 24, 'glyph height');
};
const glyph = (host, target) => {
    const result = descendants(host, target, (node) => node.type === 'Icon')[0];
    assert.ok(result);
    size24(result);
    return result;
};
const target48 = (node) => assert.ok(node.frame.width >= 48 && node.frame.height >= 48, `touch target ${JSON.stringify(node.frame)}`);
let cases = 0;
function test(name, run) {
    if (tabsOnly && !/tabs/i.test(name)) return;
    run();
    cases += 1;
    console.log(`✓ ${name}`);
}

test('native legacy errata reproduces the ancestor-width percentage bug', () => {
    const node = (style, children = []) => ({ type: 'View', props: { style }, children });
    const nodes = layout(
        node({ width: 50 }, [
            node({ alignSelf: 'flex-start', alignItems: 'center' }, [
                node({ width: 24, height: 24 }),
                node({ position: 'absolute', left: '100%', marginLeft: -6, width: 6, height: 6 }),
            ]),
        ])
    );
    near(nodes[3].frame.x, 44, 'legacy percentage uses available50 instead of intrinsic24');
});

// Execute the actual shared action hierarchy. Surface shadows and native glyph
// paint are bounded leaves; all sizes, wrappers and caller styles come from
// Button/IconButton, then Yoga resolves their positions in the parent row.
function MixedHeightActions({ alignItems = 'center', actionStyles = [] }) {
    return jsx('View', {
        testID: 'mixed-actions',
        style: { flexDirection: 'row', gap: 16, justifyContent: 'center', alignItems },
        children: [
            jsx(IconButton, {
                icon: 'skip_previous',
                mode: 'outlined',
                sizeClass: 'medium',
                widthVariant: 'wide',
                style: actionStyles[0],
                testID: 'mixed-previous',
            }),
            jsx(Button, { size: 'large', icon: 'pause', children: 'Pause', style: actionStyles[1], testID: 'mixed-play' }),
            jsx(IconButton, {
                icon: 'skip_next',
                mode: 'outlined',
                sizeClass: 'medium',
                widthVariant: 'wide',
                style: actionStyles[2],
                testID: 'mixed-next',
            }),
        ],
    });
}
const verticalCenter = (node) => node.frame.top + node.frame.height / 2;
const actionFrames = (host) => ['mixed-previous', 'mixed-play', 'mixed-next'].map((key) => id(host, key));
test('mixed 56/96/56 actions inherit the row center through the shared Button base', () => {
    const host = mount(MixedHeightActions, {});
    const [previous, play, next] = actionFrames(host);
    for (const [node, height] of [
        [previous, 56],
        [play, 96],
        [next, 56],
    ])
        near(node.frame.height, height, 'actual visual height');
    near(verticalCenter(previous), verticalCenter(play), 'previous is centered on the large button');
    near(verticalCenter(next), verticalCenter(play), 'next is centered on the large button');
    near(previous.frame.top - play.frame.top, 20, 'different-height controls keep equal centers');
});
test('negative control reproduces the former 20dp center error from forced flex-start', () => {
    const host = mount(MixedHeightActions, { actionStyles: Array.from({ length: 3 }, () => ({ alignSelf: 'flex-start' })) });
    const [previous, play, next] = actionFrames(host);
    near(previous.frame.top, play.frame.top, 'old placement forced matching top edges');
    near(verticalCenter(play) - verticalCenter(previous), 20, 'previous center is visibly 20dp too high');
    near(verticalCenter(play) - verticalCenter(next), 20, 'next center is visibly 20dp too high');
});
for (const alignItems of ['flex-start', 'flex-end'])
    test(`mixed actions inherit intentional parent ${alignItems} alignment`, () => {
        const host = mount(MixedHeightActions, { alignItems });
        const [previous, play, next] = actionFrames(host);
        const edge = (node) => node.frame.top + (alignItems === 'flex-end' ? node.frame.height : 0);
        near(edge(previous), edge(play), 'previous respects the parent edge');
        near(edge(next), edge(play), 'next respects the parent edge');
        near(verticalCenter(previous) - verticalCenter(play), alignItems === 'flex-start' ? -20 : 20, 'parent chooses the actual centers');
    });
test('an explicit caller alignSelf overrides the parent without moving its siblings', () => {
    const host = mount(MixedHeightActions, { actionStyles: [{ alignSelf: 'flex-end' }] });
    const [previous, play, next] = actionFrames(host);
    near(previous.frame.top + previous.frame.height, play.frame.top + play.frame.height, 'caller aligns only previous to the end');
    near(verticalCenter(previous) - verticalCenter(play), 20, 'the explicit override remains effective');
    near(verticalCenter(next), verticalCenter(play), 'next still inherits center');
});
for (const direction of ['ltr', 'rtl'])
    for (const rootDirection of ['ltr', 'rtl'])
        test(`Button leading icon and logical label margin follow locale ${direction} inside native ${rootDirection}`, () => {
            const host = mount(
                Button,
                {
                    size: 'medium',
                    icon: 'send',
                    children: 'Send',
                    labelStyle: { marginStart: 12 },
                    style: { width: 280, alignSelf: 'center' },
                    testID: 'logical-button',
                },
                { direction, rootDirection }
            );
            const button = id(host, 'logical-button');
            const icon = glyph(host, button);
            const label = descendants(host, button, (node) => node.type === 'Text')[0];
            const gap =
                direction === 'rtl'
                    ? icon.frame.left - label.frame.left - label.frame.width
                    : label.frame.left - icon.frame.left - icon.frame.width;
            near(gap, 20, 'the leading8dp gap and12dp logical margin are on the same side');
            near(verticalCenter(icon), verticalCenter(label), 'glyph and label stay vertically centered');
            const contentLeft = Math.min(icon.frame.left, label.frame.left);
            const contentRight = Math.max(icon.frame.left + icon.frame.width, label.frame.left + label.frame.width);
            near((contentLeft + contentRight) / 2, center(button), 'the icon/label group stays centered in a wider button');
        });
test('explicit content direction and logical padding retain caller priority over locale/native RTL', () => {
    const host = mount(
        Button,
        {
            size: 'medium',
            icon: 'send',
            children: 'Send',
            style: { width: 280 },
            contentStyle: { direction: 'ltr', flexDirection: 'row', justifyContent: 'flex-start', paddingStart: 32, paddingEnd: 8 },
            testID: 'caller-direction',
        },
        { direction: 'rtl', rootDirection: 'rtl' }
    );
    const button = id(host, 'caller-direction');
    const icon = glyph(host, button);
    const label = descendants(host, button, (node) => node.type === 'Text')[0];
    near(icon.frame.left - button.frame.left, 32, 'explicit LTR paddingStart is on the left');
    near(label.frame.left - icon.frame.left - icon.frame.width, 8, 'caller-requested row places the icon before its text');
});
test('an explicit reversed content row remains available without native RTL changing it again', () => {
    const host = mount(
        Button,
        {
            size: 'medium',
            icon: 'send',
            children: 'Send',
            style: { width: 280 },
            contentStyle: { flexDirection: 'row-reverse' },
            testID: 'caller-reverse',
        },
        { direction: 'ltr', rootDirection: 'rtl' }
    );
    const button = id(host, 'caller-reverse');
    const icon = glyph(host, button);
    const label = descendants(host, button, (node) => node.type === 'Text')[0];
    near(icon.frame.left - label.frame.left - label.frame.width, 8, 'the consumer can still reverse its local row deliberately');
});

for (const variant of ['expressive', 'baseline'])
    for (const direction of ['ltr', 'rtl'])
        for (const rootDirection of ['ltr', 'rtl'])
            test(`List slots retain logical order and published insets (${variant}, locale ${direction}, native ${rootDirection})`, () => {
                const iconSize = variant === 'expressive' ? 20 : 24;
                const gap = variant === 'expressive' ? 12 : 16;
                const host = mount(
                    ListItem,
                    {
                        variant,
                        title: 'Headline',
                        style: { width: 358 },
                        leading: jsx('Icon', { source: 'leading', size: iconSize }),
                        trailing: jsx('Icon', { source: 'trailing', size: iconSize }),
                        onPress() {},
                        testID: 'list-geometry',
                    },
                    { direction, rootDirection }
                );
                const row = id(host, 'list-geometry');
                const leading = descendants(host, row, (node) => node.type === 'Icon' && node.props.source === 'leading')[0];
                const trailing = descendants(host, row, (node) => node.type === 'Icon' && node.props.source === 'trailing')[0];
                const label = descendants(host, row, (node) => node.type === 'Text' && node.props.children === 'Headline')[0];
                const contentSlot = host.nodes[label.parent];
                near(
                    direction === 'rtl'
                        ? row.frame.left + row.frame.width - leading.frame.left - leading.frame.width
                        : leading.frame.left - row.frame.left,
                    16,
                    'leading inset'
                );
                near(
                    direction === 'rtl'
                        ? contentSlot.frame.left + contentSlot.frame.width + gap
                        : leading.frame.left + leading.frame.width + gap,
                    direction === 'rtl' ? leading.frame.left : contentSlot.frame.left,
                    'leading/content separation'
                );
                near(
                    direction === 'rtl'
                        ? trailing.frame.left - row.frame.left
                        : row.frame.left + row.frame.width - trailing.frame.left - trailing.frame.width,
                    16,
                    'trailing inset'
                );
                assert.ok(
                    contentSlot.frame.width > leading.frame.width && contentSlot.frame.width > trailing.frame.width,
                    'content is the largest-width slot'
                );
                near(verticalCenter(leading), verticalCenter(row), 'leading glyph is vertically centered');
                near(verticalCenter(trailing), verticalCenter(row), 'trailing glyph is vertically centered');
            });
test('a tall baseline media row grows and top-aligns content instead of centering it in the image height', () => {
    const host = mount(ListItem, {
        variant: 'baseline',
        title: 'Media',
        description: 'Details',
        leading: jsx('View', { style: { width: 100, height: 100 }, testID: 'tall-media' }),
        onPress() {},
        testID: 'tall-list',
    });
    const row = id(host, 'tall-list');
    const title = descendants(host, row, (node) => node.type === 'Text' && node.props.children === 'Media')[0];
    const media = id(host, 'tall-media');
    assert.ok(row.frame.height >= 116, 'the tallest slot contributes its natural height and row padding');
    near(title.frame.top - row.frame.top, 12, 'tall baseline text uses its published top padding');
    near(media.frame.top - row.frame.top, 12, 'tall leading media starts at the same inner top edge');
});
test('an explicit fixed row height fills its actual primary touch region', () => {
    const host = mount(ListItem, { title: 'Fixed-height row', style: { height: 96 }, onPress() {}, testID: 'fixed-height-list' });
    near(id(host, 'fixed-height-list').frame.height, 96, 'the visible fixed-height container has a matching primary region');
});
for (const multiAction of [false, true])
    test(`a full-height trailing IconButton fills its List row without changing the row height (multi-action ${multiAction})`, () => {
        const host = mount(ListItem, {
            title: 'Headline',
            description: 'Details',
            multiAction,
            onPress() {},
            testID: 'full-height-list',
            trailing: ({ height, style }) =>
                jsx(IconButton, {
                    icon: 'more_vert',
                    mode: 'contained-tonal',
                    style,
                    contentStyle: { height },
                    onPress() {},
                    accessibilityLabel: 'More options',
                    testID: 'full-height-action',
                }),
        });
        const row = id(host, multiAction ? 'full-height-list-primary' : 'full-height-list');
        const action = id(host, 'full-height-action');
        near(row.frame.height, 72, 'two-line row keeps its published nominal height');
        near(action.frame.height, row.frame.height, 'the icon button visual surface fills the row');
        near(action.frame.top, row.frame.top, 'the action starts at the row top');
        const rowAncestors = descendants(host, row, (node) => node.props.testID === 'full-height-action');
        assert.equal(rowAncestors.length, multiAction ? 0 : 1, 'multi-action places the supplementary button outside the primary action');
    });

for (const variant of ['expressive', 'baseline'])
    for (const direction of ['ltr', 'rtl'])
        for (const rootDirection of ['ltr', 'rtl'])
            test(`full-row native List indication preserves content and trailing bounds (${variant}, locale ${direction}, native ${rootDirection})`, () => {
                const iconSize = variant === 'expressive' ? 20 : 24;
                const gap = variant === 'expressive' ? 12 : 16;
                const contentEnd = variant === 'expressive' ? 12 : 16;
                const trailing = (width) => jsx('Pressable', { style: { width, height: 72 }, testID: 'independent-list-control' });
                const host = mount(ListItem, {
                    variant,
                    title: 'Headline',
                    description: 'Details',
                    style: { width: 358 },
                    leading: jsx('Icon', { source: 'leading', size: iconSize }),
                    trailing: trailing(96),
                    multiAction: true,
                    onPress() {},
                    testID: 'expanded-native-list',
                }, { direction, rootDirection, fontScale: 2, measureText: true });
                for (const width of [96, 48, 0]) {
                    host.update({ trailing: width ? trailing(width) : null });
                    const primary = id(host, 'expanded-native-list-primary');
                    const row = host.nodes[host.nodes[primary.parent].parent];
                    const label = descendants(host, primary, (node) => node.type === 'Text' && node.props.children === 'Headline')[0];
                    const contentSlot = host.nodes[label.parent];
                    near(primary.frame.left, row.frame.left, 'native indication begins at the row leading edge');
                    near(primary.frame.width, row.frame.width, 'native indication covers the complete clipped row');
                    near(contentSlot.frame.width, 358 - 16 - iconSize - gap - contentEnd - width - 16, 'label width excludes the unchanged trailing slot');
                    if (width) {
                        const control = id(host, 'independent-list-control');
                        near(direction === 'rtl' ? control.frame.left - row.frame.left : row.frame.left + row.frame.width - control.frame.left - control.frame.width,
                            16, 'independent control retains its logical end inset');
                        assert.ok(direction === 'rtl'
                            ? contentSlot.frame.left >= control.frame.left + control.frame.width
                            : contentSlot.frame.left + contentSlot.frame.width <= control.frame.left,
                        'primary content cannot occupy the independent control');
                        assert.ok(!descendants(host, primary, () => true).includes(control), 'secondary touch ownership stays outside the expanded primary');
                        assert.ok(flatten(host.nodes[control.parent].props.style).zIndex > (flatten(primary.props.style).zIndex ?? 0),
                            'native hit testing gives the independent target priority over the expanded indication');
                    }
                }
            });

for (const direction of ['ltr', 'rtl']) {
    for (const badge of [true, 8, 9999])
        test(`intrinsic24 badge in48 target (${direction}, ${badge})`, () => {
            const host = mount(
                BadgedBox,
                { badge, style: { width: 48, height: 48 }, testID: 'box', children: jsx('Icon', { size: 24 }) },
                { direction }
            );
            const box = id(host, 'box'),
                anchor = id(host, 'box-anchor'),
                icon = glyph(host, box),
                marker = id(host, 'box-badge');
            target48(box);
            size24(anchor);
            near(center(icon), center(box), 'icon center in touch target');
            near(icon.frame.top + 12, box.frame.top + 24, 'icon vertically centered');
            const offset = badge === true ? 6 : 12;
            if (direction === 'ltr') near(marker.frame.left, icon.frame.left + 24 - offset, 'numeric leading start');
            else near(marker.frame.left + marker.frame.width, icon.frame.left + offset, 'mirrored trailing end');
            near(marker.frame.top, icon.frame.top + (badge === true ? 0 : -2), 'vertical anchor');
        });
    test(`standalone caption does not move dot or glyph (${direction})`, () => {
        function Caption() {
            return jsx('View', {
                style: { alignSelf: 'center', alignItems: 'center' },
                children: [
                    jsx(BadgedBox, { badge: true, testID: 'caption-box', children: jsx('Icon', { size: 24 }) }),
                    jsx('Text', { children: 'Correo' }),
                ],
            });
        }
        const host = mount(Caption, {}, { direction });
        const box = id(host, 'caption-box'),
            icon = glyph(host, box),
            text = find(host, (node) => node.type === 'Text');
        near(center(icon), center(text), 'glyph/caption center');
        const marker = id(host, 'caption-box-badge');
        near(
            direction === 'ltr' ? marker.frame.left - icon.frame.left : icon.frame.left + 24 - marker.frame.left - marker.frame.width,
            18,
            'dot overlap remains6'
        );
    });
    test(`large badge measures intrinsically beyond its24dp anchor (${direction})`, () => {
        const props = { badge: 1, testID: 'intrinsic-badge', style: { width: 24, height: 24 }, children: jsx('Icon', { size: 24 }) };
        const host = mount(BadgedBox, props, { direction });
        const icon = glyph(host, id(host, 'intrinsic-badge'));
        const initialAnchor =
            direction === 'rtl'
                ? id(host, 'intrinsic-badge-badge').frame.left + id(host, 'intrinsic-badge-badge').frame.width
                : id(host, 'intrinsic-badge-badge').frame.left;
        near(id(host, 'intrinsic-badge-badge').frame.width, 16, 'single digit stays circular');
        host.update({ badge: 1200 });
        const marker = id(host, 'intrinsic-badge-badge');
        near(marker.frame.width, 34, '999+ receives its unconstrained nominal label width');
        near(
            direction === 'rtl' ? marker.frame.left + marker.frame.width : marker.frame.left,
            initialAnchor,
            'growth keeps the same logical anchor'
        );
        near(center(glyph(host, id(host, 'intrinsic-badge'))), center(icon), 'badge growth never shifts the icon');
        near(id(host, 'intrinsic-badge-anchor').frame.width, 24, 'the badge does not enlarge the intrinsic icon anchor');

        // The original column anchor makes AbsoluteLayout.cpp impose its24dp
        // width, even if a max-content keyword is present. A fake Text with a
        // fixed width would incorrectly hide that constraint and render as34.
        function ColumnAnchor() {
            return jsx('View', {
                style: { width: 24, height: 24, position: 'relative', flexDirection: 'column' },
                children: [
                    jsx('Icon', { size: 24 }),
                    jsx('View', {
                        style: { position: 'absolute', width: 'max-content', left: 12, bottom: 10 },
                        testID: 'constrained-badge',
                        children: jsx(Badge, { children: 1200 }),
                    }),
                ],
            });
        }
        const constrained = mount(ColumnAnchor, {}, { direction });
        const narrow = id(constrained, 'constrained-badge');
        const text = descendants(constrained, narrow, (node) => node.type === 'PaperBadge')[0];
        assert.ok(text.frame.width < 34, `negative control must constrain a34dp label: ${text.frame.width}`);
        assert.ok(text.frame.width - 8 < text.measure.width, 'not enough measured content width for999+ predicts native ellipsis');
    });
    test(`fixed primary tabs center glyph, label and indicator (${direction})`, () => {
        const host = mount(
            Tabs,
            {
                items: [
                    { key: 'a', label: 'Guardado', icon: 'save' },
                    { key: 'b', label: 'Compartido', icon: 'share', badge: true },
                ],
                value: 'a',
                onValueChange() {},
                testID: 'tabs',
            },
            { direction }
        );
        for (const key of ['a', 'b']) {
            const target = id(host, `tabs-${key}`),
                icon = glyph(host, target),
                label = descendants(host, target, (node) => node.type === 'Text')[0];
            target48(target);
            near(target.frame.height, 64, 'stacked tab height');
            near(center(icon), center(target), 'glyph center');
            near(center(label), center(target), 'label center');
        }
        near(center(id(host, 'tabs-indicator')), center(id(host, 'tabs-a')), 'indicator center');
        near(id(host, 'tabs-indicator').frame.height, 3, 'primary indicator');
    });
    test(`inline tabs mirror icon-label order and keep24 glyph (${direction})`, () => {
        const host = mount(
            Tabs,
            {
                items: [
                    { key: 'a', label: 'Inicio', icon: 'home' },
                    { key: 'b', label: 'Correo', icon: 'mail', badge: 8 },
                ],
                value: 'a',
                iconPosition: 'start',
                onValueChange() {},
                testID: 'inline',
            },
            { direction }
        );
        for (const key of ['a', 'b']) {
            const target = id(host, `inline-${key}`),
                icon = glyph(host, target),
                text = descendants(host, target, (node) => node.type === 'Text')[0];
            target48(target);
            near(target.frame.height, 48, 'inline tab height');
            near(
                direction === 'rtl'
                    ? icon.frame.left - text.frame.left - text.frame.width
                    : text.frame.left - icon.frame.left - icon.frame.width,
                8,
                'icon-label gap'
            );
        }
    });
    test(`secondary fixed tabs divide the complete row and use a full-tab indicator (${direction})`, () => {
        const host = mount(
            Tabs,
            {
                items: [
                    { key: 'a', label: 'Inicio' },
                    { key: 'b', label: 'Biblioteca', badge: 8 },
                    { key: 'c', label: 'Correo' },
                ],
                variant: 'secondary',
                value: 'b',
                onValueChange() {},
                testID: 'secondary-tabs',
            },
            { direction, width: 390 }
        );
        const row = id(host, 'secondary-tabs-row');
        const targets = ['a', 'b', 'c'].map((key) => id(host, `secondary-tabs-${key}`));
        for (const target of targets) {
            target48(target);
            near(target.frame.width, 130, 'fixed destinations occupy equal shares');
            near(target.frame.height, 48, 'secondary baseline height');
        }
        const selected = targets[1],
            marker = id(host, 'secondary-tabs-indicator');
        near(row.frame.width, 390, 'the tab row occupies its viewport');
        near(marker.frame.left, selected.frame.left, 'secondary marker starts at the selected edge');
        near(marker.frame.width, selected.frame.width, 'secondary marker spans the complete target');
        near(marker.frame.height, 2, 'secondary marker thickness');
        near(row.frame.height, selected.frame.height, 'the divider adds no height');
    });
    for (const variant of ['primary', 'secondary'])
        test(`${variant} scrollable tabs preserve52dp logical edge padding and intrinsic labels (${direction})`, () => {
            const host = mount(
                Tabs,
                {
                    items: [
                        { key: 'a', label: 'Inicio' },
                        { key: 'b', label: 'Compartido' },
                        { key: 'c', label: 'Biblioteca' },
                    ],
                    variant,
                    scrollable: true,
                    value: 'b',
                    onValueChange() {},
                    testID: 'scroll-tabs',
                },
                { direction, width: 240 }
            );
            const row = id(host, 'scroll-tabs-row'),
                first = id(host, 'scroll-tabs-a');
            near(
                direction === 'rtl'
                    ? row.frame.left + row.frame.width - first.frame.left - first.frame.width
                    : first.frame.left - row.frame.left,
                52,
                'scrollable start inset'
            );
            assert.ok(row.frame.width > 240, 'the source row can overflow the compact viewport');
            for (const key of ['a', 'b', 'c']) {
                const target = id(host, `scroll-tabs-${key}`);
                const label = descendants(host, target, (node) => node.type === 'Text')[0];
                target48(target);
                assert.ok(label.frame.left >= target.frame.left, 'label remains within its target start');
                assert.ok(
                    label.frame.left + label.frame.width <= target.frame.left + target.frame.width + 0.34,
                    'label remains within its target end'
                );
            }
        });
    for (const scale of [1.5, 2])
        for (const variant of ['primary', 'secondary'])
            test(`${variant} tabs keep scaled labels and badges within their real targets (${direction}, ${scale})`, () => {
                const host = mount(
                    Tabs,
                    {
                        items: [
                            { key: 'a', label: 'Inicio', icon: 'home' },
                            { key: 'b', label: 'Correo', icon: 'mail', badge: 8 },
                        ],
                        value: 'a',
                        variant,
                        onValueChange() {},
                        testID: 'scaled-tabs',
                    },
                    { direction, width: 390, fontScale: scale, measureText: true }
                );
                for (const key of ['a', 'b']) {
                    const target = id(host, `scaled-tabs-${key}`),
                        icon = glyph(host, target);
                    const label = descendants(host, target, (node) => node.type === 'Text')[0];
                    target48(target);
                    size24(icon);
                    assert.ok(label.frame.top >= target.frame.top - 0.34, 'scaled label does not escape the target top');
                    assert.ok(
                        label.frame.top + label.frame.height <= target.frame.top + target.frame.height + 0.34,
                        'scaled label does not escape the target bottom'
                    );
                    assert.ok(label.frame.left >= target.frame.left - 0.34, 'scaled label keeps its start within the target');
                    assert.ok(
                        label.frame.left + label.frame.width <= target.frame.left + target.frame.width + 0.34,
                        'scaled label keeps its end within the target'
                    );
                    if (variant === 'primary') {
                        near(center(icon), center(target), 'stacked icon keeps its center as text grows');
                        assert.ok(label.frame.top >= icon.frame.top + icon.frame.height, 'stacked content never overlaps');
                    } else near(verticalCenter(icon), verticalCenter(label), 'inline icon stays centered on scaled label');
                }
            });
    for (const [variant, pillWidth] of [['standard', 64], ['short', 56]])
        test(`navigation ${variant} centers the glyph in its ${pillWidth}dp pill (${direction})`, () => {
            const host = mount(
                NavigationBar,
                {
                    items: [
                        { key: 'a', label: 'Inicio', icon: 'home' },
                        { key: 'b', label: 'Correo', icon: 'mail', badge: true },
                        { key: 'c', label: 'Biblioteca', icon: 'book', badge: 9999 },
                    ],
                    value: 'a',
                    variant,
                    onValueChange() {},
                    safeArea: false,
                    testID: 'bar',
                },
                { direction }
            );
            for (const key of ['a', 'b', 'c']) {
                const target = id(host, `bar-${key}`),
                    row = host.nodes[target.parent],
                    icon = glyph(host, row),
                    label = id(host, `bar-${key}-label`),
                    indicator = id(host, `bar-${key}-indicator`),
                    pill = host.nodes[indicator.parent];
                target48(row);
                assert.ok(target.frame.width + target.props.hitSlop.left + target.props.hitSlop.right >= 48);
                assert.ok(target.frame.height + target.props.hitSlop.top + target.props.hitSlop.bottom >= 48);
                near(pill.frame.width, pillWidth, 'pill reserves the variant width');
                near(pill.frame.height, 32, 'pill height');
                near(indicator.frame.width, key === 'a' ? pillWidth : 0, 'only the selected destination paints the full pill');
                near(center(indicator), center(icon), 'the selection starts or ends centered on the glyph');
                near(center(icon), center(pill), 'glyph center in pill');
                near(center(icon), center(target), 'glyph center in destination');
                near(center(label), center(row), 'label center');
            }
        });
    test(`short horizontal navigation keeps glyph24 and mirrored content (${direction})`, () => {
        const host = mount(
            NavigationBar,
            {
                items: [
                    { key: 'a', label: 'Inicio', icon: 'home', badge: true },
                    { key: 'b', label: 'Correo', icon: 'mail' },
                ],
                value: 'a',
                iconPosition: 'start',
                onValueChange() {},
                safeArea: false,
                testID: 'horizontal',
            },
            { direction }
        );
        const target = id(host, 'horizontal-a'),
            row = host.nodes[target.parent],
            icon = glyph(host, row),
            label = descendants(host, row, (node) => node.type === 'Text')[0];
        target48(row);
        assert.ok(target.frame.height + target.props.hitSlop.top + target.props.hitSlop.bottom >= 48);
        near(
            direction === 'rtl'
                ? icon.frame.left - label.frame.left - label.frame.width
                : label.frame.left - icon.frame.left - icon.frame.width,
            4,
            'short bar icon-label gap'
        );
    });
    for (const scale of [1, 1.5, 2])
        test(`navigation labels remain in bounds at text scale ${scale} (${direction})`, () => {
            for (const iconPosition of ['top', 'start']) {
                const host = mount(
                    NavigationBar,
                    {
                        items: [
                            { key: 'a', label: 'Inicio', icon: 'home' },
                            { key: 'b', label: 'Correo', icon: 'mail' },
                            { key: 'c', label: 'Biblioteca', icon: 'book' },
                        ],
                        value: 'a', iconPosition, arrangement: 'centered',
                        onValueChange() {}, safeArea: false, testID: 'scaled-bar',
                    },
                    { width: 272, direction, fontScale: scale, measureText: true }
                );
                for (const key of ['a', 'b', 'c']) {
                    const target = id(host, `scaled-bar-${key}`);
                    const row = host.nodes[target.parent];
                    const label = descendants(host, row, (node) => node.type === 'Text')[0];
                    assert.equal(label.props.variant, key === 'a' ? 'labelMediumEmphasized' : 'labelMedium');
                    assert.ok(row.frame.left >= -0.34 && row.frame.left + row.frame.width <= 272.34, 'centered item stays inside the available width');
                    assert.ok(label.frame.left >= row.frame.left - 0.34 && label.frame.left + label.frame.width <= row.frame.left + row.frame.width + 0.34, 'label stays inside its own destination');
                    assert.ok(label.frame.top + label.frame.height <= row.frame.top + row.frame.height + 0.34, 'bar grows vertically for scaled labels');
                }
            }
        });
    for (const [expanded, width] of [
        [false, 96],
        [true, 256],
    ])
        test(`rail keeps glyph24 at prescribed center/start (${direction}, ${width})`, () => {
            const host = mount(
                NavigationRail,
                {
                    items: [{ key: 'a', label: 'Inicio', icon: 'home', badge: true }],
                    value: 'a',
                    expanded,
                    onValueChange() {},
                    testID: 'rail',
                    style: { paddingTop: 0, paddingBottom: 0 },
                },
                { direction }
            );
            const target = id(host, 'rail-a'),
                row = host.nodes[target.parent],
                icon = glyph(host, row);
            const hitSlop = target.props.animatedProps.compute().hitSlop;
            const targetWidth = target.frame.width + hitSlop.left + hitSlop.right;
            const targetHeight = target.frame.height + hitSlop.top + hitSlop.bottom;
            assert.ok(targetWidth >= 48 && targetHeight >= 48, 'the native hitSlop target meets48dp');
            near(target.frame.left - hitSlop.left, row.frame.left, 'hit target starts at row left');
            near(target.frame.top - hitSlop.top, row.frame.top, 'hit target starts at row top');
            near(targetWidth, row.frame.width, 'hit target spans the real Yoga row width');
            near(targetHeight, row.frame.height, 'hit target spans the real Yoga row height');
            near(target.frame.height, expanded ? 56 : 32, 'ripple host stays inside the visible indicator');
            if (!expanded) near(center(icon), center(id(host, 'rail')), 'collapsed rail center');
            else
                near(
                    direction === 'rtl'
                        ? id(host, 'rail').frame.left + width - icon.frame.left - icon.frame.width
                        : icon.frame.left - id(host, 'rail').frame.left,
                    36,
                    'expanded rail icon start'
                );
        });
    const badgeConfigurations = [
        { name: 'inactive with label', active: false, labelVisibility: 'all' },
        { name: 'inactive without label', active: false, labelVisibility: 'none' },
        { name: 'active with label', active: true, labelVisibility: 'all' },
        { name: 'active navigation bar without label', active: true, labelVisibility: 'none' },
        { name: 'active navigation rail without label', active: true, labelVisibility: 'none', rail: true },
    ];
    for (const configuration of badgeConfigurations)
        for (const badge of [true, 1, 1200])
            test(`Badge specs: ${configuration.name}, ${badge} (${direction})`, () => {
                const requests = [];
                const Component = configuration.rail ? NavigationRail : NavigationBar;
                const host = mount(
                    Component,
                    {
                        items: [
                            { key: 'inbox', label: 'Correo', icon: 'mail', badge },
                            { key: 'home', label: 'Inicio', icon: 'home' },
                        ],
                        value: configuration.active ? 'inbox' : 'home',
                        onValueChange: (key) => requests.push(key),
                        labelVisibility: configuration.labelVisibility,
                        variant: 'standard',
                        safeArea: false,
                        style: { paddingTop: 0, paddingBottom: 0 },
                        testID: 'badge-spec',
                    },
                    { direction }
                );
                const target = id(host, 'badge-spec-inbox');
                const body = host.nodes[target.parent];
                const icon = glyph(host, body);
                const marker = descendants(host, body, (node) => node.props.testID === 'mobile-badged-box-badge')[0];
                assert.ok(marker, 'badge belongs to the real icon slot');
                const offset = badge === true ? 6 : 12;
                near(
                    direction === 'rtl'
                        ? marker.frame.left + marker.frame.width - icon.frame.left
                        : icon.frame.left + 24 - marker.frame.left,
                    offset,
                    'badge logical overlap'
                );
                near(marker.frame.top + marker.frame.height - icon.frame.top, badge === true ? 6 : 14, 'badge bottom overlap');
                const labels = descendants(host, body, (node) => node.type === 'Text' && node.props.children === 'Correo');
                assert.equal(labels.length > 0, configuration.labelVisibility === 'all');
                assert.equal(target.props.accessibilityLabel, badge === true ? 'Correo, novedades' : `Correo, ${badge}`);
                assert.equal(target.props.accessibilityState.selected, configuration.active);
                if (configuration.labelVisibility === 'none') {
                    near(icon.frame.top + 12, body.frame.top + body.frame.height / 2, 'no phantom label space below the icon');
                    near(center(icon), center(body), 'icon-only content remains centered');
                    if (configuration.rail) {
                        near(target.frame.width, 56, 'rail circle width');
                        near(target.frame.height, 56, 'rail circle height');
                    }
                }
                const leaf = descendants(host, marker, (node) => node.type === 'PaperBadge')[0];
                assert.equal(leaf.props.children, badge === true ? undefined : badge > 999 ? '999+' : badge);
                near(
                    leaf.frame.width,
                    badge === true ? 6 : badge > 999 ? 34 : 16,
                    'the destination preserves the full measured badge width'
                );
                target.props.onPress();
                assert.deepEqual(requests, ['inbox'], 'removing the visual label never removes its destination action');
            });
    for (const Component of [NavigationBar, NavigationRail])
        test(`${Component.name} selected label visibility stays controlled (${direction})`, () => {
            const host = mount(
                Component,
                {
                    items: [
                        { key: 'a', label: 'Inicio', icon: 'home', badge: true },
                        { key: 'b', label: 'Correo', icon: 'mail', badge: 8 },
                    ],
                    value: 'a',
                    onValueChange() {},
                    labelVisibility: 'selected',
                    safeArea: false,
                    style: { paddingTop: 0, paddingBottom: 0 },
                    testID: 'selected-label',
                },
                { direction }
            );
            const labelFor = (key) => {
                const target = id(host, `selected-label-${key}`);
                const body = host.nodes[target.parent];
                return descendants(
                    host,
                    body,
                    (node) => node.type === 'Text' && node.props.children === (key === 'a' ? 'Inicio' : 'Correo')
                );
            };
            assert.ok(labelFor('a').length > 0);
            assert.equal(labelFor('b').length, 0);
            host.update({ value: 'b' });
            assert.equal(labelFor('a').length, 0);
            assert.ok(labelFor('b').length > 0);
            host.update({ labelVisibility: 'none' });
            assert.equal(labelFor('a').length + labelFor('b').length, 0);
            assert.equal(id(host, 'selected-label-b').props.accessibilityLabel, 'Correo, 8');
            host.update({ labelVisibility: 'all' });
            assert.ok(labelFor('a').length > 0 && labelFor('b').length > 0);
        });
    for (const iconPosition of ['top', 'start'])
        test(`short icon-only bar centers both icon configurations (${direction}, ${iconPosition})`, () => {
            const host = mount(
                NavigationBar,
                {
                    items: [
                        { key: 'a', label: 'Inicio', icon: 'home', badge: true },
                        { key: 'b', label: 'Correo', icon: 'mail' },
                    ],
                    value: 'a',
                    iconPosition,
                    arrangement: 'centered',
                    labelVisibility: 'none',
                    safeArea: false,
                    onValueChange() {},
                    testID: 'short-icon',
                },
                { direction }
            );
            const target = id(host, 'short-icon-a'),
                row = host.nodes[target.parent],
                icon = glyph(host, row);
            near(center(icon), center(row), 'horizontal icon center');
            near(icon.frame.top + 12, row.frame.top + 32, 'vertical icon center');
            near(row.frame.width, 80, 'icon-only centered items do not reserve inline label width');
            near(target.frame.width, 56, 'ripple remains inside the visible pill');
            assert.equal(descendants(host, row, (node) => node.type === 'Text').length, 0);
        });
    test(`expanded icon-only rail keeps its icon badge visible (${direction})`, () => {
        const host = mount(
            NavigationRail,
            {
                items: [{ key: 'a', label: 'Correo', icon: 'mail', badge: 8 }],
                value: 'a',
                expanded: true,
                labelVisibility: 'none',
                onValueChange() {},
                testID: 'expanded-icon',
                style: { paddingTop: 0, paddingBottom: 0 },
            },
            { direction }
        );
        const target = id(host, 'expanded-icon-a'),
            row = host.nodes[target.parent],
            icon = glyph(host, row);
        near(target.frame.width, 56, 'no phantom label width in content indicator');
        near(target.frame.height, 56, 'icon-only circle');
        near(icon.frame.top + 12, row.frame.top + 28, 'icon center');
        const marker = descendants(host, row, (node) => node.props.testID === 'mobile-badged-box-badge')[0];
        assert.notEqual(flatten(marker.props.style).opacity, 0, 'badge does not disappear with a missing expanded label');
        assert.equal(descendants(host, row, (node) => node.type === 'Text').length, 0);
    });
}
for (const scale of [1, 1.5, 2])
    for (const direction of ['ltr', 'rtl'])
        test(`scaled large badge preserves its bottom14 overlap (${direction}, ${scale})`, () => {
            const host = mount(
                BadgedBox,
                { badge: 1200, testID: 'scaled', children: jsx('Icon', { size: 24 }) },
                { direction, fontScale: scale }
            );
            const marker = id(host, 'scaled-badge'),
                icon = glyph(host, id(host, 'scaled'));
            near(marker.frame.height, 16 * scale, 'the native Text metric input is allowed to grow');
            near(marker.frame.top + marker.frame.height - icon.frame.top, 14, 'height growth moves upward from the same bottom overlap');
            near(
                direction === 'rtl' ? marker.frame.left + marker.frame.width - icon.frame.left : icon.frame.left + 24 - marker.frame.left,
                12,
                'scaled text keeps the logical anchor'
            );
            host.update({ badge: true });
            near(id(host, 'scaled-badge').frame.width, 6, 'small dot never scales with the text');
            near(id(host, 'scaled-badge').frame.height, 6, 'small dot height stays6');
        });
test('count/visibility updates preserve icon and badge logical start', () => {
    const host = mount(BadgedBox, { badge: 1, testID: 'live', children: jsx('Icon', { size: 24 }) });
    const start = id(host, 'live-badge').frame.left,
        iconCenter = center(glyph(host, id(host, 'live')));
    host.update({ badge: 9999 });
    near(id(host, 'live-badge').frame.left, start, 'count grows from same logical start');
    near(center(glyph(host, id(host, 'live'))), iconCenter, 'count never shifts glyph');
    assert.equal(descendants(host, id(host, 'live-badge'), (node) => node.type === 'PaperBadge')[0].props.children, '999+');
    host.update({ badge: false });
    assert.equal(host.nodes.filter((node) => node.props.testID === 'live-badge').length, 0);
    host.update({ badge: true });
    near(id(host, 'live-badge').frame.left, start + 6, 'dot uses6dp rather than12dp offset');
});
for (const direction of ['ltr', 'rtl'])
    for (const rootDirection of ['ltr', 'rtl'])
        for (const variant of ['primary', 'secondary'])
            for (const scrollable of [false, true])
                test(`Tabs logical order follows locale ${direction} in native ${rootDirection} (${variant}, ${scrollable ? 'scrollable' : 'fixed'})`, () => {
                    const host = mount(
                        Tabs,
                        {
                            items: [
                                { key: 'a', label: 'Inicio', icon: 'home' },
                                { key: 'b', label: 'Correo', icon: 'mail', badge: true },
                            ],
                            value: 'a',
                            variant,
                            scrollable,
                            onValueChange() {},
                            testID: 'tabs-order',
                        },
                        { direction, rootDirection, width: 390 }
                    );
                    const a = id(host, 'tabs-order-a'),
                        b = id(host, 'tabs-order-b');
                    assert.ok(
                        direction === 'rtl' ? a.frame.left > b.frame.left : a.frame.left < b.frame.left,
                        'native direction must not mirror the explicit locale row a second time'
                    );
                    near(center(id(host, 'tabs-order-indicator')), center(a), 'the selected marker follows its actual native target');
                    for (const target of [a, b]) {
                        target48(target);
                        size24(glyph(host, target));
                    }
                });
for (const direction of ['ltr', 'rtl'])
    for (const mode of ['label-badge', 'stacked-icon', 'inline-icon'])
        test(`primary Tabs indicator uses the published label/icon/badge width (${direction}, ${mode})`, () => {
            const host = mount(
                Tabs,
                {
                    items: [
                        { key: 'a', label: 'Flights', badge: 3, ...(mode !== 'label-badge' ? { icon: 'flight' } : {}) },
                        { key: 'b', label: 'Trips', ...(mode !== 'label-badge' ? { icon: 'luggage' } : {}) },
                    ],
                    value: 'a',
                    iconPosition: mode === 'inline-icon' ? 'start' : 'top',
                    onValueChange() {},
                    testID: 'tabs-badge-width',
                },
                { direction, width: 390 }
            );
            const content = id(host, `tabs-badge-width-a-${mode === 'inline-icon' ? 'content' : 'label-group'}`);
            const marker = id(host, 'tabs-badge-width-indicator');
            near(
                marker.frame.width,
                Math.max(24, content.frame.width - 4),
                'primary width includes its published content group minus2dp per edge'
            );
            if (mode === 'stacked-icon') {
                const text = id(host, 'tabs-badge-width-a-label');
                near(content.frame.width, text.frame.width, 'a badge on the stacked icon does not widen the label indicator');
                const icon = glyph(host, id(host, 'tabs-badge-width-a'));
                const badge = id(host, 'tabs-badge-width-a-icon-badge');
                const overlap =
                    direction === 'rtl' ? badge.frame.left + badge.frame.width - icon.frame.left : icon.frame.left + icon.frame.width - badge.frame.left;
                near(overlap, 6, 'stacked numeric badge overlaps the icon by 6 dp');
                near(badge.frame.top, icon.frame.top, 'stacked badge aligns with the icon top');
            }
        });
for (const direction of ['ltr', 'rtl'])
    test(`Tabs keep a wide icon badge inside a narrow destination (${direction})`, () => {
        const host = mount(
            Tabs,
            {
                items: [
                    { key: 'a', label: 'Flights', icon: 'flight', badge: 1200 },
                    { key: 'b', label: 'Trips', icon: 'luggage' },
                    { key: 'c', label: 'Explore', icon: 'explore' },
                    { key: 'd', label: 'Buy', icon: 'shopping_cart' },
                ],
                value: 'a',
                onValueChange() {},
                testID: 'tabs-compact-badge',
            },
            { direction, width: 272, fontScale: 1.5, measureText: true }
        );
        const target = id(host, 'tabs-compact-badge-a');
        const badge = id(host, 'tabs-compact-badge-a-icon-badge');
        const text = descendants(host, badge, (node) => node.type === 'PaperBadge')[0];
        near(target.frame.width, 68, 'fixed row keeps equal width destinations');
        assert.equal(text.props.children, '999+');
        assert.ok(badge.frame.left >= target.frame.left - 0.34, 'badge is inside the left edge');
        assert.ok(badge.frame.left + badge.frame.width <= target.frame.left + target.frame.width + 0.34, 'badge is inside the right edge');
        near(center(glyph(host, target)), center(target), 'badge fitting does not move the icon');
    });
for (const direction of ['ltr', 'rtl'])
    for (const rootDirection of ['ltr', 'rtl'])
        test(`Tabs pager pages retain viewport width and physical page order (${direction}, native ${rootDirection})`, () => {
            const position = {
                value: 0,
                get() {
                    return this.value;
                },
                set(value) {
                    this.value = value;
                },
            };
            const host = mount(
                TabsContentPager,
                {
                    items: [
                        { key: 'a', label: 'First' },
                        { key: 'b', label: 'Second' },
                        { key: 'c', label: 'Third' },
                    ],
                    value: 'a',
                    position,
                    onValueChange() {},
                    renderPage: (item) => jsx('View', { style: { height: 200 }, testID: `tabs-pager-body-${item.key}` }),
                    style: { height: 320, flex: undefined },
                    testID: 'tabs-pager-layout',
                },
                { width: 300, direction, rootDirection }
            );
            const physical = direction === 'rtl' ? ['c', 'b', 'a'] : ['a', 'b', 'c'];
            physical.forEach((key, index) => {
                const page = id(host, `tabs-pager-layout-page-${key}`);
                near(page.frame.width, 300, 'a page must not grow/shrink its width through flex shorthand');
                near(page.frame.left, index * 300, 'horizontal page positions follow the native physical offset contract');
            });
        });
console.log(`PASS ${cases} navigation/badge/action geometry cases with installed RN${version} Yoga (YGErrataAll).`);
