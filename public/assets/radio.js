'use strict';
(() => {
  const panel = document.querySelector('#radio'), $ = selector => panel.querySelector(selector);
  const audio = $('audio'), stationList = $('#station-list');
  const heroRadio = document.querySelector('#hero-radio');
  const status = message => { $('#radio-status').textContent = message; };
  const art = name => 'assets/radio/' + name + '.png';
  const stationButtons = [], positions = new Map(), offIndex = SA_STATIONS.length-1;
  const pick = count => Math.floor(Math.random() * count);
  const playableStations = SA_STATIONS.flatMap((entry, index) => entry[4].length ? [index] : []);
  let station = playableStations[pick(playableStations.length)];
  let track = pick(SA_STATIONS[station][4].length), url, revision = 0, playWanted = false, awaitingGesture = false;
  const startVolume = 0.10;
  audio.volume = startVolume;
  const quietAutoPlay = audio.volume <= startVolume + 0.001;
  const playlist = () => SA_STATIONS[station][4];
  const playingMessage = () => 'Playing track '+(track+1)+' of '+playlist().length+'.';
  function syncButtons() {
    const playing = !audio.paused && !!url;
    $('#radio-play').textContent = playing ? '❚❚ Pause' : '▶ Play';
    heroRadio.textContent = playing ? '❚❚ Pause radio' : '♪ Turn on radio';
    panel.classList.toggle('radio-playing', playing);
  }
  const move = (value, max) => (value % max + max) % max;
  const time = seconds => Number.isFinite(seconds) ? Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0') : '0:00';
  function stop() {
    revision++;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    url = undefined;
    drawTime();
  }
  function drawTime() {
    $('#radio-clock').textContent = time(audio.currentTime)+' / '+time(audio.duration);
    $('#radio-seek').disabled = !Number.isFinite(audio.duration);
    $('#radio-seek').value = Number.isFinite(audio.duration) ? audio.currentTime/audio.duration*1000 : 0;
  }
  function draw() {
    const [name, genre, icon] = SA_STATIONS[station], tracks = playlist();
    $('#radio-name').textContent = name;
    $('#radio-genre').textContent = genre;
    $('#radio-index').textContent = station === offIndex ? 'OFF' : String(station+1).padStart(2,'0')+' / '+String(offIndex).padStart(2,'0');
    const logo = $('#radio-logo'); logo.hidden = !icon; if(icon)logo.src = art(icon);
    $('#radio-silence').hidden = !!icon;
    const list = $('#radio-tracks');
    list.replaceChildren();
    tracks.forEach((_,i) => list.add(new Option((station === 10?'Segment ':'Track ')+String(i+1).padStart(2,'0'),i)));
    list.disabled = !tracks.length;
    if(tracks.length)list.value=String(track);
    $('#radio-play').disabled = !tracks.length;
    $('#radio-prev-track').disabled = tracks.length<2;
    $('#radio-next-track').disabled = tracks.length<2;
    stationButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===station)));
    syncButtons();
  }
  function description(){
    const tracks=playlist();
    if(station===offIndex)return 'Radio is off.';
    return 'Original PC audio · '+tracks.length+' tracks available.';
  }
  async function start() {
    const list=playlist();if(!list.length)return;
    stop();
    playWanted=true;
    const current=revision,item=list[track], channel=SA_STATIONS[station];
    status('Tuning '+channel[0]+'…');
    try {
      url='assets/radio/tracks/'+channel[3]+'/'+item+'.ogg';
      audio.src=url;
      await audio.play();
      if(current===revision){awaitingGesture=false;status(playingMessage());syncButtons();}
    } catch(e) {
      if(current!==revision)return;
      playWanted=false;
      awaitingGesture=e.name==='NotAllowedError';
      status(awaitingGesture?'Your browser blocked autoplay. Turn on the radio or choose a station to listen.':e.name==='NotSupportedError'?'Could not play this track. Check the connection or try a browser that supports Ogg Vorbis.':e.message);
      syncButtons();
    }
  }
  function tune(next) {
    const resume=playWanted || awaitingGesture || station===offIndex;
    stop();
    positions.set(station,track);
    station=move(next,SA_STATIONS.length);
    track=Math.min(positions.get(station)||0,Math.max(0,playlist().length-1));
    draw();status(description());
    if(station===offIndex){playWanted=false;awaitingGesture=false;}
    else if(resume&&playlist().length)start();
  }
  function selectTrack(next, autoplay=playWanted) {
    const list=playlist();if(!list.length)return;
    stop();track=move(next,list.length);draw();status(description());
    if(autoplay)start();
  }
  SA_STATIONS.forEach(([name,genre,icon],i)=>{
    const b=document.createElement('button');
    b.type='button';b.className='station-chip';b.title=genre;
    if(icon){const img=document.createElement('img');img.alt='';img.src=art(icon);img.width=60;img.height=60;b.append(img);}
    else {const glyph=document.createElement('i');glyph.textContent='⏻';glyph.setAttribute('aria-hidden','true');b.append(glyph);}
    const label=document.createElement('span');label.textContent=name;b.append(label);
    b.onclick=()=>tune(i);
    b.onkeydown=e=>{
      if (!['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return;
      e.preventDefault();
      const n=e.key==='Home'?0:e.key==='End'?offIndex:move(i+(e.key==='ArrowRight'?1:-1),SA_STATIONS.length);
      tune(n);stationButtons[n].focus();
    };
    stationButtons.push(b);stationList.append(b);
  });
  $('#radio-prev').onclick=()=>tune(station-1);
  $('#radio-next').onclick=()=>tune(station+1);
  $('#radio-prev-track').onclick=()=>selectTrack(track-1);
  $('#radio-next-track').onclick=()=>selectTrack(track+1);
  $('#radio-tracks').onchange=e=>selectTrack(Number(e.target.value));
  function togglePlayback(){
    if(!audio.paused || (playWanted&&!url)){
      playWanted=false;awaitingGesture=false;
      if(!url)stop();else audio.pause();
    }else{
      if(station===offIndex){tune(playableStations[pick(playableStations.length)]);return;}
      playWanted=true;
      const current=revision;
      if(url)audio.play().then(()=>{if(current===revision){awaitingGesture=false;status(playingMessage());syncButtons();}}).catch(()=>{if(current===revision)start();});else start();
    }
  }
  $('#radio-play').onclick=heroRadio.onclick=togglePlayback;
  heroRadio.hidden=false;
  document.querySelector('#radio-nav').onclick=()=>{if(awaitingGesture)togglePlayback();};
  document.querySelector('#home-logo').addEventListener('click', event => {
    if(!awaitingGesture || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    event.preventDefault();
    togglePlayback();
  });
  audio.onplay=audio.onpause=syncButtons;
  audio.onended=()=>selectTrack(track+1,true);
  audio.ontimeupdate=audio.onloadedmetadata=drawTime;
  $('#radio-seek').oninput=e=>{if(Number.isFinite(audio.duration))audio.currentTime=audio.duration*e.target.value/1000;};
  $('#radio-volume').oninput=e=>{audio.volume=e.target.value/100;};
  draw();drawTime();status(description());
  if(quietAutoPlay)start();
  else status('This browser controls volume at the device level. Turn on radio when you’re ready to listen.');
})();
