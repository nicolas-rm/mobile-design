import assert from 'node:assert/strict';

/** Operate the real Select without coupling the matrix to translated labels. */
export async function chooseOption(scope, selector, value) {
    const trigger = scope.locator(selector);
    const key = String(value);
    if ((await trigger.getAttribute('data-choice-value')) === key) return;
    if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
        await trigger.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
        await trigger.press('Enter');
    }
    const id = await trigger.getAttribute('aria-controls');
    assert.ok(id, `${selector} must expose its listbox`);
    const option = scope.locator(`[id=${JSON.stringify(id)}] [data-choice-option=${JSON.stringify(key)}]`);
    await option.click({ timeout: 5000 }).catch(async (error) => {
        const layout = await trigger.evaluate((el) => {
            const win = el.ownerDocument.defaultView;
            const popup = el.ownerDocument.getElementById(el.getAttribute('aria-controls'));
            return {
                field: el.getBoundingClientRect().toJSON(),
                frame: win.frameElement?.getBoundingClientRect().toJSON(),
                outerScroll: win.parent.scrollY,
                outerHeight: win.parent.innerHeight,
                innerScroll: win.scrollY,
                popup: popup?.getAttribute('style'),
                focus: el.ownerDocument.activeElement?.id,
            };
        });
        throw new Error(`${selector} ${key}: ${JSON.stringify(layout)}`, { cause: error });
    });
    assert.equal(await trigger.getAttribute('data-choice-value'), key, `${selector} accepted the choice`);
}
