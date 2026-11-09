/// <reference path="../paper-internals.d.ts" />
import { getScrollIndicatorProps, type ScrollIndicatorOptions } from '../scroll-indicators';
import { NativeModal as Modal } from '../native-modal';
import {
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ComponentProps,
    type ComponentRef,
    type ReactNode,
} from 'react';
import {
    AccessibilityInfo,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    View,
    useWindowDimensions,
    type ColorValue,
    type StyleProp,
    type TextInputInstance,
    type ViewStyle,
} from 'react-native';
import { Text, useLocale, useTheme, type Theme } from 'react-native-paper';
import { ReduceMotionContext } from 'react-native-paper/lib/module/theme/accessibility/ReduceMotionContext';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOverlayPresence } from './sheets';
import { SearchIconButton } from './search-icon-button';
import { Searchbar } from './searchbar';
import { SearchTrigger } from './search-trigger';
import { Divider, List } from './content';

type SearchIcon = ComponentProps<typeof List.Icon>['icon'];
type SearchInputHandle = Pick<TextInputInstance, 'setNativeProps' | 'isFocused' | 'clear' | 'blur' | 'focus' | 'setSelection'>;
export type SearchResult = {
    key: string;
    title: string;
    description?: string;
    icon?: SearchIcon;
    disabled?: boolean;
    accessibilityLabel?: string;
};
export type SearchViewProps = {
    /** Scrollbars are opt-in for this component only; both axes are hidden by default. */
    scrollIndicators?: ScrollIndicatorOptions;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Called after the outgoing view is removed; interrupted exits do not notify. */
    onClosed?: () => void;
    value: string;
    onChangeText: (value: string) => void;
    onSearch: (query: string) => void;
    results?: readonly SearchResult[];
    /** Announced when custom results change, including empty and loading states. */
    resultsAccessibilityLabel?: string;
    onResultPress?: (result: SearchResult) => void;
    renderResults?: (state: { containerColor: ColorValue }) => ReactNode;
    loading?: boolean;
    placeholder?: string;
    emptyContent?: ReactNode;
    supportingContent?: ReactNode;
    /** Persistent contextual controls below the scrolling results. */
    footerContent?: ReactNode;
    /** Keep the footer at the window bottom, covered by the keyboard, when false. */
    footerAvoidsKeyboard?: boolean;
    /** Color of the existing reserved space below the footer; does not add padding. */
    footerContainerColor?: ColorValue;
    /** Alternate measured entry; use SearchTrigger for a capsule, or IconButton/Chip for their own target shapes. */
    renderTrigger?: (state: { open: () => void; disabled: boolean; expanded: boolean }) => ReactNode;
    trailingContent?: ReactNode;
    /** Independent controls inside the expanded input, alongside its clear action. */
    inputTrailingContent?: ReactNode;
    trailingActions?: readonly { key: string; icon: SearchIcon; label: string; onPress: () => void; disabled?: boolean; testID?: string }[];
    leadingIcon?: SearchIcon;
    onLeadingPress?: () => void;
    /** Closed entry point only; an app bar may paint its animated search container. */
    barContainerColor?: ColorValue;
    barTextAlign?: 'start' | 'center';
    autoFocus?: boolean;
    closeOnSubmit?: boolean;
    closeOnSelect?: boolean;
    disabled?: boolean;
    variant?: 'contained' | 'divided';
    presentation?: 'full-screen' | 'docked' | 'auto';
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

type Anchor = { x: number; y: number; width: number; height: number };

function SearchInputHeader({
    contained,
    animatedStyle,
    ...props
}: {
    contained: boolean;
    animatedStyle: ComponentProps<typeof Animated.View>['style'];
    style: StyleProp<ViewStyle>;
    children: ReactNode;
    testID: string;
}) {
    // The baseline input needs a plain native host; a transform on its animated
    // ancestor can hide editable text in iOS, even when that transform is zero.
    return contained ? <Animated.View {...props} style={[props.style, animatedStyle]} /> : <View {...props} />;
}

/** A controlled search bar and full-screen search view; results and actions belong to the caller. */
export function SearchView({
    scrollIndicators,
    open,
    onOpenChange,
    onClosed,
    value,
    onChangeText,
    onSearch,
    results = [],
    resultsAccessibilityLabel,
    onResultPress,
    renderResults,
    loading = false,
    placeholder = 'Buscar',
    emptyContent,
    supportingContent,
    footerContent,
    footerAvoidsKeyboard = true,
    footerContainerColor,
    renderTrigger,
    trailingContent,
    inputTrailingContent,
    trailingActions = [],
    leadingIcon = 'search',
    onLeadingPress,
    barContainerColor,
    barTextAlign = 'start',
    autoFocus = true,
    closeOnSubmit = false,
    closeOnSelect = true,
    disabled = false,
    variant = 'contained',
    presentation = 'auto',
    style,
    testID = 'mobile-search',
}: SearchViewProps) {
    const theme = useTheme<Theme>();
    const rtl = useLocale().direction === 'rtl';
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const reduced = useContext(ReduceMotionContext) || theme.animation.scale === 0;
    const bar = useRef<ComponentRef<typeof View>>(null);
    const input = useRef<SearchInputHandle>(null);
    const [anchor, setAnchor] = useState<Anchor>();
    const [trailingWidth, setTrailingWidth] = useState(0);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [barFocused, setBarFocused] = useState(false);
    const latest = useRef({
        open,
        disabled,
        onOpenChange,
        onChangeText,
        value,
        loading,
        onSearch,
        onResultPress,
        results,
        closeOnSelect,
        closeOnSubmit,
    });
    const focusFrame = useRef<number | undefined>(undefined);
    const alive = useRef(true);
    const measurementRevision = useRef(0);
    const { present, progress } = useOverlayPresence(
        open,
        reduced ? 0 : theme.motion.duration.medium4 * theme.animation.scale,
        variant === 'contained' ? 'search' : 'timing',
        undefined,
        // Exit completes on arrival at the entry; an invisible spring tail must
        // not keep its modal blocking the restored bar and contextual actions.
        { ready: anchor !== undefined, overshootClamping: variant !== 'contained' || !open }
    );
    const wasPresent = useRef(present);
    const previousOpen = useRef(open);
    const docked = presentation === 'docked' || (presentation === 'auto' && window.width >= 600);
    const panelWidth = Math.min(720, Math.max(360, anchor?.width ?? 360), Math.max(1, window.width - insets.left - insets.right - 32));
    const panelHeight = Math.min((window.height * 2) / 3, Math.max(1, window.height - insets.top - insets.bottom - 32));
    const panelX = Math.max(insets.left + 16, Math.min(anchor?.x ?? 16, window.width - insets.right - panelWidth - 16));
    const panelY = Math.max(insets.top + 16, Math.min(anchor?.y ?? insets.top + 16, window.height - insets.bottom - panelHeight - 16));
    const background = variant === 'contained' && !docked ? theme.colors.surfaceContainerLow : theme.colors.surfaceContainerHigh;
    const leadingColor = variant === 'contained' ? theme.colors.onSurfaceVariant : theme.colors.onSurface;
    const inputMode = variant === 'contained' || docked ? 'bar' : 'view';
    const fieldHeight = Math.max(inputMode === 'bar' ? 56 : 72, (theme.fonts.bodyLarge.lineHeight ?? 24) * window.fontScale + 8);
    const fieldX = docked ? panelX : insets.left + (variant === 'contained' ? 12 : 0);
    const fieldY = docked ? panelY : insets.top + (variant === 'contained' ? 8 : 0);
    const fieldWidth = docked ? panelWidth : window.width - insets.left - insets.right - (variant === 'contained' ? 24 : 0);
    const resultsStatus =
        resultsAccessibilityLabel ??
        (loading
            ? 'Buscando…'
            : !renderResults || results.length > 0
              ? `${results.length} ${value ? (results.length === 1 ? 'resultado' : 'resultados') : results.length === 1 ? 'sugerencia' : 'sugerencias'}`
              : undefined);
    useEffect(() => {
        if (Platform.OS !== 'ios' || !open || !resultsStatus) return;
        let current = true;
        // Android uses the live region below; iOS needs an explicit announcement.
        // Wait for input feedback to settle and coalesce results while typing.
        const timer = setTimeout(() => {
            AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
                if (current && enabled) AccessibilityInfo.announceForAccessibilityWithOptions(resultsStatus, { queue: true });
            });
        }, 300);
        return () => {
            current = false;
            clearTimeout(timer);
        };
    }, [open, results, resultsStatus, value]);
    useEffect(() => {
        if (footerAvoidsKeyboard || Platform.OS !== 'android' || !present) return;
        setKeyboardVisible(Keyboard.isVisible());
        const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            show.remove();
            hide.remove();
        };
    }, [footerAvoidsKeyboard, present]);
    useLayoutEffect(() => {
        latest.current = {
            open,
            disabled,
            onOpenChange,
            onChangeText,
            value,
            loading,
            onSearch,
            onResultPress,
            results,
            closeOnSelect,
            closeOnSubmit,
        };
    }, [disabled, open, onOpenChange, onChangeText, value, loading, onSearch, onResultPress, results, closeOnSelect, closeOnSubmit]);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            measurementRevision.current++;
            if (focusFrame.current !== undefined) cancelAnimationFrame(focusFrame.current);
        };
    }, []);
    useEffect(() => {
        const closed = wasPresent.current && !present && !open;
        wasPresent.current = present;
        if (closed) onClosed?.();
    }, [onClosed, open, present]);
    const measure = useCallback(() => {
        const revision = ++measurementRevision.current;
        bar.current?.measureInWindow((x, y, width, height) => {
            if (
                alive.current &&
                revision === measurementRevision.current &&
                [x, y, width, height].every(Number.isFinite) &&
                width > 0 &&
                height > 0
            )
                setAnchor((previous) =>
                    previous?.x === x && previous.y === y && previous.width === width && previous.height === height
                        ? previous
                        : { x, y, width, height }
                );
        });
    }, [window.width, window.height]);
    const close = useCallback(() => {
        if (!alive.current || !latest.current.open) return;
        measurementRevision.current++;
        if (focusFrame.current !== undefined) cancelAnimationFrame(focusFrame.current);
        input.current?.blur();
        Keyboard.dismiss();
        latest.current.onOpenChange(false);
    }, []);
    const enter = useCallback(() => {
        if (!alive.current || latest.current.disabled) return;
        measure();
        latest.current.onOpenChange(true);
    }, [measure]);
    const focus = useCallback(() => {
        if (focusFrame.current !== undefined) cancelAnimationFrame(focusFrame.current);
        if (!autoFocus || !latest.current.open || latest.current.disabled) return;
        focusFrame.current = requestAnimationFrame(() => {
            if (alive.current && latest.current.open && !latest.current.disabled) input.current?.focus();
        });
    }, [autoFocus]);
    useEffect(() => {
        if (open) measure();
        else {
            measurementRevision.current++;
            input.current?.blur();
            // A closed instance can resize alongside another active search.
            if (previousOpen.current) Keyboard.dismiss();
        }
        previousOpen.current = open;
    }, [measure, open]);
    useEffect(() => {
        if (present && open) focus();
    }, [focus, open, present]);
    const submit = () => {
        const current = latest.current;
        if (!alive.current || !current.open || current.disabled || current.loading) return;
        input.current?.blur();
        Keyboard.dismiss();
        current.onSearch(current.value);
        if (current.closeOnSubmit) close();
    };
    const change = useCallback((next: string) => {
        const current = latest.current;
        if (alive.current && current.open && !current.disabled) current.onChangeText(next);
    }, []);
    const backgroundStyle = useAnimatedStyle(() => {
        const amount = Math.max(0, Math.min(1, progress.get()));
        const origin = anchor ?? { x: 0, y: insets.top, width: window.width, height: 56 };
        if (variant === 'contained')
            return {
                left: 0,
                top: 0,
                width: window.width,
                height: window.height,
                borderRadius: 0,
                backgroundColor: background,
                opacity: docked ? 0 : amount,
            };
        return {
            opacity: 1,
            backgroundColor:
                typeof background === 'string' && typeof (barContainerColor ?? theme.colors.surfaceContainerHigh) === 'string'
                    ? interpolateColor(amount, [0, 1], [barContainerColor ?? theme.colors.surfaceContainerHigh, background] as string[])
                    : background,
            left: origin.x + ((docked ? panelX : 0) - origin.x) * amount,
            top: origin.y + ((docked ? panelY : 0) - origin.y) * amount,
            width: origin.width + ((docked ? panelWidth : window.width) - origin.width) * amount,
            height: origin.height + ((docked ? panelHeight : window.height) - origin.height) * amount,
            borderRadius: docked ? 28 : 28 * (1 - amount),
        };
    });
    // Animate the empty capsule independently: text and glyphs never stretch.
    const capsuleStyle = useAnimatedStyle(() => {
        const amount = reduced ? 1 : progress.get();
        const origin = anchor ?? { x: fieldX, y: fieldY, width: fieldWidth, height: fieldHeight };
        return {
            left: origin.x + (fieldX - origin.x) * amount,
            top: origin.y + (fieldY - origin.y) * amount,
            width: Math.max(1, origin.width + (fieldWidth - origin.width) * amount),
            height: Math.max(1, origin.height + (fieldHeight - origin.height) * amount),
            borderRadius: 28,
        };
    });
    const headerStyle = useAnimatedStyle(() => {
        const amount = reduced ? 1 : progress.get();
        const origin = anchor ?? { x: fieldX, y: fieldY, width: fieldWidth };
        return variant === 'contained'
            ? {
                  opacity: !open || origin.width < 128 ? Math.max(0, Math.min(1, amount)) : 1,
                  transform: [{ translateX: (origin.x - fieldX) * (1 - amount) }, { translateY: (origin.y - fieldY) * (1 - amount) }],
              }
            : { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }] };
    });
    const contentStyle = useAnimatedStyle(() =>
        variant === 'contained'
            ? { opacity: 1, transform: [{ translateY: 0 }] }
            : { opacity: Math.max(0, Math.min(1, progress.get())), transform: [{ translateY: (1 - progress.get()) * 16 }] }
    );
    const resultsStyle = useAnimatedStyle(() =>
        variant === 'contained'
            ? {
                  opacity: Math.max(0, Math.min(1, (progress.get() - 0.2) / 0.8)),
                  transform: [{ translateY: reduced ? 0 : (1 - progress.get()) * 16 }],
              }
            : { opacity: 1, transform: [{ translateY: 0 }] }
    );
    const scrimStyle = useAnimatedStyle(() => ({ opacity: 0.32 * Math.max(0, Math.min(1, progress.get())) }));
    const inputActions =
        inputTrailingContent != null ? (
            <View
                style={{
                    direction: 'ltr',
                    flexDirection: rtl ? 'row-reverse' : 'row',
                    alignItems: 'center',
                }}
            >
                {value.length > 0 && !loading ? (
                    <SearchIconButton
                        icon="close"
                        iconColor={leadingColor}
                        accessibilityLabel="Borrar búsqueda"
                        disabled={!open || disabled || loading}
                        onPress={() => {
                            if (!alive.current || !latest.current.open || latest.current.disabled || latest.current.loading) return;
                            change('');
                            input.current?.focus();
                        }}
                        testID={`${testID}-clear`}
                    />
                ) : null}
                {inputTrailingContent}
            </View>
        ) : undefined;
    const footer = (
        <>
            {footerContent}
            {/* KAV's iOS padding replaces style.paddingBottom, so reserve this space as a child. */}
            <View
                pointerEvents="none"
                accessible={false}
                style={{
                    height: docked ? 8 : insets.bottom,
                    flexShrink: 0,
                    backgroundColor: footerContent != null ? footerContainerColor : undefined,
                }}
                testID={`${testID}-footer-safe-area`}
            />
        </>
    );
    return (
        <>
            <View
                ref={bar}
                collapsable={false}
                onLayout={measure}
                pointerEvents={present ? 'none' : 'auto'}
                accessibilityElementsHidden={present}
                importantForAccessibility={present ? 'no-hide-descendants' : 'auto'}
                style={[{ maxWidth: 720 }, style]}
            >
                {renderTrigger ? (
                    renderTrigger({ open: enter, disabled, expanded: open })
                ) : (
                    <>
                        <SearchTrigger
                            onFocus={(event) =>
                                setBarFocused(
                                    Platform.OS === 'web' && (event.currentTarget as unknown as HTMLElement).matches(':focus-visible')
                                )
                            }
                            onBlur={() => setBarFocused(false)}
                            onPressIn={(event) => {
                                if (!(event.nativeEvent as { key?: string }).key) setBarFocused(false);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={value ? `${placeholder}: ${value}` : placeholder}
                            accessibilityHint="Abre la vista de búsqueda"
                            accessibilityState={{ disabled, expanded: open }}
                            disabled={disabled}
                            onPress={enter}
                            style={{
                                opacity: present ? 0 : 1,
                                ...(Platform.OS === 'web' && barFocused && !disabled
                                    ? { outlineStyle: 'solid', outlineWidth: 3, outlineOffset: 2, outlineColor: theme.colors.secondary }
                                    : {}),
                            }}
                            testID={`${testID}-bar`}
                        >
                            <View
                                {...(Platform.OS === 'web' ? { 'aria-hidden': true, inert: true } : {})}
                                pointerEvents="none"
                                accessible={false}
                                accessibilityElementsHidden
                                importantForAccessibility="no-hide-descendants"
                            >
                                <Searchbar
                                    mode="bar"
                                    icon={
                                        onLeadingPress
                                            ? ({ size }) => (
                                                  <View style={{ width: size, height: size }} testID={`${testID}-leading-placeholder`} />
                                              )
                                            : leadingIcon
                                    }
                                    editable={false}
                                    value={value}
                                    placeholder={placeholder}
                                    placeholderTextColor={theme.colors.onSurfaceVariant}
                                    inputStyle={{
                                        color: theme.colors.onSurface,
                                        textAlign: barTextAlign === 'center' ? 'center' : rtl ? 'right' : 'left',
                                    }}
                                    iconColor={theme.colors.onSurface}
                                    onChangeText={change}
                                    right={() => (
                                        <View
                                            style={{
                                                width: trailingContent || trailingActions.length ? trailingWidth : 0,
                                            }}
                                        />
                                    )}
                                    style={{ backgroundColor: barContainerColor ?? theme.colors.surfaceContainerHigh }}
                                />
                            </View>
                        </SearchTrigger>
                        {/* Match the field's 4dp inset and 48dp logical leading target. */}
                        {onLeadingPress ? (
                            <SearchIconButton
                                icon={leadingIcon}
                                iconColor={theme.colors.onSurface}
                                accessibilityLabel="Abrir navegación"
                                disabled={disabled}
                                onPress={onLeadingPress}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    transform: [{ translateY: -24 }],
                                    [rtl ? 'right' : 'left']: 4,
                                    opacity: present ? 0 : 1,
                                }}
                                testID={`${testID}-leading-action`}
                            />
                        ) : null}
                        {trailingContent || trailingActions.length ? (
                            <View
                                onLayout={(event) => setTrailingWidth(event.nativeEvent.layout.width)}
                                pointerEvents={disabled ? 'none' : 'auto'}
                                accessibilityElementsHidden={disabled}
                                importantForAccessibility={disabled ? 'no-hide-descendants' : 'auto'}
                                style={{
                                    position: 'absolute',
                                    [rtl ? 'left' : 'right']: 4,
                                    top: '50%',
                                    transform: [{ translateY: -24 }],
                                    minHeight: 48,
                                    flexDirection: rtl ? 'row-reverse' : 'row',
                                    alignItems: 'center',
                                    opacity: present ? 0 : 1,
                                }}
                                testID={`${testID}-trailing-content`}
                            >
                                {trailingActions.map((action) => (
                                    <View key={action.key} style={{ width: 48, alignItems: 'center' }}>
                                        <SearchIconButton
                                            icon={action.icon}
                                            accessibilityLabel={action.label}
                                            disabled={disabled || action.disabled}
                                            onPress={action.onPress}
                                            testID={action.testID ?? `${testID}-action-${action.key}`}
                                        />
                                    </View>
                                ))}
                                {trailingContent}
                            </View>
                        ) : null}
                    </>
                )}
            </View>
            {present ? (
                <Modal
                    accessibilityLabel={placeholder}
                    transparent
                    animationType="none"
                    visible
                    onShow={focus}
                    onRequestClose={close}
                    statusBarTranslucent
                    navigationBarTranslucent
                >
                    {docked ? (
                        <Animated.View key="scrim" pointerEvents="box-none" style={[{ position: 'absolute', inset: 0 }, scrimStyle]}>
                            <Pressable
                                accessible={false}
                                focusable={false}
                                {...(Platform.OS === 'web' ? { 'aria-hidden': true, tabIndex: -1 } : {})}
                                style={{ position: 'absolute', inset: 0, backgroundColor: theme.colors.scrim }}
                                disabled={!open}
                                onPress={close}
                                testID={`${testID}-outside`}
                            />
                        </Animated.View>
                    ) : null}
                    <Animated.View
                        key="background"
                        pointerEvents="none"
                        style={[{ position: 'absolute', backgroundColor: background }, backgroundStyle]}
                    />
                    {variant === 'contained' ? (
                        <Animated.View
                            key="capsule"
                            pointerEvents="none"
                            style={[{ position: 'absolute', backgroundColor: theme.colors.surfaceContainerHigh }, capsuleStyle]}
                            testID={`${testID}-capsule`}
                        />
                    ) : null}
                    <Animated.View
                        key="content"
                        {...(Platform.OS === 'web' ? { 'aria-hidden': !open, inert: !open } : {})}
                        pointerEvents={open ? 'auto' : 'none'}
                        accessibilityElementsHidden={!open}
                        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
                        accessibilityViewIsModal
                        onAccessibilityEscape={close}
                        style={[
                            docked
                                ? {
                                      position: 'absolute',
                                      left: panelX,
                                      top: panelY,
                                      width: panelWidth,
                                      height: panelHeight,
                                      borderRadius: 28,
                                      overflow: variant === 'divided' ? 'hidden' : 'visible',
                                  }
                                : { flex: 1, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right },
                            { backgroundColor: 'transparent' },
                            contentStyle,
                        ]}
                        testID={`${testID}-view`}
                    >
                        <SearchInputHeader
                            contained={variant === 'contained'}
                            animatedStyle={headerStyle}
                            style={[
                                {
                                    direction: 'ltr',
                                    flexDirection: rtl ? 'row-reverse' : 'row',
                                    alignItems: 'center',
                                    backgroundColor: variant === 'contained' ? 'transparent' : theme.colors.surfaceContainerHigh,
                                    ...(variant === 'contained'
                                        ? {
                                              marginHorizontal: docked ? 0 : 12,
                                              marginTop: docked ? 0 : 8,
                                              marginBottom: docked ? 2 : 8,
                                              borderRadius: 28,
                                          }
                                        : { borderRadius: 0 }),
                                },
                            ]}
                            testID={`${testID}-header`}
                        >
                            <Searchbar
                                ref={input}
                                mode={inputMode}
                                value={value}
                                onChangeText={change}
                                placeholder={placeholder}
                                accessibilityLabel={placeholder}
                                placeholderTextColor={theme.colors.onSurfaceVariant}
                                inputStyle={{ color: theme.colors.onSurface }}
                                iconColor={leadingColor}
                                icon={
                                    variant === 'contained'
                                        ? rtl
                                            ? 'chevron_right'
                                            : 'chevron_left'
                                        : rtl
                                          ? 'arrow_forward'
                                          : 'arrow_back'
                                }
                                onIconPress={close}
                                searchAccessibilityLabel="Cerrar búsqueda"
                                clearAccessibilityLabel="Borrar búsqueda"
                                loading={loading}
                                editable={open && !disabled}
                                onSubmitEditing={submit}
                                returnKeyType="search"
                                blurOnSubmit={false}
                                showDivider={false}
                                right={inputActions ? () => (inputMode === 'bar' ? inputActions : null) : undefined}
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    backgroundColor: variant === 'contained' ? 'transparent' : theme.colors.surfaceContainerHigh,
                                    borderRadius: variant === 'contained' ? 28 : 0,
                                }}
                                testID={`${testID}-input`}
                            />
                            {/* View mode keeps its independent controls in the same row. */}
                            {inputMode === 'view' ? inputActions : null}
                        </SearchInputHeader>
                        {variant === 'divided' ? <Divider style={{ backgroundColor: theme.colors.outline }} /> : null}
                        <Animated.View
                            style={[
                                { flex: 1, minHeight: 0, backgroundColor: background },
                                docked && variant === 'contained' ? { borderRadius: 28, overflow: 'hidden', paddingBottom: 4 } : {},
                                resultsStyle,
                            ]}
                            testID={`${testID}-body`}
                        >
                            <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                                style={{ flex: 1, backgroundColor: background }}
                            >
                                {supportingContent ?? (
                                    <Text
                                        accessibilityLiveRegion="polite"
                                        accessibilityRole="header"
                                        variant="labelLarge"
                                        style={{ paddingHorizontal: 24, paddingVertical: 12, color: theme.colors.onSurfaceVariant }}
                                    >
                                        {loading
                                            ? 'Buscando…'
                                            : `${results.length} ${value ? (results.length === 1 ? 'resultado' : 'resultados') : results.length === 1 ? 'sugerencia' : 'sugerencias'}`}
                                    </Text>
                                )}
                                {renderResults ? (
                                    <List.Collection>{renderResults({ containerColor: background })}</List.Collection>
                                ) : (
                                    <List.Collection>
                                        <FlatList
                                            accessibilityRole="list"
                                            accessibilityLabel={value ? 'Resultados de búsqueda' : 'Sugerencias de búsqueda'}
                                            data={results}
                                            keyExtractor={(item) => item.key}
                                            keyboardShouldPersistTaps="handled"
                                            keyboardDismissMode="on-drag"
                                            contentContainerStyle={results.length ? { paddingVertical: 8 } : { flexGrow: 1, padding: 24 }}
                                            renderItem={({ item }) => {
                                                const row = (
                                                    <List.Item
                                                        title={item.title}
                                                        description={item.description}
                                                        style={{ backgroundColor: background }}
                                                        accessibilityLabel={item.accessibilityLabel ?? item.title}
                                                        disabled={disabled || loading || item.disabled || !onResultPress}
                                                        leading={
                                                            item.icon
                                                                ? ({ color }) => <List.Icon color={color} icon={item.icon!} />
                                                                : undefined
                                                        }
                                                        onPress={() => {
                                                            const current = latest.current;
                                                            const result = current.results.find((entry) => entry.key === item.key);
                                                            if (
                                                                alive.current &&
                                                                current.open &&
                                                                !current.disabled &&
                                                                !current.loading &&
                                                                result &&
                                                                !result.disabled &&
                                                                current.onResultPress
                                                            ) {
                                                                input.current?.blur();
                                                                Keyboard.dismiss();
                                                                current.onResultPress(result);
                                                                if (current.closeOnSelect) close();
                                                            }
                                                        }}
                                                        testID={`${testID}-result-${item.key}`}
                                                    />
                                                );
                                                return Platform.OS === 'web' ? <View role="listitem">{row}</View> : row;
                                            }}
                                            ListEmptyComponent={
                                                loading ? undefined : (
                                                    <>
                                                        {emptyContent ?? (
                                                            <Text style={{ color: theme.colors.onSurfaceVariant }}>No hay resultados</Text>
                                                        )}
                                                    </>
                                                )
                                            }
                                            testID={`${testID}-results`}
                                            {...getScrollIndicatorProps(scrollIndicators)}
                                        />
                                    </List.Collection>
                                )}
                                {footerAvoidsKeyboard ? footer : null}
                            </KeyboardAvoidingView>
                            {!footerAvoidsKeyboard ? (
                                <View
                                    pointerEvents={Platform.OS === 'android' && keyboardVisible ? 'none' : 'auto'}
                                    accessibilityElementsHidden={Platform.OS === 'android' && keyboardVisible}
                                    importantForAccessibility={
                                        Platform.OS === 'android' && keyboardVisible ? 'no-hide-descendants' : 'auto'
                                    }
                                    style={{
                                        flexShrink: 0,
                                        backgroundColor: background,
                                        display: Platform.OS === 'android' && keyboardVisible ? 'none' : 'flex',
                                    }}
                                    testID={`${testID}-fixed-footer`}
                                >
                                    {footer}
                                </View>
                            ) : null}
                        </Animated.View>
                    </Animated.View>
                </Modal>
            ) : null}
        </>
    );
}
