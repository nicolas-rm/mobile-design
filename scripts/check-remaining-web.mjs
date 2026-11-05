import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.find((value) => value.startsWith('--family='))?.slice(9);
const allFamilies = JSON.parse(fs.readFileSync(path.join(root, 'runtime/remaining-families.json'), 'utf8'));
assert.ok(!only || only in allFamilies, 'Unknown review family');
const families = only ? { [only]: allFamilies[only] } : allFamilies;
const out = path.join(root, '.artifacts/remaining-web' + (only ? '-' + only : ''));
fs.mkdirSync(out, { recursive: true });
const snapshot = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-design-remaining-'));
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
    errors = [],
    failures = [];
let family, page;
const check = (kind, details = {}) => {
    cases.push({ family, kind, ...details });
    fs.writeFileSync(path.join(out, 'progress.json'), JSON.stringify({ cases, errors, failures }, null, 2));
};
const attempt = async (kind, fn) => {
    if (only && family !== only) return;
    try {
        await fn();
        check(kind);
    } catch (error) {
        failures.push({ family, kind, error: String(error) });
        console.error(family, kind, String(error));
        await page.screenshot({ path: path.join(out, family + '-' + kind + '-failure.png') });
        fs.writeFileSync(path.join(out, family + '-' + kind + '-failure.html'), await page.content());
    }
};
const poll = async (read, accept) => {
    for (let i = 0; i < 100; i++) {
        const value = await read();
        if (accept(value)) return value;
        await page.waitForTimeout(30);
    }
    assert.fail('State did not settle');
};
const open = async (id, scene = 'gallery', width = 390, theme = 'light', reduced = false) => {
    family = id;
    if (only && only !== id) return;
    await page.setViewportSize({ width, height: 680 });
    await page.goto(
        base +
            'runtime/components/index.html?component=catalog-window&family=' +
            id +
            '&scenario=' +
            scene +
            '&theme=' +
            theme +
            '&reduced=' +
            reduced
    );
    await page.locator('main').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(180);
};
try {
    const context = await browser.newContext();
    page = await context.newPage();
    page.on('pageerror', (e) => errors.push({ family, error: String(e) }));
    for (const [id, entry] of Object.entries(families)) {
        await open(id);
        await page.getByTestId('family-gallery').waitFor();
        const text = await page.locator('main').innerText();
        assert.ok(text.trim().length > 15, id + ' has full native gallery');
        check('full-gallery-mounted', { textLength: text.length });
        await page.screenshot({ path: path.join(out, id + '.png') });
    }

    page.setDefaultTimeout(4000);
    await open('checkbox');
    await attempt('mixed-to-all-to-none-and-save', async () => {
        const all = page.getByTestId('md-checkbox-mixed');
        assert.equal(await all.getAttribute('aria-checked'), 'mixed');
        assert.equal(await all.getAttribute('aria-label'), 'Seleccionar todo');
        assert.equal(
            await all.evaluate((el) => el.ownerDocument.getElementById(el.getAttribute('aria-describedby')).textContent),
            'Marca o desmarca todas las opciones.'
        );
        await all.click();
        assert.equal(await all.getAttribute('aria-checked'), 'true');
        await page.getByRole('button', { name: 'Aplicar selección', exact: true }).click();
        assert.match(await page.getByTestId('md-checkbox-result').innerText(), /Fotos, Vídeos, Documentos/);
        await all.click();
        assert.equal(await all.getAttribute('aria-checked'), 'false');
        await all.focus();
        await page.keyboard.press('Space');
        assert.equal(await all.getAttribute('aria-checked'), 'true');
        assert.equal(await all.locator('[tabindex="0"]').count(), 0, 'No duplicate inner checkbox tab stop');
    });
    await open('checkbox', 'gallery', 390, 'dark', true);
    await attempt('reduced-motion-keeps-checkbox-press-feedback', async () => {
        const error = page.getByTestId('md-checkbox-error');
        await error.scrollIntoViewIfNeeded();
        const bounds = await error.boundingBox();
        assert.ok(bounds.width >= 48 && bounds.height >= 48);
        const layer = () =>
            error.evaluate((el) =>
                [...el.querySelectorAll('div')].some((child) => {
                    const style = getComputedStyle(child);
                    return style.width === '40px' && style.height === '40px' && style.opacity === '0.1';
                })
            );
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.mouse.down();
        await poll(layer, Boolean);
        await page.mouse.up();
        assert.equal(await error.getAttribute('aria-checked'), 'true');
        await poll(layer, (value) => !value);
    });
    await open('carousel');
    await attempt('keyboard-and-pointer-snap-motion', async () => {
        const scroll = page.getByTestId('md-carousel-multi-browse-scroll');
        await scroll.waitFor();
        const first = page.getByTestId('md-carousel-multi-browse-press-forest');
        await first.focus();
        await page.keyboard.press('ArrowRight');
        await poll(
            () => scroll.evaluate((el) => el.scrollLeft),
            (value) => value > 100
        );
        await page.waitForTimeout(350);
        const focused = page.getByTestId('md-carousel-multi-browse-item-coast');
        assert.equal(await focused.evaluate((el) => getComputedStyle(el).outlineWidth), '3px');
        assert.ok(await focused.evaluate((el) => parseFloat(getComputedStyle(el).outlineOffset) < 0));
        const box = await scroll.boundingBox();
        await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 12 });
        await page.mouse.up();
        await page.waitForTimeout(600);
        assert.ok((await scroll.evaluate((el) => el.scrollLeft)) > 100);
    });
    await open('carousel', 'gallery', 390, 'light', true);
    await attempt('fullscreen-viewer-keyboard-and-single-tab-stop', async () => {
        await page.getByTestId('md-carousel-full').click();
        const viewer = page.getByTestId('md-carousel-viewer');
        const carousel = viewer.getByTestId('md-carousel-viewer-content');
        const scroll = carousel.getByTestId('md-carousel-viewer-content-scroll');
        const first = carousel.getByRole('img', { name: /El bosque.*1 de 5/ });
        const next = carousel.getByRole('img', { name: /La costa.*2 de 5/ });
        await viewer.getByTestId('md-carousel-viewer-close').focus();
        await page.keyboard.press('Tab');
        await poll(() => first.evaluate((el) => el === document.activeElement), Boolean);
        assert.equal(await first.evaluate((el) => getComputedStyle(el).outlineWidth), '3px');
        assert.ok(await first.evaluate((el) => parseFloat(getComputedStyle(el).outlineOffset) < 0));
        const pageStep = (await scroll.boundingBox()).height + 16;
        await page.keyboard.press('ArrowDown');
        await poll(() => next.evaluate((el) => el === document.activeElement), Boolean);
        await poll(
            () => scroll.evaluate((el) => el.scrollTop),
            (value) => Math.abs(value - pageStep) < 2
        );
        assert.equal(await carousel.getByRole('img').and(carousel.locator('[tabindex="0"]')).count(), 1);
        await page.keyboard.press('ArrowUp');
        await poll(() => first.evaluate((el) => el === document.activeElement), Boolean);
        await poll(
            () => scroll.evaluate((el) => el.scrollTop),
            (value) => Math.abs(value) < 2
        );
        await page.keyboard.press('Escape');
        await viewer.waitFor({ state: 'detached' });
    });
    await open('carousel', 'gallery', 960);
    await attempt('collection-dialog-fits-and-returns-from-viewer', async () => {
        const trigger = page.getByRole('button', { name: 'Ver todos: Texto debajo', exact: true });
        const collection = page.getByRole('alertdialog', { name: 'Texto debajo', exact: true });
        const viewer = page.getByTestId('md-carousel-viewer');
        await page.setViewportSize({ width: 960, height: 900 });
        await trigger.click();
        await collection.waitFor();
        const surface = await collection.boundingBox();
        const lastRow = await collection.getByTestId('md-carousel-collection-4').boundingBox();
        assert.ok(surface.height < 620, 'The dialog height follows the collection.');
        assert.ok(lastRow.y + lastRow.height < surface.y + surface.height, 'All destinations fit on desktop.');
        await collection.getByTestId('md-carousel-collection-0').click();
        await viewer.waitFor();
        assert.equal(await collection.count(), 0, 'Only the expanded viewer is open.');
        await viewer.getByTestId('md-carousel-collection-back').click();
        await collection.waitFor();
        assert.equal(await viewer.count(), 0);
        await page.keyboard.press('Escape');
        await collection.waitFor({ state: 'detached' });
        await poll(() => trigger.evaluate((el) => el === document.activeElement), Boolean);
    });
    await open('carousel', 'gallery', 390, 'dark', true);
    await attempt('collection-scrolls-in-a-short-window', async () => {
        await page.setViewportSize({ width: 390, height: 380 });
        await page.getByTestId('md-carousel-show-all').click();
        const collection = page.getByRole('alertdialog', { name: 'Todos los destinos', exact: true });
        const close = collection.getByRole('button', { name: 'Cerrar', exact: true });
        await close.waitFor();
        const last = collection.getByTestId('md-carousel-collection-4');
        const scrollArea = last.locator('xpath=ancestor::*[contains(@style,"max-height")][1]');
        assert.ok(await scrollArea.evaluate((el) => el.scrollHeight > el.clientHeight));
        await last.scrollIntoViewIfNeeded();
        assert.ok(await scrollArea.evaluate((el) => el.scrollTop > 0));
        await close.click();
        await collection.waitFor({ state: 'detached' });
    });
    await open('chips');
    await attempt('assist-opens-complete-editor', async () => {
        await page.getByTestId('md-chip-event').click();
        await page.getByTestId('md-chip-event-editor').waitFor();
        const field = page.getByTestId('md-chip-event-name').getByRole('textbox');
        await field.fill('Concierto');
        assert.equal(await field.inputValue(), 'Concierto');
        await page.keyboard.press('Escape');
    });
    for (const reduced of [false, true]) {
        await open('chips', 'gallery', 390, 'light', reduced);
        await attempt('filter-activates-on-space-release-and-cancels-on-blur-' + reduced, async () => {
            const filter = page.getByTestId('md-chip-filter');
            await filter.focus();
            assert.equal(await filter.getAttribute('aria-checked'), 'false');
            await page.keyboard.down('Space');
            await page.keyboard.down('Space');
            assert.equal(await filter.getAttribute('aria-checked'), 'false');
            if (reduced) {
                const feedback = await filter.evaluate((el) => {
                    const layers = [...el.querySelectorAll('div')].map((child) => getComputedStyle(child));
                    return {
                        staticLayers: layers.filter((style) => style.backgroundColor.endsWith(', 0.1)')).length,
                        visibleInk: layers.some(
                            (style) => style.position === 'absolute' && style.transform !== 'none' && Number(style.opacity) > 0
                        ),
                    };
                });
                assert.deepEqual(feedback, { staticLayers: 1, visibleInk: false });
            }
            await page.keyboard.up('Space');
            assert.equal(await filter.getAttribute('aria-checked'), 'true');
            await page.keyboard.down('Space');
            await page.getByTestId('md-chip-event').focus();
            await page.keyboard.up('Space');
            assert.equal(await filter.getAttribute('aria-checked'), 'true');
            await filter.press('Enter');
            assert.equal(await filter.getAttribute('aria-checked'), 'false');
        });
    }
    await open('date-pickers');
    await attempt('docked-keyboard-dismiss-and-48dp-targets', async () => {
        await page.getByTestId('catalog-date-docked').getByRole('button').click();
        const days = page.locator('[data-mobile-design-ripple-radius="20"]');
        await days.first().waitFor();
        const b = await poll(
            () => days.first().boundingBox(),
            (b) => Math.abs(b.width - 48) < 0.1
        );
        assert.ok(Math.abs(b.height - 48) < 0.1);
        await page.keyboard.press('Escape');
        await poll(
            () => days.count(),
            (n) => n === 0
        );
    });
    for (const mode of ['single', 'range', 'input', 'range-input', 'full-screen', 'full-screen-range', 'years', 'constraints']) {
        await open('date-pickers');
        await attempt('date-session-' + mode, async () => {
            const launcher = page.getByTestId('catalog-date-open-' + mode);
            if (!(await launcher.count())) throw Error('Missing documented configuration ' + mode);
            await launcher.getByRole('button').click();
            await page.getByTestId('catalog-date-picker').waitFor();
            await page.getByTestId(mode.startsWith('full-screen') ? 'catalog-date-picker-close' : 'catalog-date-picker-cancel').click();
            await poll(
                () => page.getByTestId('catalog-date-picker').count(),
                (n) => n === 0
            );
        });
    }
    for (const mode of ['12h', '24h', 'input-12h', 'input-24h']) {
        await open('time-pickers');
        await attempt('time-session-' + mode, async () => {
            await page
                .getByTestId('catalog-time-open-' + mode)
                .getByRole('button')
                .click();
            await page.getByTestId('catalog-time-picker').waitFor();
            await page.getByRole('button', { name: 'Cancelar', exact: true }).last().click();
            await poll(
                () => page.getByTestId('catalog-time-picker').count(),
                (n) => n === 0
            );
        });
    }
    await open('time-pickers');
    await attempt('clock-keyboard-activates-only-the-focused-number', async () => {
        const launch = page.getByTestId('catalog-time-open-12h').getByRole('button');
        await launch.focus();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Selecciona la hora' });
        await poll(() => dialog.evaluate((el) => el.contains(document.activeElement)), Boolean);
        assert.equal(await page.getByTestId('catalog-time-picker-backdrop').getAttribute('tabindex'), null);
        const hour = page.getByTestId('catalog-time-picker-dial-hours-9'),
            hours = page.getByTestId('catalog-time-picker-select-hours');
        await hour.press('Enter');
        await poll(
            () => hours.getAttribute('aria-label'),
            (label) => label === 'Hora, 09'
        );
        assert.equal(await hour.getAttribute('aria-pressed'), 'true');
        await page.getByTestId('catalog-time-picker-dial-hours-7').press('Space');
        await poll(
            () => hours.getAttribute('aria-label'),
            (label) => label === 'Hora, 07'
        );
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        await poll(() => launch.evaluate((el) => el === document.activeElement), Boolean);
        await page.getByText('Hora confirmada: 15:45', { exact: true }).waitFor();
    });
    await open('time-pickers');
    await attempt('clock-tap-advances-and-drag-keeps-the-final-minute', async () => {
        await page.getByTestId('catalog-time-open-12h').getByRole('button').click();
        const hour = page.getByTestId('catalog-time-picker-dial-hours-9'),
            target = await hour.boundingBox();
        assert.equal(target.width, 48);
        assert.equal(target.height, 48);
        await hour.click();
        await page.getByTestId('catalog-time-picker-dial-minutes-0').waitFor();
        const dial = await page.getByTestId('catalog-time-picker-dial').boundingBox();
        assert.equal(dial.width, 256);
        assert.equal(dial.height, 256);
        const angle = (42 * Math.PI) / 180;
        await page.mouse.move(dial.x + 128, dial.y + 27);
        await page.mouse.down();
        await page.mouse.move(dial.x + 128 + Math.sin(angle) * 101, dial.y + 128 - Math.cos(angle) * 101, { steps: 14 });
        const minutes = page.getByTestId('catalog-time-picker-select-minutes');
        await poll(
            () => minutes.locator('input').inputValue(),
            (value) => value === '07'
        );
        await page.mouse.up();
        await poll(
            () => minutes.getAttribute('aria-label'),
            (label) => label === 'Minuto, 07'
        );
        await page.getByTestId('catalog-time-picker-toggle-mode').click();
        await page.getByRole('dialog', { name: 'Ingresa la hora' }).waitFor();
        assert.equal(await page.getByTestId('catalog-time-picker-hour-input').inputValue(), '09');
        assert.equal(await page.getByTestId('catalog-time-picker-minute-input').inputValue(), '07');
        await page.getByTestId('catalog-time-picker-confirm').click();
        await poll(
            () => page.getByTestId('family-status').textContent(),
            (text) => text === 'Hora confirmada: 21:07'
        );
    });
    await open('time-pickers', 'gallery', 320, 'dark', true);
    await attempt('compact-clock-validates-manual-input', async () => {
        await page.getByTestId('catalog-time-open-24h').getByRole('button').click();
        const hour = page.getByTestId('catalog-time-picker-hour-input'),
            minute = page.getByTestId('catalog-time-picker-minute-input');
        const confirm = page.getByTestId('catalog-time-picker-confirm');
        await hour.waitFor();
        assert.equal(await page.getByTestId('catalog-time-picker-dial').count(), 0);
        assert.equal(await page.getByTestId('catalog-time-picker-toggle-mode').getAttribute('aria-disabled'), 'true');
        await hour.fill('24');
        await hour.press('Enter');
        await poll(() => minute.evaluate((el) => el === document.activeElement), Boolean);
        assert.equal(await hour.getAttribute('aria-invalid'), 'true');
        assert.equal(
            await hour.evaluate((el) => el.ownerDocument.getElementById(el.getAttribute('aria-describedby'))?.textContent),
            'Ingresa una hora y minutos válidos.'
        );
        assert.equal(await confirm.getAttribute('aria-disabled'), 'true');
        await hour.fill('00');
        await minute.fill('59');
        await confirm.click();
        await poll(
            () => page.getByTestId('family-status').textContent(),
            (text) => text === 'Hora confirmada: 00:59'
        );
        const picker = page.getByTestId('catalog-time-picker');
        await picker.waitFor({ state: 'hidden' });
        await page.getByTestId('catalog-time-open-12h').getByRole('button').click();
        const compact = await picker.boundingBox();
        const hourBox = await hour.boundingBox();
        const period = await picker.getByRole('radiogroup').boundingBox();
        assert.equal(hourBox.x - compact.x, 24);
        assert.ok(Math.abs(compact.x + compact.width - period.x - period.width - 24) < 1);
    });
    await open('time-pickers', 'gallery', 844);
    await attempt('landscape-clock-keeps-selectors-beside-the-dial', async () => {
        await page.setViewportSize({ width: 844, height: 390 });
        await page.getByTestId('catalog-time-open-24h').getByRole('button').click();
        const dial = page.getByTestId('catalog-time-picker-dial'),
            picker = page.getByTestId('catalog-time-picker');
        const hour = page.getByTestId('catalog-time-picker-select-hours');
        const dialBox = await dial.boundingBox(),
            hourBox = await hour.boundingBox(),
            pickerBox = await picker.boundingBox();
        assert.ok(hourBox.x + hourBox.width < dialBox.x);
        assert.ok(pickerBox.y >= 0 && pickerBox.y + pickerBox.height <= 390);
        assert.equal(await picker.getByRole('radiogroup').count(), 0);
        const outer = await page.getByTestId('catalog-time-picker-dial-hours-0').boundingBox(),
            inner = await page.getByTestId('catalog-time-picker-dial-hours-12').boundingBox();
        assert.ok(inner.y > outer.y);
        await page.getByTestId('catalog-time-picker-dial-hours-12').click();
        await poll(
            () => hour.getAttribute('aria-label'),
            (label) => label === 'Hora, 12'
        );
        await page.getByTestId('catalog-time-picker-cancel').click();
        await picker.waitFor({ state: 'hidden' });
        await page.getByTestId('catalog-time-open-12h').getByRole('button').click();
        const dial12 = await dial.boundingBox(),
            hour12 = await hour.boundingBox(),
            period = await picker.getByRole('radiogroup').boundingBox();
        assert.ok(period.width > period.height && period.y >= hour12.y + hour12.height);
        assert.ok(Math.abs((hour12.y + period.y + period.height) / 2 - (dial12.y + dial12.height / 2)) < 4);
        await page.getByTestId('catalog-time-picker-cancel').click();
    });
    await open('dialogs');
    await attempt('confirm-cancel-reopen-lifecycle', async () => {
        await page.getByTestId('md-dialog-open').click();
        await page.getByTestId('md-dialog').waitFor();
        await page.getByTestId('md-dialog-cancel').click();
        await poll(
            () => page.getByTestId('md-dialog').count(),
            (n) => n === 0
        );
        await page.getByTestId('md-dialog-open').click();
        await page.getByTestId('md-dialog-confirm').click();
        await poll(
            () => page.getByTestId('md-dialog').count(),
            (n) => n === 0
        );
    });
    await open('divider');
    await attempt('decorative-divider-and-detail', async () => {
        await page.getByTestId('md-divider-read-more').click();
        await page.getByTestId('md-divider-detail').waitFor();
        await page.keyboard.press('Escape');
    });
    await open('radio-button');
    await attempt('single-selection-and-real-apply', async () => {
        await page.getByTestId('md-radio-express').click();
        assert.equal(await page.getByTestId('md-radio-express').getAttribute('aria-checked'), 'true');
        assert.equal(await page.getByTestId('md-radio-standard').getAttribute('aria-checked'), 'false');
        await page.getByRole('button', { name: 'Confirmar entrega', exact: true }).click();
        assert.match(await page.getByTestId('md-radio-result').innerText(), /exprés/);
    });
    await open('switch');
    await attempt('binary-state-and-keyboard', async () => {
        const control = page.getByTestId('md-switch');
        assert.equal(await control.getAttribute('aria-checked'), 'true');
        await control.click();
        assert.equal(await control.getAttribute('aria-checked'), 'false');
        await control.focus();
        await page.keyboard.press('Space');
        assert.equal(await control.getAttribute('aria-checked'), 'true');
    });
    await open('sliders');
    await attempt('keyboard-value-bounds-and-range', async () => {
        const thumb = page.getByTestId('catalog-slider-continuous-thumb');
        assert.equal(await thumb.getAttribute('aria-valuenow'), '35');
        await thumb.focus();
        await page.keyboard.press('End');
        assert.equal(await thumb.getAttribute('aria-valuenow'), '100');
        await page.keyboard.press('Home');
        assert.equal(await thumb.getAttribute('aria-valuenow'), '0');
        await page.keyboard.press('ArrowRight');
        assert.ok(Number(await thumb.getAttribute('aria-valuenow')) > 0);
        for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) assert.equal(await page.getByTestId('catalog-slider-size-' + size).count(), 1);
    });
    await open('snackbar');
    await attempt('undo-persists-and-restores-document', async () => {
        await page.getByTestId('md-snackbar-action-open').click();
        const undo = page.getByRole('button', { name: 'Deshacer', exact: true });
        await undo.waitFor();
        await undo.click();
        await page.getByText('Elemento: Disponible', { exact: true }).waitFor();
    });
    await open('navigation-bar');
    await attempt('destination-selection-and-content', async () => {
        await page.getByTestId('catalog-navbar-browse').click();
        assert.equal(await page.getByTestId('catalog-navbar-browse').getAttribute('aria-selected'), 'true');
        await page.getByText('Ambient', { exact: true }).first().waitFor();
    });
    await open('navigation-drawer');
    await attempt('modal-drawer-open-and-dismiss', async () => {
        await page.getByTestId('catalog-drawer-modal-open').click();
        await page.getByTestId('catalog-drawer-modal').waitFor();
        await page.waitForTimeout(250);
        await page.keyboard.press('Escape');
        await poll(
            () => page.getByTestId('catalog-drawer-modal').count(),
            (n) => n === 0
        );
    });
    await open('navigation-rail');
    await attempt('modal-rail-open-and-dismiss', async () => {
        await page.getByTestId('catalog-rail-modal-open').click();
        await page.getByTestId('catalog-rail-modal').waitFor();
        await page.keyboard.press('Escape');
        await poll(
            () => page.getByTestId('catalog-rail-modal').count(),
            (n) => n === 0
        );
    });
    await open('side-sheets');
    await attempt('modal-sheet-draft-apply-dialog-semantics', async () => {
        await page.getByTestId('catalog-side-modal-open').click();
        await page.getByTestId('catalog-side-modal').waitFor();
        assert.equal(await page.getByTestId('catalog-side-modal').getAttribute('role'), 'dialog');
        await page.getByTestId('catalog-side-apply').click();
        await poll(
            () => page.getByTestId('catalog-side-modal').count(),
            (n) => n === 0
        );
    });
    await open('bottom-sheets');
    await attempt('original-modal-sheet-height-and-exit', async () => {
        await page.getByTestId('catalog-bottom-modal-half').click();
        await page.getByTestId('catalog-bottom-modal').waitFor();
        await poll(
            () => page.getByTestId('catalog-bottom-modal').boundingBox(),
            (b) => b && b.height > 150
        );
        await page.keyboard.press('Escape');
    });
    await open('text-fields');
    await attempt('validation-description-and-readonly', async () => {
        const email = page.getByTestId('catalog-field-error').getByRole('textbox');
        await email.fill('mal');
        await email.blur();
        assert.equal(await email.getAttribute('aria-invalid'), 'true');
        assert.ok(await email.getAttribute('aria-describedby'));
        await email.fill('ana@example.com');
        await email.blur();
        assert.notEqual(await email.getAttribute('aria-invalid'), 'true');
        assert.equal(await page.getByTestId('catalog-field-read-only').getByRole('textbox').getAttribute('readonly'), '');
        assert.equal(await email.evaluate((el) => getComputedStyle(el).borderRadius), '0px');
    });
    await open('tabs');
    await attempt('tab-keyboard-and-content-swipe', async () => {
        const tabs = page.getByTestId('catalog-tabs-primary');
        const first = tabs.getByRole('tab').first();
        await first.focus();
        await page.keyboard.press('ArrowRight');
        assert.equal(await first.getAttribute('aria-selected'), 'true', 'Manual activation does not select on arrow');
        await page.keyboard.press('Enter');
        await poll(
            () => tabs.getByRole('tab').nth(1).getAttribute('aria-selected'),
            (s) => s === 'true'
        );
        const scroll = page.getByTestId('catalog-tabs-pages-scroll');
        await scroll.scrollIntoViewIfNeeded();
        await poll(
            () => scroll.evaluate((el) => ({ x: el.scrollLeft, w: el.clientWidth })),
            (v) => Math.abs(v.x - v.w) < 1
        );
        const b = await scroll.boundingBox();
        await page.mouse.move(b.x + b.width * 0.8, b.y + b.height / 2);
        await page.mouse.down();
        await page.mouse.move(b.x + b.width * 0.1, b.y + b.height / 2, { steps: 18 });
        await page.mouse.up();
        await poll(
            () => tabs.getByRole('tab').nth(2).getAttribute('aria-selected'),
            (s) => s === 'true'
        );
    });
    await open('tooltips');
    await attempt('rich-help-remains-nonblocking-and-dismisses', async () => {
        await page.getByRole('button', { name: 'Dónde se guardan los datos', exact: true }).click();
        await page.getByTestId('md-rich-tooltip-title-none').waitFor();
        assert.equal(await page.locator('[aria-modal="true"]').count(), 0);
        await poll(
            () => page.getByRole('tooltip').count(),
            (n) => n > 0
        );
        await page.keyboard.press('Escape');
        await poll(
            () => page.getByTestId('md-rich-tooltip-title-none').count(),
            (n) => n === 0
        );
    });

    await open('lists');
    await attempt('single-action-and-independent-secondary', async () => {
        await page.getByTestId('catalog-list-single-action-0').click();
        await page.getByTestId('catalog-list-detail').waitFor();
        await page.keyboard.press('Escape');
        await poll(
            () => page.getByTestId('catalog-list-detail').count(),
            (n) => n === 0
        );
        const row = page.getByTestId('catalog-list-checkbox-landscape');
        assert.equal(await row.getAttribute('aria-checked'), 'false');
        await row.click();
        assert.equal(await row.getAttribute('aria-checked'), 'true');
        await page.getByTestId('catalog-list-spec-bookmark-0').click();
        assert.equal(await page.getByTestId('catalog-list-detail').count(), 0, 'Secondary action does not open primary detail');
        await page.getByTestId('catalog-list-expand').click();
        await page.getByTestId('catalog-list-expand-child-1').waitFor();
    });
    await open('menus');
    await attempt('three-menu-paints-and-editor-after-exit', async () => {
        for (const variant of ['standard', 'vibrant', 'baseline']) {
            await page.getByTestId('md-menu-' + variant + '-open').click();
            await page.getByTestId('md-menu-' + variant + '-edit').waitFor();
            await page.keyboard.press('Escape');
            await poll(
                () => page.getByTestId('md-menu-' + variant + '-edit').count(),
                (n) => n === 0
            );
        }
        await page.getByTestId('md-menu-standard-open').click();
        await page.getByTestId('md-menu-standard-edit').click();
        await page.getByTestId('md-menu-editor').waitFor();
        await page.getByTestId('md-menu-edit-title').getByRole('textbox').fill('Nueva colección');
        await page.getByRole('button', { name: 'Guardar', exact: true }).last().click();
        await poll(
            () => page.getByTestId('md-menu-editor').count(),
            (n) => n === 0
        );
        await page.getByText('Nueva colección', { exact: true }).first().waitFor();
    });
    await open('loading-indicator');
    await attempt('loading-morph-finishes-and-restarts', async () => {
        await page.getByTestId('md-loading-start').click();
        await page.getByTestId('md-loading-working').waitFor();
        await page.getByTestId('md-loading-success').waitFor();
        await page.getByTestId('md-loading-reset').click();
        assert.equal(await page.getByTestId('md-loading-success').count(), 0);
        await page.getByTestId('md-loading-start').click();
        await page.getByTestId('md-loading-working').waitFor();
    });
    await open('progress-indicators');
    await attempt('payment-unknown-progress-to-success', async () => {
        await page.getByTestId('md-progress-buy').waitFor({ timeout: 10000 });
        await page.getByTestId('md-progress-buy').click();
        await page.getByTestId('md-progress-payment-status').waitFor();
        await page.getByText('Payment complete', { exact: true }).waitFor({ timeout: 10000 });
    });
    await open('search');
    await attempt('bar-view-query-clear-select-and-save', async () => {
        await page.getByTestId('catalog-search-bar').click();
        const input = page.getByTestId('catalog-search-input');
        await input.waitFor();
        assert.equal(
            await page.getByRole('button', { name: 'Borrar búsqueda', exact: true }).count(),
            0,
            'No accessible clear action for empty query'
        );
        await input.fill('Monterrey');
        await page.getByTestId('catalog-search-input-clear-icon').waitFor();
        await page.getByTestId('catalog-search-result-monterrey').click();
        await page.getByTestId('catalog-search-save-destination').waitFor();
        await page.getByTestId('catalog-search-save-destination').click();
        assert.match(await page.getByTestId('catalog-search-saved').innerText(), /Monterrey/);
    });
    await open('toolbars');
    await attempt('toolbar-format-save-overflow-and-revert', async () => {
        const input = page.getByTestId('catalog-toolbar-document').getByRole('textbox');
        await input.fill('Documento actualizado');
        const docked = page.getByTestId('catalog-toolbar-docked');
        await docked.getByRole('button', { name: 'Negrita', exact: true }).click();
        await docked.getByRole('button', { name: 'Guardar documento', exact: true }).click();
        await page.getByTestId('catalog-toolbar-save-state').getByText('Versión guardada', { exact: false }).waitFor();
        await input.fill('Borrador');
        await page.getByTestId('catalog-toolbar-cancel').click();
        assert.equal(await input.inputValue(), 'Documento actualizado');
    });

    await open('time-pickers');
    await attempt('dial-value-updates-and-confirm-publishes', async () => {
        await page.getByTestId('catalog-time-open-24h').getByRole('button').click();
        await page.getByTestId('catalog-time-picker-dial-hours-6').click();
        await poll(
            () => page.getByTestId('catalog-time-picker-select-hours').locator('input').inputValue(),
            (v) => v === '06'
        );
        await page.getByTestId('catalog-time-picker-confirm').click();
        await page.getByText('Hora confirmada: 06:45', { exact: true }).first().waitFor();
    });
    await open('lists', 'reorder');
    await attempt('handle-keyboard-reorder-persists', async () => {
        const handles = page.getByRole('slider');
        assert.equal(await handles.count(), 4);
        const handle = page.getByTestId(await handles.first().getAttribute('data-testid'));
        await handle.focus();
        await page.keyboard.press('ArrowDown');
        await poll(
            () => handle.getAttribute('aria-valuenow'),
            (v) => v === '2'
        );
    });
    await open('lists');
    await attempt('swipe-reveal-escape-and-hidden-action-focus', async () => {
        const swipe = page.getByTestId('catalog-list-swipe-0');
        await swipe.scrollIntoViewIfNeeded();
        assert.equal(await swipe.locator('[inert]').count(), 2, 'Closed action bars are not keyboard focusable');
        const b = await swipe.boundingBox();
        await page.mouse.move(b.x + b.width * 0.85, b.y + b.height / 2);
        await page.mouse.down();
        await page.mouse.move(b.x + 16, b.y + b.height / 2, { steps: 20 });
        await page.mouse.up();
        await page.getByTestId('catalog-list-swipe-0-close').waitFor();
        await page.getByTestId('catalog-list-swipe-0-close').focus();
        await page.keyboard.press('Escape');
        await poll(
            () => page.getByTestId('catalog-list-swipe-0-close').count(),
            (n) => n === 0
        );
    });
    await open('loading-indicator');
    await attempt('loading-svg-morph-has-intermediate-frames', async () => {
        await page.getByTestId('md-loading-start').click();
        await page.getByTestId('md-loading-working').waitFor();
        const frames = await page.getByTestId('md-loading-working').evaluate(
            (el) =>
                new Promise((resolve) => {
                    const samples = [],
                        start = performance.now();
                    const frame = () => {
                        samples.push([...el.querySelectorAll('path')].map((path) => path.getAttribute('d')).join('|'));
                        if (performance.now() - start < 800) requestAnimationFrame(frame);
                        else resolve(samples);
                    };
                    frame();
                })
        );
        assert.ok(new Set(frames).size > 5, 'Morph changes continuously instead of remaining a static glyph');
        check('loading-morph-frames', { samples: frames.length, distinct: new Set(frames).size });
    });
    await open('tabs');
    await attempt('indicator-follows-drag-before-commit', async () => {
        const scroll = page.getByTestId('catalog-tabs-pages-scroll');
        await scroll.scrollIntoViewIfNeeded();
        const b = await scroll.boundingBox(),
            indicator = page.getByTestId('catalog-tabs-primary-indicator');
        const start = await indicator.boundingBox();
        await page.mouse.move(b.x + b.width * 0.8, b.y + b.height / 2);
        await page.mouse.down();
        await page.mouse.move(b.x + b.width * 0.5, b.y + b.height / 2, { steps: 10 });
        await poll(
            () => indicator.boundingBox(),
            (v) => v.x > start.x + 5
        );
        assert.equal(await page.getByTestId('catalog-tabs-primary-flights').getAttribute('aria-selected'), 'true');
        await page.mouse.up();
    });

    await open('date-pickers');
    await attempt('calendar-roving-keys-month-change-and-draft-cancel', async () => {
        const launch = page.getByTestId('catalog-date-open-single').getByRole('button');
        await launch.focus();
        await page.keyboard.press('Enter');
        const picker = page.getByTestId('catalog-date-picker');
        await picker.waitFor();
        await poll(() => picker.evaluate((el) => el.contains(document.activeElement)), Boolean);
        const backdrop = page.getByTestId('catalog-date-picker-backdrop');
        assert.equal(await backdrop.getAttribute('tabindex'), null);
        const selected = picker.locator('[data-mobile-design-date="2026-10-25"]').filter({ visible: true });
        await selected.focus();
        await page.keyboard.press('ArrowRight');
        await poll(
            () => page.evaluate(() => document.activeElement?.getAttribute('data-mobile-design-date')),
            (key) => key === '2026-10-26'
        );
        await page.keyboard.press('PageDown');
        await poll(
            () => page.evaluate(() => document.activeElement?.getAttribute('data-mobile-design-date')),
            (key) => key === '2026-11-26'
        );
        await page.keyboard.press('Home');
        await poll(
            () => page.evaluate(() => document.activeElement?.getAttribute('data-mobile-design-date')),
            (key) => key === '2026-11-01'
        );
        await page.keyboard.press('Enter');
        await page.keyboard.press('Escape');
        await picker.waitFor({ state: 'hidden' });
        await poll(() => launch.evaluate((el) => el === document.activeElement), Boolean);
        await page.getByText('Fecha confirmada: 25/10/2026', { exact: true }).waitFor();
        await launch.click();
        await picker.waitFor();
        await backdrop.click({ position: { x: 5, y: 5 } });
        await picker.waitFor({ state: 'hidden' });
    });

    await open('date-pickers');
    await attempt('calendar-keyboard-honors-local-day-limits-and-month-boundaries', async () => {
        await page.getByTestId('catalog-date-open-constraints').getByRole('button').click();
        const picker = page.getByTestId('catalog-date-picker');
        await picker.waitFor();
        await picker.locator('[data-mobile-design-date="2026-10-29"]').filter({ visible: true }).focus();
        const move = async (key, date) => {
            await page.keyboard.press(key);
            await poll(
                () => page.evaluate(() => document.activeElement?.getAttribute('data-mobile-design-date')),
                (active) => active === date
            );
        };
        await move('Shift+PageDown', '2027-10-29');
        await move('PageUp', '2027-09-29');
        await move('ArrowRight', '2027-09-30');
        await move('PageDown', '2027-10-29');
        await move('PageDown', '2027-11-29');
        await move('PageDown', '2027-12-29');
        await move('End', '2027-12-31');
        await move('PageDown', '2027-12-31');
        await page.keyboard.press('Enter');
        await page.getByTestId('catalog-date-picker-confirm').click();
        await picker.waitFor({ state: 'hidden' });
        assert.equal(await page.getByTestId('family-status').textContent(), 'Fecha confirmada: 31/12/2027');
    });

    await open('date-pickers');
    await attempt('range-keyboard-reaches-the-next-month-and-year', async () => {
        await page.getByTestId('catalog-date-open-range').getByRole('button').click();
        const picker = page.getByTestId('catalog-date-picker');
        await picker.waitFor();
        const date = (key) => picker.locator(`[data-mobile-design-date="${key}"]`);
        await date('2026-10-25').focus();
        const move = async (key, expected) => {
            await page.keyboard.press(key);
            await poll(
                () => page.evaluate(() => document.activeElement?.getAttribute('data-mobile-design-date')),
                (active) => active === expected
            );
        };
        await move('End', '2026-10-31');
        await page.keyboard.press('Enter');
        await move('ArrowRight', '2026-11-01');
        await move('Shift+PageDown', '2027-11-01');
        assert.equal(await picker.locator('[data-mobile-design-date][tabindex="0"]').count(), 1);
        await page.keyboard.press('Enter');
        await page.getByTestId('catalog-date-picker-confirm').click();
        await picker.waitFor({ state: 'hidden' });
        await page.getByText('Período: 31/10/2026 – 1/11/2027', { exact: true }).waitFor();
        assert.equal(await page.getByTestId('family-status').textContent(), 'Período confirmado.');
    });

    await open('date-pickers', 'gallery', 320);
    await attempt('narrow-date-input-preserves-usable-targets', async () => {
        await page.getByTestId('catalog-date-open-single').getByRole('button').click();
        const picker = page.getByTestId('catalog-date-picker'),
            input = picker.getByRole('textbox', { name: 'Fecha', exact: true }),
            confirm = page.getByTestId('catalog-date-picker-confirm');
        await input.waitFor();
        assert.equal(await page.locator('[data-mobile-design-date]').count(), 0);
        assert.equal(await page.getByTestId('catalog-date-picker-input-toggle').getAttribute('aria-disabled'), 'true');
        await input.fill('31/02/2027');
        assert.equal(await confirm.getAttribute('aria-disabled'), 'true');
        await input.fill('28/02/2027');
        await confirm.click();
        await picker.waitFor({ state: 'hidden' });
        assert.equal(await page.getByTestId('family-status').textContent(), 'Fecha confirmada: 28/2/2027');
    });
    // Every family is also mounted with dark paint, reduced motion, narrow and wide layout.
    for (const [id, entry] of Object.entries(families))
        for (const config of [
            { width: 320, theme: 'dark', reduced: true, direction: 'rtl' },
            { width: 960, theme: 'light', reduced: false, direction: 'ltr' },
        ]) {
            await open(id, 'gallery', config.width, config.theme, config.reduced);
            await page.evaluate(
                (direction) =>
                    window.postMessage(
                        {
                            type: 'mobile-design:window-config',
                            configuration: {
                                family: new URLSearchParams(location.search).get('family'),
                                scenario: 'gallery',
                                direction,
                                motion: 'expressive',
                            },
                        },
                        location.origin
                    ),
                config.direction
            );
            await page.getByTestId('family-gallery').waitFor();
            check('theme-width-motion-direction', config);
        }
    for (const [id, entry] of Object.entries(families)) {
        family = id;
        await page.setViewportSize({ width: 960, height: 900 });
        await page.goto(base + 'runtime/components/index.html?component=' + id);
        const frame = page.frameLocator('[data-testid="family-window"]');
        await frame.getByRole('main', { name: entry.title, exact: true }).waitFor();
        await frame.getByTestId('family-gallery').waitFor();
        check('documentation-uses-original-family-window');
    }
    for (const [id, entry] of Object.entries(families))
        for (const [scenario] of entry.scenarios.filter(([key]) => key !== 'gallery')) {
            await open(id, scenario);
            await attempt('usage-' + scenario, async () => {
                assert.ok((await page.locator('main').innerText()).trim().length > 20);
            });
        }
    if ('time-pickers' in families) {
        family = 'time-pickers';
        await page.setViewportSize({ width: 1440, height: 1050 });
        await page.goto(base + '#/components/time-pickers/overview');
        await attempt('documentation-reveals-the-open-clock', async () => {
            const preview = page.frameLocator('[data-component-runtime]').frameLocator('[data-testid="family-window"]');
            await preview.getByTestId('catalog-time-open-12h').getByRole('button').click();
            const picker = preview.getByTestId('catalog-time-picker');
            await picker.waitFor();
            await poll(
                () => picker.boundingBox(),
                (bounds) => bounds && bounds.y >= 0 && bounds.y + bounds.height <= 1050
            );
            await preview.getByTestId('catalog-time-picker-dial-hours-9').click();
            await preview.getByTestId('catalog-time-picker-dial-minutes-10').click();
            await preview.getByTestId('catalog-time-picker-toggle-mode').click();
            await preview.getByRole('dialog', { name: 'Ingresa la hora' }).waitFor();
            assert.equal(await preview.getByTestId('catalog-time-picker-hour-input').inputValue(), '09');
            assert.equal(await preview.getByTestId('catalog-time-picker-minute-input').inputValue(), '10');
            await preview.getByTestId('catalog-time-picker-confirm').click();
            await preview.getByText('Hora confirmada: 21:10', { exact: true }).first().waitFor();
        });
    }
    for (const pair of new Set(Object.values(families).map((entry) => entry.pair))) {
        const ids = Object.keys(families).filter((id) => families[id].pair === pair);
        fs.writeFileSync(
            path.join(out, 'pair-' + String(pair).padStart(2, '0') + '.json'),
            JSON.stringify(
                {
                    families: ids,
                    cases: cases.filter((test) => ids.includes(test.family)),
                    failures: failures.filter((test) => ids.includes(test.family)),
                },
                null,
                2
            )
        );
    }
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.goto(base + '#/components/' + (only ?? 'lists') + '/overview');
    await page.getByRole('heading', { name: allFamilies[only ?? 'lists'].title, exact: true }).waitFor();
    await page.frameLocator('iframe').frameLocator('[data-testid="family-window"]').getByTestId('family-gallery').waitFor();
    await page.mouse.wheel(0, 420);
    await page.screenshot({ path: path.join(out, 'documentation-proof.png') });
    assert.deepEqual(failures, [], 'All remaining action checks pass');
    assert.deepEqual(errors, [], 'No uncaught original component errors');
    console.log('PASS:', cases.length, 'remaining component checks');
} finally {
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ cases, errors, failures }, null, 2));
    await browser.close();
    server.kill();
    fs.rmSync(snapshot, { recursive: true, force: true });
}
