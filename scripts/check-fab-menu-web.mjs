import { chooseOption } from './choose-option.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    out = path.join(root, '.artifacts/fab-menu-web');
fs.mkdirSync(out, { recursive: true });
const server = process.env.WEB_TEST_BASE_URL
    ? undefined
    : spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
const base =
    process.env.WEB_TEST_BASE_URL ??
    (await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.once('exit', (code) => reject(Error('Server exited: ' + code)));
        server.stdout.on('data', (chunk) => {
            const url = String(chunk).match(/http:\/\/[^\s]+/);
            if (url) resolve(url[0]);
        });
    }));
const executablePath =
    process.env.CHROME_PATH ?? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].find(fs.existsSync);
const browser = await chromium.launch({ executablePath, headless: true });
const cases = [],
    errors = [];
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
try {
    const context = await browser.newContext({
            viewport: { width: 1440, height: 1000 },
            permissions: ['clipboard-read', 'clipboard-write'],
        }),
        page = await context.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('response', (r) => {
        if (r.status() >= 400) errors.push(r.status() + ' ' + r.url());
    });
    await page.goto(base + '#/components/fab-menu/overview');
    await page.waitForFunction(() => document.querySelector('[data-component-runtime]')?.getAttribute('aria-busy') === 'false');
    const frame = page.frameLocator('[data-component-runtime]'),
        trigger = frame.getByTestId('fab-menu-trigger'),
        items = frame.getByRole('menuitem');
    assert.equal(
        await frame.locator('#fab-menu-mode').getAttribute('data-choice-value'),
        'expressive',
        'The gallery starts with the Expressive presentation.'
    );
    for (const theme of ['light', 'dark']) {
        if ((await page.locator('html').getAttribute('data-theme')) !== theme) await page.locator('.rail [data-action=theme]').click();
        await poll(
            () => frame.locator('html').getAttribute('data-theme'),
            (v) => v === theme,
            'Expressive theme'
        );
        for (const size of ['default', 'medium', 'large'])
            for (const variant of ['tonalPrimary', 'tonalSecondary', 'tonalTertiary'])
                for (const count of [2, 3, 4, 5, 6]) {
                    await chooseOption(frame, '#fab-menu-size', size);
                    await chooseOption(frame, '#fab-menu-variant', variant);
                    await chooseOption(frame, '#fab-menu-count', String(count));
                    const original = await trigger.evaluate((el) => el.getBoundingClientRect().toJSON());
                    await trigger.click();
                    const pills = frame.locator('[data-testid^="fab-menu-action-"]');
                    assert.equal(await pills.count(), count);
                    await poll(
                        () => trigger.boundingBox(),
                        (b) => Math.abs(b.width - 56) < 0.1 && Math.abs(b.height - 56) < 0.1,
                        'Expressive close reaches 56dp'
                    );
                    await poll(
                        () =>
                            pills.evaluateAll((nodes) =>
                                nodes.every(
                                    (el) =>
                                        Math.abs(
                                            el.getBoundingClientRect().width -
                                                el.parentElement.parentElement.parentElement.getBoundingClientRect().width
                                        ) < 0.2
                                )
                            ),
                        (v) => v,
                        'Expressive pills settle'
                    );
                    const closed = await trigger.evaluate((el) => el.getBoundingClientRect().toJSON());
                    assert.ok(
                        Math.abs(closed.y - original.y) < 1 && Math.abs(closed.x + closed.width - original.x - original.width) < 1,
                        'Close shares original top trailing corner'
                    );
                    for (const pill of await pills.all()) {
                        const geometry = await pill.evaluate((el) => {
                            const surface = el.parentElement.parentElement.parentElement,
                                cs = getComputedStyle(surface);
                            return {
                                height: surface.getBoundingClientRect().height,
                                radius: parseFloat(cs.borderRadius),
                                shadow: cs.boxShadow,
                            };
                        });
                        assert.ok(Math.abs(geometry.height - 56) < 0.2);
                        assert.equal(geometry.radius, 28);
                        assert.equal(geometry.shadow, 'none', 'Menu item has level 0 elevation');
                    }
                    assert.equal(await trigger.getAttribute('aria-label'), 'Cerrar menú');
                    await trigger.click();
                    await poll(
                        () => trigger.getAttribute('aria-expanded'),
                        (v) => v === 'false',
                        'Expressive close'
                    );
                    cases.push({ theme, size, variant, count, check: 'expressive' });
                }
    }
    await chooseOption(frame, '#fab-menu-size', 'default');
    await chooseOption(frame, '#fab-menu-count', '4');
    await trigger.click();
    await trigger.focus();
    await page.keyboard.press('Tab');
    await poll(
        () => frame.getByTestId('fab-menu-action-0').evaluate((el) => el === document.activeElement),
        (v) => v,
        'Expressive close-to-first-action Tab order'
    );
    await page.keyboard.press('Escape');
    await poll(
        () => trigger.getAttribute('aria-expanded'),
        (v) => v === 'false',
        'Expressive Escape'
    );
    await chooseOption(frame, '#fab-menu-size', 'large');
    await chooseOption(frame, '#fab-menu-count', '6');
    await frame.locator('#fab-menu-short').check();
    await trigger.click();
    const compactStack = frame.getByTestId('example-fab-menu-scroll');
    const compactScroll = () => compactStack.evaluate((el) => ({ offset: el.scrollTop, end: el.scrollHeight - el.clientHeight }));
    await poll(
        compactScroll,
        ({ offset, end }) => end > 56 && Math.abs(offset - end) < 1,
        'Short Expressive stack opens next to the close FAB'
    );
    const lastAction = frame.getByTestId('fab-menu-action-5');
    const lastBox = await lastAction.boundingBox(),
        closeBox = await trigger.boundingBox();
    assert.ok(lastBox.y + lastBox.height <= closeBox.y, 'The last action starts above the close FAB');
    const stackBox = await compactStack.boundingBox();
    await page.mouse.move(stackBox.x + stackBox.width - 60, stackBox.y + 36);
    await page.mouse.wheel(0, -500);
    await poll(compactScroll, ({ offset }) => offset < 1, 'Wheel reaches the first action');
    await trigger.focus();
    await page.keyboard.press('PageDown');
    await poll(compactScroll, ({ offset, end }) => Math.abs(offset - end) < 1, 'PageDown returns to the last action');
    await page.keyboard.press('PageUp');
    await poll(compactScroll, ({ offset }) => offset < 1, 'PageUp reaches the first action');
    await page.keyboard.press('Escape');
    await poll(
        () => trigger.getAttribute('aria-expanded'),
        (value) => value === 'false',
        'Compact stack closes'
    );
    await frame.locator('#fab-menu-short').uncheck();
    console.log('PASS: 90 Expressive configurations, flat pills, 56dp close and original corner anchoring.');
    await chooseOption(frame, '#fab-menu-mode', 'anchored');
    const close = async () => {
        await page.keyboard.press('Escape');
        await poll(
            () => trigger.getAttribute('aria-expanded'),
            (v) => v === 'false',
            'close state'
        );
        await poll(
            () => trigger.evaluate((el) => el === document.activeElement),
            (v) => v,
            'focus restored to FAB'
        );
    };
    for (const theme of ['light', 'dark']) {
        if ((await page.locator('html').getAttribute('data-theme')) !== theme) await page.locator('.rail [data-action=theme]').click();
        await poll(
            () => frame.locator('html').getAttribute('data-theme'),
            (v) => v === theme,
            'theme'
        );
        for (const [size, height] of [
            ['default', 56],
            ['medium', 80],
            ['large', 96],
        ]) {
            await chooseOption(frame, '#fab-menu-size', size);
            for (const color of ['tonalPrimary', 'tonalSecondary', 'tonalTertiary', 'primary', 'secondary', 'tertiary']) {
                await chooseOption(frame, '#fab-menu-variant', color);
                const box = await trigger.boundingBox();
                assert.ok(Math.abs(box.height - height) < 0.5 && Math.abs(box.width - height) < 0.5);
                cases.push({ theme, size, color, check: 'trigger' });
            }
            for (const count of [2, 3, 4, 5, 6])
                for (const scenario of ['create', 'share']) {
                    await chooseOption(frame, '#fab-menu-count', String(count));
                    await chooseOption(frame, '#fab-menu-scenario', scenario);
                    await trigger.click();
                    await poll(
                        () => items.count(),
                        (v) => v === count,
                        'action count'
                    );
                    assert.equal(await trigger.getAttribute('aria-haspopup'), 'menu');
                    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
                    await frame.getByRole('menu').waitFor();
                    await poll(
                        () => items.first().evaluate((el) => el === document.activeElement),
                        (v) => v,
                        'initial item focus'
                    );
                    const box = await poll(
                        () => items.first().boundingBox(),
                        (box) => box.height >= 47.9,
                        'Settled minimum action height'
                    );
                    assert.ok(box.height >= 47.9, 'Minimum action height.');
                    const viewport = await frame.locator('html').evaluate(() => ({ width: innerWidth, height: innerHeight })),
                        menu = await frame.getByRole('menu').evaluate((el) => el.getBoundingClientRect().toJSON());
                    assert.ok(
                        menu.x >= -1 &&
                            menu.y >= -1 &&
                            menu.x + menu.width <= viewport.width + 1 &&
                            menu.y + menu.height <= viewport.height + 1,
                        'Anchored menu fits its viewport.'
                    );
                    await close();
                    cases.push({ theme, size, count, scenario, check: 'menu' });
                }
        }
        console.log('PASS: FAB menu ' + theme + ' configurations.');
    }
    await chooseOption(frame, '#fab-menu-size', 'default');
    await chooseOption(frame, '#fab-menu-count', '4');
    await chooseOption(frame, '#fab-menu-scenario', 'create');
    await trigger.focus();
    await trigger.press('ArrowDown');
    await poll(
        () => items.first().evaluate((el) => el === document.activeElement),
        (v) => v,
        'ArrowDown opens first item'
    );
    await page.keyboard.press('End');
    assert.ok(await items.last().evaluate((el) => el === document.activeElement));
    await page.keyboard.press('Home');
    assert.ok(await items.first().evaluate((el) => el === document.activeElement));
    await page.keyboard.press('ArrowDown');
    assert.ok(await items.nth(1).evaluate((el) => el === document.activeElement));
    await page.keyboard.press('d');
    assert.ok(await items.nth(2).evaluate((el) => el === document.activeElement));
    await close();
    await trigger.focus();
    await trigger.press('ArrowUp');
    await poll(
        () => items.last().evaluate((el) => el === document.activeElement),
        (v) => v,
        'ArrowUp opens last item'
    );
    await close();
    await frame.locator('#fab-menu-disabled').check();
    await trigger.click();
    assert.equal(await items.nth(1).getAttribute('aria-disabled'), 'true');
    await items.nth(1).focus();
    const before = await frame.locator('#fab-menu-actions').innerText();
    await page.keyboard.press('Enter');
    assert.equal(await frame.locator('#fab-menu-actions').innerText(), before);
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    await close();
    await frame.locator('#fab-menu-disabled').uncheck();
    await trigger.click();
    const dismiss = Number(await frame.locator('#fab-menu-dismissals').innerText());
    await items.first().click();
    await poll(
        () => frame.locator('#fab-menu-dismissals').innerText(),
        (v) => Number(v) === dismiss + 1,
        'one dismiss per action'
    );
    assert.equal(await frame.locator('#fab-menu-result').innerText(), 'Se creó: Nota 1.');
    await poll(
        () => trigger.evaluate((el) => el === document.activeElement),
        (v) => v,
        'action returns focus'
    );
    await trigger.click();
    await page.keyboard.press('Tab');
    await poll(
        () => trigger.getAttribute('aria-expanded'),
        (v) => v === 'false',
        'Tab leaves menu'
    );
    assert.equal(await frame.locator('body').evaluate(() => Boolean(document.activeElement?.closest('[role=menu]'))), false);
    await trigger.click();
    await frame.locator('[data-testid$="-outside"]').click({ position: { x: 5, y: 5 } });
    await poll(
        () => trigger.getAttribute('aria-expanded'),
        (v) => v === 'false',
        'outside dismissal'
    );
    await chooseOption(frame, '#fab-menu-scenario', 'share');
    await trigger.click();
    await items.first().click();
    await poll(
        () => frame.locator('#fab-menu-result').innerText(),
        (v) => v === 'Enlace copiado.',
        'copy command'
    );
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'https://example.com/coleccion');
    for (const direction of ['ltr', 'rtl']) {
        await chooseOption(frame, '#fab-menu-direction', direction);
        await trigger.click();
        const host = await frame.locator('.fab-menu-scene').boundingBox(),
            box = await trigger.boundingBox();
        assert.ok(direction === 'ltr' ? box.x + box.width > host.x + host.width - 30 : box.x < host.x + 30, 'Logical trailing alignment.');
        await close();
    }
    await chooseOption(frame, '#fab-menu-direction', 'ltr');
    await frame.locator('#fab-menu-short').check();
    await trigger.click();
    await close();
    await frame.locator('#fab-menu-short').uncheck();
    await chooseOption(frame, '#fab-menu-mode', 'scroll');
    await chooseOption(frame, '#fab-menu-scenario', 'create');
    for (const size of ['default', 'medium', 'large'])
        for (const short of [false, true]) {
            await chooseOption(frame, '#fab-menu-size', size);
            await frame.locator('#fab-menu-short').setChecked(short);
            await trigger.click();
            await poll(
                () => trigger.getAttribute('aria-expanded'),
                (v) => v === 'true',
                'stack expanded'
            );
            await poll(
                () => trigger.boundingBox(),
                (b) => Math.abs(b.width - 56) < 1,
                'trigger transforms to close'
            );
            await poll(
                () =>
                    frame
                        .locator('[data-testid^="fab-menu-action-"]')
                        .evaluateAll((nodes) =>
                            nodes.every(
                                (el) =>
                                    Math.abs(
                                        el.getBoundingClientRect().width -
                                            el.parentElement.parentElement.parentElement.getBoundingClientRect().width
                                    ) < 0.2 && el.getBoundingClientRect().width >= 80
                            )
                        ),
                (v) => v,
                'all pill surfaces finish expanding around their content'
            );
            const closeBox = await trigger.boundingBox(),
                scene = await frame.locator('.fab-menu-scene').boundingBox();
            assert.ok(
                closeBox.x >= scene.x &&
                    closeBox.y >= scene.y &&
                    closeBox.x + closeBox.width <= scene.x + scene.width &&
                    closeBox.y + closeBox.height <= scene.y + scene.height,
                'Close remains inside scene.'
            );
            const scroll = frame.getByTestId('example-fab-menu-scroll');
            await scroll.evaluate((el) => {
                el.scrollTop = 0;
                el.dispatchEvent(new Event('scroll'));
            });
            await frame.getByTestId('fab-menu-action-0').click();
            await poll(
                () => trigger.getAttribute('aria-expanded'),
                (v) => v === 'false',
                'scroll action closes'
            );
            cases.push({ size, short, check: 'scroll-extension' });
        }
    for (const direction of ['rtl', 'ltr']) {
        await chooseOption(frame, '#fab-menu-direction', direction);
        await trigger.click();
        await poll(
            () => trigger.boundingBox(),
            (b) => Math.abs(b.width - 56) < 1,
            'stack close settles'
        );
        const host = await frame.locator('.fab-menu-scene').boundingBox(),
            box = await trigger.boundingBox();
        assert.ok(direction === 'ltr' ? box.x + box.width > host.x + host.width - 30 : box.x < host.x + 30, 'Stack trailing alignment.');
        await frame.getByTestId('fab-menu-action-0').focus();
        await page.keyboard.press('Escape');
        await poll(
            () => trigger.getAttribute('aria-expanded'),
            (v) => v === 'false',
            'stack Escape closes'
        );
        await poll(
            () => trigger.evaluate((el) => el === document.activeElement),
            (v) => v,
            'stack restores trigger focus'
        );
    }
    await chooseOption(frame, '#fab-menu-size', 'default');
    await chooseOption(frame, '#fab-menu-mode', 'anchored');
    await frame.locator('#fab-menu-short').uncheck();
    await page.locator('.rail [data-action=motion]').click();
    await trigger.click();
    await items.first().waitFor();
    assert.equal(await items.first().locator('[data-paper-ripple]').count(), 0);
    await close();
    await page.locator('.rail [data-action=motion]').click();
    await trigger.click();
    await page.screenshot({ path: path.join(out, 'fab-menu-desktop.png'), fullPage: true });
    await close();
    for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        await trigger.click();
        await items.first().waitFor();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await close();
    }
    await page.screenshot({ path: path.join(out, 'fab-menu-mobile.png'), fullPage: true });
    assert.deepEqual(errors, []);
    fs.writeFileSync(
        path.join(out, 'results.json'),
        JSON.stringify(
            {
                configurations: cases.length,
                cases,
                checks: [
                    'expressive-presentation',
                    'flat-pills',
                    '56dp-close',
                    'top-trailing-morph',
                    'expressive-tab-order',
                    'trigger-sizes-colors',
                    '2-to-6-actions',
                    'two-scenarios',
                    'menu-role',
                    'keyboard',
                    'disabled-discovery',
                    'one-dismiss',
                    'return-focus',
                    'Tab',
                    'outside',
                    'clipboard',
                    'RTL',
                    'short-height',
                    'scroll-extension',
                    'reduce-motion',
                    'responsive',
                ],
                errors,
            },
            null,
            2
        )
    );
    console.log('PASS: ' + cases.length + ' FAB menu configurations and keyboard/action checks.');
} catch (error) {
    console.error(errors);
    throw error;
} finally {
    await browser.close();
    server?.kill('SIGTERM');
}
