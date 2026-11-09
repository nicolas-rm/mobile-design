// Pure geometry/date checks, using the project's installed TypeScript compiler.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const mobileDesign = true;
const componentDirectory = 'packages/mobile-design/src/components';
function load(relative) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const exports = {};
    vm.runInNewContext(code, { exports, Date, Intl, Math, Number, String, Array, Boolean });
    return exports;
}
const carousel = load(`${componentDirectory}/carousel-layout.ts`);
const dates = load(`${componentDirectory}/date-picker-utils.ts`);
const progress = load(`${componentDirectory}/progress-indicator-paths.ts`);
let frames = 0;
for (const width of [240, 320, 408, 600, 900, 1440]) {
    for (const count of [1, 2, 3, 5, 20]) {
        for (const variant of ['multi-browse', 'hero', 'center-aligned-hero', 'uncontained', 'uncontained-multi-aspect']) {
            for (const reduced of [false, true]) {
                const layout = carousel.createCarouselLayout(width, count, variant, 240, [16 / 9, 9 / 16, 1, 3 / 4], reduced);
                assert(layout.maxOffset >= 0);
                for (let sample = 0; sample <= 30; sample++) {
                    const offset = (layout.maxOffset * sample) / 30;
                    let previous;
                    for (let i = 0; i < count; i++) {
                        const frame = carousel.getCarouselItemFrame(i, offset, layout);
                        assert(Number.isFinite(frame.x) && Number.isFinite(frame.width) && frame.width > 0);
                        if (previous)
                            assert(
                                Math.abs(frame.x - previous.x - previous.width - layout.gap) < 0.00001,
                                `${variant}: overlapping or separated clips`
                            );
                        if (layout.uniform) assert.equal(frame.width, layout.itemWidths[i]);
                        previous = frame;
                        frames++;
                    }
                    const index = carousel.getCarouselIndex(offset, layout);
                    assert(index >= 0 && index < count);
                }
                if (!layout.uniform && layout.maxOffset > 0) {
                    const last = carousel.getCarouselItemFrame(count - 1, layout.maxOffset, layout);
                    assert(Math.abs(last.x + last.width - width) < 0.00001, 'Last item must align to the trailing edge without stretching');
                    assert(Math.abs(last.width - layout.itemWidth) < 0.00001);
                }
            }
        }
    }
}
// Independent golden fixtures from Material Android strategy tests at revision
// 66b0eeb53afeb6025ffbbd37734b08e5bce197ed (gap=0, as in upstream tests).
const goldenLayouts = [
    {
        width: 584,
        height: 200,
        preferred: 200,
        variant: 'multi-browse',
        sizes: [1, 200, 200, 128, 56, 1],
        centers: [-0.5, 100, 300, 464, 556, 584.5],
        lastX: 384,
    },
    {
        width: 456,
        height: 200,
        preferred: 200,
        variant: 'multi-browse',
        sizes: [1, 200, 200, 56, 1],
        centers: [-0.5, 100, 300, 428, 456.5],
        lastX: 256,
    },
    { width: 400, height: 200, preferred: 400, variant: 'hero', sizes: [1, 360, 40, 1], centers: [-0.5, 180, 380, 400.5], lastX: 40 },
    {
        width: 200,
        height: 120,
        preferred: 120,
        variant: 'center-aligned-hero',
        sizes: [1, 40, 120, 40, 1],
        centers: [-0.5, 20, 100, 180, 200.5],
        lastX: 80,
    },
];
for (const fixture of goldenLayouts) {
    const layout = carousel.createCarouselLayout(fixture.width, 10, fixture.variant, fixture.height, [], false, fixture.preferred, 0, 0);
    assert.equal(layout.defaultState.keylines.length, fixture.sizes.length);
    layout.defaultState.keylines.forEach((keyline, index) => {
        assert(Math.abs(keyline.size - fixture.sizes[index]) < 0.00001);
        assert(Math.abs(keyline.offset - fixture.centers[index]) < 0.00001);
    });
    assert(Math.abs(carousel.getCarouselItemFrame(9, layout.maxOffset, layout).x - fixture.lastX) < 0.00001);
}
const mixed = carousel.createCarouselLayout(408, 4, 'uncontained-multi-aspect', 240, [16 / 9, 9 / 16, 1, 3 / 4]);
[(240 * 16) / 9, (240 * 9) / 16, 240, 180].forEach((width, index) => assert(Math.abs(mixed.itemWidths[index] - width) < 0.00001));
for (const value of ['29/02/2028', '29-2-2028', '29.02.2028', '29 2 2028', '29022028'])
    assert.equal(dates.dateKey(dates.parseDateInput(value)), '2028-02-29');
for (const value of ['31/02/2026', '29/02/2027', '00/10/2026', '1/13/2026', '24/10/26', '2026-10-24', 'words', ''])
    assert.equal(dates.parseDateInput(value), undefined);
let grids = 0;
for (let year = 1900; year <= 2100; year++)
    for (let month = 0; month < 12; month++)
        for (let first = 0; first < 7; first++) {
            const grid = dates.getMonthDays(dates.calendarDate(year, month), first);
            assert.equal(grid.length % 7, 0);
            assert.equal(dates.getCalendarMonthRowCount(dates.calendarDate(year, month), first), grid.length / 7);
            const days = grid.filter(Boolean);
            assert.equal(days.length, dates.calendarDate(year, month + 1, 0).getDate());
            assert.equal(days[0].getDate(), 1);
            assert.equal(grid.findIndex(Boolean), (days[0].getDay() - first + 7) % 7);
            grids++;
        }
const minimum = dates.calendarDate(2026, 9, 24);
const maximum = dates.calendarDate(2026, 11, 31);
assert.equal(dates.getDateError(minimum, { minimumDate: minimum, maximumDate: maximum }), undefined);
assert(dates.getDateError(dates.calendarDate(2026, 9, 23), { minimumDate: minimum }));
assert(dates.getDateRangeError({ start: maximum, end: minimum }, {}));
assert.equal(dates.getDateRangeError({ start: dates.calendarDate(2026, 9, 30), end: dates.calendarDate(2026, 10, 2) }, {}), undefined);
assert(
    dates.getDateRangeError(
        { start: dates.calendarDate(2026, 9, 30), end: dates.calendarDate(2026, 10, 2) },
        { isDateDisabled: (date) => date.getDay() === 0 }
    )
);
// Independent motion fixtures evaluated against the upstream M3 timing curves.
const close = (actual, expected, label) => assert(Math.abs(actual - expected) < 0.00015, `${label}: ${actual} != ${expected}`);
for (const [ms, tails] of [
    [1000, [0.4056213998, 1, 0.0076772748, 0.1006206171]],
    [1250, [1, 1, 0.1006206171, 0.3469827974]],
    [1500, [1, 1, 0.3469827974, 1]],
]) {
    const segments = progress.linearProgressSegments(ms / 1750, 0, true);
    [segments[0].start, segments[0].end, segments[1].start, segments[1].end].forEach((value, i) =>
        close(value, tails[i], `Linear at ${ms}ms`)
    );
}
for (const [ms, start, end] of [
    [0, 0, 0.1],
    [300, 0.4, 0.6203389369],
    [1500, 1, 1.775944041],
    [3000, 2, 2.87],
    [4500, 3, 3.194055959],
    [6000, 0, 0.1],
]) {
    const segment = progress.circularProgressSegment(ms / 6000, 0, true);
    close(segment.start, start, `Circular start at ${ms}ms`);
    close(segment.end, end, `Circular end at ${ms}ms`);
}
assert.equal(progress.linearProgressPath(0, 0.5, 240, 4, 4), 'M 2 2 L 120 2');
const remainingTrack = progress.linearTrackSegments([{ start: 0, end: 0.5 }], 240, 4);
close(remainingTrack[0].start, 0.5333333333, '4dp painted track gap');
if (mobileDesign) {
    const initialTrack = progress.linearTrackSegments([{ start: 0, end: 0.01 }], 80, 4);
    close(initialTrack[0].start * 80, 10, 'the initial dot keeps a 4dp gap between the painted caps');
    assert.equal(progress.linearProgressPath(0, 0.01, 80, 4, 4), 'M 2 2 L 2.001 2', 'the initial dot survives SVG rendering');
}
for (const value of [0, 0.1, 0.95, 1]) assert.equal(progress.progressWaveAmplitude(value, false), 0);
for (const value of [0.1001, 0.5, 0.9499]) assert.equal(progress.progressWaveAmplitude(value, false), 1);
assert.equal(progress.progressWaveAmplitude(0, true), 1);
let paths = 0;
for (const value of [0, 0.01, 0.5, 1])
    for (const thickness of [4, 8])
        for (const amplitude of [0, 2, 6])
            for (const wavelength of [16, 24, 48])
                for (const moving of [false, true])
                    for (const unknown of [false, true])
                        for (let phase = 0; phase <= 1; phase += 0.1) {
                            const segments = progress.linearProgressSegments(phase, value, unknown);
                            const circle = progress.circularProgressSegment(phase, value, unknown);
                            const linear = segments
                                .map((line) =>
                                    progress.linearProgressPath(
                                        line.start,
                                        line.end,
                                        320,
                                        thickness + amplitude * 2 + 2,
                                        thickness,
                                        amplitude,
                                        phase,
                                        wavelength
                                    )
                                )
                                .join(' ');
                            const circular = progress.circularProgressPath(circle.start, circle.end, 96, 40, amplitude, phase);
                            assert(!/NaN|Infinity/.test(linear + circular));
                            if (!unknown && value === 0) assert.equal(linear + circular, '');
                            if (!unknown && value === 1) assert(linear && circular);
                            paths += 2;
                        }
console.log(
    `OK ${mobileDesign ? 'mobile-design' : 'app'} (${Intl.DateTimeFormat().resolvedOptions().timeZone}): ${frames} carousel frames, ${grids} calendar grids, 4 upstream layout fixtures, M3 motion timing fixtures, flexible input/range bounds and ${paths} SVG paths.`
);
