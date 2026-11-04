import * as THREE from 'three';
import { pixelActor, animateActor, HERO_IDS, availableEnemies, ENEMY_TYPES } from './pixel-art.js';
import { createEnvironment, WORLD_RADIUS, groundHeight, riverBlocked, bridgeWaypoint } from './environment.js';
import { HD2DEffects } from './hd2d-effects.js';
import { encounterPlan } from './encounters.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export { Portraits } from './pixel-art.js';

const materials = new Map();
function mat(color, extra = {}) {
  const key = `${color}-${JSON.stringify(extra)}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .9, ...extra }));
  return materials.get(key);
}
function mesh(geometry, color, parent, x=0, y=0, z=0, extra={}) {
  const m = new THREE.Mesh(geometry, mat(color, extra));
  m.position.set(x,y,z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const sphere = (r=1, w=10, h=8) => new THREE.SphereGeometry(r,w,h);

export function spirit(kind=0) { return pixelActor(HERO_IDS[kind],2.8); }

export class World {
  constructor(container, onUpdate, onEvent) {
    this.container=container;this.onUpdate=onUpdate;this.onEvent=onEvent;
    this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color(0xb9cbb8);
    this.scene.fog=new THREE.Fog(0xb9cbb8,45,115);
    this.camera=new THREE.PerspectiveCamera(38,1,.1,180);
    this.camera.position.set(15,16,28);
    this.camera.lookAt(0,.3,0);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
    container.append(this.renderer.domElement);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(-1,1.6,-2);this.controls.enableDamping=true;this.controls.enablePan=false;this.controls.minDistance=17;this.controls.maxDistance=55;this.controls.minPolarAngle=.45;this.controls.maxPolarAngle=1.17;this.controls.update();this.controls.saveState();
    this.ambient=new THREE.HemisphereLight(0xfff4d6,0x506a5e,1.65);this.scene.add(this.ambient);
    this.sun=new THREE.DirectionalLight(0xffe8be,3.5);this.sun.position.set(-25,38,18);this.sun.castShadow=true;
    Object.assign(this.sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:.1,far:110});
    this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.normalBias=.045;this.scene.add(this.sun);
    this.land=new THREE.Group();this.scene.add(this.land);
    this.buildForest();
    this.effectsRenderer=new HD2DEffects(this.renderer,this.scene,this.camera);
    this.quality='high';
    this.player=spirit(0);this.scene.add(this.player);
    this.player.position.set(0,.85,1);this.player.scale.setScalar(1.35);
    this.effects=[];this.enemies=[];this.gems=[];this.bullets=[];this.enemyBullets=[];
    this.keys=new Set();this.stick={x:0,y:0};this.running=false;this.paused=false;this.kind=0;
    this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
    this.last=performance.now();this.uiTimer=0;
    this.tick=this.tick.bind(this);this.frame=requestAnimationFrame(this.tick);
    window.addEventListener('keydown',e=>{
      if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
      if(this.running&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
      this.keys.add(e.code);
      if(this.running&&!e.repeat&&e.code==='Space')this.dash();
      if(this.running&&!e.repeat&&e.code==='KeyR')this.ultimate();
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('blur',()=>{this.keys.clear();if(this.running&&!this.paused)this.onEvent('pause');});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.running&&!this.paused)this.onEvent('pause');});
    this.lobby();
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.effectsRenderer?.resize(w,h);}
  buildForest(){
    this.scene.remove(this.land);this.environment=createEnvironment(this.scene);
    this.land=this.environment.land;this.decorations=this.environment.decorations;this.fireflies=this.environment.fireflies;
  }
  select(kind){
    this.kind=kind;this.scene.remove(this.player);this.disposeGroup(this.player);this.player=spirit(kind);this.scene.add(this.player);
    this.player.position.set(0,groundHeight(0,1),1);this.player.scale.setScalar(1.35);
  }
  setMap(map){
    this.map=map;const night=map===1;
    this.scene.background.set(night?0x263e53:0xb9cbb8);this.scene.fog.color.copy(this.scene.background);
    this.sun.color.set(night?0xb8d6ff:0xfff0d1);this.sun.intensity=night?.7:3.5;
    if(this.ambient){this.ambient.intensity=night?.68:1.65;this.ambient.color.set(night?0x99bce1:0xfff4d6);}
  }
  lobby(){
    this.running=false;this.paused=false;this.clearRun();this.select(this.kind);this.player.position.set(0,groundHeight(0,1),1);this.player.scale.setScalar(1.35);
    this.decorations.visible=true;this.player.userData.moving=false;this.controls?.reset();
    this.player.scale.setScalar(1.35);
  }
  start({kind,map,mode,bonuses={},populate=true}){
    this.select(kind);this.setMap(map);this.clearRun();this.running=true;this.paused=false;this.decorations.visible=false;
    this.player.scale.setScalar(.82);this.player.position.set(0,groundHeight(0,1),1);this.keys.clear();this.stick={x:0,y:0};
    const stats=[{hp:120,speed:4.4,damage:20,rate:.68},{hp:90,speed:5.2,damage:25,rate:.56},{hp:160,speed:3.9,damage:26,rate:.85}][kind];
    this.run={...stats,maxHp:stats.hp+(bonuses.vitality||0)*12,hp:stats.hp+(bonuses.vitality||0)*12,damage:stats.damage*(1+(bonuses.power||0)*.08),speed:stats.speed+(bonuses.speed||0)*.2,mode,time:0,kills:0,xp:0,level:1,nextXp:6,attackAt:0,spawnAt:0,waveAt:0,dashAt:-10,ultAt:-30,invincible:populate?1.4:0,regenAt:0,shards:0,growth:0,bossesDefeated:0,bossWave:0};
    if(populate)this.spawnWave(encounterPlan(0,this.quality).initial,{inner:10,outer:15});
    this.onUpdate(this.snapshot());
  }
  clearRun(){for(const a of [this.enemies,this.gems,this.bullets,this.effects,this.enemyBullets||[]]){for(const e of a){const m=e.mesh||e;this.scene.remove(m);this.disposeGroup(m);}a.length=0;}}
  disposeGroup(group){
    group.traverse(o=>{o.geometry?.dispose();if(o.userData.treeMaterial||o.userData.ownedMaterial)o.material.dispose();});
    if(group.userData.pixelActor){group.userData.texture.dispose();group.userData.plane.material.dispose();group.userData.plane.customDepthMaterial.dispose();group.userData.shadow.material.dispose();}
  }
  setQuality(quality){this.quality=quality;this.effectsRenderer.enabled=quality!=='low';this.renderer.setPixelRatio(quality==='low'?1:Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=quality!=='low';this.resize();}

  snapshot(){const boss=this.enemies.find(e=>e.boss);return {...this.run,position:{x:this.player.position.x,y:this.player.position.y,z:this.player.position.z},enemyPositions:this.enemies.map(e=>({x:e.mesh.position.x,z:e.mesh.position.z,boss:e.boss})),enemies:this.enemies.length,boss:boss?{name:boss.name,hp:boss.hp,maxHp:boss.maxHp}:null};}
  spawn(boss=false,type=null,placement=null){
    const r=this.run,a=placement?.angle??Math.random()*Math.PI*2,d=placement?.distance??12+Math.random()*7;
    if(!boss&&this.enemies.length>=encounterPlan(r.time,this.quality).cap)return null;
    const pool=availableEnemies(r.time),spec=boss?{id:'boss',name:'가시왕 그루몽',hp:300+r.bossWave*100,speed:1.2,damage:24,scale:2.1,behavior:'boss'}:ENEMY_TYPES.find(e=>e.id===type)||pool[Math.floor(Math.random()*pool.length)];
    // Search around the player instead of clamping whole groups into a map corner.
    let point=null;
    for(let i=0;i<24;i++){
      const angle=a+i*.47;let x=THREE.MathUtils.clamp(this.player.position.x+Math.cos(angle)*d,-58,58),z=THREE.MathUtils.clamp(this.player.position.z+Math.sin(angle)*d,-58,58);
      if(riverBlocked(x,z))x=x<-12?-15.5:-8.5;
      if(Math.hypot(x-this.player.position.x,z-this.player.position.z)<8)continue;
      if((this.environment?.colliders||[]).some(c=>Math.abs(x-c.x)<c.hx+.5&&Math.abs(z-c.z)<c.hz+.5))continue;
      point=new THREE.Vector3(x,groundHeight(x,z),z);break;
    }
    if(!point)return null;
    const g=pixelActor(spec.id,2.6);g.position.copy(point);g.scale.setScalar(spec.scale);this.scene.add(g);
    // Blob shadows retain ground contact without hundreds of shadow-map draws.
    if(!boss)g.userData.plane.castShadow=false;
    const hp=spec.hp+(boss?0:r.time*.12);
    this.enemies.push({mesh:g,hp,maxHp:hp,speed:spec.speed,damage:spec.damage,hit:0,boss,baseScale:spec.scale,name:spec.name,type:spec.id,behavior:spec.behavior,phase:Math.random()*6.28,attackAt:r.time,chargeState:'idle',chargeAt:r.time+2,chargeDir:new THREE.Vector3()});
    if(boss)this.onEvent('boss',this.snapshot());
    return this.enemies.at(-1);
  }
  spawnWave(count,{inner=12,outer=18}={}){
    const remaining=encounterPlan(this.run.time,this.quality).cap-this.enemies.length,size=Math.min(count,Math.max(0,remaining)),phase=Math.random()*Math.PI*2;
    for(let i=0;i<size;i++)this.spawn(false,null,{angle:phase+i*Math.PI*2/Math.max(1,size)+(Math.random()-.5)*.12,distance:inner+Math.random()*(outer-inner)});
  }
  updateSpawns(){
    const r=this.run,plan=encounterPlan(r.time,this.quality);
    if(r.time-r.spawnAt>=plan.interval){this.spawnWave(plan.batch);r.spawnAt=r.time;}
    if(r.time-r.waveAt>=plan.waveInterval){this.spawnWave(plan.waveSize,{inner:11,outer:17});r.waveAt=r.time;this.onEvent('horde',this.snapshot());}
  }
  dash(){
    if(!this.running||this.paused||!this.run||this.run.time-this.run.dashAt<3)return;
    const move=this.movement();if(move.length()<.1)move.set(0,0,-1);
    this.moveActor(this.player,move.multiplyScalar(3));this.run.invincible=.5;this.run.dashAt=this.run.time;
    this.burst(this.player.position,0xe5f4bb,12);this.onEvent('sound','dash');
  }
  ultimate(){
    if(!this.running||this.paused||!this.run||this.run.time-this.run.ultAt<20)return;
    this.run.ultAt=this.run.time;
    this.ring(this.player.position,[0x88bf6a,0xf7d079,0xe8a079][this.kind],4.8);
    for(const e of [...this.enemies])if(e.mesh.position.distanceTo(this.player.position)<7)this.hitEnemy(e,(this.kind===1?130:90)*(1+this.run.growth*.35));
    if(this.kind===0)this.run.hp=Math.min(this.run.maxHp,this.run.hp+24);
    if(this.kind===2)this.run.invincible=3;
    this.onEvent('sound','ultimate');
  }
  movement(){
    const x=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0)+this.stick.x;
    const y=(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)+this.stick.y;
    const v=new THREE.Vector3(x+y*.7,0,y-x*.7);return v.length()>1?v.normalize():v;
  }
  clampPlayer(){const p=this.player.position;p.x=THREE.MathUtils.clamp(p.x,-WORLD_RADIUS,WORLD_RADIUS);p.z=THREE.MathUtils.clamp(p.z,-WORLD_RADIUS,WORLD_RADIUS);p.y=groundHeight(p.x,p.z);}
  moveActor(actor,delta){
    const steps=Math.max(1,Math.ceil(delta.length()/.35)),p=actor.position;
    for(let i=0;i<steps;i++){
      let x=THREE.MathUtils.clamp(p.x+delta.x/steps,-WORLD_RADIUS,WORLD_RADIUS),z=THREE.MathUtils.clamp(p.z+delta.z/steps,-WORLD_RADIUS,WORLD_RADIUS);
      if(riverBlocked(x,z)){if(!riverBlocked(p.x,z))x=p.x;else if(!riverBlocked(x,p.z))z=p.z;else continue;}
      for(const c of this.environment?.colliders||[]){if(Math.abs(x-c.x)<c.hx+.3&&Math.abs(z-c.z)<c.hz+.3){if(Math.abs(p.x-c.x)>=c.hx+.29)x=p.x;else if(Math.abs(p.z-c.z)>=c.hz+.29)z=p.z;else {const dx=x-c.x,dz=z-c.z;if(Math.abs(dx/c.hx)>Math.abs(dz/c.hz))x=c.x+Math.sign(dx||1)*(c.hx+.31);else z=c.z+Math.sign(dz||1)*(c.hz+.31);}}}
      const nextHeight=groundHeight(x,z),rise=nextHeight-groundHeight(p.x,p.z),grade=rise/(Math.hypot(x-p.x,z-p.z)||1);
      if(grade>0){const pace=1/(1+Math.min(1.1,grade)*.35);x=p.x+(x-p.x)*pace;z=p.z+(z-p.z)*pace;}
      p.set(x,groundHeight(x,z),z);
    }
  }
  hurtPlayer(damage){const r=this.run;if(r.invincible>0)return;r.hp=Math.max(0,r.hp-damage);r.invincible=.7;this.burst(this.player.position,0xe68a6b,7);this.onEvent('damage');}
  enemyShot(e){
    if((this.enemyBullets?.length||0)>=(this.quality==='low'?80:140))return;
    const p=e.mesh.position,dir=this.player.position.clone().add(new THREE.Vector3(0,1.1,0)).sub(p.clone().add(new THREE.Vector3(0,1.05,0))).normalize();
    const shot=mesh(sphere(.16,6,4),e.type==='spore'?0xd79ab5:0x93d6cf,this.scene,p.x,p.y+1.05,p.z,{emissive:e.type==='spore'?0xbc658f:0x7abec5,emissiveIntensity:1.2});
    shot.castShadow=false;
    this.enemyBullets??=[];this.enemyBullets.push({mesh:shot,direction:dir,speed:4.2,life:5,damage:e.damage});
    e.attackAt=this.run.time;
  }
  updateEnemies(dt){
    const r=this.run,grid=new Map(),cell=2;
    for(const e of this.enemies){const key=`${Math.floor(e.mesh.position.x/cell)},${Math.floor(e.mesh.position.z/cell)}`;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(e);}
    for(const e of [...this.enemies]){
      const p=e.mesh.position,goal=bridgeWaypoint(p,this.player.position),delta=goal.clone().sub(p);delta.y=0;
      const distance=p.distanceTo(this.player.position),dir=delta.normalize();let speed=e.speed;
      if(e.behavior==='hop')speed*=Math.max(.25,1+Math.sin(r.time*4+e.phase)*.75);
      if(e.behavior==='swoop'){const side=new THREE.Vector3(-dir.z,0,dir.x);dir.addScaledVector(side,Math.sin(r.time*2.5+e.phase)*.85).normalize();}
      if(e.behavior==='orbit'&&distance<8){const side=new THREE.Vector3(-dir.z,0,dir.x);dir.multiplyScalar(distance<5?-.3:.35).add(side).normalize();if(r.time-e.attackAt>3.2)this.enemyShot(e);}
      if(e.behavior==='ranged'&&distance<9){speed=distance<5?-e.speed*.5:0;if(r.time-e.attackAt>2.6)this.enemyShot(e);}
      if(e.behavior==='charge'||e.behavior==='boss'){
        if(e.chargeState==='idle'&&r.time>e.chargeAt&&distance<13){e.chargeState='windup';e.chargeAt=r.time+.85;e.chargeDir.copy(dir);this.ring(p,0xefbc6f,.75);}
        if(e.chargeState==='windup'){speed=0;if(r.time>e.chargeAt){e.chargeState='dash';e.chargeAt=r.time+.75;}}
        if(e.chargeState==='dash'){speed=e.boss?7:8;dir.copy(e.chargeDir);if(r.time>e.chargeAt){e.chargeState='idle';e.chargeAt=r.time+3.5;}}
        if(e.boss&&distance<12&&r.time-e.attackAt>4.5)this.enemyShot(e);
      }
      // A spatial grid separates the swarm without comparing every enemy pair.
      if(e.chargeState!=='dash'){
        const cx=Math.floor(p.x/cell),cz=Math.floor(p.z/cell),push=new THREE.Vector3();
        for(let x=cx-1;x<=cx+1;x++)for(let z=cz-1;z<=cz+1;z++)for(const other of grid.get(`${x},${z}`)||[]){if(other===e)continue;const dx=p.x-other.mesh.position.x,dz=p.z-other.mesh.position.z,d=Math.hypot(dx,dz),spacing=e.boss||other.boss?1.5:1.05;if(d<spacing){if(d>.001){push.x+=dx/d*(1-d/spacing);push.z+=dz/d*(1-d/spacing);}else{push.x+=Math.cos(e.phase);push.z+=Math.sin(e.phase);}}}
        dir.addScaledVector(push,.8).normalize();
      }
      // Tangential avoidance makes enemies walk around village walls.
      for(const c of this.environment?.colliders||[]){const away=new THREE.Vector3(p.x-c.x,0,p.z-c.z),reach=Math.max(c.hx,c.hz)+1.5;if(away.length()<reach&&away.dot(dir)<0)dir.addScaledVector(new THREE.Vector3(-away.z,0,away.x).normalize(),.9).normalize();}
      this.moveActor(e.mesh,dir.clone().multiplyScalar(speed*dt));e.mesh.userData.heading?.copy(dir);e.mesh.userData.moving=Math.abs(speed)>.05;
      e.hit=Math.max(0,e.hit-dt);e.mesh.scale.setScalar(e.baseScale*(e.hit>0?1.12:1));
      if(e.mesh.userData.pixelActor){const material=e.mesh.userData.plane.material;material.color.set(e.chargeState==='windup'?0xffc487:e.hit>0?0xffe5cd:0xffffff);}
      if(distance<(e.boss?1.2:.8))this.hurtPlayer(e.damage);
    }
    for(const b of [...(this.enemyBullets||[])]){
      b.life-=dt;b.mesh.position.addScaledVector(b.direction,b.speed*dt);
      const p=this.player.position.clone().add(new THREE.Vector3(0,1.1,0));if(b.mesh.position.distanceTo(p)<.65){this.hurtPlayer(b.damage);b.life=0;}
      if(b.mesh.position.y<groundHeight(b.mesh.position.x,b.mesh.position.z)+.12)b.life=0;
      if(b.life<=0){this.scene.remove(b.mesh);this.disposeGroup(b.mesh);this.enemyBullets.splice(this.enemyBullets.indexOf(b),1);}
    }
  }
  attack(){
    const nearby=this.enemies.filter(e=>e.mesh.position.distanceTo(this.player.position)<8).sort((a,b)=>a.mesh.position.distanceToSquared(this.player.position)-b.mesh.position.distanceToSquared(this.player.position));
    if(!nearby.length)return;
    const color=[0xa9cf72,0xffd37b,0xe9a77b][this.kind];
    if(this.kind===0){
      // Moru's sprout wave damages an area; Lumi fires at several targets;
      // Doto launches a slower, heavier seed that bursts on impact.
      const reach=3.6+this.run.growth*.5;
      const targets=nearby.filter(e=>e.mesh.position.distanceTo(this.player.position)<reach);
      if(!targets.length)return;
      this.ring(this.player.position,color,reach-1);
      for(const e of targets)this.hitEnemy(e,this.run.damage);
    }else{
      const targets=this.kind===1?nearby.slice(0,2+this.run.growth):nearby.slice(0,1);
      for(const target of targets){
        const b=mesh(this.kind===2?new THREE.DodecahedronGeometry(.24):sphere(.1,6,4),color,this.scene,0,0,0,{emissive:color,emissiveIntensity:.7});
        b.position.copy(this.player.position);b.position.y=this.player.position.y+1.15;b.castShadow=false;
        this.bullets.push({mesh:b,target,life:2,speed:this.kind===1?18:11,splash:this.kind===2?2+this.run.growth*.4:0});
      }
    }
    this.run.attackAt=this.run.time;this.onEvent('sound','attack');
  }
  hitEnemy(e,damage){
    if(!this.enemies.includes(e))return;
    e.hp-=damage;e.hit=.13;this.burst(e.mesh.position,0xf8e7bb,3);
    if(e.hp<=0){
      this.run.kills++;this.run.shards++;this.burst(e.mesh.position,0xbeb0d3,5);
      if(e.boss){this.run.bossesDefeated++;this.run.shards+=20;this.run.hp=Math.min(this.run.maxHp,this.run.hp+30);this.onEvent('boss-defeated',this.snapshot());}
      const gem=mesh(new THREE.OctahedronGeometry(.15),0xbbdf8b,this.scene,e.mesh.position.x,groundHeight(e.mesh.position.x,e.mesh.position.z)+.45,e.mesh.position.z,{emissive:0x86b64d,emissiveIntensity:.5});
      gem.castShadow=false;this.gems.push({mesh:gem,age:0,value:e.boss?8:1});
      this.scene.remove(e.mesh);this.disposeGroup(e.mesh);this.enemies.splice(this.enemies.indexOf(e),1);
    }
  }
  burst(pos,color,count){const budget=this.quality==='low'?70:140;for(let i=0;i<count&&this.effects.length<budget;i++){
    const p=mesh(new THREE.BoxGeometry(.07,.07,.07),color,this.scene,pos.x,pos.y+.9,pos.z);
    p.castShadow=false;this.effects.push({mesh:p,velocity:new THREE.Vector3((Math.random()-.5)*3,2+Math.random()*2,(Math.random()-.5)*3),life:.6,max:.6});
  }}
  ring(pos,color,size){
    const m=new THREE.Mesh(new THREE.TorusGeometry(1,.045,5,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9}));m.rotation.x=-Math.PI/2;m.position.set(pos.x,pos.y+.08,pos.z);this.scene.add(m);m.userData.ownedMaterial=true;
    this.effects.push({mesh:m,life:.7,max:.7,ring:size});
  }
  upgrade(type){
    const r=this.run;if(!r)return;
    if(type==='power')r.damage*=1.3;
    if(type==='speed')r.speed*=1.13;
    if(type==='heal'){r.maxHp+=20;r.hp=Math.min(r.maxHp,r.hp+50);}
    if(type==='haste')r.rate*=.83;
    this.paused=false;this.onUpdate(this.snapshot());
  }
  grow(){
    const r=this.run,stage=r.level>=7?2:r.level>=4?1:0;
    if(stage<=r.growth)return;
    const steps=stage-r.growth;r.growth=stage;r.damage*=1.25**steps;r.maxHp+=20*steps;r.hp=Math.min(r.maxHp,r.hp+35*steps);
    this.player.scale.setScalar(.82+stage*.16);
    const glow=mesh(new THREE.TorusGeometry(.65,.035,5,32),[0x9fd775,0xffd37b,0xe7b585][this.kind],this.player,0,1.6+stage*.2,0,{emissive:0xdddf8f,emissiveIntensity:.6});
    glow.rotation.x=Math.PI/2;
    this.ring(this.player.position,0xffe4a5,5);this.onEvent('growth',this.snapshot());
  }
  updateGame(dt){
    const r=this.run;r.time+=dt;r.invincible=Math.max(0,r.invincible-dt);
    const move=this.movement();this.moveActor(this.player,move.clone().multiplyScalar(r.speed*dt));
    if(move.length()>.05)this.player.userData.heading?.copy(move);
    this.player.userData.moving=move.length()>.05;
    this.player.position.y=groundHeight(this.player.position.x,this.player.position.z);
    this.player.visible=!(r.invincible>0&&Math.floor(r.time*15)%2);
    this.updateSpawns();
    const bossWave=r.mode==='classic'?(r.time>=150?1:0):Math.floor(r.time/90);
    if(bossWave>r.bossWave){r.bossWave=bossWave;this.spawn(true);}
    if(r.time-r.attackAt>r.rate)this.attack();
    this.updateEnemies(dt);
    for(const b of [...this.bullets]){
      b.life-=dt;
      if(this.enemies.includes(b.target)){
        const goal=b.target.mesh.position.clone();goal.y=b.target.mesh.position.y+1.1;
        const dir=goal.sub(b.mesh.position),distance=dir.length();
        b.mesh.position.addScaledVector(dir.normalize(),Math.min(distance,dt*b.speed));
        if(distance<.4){
          const targets=b.splash?this.enemies.filter(e=>e.mesh.position.distanceTo(b.target.mesh.position)<b.splash):[b.target];
          if(b.splash)this.ring(b.target.mesh.position,0xe9a77b,b.splash);
          for(const e of targets)this.hitEnemy(e,r.damage);
          b.life=0;
        }
      }else b.life=0;
      if(b.mesh.position.y<groundHeight(b.mesh.position.x,b.mesh.position.z)+.08)b.life=0;
      if(b.life<=0){this.scene.remove(b.mesh);this.disposeGroup(b.mesh);this.bullets.splice(this.bullets.indexOf(b),1);}
    }
    for(const gem of [...this.gems]){
      gem.age+=dt;gem.mesh.rotation.y+=dt*2;gem.mesh.position.y=groundHeight(gem.mesh.position.x,gem.mesh.position.z)+.4+Math.sin(gem.age*3)*.1;
      const dir=this.player.position.clone().sub(gem.mesh.position);dir.y=0;const dist=dir.length();
      if(dist<2.7||gem.age>12)gem.mesh.position.addScaledVector(dir.normalize(),dt*8);
      if(dist<.6){
        r.xp+=gem.value;this.scene.remove(gem.mesh);this.disposeGroup(gem.mesh);this.gems.splice(this.gems.indexOf(gem),1);
        if(r.xp>=r.nextXp){r.xp-=r.nextXp;r.level++;r.nextXp=Math.ceil(r.nextXp*1.35);this.grow();this.paused=true;this.onEvent('levelup',this.snapshot());break;}
      }
    }
    if(this.kind===0&&r.time-r.regenAt>2){r.hp=Math.min(r.maxHp,r.hp+1);r.regenAt=r.time;}
    if(r.hp<=0){this.running=false;this.player.visible=true;this.onEvent('end',{...this.snapshot(),won:false});}
    else if(r.mode==='classic'&&r.time>=180&&r.bossesDefeated>0){this.running=false;this.player.visible=true;this.onEvent('end',{...this.snapshot(),won:true});}
    this.uiTimer+=dt;if(this.uiTimer>.1){this.onUpdate(this.snapshot());this.uiTimer=0;}
  }
  tick(now){
    this.frame=requestAnimationFrame(this.tick);const dt=Math.min((now-this.last)/1000,.05);this.last=now;const t=now/1000;
    this.controls.enabled=!this.running;
    if(this.running){if(!this.paused)this.updateGame(dt);const p=this.player.position;
      const desired=new THREE.Vector3(p.x+12,p.y+16,p.z+23);this.camera.position.lerp(desired,1-Math.exp(-dt*4));this.camera.lookAt(p.x,p.y+1.05,p.z);
      // Move the shadow frustum with the camera through the enlarged world.
      this.sun.position.set(p.x-25,p.y+38,p.z+18);this.sun.target.position.copy(p);this.sun.target.updateMatrixWorld();
    }else{
      this.player.visible=true;this.controls.update();
    }
    this.camera.updateMatrixWorld();
    const animationTime=this.running?this.run.time:t;
    animateActor(this.player,this.camera,animationTime,!!this.player.userData.moving);
    for(const e of this.enemies)animateActor(e.mesh,this.camera,animationTime,!this.paused&&e.mesh.userData.moving!==false);
    this.environment?.update(this.reducedMotion?0:t,this.camera,this.map===1,this.quality==='low',this.reducedMotion,this.player.position,this.running);
    if(!this.paused)for(const e of [...this.effects]){
      e.life-=dt;
      if(e.ring){e.mesh.scale.setScalar(1+(1-e.life/e.max)*e.ring);e.mesh.material.opacity=e.life/e.max;}
      else{e.velocity.y-=dt*8;e.mesh.position.addScaledVector(e.velocity,dt);e.mesh.scale.setScalar(Math.max(0,e.life/e.max));}
      if(e.life<=0){this.scene.remove(e.mesh);e.mesh.geometry.dispose();if(e.ring)e.mesh.material.dispose();this.effects.splice(this.effects.indexOf(e),1);}
    }
    this.effectsRenderer.render(this.player.position.clone().add(new THREE.Vector3(0,1,0)),this.map===1);
  }
}
