import { chooseOption } from './choose-option.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    out = path.join(root, '.artifacts/fab-icon-web');
fs.mkdirSync(out, { recursive: true });
const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
});
const base = await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('exit', (c) => reject(Error('Server exited ' + c)));
    server.stdout.on('data', (c) => {
        const u = String(c).match(/http:\/\/[^\s]+/);
        if (u) resolve(u[0]);
    });
});
const browser = await chromium.launch({
    executablePath:
        process.env.CHROME_PATH ??
        ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].find(fs.existsSync),
    headless: true,
});
const errors = [],
    cases = [];
const poll = async (read, accept, label) => {
    let value;
    const start = Date.now();
    do {
        value = await read();
        if (accept(value)) return value;
        await new Promise((r) => setTimeout(r, 20));
    } while (Date.now() - start < 2500);
    assert.fail(label + ': ' + JSON.stringify(value));
};
const colors = JSON.parse(fs.readFileSync(path.join(root, 'dist/data.json'))).colors;
const rgb = (v) => v.replace(/^rgba\((.*), 1\)$/, 'rgb($1)');
const radius = (b) => b.evaluate((el) => parseFloat(getComputedStyle(el).borderRadius));
const glyph = (b) => b.locator('[style*="font-family: MobileDesign"]');
const visual = (b) => b.locator(':scope > div').first();
try {
    const context = await browser.newContext({
            viewport: { width: 1440, height: 1100 },
            permissions: ['clipboard-read', 'clipboard-write'],
        }),
        page = await context.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('response', (r) => {
        if (r.status() >= 400) errors.push(r.status() + ' ' + r.url());
    });
    const open = async (id, testID) => {
        await page.goto(base + '#/components/' + id + '/overview');
        await page.waitForFunction(() => document.querySelector('[data-component-runtime]')?.getAttribute('aria-busy') === 'false');
        const f = page.frameLocator('[data-component-runtime]');
        await f.getByTestId(testID).waitFor();
        return f;
    };
    let frame = await open('floating-action-button', 'example-fab'),
        fab = frame.getByTestId('example-fab');
    const reduced = async (value) => {
        if (((await page.locator('html').getAttribute('data-reduced')) === 'true') !== value)
            await page.getByTestId('docs-icon-motion').first().click();
        await poll(
            () => frame.locator('html').getAttribute('data-reduced'),
            (v) => (v === 'true') === value,
            'motion propagation'
        );
    };
    const theme = async (value) => {
        if ((await page.locator('html').getAttribute('data-theme')) !== value) await page.getByTestId('docs-icon-theme').first().click();
        await poll(
            () => frame.locator('html').getAttribute('data-theme'),
            (v) => v === value,
            'theme propagation'
        );
    };
    await reduced(true);
    const fabTokens = { default: [56, 16, 24], medium: [80, 20, 28], large: [96, 28, 36] },
        roles = {
            tonalPrimary: ['primaryContainer', 'onPrimaryContainer'],
            tonalSecondary: ['secondaryContainer', 'onSecondaryContainer'],
            tonalTertiary: ['tertiaryContainer', 'onTertiaryContainer'],
            primary: ['primary', 'onPrimary'],
            secondary: ['secondary', 'onSecondary'],
            tertiary: ['tertiary', 'onTertiary'],
        };
    for (const scheme of ['light', 'dark']) {
        await theme(scheme);
        for (const [size, [height, corner, icon]] of Object.entries(fabTokens))
            for (const [variant, [fill, ink]] of Object.entries(roles)) {
                await chooseOption(frame, '#fab-size', size);
                await chooseOption(frame, '#fab-variant', variant);
                const b = await fab.boundingBox(),
                    g = await glyph(fab).boundingBox();
                assert.equal(b.width, height);
                assert.equal(b.height, height);
                assert.equal(await radius(fab), corner);
                assert.ok(Math.abs(g.height - icon) < 1);
                assert.ok(
                    Math.abs(g.x + g.width / 2 - b.x - b.width / 2) < 0.6 && Math.abs(g.y + g.height / 2 - b.y - b.height / 2) < 0.6,
                    'FAB icon centered'
                );
                assert.equal(
                    await fab.evaluate((el) => getComputedStyle(el.parentElement.parentElement).backgroundColor),
                    rgb(colors[scheme][fill])
                );
                assert.equal(await glyph(fab).evaluate((el) => getComputedStyle(el).color), rgb(colors[scheme][ink]));
                const count = Number(await frame.locator('#fab-activation-count').innerText());
                await fab.click();
                assert.equal(Number(await frame.locator('#fab-activation-count').innerText()), count + 1);
                cases.push({ family: 'FAB', scheme, size, variant });
            }
    }
    await fab.focus();
    let count = Number(await frame.locator('#fab-activation-count').innerText());
    await fab.press('Enter');
    await fab.press('Space');
    assert.equal(Number(await frame.locator('#fab-activation-count').innerText()), count + 2);
    await frame.locator('#fab-visible').uncheck();
    await poll(
        () => fab.getAttribute('tabindex'),
        (v) => v === '-1',
        'hidden FAB removed from keyboard'
    );
    await frame.locator('#fab-visible').check();
    const usage = frame.getByTestId('usage-fab');
    await usage.scrollIntoViewIfNeeded();
    const pos = await usage.boundingBox();
    await frame.locator('#fab-scroll-content').evaluate((el) => {
        el.scrollTop = 300;
    });
    assert.deepEqual(await usage.boundingBox(), pos, 'FAB remains pinned during content scroll.');
    for (const [scenario, result] of [
        ['mail', 'Mensaje enviado.'],
        ['checkout', 'Compra confirmada.'],
        ['article', 'Artículo publicado.'],
        ['tasks', 'Tarea creada.'],
        ['flights', '3 vuelos disponibles para tu destino.'],
    ]) {
        await chooseOption(frame, '#fab-scenario', scenario);
        assert.match(
            await glyph(usage).evaluate((el) => getComputedStyle(el).fontVariationSettings),
            /"FILL" 1/,
            'The scenario uses a filled Material Symbol.'
        );
        await usage.click();
        await frame.locator('#fab-usage-field').fill('Ejemplo completo');
        await frame.getByTestId('fab-submit').click();
        await poll(
            () => frame.locator('.fab-scene').getAttribute('data-open'),
            (v) => v === 'false',
            'task closes'
        );
        assert.equal(await frame.locator('#fab-usage-result').innerText(), result);
        await poll(
            () => usage.evaluate((el) => el === document.activeElement),
            (v) => v,
            'Focus returns to FAB.'
        );
    }
    await usage.click();
    await frame.locator('#fab-usage-field').press('Escape');
    await poll(
        () => frame.locator('.fab-scene').getAttribute('data-open'),
        (v) => v === 'false',
        'Escape cancels'
    );
    await chooseOption(frame, '#fab-direction', 'rtl');
    assert.equal(await frame.locator('.fab-scene').getAttribute('dir'), 'rtl');
    await chooseOption(frame, '#fab-direction', 'ltr');
    await reduced(false);
    const tooltip = frame.getByRole('tooltip').filter({ hasText: 'Crear contenido' });
    await fab.focus();
    await tooltip.waitFor();
    const tooltipId = await tooltip.getAttribute('id');
    assert.ok(tooltipId);
    assert.equal(await fab.getAttribute('aria-describedby'), tooltipId, 'Focused FAB points to its tooltip.');
    await fab.press('Escape');
    await tooltip.waitFor({ state: 'hidden' });
    assert.equal(await fab.getAttribute('aria-describedby'), null, 'The closed tooltip releases its description.');
    assert.ok(await fab.evaluate((el) => el === document.activeElement), 'Escape keeps focus on the FAB.');
    await fab.hover();
    await tooltip.waitFor();
    assert.equal(await fab.getAttribute('aria-describedby'), await tooltip.getAttribute('id'), 'Pointer tooltip is described too.');
    await page.screenshot({ path: path.join(out, 'fabs.png'), fullPage: true });
    console.log('PASS: 36 FAB configurations, geometry, semantic colors, focus, pinned scroll, 5 tasks and cancellation.');
    frame = await open('icon-buttons', 'example-icon-button');
    const button = frame.getByTestId('example-icon-button');
    await reduced(true);
    const tokens = {
        'extra-small': { h: 32, i: 20, p: [4, 6, 10], s: 12, press: 8 },
        small: { h: 40, i: 24, p: [4, 8, 14], s: 12, press: 8 },
        medium: { h: 56, i: 24, p: [12, 16, 24], s: 16, press: 12 },
        large: { h: 96, i: 32, p: [16, 32, 48], s: 28, press: 16 },
        'extra-large': { h: 136, i: 40, p: [32, 48, 72], s: 28, press: 16 },
    };
    for (const scheme of ['light', 'dark']) {
        await theme(scheme);
        for (const type of ['default', 'toggle']) {
            await chooseOption(frame, '#icon-type', type);
            for (const treatment of ['filled', 'tonal', 'outlined', 'standard']) {
                await chooseOption(frame, '#icon-treatment', treatment);
                for (const [size, t] of Object.entries(tokens))
                    for (const [index, width] of ['narrow', 'default', 'wide'].entries())
                        for (const shape of ['round', 'square']) {
                            await chooseOption(frame, '#icon-size', size);
                            await chooseOption(frame, '#icon-width', width);
                            await chooseOption(frame, '#icon-shape', shape);
                            if (type === 'toggle') await frame.locator('#icon-selected').uncheck();
                            const v = await visual(button).boundingBox(),
                                b = await button.boundingBox(),
                                g = await glyph(button).boundingBox();
                            assert.equal(v.height, t.h);
                            assert.equal(v.width, t.i + t.p[index] * 2);
                            assert.equal(b.height, Math.max(48, t.h));
                            assert.equal(b.width, Math.max(48, v.width));
                            assert.equal(await radius(button), shape === 'round' ? t.h / 2 : t.s);
                            assert.equal(g.height, t.i);
                            assert.ok(
                                Math.abs(g.y + g.height / 2 - b.y - b.height / 2) < 0.7 &&
                                    Math.abs(g.x + g.width / 2 - b.x - b.width / 2) < 0.7,
                                'Icon centered in target.'
                            );
                            const ink =
                                treatment === 'filled'
                                    ? type === 'toggle'
                                        ? 'onSurfaceVariant'
                                        : 'onPrimary'
                                    : treatment === 'tonal'
                                      ? 'onSecondaryContainer'
                                      : 'onSurfaceVariant';
                            assert.equal(await glyph(button).evaluate((el) => getComputedStyle(el).color), rgb(colors[scheme][ink]));
                            const fill =
                                treatment === 'filled'
                                    ? type === 'toggle'
                                        ? 'surfaceContainer'
                                        : 'primary'
                                    : treatment === 'tonal'
                                      ? 'secondaryContainer'
                                      : undefined;
                            assert.equal(
                                await button.evaluate((el) => getComputedStyle(el.parentElement.parentElement).backgroundColor),
                                fill ? rgb(colors[scheme][fill]) : 'rgba(0, 0, 0, 0)'
                            );
                            count = Number(await frame.locator('#icon-activation-count').innerText());
                            await button.click();
                            assert.equal(Number(await frame.locator('#icon-activation-count').innerText()), count + 1);
                            assert.equal(await button.getAttribute('aria-pressed'), type === 'toggle' ? 'true' : null);
                            if (type === 'toggle') assert.equal(await radius(button), shape === 'round' ? t.s : t.h / 2);
                            cases.push({ family: 'IconButton', scheme, type, treatment, size, width, shape });
                        }
            }
        }
        console.log('PASS: IconButton ' + scheme + ' matrix.');
    }
    await chooseOption(frame, '#icon-type', 'default');
    await chooseOption(frame, '#icon-size', 'extra-small');
    await chooseOption(frame, '#icon-width', 'narrow');
    await chooseOption(frame, '#icon-shape', 'round');
    await chooseOption(frame, '#icon-treatment', 'filled');
    await button.scrollIntoViewIfNeeded();
    let b = await button.boundingBox();
    count = Number(await frame.locator('#icon-activation-count').innerText());
    for (const [x, y] of [
        [2, 24],
        [46, 24],
        [24, 2],
        [24, 46],
    ])
        await page.mouse.click(b.x + x, b.y + y);
    assert.equal(Number(await frame.locator('#icon-activation-count').innerText()), count + 4, 'All sides of the 48dp target activate.');
    await reduced(false);
    await button.scrollIntoViewIfNeeded();
    b = await button.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    const mask = button.locator('[data-paper-ripple]').last();
    await mask.waitFor({ state: 'attached' });
    const maskBox = await mask.boundingBox(),
        surfaceBox = await visual(button).boundingBox();
    assert.ok(
        Math.abs(maskBox.width - surfaceBox.width) < 0.1 && Math.abs(maskBox.height - surfaceBox.height) < 0.1,
        'The 48dp target does not enlarge the visible ripple.'
    );
    await page.mouse.up();
    await chooseOption(frame, '#icon-size', 'medium');
    await button.scrollIntoViewIfNeeded();
    await poll(
        () => radius(button),
        (v) => Math.abs(v - 28) < 0.2,
        'resting shape'
    );
    b = await button.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    const samples = await button.evaluate(
        (el) =>
            new Promise((resolve) => {
                const values = [],
                    start = performance.now();
                const run = () => {
                    const r = parseFloat(getComputedStyle(el).borderRadius),
                        mask = el.querySelector('[data-paper-ripple]');
                    values.push({ r, mask: mask ? parseFloat(getComputedStyle(mask).borderRadius) : undefined });
                    if (performance.now() - start < 200) requestAnimationFrame(run);
                    else resolve(values);
                };
                run();
            })
    );
    assert.ok(
        samples.some((v) => v.r > 12.5 && v.r < 27.5),
        'Intermediate morph frames.'
    );
    assert.ok(
        samples.every((v) => v.mask === undefined || Math.abs(v.r - v.mask) < 0.1),
        'Ripple follows the changing shape.'
    );
    await page.mouse.up();
    await poll(
        () => radius(button),
        (v) => Math.abs(v - 28) < 0.2,
        'release settles'
    );
    for (let i = 0; i < 6; i++) await button.click({ delay: 8 });
    await poll(
        () => radius(button),
        (v) => Math.abs(v - 28) < 0.2,
        'rapid presses settle'
    );
    b = await button.boundingBox();
    count = Number(await frame.locator('#icon-activation-count').innerText());
    await page.mouse.move(b.x + 20, b.y + 20);
    await page.mouse.down();
    await page.mouse.move(b.x - 80, b.y);
    await page.mouse.up();
    assert.equal(Number(await frame.locator('#icon-activation-count').innerText()), count, 'Outside release cancels.');
    await frame.locator('#icon-disabled').check();
    await button.dispatchEvent('click');
    assert.equal(Number(await frame.locator('#icon-activation-count').innerText()), count);
    assert.ok(await button.isDisabled());
    await frame.locator('#icon-disabled').uncheck();
    await frame.locator('#icon-loading').check();
    assert.equal(await button.getAttribute('aria-busy'), 'true');
    await button.dispatchEvent('click');
    assert.equal(Number(await frame.locator('#icon-activation-count').innerText()), count);
    await frame.locator('#icon-loading').uncheck();
    await button.focus();
    await button.press('Enter');
    await button.press('Space');
    assert.equal(Number(await frame.locator('#icon-activation-count').innerText()), count + 2);
    const favorite = frame.getByTestId('usage-favorite');
    const bookmark = frame.getByTestId('usage-bookmark');
    await favorite.focus();
    const favoriteTip = frame.getByRole('tooltip').filter({ hasText: 'Añadir a favoritos' });
    await favoriteTip.waitFor();
    assert.equal(await favorite.getAttribute('aria-describedby'), await favoriteTip.getAttribute('id'));
    assert.equal(await favorite.getAttribute('aria-pressed'), 'false');
    await favorite.press('Enter');
    assert.equal(await favorite.getAttribute('aria-label'), 'Favorito', 'A toggle keeps its accessible name.');
    assert.equal(await favorite.getAttribute('aria-pressed'), 'true');
    assert.equal(await bookmark.getAttribute('aria-pressed'), 'false', 'Favorite and bookmark are independent.');
    await bookmark.click();
    assert.equal(await frame.locator('#icon-saved-state').innerText(), 'En favoritos · Artículo guardado');
    await frame.getByTestId('usage-play').click();
    await frame.getByTestId('usage-next').click();
    assert.equal(await frame.locator('#icon-track').innerText(), 'In the Dark · Reproduciendo');
    await frame.getByTestId('usage-previous').click();
    assert.equal(await frame.locator('#icon-track').innerText(), 'Long Walk · Reproduciendo');
    const media = await Promise.all(['usage-previous', 'usage-play', 'usage-next'].map((id) => frame.getByTestId(id).boundingBox()));
    assert.ok(
        media.every((x) => Math.abs(x.y + x.height / 2 - media[0].y - media[0].height / 2) < 1),
        'Different sizes share a center.'
    );
    await frame.getByTestId('usage-mic').click();
    await frame.getByTestId('usage-camera').click();
    await frame.getByTestId('usage-hand').click();
    assert.equal(await frame.locator('#icon-call-state').innerText(), 'Micrófono silenciado · Cámara apagada · Mano levantada');
    await frame.getByTestId('usage-leave').click();
    await frame.getByRole('button', { name: 'Volver a unirme', exact: true }).click();
    assert.ok(await frame.getByTestId('usage-mic').isVisible());
    const menuTrigger = frame.getByTestId('usage-more');
    assert.equal(await menuTrigger.getAttribute('aria-haspopup'), 'menu');
    assert.equal(await menuTrigger.getAttribute('aria-expanded'), 'false');
    await menuTrigger.click();
    assert.equal(await menuTrigger.getAttribute('aria-expanded'), 'true');
    assert.equal(await menuTrigger.getAttribute('aria-pressed'), null);
    await frame.getByRole('menuitem', { name: 'Copiar título' }).click();
    await poll(
        () => frame.locator('#icon-menu-result').innerText(),
        (v) => v === 'Título copiado.',
        'clipboard menu'
    );
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'Mi artículo');
    await menuTrigger.click();
    await page.keyboard.press('Escape');
    assert.ok(await menuTrigger.evaluate((el) => el === document.activeElement));
    assert.equal(await menuTrigger.getAttribute('aria-expanded'), 'false');
    await chooseOption(frame, '#icon-direction', 'rtl');
    await chooseOption(frame, '#icon-motion', 'standard');
    await button.click();
    await poll(
        () => radius(button),
        (v) => Math.abs(v - 28) < 0.2,
        'standard release'
    );
    for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page fits narrow viewport.');
        assert.ok(await frame.locator('body').evaluate((el) => el.scrollWidth <= innerWidth), 'Runtime fits narrow viewport.');
    }
    await page.screenshot({ path: path.join(out, 'icon-buttons-mobile.png'), fullPage: true });
    assert.equal(await frame.locator('details').count(), 0);
    assert.ok(await frame.locator('.example-code pre').isVisible());
    await page.goto(base + '#/components/fab-menu/api');
    await page.locator('.contract-type').first().waitFor();
    assert.equal(await page.locator('details').count(), 0);
    assert.ok(await page.locator('.contract-type table').first().isVisible(), 'Related contracts are always visible.');
    const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }),
        touchPage = await touch.newPage();
    touchPage.on('pageerror', (e) => errors.push(String(e)));
    for (const [id, target, counter] of [
        ['floating-action-button', 'example-fab', 'fab-activation-count'],
        ['icon-buttons', 'example-icon-button', 'icon-activation-count'],
    ]) {
        await touchPage.goto(base + '#/components/' + id + '/overview');
        const f = touchPage.frameLocator('[data-component-runtime]'),
            t = f.getByTestId(target);
        await t.waitFor();
        await t.scrollIntoViewIfNeeded();
        const box = await t.boundingBox();
        await touchPage.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        assert.equal(await f.locator('#' + counter).innerText(), '1', 'Touch activates once.');
    }
    await touch.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(
        path.join(out, 'results.json'),
        JSON.stringify(
            {
                configurations: cases.length,
                cases,
                checks: [
                    '48dp-edge-hit-testing',
                    'ripple-mask-morph',
                    'cancel',
                    'rapid-presses',
                    'keyboard',
                    'disabled-loading',
                    'semantic-colors',
                    'pinned-FAB',
                    'five-tasks',
                    'media-centering',
                    'menu-focus-clipboard',
                    'toggle-actions',
                    'RTL',
                    'motion',
                    '320-390-responsive',
                    'expanded-code-and-contracts',
                    'touch',
                ],
                errors,
            },
            null,
            2
        )
    );
    console.log(
        'PASS: ' +
            cases.length +
            ' configurations; shared touch target, animation, complete actions, keyboard, focus, responsive and expanded content.'
    );
} finally {
    await browser.close();
    server.kill('SIGTERM');
}
