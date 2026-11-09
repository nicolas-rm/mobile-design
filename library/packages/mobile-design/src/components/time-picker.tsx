import { TouchableRipple } from '../ripple';
import { getScrollIndicatorProps, type ScrollIndicatorOptions } from '../scroll-indicators';
import { NativeModal as Modal } from '../native-modal';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    AccessibilityInfo,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import { Button, Icon, Portal, Surface, Text, useLocale, useTheme, type Theme } from 'react-native-paper';
import { GestureDetector, GestureHandlerRootView, PointerType, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    ReduceMotion,
    cancelAnimation,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, ClipPath, Defs, G, Text as SvgText } from 'react-native-svg';

export interface TimeValue {
    /** 0–23, regardless of the display format. */
    hours: number;
    minutes: number;
}

export interface TimePickerProps {
    /** Scrollbars are opt-in for this component only; both axes are hidden by default. */
    scrollIndicators?: ScrollIndicatorOptions;
    visible: boolean;
    value: TimeValue;
    onConfirm: (value: TimeValue) => void;
    /** Called for Cancel, outside press and native Back. The caller controls visible. */
    onDismiss: () => void;
    is24Hour?: boolean;
    initialDisplayMode?: 'dial' | 'input';
    initialSelection?: 'hours' | 'minutes';
    /** Disabled during native touch exploration. On web, only pointer selection advances. */
    autoSwitchToMinutes?: boolean;
    title?: string;
    inputTitle?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    hourLabel?: string;
    minuteLabel?: string;
    keyboardModeLabel?: string;
    dialModeLabel?: string;
    invalidTimeLabel?: string;
    testID?: string;
}

const AnimatedInput = Animated.createAnimatedComponent(TextInput);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const twoDigits = (value: number) => String(value).padStart(2, '0');
const isWeb = Platform.OS === 'web';

function validTime(value: TimeValue) {
    return (
        Number.isInteger(value.hours) &&
        value.hours >= 0 &&
        value.hours <= 23 &&
        Number.isInteger(value.minutes) &&
        value.minutes >= 0 &&
        value.minutes <= 59
    );
}

/** MD3 time dialog. Edits are a private draft until OK; every new opening starts from value. */
export function TimePicker(props: TimePickerProps) {
    if (!validTime(props.value)) throw new Error('TimePicker requires an integer hour 0–23 and minute 0–59.');
    const [rendered, setRendered] = useState(props.visible);
    const latestVisibility = useRef(props.visible);
    const transitionRevision = useRef(0);
    const disposed = useRef(false);
    useEffect(() => {
        disposed.current = false;
        return () => {
            disposed.current = true;
        };
    }, []);
    useLayoutEffect(() => {
        latestVisibility.current = props.visible;
        transitionRevision.current += 1;
        if (props.visible) setRendered(true);
    }, [props.visible]);
    const hidden = useCallback((revision: number) => {
        if (!disposed.current && !latestVisibility.current && revision === transitionRevision.current) setRendered(false);
    }, []);
    const getRevision = useCallback(() => transitionRevision.current, []);
    return rendered ? <TimePickerSession {...props} onHidden={hidden} getRevision={getRevision} /> : null;
}

function TimePickerSession({
    scrollIndicators,
    visible,
    value,
    onConfirm,
    onDismiss,
    is24Hour = false,
    initialDisplayMode = 'dial',
    initialSelection = 'hours',
    autoSwitchToMinutes = true,
    title,
    inputTitle,
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    hourLabel = 'Hour',
    minuteLabel = 'Minute',
    keyboardModeLabel = 'Switch to keyboard input',
    dialModeLabel = 'Switch to clock dial',
    invalidTimeLabel = 'Enter a valid time.',
    testID = 'time-picker',
    onHidden,
    getRevision,
}: TimePickerProps & { onHidden: (revision: number) => void; getRevision: () => number }) {
    const theme = useTheme<Theme>();
    const { direction } = useLocale();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const [draft, setDraft] = useState(value);
    const draftRef = useRef(value);
    const [displayMode, setDisplayMode] = useState(initialDisplayMode);
    const heading = displayMode === 'input' ? (inputTitle ?? title ?? 'Enter time') : (title ?? 'Select time');
    const [selection, setSelection] = useState(initialSelection);
    const [selectionRequest, setSelectionRequest] = useState(0);
    const selectionRequestRef = useRef(0);
    const getSelectionRequest = useCallback(() => selectionRequestRef.current, []);
    const [hourText, setHourText] = useState(twoDigits(is24Hour ? value.hours : value.hours % 12 || 12));
    const [minuteText, setMinuteText] = useState(twoDigits(value.minutes));
    const [inputFocus, setInputFocus] = useState<'hours' | 'minutes'>(initialSelection);
    const [inputTouched, setInputTouched] = useState(false);
    const [screenReader, setScreenReader] = useState(false);
    const [keyboardTop, setKeyboardTop] = useState<number>();
    const [session, setSession] = useState(0);
    const [actionWidths, setActionWidths] = useState({ cancel: 64, confirm: 64 });
    const sessionRevision = useRef(0);
    const opacity = useSharedValue(0);
    const hours = useSharedValue(value.hours);
    const minutes = useSharedValue(value.minutes);
    const transitionSignal = useSharedValue(0);
    const inputHourRef = useRef<React.ComponentRef<typeof TextInput>>(null);
    const inputMinuteRef = useRef<React.ComponentRef<typeof TextInput>>(null);
    const wasVisible = useRef(visible);
    const closing = useRef(false);
    const disposed = useRef(false);
    const shownHour = Number(hourText);
    const shownMinute = Number(minuteText);
    const validHour = /^\d{1,2}$/.test(hourText) && (is24Hour ? shownHour >= 0 && shownHour <= 23 : shownHour >= 1 && shownHour <= 12);
    const validMinute = /^\d{1,2}$/.test(minuteText) && shownMinute >= 0 && shownMinute <= 59;
    const validInput = validHour && validMinute;
    const viewportWidth = window.width - insets.left - insets.right - 32;
    const viewportHeight = window.height - insets.top - insets.bottom - 32;
    const portraitDialHeight = 512 + 16 * window.fontScale;
    const landscapeDial =
        (window.width > window.height || viewportHeight < portraitDialHeight) && viewportWidth >= 556 && viewportHeight >= 352;
    const landscape = displayMode === 'dial' && landscapeDial;
    const dialFits = viewportWidth >= (is24Hour ? 304 : 328) && viewportHeight >= (landscapeDial ? 352 : portraitDialHeight);
    const dialogWidth = Math.min(
        Math.max(landscape ? 556 : is24Hour ? (displayMode === 'dial' ? 304 : 264) : 328, actionWidths.cancel + actionWidths.confirm + 120),
        viewportWidth
    );
    const maxHeight = Math.max(120, Math.min(window.height, keyboardTop ?? window.height) - insets.top - insets.bottom - 32);
    const scale = theme.animation.scale;

    useLayoutEffect(() => {
        // M3: change orientation/variant before allowing the clock presentation to scroll.
        if (visible && displayMode === 'dial' && !dialFits) {
            const { hours: nextHours, minutes: nextMinutes } = draftRef.current;
            draftRef.current = { hours: nextHours, minutes: nextMinutes };
            setDraft(draftRef.current);
            setHourText(twoDigits(is24Hour ? nextHours : nextHours % 12 || 12));
            setMinuteText(twoDigits(nextMinutes));
            setInputFocus(selection);
            setDisplayMode('input');
        }
    }, [visible, displayMode, dialFits, is24Hour, selection, hours, minutes]);

    useEffect(() => {
        disposed.current = false;
        return () => {
            disposed.current = true;
            cancelAnimation(transitionSignal);
            cancelAnimation(opacity);
        };
    }, [transitionSignal, opacity]);

    useEffect(() => {
        // React Native Web reports true even when no assistive technology is active.
        if (Platform.OS === 'web') return;
        let current = true;
        AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
            if (current) setScreenReader(enabled);
        });
        const listener = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
        return () => {
            current = false;
            listener.remove();
        };
    }, []);

    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', (event) => setKeyboardTop(event.endCoordinates.screenY));
        const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardTop(undefined));
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    useLayoutEffect(() => {
        if (visible && !wasVisible.current) {
            sessionRevision.current += 1;
            setSession(sessionRevision.current);
            closing.current = false;
            draftRef.current = value;
            setDraft(value);
            hours.set(value.hours);
            minutes.set(value.minutes);
            setHourText(twoDigits(is24Hour ? value.hours : value.hours % 12 || 12));
            setMinuteText(twoDigits(value.minutes));
            setDisplayMode(initialDisplayMode === 'dial' && !dialFits ? 'input' : initialDisplayMode);
            setSelection(initialSelection);
            setInputFocus(initialSelection);
            setInputTouched(false);
        }
        wasVisible.current = visible;
    }, [visible, value, is24Hour, initialDisplayMode, initialSelection, hours, minutes, dialFits]);

    useEffect(() => {
        const revision = getRevision();
        if (!visible) {
            closing.current = true;
            Keyboard.dismiss();
            cancelAnimation(transitionSignal);
        }
        opacity.set(
            withTiming(
                visible ? 1 : 0,
                {
                    // Installed Paper 6 Modal: 220ms × animation.scale, out(cubic), opacity only.
                    duration: 220 * scale,
                    easing: Easing.out(Easing.cubic),
                    reduceMotion: ReduceMotion.Never,
                },
                (finished) => {
                    if (finished && !visible) scheduleOnRN(onHidden, revision);
                }
            )
        );
    }, [visible, scale, opacity, getRevision, onHidden, transitionSignal]);

    useEffect(() => {
        if (!visible || displayMode !== 'input') return;
        const timer = setTimeout(() => {
            if (!disposed.current && !closing.current) (inputFocus === 'hours' ? inputHourRef : inputMinuteRef).current?.focus();
        }, 220 * scale);
        return () => clearTimeout(timer);
    }, [visible, displayMode, inputFocus, scale, session]);

    const animatedOpacity = useAnimatedStyle(() => ({ opacity: opacity.get() }));
    const dismiss = () => {
        if (closing.current || !visible) return;
        closing.current = true;
        cancelAnimation(transitionSignal);
        Keyboard.dismiss();
        onDismiss();
    };
    const syncDraft = useCallback(
        (nextHours: number, nextMinutes: number) => {
            draftRef.current = { hours: nextHours, minutes: nextMinutes };
            setDraft(draftRef.current);
            setHourText(twoDigits(is24Hour ? nextHours : nextHours % 12 || 12));
            setMinuteText(twoDigits(nextMinutes));
        },
        [is24Hour]
    );
    const selectMinutes = useCallback(() => {
        if (!disposed.current && !closing.current && session === sessionRevision.current) setSelection('minutes');
    }, [session]);
    const finishDial = useCallback(
        (nextHours: number, nextMinutes: number) => {
            if (!disposed.current && !closing.current && session === sessionRevision.current) syncDraft(nextHours, nextMinutes);
        },
        [syncDraft, session]
    );
    const changeSelection = (next: 'hours' | 'minutes') => {
        cancelAnimation(transitionSignal);
        selectionRequestRef.current += 1;
        setSelectionRequest(selectionRequestRef.current);
        setSelection(next);
    };
    const parsedInput = (): TimeValue => ({
        hours: is24Hour ? shownHour : (shownHour % 12) + (draft.hours >= 12 ? 12 : 0),
        minutes: shownMinute,
    });
    const toggleMode = () => {
        cancelAnimation(transitionSignal);
        if (displayMode === 'input') {
            setInputTouched(true);
            if (!validInput) return;
            const next = parsedInput();
            hours.set(next.hours);
            minutes.set(next.minutes);
            draftRef.current = next;
            setDraft(next);
            setSelection(inputFocus);
            Keyboard.dismiss();
            setDisplayMode('dial');
        } else {
            syncDraft(draftRef.current.hours, draftRef.current.minutes);
            setInputFocus(selection);
            setDisplayMode('input');
        }
    };
    const confirm = () => {
        if (closing.current || !visible) return;
        if (displayMode === 'input' && !validInput) {
            setInputTouched(true);
            return;
        }
        // Numeral presses publish their draft on RN before the UI worklet runs.
        // Confirm the published choice, rather than reading an older UI value.
        const next = displayMode === 'input' ? parsedInput() : { ...draftRef.current };
        closing.current = true;
        cancelAnimation(transitionSignal);
        Keyboard.dismiss();
        onConfirm(next);
    };
    const setPeriod = (pm: boolean) => {
        const nextHours = (draftRef.current.hours % 12) + (pm ? 12 : 0);
        hours.set(nextHours);
        draftRef.current = { ...draftRef.current, hours: nextHours };
        setDraft(draftRef.current);
    };
    const period = !is24Hour && (
        <PeriodSelector
            theme={theme}
            pm={draft.hours >= 12}
            onChange={setPeriod}
            horizontal={landscape}
            input={displayMode === 'input'}
            testID={testID}
        />
    );
    const selectorWidth = is24Hour && !landscape ? 114 : 96;
    const periodSpace = is24Hour ? 0 : 52 + 12;
    const availableInputWidth = dialogWidth - 2 * 24 - 24 - periodSpace;
    const inputWidth = Math.min(96, Math.max(48, availableInputWidth / 2));
    const hourError = displayMode === 'input' && inputTouched && !validHour;
    const minuteError = displayMode === 'input' && inputTouched && !validMinute;

    const numbers = (
        <View style={styles.numbers}>
            {displayMode === 'dial' ? (
                <TimeSelector
                    width={selectorWidth}
                    value={hours}
                    accessibilityNumber={is24Hour ? draft.hours : draft.hours % 12 || 12}
                    hours
                    is24Hour={is24Hour}
                    selected={selection === 'hours'}
                    onPress={() => changeSelection('hours')}
                    label={hourLabel}
                    theme={theme}
                    testID={`${testID}-select-hours`}
                />
            ) : (
                <TimeInputField
                    width={inputWidth}
                    inputRef={inputHourRef}
                    value={hourText}
                    onChange={(text) => {
                        setHourText(text.replace(/\D/g, '').slice(0, 2));
                    }}
                    selected={inputFocus === 'hours'}
                    onFocus={() => setInputFocus('hours')}
                    onBlur={() => {
                        setInputTouched(true);
                        if (validHour) setHourText(twoDigits(shownHour));
                    }}
                    onSubmit={() => inputMinuteRef.current?.focus()}
                    error={hourError}
                    errorDescriptionID={`${testID}-error-text`}
                    hint={`${hourLabel}: ${is24Hour ? '0–23' : '1–12'}`}
                    label={hourLabel}
                    theme={theme}
                    returnKeyType="next"
                    testID={`${testID}-hour-input`}
                />
            )}
            <View style={[styles.separatorSlot, { height: displayMode === 'dial' ? 80 : 72 }]}>
                <TextInput
                    accessible={false}
                    {...(Platform.OS === 'web' ? { 'aria-hidden': true, tabIndex: -1 } : {})}
                    editable={false}
                    caretHidden
                    pointerEvents="none"
                    underlineColorAndroid="transparent"
                    value=":"
                    numberOfLines={1}
                    multiline={false}
                    maxFontSizeMultiplier={1.3}
                    style={[
                        theme.fonts.displayLarge,
                        styles.separator,
                        displayMode === 'input' && styles.inputSeparator,
                        { height: displayMode === 'dial' ? 80 : 72, color: theme.colors.onSurface },
                    ]}
                    testID={`${testID}-separator`}
                />
            </View>
            {displayMode === 'dial' ? (
                <TimeSelector
                    width={selectorWidth}
                    value={minutes}
                    accessibilityNumber={draft.minutes}
                    selected={selection === 'minutes'}
                    onPress={() => changeSelection('minutes')}
                    label={minuteLabel}
                    theme={theme}
                    testID={`${testID}-select-minutes`}
                />
            ) : (
                <TimeInputField
                    width={inputWidth}
                    inputRef={inputMinuteRef}
                    value={minuteText}
                    onChange={(text) => setMinuteText(text.replace(/\D/g, '').slice(0, 2))}
                    selected={inputFocus === 'minutes'}
                    onFocus={() => setInputFocus('minutes')}
                    onBlur={() => {
                        setInputTouched(true);
                        if (validMinute) setMinuteText(twoDigits(shownMinute));
                    }}
                    onSubmit={confirm}
                    error={minuteError}
                    errorDescriptionID={`${testID}-error-text`}
                    hint={`${minuteLabel}: 0–59`}
                    label={minuteLabel}
                    theme={theme}
                    returnKeyType="done"
                    testID={`${testID}-minute-input`}
                />
            )}
        </View>
    );

    return (
        <Portal>
            <Modal
                {...(Platform.OS === 'web' ? { accessibilityLabel: heading } : {})}
                visible
                transparent
                animationType="none"
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={dismiss}
                supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
            >
                <GestureHandlerRootView style={styles.fill}>
                    <Animated.View style={[StyleSheet.absoluteFill, animatedOpacity]}>
                        {Platform.OS === 'web' ? (
                            <View
                                aria-hidden
                                {...{ onClick: visible ? dismiss : undefined }}
                                style={[styles.fill, { backgroundColor: theme.colors.scrim, opacity: 0.32 }]}
                                testID={`${testID}-backdrop`}
                            />
                        ) : (
                            <Pressable
                                accessible={false}
                                onPress={dismiss}
                                style={[styles.fill, { backgroundColor: theme.colors.scrim, opacity: 0.32 }]}
                                testID={`${testID}-backdrop`}
                            />
                        )}
                    </Animated.View>
                    <KeyboardAvoidingView
                        style={[
                            styles.center,
                            {
                                paddingTop: insets.top + 16,
                                paddingBottom: insets.bottom + 16,
                                paddingLeft: insets.left + 16,
                                paddingRight: insets.right + 16,
                            },
                        ]}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        pointerEvents="box-none"
                    >
                        <Animated.View
                            accessibilityViewIsModal
                            onAccessibilityEscape={dismiss}
                            pointerEvents={visible ? 'auto' : 'none'}
                            style={[{ width: dialogWidth, maxHeight }, animatedOpacity]}
                            testID={testID}
                        >
                            <Surface
                                mode="flat"
                                elevation={theme.elevation.level3}
                                style={{ borderRadius: theme.shapes.corner.extraLarge, backgroundColor: theme.colors.surfaceContainerHigh }}
                            >
                                <View
                                    style={{ maxHeight, flexShrink: 1, borderRadius: theme.shapes.corner.extraLarge, overflow: 'hidden' }}
                                >
                                    {!landscape && (
                                        <Text
                                            accessibilityRole="header"
                                            style={[theme.fonts.labelMedium, styles.title, { color: theme.colors.onSurfaceVariant }]}
                                        >
                                            {heading}
                                        </Text>
                                    )}
                                    <ScrollView
                                        scrollEnabled={displayMode === 'input'}
                                        keyboardShouldPersistTaps="handled"
                                        contentContainerStyle={[styles.body, landscape && styles.landscape]}
                                        style={{ flexShrink: 1 }}
                                        {...getScrollIndicatorProps(scrollIndicators)}
                                    >
                                        <View
                                            style={[
                                                { alignItems: 'center' },
                                                landscape && { alignSelf: 'stretch', justifyContent: 'center' },
                                            ]}
                                        >
                                            {landscape && (
                                                <Text
                                                    accessibilityRole="header"
                                                    style={[
                                                        theme.fonts.labelMedium,
                                                        styles.landscapeTitle,
                                                        { color: theme.colors.onSurfaceVariant },
                                                    ]}
                                                >
                                                    {heading}
                                                </Text>
                                            )}
                                            <View style={styles.display}>
                                                {numbers}
                                                {!landscape && period && <View style={{ marginLeft: 12 }}>{period}</View>}
                                            </View>
                                            {landscape && period && <View style={{ marginTop: 16 }}>{period}</View>}
                                        </View>
                                        {displayMode === 'dial' && (
                                            <View style={landscape ? { marginLeft: 36 } : { marginTop: 36, marginBottom: 24 }}>
                                                <ClockDial
                                                    key={session}
                                                    hours={hours}
                                                    minutes={minutes}
                                                    draft={draft}
                                                    selection={selection}
                                                    selectionRequest={selectionRequest}
                                                    getSelectionRequest={getSelectionRequest}
                                                    is24Hour={is24Hour}
                                                    autoSwitch={autoSwitchToMinutes && !screenReader}
                                                    transitionSignal={transitionSignal}
                                                    selectMinutes={selectMinutes}
                                                    onFinish={finishDial}
                                                    theme={theme}
                                                    hourLabel={hourLabel}
                                                    minuteLabel={minuteLabel}
                                                    testID={testID}
                                                />
                                            </View>
                                        )}
                                        {displayMode === 'input' && inputTouched && !validInput && (
                                            <Text
                                                accessibilityLiveRegion="polite"
                                                style={[
                                                    theme.fonts.bodySmall,
                                                    { color: theme.colors.error, alignSelf: 'stretch', marginTop: 8 },
                                                ]}
                                                testID={`${testID}-error`}
                                                nativeID={`${testID}-error-text`}
                                            >
                                                {invalidTimeLabel}
                                            </Text>
                                        )}
                                    </ScrollView>
                                    <View style={[styles.actions, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
                                        <TouchableRipple
                                            borderless
                                            onPress={toggleMode}
                                            disabled={displayMode === 'input' && !dialFits}
                                            accessibilityRole="button"
                                            accessibilityLabel={displayMode === 'dial' ? keyboardModeLabel : dialModeLabel}
                                            style={[styles.toggle, { opacity: displayMode === 'input' && !dialFits ? 0.38 : 1 }]}
                                            testID={`${testID}-toggle-mode`}
                                        >
                                            <Icon
                                                source={displayMode === 'dial' ? 'keyboard-outline' : 'clock-outline'}
                                                size={24}
                                                color={theme.colors.onSurfaceVariant}
                                            />
                                        </TouchableRipple>
                                        <View
                                            style={[styles.actionButtons, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}
                                        >
                                            <View
                                                onLayout={(event) => {
                                                    const width = event.nativeEvent.layout.width;
                                                    setActionWidths((previous) =>
                                                        previous.cancel === width ? previous : { ...previous, cancel: width }
                                                    );
                                                }}
                                            >
                                                <Button onPress={dismiss} hitSlop={{ top: 4, bottom: 4 }} testID={`${testID}-cancel`}>
                                                    {cancelLabel}
                                                </Button>
                                            </View>
                                            <View
                                                onLayout={(event) => {
                                                    const width = event.nativeEvent.layout.width;
                                                    setActionWidths((previous) =>
                                                        previous.confirm === width ? previous : { ...previous, confirm: width }
                                                    );
                                                }}
                                            >
                                                <Button
                                                    onPress={confirm}
                                                    disabled={displayMode === 'input' && !validInput}
                                                    hitSlop={{ top: 4, bottom: 4 }}
                                                    testID={`${testID}-confirm`}
                                                >
                                                    {confirmLabel}
                                                </Button>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </Surface>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </GestureHandlerRootView>
            </Modal>
        </Portal>
    );
}

function TimeSelector({
    value,
    width = 96,
    accessibilityNumber,
    hours = false,
    is24Hour = false,
    selected,
    onPress,
    label,
    theme,
    testID,
}: {
    value: SharedValue<number>;
    width?: number;
    accessibilityNumber: number;
    hours?: boolean;
    is24Hour?: boolean;
    selected: boolean;
    onPress: () => void;
    label: string;
    theme: Theme;
    testID: string;
}) {
    const animatedProps = useAnimatedProps<React.ComponentProps<typeof TextInput> & { text: string }>(() => {
        const number = hours && !is24Hour ? value.get() % 12 || 12 : value.get();
        const text = number < 10 ? `0${number}` : `${number}`;
        return { text, defaultValue: text };
    });
    return (
        <TouchableRipple
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${twoDigits(accessibilityNumber)}`}
            accessibilityState={{ selected }}
            style={[
                styles.timeSelector,
                {
                    width,
                    backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surfaceContainerHighest,
                    borderRadius: theme.shapes.corner.small,
                },
            ]}
            testID={testID}
        >
            <AnimatedInput
                accessible={false}
                {...(Platform.OS === 'web' ? { 'aria-hidden': true, tabIndex: -1 } : {})}
                editable={false}
                caretHidden
                maxFontSizeMultiplier={1.3}
                underlineColorAndroid="transparent"
                pointerEvents="none"
                animatedProps={animatedProps}
                style={[
                    theme.fonts.displayLarge,
                    styles.digits,
                    { width, color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurface },
                ]}
            />
        </TouchableRipple>
    );
}

function TimeInputField({
    width,
    inputRef,
    value,
    onChange,
    selected,
    onFocus,
    onBlur,
    onSubmit,
    error,
    errorDescriptionID,
    hint,
    label,
    theme,
    returnKeyType,
    testID,
}: {
    width: number;
    inputRef: React.RefObject<React.ComponentRef<typeof TextInput> | null>;
    value: string;
    onChange: (value: string) => void;
    selected: boolean;
    onFocus: () => void;
    onBlur: () => void;
    onSubmit: () => void;
    error: boolean;
    errorDescriptionID: string;
    hint: string;
    label: string;
    theme: Theme;
    returnKeyType: 'next' | 'done';
    testID: string;
}) {
    return (
        <View style={{ width }}>
            <TextInput
                ref={inputRef}
                value={value}
                onChangeText={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                onSubmitEditing={onSubmit}
                returnKeyType={returnKeyType}
                submitBehavior={returnKeyType === 'next' ? 'submit' : 'blurAndSubmit'}
                inputMode="numeric"
                keyboardType="number-pad"
                maxLength={2}
                maxFontSizeMultiplier={1.3}
                selectTextOnFocus
                accessibilityLabel={label}
                accessibilityHint={error ? hint : undefined}
                {...(Platform.OS === 'web' && error ? { 'aria-invalid': true, 'aria-describedby': errorDescriptionID } : {})}
                underlineColorAndroid="transparent"
                selectionColor={theme.colors.primary}
                cursorColor={error ? theme.colors.error : theme.colors.primary}
                style={[
                    theme.fonts.displayMedium,
                    styles.inputDigits,
                    {
                        width,
                        backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surfaceContainerHighest,
                        color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                        borderColor: error ? theme.colors.error : selected ? theme.colors.primary : 'transparent',
                        borderWidth: 2,
                        borderRadius: theme.shapes.corner.small,
                    },
                ]}
                testID={testID}
            />
            <Text
                style={[
                    theme.fonts.bodySmall,
                    { color: error ? theme.colors.error : theme.colors.onSurfaceVariant, marginTop: 7, marginLeft: 0 },
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

function PeriodSelector({
    theme,
    pm,
    onChange,
    horizontal,
    input,
    testID,
}: {
    theme: Theme;
    pm: boolean;
    onChange: (pm: boolean) => void;
    horizontal: boolean;
    input: boolean;
    testID: string;
}) {
    return (
        <View
            accessibilityRole="radiogroup"
            accessibilityLabel="AM/PM"
            style={{
                width: horizontal ? 216 : 52,
                height: horizontal ? 38 : input ? 72 : 80,
                borderWidth: 1,
                borderColor: theme.colors.outline,
                borderRadius: theme.shapes.corner.small,
                overflow: 'hidden',
                flexDirection: horizontal ? 'row' : 'column',
            }}
        >
            {[false, true].map((item) => (
                <TouchableRipple
                    key={String(item)}
                    onPress={() => onChange(item)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: pm === item }}
                    accessibilityLabel={item ? 'PM' : 'AM'}
                    hitSlop={{ top: horizontal ? 5 : input ? 6 : 4, bottom: horizontal ? 5 : input ? 6 : 4 }}
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: pm === item ? theme.colors.tertiaryContainer : 'transparent',
                        borderTopWidth: !horizontal && item ? 1 : 0,
                        borderLeftWidth: horizontal && item ? 1 : 0,
                        borderColor: theme.colors.outline,
                    }}
                    testID={`${testID}-${item ? 'pm' : 'am'}`}
                >
                    <Text
                        numberOfLines={1}
                        maxFontSizeMultiplier={1.3}
                        style={[
                            theme.fonts.titleMedium,
                            { color: pm === item ? theme.colors.onTertiaryContainer : theme.colors.onSurfaceVariant },
                        ]}
                    >
                        {item ? 'PM' : 'AM'}
                    </Text>
                </TouchableRipple>
            ))}
        </View>
    );
}

function nearestAngle(target: number, current: number) {
    'worklet';
    return current + ((target - current + 540) % 360) - 180;
}

function ClockDial({
    hours,
    minutes,
    draft,
    selection,
    selectionRequest,
    getSelectionRequest,
    is24Hour,
    autoSwitch,
    transitionSignal,
    selectMinutes,
    onFinish,
    theme,
    hourLabel,
    minuteLabel,
    testID,
}: {
    hours: SharedValue<number>;
    minutes: SharedValue<number>;
    draft: TimeValue;
    selection: 'hours' | 'minutes';
    selectionRequest: number;
    getSelectionRequest: () => number;
    is24Hour: boolean;
    autoSwitch: boolean;
    transitionSignal: SharedValue<number>;
    selectMinutes: () => void;
    onFinish: (hours: number, minutes: number) => void;
    theme: Theme;
    hourLabel: string;
    minuteLabel: string;
    testID: string;
}) {
    const [mounted, setMounted] = useState(false);
    const angle = useSharedValue(selection === 'hours' ? (draft.hours % 12) * 30 : draft.minutes * 6);
    const radius = useSharedValue(selection === 'hours' && is24Hour && draft.hours >= 12 ? 69 : 101);
    const dragging = useSharedValue(false);
    const moved = useSharedValue(false);
    const revision = useSharedValue(0),
        uiCommand = useSharedValue(0);
    const command = useRef(0),
        alive = useRef(true);
    const motion = theme.motion.spring.default.spatial;
    const effects = theme.motion.spring.default.effects;
    // Paper resolves auto/on/off; avoid a second, contradictory OS decision in Reanimated.
    const spring = {
        stiffness: motion.stiffness,
        damping: motion.damping * 2 * Math.sqrt(motion.stiffness),
        mass: 1,
        overshootClamping: true,
        reduceMotion: ReduceMotion.Never,
    };
    useEffect(() => {
        alive.current = true;
        setMounted(true);
        return () => {
            alive.current = false;
            command.current += 1;
            scheduleOnUI(() => {
                'worklet';
                revision.set(revision.get() + 1);
                cancelAnimation(transitionSignal);
                cancelAnimation(angle);
                cancelAnimation(radius);
            });
        };
    }, [angle, radius, revision, transitionSignal]);
    const moveTo = (nextAngle: number, nextRadius: number) => {
        'worklet';
        const target = nearestAngle(nextAngle, angle.get());
        angle.set(theme.animation.scale ? withSpring(target, spring) : target);
        radius.set(theme.animation.scale ? withSpring(nextRadius, spring) : nextRadius);
    };
    useEffect(() => {
        const nextCommand = ++command.current;
        // Entering from keyboard queues shared-value writes. Read them inside
        // this UI transaction, after those writes, rather than from RN's cache.
        scheduleOnUI((token: number) => {
            'worklet';
            uiCommand.set(token);
            revision.set(revision.get() + 1);
            cancelAnimation(transitionSignal);
            moveTo(
                selection === 'hours' ? (hours.get() % 12) * 30 : minutes.get() * 6,
                selection === 'hours' && is24Hour && hours.get() >= 12 ? 69 : 101
            );
            // A face change can overtake an already queued gesture notification.
            // Publish the current UI time again under the new interaction token.
            scheduleOnRN(finishIfCurrent, hours.get(), minutes.get(), revision.get(), token);
        }, nextCommand);
    }, [selection, selectionRequest, is24Hour, theme]);
    const finishIfCurrent = (nextHours: number, nextMinutes: number, token: number, rnToken: number) => {
        if (alive.current && getSelectionRequest() === selectionRequest && command.current === rnToken && revision.get() === token)
            onFinish(nextHours, nextMinutes);
    };
    const switchIfCurrent = (token: number, rnToken: number) => {
        if (alive.current && getSelectionRequest() === selectionRequest && command.current === rnToken && revision.get() === token)
            selectMinutes();
    };
    const queueMinutes = (token: number, rnToken: number) => {
        'worklet';
        if (selection !== 'hours' || !autoSwitch) return;
        transitionSignal.set(0);
        transitionSignal.set(
            withDelay(
                100 * theme.animation.scale,
                withTiming(1, { duration: 0, reduceMotion: ReduceMotion.Never }, (finished) => {
                    if (finished && revision.get() === token) scheduleOnRN(switchIfCurrent, token, rnToken);
                }),
                ReduceMotion.Never
            )
        );
    };
    const update = (x: number, y: number, minuteSnap: boolean, trackFinger: boolean) => {
        'worklet';
        const dx = x - 128;
        const dy = y - 128;
        if (Math.hypot(dx, dy) < 8) return;
        const degrees = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
        if (selection === 'hours') {
            const clockHour = Math.round(degrees / 30) % 12;
            const inner = is24Hour && Math.hypot(dx, dy) < 74;
            hours.set(clockHour + (is24Hour ? (inner ? 12 : 0) : hours.get() >= 12 ? 12 : 0));
            if (trackFinger) radius.set(inner ? 69 : 101);
        } else minutes.set(minuteSnap ? (Math.round(degrees / 30) % 12) * 5 : Math.round(degrees / 6) % 60);
        if (trackFinger) angle.set(nearestAngle(degrees, angle.get()));
    };
    const pan = usePanGesture({
        minDistance: 0,
        maxPointers: 1,
        onActivate: (event) => {
            'worklet';
            // On web, Gesture Handler also synthesizes a pan from Enter/Space.
            // The focused numeral handles those keys directly.
            if (isWeb && event.pointerType === PointerType.KEY) return;
            cancelAnimation(transitionSignal);
            revision.set(revision.get() + 1);
            cancelAnimation(angle);
            dragging.set(true);
            moved.set(false);
            update(event.x, event.y, true, false);
        },
        onUpdate: (event) => {
            'worklet';
            if (!dragging.get()) return;
            if (Math.hypot(event.translationX, event.translationY) > 8) moved.set(true);
            update(event.x, event.y, !moved.get(), moved.get());
        },
        onFinalize: (event) => {
            'worklet';
            if (!dragging.get()) return;
            if (!event.canceled) update(event.x, event.y, !moved.get(), moved.get());
            moveTo(
                selection === 'hours' ? (hours.get() % 12) * 30 : minutes.get() * 6,
                selection === 'hours' && is24Hour && hours.get() >= 12 ? 69 : 101
            );
            const token = revision.get(),
                rnToken = uiCommand.get();
            scheduleOnRN(finishIfCurrent, hours.get(), minutes.get(), token, rnToken);
            dragging.set(false);
            if (!event.canceled && selection === 'hours' && autoSwitch) {
                // Compose waits100ms; a new edit invalidates even an already queued notification.
                queueMinutes(token, rnToken);
            }
        },
    });
    const hand = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.get()}deg` }] }));
    const line = useAnimatedStyle(() => ({ height: Math.max(0, radius.get() - 24), transform: [{ translateY: -(radius.get() - 24) }] }));
    const selector = useAnimatedStyle(() => ({ transform: [{ translateY: -radius.get() }] }));
    const clip = useAnimatedProps(() => ({
        cx: 128 + Math.sin((angle.get() * Math.PI) / 180) * radius.get(),
        cy: 128 - Math.cos((angle.get() * Math.PI) / 180) * radius.get(),
    }));
    const choose = (number: number, inner: boolean, advance: boolean) => {
        // A numeral is a Paper press on the RN thread. Shared-value writes are
        // queued for UI, so publish the calculated selection rather than reading
        // back the previous value immediately after .set().
        if (!alive.current) return;
        const nextHours = selection === 'hours' ? (is24Hour ? number : (number % 12) + (draft.hours >= 12 ? 12 : 0)) : draft.hours;
        const nextMinutes = selection === 'minutes' ? number : draft.minutes;
        const nextCommand = ++command.current;
        scheduleOnUI(
            (rnToken: number, hour: number, minute: number, targetAngle: number, targetRadius: number, advance: boolean) => {
                'worklet';
                uiCommand.set(rnToken);
                revision.set(revision.get() + 1);
                cancelAnimation(transitionSignal);
                hours.set(hour);
                minutes.set(minute);
                moveTo(targetAngle, targetRadius);
                if (advance) queueMinutes(revision.get(), rnToken);
            },
            nextCommand,
            nextHours,
            nextMinutes,
            selection === 'hours' ? (number % 12) * 30 : number * 6,
            inner ? 69 : 101,
            advance
        );
        onFinish(nextHours, nextMinutes);
    };
    const numbers =
        selection === 'minutes'
            ? Array.from({ length: 12 }, (_, i) => i * 5)
            : Array.from({ length: is24Hour ? 24 : 12 }, (_, i) => (is24Hour ? i : i || 12));
    const positions = numbers.map((number, index) => {
        const inner = selection === 'hours' && is24Hour && index >= 12;
        const radians = ((index % 12) * Math.PI) / 6;
        return { number, inner, x: 128 + Math.sin(radians) * (inner ? 69 : 101), y: 128 - Math.cos(radians) * (inner ? 69 : 101) };
    });
    const clipID = `${testID}-${selection}-selected-labels`.replace(/[^a-zA-Z0-9_-]/g, '-');
    const glyphs = positions.map(({ number, x, y }) => (
        <SvgText
            key={number}
            x={x}
            y={y}
            textAnchor="middle"
            alignmentBaseline="central"
            fontFamily={theme.fonts.bodyLarge.fontFamily}
            fontSize={16}
        >
            {number === 0 ? '00' : number}
        </SvgText>
    ));
    return (
        <GestureDetector gesture={pan}>
            <Animated.View
                collapsable={false}
                style={[styles.dial, { backgroundColor: theme.colors.surfaceContainerHighest }]}
                testID={`${testID}-dial`}
            >
                <Animated.View pointerEvents="none" style={[styles.hand, hand]}>
                    <Animated.View style={[styles.handLine, { backgroundColor: theme.colors.primary }, line]} />
                    <Animated.View style={[styles.selector, { backgroundColor: theme.colors.primary }, selector]} />
                </Animated.View>
                <View pointerEvents="none" style={[styles.centerDot, { backgroundColor: theme.colors.primary }]} />
                <Animated.View
                    key={selection}
                    pointerEvents="box-none"
                    style={StyleSheet.absoluteFill}
                    entering={
                        mounted && theme.animation.scale
                            ? FadeIn.reduceMotion(ReduceMotion.Never)
                                  .springify()
                                  .stiffness(effects.stiffness)
                                  .damping(effects.damping * 2 * Math.sqrt(effects.stiffness))
                                  .mass(1)
                                  .overshootClamping(1)
                            : undefined
                    }
                    exiting={
                        theme.animation.scale
                            ? FadeOut.reduceMotion(ReduceMotion.Never)
                                  .springify()
                                  .stiffness(effects.stiffness)
                                  .damping(effects.damping * 2 * Math.sqrt(effects.stiffness))
                                  .mass(1)
                                  .overshootClamping(1)
                            : undefined
                    }
                >
                    <Svg pointerEvents="none" width={256} height={256} style={StyleSheet.absoluteFill} accessible={false}>
                        <Defs>
                            <ClipPath id={clipID}>
                                <AnimatedCircle animatedProps={clip} r={24} />
                            </ClipPath>
                        </Defs>
                        <G fill={theme.colors.onSurface}>{glyphs}</G>
                        <G fill={theme.colors.onPrimary} clipPath={`url(#${clipID})`}>
                            {glyphs}
                        </G>
                    </Svg>
                    {positions.map(({ number, inner, x, y }) => (
                        <TouchableRipple
                            key={`${selection}-${number}`}
                            onPress={(event) => {
                                if (Platform.OS !== 'web') {
                                    choose(number, inner, true);
                                    return;
                                }
                                const detail = (event.nativeEvent as { detail?: number }).detail;
                                const pointer = (detail ?? 0) > 0;
                                // The browser may click the numeral where a drag started.
                                if (!pointer || !moved.get()) choose(number, inner, pointer);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`${number} ${selection === 'hours' ? hourLabel : minuteLabel}`}
                            accessibilityState={{
                                selected:
                                    selection === 'hours'
                                        ? is24Hour
                                            ? draft.hours === number
                                            : draft.hours % 12 === number % 12
                                        : draft.minutes === number,
                            }}
                            borderless
                            style={[styles.dialNumber, { left: x - 24, top: y - 24 }]}
                            testID={`${testID}-dial-${selection}-${number}`}
                        >
                            <View />
                        </TouchableRipple>
                    ))}
                </Animated.View>
                {selection === 'minutes' && <MinuteDot angle={angle} radius={radius} minutes={minutes} theme={theme} />}
            </Animated.View>
        </GestureDetector>
    );
}

function MinuteDot({
    angle,
    radius,
    minutes,
    theme,
}: {
    angle: SharedValue<number>;
    radius: SharedValue<number>;
    minutes: SharedValue<number>;
    theme: Theme;
}) {
    const style = useAnimatedStyle(() => {
        const radians = (angle.get() * Math.PI) / 180;
        return {
            opacity: minutes.get() % 5 ? 1 : 0,
            transform: [{ translateX: Math.sin(radians) * radius.get() }, { translateY: -Math.cos(radians) * radius.get() }],
        };
    });
    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.centerDot,
                { width: 4, height: 4, marginLeft: -2, marginTop: -2, backgroundColor: theme.colors.onPrimary },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    title: { paddingHorizontal: 24, paddingTop: 24, marginBottom: 20, fontSize: 12, lineHeight: 16 },
    body: { paddingHorizontal: 24, alignItems: 'center' },
    landscape: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 24 },
    landscapeTitle: { position: 'absolute', top: 0, start: 0, fontSize: 12, lineHeight: 16 },
    numbers: { flexDirection: 'row', alignItems: 'flex-start', direction: 'ltr' },
    display: { flexDirection: 'row', alignItems: 'flex-start', direction: 'ltr' },
    timeSelector: { width: 96, height: 80, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    digits: { width: 96, height: 80, padding: 0, margin: 0, textAlign: 'center', fontSize: 57, lineHeight: 64 },
    separatorSlot: { width: 24, alignItems: 'center', justifyContent: 'center' },
    separator: { width: 24, padding: 0, textAlign: 'center', fontSize: 57, lineHeight: 64 },
    inputSeparator: { fontSize: 45, lineHeight: 52 },
    inputDigits: { height: 72, padding: 0, textAlign: 'center', fontSize: 45, lineHeight: 52 },
    actions: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        paddingTop: 8,
        flexDirection: 'row',
        alignItems: 'flex-end',
        direction: 'ltr',
        gap: 8,
    },
    actionButtons: {
        flex: 1,
        minWidth: 0,
        direction: 'ltr',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        gap: 8,
    },
    toggle: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
    dial: { width: 256, height: 256, borderRadius: 128, direction: 'ltr' },
    hand: { position: 'absolute', left: 128, top: 128, width: 0, height: 0 },
    handLine: { position: 'absolute', left: -1, top: 0, width: 2 },
    selector: { position: 'absolute', left: -24, top: -24, width: 48, height: 48, borderRadius: 24 },
    centerDot: { position: 'absolute', left: '50%', top: '50%', marginLeft: -4, marginTop: -4, width: 8, height: 8, borderRadius: 4 },
    dialNumber: { position: 'absolute', width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
});
