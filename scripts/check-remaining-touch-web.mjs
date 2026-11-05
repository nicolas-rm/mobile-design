import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    out = path.join(root, '.artifacts/remaining-touch-web');
fs.mkdirSync(out, { recursive: true });
const snapshot = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-design-touch-'));
fs.cpSync(process.env.MOBILE_DESIGN_DOCS_TEST_DIST_DIR ?? path.join(root, 'dist'), snapshot, { recursive: true });
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
const poll = async (read, accept) => {
    let value;
    for (let i = 0; i < 120; i++) {
        value = await read();
        if (accept(value)) return value;
        await page.waitForTimeout(25);
    }
    assert.fail('Did not settle: ' + JSON.stringify(value));
};
try {
    const context = await browser.newContext({ viewport: { width: 390, height: 680 }, hasTouch: true, isMobile: true });
    page = await context.newPage();
    page.setDefaultTimeout(5000);
    page.on('pageerror', (error) => errors.push(String(error)));
    const cdp = await context.newCDPSession(page);
    const drag = async (x, y, dx, dy) => {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        for (let step = 1; step <= 18; step++) {
            await cdp.send('Input.dispatchTouchEvent', {
                type: 'touchMove',
                touchPoints: [{ x: x + (dx * step) / 18, y: y + (dy * step) / 18 }],
            });
            await page.waitForTimeout(18);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    const open = async (family, direction = 'ltr', reduced = false) => {
        await page.goto(
            base +
                'runtime/components/index.html?component=catalog-window&family=' +
                family +
                '&direction=' +
                direction +
                '&reduced=' +
                reduced
        );
        await page.locator('main').waitFor();
        await page.evaluate(() => document.fonts.ready);
    };
    for (const direction of ['ltr', 'rtl']) {
        await open('tabs', direction);
        const scroll = page.getByTestId('catalog-tabs-pages-scroll');
        await scroll.scrollIntoViewIfNeeded();
        await poll(
            () => scroll.evaluate((el) => ({ x: el.scrollLeft, max: el.scrollWidth - el.clientWidth })),
            (v) => Math.abs(v.x - (direction === 'rtl' ? v.max : 0)) < 1
        );
        const b = await scroll.boundingBox();
        await drag(b.x + b.width * (direction === 'rtl' ? 0.2 : 0.8), b.y + b.height / 2, b.width * (direction === 'rtl' ? 0.7 : -0.7), 0);
        await poll(
            () => page.getByTestId('catalog-tabs-primary-trips').getAttribute('aria-selected'),
            (v) => v === 'true'
        );
        await page.screenshot({ path: path.join(out, 'tabs-' + direction + '.png') });
        cases.push({ family: 'tabs', kind: 'touch-swipe-commits-page', direction });
    }
    await open('carousel');
    const scroll = page.getByTestId('md-carousel-multi-browse-scroll');
    await scroll.waitFor();
    await page.waitForTimeout(200);
    const b = await scroll.boundingBox();
    await drag(b.x + b.width * 0.85, b.y + b.height / 2, -b.width * 0.7, 0);
    await poll(
        () => scroll.evaluate((el) => el.scrollLeft),
        (v) => v > 100
    );
    await page.waitForTimeout(500);
    cases.push({ family: 'carousel', kind: 'touch-scroll-and-snap', offset: await scroll.evaluate((el) => el.scrollLeft) });
    await open('sliders');
    const thumb = page.getByTestId('catalog-slider-continuous-thumb'),
        track = page.getByTestId('catalog-slider-continuous');
    await thumb.waitFor();
    const t = await thumb.boundingBox(),
        r = await track.boundingBox();
    await drag(t.x + t.width / 2, t.y + t.height / 2, r.x + r.width * 0.85 - (t.x + t.width / 2), 0);
    await poll(
        () => thumb.getAttribute('aria-valuenow'),
        (v) => Number(v) > 70
    );
    cases.push({ family: 'sliders', kind: 'touch-drag-updates-controlled-value', value: await thumb.getAttribute('aria-valuenow') });
    await open('date-pickers');
    await page.getByTestId('catalog-date-docked').getByRole('button').click();
    const month = page.locator('[data-testid$="-month-toggle"]');
    await month.waitFor();
    await poll(
        () => page.evaluate(() => document.activeElement?.getAttribute('data-mobile-design-date')),
        (v) => Boolean(v)
    );
    await page.keyboard.press('Shift+M');
    await poll(
        () => page.evaluate(() => document.activeElement?.getAttribute('data-testid')),
        (v) => v?.endsWith('-month-toggle')
    );
    assert.equal(await month.getAttribute('aria-expanded'), 'false');
    await page.keyboard.press('Enter');
    await poll(
        () => month.getAttribute('aria-expanded'),
        (v) => v === 'true'
    );
    cases.push({ family: 'date-pickers', kind: 'month-shortcut-focus-then-explicit-activation' });
    await open('loading-indicator', 'ltr', true);
    await page.getByTestId('md-loading-start').click();
    const loader = page.getByTestId('md-loading-working');
    await loader.waitFor();
    const frames = await loader.evaluate(
        (el) =>
            new Promise((resolve) => {
                const frames = [],
                    start = performance.now();
                const sample = () => {
                    frames.push([...el.querySelectorAll('path')].map((path) => path.getAttribute('d')).join('|'));
                    if (performance.now() - start < 600) requestAnimationFrame(sample);
                    else resolve(frames);
                };
                sample();
            })
    );
    assert.equal(new Set(frames).size, 1, 'Reduced motion does not keep morphing');
    cases.push({ family: 'loading-indicator', kind: 'reduced-motion-static-shape', frames: frames.length });
    assert.deepEqual(errors, []);
    console.log('PASS:', cases.length, 'touch, shortcut and reduced-motion checks');
} finally {
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ cases, errors }, null, 2));
    if (page) await page.screenshot({ path: path.join(out, 'last-state.png') }).catch(() => {});
    await browser.close();
    server.kill();
    fs.rmSync(snapshot, { recursive: true, force: true });
}
