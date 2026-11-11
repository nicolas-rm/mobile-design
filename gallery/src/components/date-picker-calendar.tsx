import type { ScrollIndicatorOptions } from 'mobile-design/react-native';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, I18nManager, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
    cubicBezier,
    FadeIn,
    FadeOut,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { TouchableRipple } from '@/components/TouchableRipple';
import { usePaperTheme } from '@/theme/paper';
import { withAlpha } from '@/theme/color-utils';
import {
    calendarDate,
    clampCalendarMonth,
    dateKey,
    getCalendarMonthRowCount,
    getDateError,
    getMonthDays,
    type DateConstraints,
} from './date-picker-utils';

type Props = DateConstraints & {
    scrollIndicators?: ScrollIndicatorOptions;
    minimumDate: Date;
    maximumDate: Date;
    month: Date;
    onMonthChange: (month: Date) => void;
    onSelect: (date: Date) => void;
    start?: Date;
    end?: Date;
    locale: string;
    firstDayOfWeek: number;
    testID: string;
    initialView?: 'days' | 'months' | 'years';
    docked?: boolean;
    navigation?: boolean;
    showOutsideDays?: boolean;
    showWeekdays?: boolean;
    maximumHeight?: number;
};

// MD3 uses a 40dp state layer inside a 48dp interactive date cell, and six rows
// for the modal pager. Native paging keeps dragging and snapping off JS.
export const DATE_PICKER_DAY_SIZE = 48;
export const DATE_PICKER_MONTH_HEADER_HEIGHT = 56;
export const DATE_PICKER_WEEKDAYS_HEIGHT = 48;

const CalendarDay = memo(function CalendarDay({
    date,
    selected,
    inRange,
    isToday,
    disabled,
    outside,
    onPress,
    label,
    testID,
}: {
    date: Date;
    selected: boolean;
    inRange: boolean;
    isToday: boolean;
    disabled: boolean;
    outside: boolean;
    onPress: () => void;
    label: string;
    testID: string;
}) {
    const theme = usePaperTheme();
    const duration = theme.motion.duration.short3 * theme.animation.scale;
    const color = selected
        ? theme.colors.onPrimary
        : disabled
          ? theme.colors.onSurface
          : isToday
            ? theme.colors.primary
            : inRange
              ? theme.colors.onSecondaryContainer
              : theme.colors.onSurface;
    return (
        <TouchableRipple
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={{ disabled, selected }}
            borderless
            disabled={disabled}
            hitSlop={4}
            onPress={onPress}
            rippleColor={
                selected && typeof theme.colors.onPrimary === 'string'
                    ? withAlpha(theme.colors.onPrimary, 0.1)
                    : inRange && typeof theme.colors.onSecondaryContainer === 'string'
                      ? withAlpha(theme.colors.onSecondaryContainer, 0.1)
                      : theme.colors.stateLayerPressed
            }
            style={styles.dayTouch}
            testID={testID}
        >
            <Animated.View
                style={[
                    styles.dayCircle,
                    {
                        backgroundColor: selected ? theme.colors.primary : 'transparent',
                        borderColor: isToday && !selected ? theme.colors.primary : 'transparent',
                        borderWidth: 1,
                        opacity: disabled && selected ? 0.38 : 1,
                        transitionProperty: ['backgroundColor', 'borderColor'],
                        transitionDuration: duration,
                        transitionTimingFunction: cubicBezier(...theme.motion.easing.standard),
                    },
                ]}
            >
                <Text
                    maxFontSizeMultiplier={1.5}
                    style={{ color, opacity: disabled && !selected ? 0.38 : outside && !selected ? 0.38 : 1 }}
                    variant="bodyLarge"
                >
                    {date.getDate()}
                </Text>
            </Animated.View>
        </TouchableRipple>
    );
});

export function DatePickerWeekdays({ locale, firstDayOfWeek }: Pick<Props, 'locale' | 'firstDayOfWeek'>) {
    const theme = usePaperTheme();
    return (
        <View style={styles.week}>
            {Array.from({ length: 7 }, (_, index) => {
                const day = calendarDate(2023, 0, 1 + ((firstDayOfWeek + index) % 7));
                return (
                    <View key={index} style={styles.weekday}>
                        <Text
                            accessibilityLabel={new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(day)}
                            maxFontSizeMultiplier={1.5}
                            style={{ color: theme.colors.onSurface }}
                            variant="bodyLarge"
                        >
                            {new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(day).toLocaleUpperCase(locale)}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

function MonthGrid(props: Props & { fixedRows?: boolean }) {
    const { month, start, end, locale, firstDayOfWeek, testID } = props;
    const theme = usePaperTheme();
    const days = getMonthDays(month, firstDayOfWeek);
    const leading = days.findIndex(Boolean);
    const rows = props.fixedRows ? 6 : days.length / 7;
    const today = dateKey(new Date());
    const startKey = start ? dateKey(start) : '';
    const endKey = end ? dateKey(end) : '';
    const format = new Intl.DateTimeFormat(locale, { dateStyle: 'full' });
    return (
        <View>
            {Array.from({ length: rows }, (_, row) => (
                <View key={row} style={styles.week}>
                    {Array.from({ length: 7 }, (_, column) => {
                        const index = row * 7 + column;
                        const cellDate = days[index];
                        const date =
                            cellDate ??
                            (props.showOutsideDays ? calendarDate(month.getFullYear(), month.getMonth(), index - leading + 1) : undefined);
                        if (!date) return <View key={column} style={styles.dayCell} />;
                        const key = dateKey(date);
                        const selected = key === startKey || key === endKey;
                        const inRange = Boolean(startKey && endKey && key >= startKey && key <= endKey);
                        const disabled = Boolean(getDateError(date, props));
                        const isToday = key === today;
                        return (
                            <View key={column} style={styles.dayCell}>
                                {inRange ? (
                                    <View
                                        pointerEvents="none"
                                        style={[
                                            styles.range,
                                            { backgroundColor: theme.colors.secondaryContainer },
                                            key === startKey && { start: '50%' },
                                            key === endKey && { end: '50%' },
                                        ]}
                                    />
                                ) : null}
                                <CalendarDay
                                    date={date}
                                    disabled={disabled}
                                    inRange={inRange}
                                    isToday={isToday}
                                    outside={!cellDate}
                                    selected={selected}
                                    label={`${format.format(date)}${isToday ? ', hoy' : ''}${key === startKey ? ', fecha inicial' : ''}${key === endKey ? ', fecha final' : ''}${inRange ? ', en el periodo seleccionado' : ''}`}
                                    onPress={() => {
                                        props.onSelect(date);
                                        if (date.getMonth() !== month.getMonth())
                                            props.onMonthChange(calendarDate(date.getFullYear(), date.getMonth()));
                                    }}
                                    testID={`${testID}-day-${key}`}
                                />
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

export function DatePickerCalendar(props: Props) {
    const { minimumDate, maximumDate, month, onMonthChange, locale, testID } = props;
    const theme = usePaperTheme();
    const moving = theme.animation.scale !== 0;
    const rtl = I18nManager.isRTL;
    const [view, setView] = useState(props.initialView ?? 'days');
    const [width, setWidth] = useState(0);
    const firstMonth = minimumDate.getFullYear() * 12 + minimumDate.getMonth();
    const lastMonth = maximumDate.getFullYear() * 12 + maximumDate.getMonth();
    const monthIndex = Math.max(0, Math.min(lastMonth - firstMonth, month.getFullYear() * 12 + month.getMonth() - firstMonth));
    const usesPager = props.navigation !== false;
    const months = useMemo(
        () =>
            usesPager
                ? Array.from({ length: lastMonth - firstMonth + 1 }, (_, index) =>
                      calendarDate(Math.floor((firstMonth + index) / 12), (firstMonth + index) % 12)
                  )
                : [],
        [firstMonth, lastMonth, usesPager]
    );
    const listRef = useRef<FlatList<Date>>(null);
    const visibleIndex = useRef(monthIndex);
    const userPaging = useRef<'idle' | 'dragging' | 'settling'>('idle');
    const yearsRef = useRef<FlatList<number>>(null);
    const firstYear = minimumDate.getFullYear();
    const lastYear = maximumDate.getFullYear();
    const years = useMemo(
        () => (usesPager ? Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index) : []),
        [firstYear, lastYear, usesPager]
    );
    const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month);
    const duration = moving ? theme.motion.duration.short3 : 0;
    const scrollOffset = useSharedValue(0);
    const rowCounts = useMemo(
        () => months.map((value) => getCalendarMonthRowCount(value, props.firstDayOfWeek)),
        [months, props.firstDayOfWeek]
    );
    const gridHeight = useAnimatedStyle(() => {
        const position = width > 0 ? Math.max(0, scrollOffset.get()) / width : monthIndex;
        const lower = Math.max(0, Math.min(rowCounts.length - 1, Math.floor(position)));
        const upper = Math.min(rowCounts.length - 1, lower + 1);
        return {
            height:
                ((rowCounts[lower] ?? 6) + ((rowCounts[upper] ?? 6) - (rowCounts[lower] ?? 6)) * (position - lower)) * DATE_PICKER_DAY_SIZE,
        };
    });
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollOffset.set(rtl ? event.contentSize.width - event.layoutMeasurement.width - event.contentOffset.x : event.contentOffset.x);
    });

    useEffect(() => {
        if (width > 0 && view === 'days' && visibleIndex.current !== monthIndex) {
            const nearby = Math.abs(visibleIndex.current - monthIndex) === 1;
            visibleIndex.current = monthIndex;
            if (!nearby || !moving) scrollOffset.set(monthIndex * width);
            listRef.current?.scrollToIndex({ index: monthIndex, animated: moving && nearby });
        }
    }, [monthIndex, width, view, moving, scrollOffset]);

    const navigate = (delta: number) => {
        userPaging.current = 'idle';
        onMonthChange(
            clampCalendarMonth(
                calendarDate(month.getFullYear() + (view === 'months' ? delta : 0), month.getMonth() + (view === 'days' ? delta : 0)),
                minimumDate,
                maximumDate
            )
        );
    };
    const chooseYear = (year: number) => {
        onMonthChange(clampCalendarMonth(calendarDate(year, month.getMonth()), minimumDate, maximumDate));
        setView('days');
    };
    const yearRow = Math.max(0, Math.floor((month.getFullYear() - firstYear) / 3) - 1);
    const navigationHeight = props.docked ? 64 : DATE_PICKER_MONTH_HEADER_HEIGHT;
    const menuHeight = Math.min(
        props.docked ? 336 : (getCalendarMonthRowCount(month, props.firstDayOfWeek) + 1) * DATE_PICKER_DAY_SIZE,
        props.maximumHeight ? Math.max(48, props.maximumHeight - navigationHeight) : Infinity
    );
    const DaysContent = props.maximumHeight ? ScrollView : View;

    const dropdown = (kind: 'months' | 'years') => (
        <TouchableRipple
            accessibilityLabel={`Elegir ${kind === 'months' ? 'mes' : 'año'}`}
            accessibilityRole="button"
            accessibilityState={{ expanded: view === kind, disabled: view !== 'days' && view !== kind }}
            disabled={view !== 'days' && view !== kind}
            borderless
            onPress={() => setView(view === kind ? 'days' : kind)}
            style={styles.dropdown}
            testID={`${testID}-${kind === 'months' ? 'month' : 'year'}-toggle`}
        >
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 4, opacity: view !== 'days' && view !== kind ? 0.38 : 1 }}>
                <Text style={{ color: theme.colors.onSurfaceVariant }} variant="titleSmall">
                    {kind === 'months' ? new Intl.DateTimeFormat(locale, { month: 'long' }).format(month) : month.getFullYear()}
                </Text>
                <Icon color={theme.colors.onSurfaceVariant} name={view === kind ? 'menu-up' : 'menu-down'} size={18} />
            </View>
        </TouchableRipple>
    );

    return (
        <View style={styles.calendar}>
            <View style={[styles.monthHeader, { height: navigationHeight }]}>
                {props.navigation === false ? (
                    <Text accessibilityRole="header" style={{ color: theme.colors.onSurfaceVariant }} variant="titleSmall">
                        {monthLabel}
                    </Text>
                ) : props.docked ? (
                    <View style={{ alignItems: 'center', flexDirection: 'row', flex: 1, justifyContent: 'space-between' }}>
                        <View style={styles.dockedHeaderGroup}>
                            {view === 'days' ? (
                                <IconButton
                                    accessibilityLabel="Mes anterior"
                                    disabled={monthIndex === 0}
                                    hitSlop={8}
                                    icon={I18nManager.isRTL ? 'chevron-right' : 'chevron-left'}
                                    onPress={() => navigate(-1)}
                                    style={styles.dockedArrow}
                                    testID={`${testID}-previous-month`}
                                />
                            ) : null}
                            {dropdown('months')}
                            {view === 'days' ? (
                                <IconButton
                                    accessibilityLabel="Mes siguiente"
                                    disabled={monthIndex === months.length - 1}
                                    hitSlop={8}
                                    icon={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'}
                                    onPress={() => navigate(1)}
                                    style={styles.dockedArrow}
                                    testID={`${testID}-next-month`}
                                />
                            ) : null}
                        </View>
                        <View style={styles.dockedHeaderGroup}>
                            {view === 'days' ? (
                                <IconButton
                                    accessibilityLabel="Año anterior"
                                    disabled={month.getFullYear() === firstYear}
                                    hitSlop={8}
                                    icon={I18nManager.isRTL ? 'chevron-right' : 'chevron-left'}
                                    onPress={() =>
                                        onMonthChange(
                                            clampCalendarMonth(
                                                calendarDate(month.getFullYear() - 1, month.getMonth()),
                                                minimumDate,
                                                maximumDate
                                            )
                                        )
                                    }
                                    style={styles.dockedArrow}
                                    testID={`${testID}-previous-year`}
                                />
                            ) : null}
                            {dropdown('years')}
                            {view === 'days' ? (
                                <IconButton
                                    accessibilityLabel="Año siguiente"
                                    disabled={month.getFullYear() === lastYear}
                                    hitSlop={8}
                                    icon={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'}
                                    onPress={() =>
                                        onMonthChange(
                                            clampCalendarMonth(
                                                calendarDate(month.getFullYear() + 1, month.getMonth()),
                                                minimumDate,
                                                maximumDate
                                            )
                                        )
                                    }
                                    style={styles.dockedArrow}
                                    testID={`${testID}-next-year`}
                                />
                            ) : null}
                        </View>
                    </View>
                ) : (
                    <>
                        <View style={{ alignItems: 'center', flexDirection: 'row', flex: 1, minWidth: 0 }}>
                            <Button
                                accessibilityLabel={view === 'years' ? 'Volver al calendario' : `Elegir año. ${monthLabel}`}
                                icon={view === 'years' ? 'menu-up' : 'menu-down'}
                                mode="text"
                                textColor={theme.colors.onSurfaceVariant}
                                onPress={() => setView(view === 'years' ? 'days' : 'years')}
                                style={{ flexShrink: 1, minWidth: 0 }}
                                contentStyle={{ minHeight: 48, flexDirection: 'row-reverse' }}
                                testID={`${testID}-year-toggle`}
                            >
                                {monthLabel}
                            </Button>
                        </View>
                        {view !== 'years' ? (
                            <View style={styles.arrows}>
                                <IconButton
                                    accessibilityLabel={view === 'days' ? 'Mes anterior' : 'Año anterior'}
                                    disabled={view === 'days' ? monthIndex === 0 : month.getFullYear() === firstYear}
                                    icon={I18nManager.isRTL ? 'chevron-right' : 'chevron-left'}
                                    onPress={() => navigate(-1)}
                                    style={styles.arrow}
                                    testID={`${testID}-previous-month`}
                                />
                                <IconButton
                                    accessibilityLabel={view === 'days' ? 'Mes siguiente' : 'Año siguiente'}
                                    disabled={view === 'days' ? monthIndex === months.length - 1 : month.getFullYear() === lastYear}
                                    icon={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'}
                                    onPress={() => navigate(1)}
                                    style={styles.arrow}
                                    testID={`${testID}-next-month`}
                                />
                            </View>
                        ) : null}
                    </>
                )}
            </View>
            {props.docked && view !== 'days' ? (
                <Animated.View entering={FadeIn.duration(duration)} key={view} style={{ height: menuHeight }}>
                    <FlatList
                        data={view === 'years' ? years : Array.from({ length: 12 }, (_, index) => index)}
                        initialScrollIndex={
                            view === 'years' ? Math.max(0, month.getFullYear() - firstYear - 2) : Math.max(0, month.getMonth() - 2)
                        }
                        initialNumToRender={10}
                        getItemLayout={(_, index) => ({ index, length: 48, offset: index * 48 })}
                        keyExtractor={String}
                        nestedScrollEnabled
                        renderItem={({ item }) => {
                            const selected = view === 'years' ? item === month.getFullYear() : item === month.getMonth();
                            const value = view === 'years' ? calendarDate(item, month.getMonth()) : calendarDate(month.getFullYear(), item);
                            const disabled =
                                view === 'months' &&
                                (dateKey(calendarDate(value.getFullYear(), value.getMonth() + 1, 0)) < dateKey(minimumDate) ||
                                    dateKey(value) > dateKey(maximumDate));
                            return (
                                <TouchableRipple
                                    accessibilityRole="button"
                                    accessibilityState={{ selected, disabled }}
                                    disabled={disabled}
                                    onPress={() => {
                                        onMonthChange(clampCalendarMonth(value, minimumDate, maximumDate));
                                        setView('days');
                                    }}
                                    style={{
                                        height: 48,
                                        paddingHorizontal: 16,
                                        justifyContent: 'center',
                                        backgroundColor: selected ? theme.colors.surfaceContainerHighest : 'transparent',
                                    }}
                                    testID={`${testID}-${view === 'years' ? 'year' : 'month'}-${view === 'years' ? item : item + 1}`}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, opacity: disabled ? 0.38 : 1 }}>
                                        <View style={{ width: 24 }}>
                                            {selected ? <Icon name="check" size={24} color={theme.colors.onSurface} /> : null}
                                        </View>
                                        <Text variant="bodyLarge">
                                            {view === 'years' ? item : new Intl.DateTimeFormat(locale, { month: 'long' }).format(value)}
                                        </Text>
                                    </View>
                                </TouchableRipple>
                            );
                        }}
                        testID={`${testID}-${view}`}
                        showsVerticalScrollIndicator={props.scrollIndicators?.vertical ?? false}
                        showsHorizontalScrollIndicator={props.scrollIndicators?.horizontal ?? false}
                    />
                </Animated.View>
            ) : view === 'years' ? (
                <Animated.View
                    entering={FadeIn.duration(duration)}
                    exiting={FadeOut.duration(duration)}
                    key="years"
                    style={{ height: menuHeight }}
                >
                    <FlatList
                        data={years}
                        ref={yearsRef}
                        numColumns={3}
                        initialNumToRender={24}
                        initialScrollIndex={yearRow}
                        getItemLayout={(_, index) => ({ index, length: 52, offset: 52 * index })}
                        keyExtractor={String}
                        nestedScrollEnabled
                        onScrollToIndexFailed={() => yearsRef.current?.scrollToOffset({ offset: yearRow * 52, animated: false })}
                        renderItem={({ item: year }) => (
                            <View style={styles.yearCell}>
                                <TouchableRipple
                                    accessibilityLabel={`Año ${year}`}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: year === month.getFullYear() }}
                                    borderless
                                    hitSlop={{ top: 6, bottom: 6 }}
                                    onPress={() => chooseYear(year)}
                                    rippleColor={
                                        year === month.getFullYear() && typeof theme.colors.onPrimary === 'string'
                                            ? withAlpha(theme.colors.onPrimary, 0.1)
                                            : theme.colors.stateLayerPressed
                                    }
                                    style={styles.yearTouch}
                                    testID={`${testID}-year-${year}`}
                                >
                                    <View
                                        style={[
                                            styles.yearPill,
                                            {
                                                backgroundColor: year === month.getFullYear() ? theme.colors.primary : 'transparent',
                                                borderWidth: year === new Date().getFullYear() && year !== month.getFullYear() ? 1 : 0,
                                                borderColor: theme.colors.primary,
                                            },
                                        ]}
                                    >
                                        <Text
                                            variant="bodyLarge"
                                            style={{
                                                color:
                                                    year === month.getFullYear()
                                                        ? theme.colors.onPrimary
                                                        : year === new Date().getFullYear()
                                                          ? theme.colors.primary
                                                          : theme.colors.onSurfaceVariant,
                                            }}
                                        >
                                            {year}
                                        </Text>
                                    </View>
                                </TouchableRipple>
                            </View>
                        )}
                        testID={`${testID}-years`}
                        showsVerticalScrollIndicator={props.scrollIndicators?.vertical ?? false}
                        showsHorizontalScrollIndicator={props.scrollIndicators?.horizontal ?? false}
                    />
                </Animated.View>
            ) : view === 'months' ? (
                <Animated.View
                    entering={FadeIn.duration(duration)}
                    exiting={FadeOut.duration(duration)}
                    key="months"
                    style={{ height: 336, flexDirection: 'row', flexWrap: 'wrap' }}
                    testID={`${testID}-months`}
                >
                    {Array.from({ length: 12 }, (_, index) => {
                        const value = calendarDate(month.getFullYear(), index);
                        const disabled =
                            dateKey(calendarDate(month.getFullYear(), index + 1, 0)) < dateKey(minimumDate) ||
                            dateKey(value) > dateKey(maximumDate);
                        return (
                            <View key={index} style={{ width: '50%', height: 56, justifyContent: 'center' }}>
                                <Button
                                    accessibilityState={{ selected: index === month.getMonth() }}
                                    disabled={disabled}
                                    mode={index === month.getMonth() ? 'contained' : 'text'}
                                    onPress={() => {
                                        onMonthChange(clampCalendarMonth(value, minimumDate, maximumDate));
                                        setView('days');
                                    }}
                                    testID={`${testID}-month-${index + 1}`}
                                >
                                    {new Intl.DateTimeFormat(locale, { month: 'long' }).format(value)}
                                </Button>
                            </View>
                        );
                    })}
                </Animated.View>
            ) : (
                <DaysContent
                    {...(props.maximumHeight
                        ? {
                              nestedScrollEnabled: true,
                              showsVerticalScrollIndicator: props.scrollIndicators?.vertical ?? false,
                              showsHorizontalScrollIndicator: props.scrollIndicators?.horizontal ?? false,
                              style: { maxHeight: Math.max(48, props.maximumHeight - navigationHeight), flexGrow: 0 },
                          }
                        : {})}
                >
                    <Animated.View
                        entering={usesPager ? FadeIn.duration(duration) : undefined}
                        key="days"
                        onLayout={(event) => {
                            const nextWidth = event.nativeEvent.layout.width;
                            if (nextWidth !== width) {
                                scrollOffset.set(monthIndex * nextWidth);
                                setWidth(nextWidth);
                            }
                        }}
                    >
                        {props.showWeekdays !== false ? <DatePickerWeekdays firstDayOfWeek={props.firstDayOfWeek} locale={locale} /> : null}
                        {props.navigation === false ? (
                            <MonthGrid {...props} />
                        ) : width > 0 ? (
                            <Animated.View style={[{ overflow: 'hidden' }, gridHeight]}>
                                <Animated.FlatList
                                    data={months}
                                    horizontal
                                    pagingEnabled
                                    bounces={false}
                                    disableIntervalMomentum
                                    decelerationRate="fast"
                                    showsVerticalScrollIndicator={props.scrollIndicators?.vertical ?? false}
                                    showsHorizontalScrollIndicator={props.scrollIndicators?.horizontal ?? false}
                                    initialNumToRender={1}
                                    maxToRenderPerBatch={3}
                                    windowSize={3}
                                    initialScrollIndex={monthIndex}
                                    getItemLayout={(_, index) => ({ index, length: width, offset: index * width })}
                                    key={`month-pager-${width}`}
                                    keyExtractor={dateKey}
                                    ref={listRef}
                                    style={{ height: 288 }}
                                    onScroll={scrollHandler}
                                    scrollEventThrottle={16}
                                    onScrollBeginDrag={() => {
                                        userPaging.current = 'dragging';
                                    }}
                                    onScrollEndDrag={(event) => {
                                        const nativeEvent = event.nativeEvent;
                                        const offset = rtl
                                            ? nativeEvent.contentSize.width -
                                              nativeEvent.layoutMeasurement.width -
                                              nativeEvent.contentOffset.x
                                            : nativeEvent.contentOffset.x;
                                        const index = Math.max(0, Math.min(months.length - 1, Math.round(offset / width)));
                                        userPaging.current = 'settling';
                                        // A drag ending exactly at a page boundary may not emit momentum events.
                                        if (Math.abs(offset - index * width) < 0.5) {
                                            userPaging.current = 'idle';
                                            visibleIndex.current = index;
                                            if (index !== monthIndex) onMonthChange(months[index]);
                                        }
                                    }}
                                    onMomentumScrollEnd={(event) => {
                                        // Programmatic arrow animations can finish after a second arrow press.
                                        // Their callbacks must never roll the selected header back to an old target.
                                        if (userPaging.current !== 'settling') return;
                                        userPaging.current = 'idle';
                                        const eventData = event.nativeEvent;
                                        const offset = rtl
                                            ? eventData.contentSize.width - eventData.layoutMeasurement.width - eventData.contentOffset.x
                                            : eventData.contentOffset.x;
                                        const index = Math.max(0, Math.min(months.length - 1, Math.round(offset / width)));
                                        visibleIndex.current = index;
                                        if (index !== monthIndex) onMonthChange(months[index]);
                                    }}
                                    onScrollToIndexFailed={() =>
                                        listRef.current?.scrollToOffset({ offset: monthIndex * width, animated: false })
                                    }
                                    renderItem={({ item }) => (
                                        <View
                                            accessibilityElementsHidden={dateKey(item) !== dateKey(month)}
                                            importantForAccessibility={dateKey(item) === dateKey(month) ? 'auto' : 'no-hide-descendants'}
                                            style={{ width }}
                                        >
                                            <MonthGrid {...props} month={item} fixedRows />
                                        </View>
                                    )}
                                    testID={`${testID}-month-pager`}
                                />
                            </Animated.View>
                        ) : (
                            <View style={{ height: (rowCounts[monthIndex] ?? 6) * DATE_PICKER_DAY_SIZE }} />
                        )}
                    </Animated.View>
                </DaysContent>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    arrow: { height: 48, margin: 0, width: 48 },
    arrows: { flexDirection: 'row' },
    dockedArrow: { width: 32, height: 32, margin: 0 },
    dockedHeaderGroup: { alignItems: 'center', flexDirection: 'row', flexShrink: 1 },
    dropdown: { alignItems: 'center', justifyContent: 'center', minHeight: 48, paddingHorizontal: 4, borderRadius: 4 },
    calendar: { paddingHorizontal: 12 },
    dayCell: { flex: 1, height: DATE_PICKER_DAY_SIZE, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
    dayCircle: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
    dayTouch: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
    monthHeader: { alignItems: 'center', flexDirection: 'row', height: DATE_PICKER_MONTH_HEADER_HEIGHT, justifyContent: 'space-between' },
    range: { height: 40, left: 0, position: 'absolute', right: 0, top: 4 },
    week: { flexDirection: 'row' },
    weekday: { alignItems: 'center', flex: 1, height: DATE_PICKER_WEEKDAYS_HEIGHT, justifyContent: 'center' },
    yearCell: { width: '33.333333%', height: 52, alignItems: 'center', justifyContent: 'center' },
    yearPill: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 72 },
    yearTouch: { borderRadius: 18, height: 36, width: 72 },
});
