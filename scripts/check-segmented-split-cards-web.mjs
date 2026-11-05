import { chooseOption } from './choose-option.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    out = path.join(root, '.artifacts/segmented-split-cards-web');
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
    }),
    errors = [],
    cases = [];
const colors = JSON.parse(fs.readFileSync(path.join(root, 'dist/data.json'))).colors;
const rgb = (v) => v.replace(/^rgba\((.*), 1\)$/, 'rgb($1)');
const poll = async (read, accept, label, timeout = 3000) => {
    let value;
    const start = Date.now();
    do {
        value = await read();
        if (accept(value)) return value;
        await new Promise((r) => setTimeout(r, 20));
    } while (Date.now() - start < timeout);
    assert.fail(label + ': ' + JSON.stringify(value));
};
let page, frame, box;
try {
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1100 },
        permissions: ['clipboard-read', 'clipboard-write'],
    });
    page = await context.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('response', (r) => {
        if (r.status() >= 400) errors.push(r.status() + ' ' + r.url());
    });
    const open = async (id, test) => {
        await page.goto(base + '#/components/' + id + '/overview');
        await page.waitForFunction(() => document.querySelector('[data-component-runtime]')?.getAttribute('aria-busy') === 'false');
        frame = page.frameLocator('[data-component-runtime]');
        await frame.getByTestId(test).waitFor();
        return frame.getByTestId(test);
    };
    const theme = async (t) => {
        if ((await page.locator('html').getAttribute('data-theme')) !== t) await page.getByTestId('docs-icon-theme').first().click();
        await poll(
            () => frame.locator('html').getAttribute('data-theme'),
            (v) => v === t,
            'theme'
        );
    };
    const reduced = async (v) => {
        if (((await page.locator('html').getAttribute('data-reduced')) === 'true') !== v)
            await page.getByTestId('docs-icon-motion').first().click();
        await poll(
            () => frame.locator('html').getAttribute('data-reduced'),
            (r) => (r === 'true') === v,
            'reduced motion'
        );
    };
    if (!process.env.TRIO_FROM) {
        let group = await open('segmented-buttons', 'example-segmented');
        await reduced(true);
        for (const scheme of ['light', 'dark']) {
            await theme(scheme);
            for (const mode of ['single', 'multi'])
                for (const [density, height] of [
                    ['regular', 40],
                    ['small', 36],
                    ['medium', 32],
                    ['high', 28],
                ])
                    for (const content of ['both', 'labels', 'icons'])
                        for (const count of [2, 3, 4, 5]) {
                            await chooseOption(frame, '#segment-mode', mode);
                            await chooseOption(frame, '#segment-density', density);
                            await chooseOption(frame, '#segment-content', content);
                            await chooseOption(frame, '#segment-count', String(count));
                            const targets = group.getByRole(mode === 'single' ? 'radio' : 'checkbox');
                            assert.equal(await targets.count(), count);
                            const boxes = await targets.evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().toJSON()));
                            assert.ok(boxes.every((b) => b.height === 48 && b.width >= 47.9));
                            assert.ok(
                                boxes.every((b) => Math.abs(b.width - boxes[0].width) < 1),
                                'Equal segment widths.'
                            );
                            const visual = targets.first().locator(':scope > div').first();
                            assert.equal((await visual.boundingBox()).height, height);
                            const corner = await targets.first().evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
                            assert.equal(corner, height / 2);
                            let changes = Number(await frame.locator('#segment-changes').innerText());
                            if (mode === 'single') {
                                await targets.first().click();
                                changes = Number(await frame.locator('#segment-changes').innerText());
                                await targets.nth(1).click();
                                assert.equal(await targets.nth(1).getAttribute('aria-checked'), 'true');
                                assert.equal(Number(await frame.locator('#segment-changes').innerText()), changes + 1);
                                await targets.nth(1).click();
                                assert.equal(
                                    Number(await frame.locator('#segment-changes').innerText()),
                                    changes + 1,
                                    'Reselecting a single option retains the value.'
                                );
                            } else {
                                const before = await targets.nth(1).getAttribute('aria-checked');
                                await targets.nth(1).click();
                                assert.notEqual(await targets.nth(1).getAttribute('aria-checked'), before);
                                await targets.nth(1).click();
                                assert.equal(await targets.nth(1).getAttribute('aria-checked'), before);
                            }
                            cases.push({ family: 'SegmentedButtons', scheme, mode, density, content, count });
                        }
        }
        console.log('PASS: 192 Segmented buttons configurations.');
        await chooseOption(frame, '#segment-mode', 'single');
        await chooseOption(frame, '#segment-count', '3');
        await chooseOption(frame, '#segment-content', 'labels');
        await chooseOption(frame, '#segment-density', 'regular');
        const first = group.getByRole('radio').nth(0),
            second = group.getByRole('radio').nth(1),
            last = group.getByRole('radio').nth(2);
        await first.click();
        await first.focus();
        await first.press('ArrowRight');
        assert.ok(await second.evaluate((el) => el === document.activeElement));
        assert.equal(await frame.locator('#segment-value').innerText(), 'walk', 'Arrows do not select.');
        await page.keyboard.press('Space');
        assert.equal(await frame.locator('#segment-value').innerText(), 'transit');
        await page.keyboard.press('End');
        assert.ok(await last.evaluate((el) => el === document.activeElement));
        await page.keyboard.press('Home');
        assert.ok(await first.evaluate((el) => el === document.activeElement));
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');
        assert.ok(await second.evaluate((el) => el === document.activeElement), 'Tab reenters the group at its checked radio.');
        const initialPeriod = frame.getByTestId('period-segments-week');
        assert.equal(await initialPeriod.getAttribute('tabindex'), '0', 'A preset selection is the initial Tab stop.');
        const price = frame.getByTestId('price-segments-1');
        await price.focus();
        await page.keyboard.down('Space');
        await page.keyboard.down('Space');
        assert.equal(await price.getAttribute('aria-checked'), 'false', 'Holding Space has not committed a change.');
        await page.keyboard.up('Space');
        assert.equal(await price.getAttribute('aria-checked'), 'true', 'Releasing Space toggles once.');
        await frame.locator('#segment-disable-middle').check();
        await first.focus();
        await first.press('ArrowRight');
        assert.ok(await last.evaluate((el) => el === document.activeElement), 'Disabled segments skipped.');
        await frame.locator('#segment-disable-middle').uncheck();
        const narrowWidth = (await group.boundingBox()).width;
        await frame.locator('#segment-label').fill('Caminata por el parque');
        await poll(
            () => group.boundingBox(),
            (b) => b.width > narrowWidth + 50,
            'Real font remeasurement'
        );
        await frame.locator('#segment-label').fill('');
        const customLabel = `Ruta d'Ávila "Norte" \\ B`;
        await frame.locator('#segment-label').fill(customLabel);
        const snippet = await frame.locator('.example-code pre').innerText();
        assert.ok(snippet.includes('label: ' + JSON.stringify(customLabel)));
        assert.ok(snippet.includes('accessibilityLabel: ' + JSON.stringify(customLabel)));
        await frame.locator('#segment-label').fill('');
        await chooseOption(frame, '#segment-direction', 'rtl');
        const rtl = await group.getByRole('radio').evaluateAll((nodes) => nodes.map((el) => el.getBoundingClientRect().x));
        assert.ok(rtl[0] > rtl[1] && rtl[1] > rtl[2]);
        await first.focus();
        await first.press('ArrowLeft');
        assert.ok(await second.evaluate((el) => el === document.activeElement));
        await chooseOption(frame, '#segment-direction', 'ltr');
        await first.scrollIntoViewIfNeeded();
        box = await first.boundingBox();
        let before = Number(await frame.locator('#segment-changes').innerText());
        await page.mouse.click(box.x + box.width / 2, box.y + 1);
        assert.equal(await frame.locator('#segment-value').innerText(), 'walk', 'Top of 48dp target works.');
        await reduced(false);
        box = await second.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + 2);
        await page.mouse.down();
        const segmentMask = second.locator('[data-paper-ripple]').last();
        await segmentMask.waitFor({ state: 'attached' });
        assert.equal((await segmentMask.boundingBox()).height, 40, 'Segment indication stays inside the visual surface.');
        await page.mouse.up();
        await frame.locator('#segment-disabled').check();
        before = Number(await frame.locator('#segment-changes').innerText());
        await first.dispatchEvent('click');
        assert.equal(Number(await frame.locator('#segment-changes').innerText()), before);
        await frame.locator('#segment-disabled').uncheck();
        await frame.getByTestId('places-segments-bars').click();
        assert.equal(await frame.locator('#places-results').innerText(), 'Azotea\n$$ · Abierto');
        await frame.getByTestId('cup-segments-large').click();
        await frame.getByTestId('add-drink').click();
        assert.equal(await frame.locator('#drink-result').innerText(), 'Bebida grande añadida al carrito.');
        await frame.getByTestId('period-segments-month').click();
        assert.equal(await frame.locator('#period-result').innerText(), 'Este mes: 19 h 45 min');
        await page.screenshot({ path: path.join(out, 'segmented-desktop.png'), fullPage: true });
    }
    if (process.env.TRIO_FROM !== 'cards') {
        let split = await open('split-button', 'example-split');
        await reduced(true);
        const primary = frame.getByTestId('example-split-primary'),
            toggle = frame.getByTestId('example-split-toggle');
        const sizeTokens = {
            'extra-small': [32, 20, 22, 4],
            small: [40, 20, 22, 4],
            medium: [56, 24, 26, 4],
            large: [96, 32, 38, 8],
            'extra-large': [136, 40, 50, 12],
        };
        const close = async () => {
            await page.keyboard.press('Escape');
            await poll(
                () => toggle.getAttribute('aria-expanded'),
                (v) => v === 'false',
                'split closes'
            );
            await poll(
                () => toggle.evaluate((el) => el === document.activeElement),
                (v) => v,
                'split returns focus'
            );
        };
        for (const scheme of ['light', 'dark']) {
            await theme(scheme);
            for (const [size, [h, icon, menuIcon, inner]] of Object.entries(sizeTokens))
                for (const variant of ['filled', 'tonal', 'outlined', 'elevated'])
                    for (const content of ['both', 'label', 'icon']) {
                        await chooseOption(frame, '#split-size', size);
                        await chooseOption(frame, '#split-variant', variant);
                        await chooseOption(frame, '#split-content', content);
                        await page.mouse.move(4, 4);
                        await frame.locator('#split-size').focus();
                        assert.equal((await primary.boundingBox()).height, Math.max(48, h));
                        assert.equal((await toggle.boundingBox()).height, Math.max(48, h));
                        assert.equal((await primary.locator(':scope > div').first().boundingBox()).height, h);
                        const p = await primary.boundingBox(),
                            t = await toggle.boundingBox();
                        assert.ok(Math.abs(t.x - p.x - p.width - 2) < 0.2, 'Exactly 2dp between halves.');
                        assert.ok(Math.abs(p.y + p.height / 2 - t.y - t.height / 2) < 0.2, 'Split halves share the same vertical center.');
                        const corners = await toggle.evaluate((el) => ({
                            inner: parseFloat(getComputedStyle(el).borderTopLeftRadius),
                            outer: parseFloat(getComputedStyle(el).borderTopRightRadius),
                        }));
                        assert.equal(corners.inner, inner);
                        assert.equal(corners.outer, h / 2);
                        const ink = {
                            filled: 'onPrimary',
                            tonal: 'onSecondaryContainer',
                            outlined: 'onSurfaceVariant',
                            elevated: 'primary',
                        }[variant];
                        assert.equal(
                            await toggle.locator('[style*="font-family: MobileDesign"]').evaluate((el) => getComputedStyle(el).color),
                            rgb(colors[scheme][ink])
                        );
                        assert.equal((await toggle.locator('[style*="font-family: MobileDesign"]').boundingBox()).height, menuIcon);
                        const count = Number(await frame.locator('#split-primary-count').innerText());
                        await primary.click();
                        assert.equal(Number(await frame.locator('#split-primary-count').innerText()), count + 1);
                        await toggle.click();
                        assert.equal(
                            Number(await frame.locator('#split-primary-count').innerText()),
                            count + 1,
                            'Opening menu never sends.'
                        );
                        await frame.getByRole('menuitem', { name: 'Guardar borrador', exact: true }).waitFor();
                        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
                        await close();
                        cases.push({ family: 'SplitButton', scheme, size, variant, content });
                    }
        }
        console.log('PASS: 120 Split button configurations.');
        // Check specimen/usage compositions as well as the configurable example.
        for (const sample of await frame
            .locator(
                '.split-size-list [data-testid="mobile-split-button"], [data-testid="send-split"], [data-testid="buy-split"], [data-testid="route-split"], [data-testid="speed-split"], [data-testid="country-split"]'
            )
            .all()) {
            const a = await sample.locator('[data-testid$="-primary"]').boundingBox(),
                b = await sample.locator('[data-testid$="-toggle"]').boundingBox();
            assert.ok(Math.abs(a.y + a.height / 2 - b.y - b.height / 2) < 0.2, 'Specimen and usage halves must stay centered.');
        }

        await primary.click();
        await poll(
            () => primary.evaluate((el) => el.parentElement.parentElement.style.outlineWidth),
            (v) => v === '0px',
            'Pointer does not leave a focus ring'
        );
        await primary.press('Tab');
        await poll(
            () => toggle.evaluate((el) => el.parentElement.parentElement.style.outlineWidth),
            (v) => v === '3px',
            'Keyboard shows the focus ring'
        );
        await chooseOption(frame, '#split-size', 'small');
        await chooseOption(frame, '#split-content', 'both');
        await toggle.click();
        await frame.getByRole('menuitem', { name: 'Guardar borrador', exact: true }).click();
        await poll(
            () => frame.locator('#split-result').innerText(),
            (v) => v === 'Borrador guardado.',
            'Alternate delivered after exit'
        );
        await frame.locator('#split-disable-action').check();
        await toggle.click();
        const draft = frame.getByRole('menuitem', { name: 'Guardar borrador', exact: true });
        assert.equal(await draft.getAttribute('aria-disabled'), 'true');
        await draft.focus();
        await draft.press('Enter');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        await close();
        await frame.locator('#split-disable-action').uncheck();
        await toggle.click();
        await frame.locator('#split-disabled').evaluate((el) => el.click());
        await poll(
            () => toggle.isDisabled(),
            (v) => v,
            'Block open split'
        );
        await frame.locator('#split-disabled').uncheck();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'Re-enabling does not revive an old menu request.');
        await frame.locator('#split-empty').check();
        assert.ok(await toggle.isDisabled());
        assert.ok(await primary.isEnabled());
        await frame.locator('#split-empty').uncheck();
        await toggle.focus();
        await toggle.press('ArrowDown');
        await frame.getByRole('menuitem').first().waitFor();
        await close();
        await chooseOption(frame, '#split-direction', 'rtl');
        assert.ok((await primary.boundingBox()).x > (await toggle.boundingBox()).x);
        await chooseOption(frame, '#split-direction', 'ltr');
        await reduced(false);
        await toggle.scrollIntoViewIfNeeded();
        box = await toggle.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + 1);
        await page.mouse.down();
        await toggle.locator('[data-paper-ripple]').last().waitFor({ state: 'attached' });
        assert.equal((await toggle.locator('[data-paper-ripple]').last().boundingBox()).height, 40);
        await page.mouse.up();
        await frame.getByRole('menuitem').first().waitFor();
        await close();
        for (let i = 0; i < 4; i++) {
            await toggle.click();
            await page.keyboard.press('Escape');
        }
        await poll(
            () => toggle.getAttribute('aria-expanded'),
            (v) => v === 'false',
            'Interrupted menu settles'
        );
        await frame.getByTestId('send-split-primary').click();
        assert.ok((await frame.locator('#send-result').innerText()).includes('Mensaje enviado:'));
        await frame.getByTestId('send-split-toggle').click();
        await frame.getByRole('menuitem', { name: 'Programar envío', exact: true }).click();
        await frame.locator('#split-date').fill('2026-11-05T12:30');
        await frame.getByTestId('confirm-schedule').click();
        assert.equal(await frame.locator('#send-result').innerText(), 'Envío programado: 2026-11-05 12:30');
        await frame.getByTestId('buy-split-primary').click();
        assert.ok((await frame.locator('#buy-result').innerText()).includes('Carrito: 1'));
        await frame.getByTestId('route-split-toggle').click();
        await frame.getByRole('menuitem', { name: 'Evitar peajes', exact: true }).click();
        await frame.getByTestId('route-split-primary').click();
        assert.equal(await frame.locator('#route-result').innerText(), 'Sin peajes · Navegación iniciada');
        await frame.getByTestId('speed-split-primary').click();
        assert.equal(await frame.locator('#speed-result').innerText(), 'Velocidad seleccionada: 1.5×');
        await frame.getByTestId('country-split-toggle').click();
        await frame.getByRole('menuitemradio', { name: 'Japón', exact: true }).click();
        await poll(
            () => frame.locator('#country-result').innerText(),
            (v) => v === 'Jardines · Kioto',
            'Country filter'
        );
        const customLabel = 'Enviar "A" & <B>';
        await frame.locator('#split-label').fill(customLabel);
        const configCode = await frame.locator('.example-code code').innerText();
        assert.ok(configCode.includes('label={' + JSON.stringify(customLabel) + '}'), 'The custom label is a valid JSX string expression.');
        assert.ok(configCode.includes("key: 'copy'"), 'Copied JSX includes the third live command.');
        await frame.locator('#split-label').fill('Enviar');
        const speedMenu = frame.getByTestId('speed-split-toggle');
        await speedMenu.click();
        assert.equal(await frame.getByRole('menuitemradio', { name: '1.5×', exact: true }).getAttribute('aria-checked'), 'true');
        const slow = frame.getByRole('menuitemradio', { name: '0.5×', exact: true });
        await slow.focus();
        await page.keyboard.press('Space');
        await poll(
            () => frame.locator('#speed-result').innerText(),
            (v) => v === 'Velocidad seleccionada: 0.5×',
            'Space chooses a radio item'
        );
        assert.equal(await frame.getByTestId('country-split-primary').getAttribute('aria-label'), 'Japón');
        await frame.getByTestId('country-split-primary').click();
        assert.match(await frame.locator('#country-result').innerText(), /Filtro aplicado: Japón$/);
        const favorite = frame.getByRole('button', { name: 'Destino favorito', exact: true });
        await favorite.click();
        assert.equal(await favorite.getAttribute('aria-pressed'), 'true');
        await frame.getByTestId('country-split-toggle').click();
        await frame.getByRole('menuitemradio', { name: 'Canadá', exact: true }).click();
        await poll(
            () => favorite.getAttribute('aria-pressed'),
            (v) => v === 'false',
            'Favorites belong to the chosen destination'
        );
        const standalone = await context.newPage();
        try {
            await standalone.setViewportSize({ width: 390, height: 844 });
            await standalone.goto(new URL('runtime/components/index.html?component=split-button', base).href);
            const speedToggle = standalone.getByTestId('speed-split-toggle');
            await speedToggle.scrollIntoViewIfNeeded();
            const scrollY = await standalone.evaluate(() => window.scrollY);
            assert.ok(scrollY > 300, 'The anchor is below the initial viewport');
            await speedToggle.focus();
            await standalone.keyboard.press('ArrowDown');
            const openMenu = standalone.getByRole('menu');
            await openMenu.waitFor();
            const bounds = await openMenu.boundingBox();
            assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 844, 'The popup uses viewport coordinates on a scrolled page');
            assert.equal(await standalone.evaluate(() => window.scrollY), scrollY, 'Focusing the menu preserves document scroll');
        } finally {
            await standalone.close();
        }
        await page.screenshot({ path: path.join(out, 'split-desktop.png'), fullPage: true });
    }
    let card = await open('cards', 'example-card');
    await reduced(true);
    for (const scheme of ['light', 'dark']) {
        await theme(scheme);
        for (const variant of ['elevated', 'filled', 'outlined'])
            for (const interaction of ['container', 'direct'])
                for (const cover of [false, true])
                    for (const state of ['rest', 'dragged', 'disabled']) {
                        await chooseOption(frame, '#card-variant', variant);
                        await chooseOption(frame, '#card-interaction', interaction);
                        await frame.locator('#card-cover').setChecked(cover);
                        await frame.locator('#card-disabled').setChecked(state === 'disabled');
                        await frame.locator('#card-dragged').setChecked(state === 'dragged');
                        const surface = frame.getByTestId('example-card-container');
                        assert.equal(await surface.evaluate((el) => parseFloat(getComputedStyle(el).borderRadius)), 12);
                        assert.equal(await card.locator('button button,a button,button a').count(), 0, 'No nested interactive surface.');
                        const count = Number(await frame.locator('#card-activation-count').innerText());
                        if (state === 'disabled') {
                            if (interaction === 'direct') assert.ok(await card.isDisabled());
                            await card.dispatchEvent('click');
                            assert.equal(Number(await frame.locator('#card-activation-count').innerText()), count);
                        } else if (interaction === 'direct') {
                            await card.click();
                            assert.equal(Number(await frame.locator('#card-activation-count').innerText()), count + 1);
                        } else {
                            await frame.getByTestId('card-explore').click();
                            assert.equal(Number(await frame.locator('#card-activation-count').innerText()), count + 1);
                        }
                        cases.push({ family: 'Card', scheme, variant, interaction, cover, state });
                    }
    }
    console.log('PASS: 72 Card configurations.');
    await frame.locator('#card-disabled').uncheck();
    await frame.locator('#card-dragged').uncheck();
    await frame.locator('#card-cover').check();
    await chooseOption(frame, '#card-interaction', 'direct');
    await card.scrollIntoViewIfNeeded();
    const cover = card.getByTestId('example-card-content-container');
    const coverBox = await cover.boundingBox();
    await page.mouse.move(coverBox.x + coverBox.width / 2, coverBox.y + 30);
    await page.mouse.down();
    await poll(
        () => cover.evaluate((el) => el.nextElementSibling && getComputedStyle(el.nextElementSibling).opacity),
        (value) => value === '0.1',
        'Reduced-motion press feedback paints over the cover'
    );
    assert.equal(await card.locator('[data-paper-ripple]').count(), 0, 'Reduced motion uses a static state layer');
    await page.mouse.up();
    await frame.locator('#card-disabled').uncheck();
    await frame.locator('#card-dragged').uncheck();
    await chooseOption(frame, '#card-interaction', 'direct');
    await reduced(false);
    await card.scrollIntoViewIfNeeded();
    let cardBox = await card.boundingBox();
    await page.mouse.move(cardBox.x + 20, cardBox.y + 20);
    await page.mouse.down();
    await card.locator('[data-paper-ripple]').last().waitFor({ state: 'attached' });
    assert.equal(
        await card
            .locator('[data-paper-ripple]')
            .last()
            .evaluate((el) => parseFloat(getComputedStyle(el).borderRadius)),
        12
    );
    await page.mouse.up();
    await poll(
        () => card.locator('[data-paper-ripple]').count(),
        (v) => v === 0,
        'Card ripple clears'
    );
    const opener = frame.getByTestId('card-open-detail');
    await opener.click();
    await frame.getByTestId('card-close-detail').waitFor();
    await frame.getByTestId('card-detail-save').click();
    assert.equal(await frame.locator('#card-detail-status').innerText(), 'Receta guardada.');
    await frame.getByTestId('card-close-detail').focus();
    await page.keyboard.press('Escape');
    await poll(
        () => frame.locator('.card-detail-scene').getAttribute('data-open'),
        (v) => v === 'false',
        'Detail closes'
    );
    await poll(
        () => opener.evaluate((el) => el === document.activeElement),
        (v) => v,
        'Detail restores focus'
    );
    await frame.getByTestId('card-rating-5').click();
    await frame.getByTestId('card-time-19:00').click();
    await frame.getByTestId('card-expand').click();
    assert.ok(await frame.getByTestId('card-extra').isVisible());
    assert.equal(await frame.getByTestId('card-expand').getAttribute('aria-expanded'), 'true');
    await frame.getByTestId('card-reserve').click();
    assert.ok((await frame.locator('#card-preferences-result').innerText()).includes('19:00 · 5 estrellas'));
    for (const layout of ['grid', 'list', 'horizontal', 'mosaic', 'staggered', 'swipe', 'reorder']) {
        await chooseOption(frame, '#card-layout', layout);
        assert.equal(await frame.locator('[data-testid^="collection-menu-"]').count(), 3);
    }
    await chooseOption(frame, '#card-layout', 'grid');
    await chooseOption(frame, '#card-filter', 'saved');
    await chooseOption(frame, '#card-layout', 'reorder');
    const reorderRows = frame.getByTestId(/^card-reorder-(bread|bao|weekend)$/);
    await frame.getByTestId('collection-menu-weekend').press('Enter');
    await frame.getByRole('menuitem', { name: 'Mover arriba', exact: true }).press('Enter');
    await poll(
        () => reorderRows.nth(1).getAttribute('data-testid'),
        (id) => id === 'card-reorder-weekend',
        'Menu reorders the same cards shown by the drag controls, regardless of the stored filter'
    );
    await chooseOption(frame, '#card-layout', 'grid');
    await chooseOption(frame, '#card-filter', 'all');
    await chooseOption(frame, '#card-sort', 'manual');
    await chooseOption(frame, '#card-layout', 'grid');
    await frame.getByTestId('collection-menu-bread').click();
    await frame.getByRole('menuitem', { name: 'Archivar', exact: true }).click();
    await poll(
        () => frame.getByTestId('collection-card-bread').count(),
        (v) => v === 0,
        'Archive removes complete card'
    );
    await frame.getByTestId('card-undo').click();
    assert.ok(await frame.getByTestId('collection-card-bread').isVisible());
    await chooseOption(frame, '#card-filter', 'saved');
    assert.equal(await frame.getByTestId(/^collection-card-(bread|bao|weekend)$/).count(), 1);
    await chooseOption(frame, '#card-filter', 'all');
    await frame.getByTestId('collection-menu-bread').press('Enter');
    await frame.getByRole('menuitem', { name: 'Archivar', exact: true }).press('Enter');
    await poll(
        () => frame.getByTestId('card-undo').evaluate((el) => el === document.activeElement),
        (v) => v,
        'Keyboard archive focuses Undo'
    );
    await frame.getByTestId('card-undo').press('Enter');
    await poll(
        () => frame.getByTestId('collection-menu-bread').evaluate((el) => el === document.activeElement),
        (v) => v,
        'Undo restores card action focus'
    );
    await frame.getByTestId('collection-menu-weekend').click();
    await frame.getByRole('menuitem', { name: 'Mover arriba', exact: true }).click();
    await poll(
        () =>
            frame
                .getByTestId(/^collection-card-(bread|bao|weekend)$/)
                .first()
                .getAttribute('data-testid'),
        (v) => v === 'collection-card-weekend',
        'Menu reorders without dragging'
    );
    await chooseOption(frame, '#card-layout', 'reorder');
    const handle = frame.getByTestId('card-reorder-bread-handle');
    await handle.scrollIntoViewIfNeeded();
    let h = await handle.boundingBox();
    const rowBefore = await frame.getByTestId('card-reorder-bread').boundingBox();
    await page.mouse.move(h.x + 24, h.y + 24);
    await page.mouse.down();
    await page.mouse.move(h.x + 24, h.y + 255, { steps: 20 });
    await page.mouse.up();
    await poll(
        () => frame.getByTestId('card-reorder-bread').boundingBox(),
        (v) => v.y > rowBefore.y + 60,
        'Physical drag changes the order'
    );
    await chooseOption(frame, '#card-layout', 'swipe');
    const swipe = frame.getByTestId('card-swipe-bread');
    await swipe.scrollIntoViewIfNeeded();
    const swipeBox = await swipe.boundingBox();
    await page.mouse.move(swipeBox.x + swipeBox.width * 0.8, swipeBox.y + swipeBox.height * 0.7);
    await page.mouse.down();
    await page.mouse.move(swipeBox.x + 5, swipeBox.y + swipeBox.height * 0.7, { steps: 20 });
    await page.mouse.up();
    await poll(
        () => swipe.count(),
        (v) => v === 0,
        'Full swipe archives the whole card'
    );
    await frame.getByTestId('card-undo').click();
    await chooseOption(frame, '#card-layout', 'grid');
    await page.screenshot({ path: path.join(out, 'cards-desktop.png'), fullPage: true });
    for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        for (const [id, test] of [
            ['segmented-buttons', 'example-segmented'],
            ['split-button', 'example-split'],
            ['cards', 'example-card'],
        ]) {
            await open(id, test);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page fits ' + id + ' ' + width);
            assert.ok(await frame.locator('body').evaluate((el) => el.scrollWidth <= innerWidth), 'Runtime fits ' + id + ' ' + width);
            assert.equal(await frame.locator('details').count(), 0);
        }
    }
    await page.screenshot({ path: path.join(out, 'cards-mobile.png'), fullPage: true });
    assert.deepEqual(errors, []);
    fs.writeFileSync(
        path.join(out, 'results.json'),
        JSON.stringify(
            {
                configurations: cases.length,
                cases,
                checks: [
                    'equal-width-label-measurement',
                    '48dp-hit-targets',
                    'single-multiple-selection',
                    'roving-keyboard',
                    'disabled',
                    'RTL',
                    'ripple-clipping',
                    'split-command-isolation',
                    'deferred-actions',
                    'empty-actions',
                    'menu-focus',
                    'five-split-uses',
                    'card-interaction-anatomy',
                    'container-detail-transition',
                    'independent-controls',
                    'seven-collection-layouts',
                    'archive-undo-filter-move',
                    '320-390-responsive',
                ],
                errors,
            },
            null,
            2
        )
    );
    console.log('PASS: ' + cases.length + ' configurations and interaction/geometry checks.');
} catch (e) {
    if (page) await page.screenshot({ path: path.join(out, 'failure.png'), fullPage: true }).catch(() => {});
    console.error(errors);
    throw e;
} finally {
    await browser.close();
    server.kill('SIGTERM');
}
