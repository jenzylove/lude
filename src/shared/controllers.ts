import {clearLine,distance,waypoint,type Point} from './arena';
import {CombatWorld,RULES,type Character,type Command} from './combat';

/** A controller proposes intent, never health/damage/movement privileges. */
export interface Controller { command(world:CombatWorld,f:Character,dt:number):Command; }
export class AIController implements Controller {
  think=0;routeTimer=0;orbit=1;route:Point|null=null;
  constructor(private random:()=>number=Math.random){this.orbit=random()<.5?-1:1;}
  command(world:CombatWorld,f:Character,dt:number):Command {
    this.think-=dt;this.routeTimer-=dt;
    const contract=world.fighters.find(o=>o.id===world.contracts.get(f.id)&&o.hp>0);
    // Defend against visible nearby threats, without knowing who is hunting us.
    const threat=world.fighters.find(o=>o!==f&&o.hp>0&&distance(o,f)<105&&(o.phase==='wind'||o.phase==='swing')&&clearLine(world.arena,f,o));
    const enemy=threat??contract??world.fighters.find(o=>o!==f&&o.hp>0);
    if(!enemy)return {x:0,y:0,angle:f.angle};
    const d=distance(f,enemy),a=Math.atan2(enemy.y-f.y,enemy.x-f.x);
    let x=0,y=0;
    if(d>91||!clearLine(world.arena,f,enemy,20)){
      if(this.routeTimer<=0||!this.route){this.route=waypoint(world.arena,f,enemy);this.routeTimer=.22;}
      const len=distance(f,this.route)||1;x=(this.route.x-f.x)/len;y=(this.route.y-f.y)/len;
    }else{const radial=d<62?-.65:d>77?.45:0;x=Math.cos(a)*radial-Math.sin(a)*this.orbit*.35;y=Math.sin(a)*radial+Math.cos(a)*this.orbit*.35;}
    const c:Command={x,y,angle:a};
    if(this.think>0||f.phase!=='idle')return c;
    this.think=.08+this.random()*.07;
    // Minimum 120 ms observation delay; reactions are imperfect and share cooldowns.
    if(threat?.phase==='wind'&&threat.timer<RULES.wind-.12&&this.random()<.70){
      if(f.parryCd<=0&&this.random()<.66)c.action='parry';
      else if(f.dashCd<=0){c.x=-Math.cos(a);c.y=-Math.sin(a);c.action='dash';}
    }else if(d<87&&clearLine(world.arena,f,enemy)&&enemy.phase!=='parry'&&this.random()<.70)c.action='strike';
    else if(d>220&&clearLine(world.arena,f,enemy,20)&&this.random()<.12)c.action='dash';
    if(this.random()<.035)this.orbit*=-1;
    return c;
  }
}
