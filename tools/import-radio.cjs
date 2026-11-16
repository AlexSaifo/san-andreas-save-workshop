// Read the site's PC station tracks from the owner's installation into the
// local static project. Game files are opened read-only and never modified.
const fs = require('node:fs');
const p = require('node:path');
const vm = require('node:vm');
const root = p.resolve(__dirname, '..');
const game = process.argv[2];
if (!game) throw Error('Usage: node tools/import-radio.cjs "path/to/GTASA"');
const context = vm.createContext({Blob, DataView, TextDecoder, Uint8Array});
vm.runInContext(fs.readFileSync(p.join(root,'public/assets/radio-data.js'),'utf8') +
  ';this.stations=SA_STATIONS;this.reader=SARadioFiles;',context);

async function main(){
  const stations=context.stations.filter(s=>s[3]);
  const files=await Promise.all([
    ['CONFIG','TrakLkup.dat'],['CONFIG','StrmPaks.dat'],
    ...stations.map(s=>['streams',s[3]])
  ].map(async ([dir,name])=>{
    const blob=await fs.openAsBlob(p.join(game,'audio',dir,name));
    return Object.assign(blob,{name,webkitRelativePath:'audio/'+dir+'/'+name});
  }));
  const library=await context.reader.library(files);
  const base=p.join(root,'public/assets/radio/tracks');
  const entries=stations.map(s=>[s,library.tracks(s)]);
  for(const [s,ids] of entries) if(ids.length!==s[4].length)throw Error('Missing tracks for '+s[0]);
  let count=0,total=0;
  for(const [station,ids] of entries){
    const out=p.join(base,station[3]);
    fs.mkdirSync(out,{recursive:true});
    for(const id of ids){
      const blob=await library.clip(station[3],id);
      const bytes=Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(p.join(out,id+'.ogg'),bytes);
      count++;total+=bytes.length;
    }
    console.log(station[0]+': '+ids.length+' tracks');
  }
  console.log('Imported '+count+' original tracks; '+(total/1e6).toFixed(0)+' MB.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
