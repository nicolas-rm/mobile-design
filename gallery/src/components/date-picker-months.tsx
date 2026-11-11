import type { ScrollIndicatorOptions } from 'mobile-design/react-native';
import { useMemo, useRef } from 'react';
import { FlatList, View } from 'react-native';
import { DatePickerCalendar, DatePickerWeekdays, DATE_PICKER_DAY_SIZE, DATE_PICKER_MONTH_HEADER_HEIGHT } from './date-picker-calendar';
import { calendarDate, getCalendarMonthRowCount, type DateConstraints } from './date-picker-utils';

type Props = DateConstraints & {
    scrollIndicators?: ScrollIndicatorOptions;
    minimumDate: Date;
    maximumDate: Date;
    month: Date;
    onMonthChange?: (month: Date) => void;
    onSelect: (date: Date) => void;
    start?: Date;
    end?: Date;
    locale: string;
    firstDayOfWeek: number;
    testID: string;
};

/** Virtualized month feed for range selection, including ranges across years. */
export function DatePickerMonths(props: Props) {
    const first = props.minimumDate.getFullYear() * 12 + props.minimumDate.getMonth();
    const last = props.maximumDate.getFullYear() * 12 + props.maximumDate.getMonth();
    const count = last - first + 1;
    const initial = useRef(Math.max(0, Math.min(count - 1, props.month.getFullYear() * 12 + props.month.getMonth() - first))).current;
    const months = useMemo(
        () => Array.from({ length: count }, (_, index) => calendarDate(Math.floor((first + index) / 12), (first + index) % 12)),
        [first, count]
    );
    const positions = useMemo(() => {
        let offset = 0;
        return months.map((month, index) => {
            const length = DATE_PICKER_MONTH_HEADER_HEIGHT + getCalendarMonthRowCount(month, props.firstDayOfWeek) * DATE_PICKER_DAY_SIZE;
            const frame = { index, length, offset };
            offset += length;
            return frame;
        });
    }, [months, props.firstDayOfWeek]);
    const rememberMonth = (offset: number) => {
        let lower = 0;
        let upper = positions.length - 1;
        while (lower < upper) {
            const middle = Math.ceil((lower + upper) / 2);
            if (positions[middle].offset <= Math.max(0, offset)) lower = middle;
            else upper = middle - 1;
        }
        props.onMonthChange?.(months[lower]);
    };
    return (
        <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 12, maxWidth: 360, width: '100%', alignSelf: 'center' }}>
                <DatePickerWeekdays firstDayOfWeek={props.firstDayOfWeek} locale={props.locale} />
            </View>
            <FlatList
                data={months}
                getItemLayout={(_, index) => positions[index]}
                initialNumToRender={3}
                initialScrollIndex={initial}
                onScrollEndDrag={(event) => rememberMonth(event.nativeEvent.contentOffset.y)}
                onMomentumScrollEnd={(event) => rememberMonth(event.nativeEvent.contentOffset.y)}
                keyExtractor={(date) => `${date.getFullYear()}-${date.getMonth()}`}
                renderItem={({ item, index }) => (
                    <View style={{ height: positions[index].length, width: '100%', maxWidth: 360, alignSelf: 'center' }}>
                        <DatePickerCalendar
                            {...props}
                            month={item}
                            navigation={false}
                            showWeekdays={false}
                            onMonthChange={() => {}}
                            testID={props.testID}
                        />
                    </View>
                )}
                style={{ flex: 1, minHeight: 0 }}
                testID={`${props.testID}-month-feed`}
                windowSize={5}
                showsVerticalScrollIndicator={props.scrollIndicators?.vertical ?? false}
                showsHorizontalScrollIndicator={props.scrollIndicators?.horizontal ?? false}
            />
        </View>
    );
}
