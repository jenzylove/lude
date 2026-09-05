import Phaser from 'phaser';
import {ROOFTOP,type Cover,type Point} from '../shared/arena';
import type {Character,CombatEvent} from '../shared/combat';

export const WIDTH=1280,HEIGHT=820;
/** Affine camera preserves a collision plane while giving architecture height. */
export const project=(p:Point,z=0)=>({x:640+(p.x-480)*.90-(p.y-320)*.43,y:405+(p.x-480)*.21+(p.y-320)*.69-z});
export function unproject(p:Point):Point {const x=p.x-640,y=p.y-405,d=.90*.69+.43*.21;return {x:480+(.69*x+.43*y)/d,y:320+(-.21*x+.90*y)/d};}
type G=Phaser.GameObjects.Graphics;
function polygon(g:G,points:Point[],color:number,alpha=1){g.fillStyle(color,alpha);g.fillPoints(points,true);}
function line(g:G,a:Point,b:Point,color:number,width=1,alpha=1){g.lineStyle(width,color,alpha);g.lineBetween(a.x,a.y,b.x,b.y);}
function slab(g:G,x:number,y:number,w:number,h:number,z:number,top:number,side:number){const a=project({x,y},z),b=project({x:x+w,y},z),c=project({x:x+w,y:y+h},z),d=project({x,y:y+h},z);polygon(g,[d,c,project({x:x+w,y:y+h}),project({x,y:y+h})],side);polygon(g,[b,c,project({x:x+w,y:y+h}),project({x:x+w,y})],side-0x030303);polygon(g,[a,b,c,d],top);line(g,a,b,0x809092,1,.3);line(g,b,c,0x809092,1,.25);}
function floorRect(g:G,x:number,y:number,w:number,h:number,color:number,alpha=1){polygon(g,[project({x,y}),project({x:x+w,y}),project({x:x+w,y:y+h}),project({x,y:y+h})],color,alpha);}
function rng(seed:number){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function drawEnvironment(g:G){
  const random=rng(709);g.fillStyle(0x080b10);g.fillRect(0,0,WIDTH,HEIGHT);
  // Distant, original city silhouettes and sparse windows.
  for(let i=0;i<22;i++){const x=i*65-40,y=40+random()*150,h=250+random()*360;g.fillStyle(i%2?0x101720:0x0d131a);g.fillRect(x,y,53,h);for(let r=0;r<16;r++)for(let c=0;c<3;c++)if(random()>.65){g.fillStyle(random()>.4?0x5f6152:0x47606a,.15+random()*.2);g.fillRect(x+8+c*14,y+15+r*21,5,8);}}
  slab(g,12,12,936,616,0,0x242b2e,0x10171d);
  // Floor tiles, wet patches, seams and fine aggregate are seeded, never flickering.
  for(let x=32;x<928;x+=48)for(let y=32;y<608;y+=48){floorRect(g,x,y,47,47,[0x252d30,0x293033,0x232a2d,0x2c3335][Math.floor(random()*4)]);if(random()>.60)floorRect(g,x+5,y+8,25+random()*15,random()*25,0x596369,.08);}
  for(let i=0;i<1300;i++){const p=project({x:35+random()*890,y:35+random()*570});g.fillStyle(random()>.5?0x97a1a1:0x0c1115,.10);g.fillRect(p.x,p.y,random()*3+1,1);}
  for(let y=100;y<560;y+=160){floorRect(g,48,y,120,8,0x121b20);for(let x=50;x<165;x+=8)line(g,project({x,y}),project({x,y:y+8}),0x566168,1,.5);}
  // Boundary rails: low enough to keep silhouettes visible.
  slab(g,12,12,936,18,22,0x42494b,0x1b2328);slab(g,12,12,18,616,22,0x42494b,0x1b2328);
  slab(g,930,12,18,616,13,0x384247,0x111b21);slab(g,12,610,936,18,13,0x384247,0x111b21);
  for(const p of [{x:110,y:35},{x:865,y:35},{x:50,y:560},{x:860,y:592}]){
    const q=project(p);for(let r=70;r>0;r-=7){g.fillStyle(0xffc990,.009);g.fillEllipse(q.x,q.y,r*2,r*.8);}line(g,project(p,2),project({x:p.x+44,y:p.y},2),0xffd8a4,3,.9);floorRect(g,p.x,p.y+6,42,16,0xd5a274,.12);
  }
  // Painted landing pad / maintenance markings, deliberately subdued.
  for(const [a,b]of [[{x:420,y:250},{x:440,y:250}],[{x:420,y:250},{x:420,y:275}],[{x:540,y:390},{x:520,y:390}],[{x:540,y:390},{x:540,y:365}]] as [Point,Point][])line(g,project(a),project(b),0x96a4a4,2,.3);
}
export function drawCover(g:G,w:Cover){
  const {x,y}=w;floorRect(g,x+15,y+12,w.w+12,w.h+15,0x030709,.5);
  slab(g,x,y,w.w,w.h,w.height,w.kind==='vent'?0x465054:0x3d4542,0x232b2f);
  if(w.kind==='vent'){
    for(let i=10;i<w.w-5;i+=8)line(g,project({x:x+i,y:y+6},w.height+1),project({x:x+i,y:y+w.h-6},w.height+1),0x172127,2,.9);
    for(const cx of [x+w.w*.28,x+w.w*.72]){const p=project({x:cx,y:y+w.h/2},w.height+2);g.fillStyle(0x151e23);g.fillEllipse(p.x,p.y,36,24);g.lineStyle(1,0x687579,.7);g.strokeEllipse(p.x,p.y,36,24);line(g,{x:p.x-11,y:p.y-5},{x:p.x+11,y:p.y+5},0x4c5c64,3);}
  }else{
    floorRect(g,x+6,y+6,w.w-12,w.h-12,0x192821);const r=rng(x+y);
    for(let i=0;i<24;i++){const p=project({x:x+7+r()*(w.w-14),y:y+7+r()*(w.h-14)},w.height+3+r()*9);g.fillStyle([0x38493c,0x263a30,0x496048][i%3]);g.fillTriangle(p.x,p.y-8,p.x-7,p.y+5,p.x+5,p.y+4);}
  }
  const a=project({x:x+8,y:y+w.h+1},16),b=project({x:x+32,y:y+w.h+1},16);line(g,a,b,0xffcc94,2,.8);
}

export function drawCharacter(g:G,f:Character,own:boolean,target:boolean,time:number){
  const color=own?0xdbe8e8:target?0xf07169:0x899ca9,p=project(f);
  if(!f.hp){g.lineStyle(1,color,.35);g.strokeEllipse(p.x,p.y,48,25);line(g,{x:p.x-14,y:p.y},{x:p.x+12,y:p.y-8},0x161d24,9);return;}
  g.fillStyle(0x000000,.5);g.fillEllipse(p.x+9,p.y+6,48,19);
  g.lineStyle(1.4,color,f.invulnerable>0?.35:.75);g.strokeEllipse(p.x,p.y,39,21);
  const moving=Math.hypot(f.dx,f.dy)>.05&&f.phase!=='stun',stride=moving?Math.sin(time*17)*6:1;
  // Upright body, coat tails, articulated legs/arms and a steel blade.
  const foot1=project({x:f.x+Math.cos(f.angle+1.57)*7+Math.cos(f.angle)*stride,y:f.y+Math.sin(f.angle+1.57)*7+Math.sin(f.angle)*stride});
  const foot2=project({x:f.x-Math.cos(f.angle+1.57)*7-Math.cos(f.angle)*stride,y:f.y-Math.sin(f.angle+1.57)*7-Math.sin(f.angle)*stride});
  const hip=project(f,17),body=project(f,28),head=project({x:f.x+Math.cos(f.angle)*3,y:f.y+Math.sin(f.angle)*3},42);
  line(g,hip,foot1,0x10151d,6);line(g,hip,foot2,0x111821,6);line(g,{x:foot1.x-2,y:foot1.y},{x:foot1.x+5,y:foot1.y},0x6b767b,2,.7);
  polygon(g,[{x:body.x-10,y:body.y-5},{x:body.x+9,y:body.y-5},{x:hip.x+13,y:hip.y+5},{x:hip.x-10,y:hip.y+10}],f.flash>0?0xe1e7e1:0x141c24);
  line(g,{x:body.x-9,y:body.y-4},{x:hip.x-9,y:hip.y+8},color,1,.6);
  const bladeAngle=f.angle+(f.phase==='wind'?-.85:f.phase==='swing'?.9-(f.timer/.10)*1.5:.25);
  const hand=project({x:f.x+Math.cos(bladeAngle+.4)*19,y:f.y+Math.sin(bladeAngle+.4)*19},24);
  line(g,body,hand,0x202b33,6);line(g,body,{x:body.x-12,y:body.y+10},0x111821,5);
  const tip=project({x:f.x+Math.cos(bladeAngle)*42,y:f.y+Math.sin(bladeAngle)*42},26);
  line(g,hand,tip,0xe5e6d9,2.5);g.fillStyle(0x1b222a);g.fillEllipse(head.x,head.y,14,17);line(g,{x:head.x-5,y:head.y-5},{x:head.x+3,y:head.y-7},color,1.5,.65);
  if(f.phase==='dash'){for(let i=1;i<5;i++){const q=project({x:f.x-f.dx*i*13,y:f.y-f.dy*i*13},24);line(g,{x:q.x,y:q.y-13},{x:q.x,y:q.y+7},color,7,.18*(1-i/5));}}
  if(f.phase==='wind'||f.phase==='swing'||f.phase==='parry'){
    const parry=f.phase==='parry',radius=parry?30:79,width=parry?3:f.phase==='swing'?5:1.5;
    const points=Array.from({length:24},(_,i)=>{const a=f.angle-1+i*2/23;return project({x:f.x+Math.cos(a)*radius,y:f.y+Math.sin(a)*radius},parry?12:3);});
    g.lineStyle(width,parry?0xaaddff:f.phase==='wind'?0xecc384:0xf8eee0,f.phase==='wind'?.55:.9);g.strokePoints(points,false);
  }
  if(f.invulnerable>0){g.lineStyle(1,0xd5e6ec,.5);g.strokeEllipse(p.x,p.y-23,38,58);}
  const health=project(f,59);g.fillStyle(0x0a1016,.9);g.fillRect(health.x-22,health.y,44,3);g.fillStyle(color);g.fillRect(health.x-22,health.y,44*f.hp/100,3);
}
export function drawEffect(g:G,e:CombatEvent,age:number){const p=project(e,20),alpha=Math.max(0,1-age/.4),color=e.type==='parry'?0xb6e7ff:e.type==='contract'?0xffd39b:0xe9ddd0;if(e.type==='hit'||e.type==='parry'){for(let i=0;i<8;i++){const a=i*Math.PI/4+e.seq;line(g,{x:p.x+Math.cos(a)*age*55,y:p.y+Math.sin(a)*age*40},{x:p.x+Math.cos(a)*(age*90+7),y:p.y+Math.sin(a)*(age*60+5)},color,1.6,alpha);}}if(e.type==='respawn'||e.type==='death'||e.type==='contract'){g.lineStyle(2,color,alpha);g.strokeEllipse(p.x,p.y+20,30+age*130,15+age*65);}}
