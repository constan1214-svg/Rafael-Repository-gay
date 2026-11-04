export const MAX_RECORDING = 10;
export const FLOORS = [
  {x:0,z:0,w:18,d:18,y:0}, {x:-12,z:0,w:6,d:5,y:0},
  {x:-24,z:0,w:18,d:16,y:0}, {x:12,z:0,w:6,d:5,y:0},
  {x:24,z:0,w:18,d:16,y:0}, {x:0,z:-12,w:5,d:6,y:0},
  {x:0,z:-26,w:18,d:22,y:0}
];
export const CORES = [{x:-29,z:0},{x:29,z:0},{x:0,z:-33}];
export const SWITCHES = [{x:23,z:-5},{x:23,z:5}];
export const PLATE = {x:-18,z:3};
export const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
export function sampleFrames(frames,t) {
  if (!frames.length) return null;
  if (t<=0) return {...frames[0]};
  if (t>=frames.at(-1).t) return {...frames.at(-1)};
  let lo=0,hi=frames.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(frames[mid].t<=t)lo=mid;else hi=mid;}
  const a=frames[lo],b=frames[hi],f=(t-a.t)/(b.t-a.t);
  const yawDelta=Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw));
  return {t,x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,z:a.z+(b.z-a.z)*f,yaw:a.yaw+yawDelta*f};
}
export class Timeline {
  constructor(){this.frames=[];this.events=[];this.recording=false;this.time=0;this.echoes=[];this.serial=0;}
  toggle(p){if(this.recording){this.recording=false;return 'saved';}this.frames=[{...p,t:0}];this.events=[];this.time=0;this.recording=true;return 'started';}
  record(dt,p){if(!this.recording)return false;this.time=Math.min(MAX_RECORDING,this.time+dt);this.frames.push({...p,t:this.time});if(this.time>=MAX_RECORDING){this.recording=false;return true;}return false;}
  interact(id){if(this.recording)this.events.push({t:this.time,id});}
  spawn(){if(this.recording||this.frames.length<2)return null;const echo={id:++this.serial,frames:this.frames.map(f=>({...f})),events:this.events.map(e=>({...e})),time:0,eventIndex:0,pose:{...this.frames[0]}};this.echoes.push(echo);if(this.echoes.length>3)this.echoes.shift();return echo;}
  step(dt,onEvent){for(const e of this.echoes){e.time+=dt;e.pose=sampleFrames(e.frames,e.time);while(e.eventIndex<e.events.length&&e.events[e.eventIndex].t<=e.time){const event=e.events[e.eventIndex++];onEvent(event.id,sampleFrames(e.frames,event.t));}}}
  clear(){this.echoes=[];}
}
export function standingOnPlate(actors){return actors.some(a=>distance(a,PLATE)<1.35&&Math.abs(a.y)<.4);}
export function switchReach(p,index){return distance(p,SWITCHES[index])<2.3&&p.y<2.4;}
export function floorAt(x,z,floors=FLOORS){return floors.filter(f=>Math.abs(x-f.x)<=f.w/2&&Math.abs(z-f.z)<=f.d/2).reduce((top,f)=>Math.max(top,f.y),-Infinity);}
export function overlaps(p,wall,radius=.32){return Math.abs(p.x-wall.x)<wall.w/2+radius&&Math.abs(p.z-wall.z)<wall.d/2+radius&&p.y<wall.y+wall.h&&p.y+1.65>wall.y;}
export function movePlayer(p,velocity,dt,walls,floors=FLOORS){
  const steps=Math.max(1,Math.ceil(Math.hypot(velocity.x,velocity.z)*dt/.18));
  for(let i=0;i<steps;i++){for(const axis of ['x','z']){const old=p[axis];p[axis]+=velocity[axis]*dt/steps;if(walls.some(w=>overlaps(p,w)))p[axis]=old;}}
  const previous=p.y;velocity.y-=20*dt;p.y+=velocity.y*dt;const ground=floorAt(p.x,p.z,floors);p.grounded=false;
  if(velocity.y<=0&&previous>=ground-.08&&p.y<=ground){p.y=ground;velocity.y=0;p.grounded=true;}
}
export class PuzzleState {
  constructor(){this.cores=[false,false,false];this.switchUntil=[-1,-1];this.dualSolved=false;this.time=0;this.plate=false;}
  activate(index,pose){if(this.cores[0]&&switchReach(pose,index)){this.switchUntil[index]=this.time+1.5;return true;}return false;}
  step(dt,actors){this.time+=dt;this.plate=standingOnPlate(actors);if(this.switchUntil.every(t=>t>=this.time))this.dualSolved=true;}
  canCollect(index,p,drone){if(distance(p,CORES[index])>2.2||p.y>2)return false;if(index===0)return this.plate||p.x<-23;if(index===1)return this.dualSolved;if(index===2)return this.cores[1]&&drone.mode==='decoy'&&distance(drone,CORES[2])>7;return false;}
  collect(index,p,drone){if(this.cores[index]||!this.canCollect(index,p,drone))return false;this.cores[index]=true;return true;}
  get won(){return this.cores.every(Boolean);}
}
