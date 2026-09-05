import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];
async function client(url){const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.waitForFunction(()=>window.__lude?.snapshot);return {context,page};}
const read=page=>page.evaluate(()=>({snapshot:window.__lude.snapshot,metrics:window.__lude.metrics,status:window.__lude.status}));
function project(p){return {x:640+(p.x-480)*.90-(p.y-320)*.43,y:405+(p.x-480)*.21+(p.y-320)*.69};}
async function drive(page,ms){
  const box=await page.locator('canvas').boundingBox(),held=new Set();let actionAt=0,parryAt=0,lastRound=0,lastDeath=Date.now();const rounds=[];const end=Date.now()+ms;
  while(Date.now()<end){const {snapshot:s}=await read(page),p=s.fighters.find(f=>f.id===s.you);const threat=s.fighters.find(f=>f.id!==p.id&&f.hp>0&&f.phase==='wind'&&Math.hypot(f.x-p.x,f.y-p.y)<100);const target=threat??s.fighters.find(f=>f.id===s.target&&f.hp>0)??s.fighters.find(f=>f.id!==p.id&&f.hp>0);if(!target){await page.waitForTimeout(40);continue;}
    const a=project(p),b=project(target),distance=Math.hypot(target.x-p.x,target.y-p.y);await page.mouse.move(box.x+b.x*box.width/1280,box.y+b.y*box.height/820);
    for(const [key,on]of [['KeyD',distance>77&&b.x-a.x>12],['KeyA',distance>77&&b.x-a.x< -12],['KeyS',distance>77&&b.y-a.y>10],['KeyW',distance>77&&b.y-a.y< -10]]){if(on&&!held.has(key)){await page.keyboard.down(key);held.add(key);}else if(!on&&held.has(key)){await page.keyboard.up(key);held.delete(key);}}
    if(threat&&p.phase==='idle'&&p.parryCd<=0&&Date.now()-parryAt>900){await page.keyboard.press('KeyE',{delay:25});parryAt=Date.now();}
    else if(p.phase==='idle'&&distance<85&&p.strikeCd<=0&&Date.now()-actionAt>700){await page.keyboard.press('KeyJ',{delay:25});actionAt=Date.now();}
    if(p.deaths>lastRound){rounds.push((Date.now()-lastDeath)/1000);lastDeath=Date.now();lastRound=p.deaths;}
    await page.waitForTimeout(25);
  }
  for(const key of held)await page.keyboard.up(key);return rounds;
}
fs.mkdirSync('test-results',{recursive:true});
try{
  const duel=await client('http://127.0.0.1:5173/?mode=duel'),p=duel.page;
  const initial=await read(p);await p.keyboard.down('KeyW');await p.waitForTimeout(200);await p.keyboard.up('KeyW');assert.notEqual((await read(p)).snapshot.fighters[0].y,initial.snapshot.fighters[0].y);
  await p.keyboard.press('Space',{delay:30});await p.waitForTimeout(220);assert((await read(p)).metrics.dashes>0);
  const duelRoundSeconds=await drive(p,32000),active=await read(p);assert(active.metrics.hits>10);assert(active.metrics.parries>0);assert(active.snapshot.fighters.some(f=>f.id!=='you'&&f.deaths>0),'player can kill the bot');
  await p.waitForTimeout(14000);const idle=await read(p);assert(idle.snapshot.fighters[0].deaths>0,'bot can kill player');assert(idle.metrics.respawns>2);await p.screenshot({path:'test-results/duel.png'});await duel.context.close();
  const first=await client('http://127.0.0.1:5173'),a=first.page;await a.waitForFunction(()=>window.__lude.snapshot.fighters.filter(f=>f.controller==='human').length===1);assert.equal((await read(a)).snapshot.fighters.length,4);
  const second=await client('http://127.0.0.1:5173'),b=second.page;await a.waitForFunction(()=>window.__lude.snapshot.fighters.filter(f=>f.controller==='human').length===2);
  const [s1,s2]=await Promise.all([read(a),read(b)]);assert.equal(s1.snapshot.room,s2.snapshot.room);assert.notEqual(s1.snapshot.you,s2.snapshot.you);assert(s1.snapshot.target);assert(s2.snapshot.target);assert(!('contracts'in s1.snapshot));assert(s1.snapshot.fighters.every(f=>!('target'in f)));
  await Promise.all([drive(a,34000),drive(b,34000)]);
  const multiplayer=await read(a);assert(multiplayer.metrics.hits>10);assert(multiplayer.metrics.deaths>0);assert(multiplayer.metrics.contracts>0);await a.screenshot({path:'test-results/multiplayer.png'});
  const name=await a.locator('#profile').innerText();await second.context.close();await a.waitForFunction(()=>window.__lude.snapshot.fighters.filter(f=>f.controller==='human').length===1);
  await a.reload();await a.waitForFunction(()=>window.__lude?.status==='LIVE');assert.equal((await a.locator('#profile').innerText()).split(' · ')[0],name.split(' · ')[0]);
  const report={duelActive:active.metrics,duelAfterIdle:idle.metrics,duelRoundSeconds,multiplayer:multiplayer.metrics,room:s1.snapshot.room,twoHumans:true,botReplacement:true,reconnectedIdentity:true,errors};assert.deepEqual(errors,[]);fs.writeFileSync('test-results/playtest.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await first.context.close();
}finally{await browser.close();}
