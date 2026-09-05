import {CombatWorld,createCharacter,type Command,type Snapshot} from '../shared/combat';
import {AIController} from '../shared/controllers';
export interface PlayerProfile {id:string;name:string;contracts:number;deaths:number;encounters:Record<string,{name:string;wins:number;losses:number}>;}
export class GameSession {
  snapshot:Snapshot|null=null;status='CONNECTING';profile:PlayerProfile|null=null;world:CombatWorld|null=null;
  private socket:WebSocket|null=null;private bots=new Map<string,AIController>();private seq=0;private sendTime=0;private accumulator=0;private disposed=false;private retry=0;
  constructor(public duel:boolean){
    if(duel){this.world=new CombatWorld('duel');this.world.add(createCharacter('you','YOU','human',{x:380,y:320}));this.world.add(createCharacter('kestrel','KESTREL','ai',{x:580,y:320}));this.bots.set('kestrel',new AIController());this.snapshot=this.world.snapshot('you');this.status='LOCAL DUEL';}
    else this.connect();
  }
  private connect(){
    if(this.disposed)return;this.status=this.snapshot?'RECONNECTING · COMBAT PAUSED':'CONNECTING';
    const ws=this.socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/socket`);
    ws.onopen=()=>{let token='';try{token=localStorage.getItem('lude-device-token')??'';}catch{}ws.send(JSON.stringify({type:'hello',token}));};
    ws.onmessage=e=>{const data=JSON.parse(e.data);if(data.type==='welcome'){try{localStorage.setItem('lude-device-token',data.token);}catch{}this.seq=0;this.status='LIVE';}if(data.snapshot)this.snapshot=data.snapshot;if(data.profile)this.profile=data.profile;};
    ws.onerror=()=>{this.status='SERVER UNAVAILABLE · RETRYING';};
    ws.onclose=e=>{if(this.disposed)return;if(e.code===4009){this.status='IDENTITY ACTIVE IN ANOTHER TAB';return;}this.status='CONNECTION LOST · RETRYING';this.retry=window.setTimeout(()=>this.connect(),1500);};
  }
  update(dt:number,input:Command){
    if(this.world){this.accumulator+=Math.min(dt,.1);let action=input.action;while(this.accumulator>=1/60){this.accumulator-=1/60;const commands=new Map<string,Command>([['you',{...input,action}]]);for(const f of this.world.fighters)if(f.controller==='ai')commands.set(f.id,this.bots.get(f.id)!.command(this.world,f,1/60));this.world.step(1/60,commands);action=undefined;}this.snapshot=this.world.snapshot('you');return;}
    this.sendTime+=dt;if((this.sendTime>=1/30||input.action)&&this.socket?.readyState===WebSocket.OPEN&&this.status==='LIVE'){this.sendTime=0;this.socket.send(JSON.stringify({type:'input',seq:++this.seq,...input}));}
  }
  dispose(){this.disposed=true;clearTimeout(this.retry);this.socket?.close();}
}
