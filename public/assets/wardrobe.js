const CLOTH_MODEL=[0x1ac,0x1b0,0x1b8,0x1bc,0x1c0,0x1c4,0x1c8,0x1cc,0x1d0];
const CLOTH_TEXTURE=[0x1d4,0x1d8,0x1dc,0x1e0,0x208,0x20c,0x210,0x214,0x218];
const CLOTH_NAMES=['Torso','Hair','Legs','Shoes','Necklace','Watch','Glasses','Hat','Special outfit'];
const TATTOO_NAMES=['Left upper arm','Left lower arm','Right upper arm','Right lower arm','Upper back','Left chest','Right chest','Stomach','Lower back'];
let wardrobeViewer=null,wardrobeGroup=0,wardrobeTattoo=false,wardrobeAssets=null,wardrobeSpinning=false;
function disposeWardrobe(){wardrobeViewer?.dispose();wardrobeViewer=null;}
function equippedCloth(i){const m=save.read(2,CLOTH_MODEL[i],'u32'),t=save.read(2,CLOTH_TEXTURE[i],'u32');return SAVE_DATA.clothes[i].find(x=>x.model===m&&x.texture===t)||SAVE_DATA.clothes[i].find(x=>x.texture===t);}
function wardrobeOutfit(){
  const keys=['torso','head','legs','feet','necklace','watch','glasses','hat','extra1'];const defaults=['torso','head','legs','feet',null,null,null,null,null];const out={};
  keys.forEach((key,i)=>{const m=save.read(2,CLOTH_MODEL[i],'u32'),t=save.read(2,CLOTH_TEXTURE[i],'u32');out[key]={model:m?(SAVE_DATA.modelNames[m]||'unrecognized-'+m.toString(16)):defaults[i],texture:t?(SAVE_DATA.textureNames[t]||'unrecognized-'+t.toString(16)):null};});
  const hands=save.read(2,0x1b4,'u32');out.hands={model:SAVE_DATA.modelNames[hands]||'hands',texture:null};return out;
}
function syncWardrobe(){
  const tats=SAVE_DATA.tattoos.map((items,i)=>items.find(x=>x.texture===save.read(2,0x1e4+i*4,'u32'))?.textureName).filter(Boolean);
  const status=$('#cj-status');
  wardrobeViewer?.update(wardrobeOutfit(),tats,save.read(16,0x54,'f32'),save.read(16,0x5c,'f32')).catch(e=>{if(status?.isConnected)status.textContent='Preview error: '+e.message;});
  const summary=$('#outfit-summary');if(summary)summary.innerHTML=CLOTH_NAMES.map((name,i)=>'<div><span>'+name+'</span><strong>'+esc(equippedCloth(i)?.label||'Unrecognized saved item')+'</strong></div>').join('');
  document.querySelectorAll('[data-wardrobe-select]').forEach(sel=>{const i=Number(sel.dataset.wardrobeSelect),isTat=sel.dataset.tattoo==='true',items=isTat?SAVE_DATA.tattoos[i]:SAVE_DATA.clothes[i];sel.value=items.findIndex(x=>x.texture===save.read(2,isTat?0x1e4+i*4:CLOTH_TEXTURE[i],'u32'));});
  const chosen=save.read(2,wardrobeTattoo?0x1e4+wardrobeGroup*4:CLOTH_TEXTURE[wardrobeGroup],'u32');
  document.querySelectorAll('.garment[data-texture]').forEach(b=>{const selected=Number(b.dataset.texture)===chosen;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  const special=equippedCloth(8);const hint=$('#wardrobe-hint');if(hint)hint.textContent=special?.modelName?'A special outfit is equipped. It can cover normal clothes; choose “No” under Special outfit to reveal them.':wardrobeViewer?'Changes apply instantly to CJ’s preview and your loaded save. Download the edited save to use the outfit in GTA.':'Clothes apply to your loaded save even while the 3D preview is unavailable.';
}
function chooseCloth(tattoo,i,index){
  const c=(tattoo?SAVE_DATA.tattoos:SAVE_DATA.clothes)[i][index];if(!c)return;
  const label=(tattoo?TATTOO_NAMES:CLOTH_NAMES)[i]+': '+c.label;
  mutate(label,()=>{save.write(2,tattoo?0x1e4+i*4:CLOTH_TEXTURE[i],'u32',c.texture);if(!tattoo)save.write(2,CLOTH_MODEL[i],'u32',c.model);});
  syncWardrobe();
}
function fillGarments(){
  const groups=wardrobeTattoo?SAVE_DATA.tattoos:SAVE_DATA.clothes,names=wardrobeTattoo?TATTOO_NAMES:CLOTH_NAMES;
  const categories=$('#wardrobe-categories'),grid=$('#garment-grid');if(!categories||!grid)return;
  categories.replaceChildren();names.forEach((name,i)=>{const b=button(name,()=>{wardrobeGroup=i;fillGarments();});b.className='category'+(wardrobeGroup===i?' active':'');b.setAttribute('aria-pressed',String(wardrobeGroup===i));categories.append(b);});
  const title=$('#garment-title');title.textContent=names[wardrobeGroup];const toolbar=$('#garment-select');toolbar.replaceChildren();
  const label=document.createElement('label');label.htmlFor='appearance-current';label.className='sr-only';label.textContent='Choose '+names[wardrobeGroup];
  const select=document.createElement('select');select.id='appearance-current';select.dataset.wardrobeSelect=wardrobeGroup;select.dataset.tattoo=wardrobeTattoo;
  const unknown=new Option('Keep current saved item',-1);select.append(unknown);groups[wardrobeGroup].forEach((c,i)=>select.append(new Option(c.label,i)));
  select.onchange=()=>chooseCloth(wardrobeTattoo,wardrobeGroup,Number(select.value));toolbar.append(label,select);
  const query=$('#search').value.toLowerCase().trim();grid.replaceChildren();let count=0;
  groups[wardrobeGroup].forEach((c,i)=>{
    if(query&&!c.label.toLowerCase().includes(query)&&!names[wardrobeGroup].toLowerCase().includes(query))return;count++;
    const b=button(c.label,()=>chooseCloth(wardrobeTattoo,wardrobeGroup,i));b.textContent='';b.className='garment';b.dataset.texture=c.texture;
    const imageBox=document.createElement('span');imageBox.className='fabric';const dict=wardrobeAssets?.textures[c.textureName];const url=dict?Object.values(dict)[0]:null;
    if(url){const im=document.createElement('img');im.src=url;im.alt='';im.loading='lazy';imageBox.append(im);}else imageBox.textContent=wardrobeTattoo?'◌':(c.modelName?'CJ':'∅');
    const text=document.createElement('strong');text.textContent=c.label==='No'?'None':c.label;const check=document.createElement('span');check.className='garment-check';check.textContent='✓';b.append(imageBox,text,check);grid.append(b);
  });
  $('#garment-count').textContent=count+(count===1?' choice':' choices');if(!count)grid.innerHTML='<div class="empty">No matching items in this category.</div>';
  syncWardrobe();
}
function renderWardrobe(){
  $('#search').placeholder='Find clothes in this category…';
  const page=document.createElement('div');page.className='dressing-room';page.innerHTML=`
    <section class="studio card"><div class="studio-head"><div><span class="eyebrow">GROVE STREET DRESSING ROOM</span><h3>Carl Johnson</h3></div><span class="live-pill"><span class="dot"></span> LIVE</span></div>
    <div class="cj-stage" id="cj-stage"><div class="stage-loading" id="stage-loading">Preparing CJ’s original game models…</div></div>
    <div class="studio-controls"><button id="cj-front">Front</button><button id="cj-back">Back</button><button id="cj-side">Side</button><button id="cj-spin" aria-pressed="false">Auto rotate</button><button id="cj-zoom-in" aria-label="Zoom in">＋</button><button id="cj-zoom-out" aria-label="Zoom out">−</button></div>
    <p class="studio-help">Drag to rotate · scroll to zoom</p><p id="cj-status" role="status" aria-live="polite">Loading offline assets…</p>
    <button id="outfit-photo">↓ Save outfit picture</button>
    </section>
    <section class="wardrobe-panel"><div class="wardrobe-tabs"><button id="tab-clothes" class="active">Clothes & hair</button><button id="tab-tattoos">Tattoos</button></div>
    <div id="wardrobe-categories" class="wardrobe-categories" aria-label="Clothing categories"></div>
    <div class="garment-heading"><h3 id="garment-title"></h3><span id="garment-count"></span></div><div id="garment-select"></div>
    <p class="wardrobe-hint" id="wardrobe-hint"></p><div id="garment-grid" class="garment-grid"></div>
    <details class="outfit-details"><summary>Currently equipped outfit</summary><div id="outfit-summary"></div></details>
    <div class="body-stats card"><h3>Body shape</h3><p>Fat and muscle update the original normal, fat and ripped meshes. Preview uses a fitting pose; in-game animations and lighting differ.</p><div id="wardrobe-body"></div></div>
    </section>`;
  $('#content').append(page);
  const changeTab=tattoo=>{wardrobeTattoo=tattoo;wardrobeGroup=0;$('#search').value='';$('#tab-clothes').classList.toggle('active',!tattoo);$('#tab-tattoos').classList.toggle('active',tattoo);fillGarments();};
  $('#tab-clothes').onclick=()=>changeTab(false);$('#tab-tattoos').onclick=()=>changeTab(true);$('#tab-clothes').classList.toggle('active',!wardrobeTattoo);$('#tab-tattoos').classList.toggle('active',wardrobeTattoo);
  for(const id of [21,23])$('#wardrobe-body').append(field(save.stat(id)));
  for(const which of ['front','back','side'])$('#cj-'+which).onclick=()=>wardrobeViewer?.view(which);
  $('#cj-spin').onclick=()=>{wardrobeSpinning=!wardrobeSpinning;wardrobeViewer?.spin(wardrobeSpinning);$('#cj-spin').setAttribute('aria-pressed',String(wardrobeSpinning));};$('#cj-spin').setAttribute('aria-pressed',String(wardrobeSpinning));
  $('#cj-zoom-in').onclick=()=>wardrobeViewer?.zoom(-.35);$('#cj-zoom-out').onclick=()=>wardrobeViewer?.zoom(.35);
  $('#outfit-photo').onclick=()=>{if(!wardrobeViewer)return;const a=document.createElement('a');a.download='CJ-outfit.png';a.href=wardrobeViewer.snapshot();a.click();};
  const status=$('#cj-status'),stage=$('#cj-stage');
  fillGarments();
  try{wardrobeViewer=createCJViewer(stage,status);wardrobeViewer.spin(wardrobeSpinning);}catch(e){$('#stage-loading').textContent='3D preview requires WebGL. Clothing edits still work.';status.textContent=e.message;$('#outfit-photo').disabled=true;return;}
  loadCJAssets().then(assets=>{if(!stage.isConnected)return;wardrobeAssets=assets;$('#stage-loading')?.remove();fillGarments();}).catch(e=>{if(stage.isConnected)status.textContent='Asset load failed: '+e.message;});
}
