import {chromium} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__lude?.snapshot);await page.waitForTimeout(1000);
fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/rooftop.png'});console.log({errors,status:await page.locator('#connection').innerText(),fighters:await page.evaluate(()=>window.__lude.snapshot.fighters.map(f=>({name:f.name,controller:f.controller}))) });await browser.close();
