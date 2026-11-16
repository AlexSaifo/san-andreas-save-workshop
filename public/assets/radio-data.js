'use strict';
// Original PC radio music/segment IDs: gta-reversed Audio/Config/RadioStreamsPC.h.
const SA_STATIONS = [
  ['Playback FM','Old-school hip-hop','playback','CH',[231,238,245,252,259,266,273,280,287,294,301,308]],
  ['K-Rose','Country','krose','CO',[365,372,379,386,393,400,407,414,421,428,435,442,449,456,463]],
  ['K-DST','Classic rock','kdst','CR',[513,520,527,534,541,547,554,561,564,570,577,584,591,598,605,612,619]],
  ['Bounce FM','Funk & disco','bounce','DS',[827,834,841,848,855,862,869,876,883,890,897,904,911,918,925,932,939]],
  ['SF-UR','House','sfur','HC',[981,986,991,996,1001,1006,1011,1016,1021,1026,1031,1036,1041,1046,1051,1056]],
  ['Radio Los Santos','West Coast hip-hop','rls','MH',[1111,1118,1125,1132,1139,1146,1152,1158,1164,1169,1176,1183,1190,1195,1202,1208]],
  ['Radio X','Alternative rock','radiox','MR',[1259,1266,1273,1280,1287,1294,1301,1308,1315,1322,1329,1336,1343,1350,1357]],
  ['CSR 103.9','New jack swing & R&B','csr','NJ',[1399,1406,1413,1420,1427,1434,1441,1448,1455,1462,1469,1476,1483]],
  ['K-Jah West','Dub & reggae','kjah','RE',[1542,1549,1556,1563,1570,1577,1584,1591,1598,1605,1612,1619,1625,1632,1639,1645]],
  ['Master Sounds 98.3','Soul, rare groove & funk','mastersounds','RG',[1706,1713,1720,1727,1734,1741,1748,1754,1761,1768,1775,1782,1787,1790,1796,1803,1809,1814]],
  ['WCTR','West Coast Talk Radio','wctr','TK',Array.from({length:31},(_,i)=>1829+i*3)],
  ['Radio Off','Silence',null,null,[]]
];
// Decode one indexed clip at a time rather than reading an entire station.
const SARadioFiles = (() => {
  const key = new Uint8Array([0xea,0x3a,0xc4,0xa1,0x9a,0xa8,0x14,0xf3,0x48,0xb0,0xd7,0x23,0x9d,0xe8,0xff,0xf1]);
  const headerSize = 8068;
  async function library(files) {
    const config = new Map(), streams = new Map();
    for (const file of files) {
      const p = (file.webkitRelativePath || file.name).toLowerCase();
      if (p.includes('/config/')) config.set(file.name.toLowerCase(),file);
      if (p.includes('/streams/')) streams.set(file.name.toUpperCase(),file);
    }
    const index = config.get('traklkup.dat'), packs = config.get('strmpaks.dat');
    if (!index || !packs || !streams.size) throw Error('Choose the game’s audio folder, which contains CONFIG and streams.');
    if (!index.size || index.size % 12 || index.size > 100000 || !packs.size || packs.size % 16 || packs.size > 4096) throw Error('These radio tables are not in the classic PC format.');
    const tv = new DataView(await index.arrayBuffer()), pv = new Uint8Array(await packs.arrayBuffer());
    const decoder = new TextDecoder();
    const names = Array.from({length:pv.length/16},(_,i)=>decoder.decode(pv.subarray(i*16,i*16+16)).split(String.fromCharCode(0))[0].toUpperCase());
    const tracks = expected => expected[4].filter(id => id*12+12<=tv.byteLength && names[tv.getUint8(id*12)]===expected[3] && streams.has(expected[3]));
    async function clip(expected,id) {
      const p=id*12;
      if (p+12>tv.byteLength || names[tv.getUint8(p)]!==expected) throw Error('This track is missing from your installation.');
      const offset=tv.getUint32(p+4,true), start=offset+headerSize, lookupSize=tv.getUint32(p+8,true);
      const f=streams.get(expected);
      if(!f||start+32>f.size)throw Error('This track could not be read.');
      async function decode(begin,end){
        const b=new Uint8Array(await f.slice(begin,end).arrayBuffer());
        for(let i=0;i<b.length;i++) b[i]^=key[(begin+i)&15];
        return b;
      }
      // The lookup size can include the header; the stream header gives the exact Ogg length.
      const header=await decode(start-68,start), hv=new DataView(header.buffer);
      const lengths=Array.from({length:8},(_,i)=>hv.getUint32(i*8,true)).filter(n=>n!==0xcdcdcdcd&&n>=32);
      const size=lengths[0];
      if (!size||size>lookupSize||size>32*1024*1024||start+size>f.size) throw Error('This track could not be read.');
      const b=await decode(start,start+size);
      if(b[0]!==79||b[1]!==103||b[2]!==103||b[3]!==83) throw Error('This audio stream is not supported.');
      return new Blob([b],{type:'audio/ogg'});
    }
    return {tracks,clip};
  }
  return {library};
})();
