import { getScrollIndicatorProps, type ScrollIndicatorOptions } from '../scroll-indicators';
import { NativeModal as Modal } from '../native-modal';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Surface } from 'react-native-paper';
import { TextField, type TextFieldHandle } from './text-field';
import Animated, {
    cancelAnimation,
    ReduceMotion,
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Button } from '../primitives';
import { IconButton } from '../primitives';
import { Text } from '../primitives';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobileTheme } from '../core';

import { DatePickerMonths } from './date-picker-months';
import { DatePickerCalendar } from './date-picker-calendar';
import {
    calendarDate,
    clampCalendarMonth,
    dateKey,
    formatDateInput,
    getDateError,
    getDateRangeError,
    normalizeDate,
    parseDateInput,
    type DateConstraints,
    type DateRange,
} from './date-picker-utils';

export type { DateRange } from './date-picker-utils';

type CommonProps = DateConstraints & {
    /** Scrollbars are opt-in for this component only; both axes are hidden by default. */
    scrollIndicators?: ScrollIndicatorOptions;
    visible: boolean;
    onDismiss: () => void;
    presentation?: 'dialog' | 'full-screen';
    initialCalendarView?: 'days' | 'years';
    showClearButton?: boolean;
    initialDisplayMode?: 'calendar' | 'input';
    locale?: string;
    firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    testID?: string;
};

/** Dates are local calendar dates; defaults allow 1900–2100. Changes commit only on confirmation. */
export type DatePickerProps = CommonProps &
    (
        | { mode?: 'single'; value?: Date; onChange: (date: Date) => void }
        | { mode: 'range'; value?: DateRange; onChange: (range: DateRange) => void }
    );

function DatePickerContent(props: DatePickerProps & { onHidden: (revision: number) => void; getTransitionRevision: () => number }) {
    const {
        onDismiss,
        onHidden,
        getTransitionRevision,
        visible,
        initialDisplayMode = 'calendar',
        locale = 'es-MX',
        firstDayOfWeek = 0,
        confirmLabel = 'Aceptar',
        cancelLabel = 'Cancelar',
        testID = 'date-picker',
    } = props;
    const theme = useMobileTheme();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const moving = theme.animation.scale !== 0;
    const calendarFits = window.width - insets.left - insets.right >= 360;
    const minimumDate = props.minimumDate ?? calendarDate(1900, 0, 1);
    const maximumDate = props.maximumDate ?? calendarDate(2100, 11, 31);
    if (Number.isNaN(minimumDate.getTime()) || Number.isNaN(maximumDate.getTime()) || dateKey(minimumDate) > dateKey(maximumDate))
        throw new Error('DatePicker requiere límites de fecha válidos y ordenados.');
    const constraints = { minimumDate, maximumDate, isDateDisabled: props.isDateDisabled };
    const suppliedStart = props.mode === 'range' ? props.value?.start : props.value;
    const suppliedEnd = props.mode === 'range' ? props.value?.end : undefined;
    const initialStart = suppliedStart && !Number.isNaN(suppliedStart.getTime()) ? suppliedStart : undefined;
    const initialEnd = suppliedEnd && !Number.isNaN(suppliedEnd.getTime()) ? suppliedEnd : undefined;
    const [draftStart, setDraftStart] = useState(initialStart ? normalizeDate(initialStart) : undefined);
    const [draftEnd, setDraftEnd] = useState(initialEnd ? normalizeDate(initialEnd) : undefined);
    const [month, setMonth] = useState(() => clampCalendarMonth(initialStart ?? new Date(), minimumDate, maximumDate));
    const [displayMode, setDisplayMode] = useState(calendarFits ? initialDisplayMode : 'input');
    const [startInput, setStartInput] = useState(formatDateInput(initialStart));
    const [endInput, setEndInput] = useState(formatDateInput(initialEnd));
    const [startTouched, setStartTouched] = useState(false);
    const [endTouched, setEndTouched] = useState(false);
    const [keyboardTop, setKeyboardTop] = useState<number>();
    const [session, setSession] = useState(0);
    const wasVisible = useRef(visible);
    const pendingCalendar = useRef(false);
    const isRange = props.mode === 'range';
    const fullScreen = props.presentation === 'full-screen';
    const verticalRange = isRange && displayMode === 'calendar';
    const start = displayMode === 'input' ? parseDateInput(startInput) : draftStart;
    const end = displayMode === 'input' ? parseDateInput(endInput) : draftEnd;
    const startError = start ? getDateError(start, constraints) : 'Ingresa una fecha válida con formato dd/mm/aaaa.';
    const endError = end ? getDateError(end, constraints) : 'Ingresa una fecha válida con formato dd/mm/aaaa.';
    const showStartError = (startTouched || startInput.replace(/\D/g, '').length >= 8) && Boolean(startError);
    const showEndError = (endTouched || endInput.replace(/\D/g, '').length >= 8) && Boolean(endError);
    const selectionError = start && isRange && end ? getDateRangeError({ start, end }, constraints) : start ? startError : undefined;
    const visibleSelectionError =
        displayMode === 'calendar' || (isRange && start && end && !startError && !endError) ? selectionError : undefined;
    const canConfirm = Boolean(start && !startError && (!isRange || (end && !endError && !selectionError)));
    const headlineFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
    const headline = isRange
        ? `${start ? headlineFormat.format(start) : 'Inicio'} – ${end ? headlineFormat.format(end) : 'Fin'}`
        : start
          ? new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(start)
          : displayMode === 'input'
            ? 'Ingresa la fecha'
            : 'Selecciona fecha';
    const availableHeight = Math.min(window.height, keyboardTop ?? window.height) - insets.top - insets.bottom - (fullScreen ? 0 : 32);
    const compactInput = displayMode === 'input' && availableHeight < 270;
    const headerHeight = isRange ? 128 : 120;
    const calendarHeight = availableHeight - headerHeight - (fullScreen ? 64 : 60);
    const progress = useSharedValue(0);
    const closing = useRef(false);
    const endInputRef = useRef<TextFieldHandle>(null);
    const focusEndInput = () => {
        const input = endInputRef.current;
        if (input && typeof input.focus === 'function') input.focus();
    };
    useLayoutEffect(() => {
        if (visible && !wasVisible.current) {
            // A controlled caller can reopen before the old fade has finished.
            // Start a new draft even though its native modal is still mounted.
            setDraftStart(initialStart ? normalizeDate(initialStart) : undefined);
            setDraftEnd(initialEnd ? normalizeDate(initialEnd) : undefined);
            setStartInput(formatDateInput(initialStart));
            setEndInput(formatDateInput(initialEnd));
            setStartTouched(false);
            setEndTouched(false);
            setMonth(clampCalendarMonth(initialStart ?? new Date(), minimumDate, maximumDate));
            setDisplayMode(calendarFits ? initialDisplayMode : 'input');
            pendingCalendar.current = false;
            setSession((current) => current + 1);
        }
        wasVisible.current = visible;
    }, [visible, initialStart, initialEnd, initialDisplayMode, minimumDate, maximumDate, calendarFits]);
    useEffect(() => {
        const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (event) =>
            setKeyboardTop(event.endCoordinates.screenY)
        );
        const hide = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardTop(undefined);
            if (pendingCalendar.current) {
                pendingCalendar.current = false;
                setDisplayMode('calendar');
            }
        });
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);
    useEffect(() => {
        // Keep the native modal mounted during the same 220ms fade as Paper Modal.
        // The controlled visible prop also works when a caller closes it externally.
        closing.current = !visible;
        if (!visible) Keyboard.dismiss();
        const revision = getTransitionRevision();
        progress.set(
            withTiming(
                visible ? 1 : 0,
                { reduceMotion: ReduceMotion.Never, duration: 220 * theme.animation.scale, easing: Easing.out(Easing.cubic) },
                (finished) => {
                    if (finished && !visible) scheduleOnRN(onHidden, revision);
                }
            )
        );
        return () => cancelAnimation(progress);
    }, [visible, onHidden, getTransitionRevision, progress, theme.animation.scale]);
    const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.get() * 0.32 }));
    const containerStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
    const dismiss = () => {
        if (closing.current) return;
        closing.current = true;
        Keyboard.dismiss();
        // Like Paper, request the controlled state change immediately; the fade
        // completes separately instead of delaying application callbacks.
        onDismiss();
    };
    const selectDate = (date: Date) => {
        if (!isRange || !draftStart || draftEnd || dateKey(date) < dateKey(draftStart)) {
            setDraftStart(date);
            setDraftEnd(undefined);
        } else setDraftEnd(date);
    };
    useEffect(() => {
        if (!visible || calendarFits || displayMode !== 'calendar') return;
        setStartInput(formatDateInput(draftStart));
        setEndInput(formatDateInput(draftEnd));
        pendingCalendar.current = false;
        setDisplayMode('input');
    }, [calendarFits, displayMode, draftStart, draftEnd, visible]);
    const toggleDisplayMode = () => {
        if (displayMode === 'input' && !calendarFits) return;
        Keyboard.dismiss();
        if (displayMode === 'calendar') {
            setStartInput(formatDateInput(draftStart));
            setEndInput(formatDateInput(draftEnd));
            setStartTouched(false);
            setEndTouched(false);
            setDisplayMode('input');
        } else {
            setDraftStart(start);
            setDraftEnd(end);
            if (start && (!draftStart || dateKey(start) !== dateKey(draftStart)))
                setMonth(clampCalendarMonth(start, minimumDate, maximumDate));
            if (keyboardTop !== undefined && Keyboard.isVisible()) pendingCalendar.current = true;
            else setDisplayMode('calendar');
        }
    };
    const confirm = () => {
        if (!canConfirm || !start || closing.current) return;
        if (props.mode === 'range') {
            if (!end) return;
            props.onChange({ start: normalizeDate(start), end: normalizeDate(end) });
        } else props.onChange(normalizeDate(start));
        dismiss();
    };
    const clear = () => {
        setDraftStart(undefined);
        setDraftEnd(undefined);
        setStartInput('');
        setEndInput('');
        setStartTouched(false);
        setEndTouched(false);
    };

    return (
        <Modal animationType="none" onRequestClose={dismiss} presentationStyle="overFullScreen" transparent visible>
            <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.scrim }, scrimStyle]}>
                {Platform.OS === 'web' ? (
                    // A click-only scrim stays out of the modal focus trap.
                    <View
                        aria-hidden
                        {...{ onClick: props.visible ? dismiss : undefined }}
                        style={StyleSheet.absoluteFill}
                        testID={`${testID}-backdrop`}
                    />
                ) : (
                    <Pressable
                        accessible={false}
                        disabled={!props.visible}
                        onPress={dismiss}
                        style={StyleSheet.absoluteFill}
                        testID={`${testID}-backdrop`}
                    />
                )}
            </Animated.View>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                pointerEvents="box-none"
                style={[
                    styles.overlay,
                    { paddingTop: fullScreen ? 0 : insets.top + 16, paddingBottom: fullScreen ? 0 : insets.bottom + 16 },
                    fullScreen && { paddingHorizontal: 0 },
                ]}
            >
                <Animated.View
                    accessibilityElementsHidden={!props.visible}
                    importantForAccessibility={props.visible ? 'auto' : 'no-hide-descendants'}
                    pointerEvents={props.visible ? 'auto' : 'none'}
                    style={[
                        styles.frame,
                        containerStyle,
                        verticalRange && !fullScreen && { height: Math.min(600, availableHeight) },
                        fullScreen && { flex: 1, maxWidth: '100%' },
                    ]}
                >
                    <Surface
                        mode="flat"
                        elevation={fullScreen ? theme.elevation.level0 : theme.elevation.level3}
                        style={{
                            width: '100%',
                            flexShrink: 1,
                            ...(verticalRange || fullScreen ? { flex: 1 } : {}),
                            borderRadius: fullScreen ? 0 : theme.shapes.corner.extraLarge,
                            backgroundColor: theme.colors.surfaceContainerHigh,
                        }}
                    >
                        <View
                            accessibilityViewIsModal
                            onAccessibilityEscape={dismiss}
                            style={[
                                styles.container,
                                fullScreen && { paddingTop: insets.top, paddingBottom: insets.bottom, flex: 1 },
                                verticalRange && { flex: 1 },
                                { borderRadius: fullScreen ? 0 : theme.shapes.corner.extraLarge },
                            ]}
                            testID={testID}
                        >
                            {fullScreen ? (
                                <View style={styles.fullScreenToolbar}>
                                    <IconButton
                                        accessibilityLabel="Cerrar selector de fechas"
                                        icon="close"
                                        onPress={dismiss}
                                        style={{ width: 48, height: 48, margin: 0 }}
                                        testID={`${testID}-close`}
                                    />
                                    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
                                        {compactInput ? (
                                            <IconButton
                                                accessibilityLabel="Mostrar calendario"
                                                icon="calendar-outline"
                                                disabled={displayMode === 'input' && !calendarFits}
                                                onPress={toggleDisplayMode}
                                                style={{ height: 48, width: 48, margin: 0 }}
                                                testID={`${testID}-input-toggle`}
                                            />
                                        ) : null}
                                        <Button
                                            contentStyle={{ minHeight: 40 }}
                                            disabled={!canConfirm}
                                            variant="text"
                                            onPress={confirm}
                                            testID={`${testID}-confirm`}
                                        >
                                            {props.confirmLabel ?? 'Guardar'}
                                        </Button>
                                    </View>
                                </View>
                            ) : null}
                            {!compactInput ? (
                                <View style={[styles.header, { minHeight: headerHeight, borderBottomColor: theme.colors.outlineVariant }]}>
                                    <Text accessibilityRole="header" style={{ color: theme.colors.onSurfaceVariant }} variant="labelLarge">
                                        {props.title ??
                                            (displayMode === 'input'
                                                ? isRange
                                                    ? 'Ingresa un periodo'
                                                    : 'Ingresa una fecha'
                                                : isRange
                                                  ? 'Selecciona un periodo'
                                                  : 'Selecciona una fecha')}
                                    </Text>
                                    <View style={styles.headline}>
                                        <Text
                                            accessibilityLiveRegion="polite"
                                            style={{ flex: 1, color: theme.colors.onSurfaceVariant }}
                                            maxFontSizeMultiplier={1.4}
                                            testID={`${testID}-headline`}
                                            variant={isRange ? 'titleLarge' : 'headlineLarge'}
                                        >
                                            {headline}
                                        </Text>
                                        <IconButton
                                            accessibilityLabel={displayMode === 'calendar' ? 'Escribir fecha' : 'Mostrar calendario'}
                                            icon={displayMode === 'calendar' ? 'pencil-outline' : 'calendar-outline'}
                                            disabled={displayMode === 'input' && !calendarFits}
                                            onPress={toggleDisplayMode}
                                            style={{ width: 48, height: 48, margin: 0 }}
                                            testID={`${testID}-input-toggle`}
                                        />
                                    </View>
                                </View>
                            ) : (
                                <Text
                                    accessibilityRole="header"
                                    maxFontSizeMultiplier={1.4}
                                    style={{ paddingHorizontal: 24, paddingTop: 12, color: theme.colors.onSurfaceVariant }}
                                    variant="labelLarge"
                                >
                                    {props.title ?? (isRange ? 'Ingresa un periodo' : 'Ingresa una fecha')}
                                </Text>
                            )}
                            {verticalRange ? (
                                <DatePickerMonths
                                    scrollIndicators={props.scrollIndicators}
                                    {...constraints}
                                    key={session}
                                    month={month}
                                    onMonthChange={setMonth}
                                    onSelect={selectDate}
                                    start={start}
                                    end={end}
                                    locale={locale}
                                    firstDayOfWeek={firstDayOfWeek}
                                    testID={testID}
                                />
                            ) : displayMode === 'calendar' ? (
                                <View style={{ maxWidth: 360, width: '100%', alignSelf: 'center', flexShrink: 1 }}>
                                    <DatePickerCalendar
                                        scrollIndicators={props.scrollIndicators}
                                        {...constraints}
                                        key={session}
                                        maximumHeight={calendarHeight}
                                        initialView={props.initialCalendarView}
                                        firstDayOfWeek={firstDayOfWeek}
                                        locale={locale}
                                        month={month}
                                        onMonthChange={setMonth}
                                        onSelect={selectDate}
                                        start={start}
                                        testID={testID}
                                    />
                                </View>
                            ) : (
                                <ScrollView
                                    contentContainerStyle={{ paddingBottom: 8 }}
                                    keyboardShouldPersistTaps="handled"
                                    style={{ flexGrow: 0, flexShrink: 1 }}
                                    {...getScrollIndicatorProps(props.scrollIndicators)}
                                >
                                    <Animated.View
                                        key={session}
                                        entering={FadeIn.duration(moving ? theme.motion.duration.short3 : 0).reduceMotion(
                                            ReduceMotion.Never
                                        )}
                                        style={[
                                            styles.inputs,
                                            compactInput && { paddingTop: 12 },
                                            isRange && window.fontScale <= 1.3 && { flexDirection: 'row' },
                                        ]}
                                    >
                                        <View style={{ flex: 1, gap: 4 }}>
                                            <TextField
                                                variant="outlined"
                                                accessibilityHint="Formato día, mes y año, por ejemplo 24/10/2026"
                                                autoFocus
                                                error={showStartError}
                                                keyboardType="numbers-and-punctuation"
                                                label={isRange ? 'Fecha inicial' : 'Fecha'}
                                                maxLength={24}
                                                onBlur={() => {
                                                    setStartTouched(true);
                                                    const parsed = parseDateInput(startInput);
                                                    if (parsed) setStartInput(formatDateInput(parsed));
                                                }}
                                                onChangeText={setStartInput}
                                                onSubmitEditing={isRange ? focusEndInput : confirm}
                                                placeholder="dd/mm/aaaa"
                                                returnKeyType={isRange ? 'next' : 'done'}
                                                submitBehavior={isRange ? 'submit' : 'blurAndSubmit'}
                                                testID={`${testID}-start-input`}
                                                value={startInput}
                                            />
                                            <Text
                                                accessibilityLiveRegion="polite"
                                                style={{
                                                    color: showStartError ? theme.colors.error : theme.colors.onSurfaceVariant,
                                                    paddingHorizontal: 16,
                                                }}
                                                variant="bodySmall"
                                            >
                                                {showStartError ? startError : 'Día / mes / año'}
                                            </Text>
                                        </View>
                                        {isRange ? (
                                            <View style={{ flex: 1, gap: 4 }}>
                                                <TextField
                                                    variant="outlined"
                                                    accessibilityHint="Formato día, mes y año. Igual o posterior a la fecha inicial"
                                                    error={showEndError}
                                                    keyboardType="numbers-and-punctuation"
                                                    label="Fecha final"
                                                    maxLength={24}
                                                    onBlur={() => {
                                                        setEndTouched(true);
                                                        const parsed = parseDateInput(endInput);
                                                        if (parsed) setEndInput(formatDateInput(parsed));
                                                    }}
                                                    onChangeText={setEndInput}
                                                    onSubmitEditing={confirm}
                                                    placeholder="dd/mm/aaaa"
                                                    ref={endInputRef}
                                                    returnKeyType="done"
                                                    testID={`${testID}-end-input`}
                                                    value={endInput}
                                                />
                                                <Text
                                                    accessibilityLiveRegion="polite"
                                                    style={{
                                                        color: showEndError ? theme.colors.error : theme.colors.onSurfaceVariant,
                                                        paddingHorizontal: 16,
                                                    }}
                                                    variant="bodySmall"
                                                >
                                                    {showEndError ? endError : 'Día / mes / año'}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </Animated.View>
                                    {compactInput && props.showClearButton ? (
                                        <Button
                                            compact
                                            variant="text"
                                            onPress={clear}
                                            style={{ alignSelf: 'flex-start', marginStart: 16 }}
                                            testID={`${testID}-clear`}
                                        >
                                            Limpiar selección
                                        </Button>
                                    ) : null}
                                </ScrollView>
                            )}
                            {visibleSelectionError ? (
                                <Text
                                    accessibilityLiveRegion="polite"
                                    style={{ color: theme.colors.error, paddingHorizontal: 24, paddingTop: 8 }}
                                    variant="bodySmall"
                                >
                                    {visibleSelectionError}
                                </Text>
                            ) : null}
                            {props.showClearButton && fullScreen && !compactInput ? (
                                <Button variant="text" style={{ alignSelf: 'flex-start' }} onPress={clear} testID={`${testID}-clear`}>
                                    Limpiar selección
                                </Button>
                            ) : null}
                            {!fullScreen ? (
                                <View style={styles.actions}>
                                    {compactInput ? (
                                        <IconButton
                                            accessibilityLabel="Mostrar calendario"
                                            icon="calendar-outline"
                                            disabled={displayMode === 'input' && !calendarFits}
                                            onPress={toggleDisplayMode}
                                            style={{ height: 48, width: 48, margin: 0, marginEnd: 'auto' }}
                                            testID={`${testID}-input-toggle`}
                                        />
                                    ) : null}
                                    {props.showClearButton && !compactInput ? (
                                        <Button
                                            contentStyle={{ minHeight: 40 }}
                                            variant="text"
                                            onPress={clear}
                                            style={{ marginEnd: 'auto' }}
                                            testID={`${testID}-clear`}
                                        >
                                            Limpiar
                                        </Button>
                                    ) : null}
                                    <Button
                                        compact={compactInput}
                                        contentStyle={{ minHeight: 40 }}
                                        maxFontSizeMultiplier={compactInput ? 1.6 : undefined}
                                        variant="text"
                                        onPress={dismiss}
                                        testID={`${testID}-cancel`}
                                    >
                                        {cancelLabel}
                                    </Button>
                                    <Button
                                        compact={compactInput}
                                        contentStyle={{ minHeight: 40 }}
                                        disabled={!canConfirm}
                                        maxFontSizeMultiplier={compactInput ? 1.6 : undefined}
                                        variant="text"
                                        onPress={confirm}
                                        testID={`${testID}-confirm`}
                                    >
                                        {confirmLabel}
                                    </Button>
                                </View>
                            ) : null}
                        </View>
                    </Surface>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

/** Keep this component mounted and control visible, as with Paper's Modal. */
export function DatePicker(props: DatePickerProps) {
    const [present, setPresent] = useState(props.visible);
    const latestVisibility = useRef(props.visible);
    const transitionRevision = useRef(0);
    const disposed = useRef(false);
    useEffect(() => {
        disposed.current = false;
        return () => {
            disposed.current = true;
            transitionRevision.current += 1;
        };
    }, []);
    useLayoutEffect(() => {
        latestVisibility.current = props.visible;
        transitionRevision.current += 1;
        if (props.visible) setPresent(true);
    }, [props.visible, props.mode]);
    const getTransitionRevision = useCallback(() => transitionRevision.current, []);
    const onHidden = useCallback((completedRevision: number) => {
        // A UI completion may already be queued on RN when another open/close
        // cycle starts. Visibility alone cannot distinguish those two closes.
        if (!disposed.current && !latestVisibility.current && completedRevision === transitionRevision.current) setPresent(false);
    }, []);
    // A fresh content instance after each completed close discards canceled drafts.
    return present ? (
        <DatePickerContent {...props} key={props.mode ?? 'single'} onHidden={onHidden} getTransitionRevision={getTransitionRevision} />
    ) : null;
}

const styles = StyleSheet.create({
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'flex-end',
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 12,
    },
    frame: { flexShrink: 1, maxHeight: '100%', maxWidth: 360, width: '100%' },
    container: { flexShrink: 1, overflow: 'hidden' },
    header: {
        borderBottomWidth: 1,
        justifyContent: 'space-between',
        gap: 16,
        paddingStart: 24,
        paddingEnd: 12,
        paddingTop: 16,
        paddingBottom: 12,
    },
    headline: { alignItems: 'center', flexDirection: 'row', gap: 8 },
    inputs: { gap: 12, paddingHorizontal: 24, paddingTop: 24 },
    overlay: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 16 },
    fullScreenToolbar: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingStart: 12,
        paddingEnd: 12,
        minHeight: 64,
    },
});
