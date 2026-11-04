import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { World } from '../src/world.js';

// Exercise the real simulation with Three.js objects, without a GPU or DOM.
function game(kind=0,mode='classic') {
  const world=Object.create(World.prototype),events=[];
  Object.assign(world,{scene:new THREE.Scene(),sun:new THREE.DirectionalLight(),player:new THREE.Group(),decorations:new THREE.Group(),enemies:[],gems:[],bullets:[],effects:[],keys:new Set(),stick:{x:0,y:0},uiTimer:0,onUpdate(){},onEvent:(...event)=>events.push(event)});
  world.scene.background=new THREE.Color();world.scene.fog=new THREE.Fog(0,35,80);
  world.start({kind,map:0,mode,populate:false});
  return {world,events};
}
function enemy(world,x=2,z=1,hp=1000) {
  const mesh=new THREE.Group();mesh.position.set(x,.5,z);world.scene.add(mesh);
  const e={mesh,hp,maxHp:hp,speed:0,damage:9,hit:0,baseScale:1,boss:false};world.enemies.push(e);return e;
}

test('each original companion has a distinct attack pattern',()=>{
  const {world:moru}=game(0);const a=enemy(moru),b=enemy(moru,-2);enemy(moru,7);
  moru.attack();assert.equal(a.hp,980);assert.equal(b.hp,980);assert.equal(moru.enemies[2].hp,1000);assert.equal(moru.bullets.length,0);
  const {world:lumi}=game(1);enemy(lumi);enemy(lumi,3);enemy(lumi,4);lumi.attack();assert.equal(lumi.bullets.length,2);assert.equal(lumi.bullets[0].splash,0);
  const {world:doto}=game(2);const target=enemy(doto),neighbor=enemy(doto,2.5);doto.attack();assert.equal(doto.bullets.length,1);
  doto.bullets[0].mesh.position.copy(target.mesh.position);doto.bullets[0].mesh.position.y=target.mesh.position.y+1.1;doto.updateGame(.01);
  assert.equal(target.hp,974);assert.equal(neighbor.hp,974);
});

test('growth adds stats once per stage and changes the character silhouette',()=>{
  const {world}=game(1);world.run.level=4;world.grow();assert.equal(world.run.growth,1);assert.equal(world.run.damage,31.25);assert.equal(world.run.maxHp,110);assert.ok(world.player.scale.x>.82);
  world.grow();assert.equal(world.run.damage,31.25);world.run.level=7;world.grow();assert.equal(world.run.growth,2);assert.equal(world.run.maxHp,130);
  enemy(world);enemy(world,3);enemy(world,4);enemy(world,5);world.attack();assert.equal(world.bullets.length,4);
});

test('classic boss spawns once and victory requires defeating it',()=>{
  const {world,events}=game();world.run.time=150;world.run.spawnAt=150;world.updateGame(.01);
  const boss=world.enemies.find(e=>e.boss);assert.ok(boss);assert.equal(world.snapshot().boss.name,'가시왕 그루몽');world.updateGame(.01);assert.equal(world.enemies.filter(e=>e.boss).length,1);
  world.run.time=180;world.updateGame(.01);assert.equal(world.running,true);assert.equal(events.filter(e=>e[0]==='end').length,0);
  world.hitEnemy(boss,10000);assert.equal(world.run.bossesDefeated,1);assert.equal(world.run.shards,21);assert.equal(world.snapshot().boss,null);
  world.updateGame(.01);assert.equal(world.running,false);assert.equal(events.find(e=>e[0]==='end')[1].won,true);
});

test('endless mode schedules a new boss every 90 seconds',()=>{
  const {world,events}=game(0,'endless');world.run.time=90;world.run.spawnAt=90;world.updateGame(.01);assert.equal(world.run.bossWave,1);
  world.run.time=180;world.run.spawnAt=180;world.updateGame(.01);assert.equal(world.run.bossWave,2);assert.equal(world.enemies.filter(e=>e.boss).length,2);assert.equal(events.filter(e=>e[0]==='end').length,0);
});

test('paused and finished games cannot spend abilities; a new run resets growth and bosses',()=>{
  const {world}=game();world.paused=true;world.ultimate();world.dash();assert.equal(world.run.ultAt,-30);assert.equal(world.run.dashAt,-10);
  world.paused=false;world.run.level=7;world.grow();world.run.time=150;world.updateGame(.01);world.lobby();world.ultimate();assert.equal(world.run.ultAt,-30);
  world.start({kind:2,map:1,mode:'classic',populate:false});assert.equal(world.run.growth,0);assert.equal(world.run.bossWave,0);assert.equal(world.enemies.length,0);assert.equal(world.effects.length,0);assert.equal(world.player.scale.x,.82);
});

test('the expanded world allows exploration and stops dashes crossing the river away from bridges',()=>{
  const {world}=game();world.moveActor(world.player,new THREE.Vector3(38,0,0));assert.ok(world.player.position.x>30);
  world.player.position.set(-18,.5,12);world.moveActor(world.player,new THREE.Vector3(12,0,0));assert.ok(world.player.position.x<-14.5);
  world.player.position.set(-18,.5,2);world.moveActor(world.player,new THREE.Vector3(12,0,0));assert.ok(world.player.position.x>-9);
  world.player.position.set(59,.5,40);world.moveActor(world.player,new THREE.Vector3(100,0,0));assert.equal(world.player.position.x,60);
});

test('ranged spores hold their distance and fire projectiles that cause damage',()=>{
  const {world}=game();world.spawn(false,'spore');const e=world.enemies[0];e.mesh.position.set(0,.5,7);world.run.time=3;const z=e.mesh.position.z;
  world.updateEnemies(.01);assert.equal(e.mesh.position.z,z);assert.equal(world.enemyBullets.length,1);
  world.enemyBullets[0].mesh.position.set(0,1.5,1);const hp=world.run.hp;world.updateEnemies(.01);assert.equal(world.run.hp,hp-e.damage);assert.equal(world.enemyBullets.length,0);
});

test('beetles telegraph before committing to a straight charge',()=>{
  const {world}=game();world.spawn(false,'beetle');const e=world.enemies[0];e.mesh.position.set(0,.5,8);world.run.time=2.1;world.updateEnemies(.01);assert.equal(e.chargeState,'windup');const p=e.mesh.position.clone();world.run.time=2.5;world.updateEnemies(.01);assert.equal(e.mesh.position.distanceTo(p),0);
  world.run.time=3;world.updateEnemies(.1);assert.equal(e.chargeState,'dash');assert.ok(e.mesh.position.z<p.z-.7);
});

test('all six enemy classes become available and preserve their distinct combat stats',async()=>{
  const {availableEnemies,ENEMY_TYPES}=await import('../src/pixel-art.js');assert.equal(availableEnemies(0).length,2);assert.equal(availableEnemies(60).length,6);
  const {world}=game();for(const e of ENEMY_TYPES)world.spawn(false,e.id);assert.equal(new Set(world.enemies.map(e=>e.behavior)).size,6);assert.ok(world.enemies.find(e=>e.type==='golem').hp>world.enemies.find(e=>e.type==='moth').hp);
});

test('native sprite atlases have transparent silhouettes, authored directional views, and different walk drawings',async()=>{
  const {pixelFrame,spriteAtlas,HERO_IDS}=await import('../src/pixel-art.js');
  for(const id of HERO_IDS){const front=pixelFrame(id),back=pixelFrame(id,3),walk=pixelFrame(id,0,1);assert.equal(front.length,48*64*4);assert.notDeepEqual(front,back);assert.notDeepEqual(front,walk);assert.ok(front.filter((v,i)=>i%4===3&&v===0).length>1000);assert.equal(spriteAtlas(id).image.width,192);}
});

test('the village has substantial traversable elevations and level bridge landings',async()=>{
  const {groundHeight,terrainHeight}=await import('../src/environment.js');
  assert.equal(groundHeight(0,2),.5);assert.ok(groundHeight(19,-5)>4);assert.ok(groundHeight(25,24)>6);assert.equal(terrainHeight(-12,10),-.7);
  assert.equal(groundHeight(-17,2),.5);assert.equal(groundHeight(-7,2),.5);
  const {world}=game();let previous=world.player.position.y;
  for(let i=0;i<90;i++){world.moveActor(world.player,new THREE.Vector3(.25,0,-.07));const p=world.player.position;assert.equal(p.y,groundHeight(p.x,p.z));assert.ok(Math.abs(p.y-previous)<.4);previous=p.y;}
  assert.ok(world.player.position.y>3);
});

test('a real run starts with a surrounding crowd at a safe distance',()=>{
  const {world}=game();world.start({kind:0,map:0,mode:'classic'});assert.equal(world.enemies.length,18);
  assert.ok(world.enemies.every(e=>e.mesh.position.distanceTo(world.player.position)>=8));assert.ok(world.run.invincible>0);
});

test('regular reinforcements and timed hordes respect the crowd budget',()=>{
  const {world,events}=game();world.run.time=.7;world.updateSpawns();assert.equal(world.enemies.length,4);
  world.run.time=20;world.updateSpawns();assert.equal(world.enemies.length,22);assert.equal(events.filter(e=>e[0]==='horde').length,1);
  world.run.time=100;world.spawnWave(500);assert.equal(world.enemies.length,220);world.updateSpawns();assert.equal(world.enemies.length,220);
  world.clearRun();world.quality='low';world.spawnWave(500);assert.equal(world.enemies.length,140);
});

test('ranged attacks aim up slopes and cannot hit a player merely sharing ground coordinates',()=>{
  const {world}=game();world.player.position.set(19,5,-5);world.spawn(false,'spore');const e=world.enemies[0];e.mesh.position.set(12,1,-5);world.enemyShot(e);assert.ok(world.enemyBullets[0].direction.y>0);
  const projectile=world.enemyBullets[0];projectile.mesh.position.set(19,1,-5);projectile.direction.set(0,0,0);const hp=world.run.hp;world.updateEnemies(.01);assert.equal(world.run.hp,hp);assert.equal(world.enemyBullets.length,0);
});

test('spawns near a world corner never collapse onto the player',()=>{
  const {world}=game();world.player.position.set(59,3,59);world.spawnWave(100);assert.equal(world.enemies.length,100);assert.ok(world.enemies.every(e=>Math.hypot(e.mesh.position.x-59,e.mesh.position.z-59)>=8));
});
