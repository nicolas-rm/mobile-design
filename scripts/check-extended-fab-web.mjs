import { chooseOption } from './choose-option.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    artifacts = path.join(root, '.artifacts/extended-fab-web');
fs.mkdirSync(artifacts, { recursive: true });
const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
});
const base = await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('exit', (code) => reject(Error('Server exited: ' + code)));
    server.stdout.on('data', (chunk) => {
        const url = String(chunk).match(/http:\/\/[^\s]+/);
        if (url) resolve(url[0]);
    });
});
const executablePath =
    process.env.CHROME_PATH ?? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].find(fs.existsSync);
const browser = await chromium.launch({ executablePath, headless: true });
const errors = [],
    cases = [];
let page;
const poll = async (read, accept, label) => {
    let value;
    const start = Date.now();
    do {
        value = await read();
        if (accept(value)) return value;
        await new Promise((r) => setTimeout(r, 20));
    } while (Date.now() - start < 3000);
    assert.fail(label + ': ' + JSON.stringify(value));
};
const sizeTokens = {
    default: { height: 56, radius: 16, icon: 24, padding: 16, gap: 8 },
    medium: { height: 80, radius: 20, icon: 28, padding: 26, gap: 12 },
    large: { height: 96, radius: 28, icon: 36, padding: 28, gap: 16 },
};
const colors = JSON.parse(fs.readFileSync(path.join(root, 'dist/data.json'))).colors;
const roles = {
    tonalPrimary: ['primaryContainer', 'onPrimaryContainer'],
    tonalSecondary: ['secondaryContainer', 'onSecondaryContainer'],
    tonalTertiary: ['tertiaryContainer', 'onTertiaryContainer'],
    primary: ['primary', 'onPrimary'],
    secondary: ['secondary', 'onSecondary'],
    tertiary: ['tertiary', 'onTertiary'],
};
try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    page = await context.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('response', (r) => {
        if (r.status() >= 400) errors.push(r.status() + ' ' + r.url());
    });
    await page.goto(base + '#/components/extended-fab/overview');
    await page.waitForFunction(() => document.querySelector('[data-component-runtime]')?.getAttribute('aria-busy') === 'false');
    const frame = page.frameLocator('[data-component-runtime]'),
        fab = frame.getByTestId('example-fab');
    for (const theme of ['light', 'dark']) {
        if ((await page.locator('html').getAttribute('data-theme')) !== theme) await page.locator('.rail [data-action=theme]').click();
        await poll(
            () => frame.locator('html').getAttribute('data-theme'),
            (v) => v === theme,
            'theme propagation'
        );
        for (const [size, t] of Object.entries(sizeTokens))
            for (const [variant, [fill, ink]] of Object.entries(roles))
                for (const icon of [false, true])
                    for (const expanded of [false, true]) {
                        await chooseOption(frame, '#fab-size', size);
                        await chooseOption(frame, '#fab-variant', variant);
                        await frame.locator('#fab-icon').setChecked(icon);
                        await frame.locator('#fab-expanded').setChecked(expanded);
                        const label = fab.getByText('Redactar', { exact: true }),
                            textWidth = await label.evaluate((el) => {
                                const range = document.createRange();
                                range.selectNodeContents(el);
                                return range.getBoundingClientRect().width;
                            });
                        const target =
                            icon && !expanded
                                ? t.height
                                : Math.max(t.height, t.padding * 2 + (icon ? t.icon + t.gap : 0) + Math.round(textWidth) + 1);
                        await poll(
                            () => fab.boundingBox(),
                            (box) => Math.abs(box.width - target) < 1 && Math.abs(box.height - t.height) < 0.5,
                            'measured geometry ' + JSON.stringify({ theme, size, variant, icon, expanded, target, textWidth })
                        );
                        assert.equal(await fab.getAttribute('aria-label'), 'Redactar');
                        const style = await fab.evaluate((el) => ({
                            radius: parseFloat(getComputedStyle(el).borderRadius),
                            fill: getComputedStyle(el.parentElement.parentElement).backgroundColor,
                            ink: getComputedStyle(
                                [...el.querySelectorAll('*')].find((n) => n.textContent === 'Redactar' && n.childElementCount === 0)
                            ).color,
                        }));
                        assert.equal(style.radius, t.radius);
                        assert.equal(style.fill, colors[theme][fill].replace(/^rgba\((.*), 1\)$/, 'rgb($1)'));
                        assert.equal(style.ink, colors[theme][ink].replace(/^rgba\((.*), 1\)$/, 'rgb($1)'));
                        if (icon) {
                            const box = await fab.locator('[style*="font-family: MobileDesign"]').boundingBox();
                            assert.ok(Math.abs(box.height - t.icon) < 1);
                            assert.ok(
                                Math.abs(box.y + box.height / 2 - (await fab.boundingBox()).y - t.height / 2) < 1,
                                'icon vertical centering'
                            );
                            if (!expanded) {
                                const host = await fab.boundingBox();
                                assert.ok(
                                    Math.abs(box.x + box.width / 2 - host.x - host.width / 2) < 1,
                                    'collapsed icon horizontal centering'
                                );
                            }
                        }
                        const before = Number(await frame.locator('#fab-activation-count').innerText());
                        await fab.click();
                        await poll(
                            () => frame.locator('#fab-activation-count').innerText(),
                            (v) => Number(v) === before + 1,
                            'single activation'
                        );
                        cases.push({ theme, size, variant, icon, expanded });
                    }
        console.log('PASS: Extended FAB ' + theme + ' matrix.');
    }
    await chooseOption(frame, '#fab-size', 'default');
    await chooseOption(frame, '#fab-variant', 'tonalPrimary');
    await frame.locator('#fab-icon').check();
    await frame.locator('#fab-expanded').check();
    const ring = () => frame.getByTestId('example-fab-container').locator('div[style*="border-width: 3px"]').count();
    await fab.click();
    assert.equal(await ring(), 0, 'Pointer activation has no keyboard focus ring.');
    await frame.locator('#fab-visible').focus();
    await page.keyboard.press('Tab');
    assert.ok(await fab.evaluate((el) => el === document.activeElement));
    await poll(ring, (v) => v === 1, 'keyboard ring');
    let before = Number(await frame.locator('#fab-activation-count').innerText());
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    assert.equal(Number(await frame.locator('#fab-activation-count').innerText()), before + 2);
    await frame.locator('#fab-size').focus();
    assert.equal(await ring(), 0);
    await poll(
        () => fab.locator('[data-paper-ripple]').count(),
        (v) => v === 0,
        'indication clears'
    );
    await fab.scrollIntoViewIfNeeded();
    let box = await fab.boundingBox();
    await page.mouse.move(box.x + 12, box.y + 12);
    await page.mouse.down();
    await fab.locator('[data-paper-ripple]').last().waitFor({ state: 'attached' });
    const mask = await fab
        .locator('[data-paper-ripple]')
        .last()
        .evaluate((el) => getComputedStyle(el).borderRadius);
    assert.equal(parseFloat(mask), 16);
    await page.mouse.up();
    const expandedWidth = (await fab.boundingBox()).width;
    await frame.locator('#fab-expanded').uncheck();
    const samples = await fab.evaluate(
        (el) =>
            new Promise((resolve) => {
                const samples = [],
                    start = performance.now();
                function sample() {
                    samples.push(el.getBoundingClientRect().width);
                    if (performance.now() - start < 180) requestAnimationFrame(sample);
                    else resolve(samples);
                }
                sample();
            })
    );
    assert.ok(
        samples.some((v) => v > 57 && v < expandedWidth - 1),
        'Collapse has intermediate geometry.'
    );
    await poll(
        () => fab.boundingBox(),
        (b) => Math.abs(b.width - 56) < 0.2,
        'collapse settles'
    );
    for (let i = 0; i < 8; i++) await frame.locator('#fab-expanded').setChecked(i % 2 === 0);
    await frame.locator('#fab-expanded').check();
    await poll(
        () => fab.boundingBox(),
        (b) => Math.abs(b.width - expandedWidth) < 0.3,
        'interrupted expansion settles'
    );
    await frame.locator('#fab-label').fill('Guardar borrador');
    await poll(
        () => fab.boundingBox(),
        (b) => b.width > expandedWidth + 30,
        'label remeasurement'
    );
    for (const direction of ['ltr', 'rtl']) {
        await chooseOption(frame, '#fab-direction', direction);
        const icon = await fab.locator('[style*="font-family: MobileDesign"]').boundingBox(),
            text = await fab.getByText('Guardar borrador', { exact: true }).boundingBox();
        assert.ok(direction === 'ltr' ? icon.x < text.x : icon.x > text.x, 'icon order ' + direction);
    }
    await chooseOption(frame, '#fab-direction', 'ltr');
    before = Number(await frame.locator('#fab-activation-count').innerText());
    await frame.locator('#fab-visible').uncheck();
    assert.ok(await fab.isDisabled());
    assert.equal(await frame.getByTestId('example-fab-container').getAttribute('aria-hidden'), 'true');
    await fab.dispatchEvent('click');
    assert.equal(Number(await frame.locator('#fab-activation-count').innerText()), before);
    await frame.locator('#fab-visible').focus();
    await page.keyboard.press('Tab');
    assert.equal(await fab.evaluate((el) => el === document.activeElement), false, 'Hidden FAB is skipped by Tab.');
    await frame.locator('#fab-visible').check();
    await page.locator('.rail [data-action=motion]').click();
    await poll(
        () => frame.locator('html').getAttribute('data-reduced'),
        (v) => v === 'true',
        'reduced motion'
    );
    await frame.locator('#fab-expanded').uncheck();
    assert.ok(Math.abs((await fab.boundingBox()).width - 56) < 0.01);
    await page.locator('.rail [data-action=motion]').click();
    await frame.locator('#fab-expanded').check();
    const usage = frame.getByTestId('usage-fab'),
        scroll = frame.locator('#fab-scroll-content');
    await usage.scrollIntoViewIfNeeded();
    const full = (await usage.boundingBox()).width;
    await scroll.evaluate((el) => (el.scrollTop = 300));
    await poll(
        () => usage.boundingBox(),
        (b) => Math.abs(b.width - 56) < 0.3,
        'scroll down collapses'
    );
    await scroll.evaluate((el) => (el.scrollTop = 200));
    await poll(
        () => usage.boundingBox(),
        (b) => Math.abs(b.width - full) < 0.3,
        'scroll up expands before the top'
    );
    await scroll.evaluate((el) => (el.scrollTop = 300));
    await poll(
        () => usage.boundingBox(),
        (b) => Math.abs(b.width - 56) < 0.3,
        'scroll down collapses before the end'
    );
    await scroll.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await poll(
        () => usage.boundingBox(),
        (b) => Math.abs(b.width - full) < 0.3,
        'reaching the end restores the label'
    );
    await scroll.evaluate((el) => (el.scrollTop = 0));
    for (const [scenario, field, result] of [
        ['mail', 'Una nueva conversación', 'Mensaje enviado.'],
        ['checkout', 'Calle Diseño 123', 'Compra confirmada.'],
        ['article', 'Mi nueva historia', 'Artículo publicado.'],
        ['tasks', 'Revisar el componente', 'Tarea creada.'],
        ['flights', 'Mérida', '3 vuelos disponibles para tu destino.'],
    ]) {
        await chooseOption(frame, '#fab-scenario', scenario);
        await usage.click();
        await frame.locator('#fab-usage-field').waitFor();
        await poll(
            () => frame.locator('#fab-usage-field').evaluate((el) => el === document.activeElement),
            (v) => v,
            'form initial focus'
        );
        assert.ok(await frame.getByTestId('fab-submit').isDisabled(), 'Empty form cannot submit');
        await frame.locator('#fab-usage-field').fill(field);
        if (scenario === 'mail') {
            const body = frame.getByRole('textbox', { name: 'Mensaje' });
            await body.fill('Primera línea\nSegunda línea');
            assert.equal(await body.inputValue(), 'Primera línea\nSegunda línea');
            await frame.locator('#fab-usage-field').press('Enter');
        } else await frame.getByTestId('fab-submit').click();
        await poll(
            () => frame.locator('.fab-scene').getAttribute('data-open'),
            (v) => v === 'false',
            'form closes'
        );
        assert.equal(await frame.locator('#fab-usage-result').innerText(), result);
        await poll(
            () => usage.evaluate((el) => el === document.activeElement),
            (v) => v,
            'focus restored'
        );
    }
    await usage.click();
    await frame.locator('#fab-usage-field').press('Escape');
    await poll(
        () => frame.locator('.fab-scene').getAttribute('data-open'),
        (v) => v === 'false',
        'Escape closes'
    );
    await chooseOption(frame, '#fab-alignment', 'center');
    const scene = await frame.locator('.fab-scene').boundingBox();
    await poll(
        () => usage.boundingBox(),
        (b) => Math.abs(b.x + b.width / 2 - scene.x - scene.width / 2) < 1,
        'center placement'
    );
    await frame.locator('#fab-rail').check();
    await frame.getByTestId('usage-rail-fab').click();
    await frame.getByTestId('fab-cancel').click();
    await poll(
        () => frame.locator('.fab-scene').getAttribute('data-open'),
        (v) => v === 'false',
        'rail action cancellation'
    );
    await frame.locator('#fab-rail').uncheck();
    await page.screenshot({ path: path.join(artifacts, 'extended-fab-desktop.png'), fullPage: true });
    for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        await chooseOption(frame, '#fab-size', 'large');
        await frame.locator('#fab-label').fill('Guardar borrador');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert.ok(await frame.locator('main').evaluate((el) => el.scrollWidth <= innerWidth));
    }
    await page.screenshot({ path: path.join(artifacts, 'extended-fab-mobile.png'), fullPage: true });
    const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }),
        mobile = await touch.newPage();
    await mobile.goto(base + 'runtime/components/index.html?component=extended-fab');
    await mobile.getByTestId('example-fab').tap();
    assert.equal(await mobile.locator('#fab-activation-count').innerText(), '1');
    await touch.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(
        path.join(artifacts, 'results.json'),
        JSON.stringify(
            {
                matrix: cases.length,
                cases,
                checks: [
                    'measurement',
                    'tokens',
                    'colors',
                    'icon-alignment',
                    'keyboard',
                    'focus',
                    'pointer-mask',
                    'morph-interruption',
                    'visibility',
                    'reduced-motion',
                    'RTL',
                    'scroll',
                    'container-transform',
                    'five-actions',
                    'cancel',
                    'responsive',
                    'touch',
                ],
                errors,
            },
            null,
            2
        )
    );
    console.log(`PASS: ${cases.length} Extended FAB configurations and interaction/usage checks.`);
} catch (error) {
    console.error(errors);
    if (page) await page.screenshot({ path: path.join(artifacts, 'failure.png'), fullPage: true }).catch(() => {});
    throw error;
} finally {
    await browser.close();
    server.kill('SIGTERM');
}
