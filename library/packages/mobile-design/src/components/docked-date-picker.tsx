import type { ScrollIndicatorOptions } from '../scroll-indicators';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentRef } from 'react';
import {
    BackHandler,
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { Portal, Surface, useLocale } from 'react-native-paper';
import Animated, { ReduceMotion, Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Button } from '../primitives';
import { TextField } from './text-field';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobileTheme } from '../core';
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
    /** Scrollbars are opt-in for this component only; both axes are hidden by default. */
    scrollIndicators?: ScrollIndicatorOptions;
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
    scrollIndicators,
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
    const theme = useMobileTheme();
    const rtl = useLocale().direction === 'rtl';
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const anchorRef = useRef<ComponentRef<typeof View>>(null);
    const popupRef = useRef<ComponentRef<typeof View>>(null);
    const [popupNode, setPopupNode] = useState<ComponentRef<typeof View> | null>(null);
    const attachPopup = useCallback((node: ComponentRef<typeof View> | null) => {
        popupRef.current = node;
        if (Platform.OS === 'web') setPopupNode(node);
    }, []);
    const previousFocus = useRef<HTMLElement | null>(null);
    const wasWebOpen = useRef(false);
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
    const closeRequested = useRef(false),
        disposed = useRef(false),
        popupRevision = useRef(0);
    const lastEmittedDate = useRef(formatDateInput(value));
    const popupRequested = Boolean(open && !disabled && anchor && side !== 'modal');
    const measureRevision = useRef(0);
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
        closeRequested.current = true;
        setText(formatDateInput(value));
        setTouched(false);
        popupCommitted.current = false;
        changeOpen(false);
        Keyboard.dismiss();
    }, [value, changeOpen]);
    const measure = useCallback(() => {
        const revision = ++measureRevision.current;
        anchorRef.current?.measureInWindow((x, y, width, height) => {
            if (disposed.current || revision !== measureRevision.current || !wasOpen.current || width <= 0) return;
            const below = window.height - insets.bottom - 8 - y - height;
            const above = y - insets.top - 8;
            setAnchor({ x, y, width, height });
            // Prefer the documented position below the field. Flip/fallback is only
            // a viewport safeguard, and is not recalculated when a month gets taller.
            setSide(window.width - insets.left - insets.right < 360 ? 'modal' : below >= 264 ? 'below' : above >= 264 ? 'above' : 'modal');
        });
    }, [window.height, window.width, insets.top, insets.bottom, insets.left, insets.right]);
    useLayoutEffect(() => {
        if (open && !wasOpen.current) {
            const initial = selected && !error ? normalizeDate(selected) : value;
            setDraftDate(initial);
            setMonth(clampCalendarMonth(initial ?? new Date(), minimumDate, maximumDate));
            setCalendarSession((session) => session + 1);
            setAnchor(undefined);
            popupCommitted.current = false;
            closeRequested.current = false;
        } else if (!open && wasOpen.current) {
            closeRequested.current = true;
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
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                reset();
            }
        };
        if (Platform.OS === 'web') document.addEventListener('keydown', escape);
        const frame = requestAnimationFrame(measure);
        const keyboard = Keyboard.addListener('keyboardDidHide', measure);
        const back = BackHandler.addEventListener('hardwareBackPress', () => {
            reset();
            return true;
        });
        return () => {
            measureRevision.current += 1;
            cancelAnimationFrame(frame);
            if (Platform.OS === 'web') document.removeEventListener('keydown', escape);
            keyboard.remove();
            back.remove();
        };
    }, [open, window.width, measure, reset]);
    useEffect(() => {
        if (disabled && open) {
            closeRequested.current = true;
            changeOpen(false);
        }
    }, [disabled, open, changeOpen]);
    useLayoutEffect(() => {
        popupRevision.current += 1;
        latestPopupRequest.current = popupRequested;
        if (popupRequested) setPopupPresent(true);
    }, [popupRequested]);
    const finishHide = useCallback(
        (completedRevision: number) => {
            if (!disposed.current && !latestPopupRequest.current && completedRevision === popupRevision.current) {
                setPopupPresent(false);
                reveal.set(0);
            }
        },
        [reveal]
    );
    useEffect(() => {
        disposed.current = false;
        return () => {
            disposed.current = true;
            measureRevision.current += 1;
            popupRevision.current += 1;
            cancelAnimation(opacity);
            cancelAnimation(reveal);
        };
    }, [opacity, reveal]);
    useEffect(() => {
        if (!popupPresent) return;
        const revision = popupRevision.current;
        // Paper Menu opens with scaleX/scaleY and opacity in parallel. The modern
        // native transformOrigin keeps the same anchor as its translate+scale math.
        if (popupRequested)
            reveal.set(
                withTiming(1, {
                    reduceMotion: ReduceMotion.Never,
                    duration: 250 * theme.animation.scale,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                })
            );
        // Closing changes opacity only, and retains the Portal until completion.
        opacity.set(
            withTiming(
                popupRequested ? 1 : 0,
                { reduceMotion: ReduceMotion.Never, duration: 250 * theme.animation.scale, easing: Easing.bezier(0.4, 0, 0.2, 1) },
                (finished) => {
                    if (finished && !popupRequested) scheduleOnRN(finishHide, revision);
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
        if (!draftDate || !canConfirm || !open || disabled || closeRequested.current) return;
        closeRequested.current = true;
        popupCommitted.current = true;
        emitDate(draftDate, true);
        changeOpen(false);
        Keyboard.dismiss();
    };
    const confirmManual = () => {
        if (disabled || disposed.current) return;
        if (selected && !error) {
            emitDate(selected);
            Keyboard.dismiss();
        } else setTouched(true);
    };
    const toggle = () => {
        if (disabled || disposed.current) return;
        if (open) {
            reset();
            return;
        }
        Keyboard.dismiss();
        changeOpen(true);
    };
    useLayoutEffect(() => {
        if (Platform.OS !== 'web') return;
        if (open && !wasWebOpen.current)
            previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (!open && wasWebOpen.current) {
            const popup = popupRef.current as unknown as HTMLElement | null;
            if (previousFocus.current?.isConnected && (document.activeElement === document.body || popup?.contains(document.activeElement)))
                previousFocus.current.focus({ preventScroll: true });
        }
        wasWebOpen.current = open;
    }, [open]);
    useEffect(() => {
        if (Platform.OS !== 'web' || !popupRequested || !popupPresent || !anchor) return;
        const popup = popupNode as unknown as HTMLElement | null;
        if (!popup) return;
        const focusReadyDate = () => {
            const days = [...popup.querySelectorAll<HTMLElement>('[data-mobile-design-date]')];
            // The first frame can contain the month header while FlatList is still
            // measuring. Wait for its date cells before choosing initial focus.
            if (initialCalendarView === 'days' && days.length === 0) return;
            const targets = [
                ...popup.querySelectorAll<HTMLElement>('[aria-pressed="true"], [data-mobile-design-date], [role="button"]'),
            ].filter((node) => !node.closest('[aria-hidden="true"], [inert]') && node.getAttribute('aria-disabled') !== 'true');
            const target =
                targets.find((node) => node.dataset.mobileDesignDate && node.getAttribute('aria-pressed') === 'true') ??
                targets.find((node) => node.dataset.mobileDesignDate) ??
                targets.find((node) => node.getAttribute('aria-pressed') === 'true') ??
                targets[0];
            if (target) {
                observer.disconnect();
                target.focus({ preventScroll: true });
            }
        };
        const observer = new MutationObserver(focusReadyDate);
        observer.observe(popup, { childList: true, subtree: true });
        const frame = requestAnimationFrame(focusReadyDate);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [popupRequested, popupPresent, Boolean(anchor), calendarSession, initialCalendarView, popupNode]);
    const popupWidth = Math.max(1, Math.min(360, window.width - insets.left - insets.right - 32));
    const below = anchor ? window.height - insets.bottom - 8 - anchor.y - anchor.height : 0;
    const above = anchor ? anchor.y - insets.top - 8 : 0;
    const availableHeight = Math.min(456, Math.max(0, side === 'above' ? above : below));
    const left = anchor
        ? Math.max(
              insets.left + 16,
              Math.min(window.width - insets.right - popupWidth - 16, rtl ? anchor.x + anchor.width - popupWidth : anchor.x)
          )
        : insets.left + 16;

    return (
        <View style={[{ gap: 4, maxWidth: 360, width: '100%' }, style]} testID={testID}>
            <View
                ref={anchorRef}
                collapsable={false}
                onLayout={() => {
                    if (open) measure();
                }}
            >
                <TextField
                    accessibilityHint="Escribe día, mes y año o abre el calendario con el icono"
                    disabled={disabled}
                    variant="outlined"
                    trailingIcon="calendar-outline"
                    trailingIconAccessibilityLabel={open ? 'Cerrar calendario desplegable' : 'Abrir calendario desplegable'}
                    onTrailingIconPress={toggle}
                    error={touched && Boolean(fieldError)}
                    errorText={touched ? fieldError : undefined}
                    supportingText="Día / mes / año"
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
                            closeRequested.current = true;
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
                            focusable={false}
                            tabIndex={-1}
                            {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                            onPress={reset}
                            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: anchor.y }}
                            testID={`${testID}-dismiss-above`}
                        />
                        <Pressable
                            accessible={false}
                            focusable={false}
                            tabIndex={-1}
                            {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                            onPress={reset}
                            style={{ position: 'absolute', left: 0, right: 0, top: anchor.y + anchor.height, bottom: 0 }}
                            testID={`${testID}-dismiss-below`}
                        />
                        <Pressable
                            accessible={false}
                            focusable={false}
                            tabIndex={-1}
                            {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                            onPress={reset}
                            style={{ position: 'absolute', left: 0, width: anchor.x, top: anchor.y, height: anchor.height }}
                        />
                        <Pressable
                            accessible={false}
                            focusable={false}
                            tabIndex={-1}
                            {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
                            onPress={reset}
                            style={{ position: 'absolute', left: anchor.x + anchor.width, right: 0, top: anchor.y, height: anchor.height }}
                        />
                        <Animated.View
                            ref={attachPopup}
                            {...(Platform.OS === 'web'
                                ? { role: 'dialog' as const, 'aria-label': label, 'aria-hidden': !popupRequested, inert: !popupRequested }
                                : {})}
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
                                    transformOrigin: `${rtl ? 'right' : 'left'} ${side === 'above' ? 'bottom' : 'top'}`,
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
                                        scrollIndicators={scrollIndicators}
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
                                            gap: 16,
                                            paddingHorizontal: 12,
                                            paddingTop: 8,
                                            paddingBottom: 12,
                                        }}
                                    >
                                        <Button
                                            contentStyle={{ minHeight: 36 }}
                                            labelStyle={{ marginVertical: 8 }}
                                            variant="text"
                                            onPress={reset}
                                            testID={`${testID}-cancel`}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            contentStyle={{ minHeight: 36 }}
                                            labelStyle={{ marginVertical: 8 }}
                                            disabled={!canConfirm}
                                            variant="text"
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
