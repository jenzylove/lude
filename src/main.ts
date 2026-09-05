import Phaser from 'phaser';
import {GameSession} from './client/session';
import {drawCharacter,drawCover,drawEffect,drawEnvironment,project,unproject,WIDTH,HEIGHT} from './client/render';
import {ROOFTOP,angleDifference,blocked} from './shared/arena';
import {RULES,type Action,type Character,type CombatEvent} from './shared/combat';
import './style.css';

const el=(id:string)=>document.getElementById(id)!;
const duel=new URLSearchParams(location.search).get('mode')==='duel';
class LudeScene extends Phaser.Scene {
  session=new GameSession(duel);g!:Phaser.GameObjects.Graphics;keys!:Record<string,Phaser.Input.Keyboard.Key>;
  pending:Action|undefined;aim=false;elapsed=0;lastEvent=0;lastTick=-1;own:Character|null=null;labels=new Map<string,Phaser.GameObjects.Text>();effects:{event:CombatEvent;time:number}[]=[];messageUntil=0;audio:AudioContext|null=null;muted=true;
  metrics={hits:0,parries:0,dashes:0,deaths:0,respawns:0,contracts:0};
  create(){
    drawEnvironment(this.add.graphics());this.g=this.add.graphics();
    this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,SHIFT,E,K,J') as typeof this.keys;
    this.input.mouse!.disableContextMenu();
    this.input.on('pointermove',()=>this.aim=true);
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{this.pending=p.rightButtonDown()?'parry':'strike';});
    this.input.keyboard!.on('keydown',(event:KeyboardEvent)=>{if(event.repeat)return;const key=event.code;if(key==='KeyJ')this.pending='strike';if(key==='KeyE'||key==='KeyK')this.pending='parry';if(key==='Space'||key==='ShiftLeft'||key==='ShiftRight')this.pending='dash';});
    window.addEventListener('blur',()=>{this.input.keyboard!.resetKeys();this.pending=undefined;this.session.update(.04,{x:0,y:0,angle:this.own?.angle??0});});
    el('sound').addEventListener('click',()=>{this.muted=!this.muted;el('sound').textContent=this.muted?'SOUND OFF':'SOUND ON';if(!this.muted){this.audio??=new AudioContext();void this.audio.resume();}});
    el('mode').textContent=duel?'DUEL / LOCAL':'HITLIST / LIVE';
    const link=el('mode-link') as HTMLAnchorElement;link.href=duel?'/':'/?mode=duel';link.textContent=duel?'ENTER HITLIST ↗':'PRACTICE DUEL ↗';
    if(import.meta.env.DEV)(window as any).__lude={get snapshot(){return scene.session.snapshot;},get metrics(){return scene.metrics;},get status(){return scene.session.status;},project};
    this.events.once('shutdown',()=>this.session.dispose());
  }
  combatSound(type:string){if(this.muted||!this.audio)return;const ctx=this.audio,osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;osc.type=type==='parry'?'sine':'triangle';osc.frequency.setValueAtTime(type==='parry'?920:type==='death'?110:230,now);osc.frequency.exponentialRampToValueAtTime(type==='parry'?430:55,now+.10);gain.gain.setValueAtTime(.05,now);gain.gain.exponentialRampToValueAtTime(.001,now+.13);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(now+.14);}
  notice(text:string){el('notice').textContent=text;this.messageUntil=this.elapsed+1.8;}
  update(_t:number,delta:number){
    const dt=Math.min(delta/1000,.05);this.elapsed+=dt;const s=this.session.snapshot,k=this.keys;if(!k)return;
    const authoritative=s?.fighters.find(f=>f.id===s.you);
    const sx=Number(k.D.isDown||k.RIGHT.isDown)-Number(k.A.isDown||k.LEFT.isDown),sy=Number(k.S.isDown||k.DOWN.isDown)-Number(k.W.isDown||k.UP.isDown);
    // Screen-relative controls, transformed back onto the ground plane.
    const ground=unproject({x:640+sx,y:405+sy}),len=Math.max(1,Math.hypot(ground.x-480,ground.y-320));const x=(ground.x-480)/len,y=(ground.y-320)/len;
    let angle=authoritative?.angle??0;
    if(authoritative){if(this.aim){const aim=unproject(this.input.activePointer);angle=Math.atan2(aim.y-authoritative.y,aim.x-authoritative.x);}else if(sx||sy)angle=Math.atan2(y,x);}
    const action=this.pending;this.pending=undefined;this.session.update(dt,{x,y,angle,action});
    const state=this.session.snapshot;if(!state){el('connection').textContent=this.session.status;return;}
    const own=state.fighters.find(f=>f.id===state.you)!;
    if(!this.own||this.own.id!==own.id||duel||Math.hypot(this.own.x-own.x,this.own.y-own.y)>65||own.phase==='dead')this.own={...own};
    else if(state.tick!==this.lastTick){const px=this.own.x,py=this.own.y;this.own={...own,x:px+(own.x-px)*.65,y:py+(own.y-py)*.65};}
    if(!duel&&this.session.status==='LIVE'&&this.own.phase==='idle'){
      const next={x:this.own.x+x*RULES.speed*dt,y:this.own.y+y*RULES.speed*dt};
      if(!blocked(ROOFTOP,next.x,this.own.y))this.own.x=next.x;if(!blocked(ROOFTOP,this.own.x,next.y))this.own.y=next.y;this.own.angle+=angleDifference(angle,this.own.angle);
    }
    this.lastTick=state.tick;
    for(const event of state.events){if(event.seq<=this.lastEvent)continue;this.lastEvent=event.seq;this.effects.push({event,time:this.elapsed});
      if(event.type==='hit')this.metrics.hits++;if(event.type==='parry')this.metrics.parries++;if(event.type==='dash')this.metrics.dashes++;if(event.type==='death')this.metrics.deaths++;if(event.type==='respawn')this.metrics.respawns++;if(event.type==='contract')this.metrics.contracts++;
      if(event.actor===state.you||event.victim===state.you){if(event.type==='hit'){this.cameras.main.shake(70,.0016);this.combatSound('hit');}if(event.type==='parry'){this.notice(event.actor===state.you?'PARRY · COUNTER NOW':'PARRIED · YOU ARE EXPOSED');this.combatSound('parry');}if(event.type==='death'){this.notice(event.victim===state.you?'YOU FELL · RETURNING IN 1.2s':event.reward?'CONTRACT CLOSED · +100':'SELF DEFENSE · NO CONTRACT SCORE');this.combatSound('death');}if(event.type==='respawn')this.notice('BACK IN · FIND YOUR CONTRACT');}
    }
    this.g.clear();const objects=[...ROOFTOP.cover.map(w=>({depth:project({x:w.x+w.w/2,y:w.y+w.h}).y,draw:()=>drawCover(this.g,w)})),...state.fighters.map(f=>({depth:project(f).y,draw:()=>drawCharacter(this.g,f.id===state.you?this.own!:f,f.id===state.you,f.id===state.target,this.elapsed)}))];objects.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
    this.effects=this.effects.filter(e=>this.elapsed-e.time<.4);this.effects.forEach(e=>drawEffect(this.g,e.event,this.elapsed-e.time));
    for(const f of state.fighters){let label=this.labels.get(f.id);if(!label){label=this.add.text(0,0,'',{fontFamily:'Arial',fontSize:'10px',color:'#c2c9c7'}).setOrigin(.5).setDepth(100);this.labels.set(f.id,label);}const p=project(f.id===state.you?this.own!:f,73);label.setPosition(p.x,p.y);label.setText(f.id===state.you?'YOU':`${f.id===state.target?'◇ ':''}${f.name}${f.controller==='ai'?' / AI':''}`);label.setColor(f.id===state.target?'#ef9386':'#b2c2c5');label.setAlpha(f.hp?1:.3);}
    this.hud(state,own);
  }
  hud(s:NonNullable<GameSession['snapshot']>,own:Character){
    const target=s.fighters.find(f=>f.id===s.target);el('target-name').textContent=target?.name??'—';el('target-kind').textContent=target?(target.controller==='ai'?'AI FIGHTER':'HUMAN FIGHTER'):'REASSIGNING';el('target-state').textContent=target?.hp?'ONE CONTRACT. ONE UNKNOWN HUNTER.':'TARGET RETURNING · WATCH YOUR BACK';
    el('connection').textContent=duel?'OFFLINE PRACTICE':`${this.session.status} · ${s.room} · ${s.fighters.filter(f=>f.controller==='human').length}/4 HUMAN`;
    el('health-fill').style.width=`${own.hp}%`;el('health-value').textContent=own.hp?`${own.hp} / 100`:`RETURN IN ${Math.max(0,own.timer).toFixed(1)}s`;el('score').textContent=String(own.score).padStart(3,'0');
    const abilities=[['strike',own.strikeCd,RULES.strikeCooldown],['dash',own.dashCd,RULES.dashCooldown],['parry',own.parryCd,RULES.parryCooldown]] as const;
    for(const [id,cd,max] of abilities){el(id).style.setProperty('--ready',`${100*(1-cd/max)}%`);el(id+'-time').textContent=cd>.05?cd.toFixed(1):'READY';}
    if(this.elapsed>this.messageUntil)el('notice').textContent=own.phase==='wind'?'BLADE COMMITTED':own.phase==='stun'?'EXPOSED':own.phase==='recover'?'RECOVERING':'READ THE WIND-UP. MAKE YOUR OPENING.';
    const profile=this.session.profile;el('profile').textContent=profile?`${profile.name} · ${profile.contracts} LIFETIME CONTRACTS`:'LOCAL PRACTICE · NO PERSISTENCE';
    el('connection').classList.toggle('offline',!duel&&this.session.status!=='LIVE');
    if(!duel&&this.session.status!=='LIVE')el('notice').textContent=this.session.status;
  }
}
const scene=new LudeScene();
new Phaser.Game({type:Phaser.AUTO,width:WIDTH,height:HEIGHT,parent:'game',backgroundColor:'#080b10',scene,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true},fps:{target:60}});

