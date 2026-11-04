import './style.css';
import { World, Portraits } from './world.js';
import { ENEMY_TYPES } from './pixel-art.js';
import { terrainHeight } from './environment.js';

const paths={leaf:'M20 4c-9-2-17 2-15 10 2 7 14 6 15-10ZM5 21 16 10',play:'m9 5 11 7-11 7Z',book:'M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Zm0 0v15',spark:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z',trophy:'M8 3h8v7a4 4 0 0 1-8 0Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 1h8',settings:'m9 3-1 3-3 1-2 3 2 2v3l3 1 1 3h5l1-3 3-1 2-3-2-2V9l-3-1-1-3Zm7 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0',help:'M9.1 8a3 3 0 0 1 5.8 1c0 2-3 2-3 4m.1 3h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',arrow:'M4 12h16m-6-6 6 6-6 6',chevron:'m9 5 7 7-7 7',check:'m5 12 4 4L19 6',close:'m6 6 12 12M6 18 18 6',volume:'m11 4-6 5H2v6h3l6 5Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',mute:'m11 4-6 5H2v6h3l6 5Zm5 5 6 6m0-6-6 6',expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18',coin:'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-4v8m-2-6 2-2 2 2m-4 4 2 2 2-2',diamond:'m12 3 8 9-8 9-8-9Z',shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z',heart:'M20 5c-4-4-8 1-8 1S8 1 4 5c-5 5 8 15 8 15S25 10 20 5Z',bolt:'m13 2-9 12h7l-1 8 10-13h-7Z',sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-4-11v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',moon:'M21 13A9 9 0 0 1 11 3 9 9 0 1 0 21 13',clock:'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0',pause:'M8 5v14M16 5v14',home:'m3 10 9-7 9 7v11h-7v-7h-4v7H3Z',flag:'M5 21V3c5-4 9 4 14 0v10c-5 4-9-4-14 0',keyboard:'M3 6h18v13H3Zm3 4h1m3 0h1m3 0h1m3 0h.1M6 13h1m3 0h1m3 0h1m3 0h.1M8 16h8',reset:'M3 10a9 9 0 1 1 1 8M3 4v6h6',flower:'M12 8c-7-11-13 2-4 4-11 7 2 13 4 4 7 11 13-2 4-4 11-7-2-13-4-4Zm3 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0',mountain:'m2 20 7-15 4 8 3-5 6 12Zm4-8 3 2 3-2',infinity:'M12 12C4 0-2 17 6 17c3 0 4-3 6-5s3-5 6-5c8 0 2 17-6 5',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-3a8 8 0 0 1 16 0v3',download:'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4'};
const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.leaf}"/></svg>`;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const heroes=[
  {name:'모루',en:'Moru',role:'이끼 수호자',type:'숲',color:'green',desc:'숲의 기억을 품은 작은 나무 정령. 가까운 그림자 모두를 새싹 파동으로 밀어내요.',skill:'새싹 파동',ability:'초록의 숨결',abilityDesc:'주변 적에게 파동을 보내고 체력을 24 회복해요.',passive:'주변 범위 공격 · 2초마다 체력 1 회복',hp:120,attack:20,speed:4.4},
  {name:'루미',en:'Lumi',role:'빛의 길잡이',type:'빛',color:'gold',desc:'잃어버린 길을 비추는 반딧불 정령. 두 적에게 빛의 화살을 동시에 쏘아요.',skill:'반딧불 화살',ability:'별빛 쏟아짐',abilityDesc:'눈부신 별빛으로 주변 적에게 피해 130을 줘요.',passive:'동시 다중 사격 · 성장할 때마다 표적 +1',hp:90,attack:25,speed:5.2},
  {name:'도토',en:'Doto',role:'버섯 방랑자',type:'대지',color:'orange',desc:'도토리 숲에서 온 씩씩한 버섯 정령. 터지는 도토리로 모여 있는 그림자를 공격해요.',skill:'도토리 탄환',ability:'단단한 약속',abilityDesc:'주변 적에게 충격을 주고 3초간 무적이 돼요.',passive:'폭발 범위 공격 · 성장할 때마다 폭발 확대',hp:160,attack:26,speed:3.9},
];
const SAVE_KEY='mossbound.save.v1';
const defaults=()=>({coins:0,selected:0,map:0,mode:'classic',runs:[],upgrades:{power:0,vitality:0,speed:0},sound:true,quality:'high'});
let save=defaults(),storageAvailable=true;
try{
  const parsed=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
  if(parsed&&typeof parsed==='object'){
    save={...save,...parsed};
    save.coins=Math.max(0,Number(save.coins)||0);save.selected=[0,1,2].includes(save.selected)?save.selected:0;
    save.map=save.map===1?1:0;save.mode=save.mode==='endless'?'endless':'classic';
    save.runs=Array.isArray(save.runs)?save.runs.slice(0,30):[];
    save.upgrades=Object.fromEntries(['power','vitality','speed'].map(k=>[k,Math.min(5,Math.max(0,Math.floor(Number(save.upgrades?.[k])||0)))]));
  }
}catch{storageAvailable=false;}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch{storageAvailable=false;}}
const fmtTime=s=>`${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`;
let state='lobby',world,portraits=[],enemyPortraits={},modalType=null,lastFocus=null,audio;

$('#app').innerHTML=`
<div class="app-shell">
  <aside class="sidebar">
    <a class="brand" href="#" aria-label="MOSSBOUND 홈"><span class="brand-mark"><svg viewBox="0 0 40 40" fill="none"><path d="M8 29V17c0-10 12-10 12 0v12m0-10c0-10 12-10 12 0v10" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M16 8c6-8 12-7 13-5-2 7-8 8-13 5" fill="currentColor"/></svg></span><span>MOSSBOUND<small>숲의 수호자</small></span></a>
    <div class="sidebar-section">나의 모험</div>
    <nav aria-label="주 메뉴">
      <button class="nav-item active" data-nav="play">${icon('play')}<span>모험하기</span><span class="nav-dot"></span></button>
      <button class="nav-item" data-nav="collection">${icon('book')}<span>정령 도감</span><span class="nav-count">3</span></button>
      <button class="nav-item" data-nav="upgrades">${icon('spark')}<span>성장 연구소</span></button>
      <button class="nav-item" data-nav="records">${icon('trophy')}<span>모험 기록</span></button>
    </nav>
    <div class="field-note"><span class="note-illustration">${icon('leaf')}</span><p>숲은 작은 용기를<br>기억하고 있어요.</p><span>오늘도, 당신만의 모험을.</span></div>
    <div class="sidebar-bottom">
      <button class="nav-item" data-nav="settings">${icon('settings')}<span>설정</span></button>
      <button class="nav-item" data-nav="help">${icon('help')}<span>플레이 가이드</span>${icon('chevron')}</button>
      <div class="sidebar-version"><span class="status-dot"></span>오리지널 HD-2D 서바이버<span>v1.1</span></div>
    </div>
  </aside>
  <div class="main-shell">
    <header class="topbar">
      <div class="breadcrumb">모험하기 ${icon('chevron')}<span>정령의 숲</span></div>
      <div class="topbar-actions"><span class="currency" title="모험으로 얻는 숲의 조각">${icon('diamond')}<b id="coins">${save.coins}</b><span>숲의 조각</span></span><span class="top-divider"></span><button class="icon-button sound-button" aria-label="${save.sound?'소리 끄기':'소리 켜기'}">${icon(save.sound?'volume':'mute')}</button><button class="icon-button" id="fullscreen" aria-label="전체 화면">${icon('expand')}</button><button class="profile-button" data-nav="records"><span class="profile-avatar">${icon('user')}</span><span>숲의 여행자<small>기기에 저장되는 모험</small></span>${icon('chevron')}</button></div>
    </header>
    <main class="lobby" id="lobby">
      <div class="lobby-title"><div><div class="season-label"><span class="status-dot"></span>숲이 깨어나는 계절</div><h1>작은 정령과, <br>커다란 모험.</h1><p>당신의 이야기가 시작되는 곳, 정령의 숲.</p></div><button class="text-button" data-nav="help">처음 오셨나요? ${icon('help')}</button></div>
      <div class="adventure-layout">
        <section class="world-stage" aria-label="물레방아 마을 HD-2D 미리보기">
          <div class="scene-caption"><span>${icon('leaf')} MILLBROOK VILLAGE</span><small>물길을 따라 펼쳐지는 정령의 마을</small></div>
          <div id="world-container"></div><button class="scenery-toggle" id="scenery-toggle" aria-label="풍경 크게 보기">${icon('expand')}<span>풍경 크게 보기</span></button><span class="scene-drag-hint">드래그해서 둘러보세요</span>
          <div class="world-badge">${icon('sun')}<span id="world-weather">햇살 좋은 오후</span></div>
          <div class="spirit-label"><span class="tiny-spark">✦</span><b id="spirit-label-name">${heroes[save.selected].name}</b><span>오늘도 함께할 준비 완료!</span></div>
          <div class="world-bottom"><span>${icon('shield')}당신을 기다리는 오리지널 세계</span><span>HD-2D · 픽셀과 빛의 모험</span></div>
        </section>
        <aside class="expedition-panel">
          <div class="panel-heading"><span class="heading-icon">${icon('flag')}</span><div><h2>다음 모험</h2><p>작은 발걸음, 새로운 발견</p></div></div>
          <div class="field-label">모험 모드</div>
          <div class="mode-switch" role="group" aria-label="모험 모드"><button data-mode="classic" class="${save.mode==='classic'?'selected':''}">${icon('leaf')}스토리</button><button data-mode="endless" class="${save.mode==='endless'?'selected':''}">${icon('infinity')}무한 생존</button></div>
          <p class="mode-description" id="mode-description">${save.mode==='classic'?'3분 생존 후 가시왕을 물리치세요':'시간의 끝까지, 나만의 한계에 도전하세요'}</p>
          <div class="field-label map-label">모험 지역 <span>2개의 발견</span></div>
          <button class="map-card forest ${save.map===0?'selected':''}" data-map="0"><div class="map-scenery"><i></i><i></i><i></i><i></i><span class="map-sun"></span></div><span class="map-text"><b>속삭임의 숲</b><small>모든 모험의 시작</small></span><span class="map-check">${icon('check')}</span></button>
          <button class="map-card moonwood ${save.map===1?'selected':''}" data-map="1"><div class="map-scenery"><i></i><i></i><i></i><i></i><span class="map-sun"></span></div><span class="map-text"><b>달빛 정원</b><small>고요한 밤의 탐험</small></span><span class="map-check">${icon('check')}</span></button>
          <div class="expedition-meta"><span>${icon('clock')}<span id="duration-label">${save.mode==='classic'?'3분 + 보스전':'시간 제한 없음'}</span></span><span>${icon('user')}싱글 플레이</span></div>
          <button class="start-button" id="start-game">${icon('play')}<span>모험 시작하기</span>${icon('arrow')}</button>
          <div class="start-hint">설치 없이, 지금 바로 떠나요</div>
          <div class="daily-goal"><span class="goal-icon">${icon('flower')}</span><div><small>우리의 첫 번째 약속</small><b id="quest-title">${save.runs.length?'숲에 남긴 발자국':'첫 모험을 시작해 보세요'}</b><p id="quest-status">${save.runs.length?`${save.runs.length}번의 모험이 쌓였어요`:'작은 용기가 숲을 바꿀 거예요'}</p></div>${icon(save.runs.length?'check':'chevron')}</div>
        </aside>
      </div>
      <section class="companions-section"><div class="section-heading"><div><h2>함께할 정령</h2><span>오늘은 누구와 떠나볼까요?</span></div><button class="text-button" data-nav="bestiary">그림자 도감 ${icon('arrow')}</button></div><div class="companion-grid">${heroes.map((h,i)=>`<button class="companion-card ${h.color} ${save.selected===i?'selected':''}" data-hero="${i}" aria-pressed="${save.selected===i}"><div class="portrait-wrap"><img class="portrait" src="/favicon.svg" data-portrait="${i}" alt="${h.name}, ${h.role}"/><span class="portrait-shadow"></span></div><div class="companion-info"><small>${h.role}</small><h3>${h.name}<span>${h.en}</span></h3><span class="element-tag">${icon(i===0?'leaf':i===1?'sun':'mountain')}${h.type}</span></div><span class="hero-check">${icon('check')}</span></button>`).join('')}</div></section>
      <footer class="lobby-footer"><span>${icon('leaf')}당신의 속도로, 당신만의 모험을.</span><span>모든 캐릭터와 세계는 MOSSBOUND의 오리지널 창작물입니다.</span><button class="text-button" id="about-button">게임 소개 ${icon('chevron')}</button></footer>
    </main>
    <section class="game-screen" id="game-screen" hidden aria-label="서바이벌 게임">
      <div class="game-hud"><div class="player-status"><img id="hud-portrait" src="/favicon.svg" alt="선택한 정령"/><div><div class="hud-name"><b id="hud-name">모루</b><span id="hud-level">Lv. 1</span></div><div class="health-track"><div id="health-fill"></div><span id="health-text">120 / 120</span></div></div></div><div class="game-timer"><small id="hud-map">속삭임의 숲</small><b id="timer">00:00</b><span id="kill-count">0 처치</span></div><button class="pause-button" id="pause-game" aria-label="일시 정지">${icon('pause')}<kbd>Esc</kbd></button></div>
      <aside class="minimap" aria-label="주변 지도"><span>물레방아 마을 <b>N</b></span><canvas id="minimap" width="160" height="160" aria-label="플레이어와 그림자 위치"></canvas><small id="map-location">마을 광장</small></aside><div class="xp-track"><div id="xp-fill"></div></div><div class="wave-label" id="wave-label">숲의 속삭임에 귀 기울여 보세요</div>
      <div class="boss-status" id="boss-status" hidden><div><span>숲을 뒤덮은 그림자</span><b id="boss-name">가시왕 그루몽</b></div><div class="boss-health"><i id="boss-health-fill"></i></div></div>
      <div class="growth-notice" id="growth-notice" role="status" hidden></div>
      <div class="game-bottom"><div class="controls-legend"><span><kbd>W A S D</kbd> 이동</span><span><kbd>Space</kbd> 대시</span><span>${icon('spark')} 자동 공격</span></div><div class="ability-buttons"><button id="dash-button"><span>${icon('bolt')}</span><b>대시</b><kbd>Space</kbd><small id="dash-cooldown">준비 완료</small></button><button id="ultimate-button"><span>${icon('flower')}</span><b id="ability-name">초록의 숨결</b><kbd>R</kbd><small id="ultimate-cooldown">준비 완료</small></button></div></div>
      <div class="joystick" id="joystick" aria-label="터치 이동 조이스틱"><div class="joystick-knob"></div></div>
    </section>
  </div>
</div>
<div class="modal-overlay" id="modal-overlay" hidden><section class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"></section></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<div class="loading-screen" id="loading"><span class="loading-leaf">${icon('leaf')}</span><b>숲을 깨우고 있어요</b><span>작은 모험을 준비하는 중</span></div>`;

try{
  const portraitRenderer=new Portraits();portraits=heroes.map((_,i)=>portraitRenderer.image(i));for(const id of [...ENEMY_TYPES.map(e=>e.id),'boss'])enemyPortraits[id]=portraitRenderer.image(id);portraitRenderer.dispose();
  $$('[data-portrait]').forEach(el=>el.src=portraits[Number(el.dataset.portrait)]);
  world=new World($('#world-container'),updateHUD,gameEvent);world.select(save.selected);world.setMap(save.map);
  $('#loading').remove();
}catch(error){
  console.error(error);$('#loading').innerHTML=`${icon('leaf')}<b>3D 숲을 열 수 없어요</b><p>브라우저의 하드웨어 가속을 켜고 다시 시도해 주세요.</p><button class="primary-button" onclick="location.reload()">다시 시도</button>`;
}

function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3200);}
function sound(type){
  if(!save.sound)return;
  try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();
    const o=audio.createOscillator(),gain=audio.createGain();o.connect(gain);gain.connect(audio.destination);
    const f={click:520,attack:340,dash:220,ultimate:760,levelup:880,damage:130}[type]||520;
    o.type=type==='damage'?'triangle':'sine';o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(type==='levelup'?1320:f*.55,audio.currentTime+.12);
    gain.gain.setValueAtTime(type==='attack'?.012:.045,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);o.start();o.stop(audio.currentTime+.17);
  }catch{}
}
function selectHero(i){save.selected=i;persist();world?.select(i);$$('[data-hero]').forEach(b=>{const selected=Number(b.dataset.hero)===i;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});$('#spirit-label-name').textContent=heroes[i].name;sound('click');}
$$('[data-hero]').forEach(b=>b.addEventListener('click',()=>selectHero(Number(b.dataset.hero))));
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>{save.mode=b.dataset.mode;persist();$$('[data-mode]').forEach(el=>el.classList.toggle('selected',el===b));$('#mode-description').textContent=save.mode==='classic'?'3분 생존 후 가시왕을 물리치세요':'시간의 끝까지, 나만의 한계에 도전하세요';$('#duration-label').textContent=save.mode==='classic'?'3분 + 보스전':'시간 제한 없음';sound('click');}));
$$('[data-map]').forEach(b=>b.addEventListener('click',()=>{save.map=Number(b.dataset.map);persist();$$('[data-map]').forEach(el=>el.classList.toggle('selected',el===b));world?.setMap(save.map);$('.world-stage').classList.toggle('night',save.map===1);$('#world-weather').textContent=save.map?'고요한 달빛 아래':'햇살 좋은 오후';sound('click');}));
if(save.map)$('#world-weather').textContent='고요한 달빛 아래';
$('.world-stage').classList.toggle('night',save.map===1);
$$('[data-nav]').forEach(b=>b.addEventListener('click',()=>{sound('click');const target=b.dataset.nav;if(target==='play'){closeModal();return;}openPanel(target);}));
$('.brand').addEventListener('click',e=>{e.preventDefault();if(state==='lobby')closeModal();});
$('#about-button').addEventListener('click',()=>openPanel('about'));
function syncSound(){ $$('.sound-button').forEach(b=>{b.innerHTML=icon(save.sound?'volume':'mute');b.setAttribute('aria-label',save.sound?'소리 끄기':'소리 켜기');});}
$$('.sound-button').forEach(b=>b.addEventListener('click',()=>{save.sound=!save.sound;persist();syncSound();if(save.sound)sound('click');toast(save.sound?'숲의 소리를 켰어요':'소리를 껐어요');}));
$('#scenery-toggle').addEventListener('click',()=>{const expanded=document.body.classList.toggle('scenery-expanded');$('#scenery-toggle').setAttribute('aria-label',expanded?'풍경 닫기':'풍경 크게 보기');$('#scenery-toggle').innerHTML=icon(expanded?'close':'expand')+`<span>${expanded?'돌아가기':'풍경 크게 보기'}</span>`;world?.resize();});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('이 브라우저에서는 전체 화면을 사용할 수 없어요.');}});

function showModal(type,content,locked=false){
  if($('#modal-overlay').hidden)lastFocus=document.activeElement;
  modalType=type;$('#modal').className=`modal modal-${type}`;$('#modal').innerHTML=`${!locked?`<button class="modal-close icon-button" aria-label="닫기">${icon('close')}</button>`:''}${content}`;$('#modal-overlay').hidden=false;
  $('.modal-close')?.addEventListener('click',()=>{if(state==='game'&&world?.paused&&type==='pause')resume();else closeModal();});
  $('#modal').focus();
}
function closeModal(){if(modalType==='levelup'||modalType==='result')return;$('#modal-overlay').hidden=true;modalType=null;lastFocus?.focus();}
$('#modal-overlay').addEventListener('click',e=>{if(e.target===e.currentTarget&&state==='lobby')closeModal();});
document.addEventListener('keydown',e=>{
  if(e.code==='Escape'&&!e.repeat){if(document.body.classList.contains('scenery-expanded')){$('#scenery-toggle').click();return;}if(state==='game'){if(modalType==='levelup'||modalType==='result')return;if(modalType==='quit')pause();else if(world.paused)resume();else pause();}else closeModal();}
  if(e.key==='Tab'&&!$('#modal-overlay').hidden){const els=$$('#modal button:not([disabled]),#modal input,#modal select,#modal a[href]');if(!els.length){e.preventDefault();return;}const first=els[0],last=els.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('#modal'))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===$('#modal'))){e.preventDefault();first.focus();}}
  if(modalType==='levelup'&&['Digit1','Digit2','Digit3'].includes(e.code))$$('[data-upgrade-choice]')[Number(e.code.at(-1))-1]?.click();
});

function openPanel(type){
  const header=(glyph,title,sub)=>`<div class="modal-emblem">${icon(glyph)}</div><h2 id="modal-title">${title}</h2><p class="modal-subtitle">${sub}</p>`;
  const collectionTabs=`<div class="collection-tabs"><button data-nav="collection" class="${type==='collection'?'selected':''}">함께할 정령</button><button data-nav="bestiary" class="${type==='bestiary'?'selected':''}">그림자 도감 · 7종</button></div>`;
  if(type==='bestiary'){
    const descriptions={slime:'짧게 도약하며 다가와요. 착지 사이에 거리를 벌리세요.',moth:'좌우로 흔들며 빠르게 날아와요. 계속 이동하면 피할 수 있어요.',spore:'일정한 거리를 유지하며 포자 탄환을 쏘아요.',wisp:'주위를 맴돌며 빛의 탄환을 쏘아요. 원을 크게 돌며 피하세요.',beetle:'황금빛으로 예고한 뒤 직선으로 돌진해요. 옆으로 대시하세요.',golem:'느리지만 단단하고 강력해요. 다른 적과 함께 묶이지 않게 주의하세요.',boss:'큰 돌진과 원거리 탄환을 함께 사용해요. 궁극기를 아껴 두세요.'};
    const entries=[...ENEMY_TYPES,{id:'boss',name:'가시왕 그루몽',hp:400,damage:24,unlock:150}];
    showModal(type,header('book','숲의 그림자들','저마다 다른 움직임을 읽고, 나만의 방법으로 숲을 지켜 주세요.')+collectionTabs+`<div class="bestiary-grid">${entries.map(e=>`<article class="bestiary-card"><img src="${enemyPortraits[e.id]}" alt="${e.name} 픽셀 스프라이트"/><small>${e.id==='boss'?'숲의 보스':e.unlock?`${e.unlock}초부터 등장`:'첫 물결부터 등장'}</small><h3>${e.name}</h3><p>${descriptions[e.id]}</p><span>기본 체력 ${e.hp} · 피해 ${e.damage}</span></article>`).join('')}</div>`);
  }
  if(type==='collection'){
    showModal(type,header('book','작지만 특별한 친구들','레벨 4와 7에서 더 큰 정령으로 자라나요. 공격력과 체력이 함께 올라요.')+collectionTabs+`<div class="collection-grid">${heroes.map((h,i)=>`<article class="collection-card ${h.color}"><span class="collection-number">정령 00${i+1}</span><img src="${portraits[i]}" alt="${h.name}"/><span class="element-tag">${icon(i===0?'leaf':i===1?'sun':'mountain')}${h.type} · ${h.role}</span><h3>${h.name}<small>${h.en}</small></h3><p>${h.desc}</p><div class="spirit-stats"><span>${icon('heart')}<b>${h.hp}</b>체력</span><span>${icon('bolt')}<b>${h.attack}</b>공격</span><span>${icon('leaf')}<b>${h.speed}</b>이동</span></div><div class="passive-info"><b>${h.skill}</b><p>${h.passive}</p><b>${h.ability} · R</b><p>${h.abilityDesc}</p></div><button class="secondary-button" data-choose="${i}">${save.selected===i?'함께하는 중':'함께 모험하기'} ${icon(save.selected===i?'check':'arrow')}</button></article>`).join('')}</div>`);
    $$('[data-choose]').forEach(b=>b.addEventListener('click',()=>{selectHero(Number(b.dataset.choose));closeModal();toast(`${heroes[save.selected].name}와 함께 떠나요!`);}));
  }
  if(type==='upgrades'){
    const upgrades=[{key:'power',icon:'bolt',name:'깨어나는 힘',desc:'모든 정령의 공격력 +8%'},{key:'vitality',icon:'heart',name:'단단한 마음',desc:'모든 정령의 최대 체력 +12'},{key:'speed',icon:'leaf',name:'가벼운 발걸음',desc:'모든 정령의 이동 속도 +0.2'}];
    showModal(type,header('spark','조금씩, 더 단단하게','모험으로 모은 숲의 조각으로 영구 능력을 연구하세요.')+`<div class="research-balance">${icon('diamond')}보유한 숲의 조각 <b>${save.coins}</b></div><div class="research-list">${upgrades.map(u=>{const level=save.upgrades[u.key],cost=30+level*25;return `<div class="research-row"><span class="research-icon">${icon(u.icon)}</span><div><h3>${u.name}<span>Lv. ${level} / 5</span></h3><p>${u.desc}</p><div class="upgrade-dots">${Array.from({length:5},(_,i)=>`<i class="${i<level?'filled':''}"></i>`).join('')}</div></div><button class="secondary-button" data-research="${u.key}" ${level>=5||save.coins<cost?'disabled':''}>${level>=5?'연구 완료':`${icon('diamond')}${cost} 연구`}</button></div>`;}).join('')}</div><p class="footnote">처치한 그림자 수만큼 조각을 얻어요. 연구는 다음 모험부터 적용됩니다.</p>`);
    $$('[data-research]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.research,cost=30+save.upgrades[k]*25;if(save.coins<cost||save.upgrades[k]>=5)return;save.coins-=cost;save.upgrades[k]++;persist();$('#coins').textContent=save.coins;openPanel('upgrades');sound('levelup');toast('연구를 마쳤어요. 다음 모험이 더 든든해져요!');}));
  }
  if(type==='records'){
    const kills=save.runs.reduce((sum,r)=>sum+(Number(r.kills)||0),0),best=Math.max(0,...save.runs.map(r=>Number(r.time)||0));
    showModal(type,header('trophy','숲이 기억하는 발자국','작은 용기가 쌓여 당신만의 이야기가 됩니다.')+`<div class="record-stats"><div><b>${save.runs.length}</b><span>함께한 모험</span></div><div><b>${kills}</b><span>물리친 그림자</span></div><div><b>${fmtTime(best)}</b><span>가장 긴 발걸음</span></div></div>${save.runs.length?`<div class="record-table"><div class="record-table-head"><span>정령 / 지역</span><span>생존 시간</span><span>처치</span><span>결과</span></div>${save.runs.slice(0,10).map(r=>`<div class="record-row"><span><img src="${portraits[r.kind]||portraits[0]}" alt=""/><span><b>${heroes[r.kind]?.name||'모루'}</b><small>${r.map?'달빛 정원':'속삭임의 숲'}</small></span></span><b>${fmtTime(r.time)}</b><span>${r.kills}</span><span class="result-tag ${r.won?'won':''}">${r.won?'숲 지키기 성공':r.quit?'모험 마무리':'다음 기약'}</span></div>`).join('')}</div>`:`<div class="empty-record">${icon('flag')}<h3>아직 발자국이 없어요</h3><p>첫 모험을 떠나면 이곳에 기록이 남아요.</p><button class="primary-button" id="record-start">첫 모험 떠나기 ${icon('arrow')}</button></div>`}<p class="footnote">이 브라우저의 최근 30회 기록을 저장해요. 기록 화면에는 최근 10회를 표시합니다.</p>`);
    $('#record-start')?.addEventListener('click',()=>{closeModal();startGame();});
  }
  if(type==='settings'){
    showModal(type,header('settings','편안한 모험을 위해','나에게 맞는 숲의 분위기를 골라 보세요.')+`<div class="settings-row"><div><h3>효과음</h3><p>발걸음과 정령의 작은 소리</p></div><button id="sound-toggle" class="toggle ${save.sound?'on':''}" role="switch" aria-checked="${save.sound}" aria-label="효과음"><span></span></button></div><div class="settings-row"><div><h3>렌더링 품질</h3><p>가볍게: DOF·블룸·실시간 반사를 끄고 해상도를 낮춰요</p></div><select id="quality-select" aria-label="렌더링 품질"><option value="high" ${save.quality==='high'?'selected':''}>HD-2D 연출</option><option value="low" ${save.quality==='low'?'selected':''}>가볍게</option></select></div><div class="settings-row"><div><h3>모험 데이터</h3><p>${storageAvailable?'이 브라우저에 자동 저장되고 있어요':'브라우저 저장 공간에 접근할 수 없어요'}</p></div><span class="saved-indicator">${icon(storageAvailable?'check':'help')}${storageAvailable?'기기 저장':'저장 불가'}</span></div><div class="settings-data"><button class="secondary-button" id="export-save">${icon('download')}기록 내보내기</button><button class="danger-text" id="reset-save">모험 데이터 초기화</button></div>`);
    $('#sound-toggle').addEventListener('click',()=>{save.sound=!save.sound;persist();syncSound();openPanel('settings');sound('click');});
    $('#quality-select').addEventListener('change',e=>{save.quality=e.target.value;persist();applyQuality();toast('화면 품질을 변경했어요.');});
    $('#export-save').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(save,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mossbound-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
    $('#reset-save').addEventListener('click',()=>{showModal('reset',header('reset','첫 발걸음으로 돌아갈까요?','모든 기록, 숲의 조각, 연구가 이 기기에서 삭제됩니다.')+`<div class="modal-actions"><button class="secondary-button" id="cancel-reset">돌아가기</button><button class="danger-button" id="confirm-reset">모든 데이터 초기화</button></div>`);$('#cancel-reset').addEventListener('click',()=>openPanel('settings'));$('#confirm-reset').addEventListener('click',()=>{save=defaults();persist();location.reload();});});
  }
  if(type==='help')showModal(type,header('leaf','숲을 여행하는 방법','어렵지 않아요. 움직이고, 모으고, 함께 자라나요.')+`<div class="guide-list"><div><span>${icon('keyboard')}</span><div><h3>정령을 움직여 주세요</h3><p><kbd>W A S D</kbd> 또는 방향키로 이동해요. 모바일에서는 왼쪽 아래 조이스틱을 사용하세요.</p></div></div><div><span>${icon('spark')}</span><div><h3>공격은 정령에게 맡겨요</h3><p>가까운 그림자를 자동으로 공격해요. 그림자에 닿지 않도록 거리를 유지하세요.</p></div></div><div><span>${icon('diamond')}</span><div><h3>빛나는 씨앗으로 함께 성장해요</h3><p>적이 떨어뜨린 씨앗을 모으면 레벨이 올라요. 세 가지 강화 중 하나를 선택하세요.</p></div></div><div><span>${icon('bolt')}</span><div><h3>위기의 순간, 특별한 힘</h3><p><kbd>Space</kbd> 대시는 3초마다, <kbd>R</kbd> 고유 능력은 20초마다 사용할 수 있어요. <kbd>Esc</kbd>로 쉬어 갈 수 있어요.</p></div></div><div><span>${icon('flag')}</span><div><h3>3분 동안 숲을 지켜 주세요</h3><p>스토리 모드는 3분 생존하고 2분 30초에 나타나는 가시왕을 물리치면 성공! 무한 생존은 90초마다 보스가 나타나요. 레벨 4와 7에서는 정령이 성장해요. 조각은 영구 연구에 사용할 수 있어요.</p></div></div></div>`);
  if(type==='about')showModal(type,header('leaf','MOSSBOUND','숲의 수호자 · 오리지널 HD-2D 서바이버')+`<div class="about-content"><p>작은 정령의 용기가 숲에 드리운 그림자를 걷어냅니다. 모루, 루미, 도토와 함께 당신만의 짧고 특별한 모험을 떠나세요.</p><p>48×64 픽셀 캐릭터, 3D 마을과 지형, 효과음은 이 게임을 위해 새로 제작했습니다. 빛과 그림자, 수면 반사와 피사계 심도가 작은 세계를 완성해요. 모든 캐릭터는 오리지널 창작물입니다.</p><p>계정 없이 플레이하며 진행 상황은 현재 기기의 브라우저에 저장됩니다. 온라인 협동이나 전 세계 랭킹은 제공하지 않습니다.</p><div class="about-signature">${icon('leaf')}작은 정령과, 커다란 모험.</div></div>`);
  $$('#modal [data-nav]').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.nav)));
}
function applyQuality(){world?.setQuality(save.quality);}
applyQuality();

function startGame(){
  if(!world)return;if(document.body.classList.contains('scenery-expanded'))$('#scenery-toggle').click();state='game';$('#modal-overlay').hidden=true;modalType=null;document.body.classList.add('playing');$('#lobby').hidden=true;$('#game-screen').hidden=false;
  $('#game-screen').prepend($('#world-container'));$('#world-container').classList.add('game-world');
  $('#hud-portrait').src=portraits[save.selected];$('#hud-name').textContent=heroes[save.selected].name;$('#hud-map').textContent=save.map?'달빛 정원':'속삭임의 숲';$('#ability-name').textContent=heroes[save.selected].ability;
  world.start({kind:save.selected,map:save.map,mode:save.mode,bonuses:save.upgrades});world.resize();sound('click');
  $('#boss-status').hidden=true;$('#growth-notice').hidden=true;clearTimeout(gameEvent.growthTimer);
  $('#pause-game').focus();
}
$('#start-game').addEventListener('click',startGame);
function updateHUD(r){
  if(state!=='game')return;
  drawMinimap(r);
  $('#health-fill').style.width=`${Math.max(0,r.hp/r.maxHp*100)}%`;$('#health-fill').classList.toggle('low',r.hp/r.maxHp<.3);$('#health-text').textContent=`${Math.ceil(r.hp)} / ${r.maxHp}`;
  $('#hud-level').textContent=`Lv. ${r.level}${r.growth?' · '+(r.growth===1?'새싹 성장':'숲의 수호자'):''}`;$('#timer').textContent=fmtTime(r.time);$('#kill-count').textContent=`${r.kills} 처치 · ${r.enemies}마리`;
  $('#game-screen').classList.toggle('boss-active',!!r.boss);$('#boss-status').hidden=!r.boss;if(r.boss){$('#boss-name').textContent=r.boss.name;$('#boss-health-fill').style.width=`${Math.max(0,r.boss.hp/r.boss.maxHp*100)}%`;}
  $('#xp-fill').style.width=`${r.xp/r.nextXp*100}%`;
  const dash=Math.max(0,3-(r.time-r.dashAt)),ult=Math.max(0,20-(r.time-r.ultAt));
  $('#dash-cooldown').textContent=dash>0?`${dash.toFixed(1)}초`:'준비 완료';$('#ultimate-cooldown').textContent=ult>0?`${Math.ceil(ult)}초`:'준비 완료';
  $('#dash-button').disabled=dash>0;$('#ultimate-button').disabled=ult>0;
  $('#wave-label').textContent=r.time<6?'움직여 그림자를 피하세요 · 공격은 자동이에요':r.boss?'가시왕을 물리치고 숲의 빛을 되찾으세요':r.mode==='classic'&&r.time>=180?'가시왕을 물리치면 모험 성공!':r.mode==='endless'?`무한 물결 ${Math.floor(r.time/60)+1} · 다음 보스 ${90-Math.floor(r.time%90)}초 후`:r.time<60?'첫 번째 물결 · 작은 그림자들':r.time<120?'두 번째 물결 · 숲이 흔들려요':'마지막 물결 · 숲의 빛을 지켜 주세요';
}
function drawMinimap(r){
  const canvas=$('#minimap'),c=canvas.getContext('2d'),s=canvas.width,px=v=>(v+60)/120*s;
  drawMinimap.terrain??={};
  if(!drawMinimap.terrain[save.map]){const background=document.createElement('canvas');background.width=background.height=s;const brush=background.getContext('2d');for(let y=0;y<s;y+=4)for(let x=0;x<s;x+=4){const h=terrainHeight(x/s*120-60,y/s*120-60),band=Math.floor(Math.max(0,h)/1.5);brush.fillStyle=save.map?`hsl(${155+band*4} 15% ${34+band*5}%)`:`hsl(${78-band*3} 22% ${62-band*5}%)`;brush.fillRect(x,y,4,4);}drawMinimap.terrain[save.map]=background;}
  c.drawImage(drawMinimap.terrain[save.map],0,0);
  c.fillStyle=save.map?'#35525d':'#668e8b';c.fillRect(px(-14.6),0,px(-9.4)-px(-14.6),s);
  c.strokeStyle=save.map?'#8c9381':'#dbcea4';c.lineWidth=4;c.beginPath();c.moveTo(0,px(2));c.lineTo(s,px(2));c.moveTo(px(0),0);c.lineTo(px(0),s);c.stroke();
  for(const z of [2,-23,25]){c.fillStyle='#b58b61';c.fillRect(px(-16.5),px(z)-2,12,4);}
  c.fillStyle='#7e6754';for(const [x,z]of[[-19,-5],[4,-15],[16,-20],[-26,-17],[7,-36],[28,17]])c.fillRect(px(x)-3,px(z)-3,6,6);
  for(const e of r.enemyPositions||[]){c.fillStyle=e.boss?'#f4c46d':'#d28e88';c.beginPath();c.arc(px(e.x),px(e.z),e.boss?3:1.5,0,7);c.fill();}
  const p=r.position||{x:0,z:1};c.strokeStyle='#fff5c7';c.lineWidth=1;c.beginPath();c.arc(px(p.x),px(p.z),13,0,7);c.stroke();c.fillStyle='#fff5d3';c.beginPath();c.arc(px(p.x),px(p.z),3,0,7);c.fill();
  canvas.setAttribute('aria-label',`플레이어 위치 동쪽 ${Math.round(p.x)}m, 남쪽 ${Math.round(p.z)}m. 높이 ${Math.round(p.y||0)}m. 주변 그림자 ${(r.enemyPositions||[]).length}마리`);
  const location=p.x<-10?'물레방아 물길':p.z<-12?'높은 마을':p.z>16?'남쪽 고원':p.x>12?'동쪽 언덕':'마을 광장';$('#map-location').textContent=`${location} · ${Math.round(p.y||0)}m`;
}

function gameEvent(event,data){
  if(event==='horde'){toast(`그림자 무리가 몰려와요! 주변에 ${data.enemies}마리가 있어요.`);return;}
  if(event==='growth'){sound('levelup');$('#growth-notice').textContent=`${heroes[save.selected].name}, ${data.growth===1?'새싹 정령':'숲의 수호자'}로 성장! 공격력 +25% · 최대 체력 +20`;$('#growth-notice').hidden=false;clearTimeout(gameEvent.growthTimer);gameEvent.growthTimer=setTimeout(()=>$('#growth-notice').hidden=true,5000);return;}
  if(event==='boss'){sound('damage');toast('가시왕 그루몽이 나타났어요! R로 특별한 힘을 사용하세요.');return;}
  if(event==='boss-defeated'){sound('levelup');toast('가시왕을 물리쳤어요! 숲의 조각 +20 · 체력 +30');return;}
  if(event==='sound'){sound(data);return;}
  if(event==='pause'){pause();return;}
  if(event==='damage'){sound('damage');$('#game-screen').classList.add('damaged');setTimeout(()=>$('#game-screen').classList.remove('damaged'),180);return;}
  if(event==='levelup'){
    sound('levelup');const options=[{id:'power',icon:'bolt',title:'깨어나는 힘',description:'공격력 30% 증가'},{id:'haste',icon:'spark',title:'반짝이는 리듬',description:'공격 간격 17% 감소'},{id:data.hp/data.maxHp<.75?'heal':'speed',icon:data.hp/data.maxHp<.75?'heart':'leaf',title:data.hp/data.maxHp<.75?'숲의 보살핌':'바람의 발걸음',description:data.hp/data.maxHp<.75?'최대 체력 +20, 체력 50 회복':'이동 속도 13% 증가'}];
    showModal('levelup',`<div class="modal-emblem">${icon('spark')}</div><span class="level-label">Lv. ${data.level}</span><h2 id="modal-title">조금 더 자라났어요!</h2><p class="modal-subtitle">정령과 함께할 새로운 힘을 골라 주세요.</p><div class="levelup-options">${options.map((o,i)=>`<button data-upgrade-choice="${o.id}"><kbd>${i+1}</kbd><span>${icon(o.icon)}</span><h3>${o.title}</h3><p>${o.description}</p><small>선택하기 ${icon('arrow')}</small></button>`).join('')}</div>`,true);
    $$('[data-upgrade-choice]').forEach(b=>b.addEventListener('click',()=>{world.upgrade(b.dataset.upgradeChoice);$('#modal-overlay').hidden=true;modalType=null;sound('levelup');}));return;
  }
  if(event==='end')finishRun(data);
}
function pause(){if(state!=='game'||modalType==='levelup'||modalType==='result')return;world.paused=true;world.keys.clear();world.stick={x:0,y:0};showModal('pause',`<div class="modal-emblem">${icon('leaf')}</div><h2 id="modal-title">잠시, 쉬어 가요</h2><p class="modal-subtitle">숲은 당신의 발걸음을 기다려 줄 거예요.</p><div class="pause-summary"><span>${icon('clock')}${fmtTime(world.run.time)}</span><span>${icon('shield')}${world.run.kills} 처치</span></div><button class="primary-button" id="resume-game">${icon('play')}모험 계속하기</button><button class="secondary-button" id="quit-game">${icon('home')}모험 마무리하기</button>`);$('#resume-game').addEventListener('click',resume);$('#quit-game').addEventListener('click',()=>{showModal('quit',`<div class="modal-emblem">${icon('flag')}</div><h2 id="modal-title">오늘의 발걸음을 남길까요?</h2><p class="modal-subtitle">여기까지의 기록과 모은 숲의 조각을 저장해요.</p><div class="modal-actions"><button class="secondary-button" id="keep-playing">계속 모험하기</button><button class="primary-button" id="confirm-quit">기록하고 마무리</button></div>`);$('#keep-playing').addEventListener('click',resume);$('#confirm-quit').addEventListener('click',()=>{world.running=false;finishRun({...world.snapshot(),won:false,quit:true});});});}
function resume(){if(modalType==='levelup'||modalType==='result')return;$('#modal-overlay').hidden=true;modalType=null;world.paused=false;world.keys.clear();world.stick={x:0,y:0};}
$('#pause-game').addEventListener('click',pause);
$('#dash-button').addEventListener('click',()=>world?.dash());$('#ultimate-button').addEventListener('click',()=>world?.ultimate());
function finishRun(r){
  const reward=r.shards+(r.won?50:0);save.coins+=reward;
  save.runs.unshift({kind:save.selected,map:save.map,mode:save.mode,time:Math.floor(r.time),kills:r.kills,level:r.level,won:r.won,quit:!!r.quit,date:new Date().toISOString(),reward});save.runs=save.runs.slice(0,30);persist();
  world.paused=true;
  showModal('result',`<div class="result-art"><img src="${portraits[save.selected]}" alt="${heroes[save.selected].name}"/><span>${icon(r.won?'trophy':'leaf')}</span></div><h2 id="modal-title">${r.won?'숲의 빛을 지켜냈어요!':r.quit?'오늘도 한 걸음 자랐어요':'작은 용기는 숲에 남아요'}</h2><p class="modal-subtitle">${r.won?'정령의 숲에 다시 평화가 찾아왔어요.':'함께한 모든 순간이 다음 모험의 힘이 될 거예요.'}</p><div class="record-stats"><div><b>${fmtTime(r.time)}</b><span>생존 시간</span></div><div><b>${r.kills}</b><span>그림자 처치</span></div><div><b>Lv. ${r.level}</b><span>정령의 성장</span></div></div><div class="reward-row">${icon('diamond')}숲의 조각 <b>+${reward}</b>${r.won?'<small>성공 보너스 50 포함</small>':''}</div><div class="modal-actions"><button class="secondary-button" id="return-lobby">${icon('home')}숲으로 돌아가기</button><button class="primary-button" id="restart-game">${icon('reset')}다시 모험하기</button></div><p class="footnote">${storageAvailable?'모험 기록을 이 기기에 저장했어요.':'브라우저 저장이 제한되어 기록을 유지할 수 없어요.'}</p>`,true);
  $('#return-lobby').addEventListener('click',returnLobby);$('#restart-game').addEventListener('click',startGame);
}
function returnLobby(){state='lobby';world.lobby();document.body.classList.remove('playing');$('#game-screen').hidden=true;$('#lobby').hidden=false;$('.world-stage').append($('#world-container'));$('#world-container').classList.remove('game-world');$('#modal-overlay').hidden=true;modalType=null;$('#coins').textContent=save.coins;$('#quest-title').textContent='숲에 남긴 발자국';$('#quest-status').textContent=`${save.runs.length}번의 모험이 쌓였어요`;world.resize();$('#start-game').focus();}

const joystick=$('#joystick'),knob=$('.joystick-knob');let stickPointer=null;
function stickMove(e){if(e.pointerId!==stickPointer)return;const box=joystick.getBoundingClientRect(),x=e.clientX-box.left-box.width/2,y=e.clientY-box.top-box.height/2,d=Math.hypot(x,y),max=34,scale=d>max?max/d:1;knob.style.transform=`translate(${x*scale}px,${y*scale}px)`;world.stick={x:x*scale/max,y:y*scale/max};}
joystick.addEventListener('pointerdown',e=>{if(world.paused)return;stickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);stickMove(e);});joystick.addEventListener('pointermove',stickMove);
function stickEnd(){stickPointer=null;knob.style.transform='';if(world)world.stick={x:0,y:0};}
joystick.addEventListener('pointerup',stickEnd);joystick.addEventListener('pointercancel',stickEnd);joystick.addEventListener('lostpointercapture',stickEnd);

if(!storageAvailable)toast('브라우저 저장 공간이 제한되어 모험 기록을 유지할 수 없어요.');
