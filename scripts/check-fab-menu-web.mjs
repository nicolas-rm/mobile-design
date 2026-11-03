import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'.artifacts/fab-menu-web');fs.mkdirSync(out,{recursive:true});
const server=process.env.WEB_TEST_BASE_URL?undefined:spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'4323'},stdio:['ignore','pipe','pipe']});
const base=process.env.WEB_TEST_BASE_URL??await new Promise((resolve,reject)=>{server.once('error',reject);server.once('exit',code=>reject(Error('Server exited: '+code)));server.stdout.on('data',chunk=>{const url=String(chunk).match(/http:\/\/[^\s]+/);if(url)resolve(url[0]);});});
const executablePath=process.env.CHROME_PATH??['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium'].find(fs.existsSync);
const browser=await chromium.launch({executablePath,headless:true});
const cases=[],errors=[];
const poll=async(read,accept,label)=>{let value;const start=Date.now();do{value=await read();if(accept(value))return value;await new Promise(r=>setTimeout(r,20));}while(Date.now()-start<3000);assert.fail(label+': '+JSON.stringify(value));};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto(base+'#/components/fab-menu/overview');await page.waitForFunction(()=>document.querySelector('[data-component-runtime]')?.getAttribute('aria-busy')==='false');const frame=page.frameLocator('[data-component-runtime]'),trigger=frame.getByTestId('fab-menu-trigger'),items=frame.getByRole('menuitem');
 const close=async()=>{await page.keyboard.press('Escape');await poll(()=>trigger.getAttribute('aria-expanded'),v=>v==='false','close state');await poll(()=>trigger.evaluate(el=>el===document.activeElement),v=>v,'focus restored to FAB');};
 for(const theme of ['light','dark']){
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('.rail [data-action=theme]').click();await poll(()=>frame.locator('html').getAttribute('data-theme'),v=>v===theme,'theme');
  for(const [size,height]of [['default',56],['medium',80],['large',96]]){
   await frame.locator('#fab-menu-size').selectOption(size);
   for(const color of ['tonalPrimary','tonalSecondary','tonalTertiary','primary','secondary','tertiary']){await frame.locator('#fab-menu-variant').selectOption(color);const box=await trigger.boundingBox();assert.ok(Math.abs(box.height-height)<.5&&Math.abs(box.width-height)<.5);cases.push({theme,size,color,check:'trigger'});}
   for(const count of [2,3,4,5,6])for(const scenario of ['create','share']){
    await frame.locator('#fab-menu-count').selectOption(String(count));await frame.locator('#fab-menu-scenario').selectOption(scenario);await trigger.click();await poll(()=>items.count(),v=>v===count,'action count');
    assert.equal(await trigger.getAttribute('aria-haspopup'),'menu');assert.equal(await trigger.getAttribute('aria-expanded'),'true');await frame.getByRole('menu').waitFor();
    await poll(()=>items.first().evaluate(el=>el===document.activeElement),v=>v,'initial item focus');
    const box=await poll(()=>items.first().boundingBox(),box=>box.height>=47.9,'Settled minimum action height');assert.ok(box.height>=47.9,'Minimum action height.');const viewport=await frame.locator('html').evaluate(()=>({width:innerWidth,height:innerHeight})),menu=await frame.getByRole('menu').evaluate(el=>el.getBoundingClientRect().toJSON());assert.ok(menu.x>=-1&&menu.y>=-1&&menu.x+menu.width<=viewport.width+1&&menu.y+menu.height<=viewport.height+1,'Anchored menu fits its viewport.');
    await close();cases.push({theme,size,count,scenario,check:'menu'});
   }
  }
  console.log('PASS: FAB menu '+theme+' configurations.');
 }
 await frame.locator('#fab-menu-size').selectOption('default');await frame.locator('#fab-menu-count').selectOption('4');await frame.locator('#fab-menu-scenario').selectOption('create');await trigger.focus();await trigger.press('ArrowDown');await poll(()=>items.first().evaluate(el=>el===document.activeElement),v=>v,'ArrowDown opens first item');
 await page.keyboard.press('End');assert.ok(await items.last().evaluate(el=>el===document.activeElement));await page.keyboard.press('Home');assert.ok(await items.first().evaluate(el=>el===document.activeElement));await page.keyboard.press('ArrowDown');assert.ok(await items.nth(1).evaluate(el=>el===document.activeElement));await page.keyboard.press('d');assert.ok(await items.nth(2).evaluate(el=>el===document.activeElement));await close();
 await trigger.focus();await trigger.press('ArrowUp');await poll(()=>items.last().evaluate(el=>el===document.activeElement),v=>v,'ArrowUp opens last item');await close();
 await frame.locator('#fab-menu-disabled').check();await trigger.click();assert.equal(await items.nth(1).getAttribute('aria-disabled'),'true');await items.nth(1).focus();const before=await frame.locator('#fab-menu-actions').innerText();await page.keyboard.press('Enter');assert.equal(await frame.locator('#fab-menu-actions').innerText(),before);assert.equal(await trigger.getAttribute('aria-expanded'),'true');await close();await frame.locator('#fab-menu-disabled').uncheck();
 await trigger.click();const dismiss=Number(await frame.locator('#fab-menu-dismissals').innerText());await items.first().click();await poll(()=>frame.locator('#fab-menu-dismissals').innerText(),v=>Number(v)===dismiss+1,'one dismiss per action');assert.equal(await frame.locator('#fab-menu-result').innerText(),'Se creó: Nota 1.');await poll(()=>trigger.evaluate(el=>el===document.activeElement),v=>v,'action returns focus');
 await trigger.click();await page.keyboard.press('Tab');await poll(()=>trigger.getAttribute('aria-expanded'),v=>v==='false','Tab leaves menu');assert.equal(await frame.locator('body').evaluate(()=>Boolean(document.activeElement?.closest('[role=menu]'))),false);
 await trigger.click();await frame.locator('[data-testid$="-outside"]').click({position:{x:5,y:5}});await poll(()=>trigger.getAttribute('aria-expanded'),v=>v==='false','outside dismissal');
 await frame.locator('#fab-menu-scenario').selectOption('share');await trigger.click();await items.first().click();await poll(()=>frame.locator('#fab-menu-result').innerText(),v=>v==='Enlace copiado.','copy command');assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'https://example.com/coleccion');
 for(const direction of ['ltr','rtl']){await frame.locator('#fab-menu-direction').selectOption(direction);await trigger.click();const host=await frame.locator('.fab-menu-scene').boundingBox(),box=await trigger.boundingBox();assert.ok(direction==='ltr'?box.x+box.width>host.x+host.width-30:box.x<host.x+30,'Logical trailing alignment.');await close();}
 await frame.locator('#fab-menu-direction').selectOption('ltr');await frame.locator('#fab-menu-short').check();await trigger.click();await close();await frame.locator('#fab-menu-short').uncheck();
 await frame.locator('#fab-menu-mode').selectOption('scroll');await frame.locator('#fab-menu-scenario').selectOption('create');
 for(const size of ['default','medium','large'])for(const short of [false,true]){
  await frame.locator('#fab-menu-size').selectOption(size);await frame.locator('#fab-menu-short').setChecked(short);await trigger.click();await poll(()=>trigger.getAttribute('aria-expanded'),v=>v==='true','stack expanded');await poll(()=>trigger.boundingBox(),b=>Math.abs(b.width-56)<1,'trigger transforms to close');
  await poll(()=>frame.locator('[data-testid^="fab-menu-action-"]').evaluateAll(nodes=>nodes.every(el=>Math.abs(el.getBoundingClientRect().width-el.parentElement.parentElement.parentElement.getBoundingClientRect().width)<.2&&el.getBoundingClientRect().width>=80)),v=>v,'all pill surfaces finish expanding around their content');
  const closeBox=await trigger.boundingBox(),scene=await frame.locator('.fab-menu-scene').boundingBox();assert.ok(closeBox.x>=scene.x&&closeBox.y>=scene.y&&closeBox.x+closeBox.width<=scene.x+scene.width&&closeBox.y+closeBox.height<=scene.y+scene.height,'Close remains inside scene.');
  const scroll=frame.getByTestId('example-fab-menu-scroll');await scroll.evaluate(el=>{el.scrollTop=0;el.dispatchEvent(new Event('scroll'));});await frame.getByTestId('fab-menu-action-0').click();await poll(()=>trigger.getAttribute('aria-expanded'),v=>v==='false','scroll action closes');cases.push({size,short,check:'scroll-extension'});
 }
 for(const direction of ['rtl','ltr']){await frame.locator('#fab-menu-direction').selectOption(direction);await trigger.click();await poll(()=>trigger.boundingBox(),b=>Math.abs(b.width-56)<1,'stack close settles');const host=await frame.locator('.fab-menu-scene').boundingBox(),box=await trigger.boundingBox();assert.ok(direction==='ltr'?box.x+box.width>host.x+host.width-30:box.x<host.x+30,'Stack trailing alignment.');await frame.getByTestId('fab-menu-action-0').focus();await page.keyboard.press('Escape');await poll(()=>trigger.getAttribute('aria-expanded'),v=>v==='false','stack Escape closes');await poll(()=>trigger.evaluate(el=>el===document.activeElement),v=>v,'stack restores trigger focus');}
 await frame.locator('#fab-menu-size').selectOption('default');await frame.locator('#fab-menu-mode').selectOption('anchored');await frame.locator('#fab-menu-short').uncheck();await page.locator('.rail [data-action=motion]').click();await trigger.click();await items.first().waitFor();assert.equal(await items.first().locator('[data-paper-ripple]').count(),0);await close();await page.locator('.rail [data-action=motion]').click();
 await trigger.click();await page.screenshot({path:path.join(out,'fab-menu-desktop.png'),fullPage:true});await close();
 for(const width of [390,320]){await page.setViewportSize({width,height:844});await trigger.click();await items.first().waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await close();}
 await page.screenshot({path:path.join(out,'fab-menu-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({configurations:cases.length,cases,checks:['trigger-sizes-colors','2-to-6-actions','two-scenarios','menu-role','keyboard','disabled-discovery','one-dismiss','return-focus','Tab','outside','clipboard','RTL','short-height','scroll-extension','reduce-motion','responsive'],errors},null,2));console.log('PASS: '+cases.length+' FAB menu configurations and keyboard/action checks.');
}catch(error){console.error(errors);throw error;}finally{await browser.close();server?.kill('SIGTERM');}
