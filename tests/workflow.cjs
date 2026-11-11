const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
(async()=>{
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.join(root,req.url==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',f.endsWith('.css')?'text/css':f.endsWith('.js')?'text/javascript':'text/html');res.end(fs.readFileSync(f))}catch{res.writeHead(404);res.end()}}).listen(0,'127.0.0.1');
await new Promise(r=>server.on('listening',r));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:375,height:812}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
await page.goto(base);
await page.locator('#complete').click();assert.match(await page.locator('#error').innerText(),/Namen/);
await page.locator('#name').fill('Test Änne');await page.locator('#complete').click();assert.match(await page.locator('#error').innerText(),/alle Fragen/);
await page.locator('#next').click();assert.equal(await page.evaluate(()=>document.activeElement.name),'q0');
for(let i=0;i<26;i++)await page.locator(`input[name=q${i}][value="${i%4}"]`).check({force:true});
await page.locator('#complete').click();const message=await page.locator('#preview').inputValue();assert.match(message,/Rohsumme: 37\/78/);assert.match(message,/Version:/);
const questions=await page.evaluate(()=>questions);assert.equal(questions.length,26);
const dl=page.waitForEvent('download');await page.locator('#download').click();const file=await dl;const single=await file.path();
let whatsapp;await page.route('https://wa.me/**',route=>{whatsapp=route.request().url();return route.abort()});await page.locator('#whatsapp').click();await page.waitForTimeout(100);assert.equal(new URL(whatsapp).searchParams.get('text'),message);
await page.locator('input[name=q0][value="3"]').check({force:true});assert.equal(await page.locator('#result').isHidden(),true);await page.locator('#complete').click();assert.match(await page.locator('#preview').inputValue(),/40\/78/);
for(const width of [320,375,768,1280]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'form overflow '+width)}
await page.goto(base+'/auswertung.html');
const add=async text=>{await page.locator('#text').fill(text);await page.locator('#add').click()};
await add(message);assert.equal(await page.locator('#table article').count(),1);assert.match(await page.locator('#table').innerText(),/37\/78/);assert.equal(await page.evaluate(()=>JSON.stringify(questions)),JSON.stringify(questions));
await add(message);assert.equal(await page.locator('#table article').count(),1);assert.match(await page.locator('#msg').innerText(),/1 Duplikat/);
for(const bad of [message+'\n27: 9',message+'\n1: 2',message.replace('26: 1','26: 4'),message.replace('26: 1',''),message+'\n99: 0',message+'\nName: Zweiter']){await add(bad);assert.equal(await page.locator('#table article').count(),1);assert(!/hinzugefügt/.test(await page.locator('#msg').innerText()))}
await page.locator('summary').first().click();await page.locator('#persist').check();await page.reload();assert.equal(await page.locator('#table article').count(),1);
await page.locator('summary').first().click();await page.locator('#persist').uncheck();assert.equal(await page.evaluate(()=>localStorage.length),0);
const backupWait=page.waitForEvent('download');await page.locator('#json').click();const backup=await (await backupWait).path();
await page.locator('#clear').click();assert.equal(await page.locator('#table article').count(),0);
await page.locator('#file').setInputFiles(backup);assert.equal(await page.locator('#table article').count(),1);
await page.locator('#file').setInputFiles(single);assert.equal(await page.locator('#table article').count(),1);
await page.locator('#file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify([{name:'Valid',answers:Array(26).fill(0)},{name:'Bad',answers:[9]}]))});assert.equal(await page.locator('#table article').count(),1);
await add(message.replace('Test Änne','<img src=x onerror=alert(1)>'));assert.equal(await page.locator('#table img').count(),0);assert.equal(await page.locator('#table article').count(),2);
for(const width of [320,375,768,1280]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'results overflow '+width)}
await page.setViewportSize({width:375,height:812});await page.screenshot({path:'/tmp/anamnese-results.png',fullPage:false});
const csvWait=page.waitForEvent('download');await page.locator('#csv').click();const csv=fs.readFileSync(await (await csvWait).path(),'utf8');assert.match(csv,/Rohsumme/);assert.match(csv,/Test Änne/);
await page.locator('#table button').first().click();assert.equal(await page.locator('#table article').count(),1);
await page.reload();assert.equal(await page.locator('#table article').count(),0);
assert.deepEqual(errors,[]);console.log('PASS: required fields, 26 answers, sums, edits, next question, WhatsApp URL exact payload, single/backup JSON import, atomic invalid import, duplicates, malformed answers, storage opt-in/out, deletion, CSV, safe names, 4 viewport widths, no browser errors.');
}finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
