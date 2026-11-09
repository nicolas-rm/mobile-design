/**
 * Actual TopAppBar + scroll-hook TSX, explicit hook/native/animation doubles.
 * RN SharedValue writes are deferred; UI transactions execute atomically.
 * Fixtures come from MD3 specs/responsive video (476→312dp), AndroidX
 * AppBar.kt d153d87ed76372ece0c99dac837ff07ab845d495 and token14_0_0.
 * This tests layout contracts and interruption/cleanup, not pixels, gesture
 * consumption, native font baselines, springs' perceived speed or FPS.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const requireShared = require('./require-mobile-design-shared.cjs');
const root = path.resolve(__dirname, '..');
let active,
    inUI = false,
    cases = 0,
    direction = 'ltr';
const queue = [],
    animations = new Set(),
    owners = new Set();
const dimensions = {
    width: 390,
    height: 844,
    fontScale: 1,
};
const theme = {
    animation: { scale: 0 },
    colors: {
        surface: '#fef7ff',
        surfaceContainer: '#f3edf7',
        surfaceContainerHighest: '#e6e0e9',
        onSurface: '#1d1b20',
        onSurfaceVariant: '#49454f',
    },
    fonts: {
        titleLarge: { lineHeight: 28 },
        labelMedium: { lineHeight: 16 },
        headlineSmall: { lineHeight: 32 },
        headlineMedium: { lineHeight: 36 },
        labelLarge: { lineHeight: 20 },
        headlineLarge: { lineHeight: 40 },
        displaySmall: { lineHeight: 44 },
        titleMedium: { lineHeight: 24 },
    },
    motion: { spring: { default: { effects: { stiffness: 1600, damping: 1 } } } },
};
const same = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
const hook = (create) => {
    const index = active.cursor++;
    return active.hooks[index] ?? (active.hooks[index] = create());
};
const effect = (create, dependencies) => {
    const slot = hook(() => ({}));
    if (!same(slot.dependencies, dependencies)) {
        slot.dependencies = dependencies;
        active.effects.push(() => {
            slot.cleanup?.();
            slot.cleanup = create();
        });
    }
};
const React = {
    useState(initial) {
        const host = active,
            slot = hook(() => ({ value: typeof initial === 'function' ? initial() : initial }));
        return [
            slot.value,
            (update) => {
                assert.ok(!host.disposed);
                const next = typeof update === 'function' ? update(slot.value) : update;
                if (!Object.is(next, slot.value)) {
                    slot.value = next;
                    host.dirty = true;
                }
            },
        ];
    },
    useRef: (current) => hook(() => ({ current })),
    useMemo(create, dependencies) {
        const slot = hook(() => ({}));
        if (!same(slot.dependencies, dependencies)) {
            slot.dependencies = dependencies;
            slot.value = create();
        }
        return slot.value;
    },
    useCallback: (callback, dependencies) => React.useMemo(() => callback, dependencies),
    useEffect: effect,
    useLayoutEffect: effect,
};
const jsx = (type, props) => ({ type, props: props ?? {} });
function runUI(callback) {
    const previous = inUI;
    inUI = true;
    try {
        callback();
    } finally {
        inUI = previous;
    }
}
function flushUI() {
    let count = 0;
    while (queue.length) {
        assert.ok(count++ < 100);
        const job = queue.shift();
        active = job.owner;
        runUI(job.callback);
    }
    react();
}
function react() {
    runUI(() => {
        for (const host of owners)
            if (!host.disposed)
                for (const slot of host.reactions) {
                    const next = slot.prepare();
                    if (!Object.is(next, slot.previous)) {
                        const previous = slot.previous;
                        slot.previous = next;
                        slot.respond(next, previous);
                    }
                }
    });
}
function cancelAnimation(shared) {
    const old = shared.animation;
    shared.animation = null;
    animations.delete(shared);
    old?.callback?.(false);
}
function shared(initial) {
    const owner = active;
    return {
        current: initial,
        animation: null,
        get() {
            return this.current;
        },
        set(value) {
            if (!inUI) {
                queue.push({ owner, callback: () => this.set(value) });
                return;
            }
            cancelAnimation(this);
            if (value && (value.kind === 'spring' || value.kind === 'decay')) {
                this.animation = value;
                animations.add(this);
            } else this.current = value;
        },
    };
}
const reanimated = {
    __esModule: true,
    default: { View: 'AnimatedView' },
    useSharedValue: (initial) => hook(() => shared(initial)),
    useDerivedValue(compute) {
        const value = hook(() => ({
            get() {
                return this.compute();
            },
        }));
        value.compute = compute;
        return value;
    },
    useAnimatedStyle: (compute) => ({ compute }),
    useAnimatedProps: (compute) => ({ compute }),
    useAnimatedScrollHandler: (handlers) => handlers,
    useAnimatedReaction(prepare, respond) {
        const slot = hook(() => ({ previous: null }));
        slot.prepare = prepare;
        slot.respond = respond;
        active.reactions.push(slot);
    },
    withSpring: (to, config, callback) => ({
        kind: 'spring',
        to,
        config,
        callback,
    }),
    withDecay: (config, callback) => ({ kind: 'decay', config, callback }),
    cancelAnimation,
    interpolateColor: (value, _input, output, space) => ({
        fraction: value,
        colors: output,
        space,
    }),
    ReduceMotion: { Never: 'never' },
};
const modules = {
    '@mobile-design/tokens': requireShared('@mobile-design/tokens'),
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': {
        jsx,
        jsxs: jsx,
        Fragment: 'Fragment',
    },
    'react-native': { Platform: { OS: 'ios' }, View: 'View', useWindowDimensions: () => dimensions },
    'react-native-paper': {
        Icon: 'Icon',
        Text: 'Text',
        TouchableRipple: 'TouchableRipple',
        useTheme: () => theme,
        useLocale: () => ({ direction }),
    },
    'react-native-gesture-handler': {
        GestureDetector: 'GestureDetector',
        Gesture: {
            Pan() {
                const gesture = { config: {}, handlers: {} };
                for (const name of ['activeOffsetY', 'failOffsetX', 'maxPointers', 'cancelsTouchesInView'])
                    gesture[name] = (value) => {
                        gesture.config[name] = value;
                        return gesture;
                    };
                for (const name of ['onStart', 'onUpdate', 'onEnd', 'onFinalize'])
                    gesture[name] = (value) => {
                        gesture.handlers[name] = value;
                        return gesture;
                    };
                return gesture;
            },
        },
    },
    'react-native-reanimated': reanimated,
    'react-native-safe-area-context': {
        useSafeAreaInsets: () => ({
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        }),
    },
    'react-native-worklets': { scheduleOnUI: (fn, ...args) => queue.push({ owner: active, callback: () => fn(...args) }) },
    './icon-button': { IconButton: 'IconButton' },
};
function load(file) {
    const exports = {};
    vm.runInNewContext(
        ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
            compilerOptions: {
                target: ts.ScriptTarget.ES2022,
                module: ts.ModuleKind.CommonJS,
                jsx: ts.JsxEmit.ReactJSX,
            },
        }).outputText,
        {
            exports,
            require(name) {
                assert.ok(modules[name], `explicit boundary: ${name}`);
                return modules[name];
            },
        }
    );
    return exports;
}
const geometry = (modules['./appbar-layout'] = load('packages/mobile-design/src/components/appbar-layout.ts'));
const { useAppBarScrollBehavior } = (modules['./appbar-scroll-behavior'] = load(
    'packages/mobile-design/src/components/appbar-scroll-behavior.tsx'
));
const { TopAppBar } = load('packages/mobile-design/src/components/appbar.tsx');
class Host {
    constructor(fn, props = {}) {
        Object.assign(this, {
            fn,
            props,
            hooks: [],
            effects: [],
            reactions: [],
            disposed: false,
        });
        owners.add(this);
        this.render();
    }
    render(props = this.props) {
        this.props = props;
        let count = 0;
        do {
            assert.ok(count++ < 15);
            active = this;
            this.cursor = 0;
            this.dirty = false;
            this.effects = [];
            this.reactions = [];
            this.tree = this.fn(this.props);
            this.effects.forEach((create) => create());
        } while (this.dirty);
        return this;
    }
    event(callback, ...args) {
        active = this;
        callback(...args);
        if (this.dirty) this.render();
        return this;
    }
    ui(callback, ...args) {
        active = this;
        runUI(() => callback(...args));
        react();
        if (this.dirty) this.render();
        return this;
    }
    dispose() {
        active = this;
        this.hooks.forEach((slot) => slot.cleanup?.());
        this.disposed = true;
    }
}
const walk = (node) =>
    Array.isArray(node) ? node.flatMap(walk) : node && typeof node === 'object' ? [node, ...walk(node.props?.children)] : [];
const id = (host, name) => {
    const result = walk(host.tree).find((node) => node.props?.testID === name);
    assert.ok(result, name);
    return result;
};
const style = (value) => (Array.isArray(value) ? Object.assign({}, ...value.map(style)) : value?.compute ? value.compute() : (value ?? {}));
const surface = (host) => (host.tree.type === 'GestureDetector' ? host.tree.props.children : host.tree);
const event = (y) => ({ contentOffset: { y }, velocity: { y: 0 } });
const near = (value, expected, label) => assert.ok(Math.abs(value - expected) < 0.00002, `${label}: ${value} != ${expected}`);
function test(name, run) {
    try {
        run();
        cases++;
        console.log(`PASS ${name}`);
    } finally {
        for (const host of owners) if (!host.disposed) host.dispose();
        flushUI();
        owners.clear();
        queue.length = 0;
        assert.equal(animations.size, 0, 'unmount cancels every animation');
        direction = 'ltr';
        dimensions.fontScale = 1;
        theme.animation.scale = 0;
    }
}
function controller(behavior = 'exit-until-collapsed', expanded = 136, top = 0) {
    const host = new Host(useAppBarScrollBehavior, { behavior });
    host.tree._setLayout(expanded, 64, top);
    flushUI();
    return host;
}
function scroll(host, y) {
    return host.ui(host.tree.onScroll.onScroll, event(y));
}
function complete(shared, value) {
    const animation = shared.animation;
    assert.ok(animation);
    runUI(() => {
        shared.animation = null;
        animations.delete(shared);
        shared.current = value ?? animation.to;
        animation.callback?.(true);
    });
    react();
    return animation;
}
test('responsive search uses observed476→312dp and grows at50% only beyond624dp', () => {
    for (const [available, expected] of [
        [0, 0],
        [200, 200],
        [312, 312],
        [476, 312],
        [624, 312],
        [1000, 500],
    ])
        assert.equal(geometry.appBarSearchWidth(available), expected);
    assert.equal(geometry.appBarSearchWidth(NaN), 0);
});
test('AndroidX alpha/color curves preserve the title during the midpoint', () => {
    // Independent x=.5 fixtures, solved with Decimal40 precision/160 bisections.
    near(geometry.appBarCompactTitleAlpha(0.5), 0.045670218066, 'top alpha');
    near(geometry.appBarContainerFraction(0.5), 0.324814610601, 'FastOutLinearIn color');
    const progress = shared(0.5),
        host = new Host(TopAppBar, {
            title: 'Heading',
            variant: 'medium-flexible',
            collapseProgress: progress,
        });
    flushUI();
    near(style(id(host, 'mobile-top-appbar-expanded').props.style).opacity, 0.5, 'expanded alpha1−f');
    assert.ok(style(id(host, 'mobile-top-appbar-compact').props.style).opacity > 0);
    assert.equal(style(id(host, 'mobile-top-appbar-expanded').props.style).transform, undefined, 'no invented extra title translation');
    const color = style(surface(host).props.style).backgroundColor;
    near(color.fraction, 0.324814610601, 'color curve');
    assert.equal(color.space, 'LAB', 'same Oklab space as Compose Color.lerp');
});
test('current variants retain their nominal heights', () => {
    for (const [variant, subtitle, height] of [
        ['small', undefined, 64],
        ['medium-flexible', undefined, 112],
        ['medium-flexible', 'Subtitle', 136],
        ['large-flexible', undefined, 120],
        ['large-flexible', 'Subtitle', 152],
    ]) {
        const host = new Host(TopAppBar, {
            title: 'Heading',
            variant,
            subtitle,
            statusBarHeight: 0,
        });
        assert.equal(style(surface(host).props.style).height, height);
    }
});
test('two-line and large-font content grows from its actual measured height', () => {
    const host = new Host(TopAppBar, {
        title: 'Heading',
        variant: 'medium-flexible',
        statusBarHeight: 0,
    });
    host.event(id(host, 'mobile-top-appbar-expanded-content').props.onLayout, { nativeEvent: { layout: { width: 300, height: 72 } } });
    assert.equal(style(surface(host).props.style).height, 136);
    assert.equal(
        style(id(host, 'mobile-top-appbar-expanded').props.style).paddingBottom,
        0,
        'baseline padding yields to text when the row is full'
    );
    host.event(id(host, 'mobile-top-appbar-compact-content').props.onLayout, { nativeEvent: { layout: { width: 250, height: 84 } } });
    assert.equal(style(id(host, 'mobile-top-appbar-row').props.style).height, 84);
    assert.equal(style(surface(host).props.style).height, 156);
});
test('flexible headings wrap to two lines without an ellipsis and subtitle follows without a gap', () => {
    const host = new Host(TopAppBar, {
        title: 'Heading',
        subtitle: 'Subtitle',
        variant: 'medium-flexible',
    });
    const expanded = id(host, 'mobile-top-appbar-expanded-content');
    const texts = walk(expanded).filter((node) => node.type === 'Text');
    assert.equal(texts[0].props.numberOfLines, 2);
    assert.equal(texts[0].props.ellipsizeMode, 'clip');
    assert.equal(texts[1].props.numberOfLines, 1);
    assert.equal(style(expanded.props.style).gap, undefined);
});
test('small image replaces all text while flexible image contributes measured height', () => {
    const image = jsx('Logo', { width: 48, height: 48 });
    const small = new Host(TopAppBar, {
        title: 'Heading',
        subtitle: 'Subtitle',
        image,
    });
    assert.equal(walk(small.tree).filter((node) => node.type === 'Text').length, 0);
    const large = new Host(TopAppBar, {
        title: 'Heading',
        image,
        variant: 'large-flexible',
    });
    large.event(id(large, 'mobile-top-appbar-expanded-content').props.onLayout, { nativeEvent: { layout: { width: 300, height: 100 } } });
    assert.equal(style(large.tree.props.style).height, 164);
});
test('an explicit null collapsed title hides both compact texts and retains64dp even after large-text measurement', () => {
    dimensions.fontScale = 3;
    const host = new Host(TopAppBar, { title: 'Our cabin for the weekend', subtitle: 'Subtitle', variant: 'medium-flexible' });
    host.event(id(host, 'mobile-top-appbar-compact-content').props.onLayout, { nativeEvent: { layout: { width: 240, height: 132 } } });
    host.render({ ...host.props, collapsedTitle: null, collapseProgress: shared(1) });
    assert.equal(walk(id(host, 'mobile-top-appbar-compact-content')).filter((node) => node.type === 'Text').length, 0);
    assert.equal(style(id(host, 'mobile-top-appbar-row').props.style).height, 64);
    assert.equal(style(surface(host).props.style).height, 64);
    assert.equal(
        walk(id(host, 'mobile-top-appbar-expanded-content')).find((node) => node.type === 'Text').props.children,
        'Our cabin for the weekend'
    );
});
test('a custom collapsed heading changes only the compact row; default and small headings retain their existing content', () => {
    const host = new Host(TopAppBar, {
        title: 'An expanded title',
        collapsedTitle: 'Cabin',
        subtitle: 'A weekend away',
        variant: 'medium-flexible',
    });
    assert.equal(walk(id(host, 'mobile-top-appbar-compact-content')).find((node) => node.type === 'Text').props.children, 'Cabin');
    assert.equal(
        walk(id(host, 'mobile-top-appbar-expanded-content')).find((node) => node.type === 'Text').props.children,
        'An expanded title'
    );
    host.render({ ...host.props, collapsedTitle: undefined });
    assert.equal(
        walk(id(host, 'mobile-top-appbar-compact-content')).find((node) => node.type === 'Text').props.children,
        'An expanded title'
    );
    host.render({ ...host.props, variant: 'small', collapsedTitle: null });
    assert.equal(
        walk(id(host, 'mobile-top-appbar-compact-content')).find((node) => node.type === 'Text').props.children,
        'An expanded title'
    );
});
test('centered title uses available asymmetric space rather than truncating to symmetric action insets', () => {
    const actions = [
        {
            key: 'a',
            icon: 'save',
            label: 'Save',
            onPress() {},
        },
        {
            key: 'b',
            icon: 'share',
            label: 'Share',
            onPress() {},
        },
    ];
    for (const rtl of [false, true]) {
        direction = rtl ? 'rtl' : 'ltr';
        const host = new Host(TopAppBar, {
            title: 'A200dp heading',
            textAlign: 'center',
            navigationIcon: 'back',
            onNavigationPress() {},
            actions,
        });
        host.event(id(host, 'mobile-top-appbar-row').props.onLayout, { nativeEvent: { layout: { width: 390 } } });
        host.event(id(host, 'mobile-top-appbar-compact-content').props.onLayout, { nativeEvent: { layout: { width: 200, height: 28 } } });
        const frame = style(id(host, 'mobile-top-appbar-compact').props.style);
        assert.equal(frame.width, 230);
        assert.equal(frame.left, rtl ? 104 : 56);
        const shift = style(id(host, 'mobile-top-appbar-compact-content').props.style).transform[0].translateX;
        assert.equal(shift, rtl ? -15 : 15);
        assert.equal(frame.left + (frame.width - 200) / 2 + shift, rtl ? 104 : 86);
    }
});
test('narrow→wide and changed titles keep the full text constraint available for remeasurement', () => {
    const actions = [
        {
            key: 'a',
            icon: 'save',
            label: 'Save',
            onPress() {},
        },
        {
            key: 'b',
            icon: 'share',
            label: 'Share',
            onPress() {},
        },
    ];
    const host = new Host(TopAppBar, {
        title: 'A long heading',
        textAlign: 'center',
        navigationIcon: 'back',
        onNavigationPress() {},
        actions,
    });
    host.event(id(host, 'mobile-top-appbar-row').props.onLayout, { nativeEvent: { layout: { width: 260 } } });
    host.event(id(host, 'mobile-top-appbar-compact-content').props.onLayout, { nativeEvent: { layout: { width: 100, height: 28 } } });
    assert.equal(style(id(host, 'mobile-top-appbar-compact').props.style).width, 100);
    host.event(id(host, 'mobile-top-appbar-row').props.onLayout, { nativeEvent: { layout: { width: 500 } } });
    assert.equal(
        style(id(host, 'mobile-top-appbar-compact').props.style).width,
        340,
        'old clipped100dp does not cap the new text constraint'
    );
    host.event(id(host, 'mobile-top-appbar-compact-content').props.onLayout, { nativeEvent: { layout: { width: 200, height: 28 } } });
    host.render({
        ...host.props,
        title: 'New short heading',
        variant: 'large-flexible',
    });
    assert.equal(style(id(host, 'mobile-top-appbar-compact').props.style).width, 340);
    direction = 'rtl';
    host.render();
    assert.equal(style(id(host, 'mobile-top-appbar-compact').props.style).width, 340);
});
test('leading and trailing slots keep48dp targets and locale RTL aligns title to the right', () => {
    direction = 'rtl';
    const host = new Host(TopAppBar, {
        title: 'Heading',
        variant: 'medium-flexible',
        leading: jsx('Logo', {}),
        trailing: jsx('Avatar', {}),
    });
    for (const name of ['leading', 'trailing']) assert.equal(style(id(host, `mobile-top-appbar-${name}-slot`).props.style).minWidth, 48);
    assert.equal(style(id(host, 'mobile-top-appbar-row').props.style).flexDirection, 'row-reverse');
    const expanded = id(host, 'mobile-top-appbar-expanded-content');
    assert.equal(style(expanded.props.style).alignItems, 'flex-end');
    assert.equal(style(walk(expanded).find((node) => node.type === 'Text').props.style).textAlign, 'right');
});
test('search is a64dp variant with8dp gaps and default/scrolled container roles', () => {
    const host = new Host(TopAppBar, {
        title: 'Unused',
        search: jsx('Search', {}),
        variant: 'large-flexible',
    });
    flushUI();
    assert.equal(style(surface(host).props.style).height, 64);
    host.event(id(host, 'mobile-top-appbar-row').props.onLayout, { nativeEvent: { layout: { width: 500 } } });
    const search = id(host, 'mobile-top-appbar-search-container');
    assert.equal(style(search.props.style).width, 312);
    assert.equal(style(search.props.style).minHeight, 56);
    assert.equal(style(search.props.style).backgroundColor.colors[0], theme.colors.surfaceContainer);
    host.render({ ...host.props, scrolled: true });
    flushUI();
    assert.equal(style(id(host, 'mobile-top-appbar-search-container').props.style).backgroundColor.fraction, 1);
});
test('a continuous container color survives search remounts, new cover roles and header remeasurement', () => {
    const color = shared('#141218');
    const host = new Host(TopAppBar, {
        title: 'Favorites',
        search: jsx('Search', {}),
        containerColor: '#197577',
        containerColorSource: color,
    });
    flushUI();
    assert.equal(style(surface(host).props.style).backgroundColor, '#141218');
    // Opening Player hides SearchView; metadata can also change while it is covered.
    host.render({ ...host.props, search: undefined, containerColor: '#a24a22' });
    flushUI();
    assert.equal(style(surface(host).props.style).backgroundColor, '#141218');
    host.render({ ...host.props, search: jsx('Search', {}) });
    host.event(id(host, 'mobile-top-appbar-search-container').props.onLayout, { nativeEvent: { layout: { width: 312, height: 80 } } });
    flushUI();
    assert.equal(style(surface(host).props.style).height, 88);
    assert.equal(style(surface(host).props.style).backgroundColor, '#141218');
    // Continuing to scroll or returning to the top updates the same owner without a React render.
    host.ui(() => color.set('#241548'));
    assert.equal(style(surface(host).props.style).backgroundColor, '#241548');
    host.ui(() => color.set('#197577'));
    assert.equal(style(surface(host).props.style).backgroundColor, '#197577');
    const dynamic = { dynamic: { light: '#fff', dark: '#141218' } };
    host.ui(() => color.set(dynamic));
    assert.equal(style(surface(host).props.style).backgroundColor, dynamic);
});
test('opaque native dynamic colors switch to the scrolled role instead of getting stuck flat', () => {
    const flat = { dynamic: { light: '#fff', dark: '#000' } },
        scrolled = { dynamic: { light: '#eee', dark: '#111' } };
    const host = new Host(TopAppBar, {
        title: 'Heading',
        variant: 'medium-flexible',
        collapseProgress: shared(1),
        containerColor: flat,
        scrolledContainerColor: scrolled,
    });
    assert.equal(style(surface(host).props.style).backgroundColor, scrolled);
});
test('search alternate colors support string interpolation and opaque native endpoint roles', () => {
    const host = new Host(TopAppBar, {
        title: '',
        search: jsx('Search', {}),
        searchContainerColor: '#fffbff',
        scrolledSearchContainerColor: '#dddddd',
    });
    flushUI();
    assert.deepEqual(Array.from(style(id(host, 'mobile-top-appbar-search-container').props.style).backgroundColor.colors), [
        '#fffbff',
        '#dddddd',
    ]);
    const flat = { dynamic: { light: '#fffbff', dark: '#333333' } },
        scrolled = { dynamic: { light: '#eeeeee', dark: '#111111' } };
    host.render({
        ...host.props,
        searchContainerColor: flat,
        scrolledSearchContainerColor: scrolled,
    });
    flushUI();
    assert.equal(style(id(host, 'mobile-top-appbar-search-container').props.style).backgroundColor, flat);
    host.render({ ...host.props, scrolled: true });
    flushUI();
    assert.equal(style(id(host, 'mobile-top-appbar-search-container').props.style).backgroundColor, scrolled);
});
test('the accessible heading changes once at the collapse threshold', () => {
    const progress = shared(0.49),
        host = new Host(TopAppBar, {
            title: 'Heading',
            variant: 'medium-flexible',
            collapseProgress: progress,
        });
    assert.equal(id(host, 'mobile-top-appbar-compact').props.animatedProps.compute().accessibilityElementsHidden, true);
    assert.equal(id(host, 'mobile-top-appbar-expanded').props.animatedProps.compute().accessibilityElementsHidden, false);
    runUI(() => progress.set(0.5));
    assert.equal(id(host, 'mobile-top-appbar-compact').props.animatedProps.compute().accessibilityElementsHidden, false);
    assert.equal(id(host, 'mobile-top-appbar-expanded').props.animatedProps.compute().accessibilityElementsHidden, true);
});
test('exit-until-collapsed uses the measured range and stays collapsed far from the top', () => {
    const host = controller();
    scroll(host, 36);
    near(host.tree.collapseProgress.get(), 0.5, 'half72dp range');
    scroll(host, 500);
    assert.equal(host.tree.heightOffset.get(), -72);
    scroll(host, 400);
    assert.equal(host.tree.heightOffset.get(), -72);
    scroll(host, 0);
    assert.equal(host.tree.heightOffset.get(), 0);
});
test('coalesced/programmatic return consumes only the portion within the collapse range', () => {
    const jumped = controller();
    scroll(jumped, 500);
    scroll(jumped, 30);
    const direct = controller();
    scroll(direct, 30);
    assert.equal(jumped.tree.heightOffset.get(), -30);
    assert.equal(jumped.tree.heightOffset.get(), direct.tree.heightOffset.get());
});
test('scrolling after an expanded snap collapses by the new movement without a threshold jump', () => {
    const host = controller();
    scroll(host, 30);
    host.ui(host.tree.onScroll.onEndDrag, event(30));
    near(host.tree.heightOffset.get(), 0, 'snap expanded');
    scroll(host, 75);
    assert.equal(host.tree.heightOffset.get(), -45, 'only45dp moved after the snap, even though content passed72dp');
});
test('pinned bars preserve height while exposing content overlap for the color', () => {
    const host = controller('pinned');
    scroll(host, 500);
    near(host.tree.heightOffset.get(), 0, 'pinned height');
    assert.equal(host.tree._contentOffset.get(), 500);
});
test('pinned small-bar color follows overlap without requiring a height collapse', () => {
    const behavior = controller('pinned');
    const bar = new Host(TopAppBar, { title: 'Heading', scrollBehavior: behavior.tree });
    flushUI();
    scroll(behavior, 500);
    assert.equal(style(bar.tree.props.style).height, 64);
    assert.equal(style(bar.tree.props.style).backgroundColor.fraction, 1);
});
test('pinned flexible bars also change color while retaining the expanded title and height', () => {
    for (const [variant, height] of [
        ['medium-flexible', 112],
        ['large-flexible', 120],
    ]) {
        const behavior = controller('pinned');
        const bar = new Host(TopAppBar, {
            title: 'Heading',
            variant,
            scrollBehavior: behavior.tree,
        });
        flushUI();
        scroll(behavior, 500);
        assert.equal(style(bar.tree.props.style).height, height);
        assert.equal(style(bar.tree.props.style).backgroundColor.fraction, 1);
        assert.equal(style(id(bar, 'mobile-top-appbar-expanded').props.style).opacity, 1);
        const old = theme.colors.surfaceContainer;
        try {
            theme.colors.surfaceContainer = '#211f26';
            bar.render();
            flushUI();
            const color = style(bar.tree.props.style).backgroundColor;
            assert.equal(color.fraction, 1, 'switching theme does not rewind overlap fill');
            assert.equal(color.colors[1], '#211f26');
        } finally {
            theme.colors.surfaceContainer = old;
        }
    }
});
test('enter-always hides the full bar and reveals it while reversing anywhere in the page', () => {
    const host = controller('enter-always', 136, 44);
    scroll(host, 1000);
    assert.equal(host.tree.heightOffset.get(), -180);
    scroll(host, 970);
    assert.equal(host.tree.heightOffset.get(), -150);
    scroll(host, 800);
    assert.equal(host.tree.heightOffset.get(), 0);
});
test('scroll endpoints ignore non-finite values and overscroll does not invert the bar', () => {
    const host = controller();
    scroll(host, 30);
    const before = host.tree.heightOffset.get();
    scroll(host, NaN);
    scroll(host, Infinity);
    assert.equal(host.tree.heightOffset.get(), before);
    scroll(host, -50);
    assert.equal(host.tree.heightOffset.get(), 0);
});
test('snap uses DefaultEffects onUI and a new drag cancels its old completion', () => {
    theme.animation.scale = 1;
    const host = controller();
    scroll(host, 40);
    host.ui(host.tree.onScroll.onEndDrag, event(40));
    const animation = host.tree.heightOffset.animation;
    assert.ok(animation);
    assert.equal(animation.to, -72);
    assert.equal(animation.config.stiffness, 1600);
    assert.equal(animation.config.damping, 80);
    assert.equal(animation.config.reduceMotion, 'never');
    host.ui(host.tree.onScroll.onBeginDrag, event(40));
    assert.equal(host.tree.heightOffset.animation, null);
    host.ui(animation.callback, true);
    scroll(host, 20);
    assert.equal(host.tree.heightOffset.get(), -20);
});
test('native momentum owns scrolling until momentum-end triggers the settle', () => {
    theme.animation.scale = 1;
    const host = controller();
    scroll(host, 40);
    host.ui(host.tree.onScroll.onEndDrag, {
        contentOffset: { y: 40 },
        targetContentOffset: { y: 140 },
        velocity: { y: 1 },
    });
    assert.equal(host.tree.heightOffset.animation, null);
    host.ui(host.tree.onScroll.onMomentumEnd, event(40));
    assert.ok(host.tree.heightOffset.animation);
    complete(host.tree.heightOffset);
    assert.equal(host.tree.heightOffset.get(), -72);
});
test('a nonzero release velocity without projected momentum still settles the bar', () => {
    theme.animation.scale = 1;
    const host = controller();
    scroll(host, 40);
    host.ui(host.tree.onScroll.onEndDrag, {
        contentOffset: { y: 40 },
        targetContentOffset: { y: 40 },
        velocity: { y: 0.02 },
    });
    assert.equal(host.tree.heightOffset.animation.to, -72);
});
test('platforms without a target projection cancel the provisional snap when momentum starts', () => {
    theme.animation.scale = 1;
    const host = controller();
    scroll(host, 40);
    host.ui(host.tree.onScroll.onEndDrag, { contentOffset: { y: 40 }, velocity: { y: 1 } });
    assert.ok(host.tree.heightOffset.animation);
    host.ui(host.tree.onScroll.onMomentumBegin);
    assert.equal(host.tree.heightOffset.animation, null);
    scroll(host, 50);
    assert.equal(host.tree.heightOffset.get(), -50);
});
test('the exact half-way snap collapses instead of expanding', () => {
    theme.animation.scale = 1;
    const host = controller();
    scroll(host, 36);
    host.ui(host.tree.onScroll.onEndDrag, event(36));
    assert.equal(host.tree.heightOffset.animation.to, -72);
});
test('reducing motion during a settle finishes the existing target with no stale animation', () => {
    theme.animation.scale = 1;
    const host = controller();
    scroll(host, 40);
    host.ui(host.tree.onScroll.onEndDrag, event(40));
    theme.animation.scale = 0;
    host.render();
    flushUI();
    assert.equal(host.tree.heightOffset.get(), -72);
    assert.equal(host.tree.heightOffset.animation, null);
});
test('layout rebasing is an atomicUI transaction and preserves the logical collapse fraction', () => {
    const host = controller('exit-until-collapsed', 112);
    scroll(host, 24);
    host.tree._setLayout(168, 64, 0);
    assert.equal(host.tree.heightOffset.get(), -24, 'RN has not applied the queuedUI layout yet');
    flushUI();
    assert.equal(host.tree.heightOffset.get(), -52);
    near(host.tree.collapseProgress.get(), 0.5, 'fraction after resize');
    host.render({ behavior: 'pinned' });
    flushUI();
    near(host.tree.heightOffset.get(), 0, 'pinned after resize');
});
test('reset and unmount cannot leave a queued snap or retained scroll handler active', () => {
    theme.animation.scale = 1;
    const host = controller();
    scroll(host, 40);
    host.ui(host.tree.onScroll.onEndDrag, event(40));
    const retained = host.tree.onScroll.onScroll;
    host.tree.reset();
    flushUI();
    assert.equal(host.tree.heightOffset.get(), 0);
    assert.equal(host.tree.heightOffset.animation, null);
    host.dispose();
    flushUI();
    host.ui(retained, event(70));
    assert.equal(host.tree.heightOffset.get(), 0);
    host.tree._setLayout(200, 64, 0);
    flushUI();
    assert.equal(host.tree._metrics.get().expanded, 136);
});
test('only non-pinned controlled bars mount a vertical recognizer without replacing their action targets', () => {
    const pinned = controller('pinned');
    assert.equal(pinned.tree._dragGesture, undefined);
    const plain = new Host(TopAppBar, { title: 'Heading', scrollBehavior: pinned.tree });
    assert.equal(plain.tree.type, 'AnimatedView');
    const movable = controller();
    const gesture = movable.tree._dragGesture;
    assert.deepEqual(Array.from(gesture.config.activeOffsetY), [-8, 8]);
    assert.deepEqual(Array.from(gesture.config.failOffsetX), [-8, 8]);
    assert.equal(gesture.config.maxPointers, 1);
    assert.equal(gesture.config.cancelsTouchesInView, true);
    assert.equal(gesture.handlers.onBegin, undefined, 'touch down/hold must not interrupt a settle before vertical activation');
    let pressed = 0;
    const bar = new Host(TopAppBar, {
        title: 'Heading',
        scrollBehavior: movable.tree,
        actions: [{ key: 'mic', icon: 'mic', label: 'Search by voice', onPress: () => pressed++ }],
    });
    assert.equal(bar.tree.type, 'GestureDetector');
    assert.equal(bar.tree.props.gesture, gesture);
    bar.event(id(bar, 'mobile-top-appbar-mic').props.onPress);
    assert.equal(pressed, 1, 'the child action still receives its own press callback');
    // Recognition/cancellation by native UIKit/Android is tested on the device,
    // not inferred from this explicit gesture boundary.
});
test('a failed unactivated pan leaves a tap or hold and the previous settle untouched', () => {
    theme.animation.scale = 1;
    const host = controller();
    scroll(host, 40);
    host.ui(host.tree.onScroll.onEndDrag, event(40));
    const animation = host.tree.heightOffset.animation;
    host.ui(host.tree._dragGesture.handlers.onFinalize, { translationY: 0 }, false);
    assert.equal(host.tree.heightOffset.animation, animation);
    assert.equal(host.tree.heightOffset.get(), -40);
});
test('dragging the bar consumes vertical overslop and incremental movement without moving the content', () => {
    const host = controller();
    const handlers = host.tree._dragGesture.handlers;
    host.ui(handlers.onStart, { translationY: -10 });
    assert.equal(host.tree.heightOffset.get(), -2, 'touch slop is removed from the first movement');
    host.ui(handlers.onUpdate, { translationY: -38 });
    assert.equal(host.tree.heightOffset.get(), -30);
    assert.equal(host.tree._contentOffset.get(), 0, 'bar drags do not fabricate a child scroll position');
    host.ui(handlers.onUpdate, { translationY: -500 });
    assert.equal(host.tree.heightOffset.get(), -72);
    host.ui(handlers.onUpdate, { translationY: 200 });
    assert.equal(host.tree.heightOffset.get(), 0);
    host.ui(handlers.onUpdate, { translationY: NaN });
    assert.equal(host.tree.heightOffset.get(), 0);
});
test('direct bar dragging interrupts an old snap and ignores its retained completion', () => {
    theme.animation.scale = 1;
    const host = controller();
    scroll(host, 40);
    host.ui(host.tree.onScroll.onEndDrag, event(40));
    const animation = host.tree.heightOffset.animation;
    const handlers = host.tree._dragGesture.handlers;
    host.ui(handlers.onStart, { translationY: 10 });
    assert.equal(host.tree.heightOffset.animation, null);
    host.ui(animation.callback, true);
    host.ui(handlers.onUpdate, { translationY: 20 });
    assert.equal(host.tree.heightOffset.get(), -28);
    host.ui(handlers.onEnd, { velocityY: 0 }, true);
    assert.equal(host.tree.heightOffset.animation.kind, 'spring');
    assert.equal(host.tree.heightOffset.animation.to, 0);
});
test('a direct bar fling carries its measured velocity within bounds before DefaultEffects snap', () => {
    theme.animation.scale = 1;
    const host = controller();
    const handlers = host.tree._dragGesture.handlers;
    host.ui(handlers.onStart, { translationY: -10 });
    host.ui(handlers.onUpdate, { translationY: -38 });
    host.ui(handlers.onEnd, { velocityY: -240 }, true);
    const decay = host.tree.heightOffset.animation;
    assert.equal(decay.kind, 'decay');
    assert.equal(decay.config.velocity, -240);
    assert.deepEqual(Array.from(decay.config.clamp), [-72, 0]);
    assert.equal(decay.config.reduceMotion, 'never');
    host.ui(host.tree.onScroll.onScroll, event(70));
    host.ui(host.tree.onScroll.onMomentumBegin);
    host.ui(host.tree.onScroll.onMomentumEnd);
    assert.equal(host.tree.heightOffset.animation, decay, 'old native momentum may update content but cannot take over the bar');
    complete(host.tree.heightOffset, -50);
    const snap = host.tree.heightOffset.animation;
    assert.equal(snap.kind, 'spring');
    assert.equal(snap.to, -72);
    assert.equal(snap.config.stiffness, 1600);
    assert.equal(snap.config.damping, 80);
    complete(host.tree.heightOffset);
    assert.equal(host.tree.heightOffset.get(), -72);
});
test('an active cancellation settles once; reduced motion performs no decay or spring', () => {
    const host = controller();
    const handlers = host.tree._dragGesture.handlers;
    host.ui(handlers.onStart, { translationY: -10 });
    host.ui(handlers.onUpdate, { translationY: -48 });
    host.ui(handlers.onEnd, { velocityY: -1000 }, false);
    assert.equal(host.tree.heightOffset.get(), -72);
    assert.equal(host.tree.heightOffset.animation, null);
    host.ui(handlers.onFinalize, {}, false);
    assert.equal(host.tree.heightOffset.get(), -72);
    host.ui(handlers.onStart, { translationY: 10 });
    host.ui(handlers.onUpdate, { translationY: 58 });
    host.ui(handlers.onEnd, { velocityY: 1000 }, true);
    assert.equal(host.tree.heightOffset.get(), 0);
    assert.equal(host.tree.heightOffset.animation, null);
});
test('a new content drag cancels bar inertia and revokes stale bar gesture ownership', () => {
    theme.animation.scale = 1;
    const host = controller();
    const handlers = host.tree._dragGesture.handlers;
    host.ui(handlers.onStart, { translationY: -10 });
    host.ui(handlers.onUpdate, { translationY: -38 });
    host.ui(handlers.onEnd, { velocityY: -240 }, true);
    const decay = host.tree.heightOffset.animation;
    host.ui(host.tree.onScroll.onBeginDrag, event(100));
    assert.equal(host.tree.heightOffset.animation, null);
    host.ui(decay.callback, true);
    host.ui(handlers.onUpdate, { translationY: -100 });
    assert.equal(host.tree.heightOffset.get(), -30);
    scroll(host, 110);
    assert.equal(host.tree.heightOffset.get(), -40);
});
test('turning on reduced motion during bar inertia finishes from the current position', () => {
    theme.animation.scale = 1;
    const host = controller();
    const handlers = host.tree._dragGesture.handlers;
    host.ui(handlers.onStart, { translationY: -10 });
    host.ui(handlers.onUpdate, { translationY: -28 });
    host.ui(handlers.onEnd, { velocityY: -240 }, true);
    const decay = host.tree.heightOffset.animation;
    host.tree.heightOffset.current = -50; // explicit native decay frame
    theme.animation.scale = 0;
    host.render();
    flushUI();
    assert.equal(host.tree.heightOffset.animation, null);
    assert.equal(host.tree.heightOffset.get(), -72, 'current half-way threshold, not the original release position');
    host.ui(decay.callback, true);
    assert.equal(host.tree.heightOffset.animation, null);
});
test('snap false preserves a bar fling endpoint without forcing either boundary', () => {
    theme.animation.scale = 1;
    const host = new Host(useAppBarScrollBehavior, { behavior: 'exit-until-collapsed', snap: false });
    host.tree._setLayout(136, 64, 0);
    flushUI();
    const handlers = host.tree._dragGesture.handlers;
    host.ui(handlers.onStart, { translationY: -10 });
    host.ui(handlers.onUpdate, { translationY: -38 });
    host.ui(handlers.onEnd, { velocityY: -40 }, true);
    assert.equal(host.tree.heightOffset.animation.kind, 'decay');
    complete(host.tree.heightOffset, -42);
    assert.equal(host.tree.heightOffset.animation, null);
    assert.equal(host.tree.heightOffset.get(), -42);
});
test('pinning, reset and unmount revoke bar gestures and their pending decay callbacks', () => {
    theme.animation.scale = 1;
    const host = controller('enter-always', 136, 44);
    const handlers = host.tree._dragGesture.handlers;
    host.ui(handlers.onStart, { translationY: -10 });
    host.ui(handlers.onUpdate, { translationY: -108 });
    host.ui(handlers.onEnd, { velocityY: -500 }, true);
    const decay = host.tree.heightOffset.animation;
    host.render({ behavior: 'pinned' });
    flushUI();
    assert.equal(host.tree._dragGesture, undefined);
    near(host.tree.heightOffset.get(), 0, 'pinned bar');
    host.ui(decay.callback, true);
    host.ui(handlers.onStart, { translationY: -20 });
    assert.equal(host.tree.heightOffset.animation, null);
    near(host.tree.heightOffset.get(), 0, 'pinned ignores old gesture');
    host.render({ behavior: 'exit-until-collapsed' });
    flushUI();
    const active = host.tree._dragGesture.handlers;
    host.ui(active.onStart, { translationY: -20 });
    host.tree.reset();
    flushUI();
    host.ui(active.onUpdate, { translationY: -50 });
    assert.equal(host.tree.heightOffset.get(), 0);
    host.dispose();
    flushUI();
    for (const callback of [active.onStart, active.onUpdate, active.onEnd, active.onFinalize])
        host.ui(callback, { translationY: -60, velocityY: -500 }, true);
    assert.equal(host.tree.heightOffset.get(), 0);
    assert.equal(host.tree.heightOffset.animation, null);
});
console.log(`PASS ${cases} AppBar geometry/motion/scroll contracts; native rendering and momentum feel remain separate QA.`);
