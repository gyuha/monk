import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { World } from '../src/world.js';

// Exercise the real simulation with Three.js objects, without a GPU or DOM.
function game(kind=0,mode='classic') {
  const world=Object.create(World.prototype),events=[];
  Object.assign(world,{scene:new THREE.Scene(),sun:new THREE.DirectionalLight(),player:new THREE.Group(),decorations:new THREE.Group(),enemies:[],gems:[],bullets:[],effects:[],keys:new Set(),stick:{x:0,y:0},uiTimer:0,onUpdate(){},onEvent:(...event)=>events.push(event)});
  world.scene.background=new THREE.Color();world.scene.fog=new THREE.Fog(0,35,80);
  world.start({kind,map:0,mode});
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
  doto.bullets[0].mesh.position.copy(target.mesh.position);doto.bullets[0].mesh.position.y=1.05;doto.updateGame(.01);
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
  world.start({kind:2,map:1,mode:'classic'});assert.equal(world.run.growth,0);assert.equal(world.run.bossWave,0);assert.equal(world.enemies.length,0);assert.equal(world.effects.length,0);assert.equal(world.player.scale.x,.82);
});
