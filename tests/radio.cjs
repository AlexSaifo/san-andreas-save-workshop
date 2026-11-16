const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const web = path.join(__dirname, '../public');
const context = vm.createContext({Blob, DataView, TextDecoder, Uint8Array});
vm.runInContext(fs.readFileSync(path.join(web,'assets/radio-data.js'),'utf8') +
  ';this.stations=SA_STATIONS;this.radio=SARadioFiles;',context);

async function check() {
  const {stations,radio} = context;
  assert.equal(stations.length,12);
  assert.equal(new Set(stations.filter(s=>s[3]).map(s=>s[3])).size,11);
  for(const [, , icon] of stations) if(icon) assert.ok(fs.existsSync(path.join(web,'assets/radio',icon+'.png')));
  assert.ok(fs.existsSync(path.join(web,'assets/san-andreas-reference.webp')));
  for(const s of stations.filter(s=>s[3])) for(const id of s[4]){
    const track=fs.readFileSync(path.join(web,'assets/radio/tracks',s[3],id+'.ogg'));
    assert.equal(track.toString('ascii',0,4),'OggS');
  }
  await assert.rejects(radio.library([]), /audio folder/);
  if(!process.argv[2]){console.log('PASS all 186 bundled radio tracks, station icons and exact logo present.');return;}
  const game = process.argv[2];
  const files = await Promise.all([
    ['CONFIG','TrakLkup.dat'],['CONFIG','StrmPaks.dat'],
    ...stations.filter(s=>s[3]).map(s=>['streams',s[3]])
  ].map(async ([dir,name])=>{
    const blob=await fs.openAsBlob(path.join(game,'audio',dir,name));
    return Object.assign(blob,{name,webkitRelativePath:'audio/'+dir+'/'+name});
  }));
  const library=await radio.library(files);
  let total=0;
  for(const station of stations.filter(s=>s[3])){
    const ids=library.tracks(station);
    assert.equal(ids.length,station[4].length,station[0]);
    for(const id of ids){
      const clip=await library.clip(station[3],id), bytes=Buffer.from(await clip.arrayBuffer());
      assert.ok(bytes.equals(fs.readFileSync(path.join(web,'assets/radio/tracks',station[3],id+'.ogg'))),station[0]+' '+id+' differs from the installed game');
      let end=0, flags=0;
      while(end<bytes.length){
        assert.equal(bytes.toString('ascii',end,end+4),'OggS',station[0]+' '+id);
        flags=bytes[end+5];
        const segments=bytes[end+26], lengths=bytes.subarray(end+27,end+27+segments);
        end+=27+segments+lengths.reduce((n,x)=>n+x,0);
      }
      assert.equal(end,bytes.length);
      assert.ok(flags&4,station[0]+' '+id+' has no final Ogg page');
      total++;
    }
  }
  console.log('PASS '+total+' complete original Ogg clips across all 11 local stations.');
}
check().catch(error=>{console.error(error);process.exitCode=1;});
