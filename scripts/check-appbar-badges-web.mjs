import { chooseOption } from './choose-option.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    out = path.join(root, '.artifacts/appbar-badges-web');
fs.mkdirSync(out, { recursive: true });
// Freeze the export so a concurrent local rebuild cannot remove in-flight assets.
const snapshot = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-design-appbar-badges-'));
fs.cpSync(path.join(root, 'dist'), snapshot, { recursive: true });
const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: '0', DOCS_DIST_DIR: snapshot },
    stdio: ['ignore', 'pipe', 'pipe'],
});
const base = await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.stdout.on('data', (chunk) => {
        const url = String(chunk).match(/http:\/\/[^\s]+/);
        if (url) resolve(url[0]);
    });
});
const browser = await chromium.launch({
    headless: true,
    executablePath:
        process.env.CHROME_PATH ??
        ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].find(fs.existsSync),
});
const cases = [],
    errors = [];
let page;
const append = cases.push.bind(cases);
cases.push = (...items) => {
    const n = append(...items);
    fs.writeFileSync(
        path.join(out, 'progress.json'),
        JSON.stringify({ completed: n, lastCase: { ...items.at(-1), frames: undefined } }, null, 2)
    );
    return n;
};
const poll = async (read, accept, label) => {
    let v;
    const start = Date.now();
    do {
        v = await read();
        if (accept(v)) return v;
        await new Promise((r) => setTimeout(r, 20));
    } while (Date.now() - start < 4500);
    assert.fail(label + ': ' + JSON.stringify(v));
};
const initial = {
    variant: 'small',
    title: 'Headline',
    subtitle: false,
    align: 'start',
    navigation: 'back',
    actions: 2,
    actionStyle: 'standard',
    wide: false,
    image: false,
    scrolled: false,
    inside: false,
    disabled: false,
    direction: 'ltr',
    motion: 'expressive',
    inset: 0,
};
const open = async (component, scene = '', theme = 'light', reduced = false) => {
    await page.goto(
        base +
            'runtime/components/index.html?component=' +
            component +
            (scene ? '&scene=' + scene : '') +
            '&theme=' +
            theme +
            '&reduced=' +
            reduced
    );
    await page.locator('main').waitFor();
    await page.evaluate(() => document.fonts.ready);
};
const configure = async (configuration) => {
    await page.evaluate(
        (configuration) => window.postMessage({ type: 'mobile-design:window-config', configuration }, location.origin),
        configuration
    );
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
};
const metrics = (selector) =>
    page.locator(selector).evaluate((el) => {
        const b = el.getBoundingClientRect(),
            s = getComputedStyle(el);
        return {
            x: b.x,
            y: b.y,
            w: b.width,
            h: b.height,
            color: s.backgroundColor,
            radius: s.borderTopLeftRadius,
            hidden: el.getAttribute('aria-hidden'),
        };
    });
const record = async (selector, action) => {
    await page.evaluate((selector) => {
        window.__frames = [];
        window.__framesDone = false;
        const start = performance.now();
        const sample = () => {
            const el = document.querySelector(selector),
                b = el?.getBoundingClientRect();
            window.__frames.push({
                t: performance.now() - start,
                h: b?.height,
                opacity: el ? Number(getComputedStyle(el).opacity) : null,
                color: el ? getComputedStyle(el).backgroundColor : null,
            });
            if (performance.now() - start < 900) requestAnimationFrame(sample);
            else window.__framesDone = true;
        };
        sample();
    }, selector);
    await action();
    await page.waitForFunction(() => window.__framesDone);
    return page.evaluate(() => window.__frames);
};
try {
    const context = await browser.newContext({ viewport: { width: 390, height: 600 }, permissions: ['clipboard-read', 'clipboard-write'] });
    page = await context.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('response', (r) => {
        if (r.status() >= 400) errors.push(r.status() + ' ' + r.url());
    });
    await open('app-bars-window');
    for (const theme of ['light', 'dark']) {
        await page.evaluate(
            (theme) => window.postMessage({ type: 'mobile-design:environment', theme, reduced: false }, location.origin),
            theme
        );
        for (const variant of ['search', 'small', 'medium-flexible', 'large-flexible'])
            for (const subtitle of [false, true])
                for (const align of ['start', 'center'])
                    for (const direction of ['ltr', 'rtl']) {
                        const bar = { ...initial, variant, subtitle, align, direction };
                        await configure({ scene: 'playground', bar });
                        const expected =
                            variant === 'small' || variant === 'search'
                                ? 64
                                : variant === 'medium-flexible'
                                  ? subtitle
                                      ? 136
                                      : 112
                                  : subtitle
                                    ? 152
                                    : 120;
                        await poll(
                            () => metrics('[data-testid="example-appbar"]'),
                            (m) => Math.abs(m.h - expected) < 0.2,
                            JSON.stringify(bar)
                        );
                        const m = await metrics('[data-testid="example-appbar"]');
                        assert.equal(m.w, 390);
                        assert.equal(parseFloat(m.radius), 0);
                        const leading = await page.getByTestId('example-appbar-leading-slot').boundingBox(),
                            action = await page.getByTestId('appbar-action-0').boundingBox();
                        assert.equal(
                            direction === 'ltr' ? leading.x < action.x : leading.x > action.x,
                            true,
                            'Logical order reflects once'
                        );
                        for (const target of ['example-appbar-navigation', 'appbar-action-0']) {
                            const b = await page.getByTestId(target).boundingBox();
                            assert.ok(b.width >= 40 && b.height >= 40);
                        }
                        if (variant.includes('flexible'))
                            assert.equal(await page.getByTestId('example-appbar-compact').getAttribute('aria-hidden'), 'true');
                        if (variant !== 'search') {
                            const content = await page
                                .getByTestId('example-appbar-' + (variant.includes('flexible') ? 'expanded' : 'compact') + '-content')
                                .boundingBox();
                            assert.ok(content.x >= 16 && content.x + content.width <= 374.5, 'Title stays inside safe bounds');
                            if (align === 'center')
                                assert.ok(Math.abs(content.x + content.width / 2 - 195) < 0.6, 'Title centers in the whole bar');
                        }
                        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
                        cases.push({ kind: 'appbar-layout', theme, variant, subtitle, align, direction, height: m.h });
                    }
    }
    for (const width of [320, 600, 960]) {
        await page.setViewportSize({ width, height: 600 });
        await configure({ scene: 'playground', bar: { ...initial, variant: 'search', actions: 0, navigation: 'menu' } });
        const field = await page.getByTestId('example-appbar-search-container').boundingBox();
        assert.ok(field.width <= width - 100);
        assert.ok(field.height >= 56);
        cases.push({ kind: 'search-width', width, field });
    }
    await page.setViewportSize({ width: 390, height: 600 });
    for (const motion of ['standard', 'expressive'])
        for (const reduced of [false, true]) {
            await open('app-bars-window', 'scroll-collapse', 'light', reduced);
            await configure({ scene: 'scroll-collapse', bar: { ...initial, motion }, snap: true });
            const expanded = (await page.getByTestId('example-appbar').boundingBox()).height;
            await page.getByTestId('appbar-scroll').hover();
            const frames = await record('[data-testid="example-appbar"]', () => page.mouse.wheel(0, Math.round((expanded - 64) * 0.7)));
            await poll(
                () => page.getByTestId('example-appbar').boundingBox(),
                (b) => Math.abs(b.height - 64) < 0.2,
                'Snap to collapsed'
            );
            assert.equal(await page.getByTestId('example-appbar-compact').getAttribute('aria-hidden'), 'false');
            assert.equal(await page.getByTestId('example-appbar-expanded').getAttribute('aria-hidden'), 'true');
            const intermediate = frames.filter((f) => f.h > 64.3 && f.h < expanded - 1);
            assert.ok(intermediate.length > 0, 'Scroll itself remains continuous');
            cases.push({ kind: 'collapse-snap', motion, reduced, frames });
            await page.mouse.wheel(0, -1000);
            await poll(
                () => page.getByTestId('example-appbar').boundingBox(),
                (b) => Math.abs(b.height - expanded) < 0.2,
                'Return to top'
            );
        }
    await open('app-bars-window', 'scroll-collapse');
    await configure({ scene: 'scroll-collapse', bar: initial, snap: false });
    const expanded = (await page.getByTestId('example-appbar').boundingBox()).height;
    await page.getByTestId('appbar-scroll').hover();
    await page.mouse.wheel(0, 20);
    await page.waitForTimeout(650);
    assert.ok(
        Math.abs((await page.getByTestId('example-appbar').boundingBox()).height - (expanded - 20)) < 1,
        'snap=false preserves partial offset'
    );
    cases.push({ kind: 'snap-disabled' });
    await open('app-bars-window', 'scroll-color');
    const flat = await metrics('[data-testid="example-appbar"]');
    await page.getByTestId('appbar-scroll').hover();
    const colors = await record('[data-testid="example-appbar"]', () => page.mouse.wheel(0, 120));
    assert.equal((await page.getByTestId('example-appbar').boundingBox()).height, 64);
    assert.notEqual((await metrics('[data-testid="example-appbar"]')).color, flat.color);
    assert.ok(new Set(colors.map((f) => f.color)).size > 2);
    cases.push({ kind: 'pinned-color', frames: colors });
    for (const direction of ['ltr', 'rtl']) {
        await open('app-bars-window');
        await configure({ scene: 'playground', bar: { ...initial, variant: 'search', inside: true, direction } });
        const field = await page.getByTestId('example-appbar-search-container').boundingBox();
        const microphone = await page.getByTestId('appbar-voice').boundingBox();
        const trailingGap = direction === 'rtl' ? microphone.x - field.x : field.x + field.width - microphone.x - microphone.width;
        assert.ok(Math.abs(trailingGap - 4) < 0.3, 'Microphone follows the trailing edge of the field');
        cases.push({ kind: 'search-microphone-alignment', direction });
    }
    await open('app-bars-window', 'scroll-hide');
    await page.getByTestId('appbar-scroll').hover();
    await page.mouse.wheel(0, 180);
    await poll(
        () => page.getByTestId('example-appbar').boundingBox(),
        (b) => b.height === 0,
        'Enter always hides'
    );
    await page.keyboard.press('Tab');
    assert.equal(
        await page.getByTestId('example-appbar').evaluate((bar) => bar.contains(document.activeElement)),
        false,
        'Tab skips hidden actions'
    );
    await page.mouse.wheel(0, -80);
    await poll(
        () => page.getByTestId('example-appbar').boundingBox(),
        (b) => Math.abs(b.height - 64) < 0.2,
        'Enter always returns'
    );
    await page.getByTestId('example-appbar-navigation').focus();
    assert.equal(
        await page.getByTestId('example-appbar-navigation').evaluate((button) => button === document.activeElement),
        true,
        'Revealed navigation accepts focus'
    );
    cases.push({ kind: 'enter-always' });
    // Every documented scene mounts its original bar inside an actual viewport.
    const scenes = [
        'podcasts',
        'search-messages',
        'search',
        'search-inbox',
        'search-photos',
        'scroll-color',
        'scroll-hide',
        'scroll-collapse',
        'adaptive-width',
        'adaptive-actions',
        'adaptive-search',
        'transparent',
        'text-wrap',
        'sushi',
        'top-trails',
        'brand',
        'primary-action',
        'compose',
        'collection',
        'rtl',
        'interaction',
    ];
    for (const scene of scenes) {
        await open('app-bars-window', scene);
        await page.getByTestId('example-appbar').waitFor();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert.equal(await page.locator('input[type=file]').isVisible(), false, 'Attachment input stays hidden');
        cases.push({ kind: 'scene', scene });
    }
    await open('app-bars-window', 'search');
    await page.getByTestId('appbar-search-entry').click();
    await page.getByTestId('appbar-search-input').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Borrar búsqueda', exact: true }).count(), 0);
    await page.getByTestId('appbar-search-input').fill('Bosque');
    await page.getByRole('button', { name: 'Borrar búsqueda', exact: true }).click();
    assert.equal(await page.getByTestId('appbar-search-input').inputValue(), '');
    await page.getByTestId('appbar-search-input').fill('Bosque');
    await page.getByTestId('appbar-search-result-0').click();
    await page.getByTestId('appbar-detail-navigation').waitFor();
    await poll(
        () => page.evaluate(() => document.activeElement?.getAttribute('data-testid')),
        (v) => v === 'appbar-detail-navigation',
        'Search continuation receives focus'
    );
    await page.getByTestId('appbar-detail-navigation').click();
    await poll(
        () => page.getByTestId('appbar-detail').count(),
        (v) => v === 0,
        'Detail completes exit'
    );
    await poll(
        () => page.evaluate(() => document.activeElement?.getAttribute('data-testid')),
        (v) => v === 'appbar-search-entry',
        'Search return focus'
    );
    cases.push({ kind: 'search-clear-result-detail' });
    await open('app-bars-window', 'collection');
    await page.getByTestId('appbar-save').click();
    assert.match(await page.getByTestId('appbar-status').innerText(), /guardad/);
    const ready = page.waitForEvent('download');
    await page.getByTestId('appbar-download').click();
    assert.equal((await ready).suggestedFilename(), 'bookstores-in-la.txt');
    cases.push({ kind: 'save-download' });
    await open('app-bars-window', 'sushi');
    await page.getByTestId('appbar-share').click();
    await page.getByTestId('appbar-copy-link').click();
    await poll(
        () => page.evaluate(() => navigator.clipboard.readText()),
        (v) => v.endsWith('#/components/app-bars/overview'),
        'Copy link'
    );
    cases.push({ kind: 'share-copy' });
    await open('app-bars-window', 'compose');
    await page.getByTestId('appbar-recipient').getByRole('textbox').fill('');
    assert.equal(await page.getByTestId('appbar-send').getAttribute('aria-disabled'), 'true');
    await page.getByTestId('appbar-recipient').getByRole('textbox').fill('Alex');
    await page.getByTestId('appbar-message').getByRole('textbox').fill('Hola Alex');
    await page.getByTestId('appbar-send').click();
    assert.equal(await page.getByTestId('appbar-send').getAttribute('aria-disabled'), 'true');
    assert.match(await page.getByTestId('appbar-status').innerText(), /Hola Alex/);
    cases.push({ kind: 'compose-send-once' });
    await open('app-bars-window', 'podcasts');
    await page.getByTestId('appbar-more').click();
    await page.getByTestId('appbar-menu-filter').click();
    await poll(
        () => page.getByTestId('appbar-status').innerText(),
        (v) => v.includes('hoy'),
        'Menu filters podcasts'
    );
    await page.getByTestId('appbar-date').click();
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    const wav = Buffer.alloc(44 + 32000);
    wav.write('RIFF', 0);
    wav.writeUInt32LE(36 + 32000, 4);
    wav.write('WAVEfmt ', 8);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(8000, 24);
    wav.writeUInt32LE(16000, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write('data', 36);
    wav.writeUInt32LE(32000, 40);
    await page.locator('input[type=file]').setInputFiles({ name: 'local-podcast.wav', mimeType: 'audio/wav', buffer: wav });
    await poll(
        () => page.getByTestId('appbar-audio-0').getAttribute('aria-disabled'),
        (v) => v !== 'true',
        'Attached audio enables play'
    );
    await page.getByTestId('appbar-audio-0').click();
    await poll(
        () => page.locator('audio').evaluate((el) => !el.paused && el.currentTime > 0),
        (v) => v,
        'Actual audio playback'
    );
    await page.getByTestId('appbar-audio-0').click();
    await poll(
        () => page.locator('audio').evaluate((el) => el.paused),
        (v) => v,
        'Audio pauses'
    );
    cases.push({ kind: 'podcast-filter-date-and-local-audio' });
    await open('app-bars-window', 'search');
    await page.getByTestId('appbar-account').click();
    await page.getByTestId('appbar-account-work').click();
    await poll(
        () => page.getByTestId('appbar-status').innerText(),
        (v) => v.includes('trabajo'),
        'Account selection'
    );
    await page.getByTestId('example-appbar-navigation').click();
    await page.getByRole('tab', { name: 'Saved', exact: true }).click();
    await poll(
        () => page.getByTestId('appbar-status').innerText(),
        (v) => v.includes('saved'),
        'Modal navigation selection'
    );
    cases.push({ kind: 'account-and-navigation' });
    await open('app-bars-window', 'brand');
    await page.getByTestId('appbar-scroll').hover();
    await page.mouse.wheel(0, 120);
    await page.getByTestId('example-appbar-navigation').click();
    await page.getByTestId('appbar-news-Top-News').click();
    await poll(
        () => page.getByTestId('appbar-scroll').evaluate((el) => el.scrollTop),
        (v) => v === 0,
        'Section returns content to the top'
    );
    await page.getByTestId('example-appbar-navigation').click();
    await page.getByTestId('appbar-news-Saved').click();
    await page.getByTestId('appbar-news-empty').waitFor();
    await page.getByTestId('example-appbar-navigation').click();
    await page.getByTestId('appbar-news-Top-News').click();
    await page.getByTestId('appbar-row-0').click();
    await page.getByRole('button', { name: 'Guardar detalle', exact: true }).click();
    await page.getByTestId('appbar-detail-navigation').click();
    await poll(
        () => page.getByTestId('appbar-detail').count(),
        (v) => v === 0,
        'News detail closes'
    );
    await page.getByTestId('example-appbar-navigation').click();
    await page.getByTestId('appbar-news-Saved').click();
    await page.getByTestId('appbar-row-0').waitFor();
    assert.equal(await page.getByTestId('appbar-row-1').count(), 0);
    cases.push({ kind: 'brand-sections-save-and-filter' });
    await open('app-bars-window', 'scroll-color');
    assert.equal(await page.getByTestId('appbar-open-search').count(), 0);
    await page.getByTestId('appbar-more').click();
    await page.getByTestId('appbar-menu-saved').click();
    await page.getByTestId('appbar-news-empty').waitFor();
    cases.push({ kind: 'news-reference-overflow' });
    await open('app-bars-window', 'search-inbox');
    await page.getByTestId('appbar-voice').click();
    await page.getByTestId('appbar-voice-input').getByRole('textbox').fill('Lee');
    await page.getByTestId('appbar-voice-submit').click();
    await page.getByTestId('appbar-search-input').waitFor();
    assert.equal(await page.getByTestId('appbar-search-input').inputValue(), 'Lee');
    await page.keyboard.press('Escape');
    cases.push({ kind: 'voice-keyboard-continuation' });
    await open('badges');
    await page.getByTestId('example-badge').waitFor();
    await poll(
        () => page.getByTestId('example-badge').innerText(),
        (v) => v === '999+',
        'Badge numeric maximum'
    );
    assert.equal((await page.getByTestId('example-badge').boundingBox()).height, 16);
    await chooseOption(page, '#badge-maximum', '99');
    assert.equal(await page.getByTestId('example-badge').innerText(), '99+');
    await page.locator('#badge-number').fill('0');
    assert.equal(await page.getByTestId('example-badge').innerText(), '0');
    await chooseOption(page, '#badge-content', 'label');
    await page.locator('#badge-label').fill('HELLO');
    assert.equal(await page.getByTestId('example-badge').innerText(), 'HEL+');
    const badgeDestination = page.getByTestId('example-badge-destination');
    assert.equal(await badgeDestination.getAttribute('aria-label'), 'Correo, HELLO');
    await page.locator('#badge-label').fill('   ');
    assert.equal(await badgeDestination.getAttribute('aria-label'), 'Correo');
    assert.equal(await page.getByTestId('example-badged-box-badge').count(), 0);
    assert.equal(await page.getByTestId('example-badge').getAttribute('aria-hidden'), 'true');
    await page.locator('#badge-label').fill('HELLO');
    await chooseOption(page, '#badge-variant', 'dot');
    assert.equal(await badgeDestination.getAttribute('aria-label'), 'Correo, nueva notificación');
    assert.deepEqual(
        await page
            .getByTestId('example-badge')
            .boundingBox()
            .then((b) => [b.width, b.height]),
        [6, 6]
    );
    cases.push({ kind: 'badge-label-and-empty-accessibility' });
    for (const direction of ['ltr', 'rtl'])
        for (const variant of ['dot', 'large']) {
            await chooseOption(page, '#badge-direction', direction);
            await chooseOption(page, '#badge-variant', variant);
            const anchor = await page.getByTestId('example-badged-box-anchor').boundingBox(),
                badge = await page.getByTestId('example-badged-box-badge').boundingBox();
            assert.equal(anchor.width, 24);
            assert.equal(anchor.height, 24);
            assert.ok(
                Math.abs(
                    direction === 'ltr'
                        ? badge.x - anchor.x - (variant === 'dot' ? 18 : 12)
                        : anchor.x + 24 - badge.x - badge.width - (variant === 'dot' ? 18 : 12)
                ) < 0.3
            );
            assert.ok(Math.abs(badge.y + badge.height - anchor.y - (variant === 'dot' ? 6 : 14)) < 0.3);
            assert.equal(await page.getByTestId('example-badged-box-badge').getAttribute('aria-hidden'), 'true');
            cases.push({ kind: 'badge-anchor', variant, direction, anchor, badge });
        }
    const badgeFade = await record('[data-testid="example-badge"]', () => page.locator('#badge-visible').uncheck());
    assert.ok(
        badgeFade.some((f) => f.opacity > 0 && f.opacity < 1),
        'Badge fades through intermediate opacity'
    );
    cases.push({ kind: 'badge-presence-motion', frames: badgeFade });
    assert.equal(await page.getByTestId('example-badge').getAttribute('aria-hidden'), 'true');
    await poll(
        () => page.getByTestId('example-badge').evaluate((el) => Number(getComputedStyle(el).opacity)),
        (v) => v === 0,
        'Badge exits'
    );
    assert.equal(await page.getByTestId('example-badged-box-badge').count(), 0);
    await page.locator('#badge-visible').check();
    await poll(
        () => page.getByTestId('example-badge').evaluate((el) => Number(getComputedStyle(el).opacity)),
        (v) => v === 1,
        'Badge enters'
    );
    for (const row of ['inactive-label', 'inactive-no-label', 'active-label', 'active-bar-no-label', 'active-rail-no-label'])
        for (let index = 0; index < 3; index++)
            assert.equal(
                await page.getByTestId('badge-spec-' + row + '-' + index).count(),
                1,
                'Each of the fifteen configurations is present'
            );
    cases.push({ kind: 'badge-size-count-presence' });
    await open('badges', '', 'dark', true);
    await page.getByTestId('example-badge').waitFor();
    const reducedBadge = await record('[data-testid="example-badge"]', () => page.locator('#badge-visible').uncheck());
    assert.ok(
        reducedBadge.every((f) => f.opacity === 0 || f.opacity === 1),
        'Reduced motion skips Badge interpolation'
    );
    cases.push({ kind: 'badge-reduced-presence', frames: reducedBadge });
    for (const width of [320, 390, 600, 960])
        for (const scenario of ['navigation-bar', 'navigation-rail', 'tabs', 'app-bar', 'travel']) {
            await page.setViewportSize({ width, height: 600 });
            await open('badges-window', scenario);
            await page.getByTestId('badge-appbar').waitFor();
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            cases.push({ kind: 'badge-usage-layout', scenario, width });
        }
    await page.setViewportSize({ width: 390, height: 600 });
    for (const [scenario, key] of [
        ['navigation-bar', 'chat'],
        ['navigation-rail', 'documents'],
    ]) {
        await open('badges-window', scenario);
        const item = page.getByTestId('badge-destination-' + key);
        await item.waitFor();
        for (const [x, y] of [
            [2, 2],
            [2, 60],
            [45, 60],
        ]) {
            await item.click({ position: { x, y } });
            await poll(
                () => item.getAttribute('aria-selected'),
                (v) => v === 'true',
                'Destination selection'
            );
            assert.ok((await item.boundingBox()).height >= 64, 'Interaction target stays full height after selection');
        }
        await item.focus();
        await item.press('Space');
        await poll(
            () => item.getAttribute('aria-selected'),
            (v) => v === 'true',
            'Destination selection'
        );
        await page.getByTestId('badge-record-0').click();
        await poll(
            () => page.evaluate(() => document.activeElement?.getAttribute('data-testid')),
            (v) => v === 'badge-detail-navigation',
            'Record receives focus'
        );
        await page.keyboard.press('Escape');
        await poll(
            () => page.getByTestId('badge-detail').count(),
            (v) => v === 0,
            'Record exit complete'
        );
        await poll(
            () => page.getByTestId('badge-record-0').evaluate((el) => el === document.activeElement || el.contains(document.activeElement)),
            (v) => v,
            'Focus returns to the original record'
        );
        cases.push({ kind: 'full-destination-target-and-detail', scenario });
    }
    await open('badges-window', 'navigation-rail');
    assert.match(await page.getByTestId('badge-destination-photos').getAttribute('aria-label'), /1004 photos/);
    await page.getByTestId('badge-destination-photos').click();
    assert.match(await page.getByTestId('badge-destination-photos').getAttribute('aria-label'), /1004 photos/);
    await page.getByTestId('badge-destination-fonts').focus();
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-testid')), 'badge-destination-documents');
    cases.push({ kind: 'persistent-quantity-and-rail-keyboard' });
    await open('badges-window', 'app-bar');
    const folders = page.getByTestId('badge-destination-folders');
    assert.match(await folders.getAttribute('aria-label'), /nueva notificación/);
    await folders.press('Enter');
    await page.getByTestId('badge-record-count').waitFor();
    await poll(
        () => page.evaluate(() => document.activeElement?.getAttribute('data-testid')),
        (v) => v === 'badge-appbar-navigation',
        'Folder moves focus to its header'
    );
    await page.keyboard.press('Enter');
    await folders.waitFor();
    await poll(
        () => folders.evaluate((button) => button === document.activeElement),
        (v) => v,
        'Focus returns to the folder action'
    );
    assert.equal(await folders.getAttribute('aria-label'), 'Folders');
    assert.equal(await page.getByTestId('badge-action-folders-badge').count(), 0);
    cases.push({ kind: 'badge-folder-focus-and-acknowledgement' });
    await open('badges-window', 'travel');
    await page.getByTestId('badge-flight').click();
    await page.getByTestId('badge-record-state').waitFor();
    assert.match(await page.getByTestId('badge-detail').innerText(), /Johannesburg/);
    cases.push({ kind: 'flight-continuation' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(base + '#/components/app-bars/overview');
    await page.getByTestId('docs-icon-search').filter({ visible: true }).first().click();
    await page.locator('#global-search').fill('Badge');
    await page.getByTestId('docs-search-count').waitFor();
    await poll(
        () => page.getByTestId('docs-search-count').innerText(),
        (v) => Number(v) > 0,
        'Real search count'
    );
    assert.equal(await page.getByTestId('docs-search-count').innerText(), String(await page.locator('#search-results a').count()));
    await page.getByTestId('docs-icon-close-search').click();
    await page.screenshot({ path: path.join(out, 'app-bars-page.png') });
    await page.goto(base + '#/components/badges/overview');
    await page.locator('iframe').first().waitFor();
    await page.screenshot({ path: path.join(out, 'badges-page.png') });
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ cases, errors }, null, 2));
    console.log('PASS: ' + cases.length + ' App bars / Badges layout, motion, keyboard, actions, usage and page-consumption cases.');
} catch (error) {
    fs.writeFileSync(
        path.join(out, 'failure.json'),
        JSON.stringify({ lastCase: cases.at(-1), completed: cases.length, error: String(error), errors }, null, 2)
    );
    throw error;
} finally {
    await browser.close();
    server.kill('SIGTERM');
    fs.rmSync(snapshot, { recursive: true, force: true });
}
