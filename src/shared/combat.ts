import { ROOFTOP, angleDifference, blocked, clearLine, distance, type ArenaDefinition, type Point } from './arena';

export type Action='strike'|'dash'|'parry';
export type Phase='idle'|'wind'|'swing'|'recover'|'parry'|'dash'|'stun'|'dead';
export type ControllerKind='human'|'ai';
export interface Command {x:number;y:number;angle:number;action?:Action;}
export const IDLE:Command={x:0,y:0,angle:0};
export const RULES={speed:225,radius:17,damage:25,reach:86,wind:.23,swing:.10,recovery:.30,strikeCooldown:.70,parryWindow:.21,parryCooldown:.90,parryRecovery:.23,parryStun:.55,dashDuration:.135,dashCooldown:1.2,dashSpeed:740,respawn:1.2};
export interface Character extends Point {
  id:string;name:string;controller:ControllerKind;angle:number;hp:number;phase:Phase;timer:number;
  strikeCd:number;dashCd:number;parryCd:number;dx:number;dy:number;hit:boolean;flash:number;invulnerable:number;score:number;kills:number;deaths:number;
}
export interface CombatEvent {seq:number;type:'hit'|'parry'|'dash'|'death'|'respawn'|'contract';actor:string;victim?:string;x:number;y:number;reward?:number;}
export interface Snapshot {room:string;mode:'duel'|'hitlist';tick:number;arena:string;you:string;target:string|null;fighters:Character[];events:CombatEvent[];}
export const createCharacter=(id:string,name:string,controller:ControllerKind,p:Point):Character=>({id,name,controller,...p,angle:0,hp:100,phase:'idle',timer:0,strikeCd:0,dashCd:0,parryCd:0,dx:0,dy:0,hit:false,flash:0,invulnerable:.65,score:0,kills:0,deaths:0});

export class CombatWorld {
  fighters:Character[]=[];
  /** Private to simulation/server. Never serialize the assignment map to clients. */
  contracts=new Map<string,string>();
  events:CombatEvent[]=[];tick=0;eventSeq=0;
  constructor(public mode:'duel'|'hitlist'='hitlist',public arena:ArenaDefinition=ROOFTOP,public random:()=>number=Math.random){}
  add(f:Character){this.fighters.push(f);this.reassign();}
  reassign(){const order=this.fighters.map(f=>f.id);for(let i=order.length-1;i>0;i--){let j=Math.floor(this.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}this.contracts.clear();if(order.length>1)order.forEach((id,i)=>this.contracts.set(id,order[(i+1)%order.length]));}
  /** Swap victim with another member in the cycle: all in/out degrees remain one,
   * and a successful hunter gets a different target even while the victim respawns. */
  rotateAfterKill(killer:string,victim:string){
    const order=[killer];let id=this.contracts.get(killer);while(id&&id!==killer&&order.length<=this.fighters.length){order.push(id);id=this.contracts.get(id);}
    if(order.length>2&&order[1]===victim){[order[1],order[2]]=[order[2],order[1]];order.forEach((f,i)=>this.contracts.set(f,order[(i+1)%order.length]));}
  }
  emit(type:CombatEvent['type'],f:Character,victim?:Character,reward?:number){this.events.push({seq:++this.eventSeq,type,actor:f.id,victim:victim?.id,x:f.x,y:f.y,reward});if(this.events.length>40)this.events.shift();}
  move(f:Character,dx:number,dy:number){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/8));for(let i=0;i<steps;i++){if(!blocked(this.arena,f.x+dx/steps,f.y))f.x+=dx/steps;if(!blocked(this.arena,f.x,f.y+dy/steps))f.y+=dy/steps;}}
  command(f:Character,c:Command){
    if(f.hp<=0)return;
    if(f.phase!=='dash'){let len=Math.max(1,Math.hypot(c.x,c.y));f.dx=c.x/len;f.dy=c.y/len;}
    if(f.phase==='idle')f.angle=c.angle;
    if(!c.action||f.phase!=='idle')return;
    if(c.action==='strike'&&f.strikeCd<=0){f.phase='wind';f.timer=RULES.wind;f.strikeCd=RULES.strikeCooldown;f.hit=false;f.invulnerable=0;}
    if(c.action==='parry'&&f.parryCd<=0){f.phase='parry';f.timer=RULES.parryWindow;f.parryCd=RULES.parryCooldown;f.invulnerable=0;}
    if(c.action==='dash'&&f.dashCd<=0){f.phase='dash';f.timer=RULES.dashDuration;f.dashCd=RULES.dashCooldown;let len=Math.hypot(f.dx,f.dy);if(len){f.dx/=len;f.dy/=len;}else{f.dx=Math.cos(f.angle);f.dy=Math.sin(f.angle);}this.emit('dash',f);}
  }
  hit(a:Character,b:Character){
    if(a.hit||!b.hp||b.invulnerable>0||b.phase==='dash'||distance(a,b)>RULES.reach||!clearLine(this.arena,a,b))return;
    const angle=Math.atan2(b.y-a.y,b.x-a.x);if(Math.abs(angleDifference(angle,a.angle))>.95)return;
    a.hit=true;
    if(b.phase==='parry'&&Math.abs(angleDifference(angle+Math.PI,b.angle))<1.15){a.phase='stun';a.timer=RULES.parryStun;b.phase='idle';b.timer=0;b.strikeCd=0;this.emit('parry',b,a);return;}
    b.hp=Math.max(0,b.hp-RULES.damage);b.flash=.15;b.phase='stun';b.timer=.17;this.move(b,Math.cos(angle)*16,Math.sin(angle)*16);this.emit('hit',a,b);
    if(!b.hp){b.phase='dead';b.timer=RULES.respawn;b.deaths++;a.kills++;const valid=this.contracts.get(a.id)===b.id;const reward=valid?100:0;if(valid){a.score+=reward;this.rotateAfterKill(a.id,b.id);this.emit('contract',a,b,reward);}this.emit('death',a,b,reward);}
  }
  respawn(f:Character){let spawn=this.arena.spawns[0],best=-1;for(const p of this.arena.spawns){const score=Math.min(...this.fighters.filter(o=>o!==f&&o.hp>0).map(o=>distance(o,p)));if(score>best){best=score;spawn=p;}}Object.assign(f,{...spawn,hp:100,phase:'idle',timer:0,strikeCd:0,dashCd:0,parryCd:0,dx:0,dy:0,flash:0,invulnerable:.65,hit:false});this.emit('respawn',f);}
  step(dt:number,commands:Map<string,Command>){
    this.tick++;
    for(const f of this.fighters){
      f.flash=Math.max(0,f.flash-dt);f.invulnerable=Math.max(0,f.invulnerable-dt);f.strikeCd=Math.max(0,f.strikeCd-dt);f.dashCd=Math.max(0,f.dashCd-dt);f.parryCd=Math.max(0,f.parryCd-dt);
      if(f.phase==='dead'){f.timer=Math.max(0,f.timer-dt);if(f.timer<=0)this.respawn(f);continue;}
      f.timer=Math.max(0,f.timer-dt);
      if(f.timer<=0){switch(f.phase){case 'wind':f.phase='swing';f.timer=RULES.swing;break;case 'swing':f.phase='recover';f.timer=RULES.recovery;break;case 'parry':f.phase='recover';f.timer=RULES.parryRecovery;break;case 'recover':case 'dash':case 'stun':f.phase='idle';f.timer=0;}}
      this.command(f,commands.get(f.id)??{...IDLE,angle:f.angle});
      const speed=f.phase==='dash'?RULES.dashSpeed:f.phase==='idle'||f.phase==='parry'?RULES.speed:f.phase==='wind'?85:f.phase==='stun'?0:80;
      this.move(f,f.dx*speed*dt,f.dy*speed*dt);
    }
    // Rotate iteration order so simultaneous strikes do not privilege one slot forever.
    const order=this.fighters.slice(this.tick%this.fighters.length).concat(this.fighters.slice(0,this.tick%this.fighters.length));
    for(const f of order)if(f.phase==='swing')for(const other of this.fighters)if(other!==f){this.hit(f,other);if(f.phase!=='swing')break;}
    for(let i=0;i<this.fighters.length;i++)for(let j=i+1;j<this.fighters.length;j++){const a=this.fighters[i],b=this.fighters[j],d=distance(a,b);if(a.hp&&b.hp&&d<34){const nx=d?(a.x-b.x)/d:1,ny=d?(a.y-b.y)/d:0;this.move(a,nx*(34-d)/2,ny*(34-d)/2);this.move(b,-nx*(34-d)/2,-ny*(34-d)/2);}}
  }
  snapshot(you:string,room='local'):Snapshot{return {room,mode:this.mode,tick:this.tick,arena:this.arena.id,you,target:this.contracts.get(you)??null,fighters:this.fighters.map(f=>({...f})),events:this.events.map(e=>({...e}))};}
}

