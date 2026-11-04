import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { pixelActor, animateActor } from './pixel-art.js';

export const WORLD_RADIUS=60;
export const BRIDGES=[2,-23,25];
const riverX=-12;
// Flat village terraces joined by walkable slopes, with a low river valley.
const BUILDING_PADS=[[-19.2,-5,5,5],[4,-15,5,4],[16,-20,5.5,4.5],[-26,-17,4.5,4],[7,-36,4.8,4.4],[28,17,4.3,4]];
function landHeight(x,z){
  const mesa=(cx,cz,inner,outer,height)=>height*(1-THREE.MathUtils.smoothstep(Math.hypot(x-cx,z-cz),inner,outer));
  let rise=mesa(19,-5,7,19,4.4)+mesa(3,-22,10,23,3.1)+mesa(-28,-13,8,20,3.6)+mesa(25,24,9,23,6.2);
  rise+=Math.max(0,Math.hypot(x,z)-38)*.085*(.8+.2*Math.sin(x*.12)*Math.cos(z*.1));
  // The starting plaza remains safe and level; its exits climb into the hills.
  return .5+rise*THREE.MathUtils.smoothstep(Math.hypot(x,z-2),7,13);
}
export function terrainHeight(x,z) {
  let h=landHeight(x,z);
  for(const [px,pz,w,d]of BUILDING_PADS){const distance=Math.hypot(Math.max(0,Math.abs(x-px)-w*.5-.5),Math.max(0,Math.abs(z-pz)-d*.5-.5));if(distance<3)h=THREE.MathUtils.lerp(h,landHeight(px,pz),1-THREE.MathUtils.smoothstep(distance,0,3));}
  // Broad landings join each bridge to both banks, regardless of hill height.
  const landing=BRIDGES.reduce((best,b)=>Math.max(best,(1-THREE.MathUtils.smoothstep(Math.abs(z-b),2.8,6))*(1-THREE.MathUtils.smoothstep(Math.abs(x-riverX),5,9))),0);
  h=THREE.MathUtils.lerp(h,.5,landing);
  const bank=Math.abs(x-riverX);
  if(bank<3.2)h=THREE.MathUtils.lerp(-.7,h,THREE.MathUtils.smoothstep(bank,2.1,3.2));
  return h;
}
export function groundHeight(x,z) {
  if(Math.abs(x-riverX)<4.6&&BRIDGES.some(b=>Math.abs(z-b)<1.7))return Math.max(.5,.87-Math.max(0,Math.abs(x-riverX)-2.6)*.185);
  return terrainHeight(x,z);
}
export function riverBlocked(x,z) {return Math.abs(x-riverX)<2.65&&!BRIDGES.some(b=>Math.abs(z-b)<1.45);}
export function bridgeWaypoint(from,to) {
  if((from.x<riverX-2.5&&to.x>riverX+2.5)||(from.x>riverX+2.5&&to.x<riverX-2.5)){
    const z=BRIDGES.reduce((best,b)=>Math.abs(from.z-b)+Math.abs(to.z-b)<Math.abs(from.z-best)+Math.abs(to.z-best)?b:best,BRIDGES[0]);
    const side=Math.sign(to.x-riverX);
    return new THREE.Vector3(Math.abs(from.z-z)<1.25?riverX+side*4:riverX-side*4,.5,z);
  }
  return to;
}
function random(seed=42){return()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};}
const textureCache=new Map();
function surface(type) {
  if(textureCache.has(type))return textureCache.get(type);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d'),r=random(type.length*781);
  const colors={grass:['#91a56c','#afbc7e','#65844e','#bdc68b'],wood:['#71513b','#a17b52','#4c3b30','#bd9b6b'],roof:['#775946','#9c775b','#493f35','#b99a70'],stone:['#828b7e','#a5aa94','#535f58','#c4c3a6'],plaster:['#d4c8a8','#e8ddbc','#b3ab90','#f1e5c8']}[type];
  c.fillStyle=colors[0];c.fillRect(0,0,128,128);
  for(let i=0;i<1500;i++){c.fillStyle=colors[1+Math.floor(r()*3)];const x=r()*128,y=r()*128;c.globalAlpha=.15+r()*.25;c.fillRect(x,y,type==='wood'?1:1+r()*3,type==='wood'?4+r()*22:1+r()*2);}c.globalAlpha=1;
  if(type==='roof'){for(let y=0;y<128;y+=16){c.fillStyle='#3b332d55';c.fillRect(0,y,128,2);for(let x=(y/16%2)*12;x<128;x+=24){c.fillRect(x,y,1,16);c.fillStyle='#c1a17c55';c.fillRect(x+2,y+2,20,1);c.fillStyle='#3b332d55';}}}
  if(type==='stone'){for(let y=0;y<128;y+=32){c.fillStyle='#45544d55';c.fillRect(0,y,128,2);for(let x=(y/32%2)*24;x<128;x+=48)c.fillRect(x,y,2,32);}}
  const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;textureCache.set(type,t);return t;
}
export function createEnvironment(scene) {
  const r=random(819),land=new THREE.Group();scene.add(land);
  const colliders=[],occluders=[],wheels=[],lights=[],lanternMaterials=[],waterfalls=[];
  const materials={
    grass:new THREE.MeshStandardMaterial({map:surface('grass'),roughness:.95}),
    wood:new THREE.MeshStandardMaterial({map:surface('wood'),roughness:.86,color:0xc2a885}),
    darkWood:new THREE.MeshStandardMaterial({map:surface('wood'),roughness:.9,color:0x806851}),
    roof:new THREE.MeshStandardMaterial({map:surface('roof'),roughness:.87,color:0xaaa78a}),
    plaster:new THREE.MeshStandardMaterial({map:surface('plaster'),roughness:1}),
    stone:new THREE.MeshStandardMaterial({map:surface('stone'),roughness:.92,color:0xb1b4a4}),
    window:new THREE.MeshStandardMaterial({color:0xffd296,emissive:0xffa54d,emissiveIntensity:1.8,roughness:.4}),
    leaf:new THREE.MeshStandardMaterial({color:0x4d7850,roughness:.95}),
    iron:new THREE.MeshStandardMaterial({color:0x454d47,metalness:.65,roughness:.48}),
  };
  const boxGeo=new THREE.BoxGeometry(1,1,1),trunkGeo=new THREE.CylinderGeometry(.11,.22,1,7),leafGeo=new THREE.IcosahedronGeometry(1,2),stoneGeo=new THREE.DodecahedronGeometry(1,0);
  const add=(geo,material,parent,x,y,z,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const box=(parent,x,y,z,sx,sy,sz,material=materials.wood)=>add(boxGeo,material,parent,x,y,z,sx,sy,sz);
  // A continuous landscape, rather than a floating diorama.
  const ground=new THREE.PlaneGeometry(144,144,192,192);ground.rotateX(-Math.PI/2);
  const pos=ground.attributes.position,colors=[];
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,terrainHeight(x,z));const n=(Math.sin(x*.8+z*.3)+Math.cos(z*.6-x*.2))*.025;const elevation=terrainHeight(x,z);const col=new THREE.Color().setHSL(.24+n,.3,.77+n-Math.min(.1,elevation*.012));colors.push(col.r,col.g,col.b);}
  ground.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));ground.computeVertexNormals();
  const groundMat=materials.grass.clone();groundMat.vertexColors=true;groundMat.map=surface('grass').clone();groundMat.map.repeat.set(32,32);groundMat.map.needsUpdate=true;
  add(ground,groundMat,land,0,0,0).castShadow=false;
  // Worn paths join the plaza, bridges, cottages, and distant woodland.
  const dirt=new THREE.MeshStandardMaterial({color:0xc5b88e,roughness:1,map:surface('plaster'),polygonOffset:true,polygonOffsetFactor:-1});
  function path(points,width){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),verts=[],uv=[];for(let i=0;i<=100;i++){const t=i/100,p=curve.getPoint(t),d=curve.getTangent(t),n=new THREE.Vector3(-d.z,0,d.x).normalize();for(const side of[-1,1]){const x=p.x+n.x*width*.5*side,z=p.z+n.z*width*.5*side;verts.push(x,groundHeight(x,z)+.022,z);uv.push(side===-1?0:1,i/8);}}const indices=[];for(let i=0;i<100;i++){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();add(g,dirt,land,0,0,0).castShadow=false;}
  path([[-59,2],[-28,2],[-12,2],[0,2],[10,0],[18,-9],[19,-50]],4.2);
  path([[4,57],[3,20],[0,2],[-1,-10],[5,-19],[0,-59]],3.6);
  path([[-36,-23],[-12,-23],[4,-24],[20,-29],[48,-33]],3.1);
  const plaza=add(new THREE.CircleGeometry(6,40),dirt,land,0,.53,2);plaza.rotation.x=-Math.PI/2;plaza.castShadow=false;
  // A real planar reflection, softly disturbed by river ripples.
  const water=new Reflector(new THREE.PlaneGeometry(4.65,142),{color:0x94b5a4,textureWidth:512,textureHeight:512,clipBias:.003});
  water.rotation.x=-Math.PI/2;water.position.set(riverX,.22,0);land.add(water);
  water.material.uniforms.time={value:0};
  water.material.fragmentShader=water.material.fragmentShader.replace('uniform vec3 color;','uniform vec3 color;\nuniform float time;');
  water.material.fragmentShader=water.material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );','vec4 rippleUv=vUv; rippleUv.x += sin(vUv.y*120.0+time*1.3)*0.0012*vUv.w; vec4 base = texture2DProj(tDiffuse, rippleUv);');
  water.material.fragmentShader=water.material.fragmentShader.replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );','float ripple=pow(max(0.0,sin(vUv.y*240.0-time*2.0+sin(vUv.x*90.0))),22.0); gl_FragColor = vec4(mix(blendOverlay(base.rgb,color),vec3(0.20,0.39,0.34),0.34)+ripple*0.055,1.0);');
  const waterFallback=new THREE.Mesh(new THREE.PlaneGeometry(4.65,142),new THREE.MeshStandardMaterial({color:0x638e83,roughness:.15,metalness:.4}));waterFallback.rotation.copy(water.rotation);waterFallback.position.copy(water.position);waterFallback.visible=false;land.add(waterFallback);
  for(let i=0;i<86;i++){const z=-66+i*1.55;for(const side of[-1,1]){const x=riverX+side*(2.8+r()*.5),h=terrainHeight(x,z);const m=add(stoneGeo,materials.stone,land,x,h-.1,z,.5+r()*.5,.45+r()*.6,.6+r()*.5);m.rotation.set(r(),r()*5,r());}}
  function bridge(z){const g=new THREE.Group();g.position.set(riverX,0,z);land.add(g);
    for(let i=0;i<19;i++){const x=-4.5+i*.5,y=.87-Math.max(0,Math.abs(x)-2.6)*.185;const plank=box(g,x,y,0,.46,.18,3.25);plank.rotation.z=x<-2.6?.18:x>2.6?-.18:0;}
    for(const side of[-1,1]){for(let i=0;i<5;i++)box(g,-4+i*2,1.4,side*1.7,.16,1.7,.16,materials.darkWood);for(let i=0;i<4;i++){const rail=box(g,-3+i*2,1.95,side*1.7,2.1,.13,.13);rail.rotation.z=i===0?.09:i===3?-.09:0;}}
    box(g,0,.32,-1.3,8,.4,.24,materials.darkWood);box(g,0,.32,1.3,8,.4,.24,materials.darkWood);
  }
  BRIDGES.forEach(bridge);
  function cottage(x,z,w=5,d=4,variant=0){const g=new THREE.Group();g.position.set(x,groundHeight(x,z),z);land.add(g);g.userData.occluder=true;occluders.push(g);colliders.push({x,z,hx:w*.5+.3,hz:d*.5+.3});
    box(g,0,.25,0,w+.3,.5,d+.3,materials.stone);box(g,0,1.9,0,w,3,d,materials.plaster);
    for(const side of[-1,1]){box(g,side*(w/2-.1),1.9,d/2+.025,.18,3,.16,materials.darkWood);box(g,side*w*.24,1.9,d/2+.03,.13,3,.12,materials.wood);}
    box(g,0,.85,d/2+.06,w,.16,.15,materials.darkWood);box(g,0,3.3,d/2+.06,w,.2,.15,materials.darkWood);
    const roofShape=new THREE.Shape();roofShape.moveTo(-w*.6,0);roofShape.lineTo(0,2.7);roofShape.lineTo(w*.6,0);roofShape.closePath();
    const roofGeo=new THREE.ExtrudeGeometry(roofShape,{depth:d+1,bevelEnabled:false});roofGeo.translate(0,3.35,-d/2-.5);add(roofGeo,materials.roof,g,0,0,0);
    for(const side of[-1,1]){const beam=box(g,side*w*.3,4.65,d/2+.53,.16,3.1,.16,materials.darkWood);beam.rotation.z=side*Math.atan(w*.6/2.7);}
    box(g,0,1.35,d/2+.13,1.15,2.2,.18,materials.darkWood);box(g,-.12,1.4,d/2+.24,.83,1.9,.09,materials.wood);add(new THREE.SphereGeometry(.07,6,4),materials.iron,g,.21,1.3,d/2+.3);
    for(const side of[-1,1]){box(g,side*w*.32,2.0,d/2+.09,.95,1.15,.13,materials.darkWood);box(g,side*w*.32,2.05,d/2+.17,.76,.92,.05,materials.window);box(g,side*w*.32,2.05,d/2+.23,.07,1,.06,materials.wood);box(g,side*w*.32,2.05,d/2+.23,.8,.07,.06,materials.wood);box(g,side*w*.32,1.33,d/2+.25,1.15,.3,.6,materials.wood);for(let i=0;i<5;i++){const flowerMat=new THREE.MeshStandardMaterial({color:i%2?0xc68b9d:0xd7bc85});add(new THREE.IcosahedronGeometry(.11),flowerMat,g,side*w*.32-.4+i*.2,1.6,d/2+.35);}}
    box(g,-w*.27,4.6,-d*.2,.65,2.2,.7,materials.stone);box(g,-w*.27,5.7,-d*.2,.85,.2,.9,materials.stone);
    for(let i=0;i<3;i++)box(g,0,.12-i*.1,d/2+.4+i*.38,1.6+i*.15,.22,.4,materials.stone);
    if(variant===1){box(g,w/2+.5,.8,0,1,1.5,d,materials.stone);const wheel=new THREE.Group();wheel.position.set(w/2+1.1,1.45,0);g.add(wheel);wheels.push(wheel);const material=materials.darkWood;for(const x of[-.22,.22]){const rim=add(new THREE.TorusGeometry(1.8,.1,6,28),material,wheel,x,0,0);rim.rotation.y=Math.PI/2;}for(let i=0;i<12;i++){const a=i*Math.PI/6;const paddle=box(wheel,0,Math.sin(a)*1.8,Math.cos(a)*1.8,.8,.3,.42);paddle.rotation.x=-a;const spoke=box(wheel,0,Math.sin(a)*.9,Math.cos(a)*.9,.14,.1,1.8);spoke.rotation.x=-a;}box(wheel,0,0,0,1.1,.25,.25,materials.iron);}
    return g;
  }
  cottage(-19.2,-5,5,5,1);cottage(4,-15,5,4);cottage(16,-20,5.5,4.5);cottage(-26,-17,4.5,4);cottage(7,-36,4.8,4.4);cottage(28,17,4.3,4);
  // An old well and a stone arch give the central clearing landmarks.
  const well=new THREE.Group();well.position.set(7,groundHeight(7,3),3);land.add(well);colliders.push({x:7,z:3,hx:1.1,hz:1.1});
  add(new THREE.CylinderGeometry(1,1.1,1,12,1,true),materials.stone,well,0,.5,0);add(new THREE.TorusGeometry(1,.12,5,12),materials.stone,well,0,1,0).rotation.x=Math.PI/2;
  for(const x of[-1.3,1.3])box(well,x,1.6,0,.16,3.1,.16);const wellRoof=add(new THREE.ConeGeometry(2.1,1,4),materials.roof,well,0,3.2,0);wellRoof.rotation.y=Math.PI/4;
  const arch=new THREE.Group();arch.position.set(18,groundHeight(18,12),12);land.add(arch);for(const x of[-1.6,1.6]){box(arch,x,1.8,0,.75,3.6,.8,materials.stone);for(let i=0;i<3;i++)box(arch,x,.9+i*.6,.42,.15,.16,.035,materials.window);}box(arch,0,3.65,0,4.2,.65,1.1,materials.stone);
  // Fences are sparse enough to keep the combat area open.
  function fence(x,z,len,angle=0){const g=new THREE.Group(),base=groundHeight(x,z);g.position.set(x,base,z);g.rotation.y=angle;land.add(g);
    const height=t=>groundHeight(x+Math.cos(angle)*t,z-Math.sin(angle)*t)-base;
    for(let i=0;i<=len;i+=2)box(g,i,height(i)+.65,0,.15,1.4,.15,materials.darkWood);
    for(let i=0;i<len;i+=2){const end=Math.min(i+2,len),startH=height(i),endH=height(end),width=end-i;for(const y of[.55,1.1]){const rail=box(g,(i+end)*.5,(startH+endH)*.5+y,0,Math.hypot(width,endH-startH),.12,.12);rail.rotation.z=Math.atan2(endH-startH,width);}}
  }
  fence(-5,-11,5);fence(10,-10,5);fence(-25,7,8);fence(22,-25,7,Math.PI/2);fence(24,13,7,Math.PI/2);
  // Stone treads follow the northward ascent; retaining stones expose the terrace edges.
  for(let i=0;i<13;i++){const z=-7-i*.65,x=-.6+Math.sin(i*.15)*.5;const tread=box(land,x,groundHeight(x,z)+.025,z,2.8,.1,.44,materials.stone);tread.rotation.x=Math.atan2(groundHeight(x,z-.2)-groundHeight(x,z+.2),.4);}
  for(const [cx,cz,count]of[[18,7,13],[-27,-3,9],[27,37,12]])for(let i=0;i<count;i++){const x=cx+(i-(count-1)*.5)*1.2,z=cz+Math.sin(i*.55)*.5,h=terrainHeight(x,z),base=terrainHeight(x,z+2.3);const height=Math.max(.35,h-base+.35);box(land,x,h-height*.5-.08,z,1.08,height,.7,materials.stone);}
  // Instanced foliage keeps a large forest inexpensive to render.
  const leafMaterials=[0x6e9c5d,0x7fab60,0x8bb66a,0xa0bd72].map(color=>new THREE.MeshStandardMaterial({color,roughness:.95,map:surface('grass')}));
  const trees=[];
  for(let i=0;i<165;i++){const a=i*2.399,dist=19+r()*47,x=Math.cos(a)*dist,z=Math.sin(a)*dist;if(Math.abs(x-riverX)<4||Math.abs(x)<4||Math.abs(z-2)<3||colliders.some(c=>Math.abs(x-c.x)<c.hx+3&&Math.abs(z-c.z)<c.hz+3))continue;trees.push({x,z,s:.85+r()*.8});}
  // Deliberately frame the village, without putting a trunk in front of the hero.
  trees.push({x:-5,z:-7,s:1.5},{x:13,z:-9,s:1.3},{x:-22,z:10,s:1.35},{x:17,z:8,s:1.25});
  const fades=new THREE.InstancedBufferAttribute(new Float32Array(trees.length).fill(1),1);trunkGeo.setAttribute('treeFade',fades);leafGeo.setAttribute('treeFade',fades);
  function fadingMaterial(material){material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float treeFade; varying float vTreeFade;').replace('#include <begin_vertex>','#include <begin_vertex>\nvTreeFade=treeFade;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vTreeFade;').replace('#include <alphatest_fragment>','#include <alphatest_fragment>\nfloat mask=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453); if(mask>vTreeFade)discard;');};material.customProgramCacheKey=()=> 'forest-occlusion-v1';return material;}
  leafMaterials.forEach(fadingMaterial);
  const dummy=new THREE.Object3D(),trunks=new THREE.InstancedMesh(trunkGeo,fadingMaterial(materials.wood.clone()),trees.length);trunks.castShadow=true;trunks.receiveShadow=true;land.add(trunks);
  const canopies=leafMaterials.map(m=>{const o=new THREE.InstancedMesh(leafGeo,m,trees.length);o.castShadow=true;o.receiveShadow=true;land.add(o);return o;});
  trees.forEach(({x,z,s},i)=>{const y=groundHeight(x,z);dummy.position.set(x,y+2*s,z);dummy.scale.set(s,4*s,s);dummy.rotation.set(0,r()*6,0);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);for(let j=0;j<4;j++){dummy.position.set(x+Math.sin(j*2.1)*s*.8,y+(3.5+j*.65)*s,z+Math.cos(j*2.1)*s*.8);dummy.scale.set((2.1-j*.21)*s,(1.45-j*.08)*s,(1.8-j*.12)*s);dummy.rotation.set(r()*.3,r()*6,r()*.15);dummy.updateMatrix();canopies[j].setMatrixAt(i,dummy.matrix);}});
  // Thousands of small grass tufts, herbs and flowers in a single draw per type.
  const grassGeo=new THREE.BufferGeometry();
  grassGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.06,0,0,.06,0,0,.04,.32,.03,-.025,.32,.03,.055,.65,.09],3));grassGeo.setIndex([0,1,2,0,2,3,3,2,4]);grassGeo.computeVertexNormals();
  const grassMat=new THREE.MeshStandardMaterial({color:0xc0cf94,roughness:1,side:THREE.DoubleSide});const grass=new THREE.InstancedMesh(grassGeo,grassMat,30000);let gi=0;
  function tuft(x,z){for(let j=0;j<7&&gi<30000;j++){const xx=x+(r()-.5)*.35,zz=z+(r()-.5)*.35;dummy.position.set(xx,terrainHeight(xx,zz)+.03,zz);dummy.scale.set(.7+r()*.7,.45+r()*.7,1);dummy.rotation.set(0,r()*6.28,(r()-.5)*.35);dummy.updateMatrix();grass.setMatrixAt(gi++,dummy.matrix);grass.setColorAt(gi-1,new THREE.Color().setHSL(.22+r()*.06,.38,.39+r()*.18));}}
  for(let i=0;i<4900&&gi<26000;i++){const x=(r()-.5)*132,z=(r()-.5)*132;if(Math.abs(x-riverX)<3.3||Math.abs(z-2)<2.6||Math.abs(x)<2||Math.hypot(x,z-2)<6||colliders.some(c=>Math.abs(x-c.x)<c.hx+1&&Math.abs(z-c.z)<c.hz+1))continue;tuft(x,z);}
  for(let i=0;i<240;i++){const z=-58+i*.49;if(BRIDGES.some(b=>Math.abs(z-b)<2.3))continue;for(const side of[-1,1])tuft(riverX+side*(3.3+r()*.45),z);}
  grass.count=gi;grass.receiveShadow=true;land.add(grass);
  const rocks=new THREE.InstancedMesh(stoneGeo,materials.stone,180);for(let i=0;i<180;i++){const a=r()*6.28,d=10+r()*55,x=Math.cos(a)*d,z=Math.sin(a)*d;dummy.position.set(x,terrainHeight(x,z)+.1,z);dummy.scale.set(.2+r()*.8,.2+r()*.5,.2+r()*.8);dummy.rotation.set(r(),r()*6,r());dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}rocks.castShadow=true;rocks.receiveShadow=true;land.add(rocks);
  for(const [x,z]of[[-4,5],[6,-8],[-16,4],[12,10],[-24,-13],[3,18]]){const g=new THREE.Group();g.position.set(x,groundHeight(x,z),z);land.add(g);box(g,0,1.35,0,.1,2.7,.1,materials.darkWood);box(g,.25,2.6,0,.6,.08,.08,materials.iron);box(g,.5,2.25,0,.4,.55,.4,materials.window);const cap=add(new THREE.ConeGeometry(.39,.23,4),materials.iron,g,.5,2.64,0);cap.rotation.y=Math.PI/4;const light=new THREE.PointLight(0xffc27e,2.2,6,2);light.position.set(x+.5,groundHeight(x,z)+2.4,z);scene.add(light);lights.push(light);}
  const fireflies=new THREE.Group();land.add(fireflies);const glowMat=new THREE.MeshBasicMaterial({color:new THREE.Color(2.6,2.4,1.4)});for(let i=0;i<50;i++){const x=(r()-.5)*65,z=(r()-.5)*65,f=add(new THREE.SphereGeometry(.035,4,3),glowMat,fireflies,x,groundHeight(x,z)+.7+r()*2,z);f.castShadow=false;f.userData={base:f.position.clone(),phase:r()*7};}
  const decorations=new THREE.Group();land.add(decorations);for(const [id,x,z]of[['lumi',-3,0],['doto',3,-1]]){const actor=pixelActor(id,2.6);actor.position.set(x,groundHeight(x,z),z);decorations.add(actor);}
  function update(time,camera,night,low,reducedMotion,player=null,running=false){
    if(player){const cx=camera.position.x-player.x,cz=camera.position.z-player.z,length=Math.hypot(cx,cz);let changed=false;
      trees.forEach((tree,i)=>{const dx=tree.x-player.x,dz=tree.z-player.z,forward=(dx*cx+dz*cz)/length,side=Math.abs(dx*cz-dz*cx)/length,goal=running&&forward>-tree.s&&forward<17&&side<2.7*tree.s?.14:1;const value=fades.getX(i),next=value+(goal-value)*.16;if(Math.abs(next-value)>.001){fades.setX(i,next);changed=true;}});if(changed)fades.needsUpdate=true;
    }
    water.visible=!low;waterFallback.visible=low;water.material.uniforms.time.value=time;
    for(const light of lights)light.intensity=night?6:1.3;
    materials.window.emissiveIntensity=night?3.8:1.4;
    if(!reducedMotion){for(const w of wheels)w.rotation.x=time*.23;for(const f of fireflies.children){const b=f.userData.base;f.position.set(b.x+Math.sin(time*.5+f.userData.phase)*.35,b.y+Math.sin(time+f.userData.phase)*.18,b.z);}}
    for(const actor of decorations.children)animateActor(actor,camera,time,false);
  }
  return {land,colliders,occluders,decorations,fireflies,water,wheels,update};
}
