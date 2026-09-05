import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1200,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173');
await page.waitForFunction(()=>window.__arena);
const state=()=>page.evaluate(()=>{let a=window.__arena;return {p:{...a.p},b:{...a.b},metrics:{...a.metrics},round:a.round};});
await page.keyboard.down('KeyW');await page.waitForTimeout(300);await page.keyboard.up('KeyW');
assert((await state()).p.y<320,'movement');
await page.keyboard.press('Space',{delay:40});await page.waitForTimeout(180);assert((await state()).metrics.dashes>0,'dash input');
// Real-time input-driven duel. Read positions to aim; no health/state writes.
const start=Date.now();let lastAttack=0,lastParry=0;const rounds=[];let previous=1,roundStart=start;
while(Date.now()-start<32000){
 const s=await state();const box=await page.locator('canvas').boundingBox();
 await page.mouse.move(box.x+s.b.x*box.width/1100,box.y+s.b.y*box.height/680);
 const dx=s.b.x-s.p.x,dy=s.b.y-s.p.y,d=Math.hypot(dx,dy);
 for(const [key,on] of [['KeyD',d>78&&dx>15],['KeyA',d>78&&dx< -15],['KeyS',d>78&&dy>15],['KeyW',d>78&&dy< -15]])await page.keyboard[on?'down':'up'](key);
 if(s.b.phase==='wind'&&d<108&&Date.now()-lastParry>900){await page.keyboard.press('KeyE',{delay:40});lastParry=Date.now();}
 else if(d<90&&Date.now()-lastAttack>660){await page.mouse.click(box.x+s.b.x*box.width/1100,box.y+s.b.y*box.height/680);lastAttack=Date.now();}
 if(s.round!==previous){rounds.push((Date.now()-roundStart)/1000);roundStart=Date.now();previous=s.round;}
 await page.waitForTimeout(35);
}
for(const key of ['KeyW','KeyA','KeyS','KeyD'])await page.keyboard.up(key);
const combat=await state();assert(combat.metrics.hits>0,'combat damage');
// Idle player must be killable and return immediately to another duel.
await page.waitForTimeout(14000);const final=await state();assert(final.metrics.playerDeaths>0,'player death');assert(final.metrics.rounds>0,'respawn');assert.deepEqual(errors,[]);
fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/arena.png'});
const report={combat:combat.metrics,final:final.metrics,roundSecondsIncludingRespawn:rounds,errors};fs.writeFileSync('test-results/playtest.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();

