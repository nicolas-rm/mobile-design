import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'.artifacts/page-controls');fs.mkdirSync(out,{recursive:true});
const server=process.env.WEB_TEST_BASE_URL?undefined:spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4324'},stdio:['ignore','pipe','pipe']});
const base=process.env.WEB_TEST_BASE_URL??await new Promise((resolve,reject)=>{server.once('error',reject);server.once('exit',code=>reject(Error('Server exited: '+code)));server.stdout.on('data',chunk=>{const url=String(chunk).match(/http:\/\/[^\s]+/);if(url)resolve(url[0]);});});
const executablePath=process.env.CHROME_PATH??['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium'].find(fs.existsSync);
const browser=await chromium.launch({executablePath,headless:true});
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto(base+'#/components/buttons/api');const copy=page.getByTestId('docs-copy').first();await copy.waitFor();
 assert.equal(await copy.getAttribute('aria-label'),'Copiar código');assert.equal(await copy.locator('[style*="font-family: MobileDesign"]').count(),1,'Package icon renders in the page.');
 const expected=await copy.locator('xpath=ancestor::*[contains(@class,"code-card")]').locator('code').innerText();
 await copy.click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),expected);
 await page.waitForFunction(()=>document.querySelector('[data-testid=docs-copy]')?.getAttribute('aria-busy')==='false');
 await copy.focus();const before=await page.locator('#toast').innerText();await copy.press('Enter');assert.equal(await page.locator('#toast').innerText(),before);assert.ok(await copy.evaluate(el=>el===document.activeElement),'Copy retains keyboard focus.');
 for(let i=0;i<4;i++)for(const route of ['develop/installation','components/fab-menu/api','styles/color','styles/motion','components/buttons/overview']){
  await page.goto(base+'#/'+route);await page.waitForFunction(route=>document.body.dataset.route===route,route);await page.locator('[data-mobile-design-mounted]').first().waitFor();
  const counts=await page.locator('[data-mobile-design-host]').evaluateAll(hosts=>hosts.map(host=>({kind:host.dataset.kind,count:host.querySelectorAll('button,a[data-testid]').length})));assert.ok(counts.every(host=>host.count===(host.kind==='split'?2:1)),'Each mount has exactly its own original controls.');
  assert.equal(await page.locator('#mobile-design-controls-root').count(),1,'One provider root.');
 }
 await page.goto(base+'#/styles/color');const toggle=page.getByTestId('docs-theme');await toggle.waitFor();const theme=await page.locator('html').getAttribute('data-theme');await toggle.click();await page.waitForFunction(old=>document.documentElement.dataset.theme!==old,theme);assert.ok(await page.getByTestId('docs-theme').isVisible());
 await page.goto(base+'#/styles/motion');const motion=page.getByTestId('docs-motion');await motion.waitFor();const reduced=await motion.getAttribute('aria-pressed');await motion.click();assert.notEqual(await motion.getAttribute('aria-pressed'),reduced);
 await page.goto(base+'#/components');await page.locator('#catalog-filter').fill('xyz-no-such-component');const clear=page.getByTestId('docs-reset-filter');await clear.waitFor();await clear.click();assert.equal(await page.locator('#catalog-filter').inputValue(),'');assert.equal(await page.locator('.component-card').count(),36);
 // Dispose a pending copy before replacing the article tree.
 await page.goto(base+'#/components/buttons/api');await page.getByTestId('docs-copy').first().waitFor();
 await page.evaluate(()=>{const original=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=text=>new Promise(resolve=>setTimeout(()=>{original(text).then(resolve);},200));});
 await page.getByTestId('docs-copy').first().click();await page.goto(base+'#/components/fab-menu/overview');await page.waitForTimeout(250);
 await page.goto(base+'#/components/cards/overview');const codeActions=page.getByTestId('docs-code-actions').first(),codePrimary=page.getByTestId('docs-code-actions-primary').first();await codePrimary.waitFor();const codeText=await codeActions.locator('xpath=ancestor::*[contains(@class,"code-card")]').locator('code').innerText();await codePrimary.click();await page.waitForFunction(async text=>await navigator.clipboard.readText()===text,codeText);
 await page.getByTestId('docs-code-actions-toggle').first().click();await page.getByRole('menuitem',{name:'Descargar ejemplo',exact:true}).waitFor();const downloadReady=page.waitForEvent('download');await page.getByRole('menuitem',{name:'Descargar ejemplo',exact:true}).click();const download=await downloadReady;assert.equal(download.suggestedFilename(),'cards.tsx');
 await page.goto(base+'#/components');const cards=page.locator('[data-mobile-design-host][data-kind=card]');await page.getByTestId('docs-card-buttons').waitFor();assert.equal(await cards.count(),36);assert.equal(await page.getByTestId('docs-card-buttons').evaluate(el=>el.tagName),'A','Original Card exposes a real browser link.');assert.equal(await page.getByTestId('docs-card-buttons').getAttribute('href'),'#/components/buttons/overview');await page.getByTestId('docs-card-buttons').click();await page.waitForFunction(()=>document.body.dataset.route==='components/buttons/overview');
 await page.setViewportSize({width:390,height:844});await page.goto(base+'#/develop/installation');await page.getByTestId('docs-copy').first().waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const nav=page.getByTestId('docs-icon-sidebar');await nav.click();assert.equal(await nav.getAttribute('aria-expanded'),'true');assert.ok(await page.locator('#sidebar .sidebar-close button').evaluate(el=>el===document.activeElement));assert.equal(await page.locator('.workspace').getAttribute('inert'),'');await page.keyboard.press('Escape');assert.equal(await nav.getAttribute('aria-expanded'),'false');assert.ok(await nav.evaluate(el=>el===document.activeElement),'Mobile close returns focus to original IconButton.');
 await page.getByTestId('docs-icon-search').filter({visible:true}).first().click();await page.locator('#global-search').fill('Icon buttons');await page.getByTestId('docs-icon-close-search').click();assert.equal(await page.locator('#search-dialog').evaluate(el=>el.open),false);
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'#/components/icon-buttons/api');await page.getByTestId('docs-icon-copy-link').first().waitFor();assert.equal(await page.locator('#component-navigation button.tree-group').count(),0,'Catalogue groups stay open.');assert.equal(await page.locator('.tree-children[hidden]').count(),0);assert.equal(await page.locator('.sidebar-close button').isVisible(),false,'No extra close control on desktop.');
 await page.getByTestId('docs-icon-copy-link').first().click();await page.waitForFunction(async()=> (await navigator.clipboard.readText()).includes('section=import'));assert.equal(await page.locator('details').count(),0);
 await page.screenshot({path:path.join(out,'page-controls-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks:['original-package-icon','copy','keyboard','20-route-replacements','single-root','theme-rerender','motion-toggle','clear-filters','pending-copy-unmount','original-card-links','split-copy-download','responsive'],errors},null,2));
 console.log('PASS: Original Buttons in documentation, actions, navigation cleanup, theme, focus and responsive layout.');
}finally{await browser.close();server?.kill('SIGTERM');}
