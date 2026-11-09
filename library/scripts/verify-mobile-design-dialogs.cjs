/**
 * Real Dialog/FullScreenDialog render and action contracts. JSX, context,
 * presence and measured layout are bounded doubles; this does not prove Yoga,
 * keyboard insets, native accessibility focus, transition pixels or FPS.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
let active;
let checks = 0;
let direction = 'ltr';
let present = true;
const dimensions = { width: 390, height: 844, fontScale: 1 };
const insets = { top: 44, bottom: 34, left: 0, right: 0 };
const theme = {
    animation: { scale: 1 },
    colors: {
        surfaceContainerHigh: 'surfaceContainerHigh',
        onSurface: 'onSurface',
        onSurfaceVariant: 'onSurfaceVariant',
        secondary: 'secondary',
        primary: 'primary',
        outlineVariant: 'outlineVariant',
        scrim: 'scrim',
    },
    motion: { duration: { medium2: 300, short4: 200 } },
};
const contexts = [];
const presenceCalls = [];
const jsx = (type, props = {}, key) => ({ type, props, key });
const array = (children) =>
    [children].flat(Infinity).filter((child) => child !== null && child !== undefined && typeof child !== 'boolean');
const React = {
    Fragment: 'Fragment',
    Children: { toArray: array, map: (children, fn) => array(children).map(fn) },
    isValidElement: (node) => !!node && typeof node === 'object' && 'type' in node,
    cloneElement: (node, props) => ({ ...node, props: { ...node.props, ...props } }),
    createContext(value) {
        const context = { value, Provider: 'DialogContextProvider' };
        contexts.push(context);
        return context;
    },
    useContext: (context) => context.value,
    useState(initial) {
        const owner = active;
        const i = owner.cursor++;
        const slot = owner.hooks[i] ?? (owner.hooks[i] = { value: typeof initial === 'function' ? initial() : initial });
        return [
            slot.value,
            (value) => {
                slot.value = typeof value === 'function' ? value(slot.value) : value;
            },
        ];
    },
    useRef(initial) {
        const i = active.cursor++;
        return active.hooks[i] ?? (active.hooks[i] = { current: initial });
    },
    useCallback(callback, deps) {
        const i = active.cursor++;
        const previous = active.hooks[i];
        if (!previous || !deps.every((value, index) => Object.is(value, previous.deps[index]))) {
            active.hooks[i] = { value: callback, deps };
        }
        return active.hooks[i].value;
    },
    useLayoutEffect(create, deps) {
        const i = active.cursor++;
        const previous = active.hooks[i];
        if (!previous || !deps.every((value, index) => Object.is(value, previous.deps[index]))) {
            previous?.cleanup?.();
            active.hooks[i] = { deps, cleanup: create() };
        }
    },
};
React.useEffect = React.useLayoutEffect;
const modules = {
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: React,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: React.Fragment },
    'react-native': {
        Keyboard: { dismiss() {}, addListener: () => ({ remove() {} }) },
        Modal: 'Modal',
        View: 'View',
        Pressable: 'Pressable',
        ScrollView: 'ScrollView',
        KeyboardAvoidingView: 'KeyboardAvoidingView',
        Platform: { OS: 'ios' },
        StyleSheet: { absoluteFill: { position: 'absolute', inset: 0 }, flatten: (styles) => style(styles) },
        useWindowDimensions: () => dimensions,
    },
    'react-native-paper': {
        Surface: 'Surface',
        Icon: 'Icon',
        Text: 'Text',
        ThemeProvider: 'ThemeProvider',
        useLocale: () => ({ direction }),
    },
    'react-native-reanimated': { default: { View: 'AnimatedView' }, useAnimatedStyle: (compute) => ({ compute }) },
    'react-native-paper/lib/module/theme/accessibility/ReduceMotionContext': { ReduceMotionContext: { value: false } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => insets },
    '../core': { useMobileTheme: () => theme },
    '../paper-motion-bridge': { PaperMotionBridge: 'PaperMotionBridge' },
    // This suite tests dialog logic; the actual window/provider/Portal host runs
    // independently in verify-mobile-design-foundation.cjs.
    '../native-modal': { NativeModal: 'Modal' },
    './button': { Button: 'Button' },
    './icon-button': { IconButton: 'IconButton' },
    './sheets': {
        useOverlayPresence(visible, duration) {
            presenceCalls.push({ visible, duration });
            return { present, progress: { get: () => (visible ? 1 : 0) } };
        },
    },
};
function load(name) {
    const exports = {};
    const fileName = path.join(root, 'packages/mobile-design/src/components', `${name}.tsx`);
    const output = ts.transpileModule(fs.readFileSync(fileName, 'utf8'), {
        fileName,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(output, {
        exports,
        require(name) {
            assert.ok(modules[name], `explicit double for ${name}`);
            return modules[name];
        },
    });
    return exports;
}
modules['../color'] = { toIconColor: (color) => color };
modules['./container-transform'] = load('container-transform');
const { FullScreenDialog } = load('full-screen-dialog');
modules['./full-screen-dialog'] = { FullScreenDialog };
const { Dialog } = load('dialog');
const walk = (node) => (!node || typeof node !== 'object' ? [] : [node, ...array(node.props?.children).flatMap(walk)]);
const style = (styles) =>
    Array.isArray(styles) ? Object.assign({}, ...styles.map(style)) : styles?.compute ? styles.compute() : (styles ?? {});
class Runner {
    constructor(component, props) {
        Object.assign(this, { component, props, hooks: [] });
        this.render();
    }
    render(props = this.props) {
        this.props = props;
        this.cursor = 0;
        active = this;
        this.tree = this.component(props);
        return this;
    }
    nodes(type) {
        return walk(this.tree).filter((node) => node.type === type);
    }
    id(testID) {
        return walk(this.tree).find((node) => node.props?.testID === testID);
    }
}
function check(name, fn) {
    try {
        fn();
        checks++;
    } catch (error) {
        error.message = `${name}: ${error.message}`;
        throw error;
    }
}
const action = (label, props = {}) => jsx('Button', { children: label, ...props });
const parts = [
    jsx(Dialog.Icon, { icon: 'delete' }),
    jsx(Dialog.Title, { children: '¿Descartar cambios?' }),
    jsx(Dialog.Content, { children: 'Sin guardar' }),
    jsx(Dialog.Actions, { children: [action('Cancelar'), action('Descartar')] }),
];
check('basic geometry and icon alignment', () => {
    const runner = new Runner(Dialog, { visible: true, children: parts });
    const surface = runner.nodes('Surface')[0];
    assert.equal(style(surface.props.style).padding, 24);
    assert.equal(style(surface.props.style).backgroundColor, 'surfaceContainerHigh');
    assert.equal(style(surface.props.style).borderRadius, 28);
    assert.deepEqual(
        Array.from(surface.props.children, (node) => node.props.style.marginTop),
        [0, 16, 16, 24]
    );
    const viewport = runner.id('mobile-dialog');
    assert.equal(style(viewport.props.style).maxWidth, 560);
    assert.equal(style(viewport.props.style).minWidth, 280);
    assert.equal(viewport.props.accessibilityViewIsModal, true);
    contexts[0].value = runner.nodes('DialogContextProvider')[0].props.value;
    const title = new Runner(Dialog.Title, { children: 'Título' });
    assert.equal(style(title.tree.props.style).textAlign, 'center');
    const icon = new Runner(Dialog.Icon, { icon: 'delete' });
    assert.equal(icon.nodes('Icon')[0].props.size, 24);
    assert.equal(icon.nodes('Icon')[0].props.color, 'secondary');
    assert.equal(style(icon.tree.props.style).paddingTop, undefined, 'outer inset is applied exactly once');
});
check('body colors preserve nested action labels and overrides', () => {
    const custom = jsx('Text', { children: 'Especial', style: { color: 'custom' } });
    const button = action('Conservar');
    const runner = new Runner(Dialog.Content, {
        children: [jsx('Text', { children: 'Body' }), jsx('View', { children: [custom, button] }), 'Raw'],
    });
    assert.equal(style(runner.nodes('Text')[0].props.style).color, 'onSurfaceVariant');
    assert.equal(style(runner.nodes('Text')[1].props.style).color, 'custom');
    assert.equal(style(runner.nodes('Text')[2].props.style).color, 'onSurfaceVariant');
    assert.equal(runner.nodes('Button')[0], button);
});
check('actions fit horizontally, stack confirm above cancel and mirror RTL', () => {
    contexts[0].value = { visible: true, withIcon: false };
    const runner = new Runner(Dialog.Actions, { children: [action('Cancelar'), action('Descartar')] });
    runner.tree.props.onLayout({ nativeEvent: { layout: { width: 250 } } });
    runner
        .nodes('View')
        .slice(1)
        .forEach((node, i) => node.props.onLayout({ nativeEvent: { layout: { width: [90, 110][i] } } }));
    runner.render();
    assert.equal(style(runner.tree.props.style).opacity, 1);
    assert.equal(style(runner.tree.props.style).flexDirection, 'row');
    assert.equal(runner.nodes('Button').at(-1).props.children, 'Descartar');
    runner.tree.props.onLayout({ nativeEvent: { layout: { width: 190 } } });
    runner.render();
    assert.equal(style(runner.tree.props.style).flexDirection, 'column');
    assert.equal(runner.nodes('Button')[0].props.children, 'Descartar');
    direction = 'rtl';
    runner.render();
    assert.equal(style(runner.tree.props.style).alignItems, 'flex-start');
    runner.tree.props.onLayout({ nativeEvent: { layout: { width: 250 } } });
    runner.render();
    assert.equal(style(runner.tree.props.style).flexDirection, 'row-reverse');
    contexts[0].value.visible = false;
    runner.render();
    assert.ok(runner.nodes('Button').every((node) => node.props.disabled));
    direction = 'ltr';
});
check('independent outside/back dismissal and exit inertness', () => {
    let dismissed = 0;
    const runner = new Runner(Dialog, {
        visible: true,
        onDismiss: () => dismissed++,
        dismissable: false,
        dismissableBackButton: true,
        children: parts,
    });
    runner.nodes('Pressable')[0].props.onPress();
    assert.equal(dismissed, 0);
    runner.tree.props.onRequestClose();
    assert.equal(dismissed, 1);
    runner.id('mobile-dialog').props.onAccessibilityEscape();
    assert.equal(dismissed, 2);
    runner.render({ ...runner.props, visible: false });
    runner.tree.props.onRequestClose();
    assert.equal(dismissed, 2);
    assert.equal(runner.id('mobile-dialog').props.pointerEvents, 'none');
    assert.equal(presenceCalls.at(-1).duration, 200);
    present = false;
    runner.render();
    assert.equal(runner.tree, null);
    present = true;
});
check('scroll area fixes title/actions and owns a single horizontal inset', () => {
    const runner = new Runner(Dialog.ScrollArea, { children: jsx('ScrollView', {}) });
    assert.equal(style(runner.tree.props.style).marginHorizontal, -24);
    assert.equal(style(runner.tree.props.style).borderTopWidth, 1);
    assert.equal(style(runner.tree.props.style).borderColor, 'outlineVariant');
    assert.equal(style(runner.nodes('View')[1].props.style).paddingHorizontal, 24);
    const root = new Runner(Dialog, { visible: true, children: [parts[1], jsx(Dialog.ScrollArea, { children: 'Body' }), parts[3]] });
    assert.deepEqual(
        Array.from(root.nodes('Surface')[0].props.children, (node) => node.props.style.flexShrink),
        [0, 1, 0]
    );
});
check('full-screen decorative background stays behind content and outside accessibility focus', () => {
    const decoration = jsx('Gradient');
    const runner = new Runner(FullScreenDialog, {
        visible: true,
        title: 'Create',
        children: 'Form',
        backgroundContent: decoration,
        onDismiss() {},
    });
    const layer = runner.nodes('View').find((node) => node.props.children === decoration);
    assert.ok(layer);
    assert.equal(layer.props.pointerEvents, 'none');
    assert.equal(layer.props.importantForAccessibility, 'no-hide-descendants');
    assert.equal(style(layer.props.style).position, 'absolute');
});
check('compact full-screen header, safe area and explicit action guards', () => {
    let dismissed = 0;
    let confirmed = 0;
    const runner = new Runner(FullScreenDialog, {
        visible: true,
        title: 'Editar',
        children: 'Form',
        onDismiss: () => dismissed++,
        onConfirm: () => confirmed++,
    });
    assert.equal(style(runner.id('mobile-full-screen-dialog-header').props.style).minHeight, 56);
    assert.equal(style(runner.nodes('Surface')[0].props.style).borderRadius, 0);
    assert.equal(style(runner.nodes('Surface')[0].props.style).paddingTop, 44);
    assert.equal(runner.nodes('Pressable').length, 0);
    runner.id('mobile-full-screen-dialog-confirm').props.onPress();
    assert.equal(confirmed, 1);
    runner.render({ ...runner.props, confirmDisabled: true });
    runner.id('mobile-full-screen-dialog-confirm').props.onPress();
    assert.equal(confirmed, 1);
    runner.tree.props.onRequestClose();
    assert.equal(dismissed, 1);
    runner.render({ ...runner.props, visible: false });
    runner.id('mobile-full-screen-dialog-close').props.onPress();
    assert.equal(dismissed, 1);
    assert.equal(runner.id('mobile-full-screen-dialog').props.pointerEvents, 'none');
});
check('a pending full-screen save blocks close, Back and accessibility escape until enabled', () => {
    let dismissed = 0;
    const runner = new Runner(FullScreenDialog, {
        visible: true,
        title: 'Guardar',
        children: 'Form',
        dismissible: false,
        onDismiss: () => dismissed++,
    });
    assert.equal(runner.id('mobile-full-screen-dialog-close').props.disabled, true);
    runner.id('mobile-full-screen-dialog-close').props.onPress();
    runner.tree.props.onRequestClose();
    runner.id('mobile-full-screen-dialog').props.onAccessibilityEscape();
    assert.equal(dismissed, 0);
    runner.render({ ...runner.props, dismissible: true });
    assert.equal(runner.id('mobile-full-screen-dialog-close').props.disabled, false);
    runner.id('mobile-full-screen-dialog-close').props.onPress();
    assert.equal(dismissed, 1);
});
check('medium adaptive modal measures actual header/content and survives rotation', () => {
    dimensions.width = 720;
    const runner = new Runner(FullScreenDialog, { visible: true, title: 'Editar', children: 'Form', onDismiss() {} });
    assert.equal(style(runner.id('mobile-full-screen-dialog').props.style).maxWidth, 560);
    assert.equal(style(runner.nodes('Surface')[0].props.style).borderRadius, 28);
    assert.equal(style(runner.nodes('Surface')[0].props.style).backgroundColor, 'surfaceContainerHigh');
    assert.equal(runner.nodes('Pressable').length, 1);
    runner.nodes('ScrollView')[0].props.onContentSizeChange(400, 240);
    runner.id('mobile-full-screen-dialog-header').props.onLayout({ nativeEvent: { layout: { height: 64 } } });
    runner.render();
    assert.equal(style(runner.id('mobile-full-screen-dialog').props.style).height, 304);
    dimensions.width = 390;
    runner.render();
    assert.equal(style(runner.id('mobile-full-screen-dialog').props.style).flex, 1);
    assert.equal(style(runner.nodes('Surface')[0].props.style).borderRadius, 0);
});
check('provider motion off is immediate for both modal variants', () => {
    theme.animation.scale = 0;
    new Runner(Dialog, { visible: true, children: parts });
    assert.equal(presenceCalls.at(-1).duration, 0);
    new Runner(FullScreenDialog, { visible: false, title: 'Editar', children: 'Form', onDismiss() {} });
    assert.equal(presenceCalls.at(-1).duration, 0);
    theme.animation.scale = 1;
});
console.log(
    `OK: ${checks} real Dialog/FullScreenDialog contracts; M3 geometry/colors, single icon inset, supporting text, RTL/stacked actions, independent dismissal, scrolling, adaptive560dp modal and reduced motion.`
);
