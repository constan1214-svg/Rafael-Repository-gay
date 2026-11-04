import * as THREE from 'three';
import './style.css';
import {Timeline,PuzzleState,FLOORS,CORES,SWITCHES,PLATE,distance,movePlayer} from './simulation.js';
const $=id=>document.getElementById(id);
const canvas=$('world');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch{ $('fatal').hidden=false;$('fatal-message').textContent='WebGL is unavailable. Enable hardware acceleration and reopen ECHOBOUND in a current desktop browser.';throw new Error('WebGL unavailable');}
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#07121e');scene.fog=new THREE.FogExp2('#112739',.012);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,240);camera.rotation.order='YXZ';
scene.add(new THREE.HemisphereLight(0xbbeeff,0x121227,2));
const sun=new THREE.DirectionalLight(0xc6e8ff,3);sun.position.set(-30,50,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:1,far:130});sun.shadow.bias=-.001;scene.add(sun);
const purple=new THREE.DirectionalLight(0x9c78ff,1.5);purple.position.set(20,15,-30);scene.add(purple);
const mat=(color,roughness=.65,metalness=.3)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const steel=mat('#243747'),dark=mat('#10202d'),edge=mat('#466075'),floorMat=mat('#344856'),white=mat('#acc2c6');
const glow=color=>new THREE.MeshBasicMaterial({color});const cyan=glow('#7effdf'),violet=glow('#9a88ff'),orange=glow('#ffbb7d');
const boxGeo=new THREE.BoxGeometry(1,1,1);const walls=[];const animated=[];const coreMeshes=[];const switchMeshes=[];const echoMeshes=new Map();
function box(x,y,z,w,h,d,material=steel,parent=scene){const m=new THREE.Mesh(boxGeo,material);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function solid(x,y,z,w,h,d,material=steel){const m=box(x,y+h/2,z,w,h,d,material);walls.push({x,y,z,w,h,d});return m;}
function label(text,x,y,z,color='#b8eee4',size=2,rotation=0){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='500 43px monospace';ctx.textAlign='center';ctx.fillText(text,256,75);const tex=new THREE.CanvasTexture(c);const m=new THREE.Mesh(new THREE.PlaneGeometry(size*4,size),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=rotation;scene.add(m);return m;}
for(const f of FLOORS){box(f.x,-.6,f.z,f.w,1.2,f.d,dark);box(f.x,-.08,f.z,f.w,.16,f.d,floorMat);for(let x=f.x-f.w/2+1;x<f.x+f.w/2;x+=3)box(x,.011,f.z,.025,.018,f.d,edge);for(let z=f.z-f.d/2+1;z<f.z+f.d/2;z+=3)box(f.x,.012,z,f.w,.018,.025,edge);for(const side of [-1,1]){box(f.x,-.25,f.z+side*(f.d/2-.1),f.w,.12,.12,cyan);box(f.x+side*(f.w/2-.1),-.25,f.z,.12,.12,f.d,cyan);}box(f.x,-2.2,f.z,f.w*.7,2,f.d*.65,dark);}
// Main atrium: suspended gantries, a central departure ring and broken machinery.
for(const x of [-7,7])for(const z of [-7,7]){solid(x,0,z,.65,7,.65,dark);box(x+.34,3,z,.035,5,.2,cyan);box(x,7,z,1.2,.4,1.2,edge);box(x,-4,z,.8,5,.8,steel);}
for(const z of [-7,7])box(0,7,z,14,.5,.6,steel);
box(0,7,-7,11,.08,.08,cyan);
for(const x of [-7,7])box(x,7,0,.6,.5,14,steel);
label('A E T H E R',0,5.8,-7.36,'#b4cbd5',1.1);
label('DEPARTURE // 09',0,3,8.25,'#94aeba',.52);
for(let i=0;i<3;i++){solid(-5+i*1.3,0,6,1,1.2,1.2,dark);box(-5+i*1.3,1.22,6,.65,.03,.8,violet);}
// Portal faces the hub.
const portal=new THREE.Group();portal.position.set(0,2.5,6.5);scene.add(portal);
const ring=new THREE.Mesh(new THREE.TorusGeometry(2.1,.2,6,48),steel);portal.add(ring);
const innerRing=new THREE.Mesh(new THREE.TorusGeometry(1.85,.045,4,64),violet);portal.add(innerRing);
const portalSurface=new THREE.Mesh(new THREE.CircleGeometry(1.78,48),new THREE.MeshBasicMaterial({color:0x9affda,transparent:true,opacity:.03,side:THREE.DoubleSide,depthWrite:false}));portal.add(portalSurface);
box(0,.12,6.5,5,.24,2,dark);
const gateMaterial=new THREE.MeshBasicMaterial({color:0x78e9e4,transparent:true,opacity:.28,side:THREE.DoubleSide});
function gate(x,z,w,d,color=cyan){const m=box(x,2,z,w,4,d,gateMaterial.clone());box(x,4.1,z,w+.3,.2,d+.3,edge);return m;}
const plateGate=gate(-22.5,0,.25,16);const eastGate=gate(12,0,.25,5);const northGate=gate(0,-12,5,.25);
const gateWalls=[{x:-22.5,z:0,w:.3,d:16,y:0,h:5},{x:12,z:0,w:.3,d:5,y:0,h:5},{x:0,z:-12,w:5,d:.3,y:0,h:5}];
// Outer chamber walls prevent bypassing puzzle barriers; interior bridges have open edges.
for(const cx of [-24,24]){for(const z of [-8,8]){solid(cx,0,z,18,3,.4,dark);box(cx,2.65,z,18,.05,.43,cx<0?cyan:violet);}solid(cx+(cx<0?-9:9),0,0,.4,3,16,dark);for(const z of [-5.3,5.3])solid(cx+(cx<0?9:-9),0,z,.4,3,5.4,dark);for(const x of [cx-7,cx+7]){box(x,4,-7.8,.5,8,.5,steel);box(x,4,7.8,.5,8,.5,steel);box(x,8,0,.5,.5,16,steel);}}
for(const x of [-9,9]){solid(x,0,-26,.4,3,22,dark);box(x,2.6,-26,.43,.07,22,violet);}solid(0,0,-37,18,5,.4,dark);label('03 / THE WATCHER',0,4,-36.7,'#b0a4e8',.7);
label('01 / RESIDUAL WEIGHT',-24,5,-7.7,'#9ceddd',.66);label('02 / PERFECT UNISON',24,5,-7.7,'#c3adff',.66);
label('MEMORY LAB',-13,.5,-2.5,'#a8e4dc',.32);label('RESONANCE',13,.5,-2.5,'#baafff',.32);label('OBSERVATORY',0,1,-15.2,'#baafff',.4);
const plate=box(PLATE.x,.06,PLATE.z,2.5,.12,2.5,steel);const plateLight=box(PLATE.x,.13,PLATE.z,2.1,.03,2.1,cyan);label('STAND / RECORD / LEAVE',-18,2,6.8,'#b3dcd7',.33);
for(let i=0;i<2;i++){const s=SWITCHES[i];solid(s.x,0,s.z,.8,1.2,.8,dark);const m=box(s.x,1.4,s.z,.7,.4,.7,violet);switchMeshes.push(m);label(i?'B / SYNC':'A / SYNC',s.x,2.25,s.z,'#c3b3ff',.25);}
for(let i=0;i<3;i++){const c=CORES[i];box(c.x,.3,c.z,1.8,.6,1.8,dark);box(c.x,.62,c.z,1.5,.05,1.5,i===0?cyan:violet);const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.55),new THREE.MeshStandardMaterial({color:0xc4ffe6,emissive:0x69ffce,emissiveIntensity:2,metalness:.3,roughness:.3}));mesh.position.set(c.x,1.65,c.z);scene.add(mesh);coreMeshes.push(mesh);}
// Drone lure marking and cover.
const lure=box(-5,.03,-23,3,.04,3,violet);label('ECHO DECOY',-5,1,-21,'#b6a2ec',.3);
solid(5,0,-24,2,2.2,3,steel);solid(-6,0,-31,2,2.5,3,steel);
const droneMesh=new THREE.Group();scene.add(droneMesh);const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(.65,0),white);droneMesh.add(shell);const droneEye=new THREE.Mesh(new THREE.SphereGeometry(.17,8,6),orange);droneEye.position.z=.55;droneMesh.add(droneEye);for(const x of [-1,1]){box(x*.7,0,0,.65,.15,.4,dark,droneMesh);const halo=new THREE.Mesh(new THREE.TorusGeometry(.38,.025,4,16),cyan);halo.rotation.x=Math.PI/2;halo.position.x=x;droneMesh.add(halo);}
// A small moving maintenance lift is optional, never needed for critical progression.
const lift=box(6,.1,-18,2,.2,2,steel);
const liftTrim=new THREE.Mesh(boxGeo,cyan);liftTrim.scale.set(.9,.15,.9);liftTrim.position.set(0,.65,0);lift.add(liftTrim);
// Soft procedural halos add luminous accents without a full-screen bloom pass.
const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=64;const haloContext=haloCanvas.getContext('2d');const gradient=haloContext.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(125,255,220,.65)');gradient.addColorStop(.2,'rgba(100,240,220,.2)');gradient.addColorStop(1,'rgba(100,240,220,0)');haloContext.fillStyle=gradient;haloContext.fillRect(0,0,64,64);const haloTexture=new THREE.CanvasTexture(haloCanvas);
for(const core of coreMeshes){const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:haloTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));halo.scale.set(3,3,3);core.add(halo);}
const containment=new THREE.Group();containment.position.set(29,0,0);scene.add(containment);
for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.95,.025,4,32),violet);ring.rotation.x=Math.PI/2;ring.position.y=.9+i*.55;containment.add(ring);}
const shards=[];for(const [x,z,text] of [[-6,3,'LOG 01 · We thought time was a river. It was a room.'],[30,6,'LOG 02 · The copies remembered how to wait. We did not.'],[7,-34,'LOG 03 · If you hear yourself, follow the voice home.']]){const m=new THREE.Mesh(new THREE.TetrahedronGeometry(.25),orange);m.position.set(x,1,z);scene.add(m);shards.push({x,z,text,mesh:m,found:false});}
// Distant suspended architecture, concentric orbital arcs and drifting dust.
for(let i=0;i<35;i++){const angle=i*2.39996,r=58+(i%5)*10,x=Math.cos(angle)*r,z=Math.sin(angle)*r;const h=8+(i*7%25);box(x,-10-h/2,z,5+i%4,h,5+i%3,dark);box(x,-9,z,5.1,.08,5.1,i%3?violet:cyan);if(i%3===0)box(x,-5,z,.4,12,.4,steel);}
const orbit=new THREE.Mesh(new THREE.TorusGeometry(64,.17,4,140),new THREE.MeshBasicMaterial({color:0x41697a}));orbit.position.set(0,20,-48);orbit.rotation.set(.5,.4,.2);scene.add(orbit);
const moon=new THREE.Mesh(new THREE.SphereGeometry(10,24,16),new THREE.MeshBasicMaterial({color:0x719198}));moon.position.set(48,36,-100);scene.add(moon);
const positions=[];let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<650;i++)positions.push((rand()-.5)*180,rand()*70-20,(rand()-.5)*180);const particlesGeo=new THREE.BufferGeometry();particlesGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const dust=new THREE.Points(particlesGeo,new THREE.PointsMaterial({color:0x9cddd6,size:.065,transparent:true,opacity:.65}));scene.add(dust);
function makeEcho(id){const g=new THREE.Group();const color=[0x70ffe1,0xb9a0ff,0x83caff][(id-1)%3];const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.48,wireframe:false});const body=new THREE.Mesh(new THREE.CylinderGeometry(.23,.31,.72,6),material);body.position.y=1;g.add(body);const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.23,1),material);head.position.y=1.62;g.add(head);const limbs=[];for(const x of [-.18,.18]){const leg=box(x,.36,0,.17,.7,.18,material,g);limbs.push(leg);}for(const x of [-.39,.39]){const arm=box(x,1,0,.13,.65,.14,material,g);limbs.push(arm);}const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.018,3,24),glow(color));ring.rotation.x=Math.PI/2;ring.position.y=.04;g.add(ring);g.userData.limbs=limbs;scene.add(g);return g;}
let audio,master,ambient;
function initAudio(){if(!audio){audio=new AudioContext();master=audio.createGain();master.gain.value=Number($('volume').value)*.25;master.connect(audio.destination);ambient=audio.createOscillator();const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=130;const gain=audio.createGain();gain.gain.value=.12;ambient.type='sawtooth';ambient.frequency.value=55;ambient.connect(filter).connect(gain).connect(master);ambient.start();}audio.resume();}
function sound(freq=440,duration=.18,type='sine',gain=.2){if(!audio||audio.state!=='running')return;const osc=audio.createOscillator(),g=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*.5,audio.currentTime+duration);g.gain.setValueAtTime(gain,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(g).connect(master);osc.start();osc.stop(audio.currentTime+duration);}
let timeline=new Timeline(),puzzles=new PuzzleState();let player={x:0,y:0,z:2,yaw:0,grounded:true};const velocity={x:0,y:0,z:0};let drone={x:0,z:-31,mode:'patrol',timer:0};let mode='menu',elapsed=0,spawnCount=0,toastTime=0,stepTime=0;let pitch=0;const keys=new Set();let checkpoint={x:0,z:2};let lastPlate=false;let settingsReturn='menu';let sensitivity=1;let lastDual=false;
const hints=[['01 / THE WEIGHT OF MEMORY','West · Stand on the cyan plate. Press R, wait a moment, then R again. Step away and press E. Your echo holds the door.'],['02 / PERFECT UNISON','East · At switch A, press R and F. Wait 8 seconds, then R. Walk to B, press E then F immediately to synchronize.'],['03 / BORROWED ATTENTION','North · Record yourself on the purple decoy pad. Spawn an echo to draw the drone away, then retrieve the core.'],['04 / A WAY HOME','All three cores restored. Return to the departure ring in the central atrium and press F.']];
function toast(text){$('toast').textContent=text;toastTime=5;}
function lock(){const promise=canvas.requestPointerLock?.();promise?.catch(()=>toast('Click the scene to capture the mouse.'));}
function play(){initAudio();mode='playing';$('menu').hidden=true;$('pause').hidden=true;$('victory').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');lock();}
function pause(){if(mode!=='playing')return;mode='paused';keys.clear();$('pause').hidden=false;document.exitPointerLock?.();audio?.suspend();}
function reset(){timeline=new Timeline();puzzles=new PuzzleState();player={x:0,y:0,z:2,yaw:0,grounded:true};Object.assign(velocity,{x:0,y:0,z:0});pitch=0;elapsed=0;spawnCount=0;drone={x:0,z:-31,mode:'patrol',timer:0};checkpoint={x:0,z:2};lastDual=false;lastPlate=false;shards.forEach(s=>{s.found=false;s.mesh.visible=true;});play();toast('Welcome back, operator. The west chamber is online.');}
$('play').onclick=()=>{play();toast('Recover three energy cores. Your echoes hold their final pose until dismissed.');};$('resume').onclick=play;$('restart').onclick=reset;$('again').onclick=reset;$('menu-button').onclick=pause;
function openSettings(){settingsReturn=mode;if(mode==='playing')pause();mode='settings';$('settings').hidden=false;}
$('settings-button').onclick=openSettings;$('pause-settings').onclick=openSettings;$('close-settings').onclick=()=>{$('settings').hidden=true;mode=settingsReturn==='playing'?'paused':settingsReturn;};
$('volume').oninput=()=>{if(master)master.gain.value=Number($('volume').value)*.25;saveSettings();};$('sensitivity').oninput=()=>{sensitivity=Number($('sensitivity').value);saveSettings();};
function quality(){const q=$('quality').value;renderer.setPixelRatio(Math.min(devicePixelRatio,q==='low'?1:q==='medium'?1.4:2));renderer.shadowMap.enabled=q!=='low';dust.visible=q!=='low';saveSettings();}
$('quality').onchange=quality;
function saveSettings(){try{localStorage.setItem('echobound-settings',JSON.stringify({quality:$('quality').value,volume:$('volume').value,sensitivity:$('sensitivity').value}));}catch{}}
try{const s=JSON.parse(localStorage.getItem('echobound-settings'));if(s){for(const key of ['quality','volume','sensitivity'])if(s[key]!=null)$(key).value=s[key];sensitivity=Number($('sensitivity').value);quality();}}catch{}
canvas.addEventListener('click',()=>{if(mode==='playing')lock();});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&mode==='playing')pause();});
document.addEventListener('mousemove',e=>{if(mode==='playing'&&document.pointerLockElement===canvas){player.yaw-=e.movementX*.002*sensitivity;pitch=Math.max(-1.45,Math.min(1.45,pitch-e.movementY*.002*sensitivity));}});
window.addEventListener('blur',()=>{keys.clear();pause();});
document.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(mode==='playing')pause();else if(mode==='settings')$('close-settings').click();return;}if(mode!=='playing'||e.repeat)return;keys.add(e.code);if(e.code==='Space'&&player.grounded){velocity.y=7.2;player.grounded=false;sound(120,.1);}if(e.code==='KeyR'){const state=timeline.toggle(player);sound(state==='started'?660:440);toast(state==='started'?'Recording · movement and F interactions · maximum 10 seconds':'Memory saved. Press E to create an echo.');}if(e.code==='KeyE'){const echo=timeline.spawn();if(echo){spawnCount++;sound(880,.6);toast('Echo manifested. It will hold its final position.');}else toast(timeline.recording?'Press R to finish recording first.':'Press R to record a memory first.');}if(e.code==='KeyX'){timeline.clear();sound(220);toast('All echoes dismissed. Your recording is still available.');}if(e.code==='KeyF')interact();});
document.addEventListener('keyup',e=>keys.delete(e.code));
function interact(){for(let i=0;i<2;i++)if(puzzles.activate(i,player)){timeline.interact(i);sound(550+i*200);toast('Switch '+(i?'B':'A')+' pulsed · 1.5 second synchronization window');return;}for(let i=0;i<3;i++)if(puzzles.collect(i,player,drone)){sound(1100,.8);checkpoint={x:0,z:0};toast(['Core 01 recovered. East resonance chamber unlocked.','Core 02 recovered. North observatory unlocked.','All cores recovered. Return to the departure ring.'][i]);return;}for(const s of shards)if(!s.found&&distance(player,s)<1.8){s.found=true;s.mesh.visible=false;toast(s.text);sound(600,.4);return;}if(puzzles.won&&distance(player,{x:0,z:6.5})<3){mode='won';$('victory').hidden=false;$('hud').hidden=true;$('results').textContent=`${Math.floor(elapsed/60)}m ${Math.floor(elapsed%60)}s · ${spawnCount} echoes · ${shards.filter(s=>s.found).length}/3 archive fragments`;document.exitPointerLock?.();sound(1320,1);return;}toast('Nothing within reach. Look for cores, archive fragments, or resonance switches.');}
function respawn(message){Object.assign(player,{...checkpoint,y:0,grounded:true});Object.assign(velocity,{x:0,y:0,z:0});timeline.recording=false;toast(message);sound(100,.5);}
function updateDrone(dt){const old=drone.mode;const echoes=timeline.echoes.filter(e=>e.pose.z<-16&&distance(e.pose,drone)<22);let target;
  if(echoes.length){target=echoes.reduce((a,b)=>distance(a.pose,drone)<distance(b.pose,drone)?a:b).pose;drone.mode='decoy';drone.timer=3;}
  else if(player.z<-17&&distance(player,drone)<10){target=player;drone.mode='alert';drone.timer=3;}
  else if(drone.mode==='alert'&&drone.timer>0&&player.z<-15){drone.timer-=dt;target=player;}
  else{drone.mode='patrol';target={x:Math.sin(elapsed*.3)*4,z:-29+Math.cos(elapsed*.3)*3};}
  if(old!==drone.mode&&drone.mode==='alert')sound(230,.4,'sawtooth');const d=distance(drone,target);if(d>.65){const speed=drone.mode==='patrol'?1.6:3.3;drone.x+=(target.x-drone.x)/d*Math.min(d,speed*dt);drone.z+=(target.z-drone.z)/d*Math.min(d,speed*dt);}
  droneMesh.position.set(drone.x,2.2+Math.sin(elapsed*3)*.15,drone.z);droneMesh.rotation.y=Math.atan2(target.x-drone.x,target.z-drone.z);droneEye.material.color.set(drone.mode==='alert'?'#ff6677':drone.mode==='decoy'?'#bb99ff':'#ffbb7d');if(drone.mode==='alert'&&distance(player,drone)<1.1)respawn('Security recall · returned to the atrium checkpoint. Use an echo as a decoy.');
}
function prompt(){for(let i=0;i<3;i++)if(!puzzles.cores[i]&&distance(player,CORES[i])<2.2)return puzzles.canCollect(i,player,drone)?'[F] RETRIEVE ENERGY CORE':i===2?'DISTRACT THE DRONE WITH AN ECHO':'SYNCHRONIZE BOTH SWITCHES';for(let i=0;i<2;i++)if(distance(player,SWITCHES[i])<2.3)return '[F] PULSE SWITCH '+(i?'B':'A');for(const s of shards)if(!s.found&&distance(player,s)<1.8)return '[F] READ ARCHIVE FRAGMENT';if(distance(player,{x:0,z:6.5})<3)return puzzles.won?'[F] LEAVE THE STATION':'DEPARTURE ARRAY · THREE CORES REQUIRED';if(distance(player,PLATE)<1.5)return '[R] RECORD YOURSELF HOLDING THE PLATE';return '';}
function updateHUD(){const n=puzzles.cores.filter(Boolean).length;const [title,hint]=hints[n];$('objective').textContent=title;$('hint').textContent=hint;$('progress').textContent=`${n} / 3 CORES`;for(let i=0;i<3;i++){$('core-'+i).classList.toggle('done',puzzles.cores[i]);$('core-'+i).textContent=puzzles.cores[i]?'◆':'◇';$('slot-'+i).classList.toggle('active',i<timeline.echoes.length);}const t=timeline.time;$('timer').textContent=t.toFixed(1).padStart(4,'0')+' / 10s';$('record-fill').style.width=(t*10)+'%';document.querySelector('.echo-panel').classList.toggle('recording',timeline.recording);$('record-label').textContent=timeline.recording?'● RECORDING':'TEMPORAL BUFFER';$('echo-status').textContent=timeline.recording?'CAPTURING MEMORY':timeline.frames.length>1?`${timeline.echoes.length} / 3 ECHOES ACTIVE`:'NO MEMORY RECORDED';$('prompt').textContent=prompt();$('location').textContent=player.x<-15?'01 / MEMORY LAB':player.x>15?'02 / RESONANCE':player.z<-15?'03 / OBSERVATORY':'CENTRAL ATRIUM';$('drone-state').textContent=player.z<-15?`SENTINEL · ${drone.mode.toUpperCase()}`:'STATION IN STANDBY';}
let lastTime=performance.now();let visualTime=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-lastTime)/1000,.04);lastTime=now;visualTime+=dt;
  if(mode==='playing'){
    elapsed+=dt;const forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),right=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);const length=Math.hypot(forward,right)||1;const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?7:4.2;const tx=(-Math.sin(player.yaw)*forward+Math.cos(player.yaw)*right)/length*speed,tz=(-Math.cos(player.yaw)*forward-Math.sin(player.yaw)*right)/length*speed;const acc=1-Math.exp(-12*dt);velocity.x+=(tx-velocity.x)*acc;velocity.z+=(tz-velocity.z)*acc;
    timeline.step(dt,(id,pose)=>{if(puzzles.activate(id,pose))sound(650,.12);});puzzles.step(dt,[player,...timeline.echoes.map(e=>e.pose)]);
    const activeWalls=[...walls];if(!puzzles.plate&&!puzzles.cores[0])activeWalls.push(gateWalls[0]);if(!puzzles.cores[0])activeWalls.push(gateWalls[1]);if(!puzzles.cores[1])activeWalls.push(gateWalls[2]);
    const liftY=.1+(Math.sin(elapsed*.8)+1)*.7;const oldLiftY=lift.position.y;lift.position.y=liftY;if(player.grounded&&Math.abs(player.x-6)<1&&Math.abs(player.z+18)<1&&Math.abs(player.y-(oldLiftY+.1))<.2)player.y=liftY+.1;
    movePlayer(player,velocity,dt,activeWalls,[...FLOORS,{x:6,z:-18,w:2,d:2,y:liftY+.1}]);if(player.y<-15)respawn('Void recall · checkpoint restored. Your collected cores are safe.');
    if(timeline.record(dt,player))toast('Ten-second memory saved. Press E to manifest an echo.');
    updateDrone(dt);if(puzzles.plate!==lastPlate){sound(130,.4,'triangle');lastPlate=puzzles.plate;}if(puzzles.dualSolved&&!lastDual){toast('Resonance aligned. Core containment released.');sound(1000,.8);lastDual=true;}
    if(Math.hypot(velocity.x,velocity.z)>1&&player.grounded){stepTime+=dt;if(stepTime>.43/(speed/4.2)){sound(80+Math.random()*25,.07,'triangle',.15);stepTime=0;}}
    camera.position.set(player.x,player.y+1.65+(player.grounded?Math.sin(elapsed*11)*Math.min(.025,Math.hypot(velocity.x,velocity.z)*.005):0),player.z);camera.rotation.set(pitch,player.yaw,0,'YXZ');updateHUD();
    toastTime-=dt;$('toast').style.opacity=toastTime>0?'1':'0';
  }else if(mode==='menu'){const a=visualTime*.025;camera.position.set(34+Math.sin(a)*3,23,-43);camera.lookAt(-1,1,0);}
  for(const [id,m] of echoMeshes)if(!timeline.echoes.some(e=>e.id===id)){scene.remove(m);m.traverse(o=>{if(o.isMesh){if(o.geometry!==boxGeo)o.geometry.dispose();o.material.dispose();}});echoMeshes.delete(id);}
  for(const e of timeline.echoes){let m=echoMeshes.get(e.id);if(!m){m=makeEcho(e.id);echoMeshes.set(e.id,m);}m.position.set(e.pose.x,e.pose.y,e.pose.z);m.rotation.y=e.pose.yaw;const moving=e.time<e.frames.at(-1).t;for(let i=0;i<4;i++)m.userData.limbs[i].rotation.x=moving?Math.sin(e.time*10+i%2*Math.PI)*.4:0;}
  plateGate.position.y=THREE.MathUtils.lerp(plateGate.position.y,puzzles.plate||puzzles.cores[0]?6.3:2,.09);plateGate.visible=plateGate.position.y<6.2;eastGate.visible=!puzzles.cores[0];northGate.visible=!puzzles.cores[1];plateLight.material=puzzles.plate?violet:cyan;
  containment.visible=!puzzles.dualSolved;containment.rotation.y=visualTime*.3;
  switchMeshes.forEach((m,i)=>m.material=puzzles.dualSolved||puzzles.switchUntil[i]>puzzles.time?cyan:violet);
  coreMeshes.forEach((m,i)=>{m.visible=!puzzles.cores[i];m.rotation.y=visualTime*.7;m.position.y=1.65+Math.sin(visualTime*2+i)*.15;});
  shards.forEach(s=>s.mesh.rotation.y=visualTime);innerRing.rotation.z=visualTime*.12;portalSurface.material.opacity=puzzles.won?.22+Math.sin(visualTime*2)*.08:.025;innerRing.material=puzzles.won?cyan:violet;dust.rotation.y=visualTime*.006;
  renderer.render(scene,camera);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});requestAnimationFrame(frame);
// Explicit development-only inspection hook for deterministic integration tests.
if(import.meta.env.DEV&&new URLSearchParams(location.search).has('test'))window.__ECHOBOUND__={get player(){return player;},get timeline(){return timeline;},get puzzles(){return puzzles;},get drone(){return drone;},get mode(){return mode;},interact,play,reset,get renderer(){return renderer;},teleport(x,z,y=0){Object.assign(player,{x,z,y,grounded:true});Object.assign(velocity,{x:0,y:0,z:0});}};
