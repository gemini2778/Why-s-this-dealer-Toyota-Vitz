type PlaybackState='paused'|'loading'|'playing'|'error';

export function initBgm(signal:AbortSignal){
  const audio=document.querySelector<HTMLAudioElement>('#bgm-audio')!;
  const toggle=document.querySelector<HTMLButtonElement>('#bgm-toggle')!;
  const icon=document.querySelector<SVGPathElement>('#bgm-icon')!;
  const label=document.querySelector<HTMLElement>('#bgm-label')!;
  const status=document.querySelector<HTMLElement>('#bgm-status')!;
  const volume=document.querySelector<HTMLInputElement>('#bgm-volume')!;
  const value=document.querySelector<HTMLOutputElement>('#bgm-volume-value')!;
  let state:PlaybackState='paused',hasPlayed=false,failed=false,request=0;

  function render(next:PlaybackState=state){
    state=next;
    const active=next==='playing'||next==='loading';
    toggle.setAttribute('aria-pressed',String(active));
    toggle.setAttribute('aria-busy',String(next==='loading'));
    toggle.setAttribute('aria-label',active?'暂停背景音乐':'播放背景音乐');
    label.textContent=active?'暂停':'播放';
    icon.setAttribute('d',active?'M4 3h3v12H4zm7 0h3v12h-3z':'M5 2.5 15 9 5 15.5z');
    status.textContent=next==='error'?'播放失败，点击重试':`Niko B · ${next==='loading'?'正在载入':next==='playing'?(audio.volume===0?'静音播放':'正在播放'):hasPlayed?'已暂停':'点击播放'}`;
    toggle.closest<HTMLElement>('.bgm-player')!.dataset.state=next;
  }
  function updateVolume(){
    const percent=Math.round(audio.volume*100);
    volume.value=String(percent);value.textContent=`${percent}%`;
    volume.style.setProperty('--fill',`${percent}%`);render();
  }

  audio.volume=Number(volume.value)/100;
  updateVolume();
  toggle.addEventListener('click',async()=>{
    const ticket=++request;
    if(!audio.paused){audio.pause();render('paused');return;}
    failed=false;
    if(audio.error)audio.load();
    render('loading');
    try {await audio.play();}
    catch {
      // Ignore a stale play promise after a newer pause/play or hot reload.
      if(signal.aborted||ticket!==request)return;
      failed=true;audio.pause();render('error');
    }
  },{signal});
  audio.addEventListener('play',()=>render('loading'),{signal});
  audio.addEventListener('playing',()=>{hasPlayed=true;failed=false;render('playing');},{signal});
  audio.addEventListener('waiting',()=>{if(!audio.paused)render('loading');},{signal});
  audio.addEventListener('pause',()=>render(failed?'error':'paused'),{signal});
  audio.addEventListener('error',()=>{failed=true;render('error');},{signal});
  audio.addEventListener('volumechange',updateVolume,{signal});
  volume.addEventListener('input',()=>{audio.volume=Number(volume.value)/100;updateVolume();},{signal});
  signal.addEventListener('abort',()=>{++request;audio.pause();},{once:true});
}
