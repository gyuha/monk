import * as THREE from 'three';

const C = { moss: 0x92ac68, leaf: 0x6f995b, dark: 0x345d3a, trunk: 0x896e49, cream: 0xffe9bd };
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
const cylinder = (r1,r2,h,n=8) => new THREE.CylinderGeometry(r1,r2,h,n);
const box = (x,y,z) => new THREE.BoxGeometry(x,y,z);

export function spirit(kind=0, miniature=false) {
  const g = new THREE.Group();
  if (kind === 0) {
    // A tiny hollow-wood guardian, with moss hair and two budding branches.
    const body = mesh(cylinder(.52,.61,1.12,7),0xb29a6f,g,0,.82,0); body.rotation.z = -.05;
    mesh(sphere(.57),0xa7b86b,g,0,1.42,0).scale.set(1.12,.65,1.03);
    for(const [x,y,z,s] of [[-.36,1.48,.05,.27],[.3,1.48,.1,.31],[0,1.6,-.12,.3]]) mesh(sphere(s),0x789f55,g,x,y,z);
    for (let side of [-1,1]) {
      const arm=mesh(cylinder(.14,.18,.53,6),0xb39d76,g,side*.67,.8,0); arm.rotation.z=side*-.45;
      mesh(sphere(.24),0x7a9854,g,side*.28,.17,.04).scale.set(1,.7,1.3);
      const stem=mesh(cylinder(.055,.075,.55,5),0x7d8450,g,side*.36,1.78,0); stem.rotation.z=side*-.5;
      const leaf=mesh(sphere(.25,6,4),side<0?0xbedb7b:0x8fba5d,g,side*.53,1.98,0); leaf.scale.set(1.2,.45,.65);leaf.rotation.z=side*.5;
    }
    mesh(sphere(.38),0xcab78a,g,0,.84,.43).scale.set(.93,1,.3);
    eyes(g,.19,1.02,.526);
    mesh(box(.15,.04,.045),0x634f35,g,0,.74,.55);
    mesh(sphere(.1),0xe1a282,g,-.36,.86,.45).scale.set(1,.55,.3);
    mesh(sphere(.1),0xe1a282,g,.36,.86,.45).scale.set(1,.55,.3);
  } else if (kind === 1) {
    mesh(sphere(.58),0xf6d68c,g,0,.93,0).scale.set(.88,1.18,.85);
    mesh(sphere(.4),0xfff1c2,g,0,.96,.17,{emissive:0xffb954,emissiveIntensity:.25});
    mesh(cylinder(.3,.42,.16,8),0x998a53,g,0,1.58,0);
    const sprout=mesh(sphere(.25,6,4),0x98b47b,g,.12,1.83,0);sprout.scale.set(.6,1,.5); sprout.rotation.z=-.5;
    for(let side of [-1,1]){
      const wing=mesh(sphere(.45,8,6),0xdfe9bf,g,side*.58,1.1,-.1);wing.scale.set(.6,1.2,.25);wing.rotation.z=side*-.7;
      const skirt=mesh(sphere(.28,7,5),0xb2bb7a,g,side*.28,.46,0);skirt.scale.set(1,.7,.8);
    }
    eyes(g,.16,1.05,.56);
    mesh(sphere(.055),0xca8b57,g,0,.84,.58).scale.y=.7;
  } else {
    mesh(sphere(.55),0xc2a07c,g,0,.7,0).scale.set(.8,1.1,.85);
    mesh(sphere(.7),0xd68b63,g,0,1.35,0).scale.set(1.1,.6,1);
    mesh(cylinder(.68,.62,.09,10),0xf4dfb0,g,0,1.19,0);
    for(const [x,z] of [[-.3,.24],[.24,.34],[.08,-.26]])mesh(sphere(.13,7,5),0xffe7ba,g,x,1.67,z).scale.y=.3;
    for(let side of [-1,1]){
      mesh(sphere(.2),0x8e7355,g,side*.25,.16,.07).scale.set(1,.7,1.25);
      mesh(sphere(.17),0xb99570,g,side*.47,.69,0);
    }
    eyes(g,.16,.88,.46);
    mesh(sphere(.18),0xf1d391,g,0,.52,.44).scale.set(1,.8,.3);
    mesh(box(.16,.045,.06),0x5f5941,g,0,.68,.485);
  }
  if (!miniature) g.rotation.y=.15;
  return g;
}
function eyes(g,x,y,z) {
  for(let side of [-1,1]){
    mesh(sphere(.066,8,6),0x293e32,g,x*side,y,z).scale.set(.8,1.25,.55);
    mesh(sphere(.021,6,4),0xfffbed,g,x*side-.013,y+.025,z+.03);
  }
}
function rng(seed=19){return()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};}

export class World {
  constructor(container, onUpdate, onEvent) {
    this.container=container;this.onUpdate=onUpdate;this.onEvent=onEvent;
    this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color(0xe8eee2);
    this.scene.fog=new THREE.Fog(0xe8eee2,35,80);
    this.camera=new THREE.PerspectiveCamera(35,1,.1,150);
    this.camera.position.set(16.5,15.5,21);
    this.camera.lookAt(0,.3,0);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
    container.append(this.renderer.domElement);
    this.ambient=new THREE.HemisphereLight(0xfff8df,0x73806b,2.8);this.scene.add(this.ambient);
    this.sun=new THREE.DirectionalLight(0xfff0d1,4.2);this.sun.position.set(-12,24,10);this.sun.castShadow=true;
    Object.assign(this.sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:.1,far:65});
    this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.normalBias=.045;this.scene.add(this.sun);
    this.land=new THREE.Group();this.scene.add(this.land);
    this.buildForest();
    this.player=spirit(0);this.scene.add(this.player);
    this.player.position.set(0,.85,1);this.player.scale.setScalar(1.35);
    this.effects=[];this.enemies=[];this.gems=[];this.bullets=[];
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
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  buildForest(){
    const r=rng(42);
    mesh(cylinder(10.5,8.7,2.2,12),0x9b9274,this.land,0,-1.3,0);
    mesh(cylinder(10.7,10.4,.55,12),0x9bb679,this.land,0,.05,0);
    mesh(cylinder(7.8,8.4,.17,20),0xb2c58b,this.land,0,.39,.3);
    // Warm stepping stones lead toward the little guardian.
    for(let i=0;i<7;i++){
      const m=mesh(cylinder(.53+r()*.35,.66,.13,7),0xd6cdb0,this.land,-1.8+Math.sin(i*.8)*.5,.53,6.8-i*.9);m.rotation.y=r()*5;
    }
    mesh(cylinder(1.65,1.85,.38,9),0xbcc0a0,this.land,0,.6,1);
    mesh(cylinder(1.5,1.65,.1,9),0xd5d5b5,this.land,0,.84,1);
    // A little pond tucked into the right side of the island.
    const pond=mesh(cylinder(2.4,2.4,.08,18),0x94beb1,this.land,5,.42,1.5,{roughness:.25,metalness:.08});pond.scale.z=.66;
    for(let i=0;i<9;i++){const a=i*6.28/9;const rock=mesh(new THREE.DodecahedronGeometry(.32+r()*.24),0xb0b4a0,this.land,5+Math.cos(a)*2.35,.55,1.5+Math.sin(a)*1.55);rock.scale.y=.6;}
    for(let i=0;i<26;i++){
      const angle=i*2.399,dist=6.2+r()*3.9,x=Math.cos(angle)*dist,z=Math.sin(angle)*dist;
      if(z>3&&Math.abs(x)<5)continue;
      this.tree(x,z,.7+r()*.65,r);
    }
    this.tree(-4.5,1.4,1.12,r);this.tree(-7,4,1.2,r);
    // Ancient standing stones.
    for(const [x,z,h]of [[2,-3,2.7],[4,-3.3,2.4]]){
      const m=mesh(box(.65,h,.65),0xa4ad96,this.land,x,h/2+.45,z);m.rotation.z=.07;
      for(let j=0;j<3;j++)mesh(box(.11,.13,.02),0xd5dfb1,this.land,x,.9+j*.45,z+.34,{emissive:0xcde8ad,emissiveIntensity:.4});
    }
    const lintel=mesh(box(2.9,.53,.9),0xafb69a,this.land,3,3.05,-3.1);lintel.rotation.z=-.07;
    for(let i=0;i<125;i++){
      const a=r()*Math.PI*2,d=Math.sqrt(r())*9.7,x=Math.cos(a)*d,z=Math.sin(a)*d;
      if((Math.abs(x)<1.7&&z<2.5&&z>-.9)||((x-5)**2+(z-1.5)**2<6))continue;
      if(i%3===0){
        const rock=mesh(new THREE.DodecahedronGeometry(.15+r()*.35,0),i%2?0xa4ad8b:0xbec5a1,this.land,x,.53,z);rock.scale.y=.65;
      }else{
        const color=i%7===0?0xffe3aa:i%9===0?0xd9b6c5:0x6d985d;
        for(let j=0;j<3;j++){
          const blade=mesh(new THREE.ConeGeometry(.07,.3+r()*.15,4),color,this.land,x+j*.09,.65,z+j*.05);blade.rotation.z=(r()-.5)*.6;
        }
      }
    }
    for(let i=0;i<11;i++){
      const x=-6+r()*11,z=-6+r()*12;
      const stem=mesh(cylinder(.05,.07,.35,5),0xe9dbbd,this.land,x,.65,z);
      mesh(sphere(.2,7,5),i%2?0xc68e66:0xf2c270,this.land,x,.87,z).scale.y=.45;
    }
    for(const [x,z]of[[-3,3.7],[3.5,4],[-2.8,-2]]){
      mesh(cylinder(.045,.065,1.3,5),0x6d7959,this.land,x,1,z);
      mesh(box(.36,.45,.36),0xffda8b,this.land,x,1.7,z,{emissive:0xffbb55,emissiveIntensity:.45});
      mesh(new THREE.ConeGeometry(.36,.22,4),0x66794d,this.land,x,2.02,z).rotation.y=Math.PI/4;
    }
    this.fireflies=new THREE.Group();this.land.add(this.fireflies);
    for(let i=0;i<23;i++){const f=mesh(sphere(.035,5,4),0xffffcf,this.fireflies,(r()-.5)*17,.7+r()*4,(r()-.5)*15,{emissive:0xeeffac,emissiveIntensity:2});f.userData={base:f.position.clone(),phase:r()*7};}
    this.decorations=new THREE.Group();this.land.add(this.decorations);
    for(const [kind,x,z]of [[1,3,1.4],[2,-3,-.7]]){const s=spirit(kind);s.position.set(x,.5,z);s.scale.setScalar(.72);s.rotation.y=-.3;this.decorations.add(s);}
  }
  tree(x,z,scale,r){
    const g=new THREE.Group();g.position.set(x,.3,z);g.scale.setScalar(scale);this.land.add(g);
    g.userData.tree=true;
    mesh(cylinder(.16,.36,2.3,6),C.trunk,g,0,1.1,0);
    const colors=[0x668553,0x7d9e62,0x93ad70,0xa5bb7d];
    for(let j=0;j<3;j++){
      const m=mesh(new THREE.IcosahedronGeometry(1.45-j*.17,1),colors[Math.floor(r()*4)],g,(r()-.5)*.6,2.6+j*.7,(r()-.5)*.5);
      m.scale.set(1,.85,1);m.rotation.y=r()*7;
    }
    for(let j=0;j<3;j++){const root=mesh(cylinder(.06,.17,.7,5),C.trunk,g,Math.cos(j*2.1)*.25,.2,Math.sin(j*2.1)*.25);root.rotation.z=.8;}
    g.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.userData.treeMaterial=true;}});
  }
  select(kind){
    this.kind=kind;this.scene.remove(this.player);this.disposeGroup(this.player);this.player=spirit(kind);this.scene.add(this.player);
    this.player.position.set(0,.88,1);this.player.scale.setScalar(1.35);
  }
  setMap(map){
    this.map=map;const night=map===1;
    this.scene.background.set(night?0x53697f:0xe8eee2);this.scene.fog.color.copy(this.scene.background);
    this.sun.color.set(night?0xb8d6ff:0xfff0d1);this.sun.intensity=night?1.35:4.2;
    if(this.ambient){this.ambient.intensity=night?1.1:2.8;this.ambient.color.set(night?0xa4c6ef:0xfff8df);}
  }
  lobby(){
    this.running=false;this.paused=false;this.clearRun();this.select(this.kind);this.player.position.set(0,.88,1);this.player.scale.setScalar(1.35);
    this.decorations.visible=true;
    this.player.scale.setScalar(1.35);
  }
  start({kind,map,mode,bonuses={}}){
    this.select(kind);this.setMap(map);this.clearRun();this.running=true;this.paused=false;this.decorations.visible=false;
    this.player.scale.setScalar(.82);this.player.position.set(0,.5,1);this.keys.clear();this.stick={x:0,y:0};
    const stats=[{hp:120,speed:4.4,damage:20,rate:.68},{hp:90,speed:5.2,damage:25,rate:.56},{hp:160,speed:3.9,damage:26,rate:.85}][kind];
    this.run={...stats,maxHp:stats.hp+(bonuses.vitality||0)*12,hp:stats.hp+(bonuses.vitality||0)*12,damage:stats.damage*(1+(bonuses.power||0)*.08),speed:stats.speed+(bonuses.speed||0)*.2,mode,time:0,kills:0,xp:0,level:1,nextXp:6,attackAt:0,spawnAt:0,dashAt:-10,ultAt:-30,invincible:0,regenAt:0,shards:0,growth:0,bossesDefeated:0,bossWave:0};
    this.onUpdate(this.snapshot());
  }
  clearRun(){for(const a of [this.enemies,this.gems,this.bullets,this.effects]){for(const e of a){const m=e.mesh||e;this.scene.remove(m);this.disposeGroup(m);}a.length=0;}}
  disposeGroup(group){group.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
  snapshot(){const boss=this.enemies.find(e=>e.boss);return {...this.run,enemies:this.enemies.length,boss:boss?{name:boss.name,hp:boss.hp,maxHp:boss.maxHp}:null};}
  spawn(boss=false){
    const r=this.run,a=Math.random()*Math.PI*2,d=10+Math.random()*2;
    const g=new THREE.Group(),elite=boss||(r.time>55&&Math.random()<.12);
    mesh(sphere(elite?.63:.4,7,5),boss?0x594b70:elite?0x87627c:0x7f7490,g,0,.4,0).scale.set(1,.9,1);
    for(const side of[-1,1]){const ear=mesh(new THREE.ConeGeometry(.16,.45,5),0x61566d,g,side*.24,.82,0);ear.rotation.z=side*-.3;}
    eyes(g,elite?.22:.15,elite?.53:.48,elite?.56:.36);
    if(boss){
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5;mesh(new THREE.ConeGeometry(.13,.5,5),0xe5bd71,g,Math.cos(a)*.38,1,Math.sin(a)*.38);}
      g.scale.setScalar(2.1);
    }
    const x=THREE.MathUtils.clamp(this.player.position.x+Math.cos(a)*d,-10,10),z=THREE.MathUtils.clamp(this.player.position.z+Math.sin(a)*d,-10,10);
    g.position.set(x,.5,z);this.scene.add(g);
    const hp=boss?300+r.bossWave*100:elite?100+r.time*.25:32+r.time*.18;
    this.enemies.push({mesh:g,hp,maxHp:hp,speed:boss?1.25:elite?1.4:1.1+Math.min(r.time/150,1.5),damage:boss?24:elite?18:9,hit:0,boss,baseScale:boss?2.1:1,name:'가시왕 그루몽'});
    if(boss)this.onEvent('boss',this.snapshot());
  }
  dash(){
    if(!this.running||this.paused||!this.run||this.run.time-this.run.dashAt<3)return;
    const move=this.movement();if(move.length()<.1)move.set(0,0,-1);
    this.player.position.addScaledVector(move,2.5);this.clampPlayer();this.run.invincible=.5;this.run.dashAt=this.run.time;
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
  clampPlayer(){const p=this.player.position,d=Math.hypot(p.x,p.z);if(d>9.4){p.x*=9.4/d;p.z*=9.4/d;}}
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
        b.position.copy(this.player.position);b.position.y=1.35;
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
      const gem=mesh(new THREE.OctahedronGeometry(.15),0xbbdf8b,this.scene,e.mesh.position.x,.85,e.mesh.position.z,{emissive:0x86b64d,emissiveIntensity:.5});
      this.gems.push({mesh:gem,age:0,value:e.boss?8:1});
      this.scene.remove(e.mesh);this.disposeGroup(e.mesh);this.enemies.splice(this.enemies.indexOf(e),1);
    }
  }
  burst(pos,color,count){for(let i=0;i<count;i++){
    const p=mesh(new THREE.BoxGeometry(.07,.07,.07),color,this.scene,pos.x,.9,pos.z);
    this.effects.push({mesh:p,velocity:new THREE.Vector3((Math.random()-.5)*3,2+Math.random()*2,(Math.random()-.5)*3),life:.6,max:.6});
  }}
  ring(pos,color,size){
    const m=new THREE.Mesh(new THREE.TorusGeometry(1,.045,5,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9}));m.rotation.x=-Math.PI/2;m.position.set(pos.x,.65,pos.z);this.scene.add(m);
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
    const move=this.movement();this.player.position.addScaledVector(move,r.speed*dt);this.clampPlayer();
    if(move.length()>.05)this.player.rotation.y=Math.atan2(move.x,move.z);
    this.player.position.y=.5+(move.length()>.05?Math.abs(Math.sin(r.time*13))*.12:0);
    this.player.visible=!(r.invincible>0&&Math.floor(r.time*15)%2);
    if(r.time-r.spawnAt>Math.max(.24,1.1-r.time*.006)&&this.enemies.length<65){this.spawn();if(r.time>80)this.spawn();r.spawnAt=r.time;}
    const bossWave=r.mode==='classic'?(r.time>=150?1:0):Math.floor(r.time/90);
    if(bossWave>r.bossWave){r.bossWave=bossWave;this.spawn(true);}
    if(r.time-r.attackAt>r.rate)this.attack();
    for(const e of [...this.enemies]){
      const dir=this.player.position.clone().sub(e.mesh.position);dir.y=0;const distance=dir.length();dir.normalize();
      e.mesh.position.addScaledVector(dir,e.speed*dt);e.mesh.rotation.y=Math.atan2(dir.x,dir.z);
      e.mesh.position.y=.5+Math.sin(r.time*7+e.mesh.id)*.06;
      e.hit=Math.max(0,e.hit-dt);e.mesh.scale.setScalar(e.baseScale*(e.hit>0?1.15:1));
      if(distance<(e.boss?1.2:.7)&&r.invincible<=0){r.hp=Math.max(0,r.hp-e.damage);r.invincible=.7;this.burst(this.player.position,0xe68a6b,7);this.onEvent('damage');}
    }
    for(const b of [...this.bullets]){
      b.life-=dt;
      if(this.enemies.includes(b.target)){
        const goal=b.target.mesh.position.clone();goal.y=1.05;
        const dir=goal.sub(b.mesh.position),distance=dir.length();
        b.mesh.position.addScaledVector(dir.normalize(),Math.min(distance,dt*b.speed));
        if(distance<.4){
          const targets=b.splash?this.enemies.filter(e=>e.mesh.position.distanceTo(b.target.mesh.position)<b.splash):[b.target];
          if(b.splash)this.ring(b.target.mesh.position,0xe9a77b,b.splash);
          for(const e of targets)this.hitEnemy(e,r.damage);
          b.life=0;
        }
      }else b.life=0;
      if(b.life<=0){this.scene.remove(b.mesh);this.disposeGroup(b.mesh);this.bullets.splice(this.bullets.indexOf(b),1);}
    }
    for(const gem of [...this.gems]){
      gem.age+=dt;gem.mesh.rotation.y+=dt*2;gem.mesh.position.y=.85+Math.sin(gem.age*3)*.1;
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
    if(this.running){if(!this.paused)this.updateGame(dt);const p=this.player.position;
      const desired=new THREE.Vector3(p.x+13,16,p.z+16);this.camera.position.lerp(desired,1-Math.exp(-dt*5));this.camera.lookAt(p.x,.3,p.z);
    }else{
      this.player.visible=true;this.camera.position.lerp(new THREE.Vector3(16.5,15.5,21),1-Math.exp(-dt*3));this.camera.lookAt(0,.3,0);
      if(!this.reducedMotion){this.player.position.y=.88+Math.sin(t*1.8)*.06;this.player.rotation.y=.24+Math.sin(t*.45)*.22;}
    }
    if(!this.reducedMotion)for(const f of this.fireflies.children){const b=f.userData.base;f.position.set(b.x+Math.sin(t*.5+f.userData.phase)*.4,b.y+Math.sin(t+f.userData.phase)*.2,b.z);}
    // Fade foreground trees to keep both the player and incoming enemies legible.
    for(const tree of this.land.children.filter(o=>o.userData.tree)){
      const dx=tree.position.x-this.player.position.x,dz=tree.position.z-this.player.position.z;
      const foreground=dx*.63+dz*.78,side=Math.abs(dx*.78-dz*.63);
      const opacity=this.running&&foreground>-.8&&side<5?.16:1;
      tree.traverse(o=>{if(o.userData.treeMaterial){o.material.opacity=THREE.MathUtils.lerp(o.material.opacity,opacity,1-Math.exp(-dt*6));o.castShadow=o.material.opacity>.5;}});
    }
    if(!this.paused)for(const e of [...this.effects]){
      e.life-=dt;
      if(e.ring){e.mesh.scale.setScalar(1+(1-e.life/e.max)*e.ring);e.mesh.material.opacity=e.life/e.max;}
      else{e.velocity.y-=dt*8;e.mesh.position.addScaledVector(e.velocity,dt);e.mesh.scale.setScalar(Math.max(0,e.life/e.max));}
      if(e.life<=0){this.scene.remove(e.mesh);e.mesh.geometry.dispose();if(e.ring)e.mesh.material.dispose();this.effects.splice(this.effects.indexOf(e),1);}
    }
    this.renderer.render(this.scene,this.camera);
  }
}

export class Portraits {
  constructor(){
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});this.renderer.setSize(220,200);this.renderer.setPixelRatio(1.5);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.3;
    this.scene=new THREE.Scene();this.scene.add(new THREE.HemisphereLight(0xfff9e2,0x8b947d,3));
    const light=new THREE.DirectionalLight(0xffe5be,4);light.position.set(-3,5,5);this.scene.add(light);
    this.camera=new THREE.PerspectiveCamera(32,1.1,.1,30);this.camera.position.set(2.5,2.4,4.5);this.camera.lookAt(0,.9,0);
  }
  image(kind){const g=spirit(kind,true);this.scene.add(g);this.renderer.render(this.scene,this.camera);const src=this.renderer.domElement.toDataURL('image/png');this.scene.remove(g);g.traverse(o=>o.geometry?.dispose());return src;}
  dispose(){this.renderer.dispose();}
}
