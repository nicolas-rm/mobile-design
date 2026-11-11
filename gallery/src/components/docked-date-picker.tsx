import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentRef } from 'react';
import {
    BackHandler,
    I18nManager,
    Keyboard,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { Portal, Surface } from 'react-native-paper';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { useSafeAreaInsets } from '@/hooks/settings';
import { usePaperTheme } from '@/theme/paper';
import { DatePickerCalendar } from './date-picker-calendar';
import { DatePicker } from './date-picker';
import {
    calendarDate,
    clampCalendarMonth,
    dateKey,
    formatDateInput,
    getDateError,
    normalizeDate,
    parseDateInput,
    type DateConstraints,
} from './date-picker-utils';

type Anchor = { x: number; y: number; width: number; height: number };
type PopupSide = 'below' | 'above' | 'modal';
export type DockedDatePickerProps = DateConstraints & {
    value?: Date;
    onChange: (date: Date) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    label?: string;
    locale?: string;
    firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    disabled?: boolean;
    initiallyOpen?: boolean;
    initialCalendarView?: 'days' | 'months' | 'years';
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

/** A field-anchored popup. Only its calendar icon opens it; the field remains editable. */
export function DockedDatePicker({
    value,
    onChange,
    open: controlledOpen,
    onOpenChange,
    label = 'Fecha del evento',
    locale = 'es-MX',
    firstDayOfWeek = 0,
    disabled = false,
    initiallyOpen = false,
    initialCalendarView = 'days',
    style,
    testID = 'docked-date-picker',
    ...constraints
}: DockedDatePickerProps) {
    const theme = usePaperTheme();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const anchorRef = useRef<ComponentRef<typeof View>>(null);
    const [anchor, setAnchor] = useState<Anchor>();
    const [side, setSide] = useState<PopupSide>('below');
    const [internalOpen, setInternalOpen] = useState(initiallyOpen);
    const open = controlledOpen ?? internalOpen;
    const [text, setText] = useState(formatDateInput(value));
    const [touched, setTouched] = useState(false);
    const [draftDate, setDraftDate] = useState<Date>();
    const [calendarSession, setCalendarSession] = useState(0);
    const [popupPresent, setPopupPresent] = useState(false);
    const [footerHeight, setFooterHeight] = useState(56);
    const minimumDate = constraints.minimumDate ?? calendarDate(1900, 0);
    const maximumDate = constraints.maximumDate ?? calendarDate(2100, 11, 31);
    if (Number.isNaN(minimumDate.getTime()) || Number.isNaN(maximumDate.getTime()) || dateKey(minimumDate) > dateKey(maximumDate))
        throw new Error('DockedDatePicker requiere límites de fecha válidos y ordenados.');
    const [month, setMonth] = useState(() => clampCalendarMonth(value ?? new Date(), minimumDate, maximumDate));
    const selected = parseDateInput(text);
    const bounds = { ...constraints, minimumDate, maximumDate };
    const error = selected ? getDateError(selected, bounds) : text || touched ? 'Ingresa una fecha válida: dd/mm/aaaa.' : undefined;
    const draftError = draftDate ? getDateError(draftDate, bounds) : undefined;
    const canConfirm = Boolean(draftDate && !draftError);
    const fieldText = open && draftDate ? formatDateInput(draftDate) : text;
    const fieldError = open && draftDate ? draftError : error;
    const wasOpen = useRef(false);
    const popupCommitted = useRef(false);
    const lastEmittedDate = useRef(formatDateInput(value));
    const popupRequested = Boolean(open && !disabled && anchor && side !== 'modal');
    const latestPopupRequest = useRef(popupRequested);
    const opacity = useSharedValue(0);
    const reveal = useSharedValue(0);
    const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get(), transform: [{ scaleX: reveal.get() }, { scaleY: reveal.get() }] }));
    const changeOpen = useCallback(
        (next: boolean) => {
            setInternalOpen(next);
            onOpenChange?.(next);
        },
        [onOpenChange]
    );
    const reset = useCallback(() => {
        setText(formatDateInput(value));
        setTouched(false);
        popupCommitted.current = false;
        changeOpen(false);
        Keyboard.dismiss();
    }, [value, changeOpen]);
    const measure = useCallback(
        () =>
            anchorRef.current?.measureInWindow((x, y, width, height) => {
                if (width <= 0) return;
                const below = window.height - insets.bottom - 8 - y - height;
                const above = y - insets.top - 8;
                setAnchor({ x, y, width, height });
                // Prefer the documented position below the field. Flip/fallback is only
                // a viewport safeguard, and is not recalculated when a month gets taller.
                setSide(below >= 264 ? 'below' : above >= 264 ? 'above' : 'modal');
            }),
        [window.height, insets.top, insets.bottom]
    );
    useLayoutEffect(() => {
        if (open && !wasOpen.current) {
            const initial = selected && !error ? normalizeDate(selected) : value;
            setDraftDate(initial);
            setMonth(clampCalendarMonth(initial ?? new Date(), minimumDate, maximumDate));
            setCalendarSession((session) => session + 1);
            setAnchor(undefined);
            popupCommitted.current = false;
        } else if (!open && wasOpen.current) {
            if (!popupCommitted.current) setText(formatDateInput(value));
            setTouched(false);
        }
        wasOpen.current = open;
    }, [open, selected, error, value, minimumDate, maximumDate]);
    useEffect(() => {
        if (!open) {
            setText(formatDateInput(value));
            lastEmittedDate.current = formatDateInput(value);
        }
    }, [value?.getTime()]);
    useEffect(() => {
        if (!open) return;
        const frame = requestAnimationFrame(measure);
        const keyboard = Keyboard.addListener('keyboardDidHide', measure);
        const back = BackHandler.addEventListener('hardwareBackPress', () => {
            reset();
            return true;
        });
        return () => {
            cancelAnimationFrame(frame);
            keyboard.remove();
            back.remove();
        };
    }, [open, window.width, measure, reset]);
    useEffect(() => {
        if (disabled && open) changeOpen(false);
    }, [disabled, open, changeOpen]);
    useLayoutEffect(() => {
        latestPopupRequest.current = popupRequested;
        if (popupRequested) setPopupPresent(true);
    }, [popupRequested]);
    const finishHide = useCallback(() => {
        if (!latestPopupRequest.current) {
            setPopupPresent(false);
            reveal.set(0);
        }
    }, [reveal]);
    useEffect(() => {
        if (!popupPresent) return;
        // Paper Menu opens with scaleX/scaleY and opacity in parallel. The modern
        // native transformOrigin keeps the same anchor as its translate+scale math.
        if (popupRequested) reveal.set(withTiming(1, { duration: 250 * theme.animation.scale, easing: Easing.bezier(0.4, 0, 0.2, 1) }));
        // Closing changes opacity only, and retains the Portal until completion.
        opacity.set(
            withTiming(
                popupRequested ? 1 : 0,
                { duration: 250 * theme.animation.scale, easing: Easing.bezier(0.4, 0, 0.2, 1) },
                (finished) => {
                    if (finished && !popupRequested) scheduleOnRN(finishHide);
                }
            )
        );
    }, [popupPresent, popupRequested, theme.animation.scale, opacity, reveal, finishHide]);

    const emitDate = (date: Date, confirmSelection = false) => {
        const normalized = normalizeDate(date);
        const key = formatDateInput(normalized);
        setText(key);
        if (confirmSelection || lastEmittedDate.current !== key) {
            lastEmittedDate.current = key;
            onChange(normalized);
        }
    };
    const confirm = () => {
        if (!draftDate || !canConfirm || !open) return;
        popupCommitted.current = true;
        emitDate(draftDate, true);
        changeOpen(false);
        Keyboard.dismiss();
    };
    const confirmManual = () => {
        if (selected && !error) {
            emitDate(selected);
            Keyboard.dismiss();
        } else setTouched(true);
    };
    const toggle = () => {
        if (open) {
            reset();
            return;
        }
        Keyboard.dismiss();
        changeOpen(true);
    };
    const popupWidth = Math.min(360, window.width - 32);
    const below = anchor ? window.height - insets.bottom - 8 - anchor.y - anchor.height : 0;
    const above = anchor ? anchor.y - insets.top - 8 : 0;
    const availableHeight = Math.min(456, Math.max(0, side === 'above' ? above : below));
    const left = anchor
        ? Math.max(16, Math.min(window.width - popupWidth - 16, I18nManager.isRTL ? anchor.x + anchor.width - popupWidth : anchor.x))
        : 16;

    return (
        <View style={[{ gap: 4, maxWidth: 360, width: '100%' }, style]} testID={testID}>
            <View
                ref={anchorRef}
                collapsable={false}
                onLayout={() => {
                    if (open) measure();
                }}
            >
                <TextInput
                    accessibilityHint="Escribe día, mes y año o abre el calendario con el icono"
                    disabled={disabled}
                    endAccessory={(accessory) => (
                        <TextInput.Icon
                            {...accessory}
                            accessibilityLabel={open ? 'Cerrar calendario desplegable' : 'Abrir calendario desplegable'}
                            icon="calendar-outline"
                            onPress={toggle}
                            testID={`${testID}-toggle`}
                        />
                    )}
                    error={touched && Boolean(fieldError)}
                    keyboardType="numbers-and-punctuation"
                    label={label}
                    maxLength={24}
                    onBlur={() => {
                        setTouched(true);
                        if (selected) {
                            setText(formatDateInput(selected));
                            if (!open && !error) emitDate(selected);
                        }
                    }}
                    onChangeText={(next) => {
                        setText(next);
                        const date = parseDateInput(next);
                        if (date) setMonth(clampCalendarMonth(date, minimumDate, maximumDate));
                    }}
                    onFocus={() => {
                        // Entering manual editing cancels the calendar draft. It must
                        // never become a confirmed date later through the field's blur.
                        if (open) {
                            setText(formatDateInput(value));
                            setTouched(false);
                            changeOpen(false);
                        }
                    }}
                    onSubmitEditing={confirmManual}
                    placeholder="dd/mm/aaaa"
                    returnKeyType="done"
                    testID={`${testID}-input`}
                    value={fieldText}
                />
            </View>
            <Text
                accessibilityLiveRegion="polite"
                style={{ color: touched && fieldError ? theme.colors.error : theme.colors.onSurfaceVariant, paddingHorizontal: 16 }}
                variant="bodySmall"
            >
                {touched && fieldError ? fieldError : 'Día / mes / año'}
            </Text>
            {anchor && side === 'modal' ? (
                <DatePicker
                    initialCalendarView={initialCalendarView === 'years' ? 'years' : 'days'}
                    firstDayOfWeek={firstDayOfWeek}
                    locale={locale}
                    maximumDate={maximumDate}
                    minimumDate={minimumDate}
                    isDateDisabled={constraints.isDateDisabled}
                    onChange={(date) => {
                        popupCommitted.current = true;
                        emitDate(date, true);
                    }}
                    onDismiss={() => changeOpen(false)}
                    testID={`${testID}-compact-modal`}
                    value={draftDate}
                    visible={open && !disabled}
                />
            ) : null}
            {popupPresent && anchor ? (
                <Portal>
                    <View pointerEvents={popupRequested ? 'box-none' : 'none'} style={StyleSheet.absoluteFill}>
                        <Pressable
                            accessible={false}
                            onPress={reset}
                            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: anchor.y }}
                            testID={`${testID}-dismiss-above`}
                        />
                        <Pressable
                            accessible={false}
                            onPress={reset}
                            style={{ position: 'absolute', left: 0, right: 0, top: anchor.y + anchor.height, bottom: 0 }}
                            testID={`${testID}-dismiss-below`}
                        />
                        <Pressable
                            accessible={false}
                            onPress={reset}
                            style={{ position: 'absolute', left: 0, width: anchor.x, top: anchor.y, height: anchor.height }}
                        />
                        <Pressable
                            accessible={false}
                            onPress={reset}
                            style={{ position: 'absolute', left: anchor.x + anchor.width, right: 0, top: anchor.y, height: anchor.height }}
                        />
                        <Animated.View
                            accessibilityElementsHidden={!popupRequested}
                            importantForAccessibility={popupRequested ? 'auto' : 'no-hide-descendants'}
                            onAccessibilityEscape={reset}
                            style={[
                                {
                                    position: 'absolute',
                                    top: side === 'above' ? undefined : anchor.y + anchor.height + 4,
                                    bottom: side === 'above' ? window.height - anchor.y + 4 : undefined,
                                    left,
                                    width: popupWidth,
                                    maxHeight: availableHeight,
                                    transformOrigin: `${I18nManager.isRTL ? 'right' : 'left'} ${side === 'above' ? 'bottom' : 'top'}`,
                                },
                                fadeStyle,
                            ]}
                            testID={`${testID}-popup`}
                        >
                            <Surface
                                elevation={theme.elevation.level3}
                                style={{
                                    width: '100%',
                                    borderRadius: theme.shapes.corner.extraSmall,
                                    backgroundColor: theme.colors.surfaceContainerHigh,
                                }}
                            >
                                <View style={{ borderRadius: theme.shapes.corner.extraSmall, overflow: 'hidden' }}>
                                    <DatePickerCalendar
                                        {...constraints}
                                        minimumDate={minimumDate}
                                        maximumDate={maximumDate}
                                        maximumHeight={availableHeight - footerHeight}
                                        docked
                                        firstDayOfWeek={firstDayOfWeek}
                                        initialView={initialCalendarView}
                                        key={calendarSession}
                                        locale={locale}
                                        month={month}
                                        onMonthChange={setMonth}
                                        onSelect={setDraftDate}
                                        showOutsideDays
                                        start={draftDate}
                                        testID={testID}
                                    />
                                    <View
                                        onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'flex-end',
                                            gap: 8,
                                            paddingHorizontal: 12,
                                            paddingTop: 8,
                                            paddingBottom: 12,
                                        }}
                                    >
                                        <Button
                                            contentStyle={{ minHeight: 36 }}
                                            labelStyle={{ marginVertical: 8 }}
                                            mode="text"
                                            onPress={reset}
                                            testID={`${testID}-cancel`}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            contentStyle={{ minHeight: 36 }}
                                            labelStyle={{ marginVertical: 8 }}
                                            disabled={!canConfirm}
                                            mode="text"
                                            onPress={confirm}
                                            testID={`${testID}-confirm`}
                                        >
                                            Aceptar
                                        </Button>
                                    </View>
                                </View>
                            </Surface>
                        </Animated.View>
                    </View>
                </Portal>
            ) : null}
        </View>
    );
}
