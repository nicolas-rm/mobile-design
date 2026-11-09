/**
 * node scripts/verify-material-carousel-interactions.cjs
 * Exercises the actual controller and carousel components with a controllable UI clock,
 * queued UI→RN callbacks and minimal hook/native-view doubles. This checks ordering,
 * positions and actions, not React scheduling, native gesture physics or rendered FPS.
 * Package regressions also retain RN→UI writes until flushUI(), independently
 * from UI→RN completion delivery; synchronous doubles cannot expose that race.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const mobileDesign = true;
const componentDirectory = 'packages/mobile-design/src/components';
let active;
let version = 0;
const theme = {
    animation: { scale: 1 },
    colors: {},
    fonts: { titleLarge: { lineHeight: 28 }, bodyMedium: { lineHeight: 20 } },
    shapes: { corner: { extraLarge: 28, extraLargeIncreased: 32 } },
    motion: { spring: { fast: { spatial: { stiffness: 1400, damping: 0.9 } } } },
};
let window = { width: 408, height: 880, fontScale: 1 };
let localeDirection = 'ltr';
const depsEqual = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const hook = (create) => {
    const index = active.cursor++;
    return active.hooks[index] ?? (active.hooks[index] = create());
};
const effect = (fn, deps) => {
    const slot = hook(() => ({}));
    if (!depsEqual(slot.deps, deps)) {
        slot.deps = deps;
        active.effects.push(() => {
            slot.cleanup?.();
            slot.cleanup = fn();
        });
    }
};
const React = {
    memo: (fn) => fn,
    useRef: (current) => hook(() => ({ current })),
    useState(value) {
        const owner = active;
        const slot = hook(() => ({ value: typeof value === 'function' ? value() : value }));
        return [
            slot.value,
            (next) => {
                assert.ok(!owner.unmounted, 'no updates after unmount');
                next = typeof next === 'function' ? next(slot.value) : next;
                if (!Object.is(slot.value, next)) {
                    slot.value = next;
                    owner.dirty = true;
                }
            },
        ];
    },
    useMemo(fn, deps) {
        const slot = hook(() => ({}));
        if (!depsEqual(slot.deps, deps)) {
            slot.deps = deps;
            slot.value = fn();
        }
        return slot.value;
    },
    useCallback(fn, deps) {
        return React.useMemo(() => fn, deps);
    },
    useEffect: effect,
    useLayoutEffect: effect,
};
const cancel = (shared) => {
    const old = shared.animation;
    shared.animation = null;
    old?.callback?.(false);
};
const reanimated = {
    ReduceMotion: { Never: 'never' },
    View: 'AnimatedView',
    ScrollView: 'AnimatedScrollView',
    FlatList: 'AnimatedFlatList',
    useReducedMotion: () => false,
    useSharedValue(value) {
        const owner = active;
        return hook(() => {
            const shared = {
                value,
                animation: null,
                get() {
                    return this.value;
                },
                set(next) {
                    const apply = () => {
                        cancel(this);
                        if (next && next.timing) {
                            if (next.config.duration === 0) {
                                this.set(next.to);
                                next.callback?.(true);
                            } else this.animation = { ...next, from: this.value, elapsed: 0 };
                        } else if (!Object.is(this.value, next)) {
                            this.value = next;
                            version++;
                        }
                    };
                    if (owner.deferRNWrites && !owner.inUI) owner.uiWrites.push(apply);
                    else apply();
                },
            };
            active.shared.push(shared);
            return shared;
        });
    },
    useAnimatedRef() {
        return hook(() => {
            const ref = (node) => {
                if (node !== undefined) ref.current = node;
                return ref.current;
            };
            return ref;
        });
    },
    useAnimatedReaction(prepare, react) {
        const slot = hook(() => {
            const item = {};
            active.reactions.push(item);
            return item;
        });
        Object.assign(slot, { prepare, react });
    },
    useDerivedValue: (compute) => ({ get: compute }),
    useAnimatedStyle: (compute) => ({ compute }),
    useAnimatedScrollHandler: (handlers) => handlers,
    scrollTo(ref, x, y, animated) {
        const node = ref();
        assert.ok(node, 'native scroll ref is attached');
        Object.assign(node, { x, y, animated });
    },
    cancelAnimation: cancel,
    withTiming: (to, config, callback) => ({ timing: true, to, config, callback }),
    withSpring: (to) => to,
    Easing: { bezier: (...curve) => curve },
};
reanimated.default = reanimated;
const jsx = (type, props, key) => ({ type, props, key });
const modules = {
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
        Platform: { OS: 'ios' },
        View: 'View',
        ScrollView: 'ScrollView',
        FlatList: 'FlatList',
        I18nManager: { isRTL: false },
        StyleSheet: { create: (v) => v },
        useWindowDimensions: () => window,
    },
    'react-native-reanimated': reanimated,
    'react-native-paper': { useLocale: () => ({ direction: localeDirection }) },
    'react-native-worklets': {
        scheduleOnRN: (fn, ...args) => active.queued.push(() => fn(...args)),
        scheduleOnUI: (fn, ...args) => {
            const owner = active;
            const invoke = () => {
                const previous = owner.inUI;
                owner.inUI = true;
                try {
                    fn(...args);
                } finally {
                    owner.inUI = previous;
                }
            };
            if (owner.deferRNWrites) owner.uiWrites.push(invoke);
            else invoke();
        },
    },
    'expo-image': { Image: 'Image' },
    '@/theme/paper': { usePaperTheme: () => theme },
    '../core': { usePaperTheme: () => theme, useMobileTheme: () => theme },
    '../primitives': { Icon: 'Icon', IconButton: 'IconButton', Text: 'Text', TouchableRipple: 'TouchableRipple' },
    '../color': { withAlpha: (color) => color, toIconColor: (color) => color },
    './text-field': { TextField: 'TextInput' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) },
};
for (const name of ['Icon', 'IconButton', 'Text', 'TouchableRipple']) {
    modules[`./${name}`] = modules[`@/components/${name}`] = { [name]: name };
}
function load(file) {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, {
        exports,
        require: (name) => {
            assert.ok(modules[name], `mock module ${name}`);
            return modules[name];
        },
    });
    return exports;
}
const layout = (modules['./carousel-layout'] = load(`${componentDirectory}/carousel-layout.ts`));
modules['./carousel-scroll-controller'] = load(`${componentDirectory}/carousel-scroll-controller.tsx`);
modules['./focus-order'] = load(`${componentDirectory}/focus-order.ts`);
modules['./press-scope'] = load(`${componentDirectory}/press-scope.ts`);
const { FullScreenCarousel } = (modules['./carousel-full-screen'] = load(`${componentDirectory}/carousel-full-screen.tsx`));
let VerticalCarousel;
let verticalGeometry;
if (mobileDesign) {
    verticalGeometry = modules['./carousel-vertical-layout'] = load(`${componentDirectory}/carousel-vertical-layout.ts`);
    ({ VerticalCarousel } = modules['./carousel-vertical'] = load(`${componentDirectory}/carousel-vertical.tsx`));
}
const { Carousel } = load(`${componentDirectory}/carousel.tsx`);
const HorizontalCarousel = Carousel({}).type;
const walk = (tree) => (!tree || typeof tree !== 'object' ? [] : [tree, ...[tree.props?.children].flat(Infinity).flatMap(walk)]);
class Runner {
    constructor(component, props) {
        Object.assign(this, {
            component,
            props,
            hooks: [],
            shared: [],
            reactions: [],
            queued: [],
            uiWrites: [],
            inUI: false,
            deferRNWrites: false,
            node: {},
        });
        this.render();
    }
    render(props = this.props) {
        this.props = props;
        do {
            active = this;
            this.cursor = 0;
            this.effects = [];
            this.dirty = false;
            this.tree = this.component(props);
            const nextRef = this.scroll()?.props.ref;
            if (this.lastRef && this.lastRef !== nextRef) this.lastRef(null);
            this.lastRef = nextRef;
            nextRef?.(this.node);
            this.effects.forEach((fn) => fn());
        } while (this.dirty);
        return this;
    }
    drain(flush = true) {
        active = this;
        let previous;
        let passes = 0;
        do {
            assert.ok(++passes < 30, 'UI reactions settle');
            previous = version;
            this.inUI = true;
            try {
                for (const reaction of this.reactions) {
                    const next = reaction.prepare();
                    reaction.react(next, reaction.previous);
                    reaction.previous = next;
                }
            } finally {
                this.inUI = false;
            }
        } while (version !== previous);
        if (flush) this.flush();
        return this;
    }
    flush() {
        active = this;
        for (const fn of this.queued.splice(0)) fn();
        if (this.dirty) this.render();
        return this;
    }
    flushUI() {
        active = this;
        this.inUI = true;
        try {
            for (const job of this.uiWrites.splice(0)) job();
        } finally {
            this.inUI = false;
        }
        return this.drain(false);
    }
    advance(ms, flush = true) {
        active = this;
        this.inUI = true;
        try {
            for (const shared of this.shared) {
                const a = shared.animation;
                if (!a) continue;
                a.elapsed += ms;
                shared.value = a.from + (a.to - a.from) * Math.min(1, a.elapsed / a.config.duration);
                version++;
                if (a.elapsed >= a.config.duration) {
                    shared.animation = null;
                    a.callback?.(true);
                }
            }
        } finally {
            this.inUI = false;
        }
        return this.drain(flush);
    }
    scroll() {
        return walk(this.tree).find((n) => n.type === 'AnimatedScrollView' || n.type === 'AnimatedFlatList');
    }
    find(id) {
        const node = walk(this.tree).find((n) => n.props?.testID === id);
        assert.ok(node, id);
        return node;
    }
    press(id) {
        active = this;
        this.find(id).props.onPress();
        return this.drain();
    }
    native(handler, x, y = 0, flush = true) {
        active = this;
        this.inUI = true;
        try {
            this.scroll().props.onScroll[handler]?.({ contentOffset: { x, y } });
        } finally {
            this.inUI = false;
        }
        return this.drain(flush);
    }
    width(width) {
        this.tree.props.onLayout({ nativeEvent: { layout: { width } } });
        this.render();
        return this.drain();
    }
    unmount() {
        active = this;
        this.hooks.forEach((h) => h.cleanup?.());
        this.unmounted = true;
    }
}
const items = Array.from({ length: 10 }, (_, i) => ({ id: `${i}`, title: `${i}` }));
assert.equal(new Runner(FullScreenCarousel, { items: [] }).tree, null, 'empty vertical collections do not command a missing native ref');
assert.equal(new Runner(HorizontalCarousel, { items: [] }).tree, null);
const reports = [];
const r = new Runner(HorizontalCarousel, {
    items,
    height: 240,
    contentPadding: 0,
    showControls: true,
    onIndexChange: (i) => reports.push(i),
}).width(408);
const expected = layout.createCarouselLayout(408, items.length, 'multi-browse', 240);
if (mobileDesign) {
    const photo = { id: 'vector-photo', title: 'Product photo', image: { uri: 'original.jpg' } };
    const contexts = [];
    const renderItemContent = (context) => {
        contexts.push(context);
        return { type: 'ProductPhoto', props: {} };
    };
    const custom = new Runner(HorizontalCarousel, { items: [photo, items[1]], height: 232, variant: 'hero', renderItemContent }).width(408);
    const tile = walk(custom.tree).find((node) => typeof node.type === 'function' && node.props?.item === photo);
    const rendered = new Runner(tile.type, tile.props);
    assert.equal(contexts.at(-1).item, photo);
    assert.equal(contexts.at(-1).height, 232);
    assert.equal(contexts.at(-1).width, tile.props.layout.itemWidth, 'custom media receives the stable unmasked canvas');
    assert.ok(walk(rendered.tree).some((node) => node.type === 'ProductPhoto'));
    assert.ok(!walk(rendered.tree).some((node) => node.type === 'Image'), 'one media renderer owns the image canvas');
    const hiddenMedia = walk(rendered.tree).find((node) => node.props?.accessibilityElementsHidden);
    assert.equal(hiddenMedia.props.pointerEvents, 'none', 'custom media cannot intercept carousel gestures');
    assert.equal(hiddenMedia.props.importantForAccessibility, 'no-hide-descendants');
    rendered.render({ ...tile.props, renderItemContent: () => null });
    assert.ok(walk(rendered.tree).some((node) => node.type === 'Image'), 'null custom content preserves the source image');
    const vertical = new Runner(FullScreenCarousel, { items: [photo], height: 600, renderItemContent });
    const verticalTile = vertical.scroll().props.renderItem({ item: photo, index: 0 });
    const verticalContent = new Runner(verticalTile.type, verticalTile.props);
    assert.equal(contexts.at(-1).width, window.width);
    assert.equal(contexts.at(-1).height, 600);
    assert.ok(walk(verticalContent.tree).some((node) => node.type === 'ProductPhoto'), 'full-screen shares the same visual slot');
    custom.unmount();
    rendered.unmount();
    vertical.unmount();
    verticalContent.unmount();
}
const selectedReports = [];
const selected = new Runner(HorizontalCarousel, {
    items,
    height: 240,
    contentPadding: 0,
    showControls: true,
    initialIndex: 3,
    onIndexChange: (i) => selectedReports.push(i),
}).width(408);
assert.equal(selected.node.x, expected.offsets[3], 'horizontal opens the selected item');
assert.equal(selectedReports.length, 0, 'opening horizontal item 4 never reports item 1');
r.press('carousel-next').press('carousel-next').press('carousel-next');
assert.equal(reports.length, 0, 'arrows do not announce the destination before the image moves');
r.advance(300);
assert.equal(r.node.x, expected.offsets[3], 'three rapid arrows advance three items');
assert.equal(reports.at(-1), 3);
r.press('carousel-next').advance(100);
r.native('onBeginDrag', r.node.x).native('onScroll', expected.offsets[1]);
assert.equal(reports.at(-1), 1, 'a slow drag reports its index without a momentum-end event');
r.advance(1000);
assert.equal(reports.at(-1), 1, 'interrupted button animation cannot overwrite the drag');
r.width(600);
assert.equal(r.node.x, layout.createCarouselLayout(600, 10, 'multi-browse', 240).offsets[1], 'resize preserves focused item');
r.press('carousel-next').advance(300, false); // completion queued, RN thread intentionally busy
active = r;
r.find('carousel-next').props.onPress();
r.drain(false);
r.flush(); // stale completion must not clear the newer requested target
r.press('carousel-next').advance(300);
assert.equal(reports.at(-1), 4, 'late completion cannot erase a newer arrow request');
r.press('carousel-next').advance(50);
r.native('onBeginDrag', r.node.x, 0, false); // interruption queued
active = r;
r.find('carousel-next').props.onPress();
r.drain(false);
r.flush();
r.press('carousel-next').advance(300);
assert.equal(reports.at(-1), 6, 'late interruption cannot erase a newer arrow request');
r.native('onScroll', expected.offsets[8], 0, false);
r.render({ ...r.props, items: items.slice(0, 3) }).drain();
assert.ok(reports.at(-1) < 3, 'reports from a replaced layout cannot escape its new bounds');
r.native('onScroll', 0, 0, false);
r.unmount();
r.flush();
const verticalReports = [];
const v = new Runner(FullScreenCarousel, {
    items,
    height: 600,
    showControls: true,
    initialIndex: 3,
    onIndexChange: (i) => verticalReports.push(i),
}).drain();
assert.equal(v.node.y, 3 * 616, 'full-screen opens the selected item');
assert.equal(verticalReports.length, 0, 'opening item 4 must not transiently announce item 1');
v.press('carousel-next').advance(300);
assert.equal(verticalReports.at(-1), 4);
assert.equal(v.scroll().props.initialScrollIndex, 3, 'FlatList initialScrollIndex remains immutable');
v.render({ ...v.props, height: 700 }).drain();
assert.equal(v.node.y, 4 * 716, 'vertical resize preserves the item');
v.press('carousel-next').advance(100);
theme.animation.scale = 0;
v.render().drain();
assert.equal(v.node.y, 5 * 716, 'enabling reduced motion immediately finishes the running command');
assert.ok(
    v.shared.every((value) => !value.animation),
    'no animation remains after reducing motion'
);
v.press('carousel-next');
assert.equal(v.node.y, 6 * 716, 'new reduced-motion commands jump directly');
v.native('onScroll', 0, 2 * 716, false);
v.unmount();
v.flush();
theme.animation.scale = 1;
const disappearing = new Runner(FullScreenCarousel, { items, height: 600, showControls: true }).drain();
disappearing.press('carousel-next').advance(100);
disappearing.render({ ...disappearing.props, items: [] }).advance(1000);
assert.ok(
    disappearing.shared.every((value) => !value.animation),
    'emptying a collection cancels the command before detaching its native view'
);
const uncontained = layout.createCarouselLayout(408, 10, 'uncontained', 240, [], false, 240, 16);
const last = layout.getCarouselItemFrame(9, uncontained.maxOffset, uncontained);
assert.equal(layout.getCarouselItemFrame(0, 0, uncontained).x, 16);
assert.equal(last.x + last.width, 408, 'uncontained has leading padding and no invented trailing inset');
assert.equal(
    new Runner(HorizontalCarousel, { items, variant: 'uncontained' }).width(408).scroll().props.decelerationRate,
    'normal',
    'free scroll uses the native normal deceleration'
);
if (mobileDesign) {
    const deferred = new Runner(HorizontalCarousel, { items, height: 240, contentPadding: 0, showControls: true }).width(408);
    deferred.deferRNWrites = true;
    active = deferred;
    for (let press = 0; press < 3; press++) deferred.find('carousel-next').props.onPress();
    assert.ok(deferred.uiWrites.length > 0, 'rapid RN actions precede execution of queued UI commands');
    deferred.flushUI().advance(300);
    assert.equal(deferred.node.x, expected.offsets[3], 'three RN next actions retain three distinct requested positions before UI runs');
    const reducing = new Runner(FullScreenCarousel, { items, height: 600, showControls: true }).drain();
    reducing.deferRNWrites = true;
    active = reducing;
    reducing.find('carousel-next').props.onPress();
    theme.animation.scale = 0;
    reducing.render();
    active = reducing;
    reducing.find('carousel-next').props.onPress();
    reducing.flushUI().advance(300);
    assert.equal(reducing.node.y, 2 * 616, 'reducing motion while B awaits UI must preserve B as the origin of the next action');
    assert.ok(
        reducing.shared.every((shared) => !shared.animation),
        'pending commands also settle without motion'
    );
    theme.animation.scale = 1;
    const late = new Runner(HorizontalCarousel, { items, height: 240, contentPadding: 0, showControls: true }).width(408);
    late.press('carousel-next').advance(300, false);
    late.deferRNWrites = true;
    active = late;
    late.find('carousel-next').props.onPress(); // B is queued for UI, but RN already owns B.
    late.flush(); // Deliver A before UI applies B.
    active = late;
    late.find('carousel-next').props.onPress();
    late.flushUI().advance(300);
    assert.equal(late.node.x, expected.offsets[3], 'A completion cannot erase B while B awaits UI and the next action must request C');
    const defaults = new Runner(HorizontalCarousel, { items, initialIndex: 3 }).width(408);
    assert.equal(defaults.scroll().props.style.marginHorizontal, 16, 'M3 contained padding is the real default');
    assert.equal(defaults.tree.props.style[0].paddingVertical, 8);
    assert.ok(!walk(defaults.tree).some((node) => node.props?.testID === 'carousel-next'), 'auxiliary arrows are opt-in');
    const offset = layout.createCarouselLayout(376, 10, 'multi-browse', 240, [], false, 240, 16).offsets[3];
    localeDirection = 'rtl';
    defaults.render().drain();
    assert.equal(
        defaults.node.x,
        layout.createCarouselLayout(376, 10, 'multi-browse', 240, [], false, 240, 16).maxOffset - offset,
        'changing Paper locale rebases the physical offset and preserves selected content'
    );
    localeDirection = 'ltr';
    defaults.unmount();
    const pressedItems = [];
    const forced = new Runner(FullScreenCarousel, {
        items,
        snapping: false,
        height: 600,
        onItemPress: (item) => pressedItems.push(item.id),
    }).drain();
    assert.equal(
        forced.scroll().props.snapToInterval,
        616,
        'full-screen cannot stop halfway even when passed a false horizontal snapping option'
    );
    assert.ok(
        !walk(forced.tree).some((node) => node.props?.testID === 'carousel-next'),
        'reference full-screen has no extra visible arrows'
    );
    const firstElement = forced.scroll().props.renderItem({ item: items[0], index: 0 });
    const firstRow = new Runner(firstElement.type, firstElement.props);
    const press = firstRow.tree.props.onPress;
    press();
    assert.deepEqual(pressedItems, [items[0].id]);
    assert.deepEqual(
        Array.from(firstRow.tree.props.accessibilityActions, (action) => action.name),
        ['next']
    );
    active = forced;
    firstRow.tree.props.onAccessibilityAction({ nativeEvent: { actionName: 'next' } });
    forced.advance(300);
    assert.equal(forced.node.y, 616, 'the accessible next action navigates the real controller without a visible control');
    firstRow.render({ ...firstRow.props, disabled: true });
    assert.equal(firstRow.tree.props.accessibilityActions.length, 0);
    press();
    assert.deepEqual(pressedItems, [items[0].id], 'a queued full-screen press is revoked when its tile is disabled');
    active = forced;
    firstRow.tree.props.onAccessibilityAction({ nativeEvent: { actionName: 'next' } });
    forced.advance(300);
    assert.equal(forced.node.y, 616, 'disabled accessible content cannot navigate');
    firstRow.unmount();
    forced.unmount();
    const uniformCenter = layout.createCarouselLayout(408, 5, 'uncontained', 240, [], false, 240, 16, 8, 'center');
    assert.equal(layout.getCarouselItemFrame(0, 0, uniformCenter).x + 120, 204);
    assert.equal(layout.getCarouselItemFrame(4, uniformCenter.maxOffset, uniformCenter).x + 120, 204);
}
if (mobileDesign) {
    const { createVerticalCarouselLayout } = verticalGeometry;
    const galleryItems = items.slice(0, 4).map((item) => ({ ...item, aspectRatio: 1 }));
    const galleryTile = (runner, id) => {
        const tile = walk(runner.tree).find((node) => typeof node.type === 'function' && node.props?.item?.id === id);
        assert.ok(tile, `Vertical tile ${id}`);
        return tile;
    };
    const invoke = (runner, handler, ...args) => {
        active = runner;
        handler(...args);
        return runner.drain();
    };
    const counter = (runner) => [runner.find('carousel-position').props.children].flat().join('');

    assert.equal(new Runner(VerticalCarousel, { items: [] }).tree, null, 'empty natural-height galleries render no scroll host');
    const asyncReports = [];
    const asynchronous = new Runner(VerticalCarousel, {
        items: [],
        initialIndex: 2,
        height: 180,
        contentPadding: 0,
        showControls: true,
        onIndexChange: (index) => asyncReports.push(index),
    });
    asynchronous.render({ ...asynchronous.props, items: galleryItems.slice(0, 3) }).drain().width(300);
    assert.equal(counter(asynchronous), '3 / 3', 'an initial selection survives the initially empty asynchronous collection');
    assert.equal(asynchronous.node.y, createVerticalCarouselLayout(300, 180, [1, 1, 1], 0).offsets[2]);
    assert.deepEqual(asyncReports, [], 'loading the requested initial photo never announces an intermediate item zero');
    const shortAsyncReports = [];
    const shortAsynchronous = new Runner(VerticalCarousel, {
        items: [],
        initialIndex: 2,
        height: 180,
        contentPadding: 0,
        showControls: true,
        onIndexChange: (index) => shortAsyncReports.push(index),
    });
    shortAsynchronous.render({ ...shortAsynchronous.props, items: galleryItems.slice(0, 1) }).drain().width(300);
    assert.equal(galleryTile(shortAsynchronous, '0').props.active, true, 'a smaller asynchronous result clamps the initial selection to its real bounds');
    assert.ok(!walk(shortAsynchronous.tree).some((node) => node.props?.testID === 'carousel-position'), 'a single result needs no navigation counter');
    assert.equal(shortAsynchronous.node.y, 0);
    assert.deepEqual(shortAsyncReports, [0], 'a clamped asynchronous selection reports the corrected index exactly once');
    const galleryReports = [];
    const gallery = new Runner(VerticalCarousel, {
        items: galleryItems,
        height: 180,
        contentPadding: 0,
        showControls: true,
        onIndexChange: (index) => galleryReports.push(index),
    }).width(300);
    const galleryLayout = createVerticalCarouselLayout(300, 180, [1, 1, 1, 1], 0);
    assert.equal(gallery.scroll().props.decelerationRate, 'normal', 'vertical gallery defaults to free scrolling');
    assert.equal(gallery.scroll().props.snapToOffsets, undefined);
    gallery.press('carousel-next').press('carousel-next').press('carousel-previous').advance(300);
    assert.equal(gallery.node.y, galleryLayout.offsets[1], 'rapid vertical navigation and reversal use the latest requested item');
    assert.equal(galleryReports.at(-1), 1);
    gallery.press('carousel-next').advance(80);
    gallery.native('onBeginDrag', 0, gallery.node.y).native('onScroll', 0, galleryLayout.offsets[3]);
    assert.equal(galleryReports.at(-1), 3, 'a finger can interrupt and replace an animated vertical command');
    gallery.advance(1000);
    assert.equal(galleryReports.at(-1), 3, 'interrupted completion cannot restore the old vertical destination');
    gallery.render({ ...gallery.props, snapping: true }).drain();
    assert.deepEqual(
        Array.from(gallery.scroll().props.snapToOffsets),
        [...new Set([...galleryLayout.offsets, galleryLayout.maxOffset])],
        'optional vertical snapping includes the physical end for a tall final image'
    );

    const duplicateReports = [];
    const duplicate = new Runner(VerticalCarousel, {
        items: galleryItems,
        height: 180,
        contentPadding: 0,
        showControls: true,
        onIndexChange: (index) => duplicateReports.push(index),
    }).width(300);
    duplicate.deferRNWrites = true;
    const navigate = galleryTile(duplicate, '0').props.onNavigate;
    active = duplicate;
    navigate(1);
    const writes = duplicate.uiWrites.length;
    navigate(1);
    assert.equal(duplicate.uiWrites.length, writes, 'requesting the same pending item does not enqueue another UI command');
    assert.deepEqual(duplicateReports, [1], 'a duplicate request does not repeat its logical selection callback');
    duplicate.flushUI().advance(300);
    assert.equal(duplicate.node.y, galleryLayout.offsets[1]);

    const retentionReports = [];
    const retention = new Runner(VerticalCarousel, {
        items: galleryItems,
        initialIndex: 1,
        height: 180,
        contentPadding: 0,
        showControls: true,
        onIndexChange: (index) => retentionReports.push(index),
    }).width(300);
    assert.equal(retention.node.y, galleryLayout.offsets[1]);
    assert.deepEqual(retentionReports, [], 'opening a selected vertical photo does not announce the initial zero offset');
    retention.width(400);
    assert.equal(
        retention.node.y,
        createVerticalCarouselLayout(400, 180, [1, 1, 1, 1], 0).offsets[1],
        'reflow preserves the selected item at its new natural size'
    );
    const reordered = [galleryItems[3], galleryItems[0], galleryItems[1], galleryItems[2]];
    retention.render({ ...retention.props, items: reordered }).drain();
    assert.equal(counter(retention), '3 / 4', 'reordering retains the selected ID at its new index');
    assert.equal(retention.node.y, createVerticalCarouselLayout(400, 180, [1, 1, 1, 1], 0).offsets[2]);
    assert.equal(retentionReports.at(-1), 2);

    const caption = new Runner(VerticalCarousel, {
        items: galleryItems.slice(0, 2).map((item) => ({ ...item, description: 'Caption' })),
        initialIndex: 1,
        height: 180,
        contentPadding: 0,
        textPlacement: 'below',
        showControls: true,
    }).width(300);
    const firstCaption = galleryTile(caption, '0');
    const captionTile = new Runner(firstCaption.type, firstCaption.props);
    assert.equal(captionTile.find('carousel-press-0').props.style.borderRadius, 0, 'below-image captions avoid the outer rounded clip');
    assert.equal(captionTile.find('carousel-media-0').props.style.borderRadius, 28, 'only the photographic area keeps its rounded shape');
    invoke(caption, firstCaption.props.onCaptionLayout, '0', 44);
    const updatedCaption = galleryTile(caption, '0');
    assert.equal(updatedCaption.props.mediaHeight, 300, 'caption measurement never changes the photo ratio');
    assert.equal(updatedCaption.props.height, 344, 'measured caption height participates in row layout');
    assert.equal(caption.node.y, 352, 'caption reflow keeps the selected second item visible at its new anchor');

    modules['react-native'].Platform.OS = 'web';
    const fitReports = [];
    const fitItems = galleryItems.slice(0, 3).map((item) => ({ ...item, aspectRatio: 10 }));
    const fit = new Runner(VerticalCarousel, {
        items: fitItems,
        height: 1000,
        contentPadding: 0,
        showControls: true,
        onIndexChange: (index) => fitReports.push(index),
    }).width(300);
    const lastTile = galleryTile(fit, '2');
    const lastContent = new Runner(lastTile.type, lastTile.props);
    const lastPress = lastContent.find('carousel-press-2').props;
    invoke(fit, lastPress.onFocus, { currentTarget: { matches: () => true } });
    assert.equal(counter(fit), '3 / 3', 'focusing a fitting collection still changes the logical item');
    assert.deepEqual(fitReports, [2]);
    assert.equal(fit.node.y, 0, 'logical navigation does not invent scrolling when every row fits');
    assert.equal(galleryTile(fit, '2').props.active, true, 'roving focus follows the selected item without offset movement');
    assert.equal(galleryTile(fit, '0').props.height, 48, 'a shallow panorama keeps a non-overlapping 48dp target');
    assert.equal(galleryTile(fit, '0').props.mediaHeight, 30, 'the target minimum does not distort shallow photo dimensions');
    let prevented = 0;
    const key = (value) => ({
        nativeEvent: { key: value },
        preventDefault: () => prevented++,
        stopPropagation() {},
    });
    invoke(fit, lastPress.onKeyDown, key('Home'));
    assert.equal(counter(fit), '1 / 3', 'Home updates the logical index even when every anchor is zero');
    invoke(fit, lastPress.onKeyDown, key('End'));
    assert.equal(counter(fit), '3 / 3', 'End updates the logical index even when every anchor is zero');
    assert.equal(prevented, 2);
    const blockedItems = galleryItems.slice(0, 3).map((item, index) => ({ ...item, disabled: index === 1 }));
    const focusFallback = new Runner(VerticalCarousel, { items: blockedItems, initialIndex: 1, height: 180 }).width(300);
    const firstEnabled = galleryTile(focusFallback, '0');
    const disabledActive = galleryTile(focusFallback, '1');
    assert.equal(firstEnabled.props.active, true, 'a disabled active item gives keyboard entry to an enabled item');
    const enabledContent = new Runner(firstEnabled.type, firstEnabled.props);
    const disabledContent = new Runner(disabledActive.type, disabledActive.props);
    assert.equal(enabledContent.find('carousel-press-0').props.tabIndex, 0);
    assert.equal(disabledContent.find('carousel-press-1').props.tabIndex, -1);
    modules['react-native'].Platform.OS = 'ios';

    for (const runner of [asynchronous, shortAsynchronous, gallery, duplicate, retention, caption, captionTile, fit, lastContent, focusFallback, enabledContent, disabledContent]) {
        runner.unmount();
    }
}
const centered = layout.createCarouselLayout(360, 10, 'multi-browse', 120, [], false, 120, 0, 0, 'center');
// Independent golden from testKnownCenterAlignmentArrangement_correctlyCalculatesKeylineLocations:
// material-components-android@66b0eeb53afeb6025ffbbd37734b08e5bce197ed,
// lib/javatests/com/google/android/material/carousel/MultiBrowseCarouselStrategyTest.java.
assert.deepEqual(
    Array.from(centered.defaultState.keylines, (k) => k.size),
    [1, 40, 80, 120, 80, 40, 1],
    'independent Android center arrangement fixture'
);
assert.deepEqual(
    Array.from(centered.defaultState.keylines, (k) => k.offset),
    [-0.5, 20, 80, 180, 280, 340, 360.5]
);
for (const width of [200, 320, 360, 408, 600, 840, 1280])
    for (const count of [1, 2, 3, 5, 10]) {
        const arrangement = layout.createCarouselLayout(width, count, 'multi-browse', 240, [], false, 240, 0, 8, 'center');
        assert.ok(Math.abs(layout.getCarouselItemFrame(0, 0, arrangement).x) < 1e-6, 'center arrangement has no leading empty space');
        const edge = layout.getCarouselItemFrame(count - 1, arrangement.maxOffset, arrangement);
        if (arrangement.maxOffset > 0) assert.ok(Math.abs(edge.x + edge.width - width) < 1e-6, 'center arrangement ends at viewport edge');
    }

console.log(
    'OK: carousel controller cases for rapid actions, slow drag, late callbacks, resize, selected-item entry, reduced motion, unmount, free-scroll, centered keylines, vertical galleries, fitting-item focus, reordering, captions and keyboard entry.'
);
