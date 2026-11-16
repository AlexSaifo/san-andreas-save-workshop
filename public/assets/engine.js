'use strict';
class SaveFile {
  static size=202752;
  static names=['Game & clock','Scripts & missions','Player & weapons','Garages','Restart rules','Radar','Pickups','Objects','Paths','Vehicles','Zones & territories','Gang weapons','Car generators','Audio scripts','Pools','Player info','Statistics','Police zones','Streaming','Ped relationships','Tags','IPLs','Shopping','Gang wars','Stunt jumps','Interiors','Radio','Ped state','Unused 28','Unused 29','Player info copy','Statistics copy','Police zones copy'];
  constructor(bytes) {
    this.bytes=new Uint8Array(bytes);this.original=this.bytes.slice();this.view=new DataView(this.bytes.buffer);this.history=[];this.future=[];this.log=[];
    this.parse();
    this.checksumValid=this.checksum()===this.view.getUint32(this.bytes.length-4,true);
    this.scriptSize=this.read(1,4+this.read(1,0,'u32')+0x8f2,'u32');
    this.standardScript=this.read(1,0,'u32')===43808 && [194146,194125].includes(this.scriptSize);
    this.version=this.read(0,0,'u32');
    this.iplVersion=[0xfd148df6,0x5d31cc22].includes(this.version)?2:1;
  }
  parse() {
    if(this.bytes.length!==SaveFile.size)throw Error('Only classic PC saves of 202,752 bytes are supported. Mobile, console and Definitive Edition saves use different layouts.');
    const p=[];for(let i=0;i<this.bytes.length-8;i++)if(this.bytes[i]===66&&this.bytes[i+1]===76&&this.bytes[i+2]===79&&this.bytes[i+3]===67&&this.bytes[i+4]===75){p.push(i);i+=4;}
    if(p.length!==34||p[0]!==0)throw Error('Unrecognized BLOCK structure. This editor cannot safely edit this file.');
    this.markers=p;this.blocks=p.slice(0,-1).map((start,i)=>({start:start+5,length:p[i+1]-start-5,name:SaveFile.names[i]}));
    const expected={0:312,3:9159,4:11,10:18892,11:160,15:44,16:1940,19:640,20:104,23:92,30:44,31:1940,32:6724};
    for(const [i,n]of Object.entries(expected))if(this.blocks[i].length!==n)throw Error('Unsupported layout in block '+i+'. No editing was applied.');
    if(this.blocks[1].length<12||this.read(1,0,'u32')+4+0x906>this.blocks[1].length||this.blocks[2].length<0x225)throw Error('Truncated player/script data.');
    const count=this.read(24,0,'u32');if(count>1000||this.blocks[24].length!==4+count*0x44)throw Error('Invalid stunt jump structure.');
    this.jumpCount=count;
    this.scriptSize=this.read(1,4+this.read(1,0,'u32')+0x8f2,'u32');
    this.standardScript=this.read(1,0,'u32')===43808 && [194146,194125].includes(this.scriptSize);
    this.version=this.read(0,0,'u32');
    this.iplVersion=[0xfd148df6,0x5d31cc22].includes(this.version)?2:1;
  }
  static widths={u8:1,bool:1,u16:2,i16:2,i32:4,u32:4,f32:4};
  address(block,offset,width=1) {
    const b=this.blocks[block];if(!b||!Number.isInteger(offset)||offset<0||offset+width>b.length)throw Error('Field is outside its data block.');return b.start+offset;
  }
  read(block,offset,type='i32') {
    const a=this.address(block,offset,SaveFile.widths[type]);const v=this.view;
    switch(type){case 'u8':return v.getUint8(a);case 'bool':return v.getUint8(a)!==0;case 'u16':return v.getUint16(a,true);case 'i16':return v.getInt16(a,true);case 'u32':return v.getUint32(a,true);case 'i32':return v.getInt32(a,true);case 'f32':return v.getFloat32(a,true);default:throw Error('Unknown value type.');}
  }
  write(block,offset,type,value) {
    const a=this.address(block,offset,SaveFile.widths[type]);const v=this.view;
    const ranges={u8:[0,255],u16:[0,65535],i16:[-32768,32767],u32:[0,4294967295],i32:[-2147483648,2147483647]};
    if(type!=='bool'&&(!Number.isFinite(value)||(ranges[type]&&(!Number.isInteger(value)||value<ranges[type][0]||value>ranges[type][1]))||(type==='f32'&&!Number.isFinite(Math.fround(value)))))throw Error('Enter a finite value within the '+type+' range.');
    switch(type){case 'u8':case 'bool':v.setUint8(a,type==='bool'?(value?1:0):value);break;case 'u16':v.setUint16(a,value,true);break;case 'i16':v.setInt16(a,value,true);break;case 'i32':v.setInt32(a,value,true);break;case 'u32':v.setUint32(a,value,true);break;case 'f32':v.setFloat32(a,value,true);break;default:throw Error('Unknown value type.');}
  }
  text(block,offset,length) {const a=this.address(block,offset,length);let s='';for(let i=0;i<length&&this.bytes[a+i];i++)s+=String.fromCharCode(this.bytes[a+i]);return s;}
  writeText(block,offset,length,value) {if(value.length>=length||/[^\x20-\x7e]/.test(value))throw Error('Use printable English characters, up to '+(length-1)+' characters.');if(value.includes('BLOCK'))throw Error('The word BLOCK is reserved by the save format.');const a=this.address(block,offset,length);this.bytes.fill(0,a,a+length);for(let i=0;i<value.length;i++)this.bytes[a+i]=value.charCodeAt(i);}
  transaction(label,fn) {
    const before=this.bytes.slice();try{fn();this.parse();}catch(e){this.bytes.set(before);this.parse();throw e;}
    if(!this.bytes.some((v,i)=>v!==before[i]))return false;
    this.history.push({bytes:before,log:this.log.slice()});if(this.history.length>80)this.history.shift();this.future=[];this.log.push(label);return true;
  }
  undo(){if(!this.history.length)return;this.future.push({bytes:this.bytes.slice(),log:this.log.slice()});const x=this.history.pop();this.bytes.set(x.bytes);this.log=x.log;this.parse();}
  redo(){if(!this.future.length)return;this.history.push({bytes:this.bytes.slice(),log:this.log.slice()});const x=this.future.pop();this.bytes.set(x.bytes);this.log=x.log;this.parse();}
  reset(){this.bytes.set(this.original);this.history=[];this.future=[];this.log=[];this.parse();}
  checksum(bytes=this.bytes){let n=0;for(let i=0;i<bytes.length-4;i++)n=(n+bytes[i])>>>0;return n;}
  changedBytes(){let n=0;for(let i=0;i<this.bytes.length-4;i++)if(this.bytes[i]!==this.original[i])n++;return n;}
  export(repair=false){
    if(!this.checksumValid&&!repair)throw Error('Original checksum is invalid. Enable checksum repair in Advanced before exporting.');
    const out=this.bytes.slice();for(const [src,dst]of [[15,30],[16,31],[17,32]]){
      const b=this.blocks[src],d=this.blocks[dst];if(b.length!==d.length)throw Error('Duplicated block lengths differ.');
      // Keep a no-op export byte-identical; mirror only edited primary blocks.
      if(this.bytes.subarray(b.start,b.start+b.length).some((v,i)=>v!==this.original[b.start+i]))out.set(this.bytes.subarray(b.start,b.start+b.length),d.start);
    }
    new DataView(out.buffer).setUint32(out.length-4,this.checksum(out),true);
    const parsed=new SaveFile(out);if(!parsed.checksumValid)throw Error('Export integrity verification failed.');return out;
  }
  global(index,type='i32'){if(!Number.isInteger(index)||index<0||index*4+4>this.read(1,0,'u32'))throw Error('Invalid script global index.');return {id:'global'+index,label:SAVE_DATA.globals[index]||'Global '+index,block:1,offset:4+index*4,type};}
  stat(id){if(!((id>=0&&id<=81)||(id>=120&&id<=342)))throw Error('Invalid statistic ID.');return {id:'stat'+id,label:SAVE_DATA.stats[id]||'Stat '+id,block:16,offset:id<=81?id*4:0x148+(id-120)*4,type:id<=81?'f32':'i32',stat:id};}
}
if(typeof module!=='undefined')module.exports={SaveFile};
