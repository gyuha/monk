import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { spriteAtlas, HERO_IDS, ENEMY_TYPES, CELL } from '../src/pixel-art.js';

// PNG encoder for the authored RGBA atlas; no image dependency or resampling.
function crc32(data){let crc=0xffffffff;for(const byte of data){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([length,name,data,crc]);}
function png(width,height,pixels){const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const rows=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)Buffer.from(pixels.buffer,pixels.byteOffset+y*width*4,width*4).copy(rows,y*(width*4+1)+1);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
const directory=new URL('../public/sprites/',import.meta.url);await mkdir(directory,{recursive:true});
for(const id of [...HERO_IDS,...ENEMY_TYPES.map(e=>e.id),'boss']){const {image}=spriteAtlas(id);await writeFile(new URL(`${id}.png`,directory),png(image.width,image.height,image.data));}
await writeFile(new URL('atlas.json',directory),JSON.stringify({cell:CELL,directionRows:['front','right','left','back'],columns:['contact','passing','opposite-contact','passing'],filter:'nearest',transparent:true,source:'src/pixel-art.js'},null,2)+'\n');
console.log('Exported 10 original pixel atlases (192 × 256 PNG).');
