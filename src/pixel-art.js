import * as THREE from 'three';

// Authored on a native 48 × 64 pixel grid. No 3D renders or image smoothing.
export const CELL = { width: 48, height: 64, frames: 4, directions: 4 };
export const HERO_IDS = ['moru', 'lumi', 'doto'];
export const ENEMY_TYPES = [
  { id:'slime', name:'이슬 슬라임', hp:30, speed:1.1, damage:7, scale:.9, unlock:0, behavior:'hop' },
  { id:'moth', name:'그늘 나방', hp:22, speed:2.4, damage:7, scale:.85, unlock:0, behavior:'swoop' },
  { id:'spore', name:'독갓 버섯', hp:45, speed:.85, damage:9, scale:1, unlock:15, behavior:'ranged' },
  { id:'wisp', name:'길잃은 불씨', hp:27, speed:1.7, damage:8, scale:.85, unlock:25, behavior:'orbit' },
  { id:'beetle', name:'가시등 딱정벌레', hp:65, speed:1.2, damage:14, scale:1.1, unlock:40, behavior:'charge' },
  { id:'golem', name:'이끼 돌골렘', hp:130, speed:.65, damage:20, scale:1.65, unlock:60, behavior:'tank' },
];
export function availableEnemies(time) { return ENEMY_TYPES.filter(e=>time>=e.unlock); }

export function pixelFrame(id, direction=0, frame=0) {
  const width=CELL.width,height=CELL.height,pixels=new Uint8ClampedArray(width*height*4);
  const ink='#25332f', skin='#e6c99b', light='#fff0c3', wood='#765139';
  const colorCache=new Map();
  const rgba=c=>{if(!colorCache.has(c))colorCache.set(c,[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16),255]);return colorCache.get(c);};
  const dot=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x<0||x>=width||y<0||y>=height)return;pixels.set(rgba(c),(y*width+x)*4);};
  const rect=(x,y,w,h,c)=>{for(let j=Math.round(y);j<y+h;j++)for(let i=Math.round(x);i<x+w;i++)dot(i,j,c);};
  const poly=(pts,c)=>{const minY=Math.floor(Math.min(...pts.map(p=>p[1]))),maxY=Math.ceil(Math.max(...pts.map(p=>p[1])));for(let y=minY;y<=maxY;y++){const xs=[];for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>y)!==(b[1]>y))xs.push((b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]);}xs.sort((a,b)=>a-b);for(let i=0;i<xs.length;i+=2)for(let x=Math.ceil(xs[i]);x<=xs[i+1];x++)dot(x,y,c);}};
  const oval=(x,y,rx,ry,c)=>{for(let j=-ry;j<=ry;j++)for(let i=-rx;i<=rx;i++)if(i*i/(rx*rx)+j*j/(ry*ry)<=1)dot(x+i,y+j,c);};
  const line=(x,y,x2,y2,c,w=1)=>{const n=Math.max(Math.abs(x2-x),Math.abs(y2-y));for(let t=0;t<=n;t++)rect(x+(x2-x)*t/(n||1),y+(y2-y)*t/(n||1),w,w,c);};
  const ringOval=(x,y,rx,ry,c)=>{oval(x,y,rx,ry,ink);oval(x,y-1,rx-1,ry-1,c);};
  const back=direction===3,side=direction===1||direction===2;
  const step=[0,-1,0,1][frame],bob=frame%2===1?-1:0;
  const eyes=(y,angry=false)=>{if(back)return;const x=side?27:20;rect(x,y,2,3,ink);dot(x,y,light);if(!side){rect(28,y,2,3,ink);dot(28,y,light);}if(angry){line(x-1,y-2,x+2,y-1,ink);if(!side)line(27,y-1,30,y-2,ink);}};
  const leaf=(x,y,c)=>{poly([[x-5,y],[x-3,y-4],[x+4,y-5],[x+2,y+1],[x-2,y+3]],ink);poly([[x-3,y],[x-2,y-3],[x+3,y-4],[x,y+1]],c);line(x-3,y+1,x+2,y-3,'#d2df8e');};

  if(HERO_IDS.includes(id)){
    // Asymmetric limbs make each walk frame a new drawing, anchored at the feet.
    ringOval(18,57+step,5,3,wood);ringOval(29,57-step,5,3,wood);
    rect(15,56+step,7,2,'#a78252');rect(26,56-step,7,2,'#a78252');
    if(id==='moru'){
      poly([[16,32+bob],[30,31+bob],[36,49],[31,54],[14,54],[10,48]],ink);
      poly([[17,33+bob],[29,33+bob],[33,48],[28,51],[15,51],[13,46]],'#436a47');
      poly([[17,34],[20,35],[19,49],[14,48]],'#78955a');poly([[28,34],[32,47],[26,50],[25,37]],'#34513b');
      ringOval(23,28+bob,12,12,'#ad895b');oval(21,28+bob,9,9,skin);rect(15,28+bob,3,7,'#c6a776');
      if(back){oval(23,29+bob,10,9,'#8b6b49');line(18,27,18,34,'#b69961');}else{eyes(28+bob);rect(23,35+bob,3,1,wood);dot(17,33+bob,'#d99376');}
      ringOval(22,17+bob,14,8,'#527d47');oval(18,15+bob,8,5,'#87ac62');oval(29,17+bob,6,5,'#416849');rect(13,13+bob,8,2,'#b2c875');
      line(17,12+bob,14,5+bob,wood,2);line(28,12+bob,33,5+bob,wood,2);leaf(12,5+bob,'#8eb45b');leaf(34,5+bob,'#bdd284');
      ringOval(11,40-step,3,5,skin);ringOval(35,40+step,3,5,'#b99a6b');
      rect(14,45,18,3,wood);rect(23,44,4,4,'#d8ba64');dot(24,45,'#fff1ad');rect(17,48,6,4,'#b49b68');
      line(38,25,38,56,ink,3);line(39,25,39,55,'#ad8150');line(38,26,42,21,wood,2);leaf(42,20,'#8bb866');
    }else if(id==='lumi'){
      poly([[16,29],[8,18+bob],[3,21+bob],[6,32],[14,39]],ink);poly([[15,29],[8,21+bob],[5,23+bob],[8,31],[15,36]],'#a9d6cc');line(7,24,14,33,'#e7f2c8');
      poly([[31,29],[38,17-bob],[44,20-bob],[41,32],[33,39]],ink);poly([[32,29],[38,20-bob],[42,22-bob],[39,31],[32,36]],'#b7dfd0');
      poly([[17,32],[30,32],[34,50],[29,55],[15,54],[12,49]],ink);poly([[18,34],[29,34],[31,49],[26,52],[16,50]],'#e6bd61');poly([[16,35],[21,37],[20,50],[15,48]],'#fff0ad');poly([[28,36],[31,49],[26,51],[25,38]],'#b38747');
      ringOval(24,25+bob,10,12,skin);oval(23,23+bob,11,7,'#d9ad55');poly([[15,20],[20,14],[29,14],[35,22],[30,21],[26,18],[22,25],[16,28]],'#fff1ba');line(30,23,32,32,'#9a7a48',2);
      if(back)oval(24,27,9,9,'#d7ac58');else{eyes(27+bob);rect(23,34+bob,3,1,wood);}
      ringOval(25,12+bob,7,3,'#7c9d69');leaf(30,7+bob,'#b8d48b');
      ringOval(13,39-step,3,4,skin);ringOval(34,40+step,3,4,skin);line(36,40+step,36,44+step,ink);
      rect(32,44+step,9,11,ink);rect(33,45+step,7,8,'#c58d42');rect(35,46+step,3,6,'#fff5c1');dot(36,45+step,'#ffffff');rect(31,43+step,11,2,wood);rect(32,54+step,9,2,wood);
      rect(21,44,5,4,'#edf0c2');rect(22,45,2,2,'#9caf6e');
    }else{
      poly([[15,33],[30,33],[35,50],[28,55],[14,53],[10,47]],ink);poly([[16,34],[29,35],[32,49],[27,52],[15,50],[13,46]],'#996545');poly([[17,37],[26,36],[28,49],[19,52]],'#c99963');line(17,39,17,48,'#e7be7c',2);
      ringOval(23,29+bob,10,11,skin);if(back)oval(23,31,9,8,'#ad8558');else{eyes(29+bob);rect(23,36+bob,3,1,wood);}
      poly([[3,22+bob],[7,13+bob],[15,7+bob],[29,6+bob],[39,12+bob],[45,22+bob],[39,26+bob],[9,26+bob]],ink);
      poly([[5,21+bob],[9,14+bob],[17,9+bob],[29,8+bob],[38,14+bob],[43,22+bob],[37,24+bob],[10,24+bob]],'#b45c49');poly([[8,19+bob],[14,12+bob],[25,10+bob],[34,12+bob],[38,17+bob],[28,18+bob],[17,21+bob]],'#e29465');rect(7,23+bob,34,2,'#f5d5a1');
      oval(15,14+bob,3,2,'#ffe3aa');oval(29,13+bob,4,2,'#fff0ba');oval(36,20+bob,2,1,'#f7d197');rect(9,19+bob,4,2,'#9e4d40');
      ringOval(11,40-step,3,4,skin);ringOval(35,40+step,3,4,skin);rect(13,46,19,3,wood);rect(23,45,4,5,'#d8bb72');
      rect(29,43,6,9,ink);rect(30,44,4,6,'#799aa0');rect(30,42,3,2,'#dec798');dot(31,45,'#d9e9cb');
    }
  }else if(id==='slime'){
    const squash=frame%2;poly([[5,52],[7,43-squash],[12,37],[22,34-squash*2],[34,37],[40,44],[43,53],[38,57],[10,57]],ink);
    poly([[7,51],[9,44-squash],[14,39],[23,36-squash*2],[33,39],[38,46],[40,53],[35,55],[11,54]],'#3b8575');oval(22,43,11,5,'#65b89b');rect(15,39,8,2,'#b9e4b7');rect(10,48,3,3,'#92d1b2');rect(32,51,5,2,'#245b60');eyes(46,true);rect(23,52,4,2,'#cce4b2');
  }else if(id==='moth'){
    const lift=[0,6,0,-4][frame];poly([[22,37],[11,26-lift],[2,29-lift],[6,44],[15,48],[22,45]],ink);poly([[21,38],[11,30-lift],[5,31-lift],[9,42],[16,45]],'#69517f');line(9,33-lift,15,41,'#ac87a4',2);
    poly([[27,37],[37,26-lift],[46,29-lift],[42,44],[33,48],[26,45]],ink);poly([[28,38],[37,30-lift],[43,31-lift],[39,42],[32,45]],'#78608e');line(38,33-lift,32,41,'#b393b3',2);
    ringOval(24,42,6,11,'#463954');oval(24,36,6,5,'#8c739b');rect(20,36,2,3,'#f4c096');rect(27,36,2,3,'#f4c096');line(21,31,18,26,'#493d54');line(27,31,30,26,'#493d54');rect(22,48,4,4,'#b4a0b8');
  }else if(id==='spore'){
    ringOval(19,57+step,5,2,'#6c4b61');ringOval(31,57-step,5,2,'#6c4b61');ringOval(24,45+bob,10,12,'#bcaaa1');oval(22,43+bob,7,8,'#e4cfb2');eyes(43,true);rect(23,50,4,2,ink);
    poly([[3,34+bob],[9,24+bob],[17,20+bob],[31,20+bob],[39,25+bob],[45,34+bob],[40,39],[8,39]],ink);poly([[5,34+bob],[11,26+bob],[18,23+bob],[30,22+bob],[37,27+bob],[42,35+bob],[37,37],[10,37]],'#8a4d72');oval(16,29+bob,4,2,'#da9eaa');oval(29,26+bob,3,2,'#f0c1b4');rect(30,34,6,2,'#b96e8c');rect(9,37,29,2,'#d4b8b7');
  }else if(id==='wisp'){
    poly([[24,17+bob],[29,25],[36,30],[37,42],[31,48],[33,55],[24,52],[18,57],[16,49],[11,42],[12,31],[19,25]],'#204b5c');poly([[24,21+bob],[27,28],[33,32],[34,41],[28,47],[28,51],[23,49],[19,52],[18,46],[14,40],[15,32],[21,28]],'#5ab6c4');poly([[24,27],[29,33],[29,42],[24,46],[18,40],[18,33]],'#b2e7dc');rect(19,34,3,4,'#294957');rect(27,34,3,4,'#294957');dot(20,34,'#f8ffdf');dot(28,34,'#f8ffdf');
  }else if(id==='beetle'){
    for(let i=0;i<3;i++){line(13,40+i*6,6-step,39+i*7,ink,2);line(34,40+i*6,41+step,39+i*7,ink,2);}
    ringOval(24,43+bob,15,13,'#69543e');oval(23,41+bob,12,10,'#9b7947');oval(20,38+bob,7,5,'#c5a264');line(24,33,24,51,'#4b4a3b',2);rect(12,45,6,2,'#675239');rect(29,45,6,2,'#675239');
    for(let i=0;i<3;i++)poly([[14+i*9,35],[17+i*9,29],[20+i*9,36]],'#d4bc81');ringOval(24,54,9,6,'#49534a');rect(18,52,3,2,'#f3bb6f');rect(28,52,3,2,'#f3bb6f');line(19,58,16,61,wood,2);line(29,58,32,61,wood,2);
  }else if(id==='golem'||id==='boss'){
    const boss=id==='boss',dark=boss?'#49394d':'#4b6262',base=boss?'#736174':'#83958b',shine=boss?'#b48e91':'#c0c7a5';
    ringOval(16,58+step,7,3,dark);ringOval(33,58-step,7,3,dark);poly([[13,27],[32,25],[39,47],[32,55],[14,54],[8,43]],ink);poly([[15,29],[31,28],[36,46],[30,51],[15,51],[11,42]],base);poly([[15,30],[22,29],[20,40],[12,42]],shine);poly([[29,32],[34,43],[31,49],[25,46]],dark);
    ringOval(7,44-step,6,10,base);ringOval(41,44+step,6,10,base);rect(4,40-step,4,6,shine);rect(40,48+step,5,3,dark);
    poly([[13,14],[30,12],[37,19],[34,30],[15,31],[10,23]],ink);poly([[15,16],[29,15],[34,20],[31,28],[16,28],[13,22]],base);line(16,17,26,16,shine,2);rect(16,22,5,3,boss?'#ffcb7b':'#c7e6bd');rect(27,21,5,3,boss?'#ffcb7b':'#c7e6bd');rect(22,28,4,1,ink);
    poly([[21,35],[27,34],[30,40],[25,46],[19,40]],dark);poly([[23,36],[26,36],[28,40],[24,43],[21,40]],boss?'#eabf76':'#99d7bd');dot(24,37,light);line(29,45,33,49,shine);
    if(boss){for(let i=0;i<5;i++)poly([[7+i*8,18],[9+i*8,3+Math.abs(i-2)*2],[14+i*8,16]],'#b39a68');poly([[11,17],[36,15],[35,19],[13,20]],'#e2c68b');leaf(11,29,'#659367');leaf(35,30,'#81a375');}else{oval(15,14,6,3,'#5d8054');rect(11,13,7,2,'#9db170');oval(34,35,4,3,'#638359');}
  }
  if(direction===2){const mirrored=new Uint8ClampedArray(pixels.length);for(let y=0;y<height;y++)for(let x=0;x<width;x++)mirrored.set(pixels.subarray((y*width+x)*4,(y*width+x)*4+4),(y*width+width-1-x)*4);return mirrored;}
  return pixels;
}

const atlases=new Map();
export function spriteAtlas(id) {
  if(atlases.has(id))return atlases.get(id);
  const {width:w,height:h,frames,directions}=CELL,bytes=new Uint8Array(w*frames*h*directions*4);
  for(let d=0;d<directions;d++)for(let f=0;f<frames;f++){
    const cell=pixelFrame(id,d,f);
    for(let y=0;y<h;y++)bytes.set(cell.subarray(y*w*4,(y+1)*w*4),((d*h+y)*w*frames+f*w)*4);
  }
  const texture=new THREE.DataTexture(bytes,w*frames,h*directions,THREE.RGBAFormat);
  texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=true;texture.needsUpdate=true;
  atlases.set(id,texture);return texture;
}

export function pixelActor(id, height=2.6) {
  const group=new THREE.Group(),texture=spriteAtlas(id).clone();texture.needsUpdate=true;texture.repeat.set(.25,.25);texture.offset.set(0,.75);
  const material=new THREE.MeshStandardMaterial({map:texture,transparent:false,alphaTest:.5,side:THREE.DoubleSide,roughness:1,metalness:0,emissiveMap:texture,emissive:0xffffff,emissiveIntensity:id==='wisp'?1.4:.3});
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(height*.75,height),material);plane.position.y=height*.5;plane.castShadow=true;plane.receiveShadow=true;
  plane.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:texture,alphaTest:.5,side:THREE.DoubleSide});
  group.add(plane);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.47,16),new THREE.MeshBasicMaterial({color:0x233530,transparent:true,opacity:.2,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.y=.58;shadow.position.y=.025;group.add(shadow);
  group.userData={pixelActor:true,id,plane,shadow,texture,direction:0,heading:new THREE.Vector3(0,0,1)};
  return group;
}

export function animateActor(actor,camera,time,moving=false,heading=null) {
  const data=actor.userData;if(!data.pixelActor)return;
  actor.rotation.y=0;data.plane.rotation.y=Math.atan2(camera.position.x-actor.position.x,camera.position.z-actor.position.z);
  if(heading&&heading.lengthSq()>.001)data.heading.copy(heading);
  const angle=data.plane.rotation.y,dx=data.heading.x*Math.cos(angle)-data.heading.z*Math.sin(angle),forward=data.heading.x*Math.sin(angle)+data.heading.z*Math.cos(angle);
  if(moving)data.direction=Math.abs(dx)>Math.abs(forward)*.85?(dx>0?1:2):(forward<0?3:0);
  const frame=moving?Math.floor(time*8)%4:Math.floor(time*2)%2*2;
  data.texture.offset.set(frame*.25,(3-data.direction)*.25);
  if(data.id==='wisp'||data.id==='moth'||data.id==='lumi')data.plane.position.y=1.3+Math.sin(time*4)*.07;
}

export class Portraits {
  image(kind) {
    const canvas=document.createElement('canvas');canvas.width=192;canvas.height=224;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    const small=document.createElement('canvas');small.width=48;small.height=64;small.getContext('2d').putImageData(new ImageData(pixelFrame(typeof kind==='string'?kind:HERO_IDS[kind]),48,64),0,0);
    ctx.drawImage(small,0,0,48,64,12,-12,168,224);return canvas.toDataURL('image/png');
  }
  dispose(){}
}
