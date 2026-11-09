export type DateRange = { start: Date; end: Date };

export type DateConstraints = {
    minimumDate?: Date;
    maximumDate?: Date;
    isDateDisabled?: (date: Date) => boolean;
};

/** Calendar dates use local noon, so parsing never shifts a day through UTC or DST. */
export function calendarDate(year: number, month: number, day = 1) {
    const date = new Date(0);
    date.setHours(12, 0, 0, 0);
    date.setFullYear(year, month, day);
    return date;
}

export function normalizeDate(date: Date) {
    return calendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function dateKey(date: Date) {
    return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDateInput(date?: Date) {
    if (!date || Number.isNaN(date.getTime())) return '';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).padStart(4, '0')}`;
}

/** Accept local day/month/year with common separators, or eight numeric digits. */
export function parseDateInput(value: string) {
    const text = value.trim();
    const match = /^(\d{1,2})[\/ .-]+(\d{1,2})[\/ .-]+(\d{4})$/.exec(text) ?? /^(\d{2})(\d{2})(\d{4})$/.exec(text);
    if (!match) return undefined;
    const [, day, month, year] = match.map(Number);
    if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return undefined;
    const date = calendarDate(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : undefined;
}

export function getDateError(date: Date, constraints: DateConstraints): string | undefined {
    if (Number.isNaN(date.getTime())) return 'La fecha no es válida.';
    if (constraints.minimumDate && dateKey(date) < dateKey(constraints.minimumDate)) {
        return `Elige una fecha a partir del ${formatDateInput(constraints.minimumDate)}.`;
    }
    if (constraints.maximumDate && dateKey(date) > dateKey(constraints.maximumDate)) {
        return `Elige una fecha hasta el ${formatDateInput(constraints.maximumDate)}.`;
    }
    if (constraints.isDateDisabled?.(normalizeDate(date))) return 'Esta fecha no está disponible.';
    return undefined;
}

export function getDateRangeError(range: DateRange, constraints: DateConstraints): string | undefined {
    const error = getDateError(range.start, constraints) ?? getDateError(range.end, constraints);
    if (error) return error;
    if (dateKey(range.end) < dateKey(range.start)) return 'La fecha final debe ser igual o posterior a la inicial.';

    if (constraints.isDateDisabled) {
        for (
            let date = normalizeDate(range.start);
            dateKey(date) <= dateKey(range.end);
            date = calendarDate(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        ) {
            if (constraints.isDateDisabled(date)) return 'El periodo incluye fechas no disponibles.';
        }
    }
    return undefined;
}

/** Row count without allocating the grid; used by native list measurements. */
export function getCalendarMonthRowCount(month: Date, firstDayOfWeek: number) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const offset = (calendarDate(year, monthIndex).getDay() - firstDayOfWeek + 7) % 7;
    return Math.ceil((offset + calendarDate(year, monthIndex + 1, 0).getDate()) / 7);
}

export function getMonthDays(month: Date, firstDayOfWeek: number) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const offset = (calendarDate(year, monthIndex).getDay() - firstDayOfWeek + 7) % 7;
    const days = calendarDate(year, monthIndex + 1, 0).getDate();
    const cells = getCalendarMonthRowCount(month, firstDayOfWeek) * 7;

    return Array.from({ length: cells }, (_, index) => {
        const day = index - offset + 1;
        return day > 0 && day <= days ? calendarDate(year, monthIndex, day) : undefined;
    });
}

export function clampCalendarMonth(date: Date, minimumDate: Date, maximumDate: Date) {
    const validDate = Number.isNaN(date.getTime()) ? new Date() : date;
    const key = dateKey(validDate);
    const boundedDate = key < dateKey(minimumDate) ? minimumDate : key > dateKey(maximumDate) ? maximumDate : validDate;
    return calendarDate(boundedDate.getFullYear(), boundedDate.getMonth());
}
