import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium, firefox, webkit } from 'playwright-core';

const server = process.env.WEB_TEST_BASE_URL
    ? undefined
    : spawn(process.execPath, ['scripts/serve.mjs'], {
          cwd: new URL('..', import.meta.url),
          env: { ...process.env, PORT: '0' },
          stdio: ['ignore', 'pipe', 'inherit'],
      });
const base =
    process.env.WEB_TEST_BASE_URL ??
    (await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.once('exit', (code) => reject(new Error(`Server exited (${code})`)));
        server.stdout.on('data', (chunk) => {
            const url = String(chunk).match(/http:\/\/[^\s]+/);
            if (url) resolve(url[0]);
        });
    }));
const engines = { chromium, firefox, webkit };
const chrome =
    process.env.CHROME_PATH ?? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium'].find(existsSync);
const controlsByRuntime = {
    'app-bars': 11,
    badges: 7,
    'button-groups': 13,
    buttons: 6,
    cards: 6,
    'extended-fab': 6,
    'fab-menu': 7,
    'floating-action-button': 7,
    'icon-buttons': 7,
    carousel: 5,
    'segmented-buttons': 6,
    'split-button': 5,
    text: 7,
};

try {
    for (const name of (process.env.WEB_CHOICE_ENGINES ?? 'chromium').split(',')) {
        const browser = await engines[name].launch(name === 'chromium' && chrome ? { executablePath: chrome } : {});
        try {
            const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            await page.goto(`${base}#/components/button-groups/overview`);
            const gallery = page.frameLocator('[data-component-runtime=button-groups]');
            const variant = gallery.getByRole('combobox', { name: 'Variante', exact: true });
            const variantField = gallery.getByTestId('group-variant');
            const treatment = gallery.getByRole('combobox', { name: 'Tratamiento', exact: true });
            await variant.waitFor();
            assert.equal(await gallery.locator('select').count(), 0);
            assert.equal(await variant.inputValue(), 'Standard');
            await variantField.click();
            const list = gallery.getByRole('listbox', { name: 'Variante', exact: true });
            await list.getByRole('option', { name: 'Connected', exact: true }).click();
            assert.equal(await variant.getAttribute('data-choice-value'), 'connected');
            assert.equal(await variant.getAttribute('aria-expanded'), 'false');
            assert.ok(await variant.evaluate((el) => el === el.ownerDocument.activeElement));
            assert.equal(await variant.evaluate((el) => getComputedStyle(el).outlineWidth), '0px');

            await variant.press('Home');
            assert.match(await variant.getAttribute('aria-activedescendant'), /standard$/);
            await variant.press('Escape');
            assert.equal(await variant.getAttribute('data-choice-value'), 'connected');
            await variant.press('Home');
            await variant.press('Tab');
            assert.equal(await variant.getAttribute('data-choice-value'), 'standard');
            const size = gallery.getByRole('combobox', { name: 'Tamaño', exact: true });
            assert.ok(await size.evaluate((el) => el === el.ownerDocument.activeElement));
            await treatment.press('End');
            assert.match(await treatment.getAttribute('aria-activedescendant'), /outlined$/);
            await treatment.press('Enter');
            assert.equal(await treatment.getAttribute('data-choice-value'), 'outlined');
            await treatment.press('t');
            assert.match(await treatment.getAttribute('aria-activedescendant'), /tonal$/);
            await treatment.press('Escape');

            await page.setViewportSize({ width: 320, height: 680 });
            await variantField.evaluate((el) => el.scrollIntoView({ block: 'center' }));
            await variantField.click();
            const bounds = await list.boundingBox();
            assert.ok(
                bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 320.5 && bounds.y + bounds.height <= 680.5,
                'Popup stays in the visible embedded viewport'
            );
            await variant.press('Escape');
            assert.equal(await variant.getAttribute('aria-expanded'), 'false');

            await page.goto(`${base}#/components`);
            await page.reload();
            await page.getByTestId('docs-mobile-appbar-row').getByTestId('docs-icon-search').waitFor();
            await page.keyboard.press('Control+k');
            const search = page.getByRole('combobox', { name: 'Buscar documentación', exact: true });
            await search.fill('sin-resultados-zzy');
            assert.equal(await search.evaluate((el) => getComputedStyle(el).outlineWidth), '0px');
            await page.getByText('No hay resultados.', { exact: true }).waitFor();
            assert.equal(await page.getByTestId('docs-search-count').innerText(), '0');
            await search.fill('tipografia');
            await search.press('ArrowDown');
            assert.match(await search.getAttribute('aria-activedescendant'), /styles%2Ftypography$/);
            await search.press('Enter');
            await page.waitForURL('**/styles/typography');
            assert.equal(await page.locator('#search-dialog').evaluate((el) => el.open), false);
            await page.keyboard.press('Control+k');
            assert.equal(await search.inputValue(), '');
            await search.fill('badges');
            const results = page.locator('#search-results');
            const badgesLink = results.locator('a[href="#/components/badges/overview"]');
            await badgesLink.click({ timeout: 5000 }).catch(async (error) => {
                const state = await search.evaluate((el) => ({
                    value: el.value,
                    active: el.ownerDocument.activeElement?.id,
                    expanded: el.getAttribute('aria-expanded'),
                    links: [...el.ownerDocument.querySelectorAll('#search-results a')].map((link) => link.getAttribute('href')),
                }));
                throw new Error(`Search state in ${name}: ${JSON.stringify(state)}`, { cause: error });
            });
            await page.waitForURL('**/components/badges/overview');
            await page.keyboard.press('Control+k');
            await search.press('Escape');
            assert.equal(await page.locator('#search-dialog').evaluate((el) => el.open), false);
            await page.setViewportSize({ width: 1100, height: 900 });
            await page.goto(`${base}#/components`);
            await page.getByTestId('docs-card-select').click();
            const selectExample = page.frameLocator('[data-component-runtime=select]');
            const quality = selectExample.getByRole('combobox', { name: 'Calidad de audio', exact: true });
            await selectExample.getByTestId('md-choice-quality').click();
            const unavailable = selectExample.getByRole('option', { name: /Sin pérdida/ });
            assert.equal(await unavailable.getAttribute('aria-disabled'), 'true');
            await selectExample.getByRole('option', { name: /Alta calidad/ }).click();
            assert.equal(await quality.inputValue(), 'Alta calidad');
            assert.equal(await selectExample.getByRole('combobox', { name: 'Calidad del dispositivo' }).isDisabled(), true);

            await page.goto(`${base}#/components`);
            await page.getByTestId('docs-card-autocomplete').click();
            const autocompleteExample = page.frameLocator('[data-component-runtime=autocomplete]');
            const city = autocompleteExample.getByRole('combobox', { name: 'Ciudad', exact: true });
            await city.fill('merida');
            await autocompleteExample.getByRole('option', { name: /Mérida/ }).click();
            await autocompleteExample.getByText('Ciudad elegida: Mérida', { exact: true }).waitFor();
            const inline = autocompleteExample.getByRole('combobox', { name: 'Ciudad para el evento' });
            const alignment = () =>
                inline.evaluate((el) => {
                    const field = el.closest('[data-testid="md-choice-city-inline"]');
                    const icon = field.querySelector('[data-testid="md-choice-city-inline-leading-icon"]');
                    const input = el.getBoundingClientRect(),
                        start = icon.getBoundingClientRect();
                    const center = input.top + input.height / 2 - (start.top + start.height / 2);
                    return { center, x: input.left - start.left, height: input.height, lineHeight: getComputedStyle(el).lineHeight };
                });
            await inline.focus();
            const empty = await alignment();
            assert.ok(Math.abs(empty.center) < 1, 'The input and leading icon share a center line');
            await inline.pressSequentially('d');
            assert.equal(await inline.inputValue(), 'd');
            assert.deepEqual(await alignment(), empty, 'Typing keeps the input box and line metrics anchored');
            await inline.fill('sin-coincidencias');
            await autocompleteExample.getByText('No hay resultados.', { exact: true }).waitFor();
            if (name !== 'firefox') {
                const touch = await browser.newPage({ viewport: { width: 390, height: 760 }, hasTouch: true, isMobile: true });
                try {
                    await touch.goto(`${base}#/components/button-groups/overview`);
                    const touchGallery = touch.frameLocator('[data-component-runtime=button-groups]');
                    const touchVariant = touchGallery.getByTestId('group-variant');
                    await touchVariant.evaluate((el) => el.scrollIntoView({ block: 'center' }));
                    await touchVariant.tap();
                    await touchGallery.getByRole('option', { name: 'Connected', exact: true }).tap();
                    assert.equal(
                        await touchGallery.getByRole('combobox', { name: 'Variante', exact: true }).getAttribute('data-choice-value'),
                        'connected'
                    );
                    await touch.getByTestId('docs-mobile-appbar-row').getByTestId('docs-icon-search').tap();
                    await touch.getByRole('combobox', { name: 'Buscar documentación', exact: true }).fill('badges');
                    await touch.locator('#search-results a[href="#/components/badges/overview"]').tap();
                    await touch.waitForURL('**/components/badges/overview');
                } finally {
                    await touch.close();
                }
            }
            if (name === 'chromium') {
                for (const [runtime, count] of Object.entries(controlsByRuntime)) {
                    await page.goto(`${base}runtime/components/index.html?component=${runtime}`);
                    await page.locator('main').waitFor();
                    assert.equal(await page.locator('main select').count(), 0, `${runtime} has no browser select`);
                    assert.equal(await page.locator('main input[data-mobile-design-choice=select]').count(), count, runtime);
                }
            }
            assert.deepEqual(errors, []);
            console.log(
                `PASS ${name}: Select and Autocomplete catalogue examples, keyboard, pointer, disabled options, links and empty state${name === 'firefox' ? '' : '; both controls on touch'}.`
            );
        } finally {
            await browser.close();
        }
    }
} finally {
    server?.kill('SIGTERM');
}
