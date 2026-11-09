// Executes the real TypeScript components with a minimal hook scheduler and mocked
// native/Paper/Reanimated boundaries. Verifies draft, commit, dismissal and paging
// callbacks. It does not measure native layout, gestures, visual timing or frame rate.
// Run from the repository: node scripts/verify-material-date-picker-sessions.cjs
// Add --mobile-design to load the package controllers; TextField is an explicit
// native-input boundary double, so this suite does not verify its label rendering.

const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const ts = require('typescript');
const projectRoot = path.resolve(__dirname, '..');
const mobileDesign = true;
const base = path.join(projectRoot, 'packages/mobile-design/src/components') + path.sep;
let current;
const animations = [];
const rnCallbacks = [];
let deferRNCallbacks = false;
const keyboardListeners = new Map();
const scrollCalls = [];
let focused;
const native = (name) => Object.assign(function () {}, { _nativeType: name });
const element = (type, props, key) => ({
    type,
    props: props ?? {},
    key,
});
function hook() {
    const node = current.node;
    const index = current.index++;
    return {
        node,
        index,
        old: node.slots[index],
    };
}
function same(a, b) {
    return a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
}
const react = {
    memo: (fn) => fn,
    createElement(type, props, ...children) {
        return element(
            type,
            {
                ...props,
                ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}),
            },
            props?.key
        );
    },
    useState(initial) {
        const { node, index, old } = hook();
        if (!old) node.slots[index] = { value: typeof initial === 'function' ? initial() : initial };
        const slot = node.slots[index];
        return [
            slot.value,
            (next) => {
                const n = typeof next === 'function' ? next(slot.value) : next;
                if (!Object.is(n, slot.value)) {
                    slot.value = n;
                    node.host.dirty = true;
                }
            },
        ];
    },
    useRef(initial) {
        const { node, index, old } = hook();
        if (!old) node.slots[index] = { current: initial };
        return node.slots[index];
    },
    useMemo(factory, deps) {
        const { node, index, old } = hook();
        if (!old || !same(old.deps, deps))
            node.slots[index] = {
                value: factory(),
                deps,
            };
        return node.slots[index].value;
    },
    useCallback(fn, deps) {
        return react.useMemo(() => fn, deps);
    },
    useEffect(fn, deps) {
        effect(fn, deps, false);
    },
    useLayoutEffect(fn, deps) {
        effect(fn, deps, true);
    },
};
function effect(fn, deps, layout) {
    const { node, index, old } = hook();
    if (!old || !same(old.deps, deps)) {
        node.slots[index] = {
            deps,
            cleanup: old?.cleanup,
        };
        node.host.effects.push({
            node,
            index,
            fn,
            layout,
        });
    }
}
const keyboard = {
    dismiss() {},
    isVisible() {
        return false;
    },
    addListener(name, fn) {
        const list = keyboardListeners.get(name) ?? [];
        list.push(fn);
        keyboardListeners.set(name, list);
        return {
            remove() {
                keyboardListeners.set(
                    name,
                    list.filter((x) => x !== fn)
                );
            },
        };
    },
};
const theme = {
    animation: { scale: 1 },
    colors: {
        scrim: '#000',
        surfaceContainerHigh: '#fff',
        outlineVariant: '#ddd',
        onSurfaceVariant: '#444',
        error: '#b00',
        primary: '#6750a4',
    },
    shapes: {
        corner: {
            extraLarge: 28,
            extraSmall: 4,
        },
    },
    motion: { duration: { short3: 150 } },
    elevation: { level3: 3 },
};
const fade = {
    duration() {
        return this;
    },
    reduceMotion() {
        return this;
    },
};
const reanimated = {
    ReduceMotion: { Never: 'never' },
    __esModule: true,
    default: {
        View: 'AnimatedView',
        FlatList: 'AnimatedFlatList',
    },
    Easing: {
        cubic: (x) => x,
        out: (fn) => fn,
        bezier: () => (x) => x,
    },
    FadeIn: fade,
    FadeOut: fade,
    useAnimatedStyle: (fn) => fn(),
    useAnimatedScrollHandler: (fn) => fn,
    cubicBezier: (...args) => args,
    cancelAnimation: (shared) => {
        shared.cancel?.();
    },
    useSharedValue(initial) {
        const ref = react.useRef(null);
        if (!ref.current) {
            let val = initial,
                generation = 0;
            ref.current = {
                cancel() {
                    generation++;
                },
                get: () => val,
                set(next) {
                    generation++;
                    const id = generation;
                    if (next && next.animation) {
                        val = next.target;
                        if (next.callback) animations.push(() => next.callback(id === generation));
                    } else val = next;
                },
            };
        }
        return ref.current;
    },
    withTiming: (target, config, callback) => ({
        animation: true,
        target,
        callback,
    }),
};
const input = native('TextInput');
input.Icon = 'TextInputIcon';
const modules = {
    '../scroll-indicators': require('./load-mobile-design-scroll-indicators.cjs'),
    react: react,
    'react/jsx-runtime': {
        jsx: element,
        jsxs: element,
    },
    'react-native': {
        View: 'View',
        ScrollView: 'ScrollView',
        Pressable: 'Pressable',
        Modal: 'Modal',
        KeyboardAvoidingView: 'KeyboardAvoidingView',
        FlatList: 'FlatList',
        Keyboard: keyboard,
        Platform: { OS: 'ios' },
        StyleSheet: {
            absoluteFill: {},
            create: (x) => x,
        },
        I18nManager: { isRTL: false },
        useWindowDimensions: () => ({
            width: 440,
            height: 956,
            fontScale: 1,
        }),
        BackHandler: { addEventListener: () => ({ remove() {} }) },
    },
    'react-native-paper': {
        Surface: 'Surface',
        Portal: 'Portal',
        useLocale: () => ({ direction: 'ltr' }),
    },
    'react-native-reanimated': reanimated,
    'react-native-worklets': {
        scheduleOnRN(fn, ...args) {
            if (deferRNCallbacks) rnCallbacks.push(() => fn(...args));
            else fn(...args);
        },
    },
    '@/components/Button': { Button: 'Button' },
    '@/components/IconButton': { IconButton: 'IconButton' },
    '@/components/Text': { Text: 'Text' },
    '@/components/TextInput': { TextInput: input },
    '@/hooks/settings': {
        useSafeAreaInsets: () => ({
            top: 0,
            bottom: 0,
        }),
    },
    '@/theme/paper': { usePaperTheme: () => theme },
    '../core': { usePaperTheme: () => theme, useMobileTheme: () => theme },
    // Physical native-window hosting is verified by the foundation suite;
    // session/focus/input assertions retain the previous RN Modal identity.
    '../native-modal': { NativeModal: 'Modal' },
    '../primitives': { Button: 'Button', IconButton: 'IconButton', Text: 'Text', Icon: 'Icon', TouchableRipple: 'TouchableRipple' },
    '../color': { withAlpha: (color) => color, toIconColor: (color) => color },
    './text-field': { TextField: input },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) },
    './date-picker-calendar': {
        useDatePickerKeyboard() {},
        DatePickerCalendar: 'Calendar',
        DatePickerWeekdays: 'Weekdays',
        DATE_PICKER_DAY_SIZE: 48,
        DATE_PICKER_MONTH_HEADER_HEIGHT: 56,
    },
    './date-picker-months': { DatePickerMonths: 'Months' },
};
function load(name) {
    if (modules[name]) return modules[name];
    const filename = base + name.replace('./', '') + (name.endsWith('utils') ? '.ts' : '.tsx');
    const result = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true,
        },
    }).outputText;
    vm.runInNewContext(
        code,
        {
            exports: result.exports,
            module: result,
            require: load,
            Date,
            Intl,
            console,
            requestAnimationFrame: (fn) => {
                fn();
                return 1;
            },
            cancelAnimationFrame() {},
        },
        { filename }
    );
    modules[name] = result.exports;
    return result.exports;
}
let functionID = 0;
const ids = new WeakMap();
function makeHost(Component, initialProps) {
    const host = {
        props: initialProps,
        nodes: new Map(),
        effects: [],
        dirty: false,
        tree: null,
    };
    function render(value, path = '0') {
        if (value == null || typeof value !== 'object') return value;
        if (Array.isArray(value)) return value.map((v, i) => render(v, path + '.' + i));
        let { type, props, key } = value;
        if (type?._nativeType) type = type._nativeType;
        if (typeof type === 'function') {
            if (!ids.has(type)) ids.set(type, ++functionID);
            const id = path + ':' + ids.get(type) + ':' + (key ?? '');
            let node = host.nodes.get(id);
            if (!node) {
                node = {
                    slots: [],
                    host,
                };
                host.nodes.set(id, node);
            }
            node.seen = true;
            const previous = current;
            current = {
                node,
                index: 0,
            };
            const out = type(props);
            current = previous;
            return render(out, id);
        }
        if (props.ref && typeof props.ref === 'object')
            props.ref.current =
                type === 'TextInput'
                    ? {
                          focus() {
                              focused = props.testID;
                          },
                      }
                    : {
                          measureInWindow(fn) {
                              fn(16, 240, 360, 56);
                          },
                          scrollToIndex(args) {
                              scrollCalls.push(args);
                          },
                          scrollToOffset(args) {
                              scrollCalls.push(args);
                          },
                      };
        return {
            ...value,
            type,
            props: {
                ...props,
                children: render(props.children, path + '.c'),
            },
        };
    }
    host.flush = () => {
        let loops = 0;
        do {
            assert(++loops < 25, 'render loop');
            host.dirty = false;
            for (const n of host.nodes.values()) n.seen = false;
            host.tree = render(element(Component, host.props));
            const effects = host.effects.splice(0).sort((a, b) => Number(b.layout) - Number(a.layout));
            for (const e of effects) {
                e.node.slots[e.index].cleanup?.();
                e.node.slots[e.index].cleanup = e.fn();
            }
            for (const [k, n] of host.nodes) {
                if (!n.seen) {
                    for (const s of n.slots) s?.cleanup?.();
                    host.nodes.delete(k);
                }
            }
        } while (host.dirty);
        return host;
    };
    host.setProps = (p) => {
        host.props = {
            ...host.props,
            ...p,
        };
        host.flush();
    };
    host.find = (predicate) => {
        let answer;
        function walk(n) {
            if (!n || answer) return;
            if (Array.isArray(n)) {
                n.forEach(walk);
                return;
            }
            if (typeof n === 'object') {
                if (predicate(n)) answer = n;
                else walk(n.props?.children);
            }
        }
        walk(host.tree);
        assert(answer, 'element not found');
        return answer.props;
    };
    host.id = (id) => host.find((n) => n.props?.testID === id);
    host.type = (name) => host.find((n) => n.type === name);
    host.complete = () => {
        while (animations.length) animations.shift()();
        host.flush();
    };
    return host.flush();
}
const { calendarDate, dateKey } = load('./date-picker-utils');
const { DatePicker } = load('./date-picker');
const { DockedDatePicker } = load('./docked-date-picker');
const day = (n) => calendarDate(2026, 9, n);
let assertions = 0;
function check(value, message) {
    assert(value, message);
    assertions++;
}
let changes = [],
    dismisses = 0,
    h;
h = makeHost(DatePicker, {
    visible: true,
    value: day(25),
    onChange: (d) => {
        changes.push(d);
        h.setProps({ value: d });
    },
    onDismiss: () => {
        dismisses++;
        h.setProps({ visible: false });
    },
});
h.type('Calendar').onSelect(day(29));
h.flush();
check(changes.length === 0, 'select stays draft');
h.id('date-picker-cancel').onPress();
h.flush();
check(dismisses === 1, 'Cancel requests dismissal immediately');
check(h.tree !== null, 'modal retained through fade');
h.complete();
check(h.tree === null, 'close animation unmounts content');
h.setProps({ visible: true });
check(dateKey(h.type('Calendar').start) === '2026-10-25', 'Cancel discarded draft after reopening');
h.type('Calendar').onSelect(day(30));
h.flush();
const confirm = h.id('date-picker-confirm').onPress;
confirm();
confirm();
h.flush();
check(changes.length === 1 && dateKey(changes[0]) === '2026-10-30', 'Confirm commits exactly once');
h.complete();
h.setProps({ visible: true });
h.setProps({ visible: false });
check(dismisses === 2, 'external close does not emit extra dismissal');
h.complete();
check(h.tree === null, 'external close completes fade');
let r;
r = makeHost(DatePicker, {
    mode: 'range',
    visible: true,
    value: {
        start: day(25),
        end: day(29),
    },
    onChange() {},
    onDismiss() {
        r.setProps({ visible: false });
    },
});
r.type('Months').onMonthChange(calendarDate(2026, 11));
r.flush();
r.id('date-picker-input-toggle').onPress();
r.flush();
r.id('date-picker-start-input').onSubmitEditing();
check(focused === 'date-picker-end-input', 'Next focuses end input');
r.id('date-picker-input-toggle').onPress();
r.flush();
check(dateKey(r.type('Months').month) === '2026-12-01', 'unchanged input toggle preserves scrolled range month');
let d,
    committed = [];
d = makeHost(DockedDatePicker, {
    value: day(25),
    onChange: (x) => {
        committed.push(x);
        d.setProps({ value: x });
    },
});
function toggleDock() {
    if (mobileDesign) d.id('docked-date-picker-input').onTrailingIconPress();
    else d.id('docked-date-picker-input').endAccessory({}).props.onPress();
    d.flush();
}
toggleDock();
d.type('Calendar').onSelect(day(29));
d.flush();
check(committed.length === 0, 'docked selection stays draft');
check(d.id('docked-date-picker-input').value === '29/10/2026', 'docked draft preview');
d.id('docked-date-picker-cancel').onPress();
d.flush();
check(d.id('docked-date-picker-input').value === '25/10/2026', 'docked Cancel restores field');
d.complete();
d.id('docked-date-picker-input').onBlur();
d.flush();
check(committed.length === 0, 'blur cannot commit canceled popup draft');
toggleDock();
d.type('Calendar').onSelect(day(28));
d.flush();
d.id('docked-date-picker-input').onFocus();
d.flush();
d.id('docked-date-picker-input').onBlur();
d.flush();
check(committed.length === 0, 'switching to manual edit discards popup draft');
d.complete();
d.id('docked-date-picker-input').onChangeText('26102026');
d.flush();
d.id('docked-date-picker-input').onBlur();
d.flush();
d.id('docked-date-picker-input').onSubmitEditing();
d.flush();
check(committed.length === 1 && dateKey(committed[0]) === '2026-10-26', 'manual blur/Enter normalize and commit once');
toggleDock();
d.id('docked-date-picker-confirm').onPress();
d.flush();
check(committed.length === 2, 'Accept emits selection even unchanged');
d.complete();
if (mobileDesign) {
    let repeats = 0;
    const dock = makeHost(DockedDatePicker, {
        value: day(25),
        onChange() {
            repeats++;
        },
    });
    const openDock = () => {
        dock.id('docked-date-picker-input').onTrailingIconPress();
        dock.flush();
    };
    openDock();
    dock.complete();
    const confirmDock = dock.id('docked-date-picker-confirm').onPress;
    confirmDock();
    confirmDock();
    dock.flush();
    check(repeats === 1, 'docked Accept rejects a repeated handler before the owner rerenders');
    dock.complete();
    openDock();
    dock.complete();
    dock.id('docked-date-picker-cancel').onPress();
    dock.flush();
    deferRNCallbacks = true;
    dock.complete();
    const oldDockClose = rnCallbacks.shift();
    assert.equal(typeof oldDockClose, 'function');
    openDock();
    dock.id('docked-date-picker-cancel').onPress();
    dock.flush();
    deferRNCallbacks = false;
    oldDockClose();
    dock.flush();
    check(Boolean(dock.id('docked-date-picker-popup')), 'old docked close callback cannot unmount a second close in progress');
    dock.complete();
    assert.throws(() => dock.id('docked-date-picker-popup'), /element not found/);
}
let quick;
quick = makeHost(DatePicker, {
    visible: true,
    value: day(25),
    onChange() {
        throw Error('unexpected commit');
    },
    onDismiss() {
        quick.setProps({ visible: false });
    },
});
quick.type('Calendar').onSelect(day(29));
quick.flush();
quick.id('date-picker-cancel').onPress();
quick.flush();
quick.setProps({ visible: true });
check(dateKey(quick.type('Calendar').start) === '2026-10-25', 'reopening during close fade resets canceled draft');
quick.complete();
check(quick.tree !== null, 'old close callback cannot unmount reopened picker');
// A completed UI fade can enqueue its RN callback before a later session starts.
// Deliver that old callback only after the reopened picker begins closing again.
const queuedClose = makeHost(DatePicker, {
    visible: true,
    value: day(25),
    onChange() {},
    onDismiss() {},
});
queuedClose.setProps({ visible: false });
deferRNCallbacks = true;
queuedClose.complete();
const firstCloseCallback = rnCallbacks.shift();
assert.equal(typeof firstCloseCallback, 'function');
queuedClose.setProps({ visible: true });
queuedClose.setProps({ visible: false });
deferRNCallbacks = false;
firstCloseCallback();
queuedClose.flush();
check(queuedClose.tree !== null, 'queued first-close callback cannot end the second close early');
queuedClose.complete();
check(queuedClose.tree === null, 'second close unmounts only after its own animation finishes');
delete modules['./date-picker-months'];
const MonthsReal = load('./date-picker-months').DatePickerMonths;
let feedMonth;
const feed = makeHost(MonthsReal, {
    minimumDate: calendarDate(1900, 0),
    maximumDate: calendarDate(2100, 11, 31),
    month: calendarDate(2026, 9),
    onMonthChange: (m) => (feedMonth = m),
    onSelect() {},
    locale: 'es-MX',
    firstDayOfWeek: 0,
    testID: 'feed',
});
const list = feed.type('FlatList');
const decIndex = (2026 - 1900) * 12 + 11;
list.onScrollEndDrag({ nativeEvent: { contentOffset: { y: list.getItemLayout(null, decIndex).offset + 12 } } });
check(dateKey(feedMonth) === '2026-12-01', 'range remembers slow drag without momentum');
modules['@/components/Icon'] = { Icon: 'Icon' };
modules['@/components/TouchableRipple'] = { TouchableRipple: 'TouchableRipple' };
modules['@/theme/color-utils'] = { withAlpha: (c) => c };
delete modules['./date-picker-calendar'];
const CalendarReal = load('./date-picker-calendar').DatePickerCalendar;
let cal;
cal = makeHost(CalendarReal, {
    minimumDate: calendarDate(1900, 0),
    maximumDate: calendarDate(2100, 11, 31),
    month: calendarDate(2026, 9),
    onMonthChange: (m) => cal.setProps({ month: m }),
    onSelect() {},
    locale: 'es-MX',
    firstDayOfWeek: 0,
    testID: 'cal',
});
cal.find((n) => n.type === 'AnimatedView' && n.key === 'days').onLayout({ nativeEvent: { layout: { width: 336 } } });
cal.flush();
cal.id('cal-next-month').onPress();
cal.flush();
cal.id('cal-next-month').onPress();
cal.flush();
const event = (index, extra = 0) => ({
    nativeEvent: {
        contentOffset: { x: index * 336 + extra },
        contentSize: { width: 2412 * 336 },
        layoutMeasurement: { width: 336 },
    },
});
cal.id('cal-month-pager').onMomentumScrollEnd(event(decIndex - 1));
cal.flush();
check(dateKey(cal.props.month) === '2026-12-01', 'stale programmatic completion cannot undo rapid arrows');
cal.id('cal-month-pager').onScrollBeginDrag();
cal.id('cal-month-pager').onScrollEndDrag(event(decIndex + 1));
cal.flush();
check(dateKey(cal.props.month) === '2027-01-01', 'exact-boundary drag settles without momentum');
cal.id('cal-month-pager').onScrollBeginDrag();
cal.id('cal-month-pager').onScrollEndDrag(event(decIndex + 2, 100));
cal.id('cal-month-pager').onMomentumScrollEnd(event(decIndex + 2));
cal.flush();
check(dateKey(cal.props.month) === '2027-02-01', 'user momentum updates month');
console.log(
    `PASS ${mobileDesign ? 'mobile-design' : 'app'}: ${assertions} date-picker interaction regressions (mock hooks/native boundaries; no visual or frame-rate claims).`
);
