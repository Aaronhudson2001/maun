import { Application, Container, Graphics, Text, Assets, Sprite } from 'pixi.js';
import { WORLD_WIDTH, WORLD_HEIGHT, SHIPS, EQUIPMENT,SHOP_SUPPLIES, type Profile, type SlotType, type PlayerState, type ServerMessage } from '../../shared/protocol';
import './style.css';
// Connection-aware launch sequence: never mark ready before the server welcomes the pilot.
const bootRoot=document.getElementById('nexus-boot');
let bootFinished=false;
function bootStage(progress:number,label:string,help?:string){if(bootFinished)return;const p=document.getElementById('nexus-boot-progress');if(p)p.style.width=progress+'%';const n=document.getElementById('nexus-boot-percent');if(n)n.textContent=progress+'%';const l=document.getElementById('nexus-boot-label');if(l)l.textContent=label;const h=document.getElementById('nexus-boot-help');if(h&&help)h.textContent=help;}
function bootReady(){bootStage(100,'GALAXY CONNECTION ESTABLISHED','Entering sector…');bootFinished=true;setTimeout(()=>{if(bootRoot)bootRoot.hidden=true;},500);}
window.addEventListener('error',()=>{if(!bootFinished){bootStage(90,'STARTUP ERROR','Check the browser console and retry.');const b=document.getElementById('nexus-boot-retry');if(b)b.hidden=false;}});
bootStage(8,'LOADING GAME SYSTEMS…');


if(!localStorage.getItem('orbit-session'))location.replace('/account/login.html');
else if(sessionStorage.getItem('nexus-launch')!=='yes')location.replace('/account/home.html');
const root = document.querySelector<HTMLDivElement>('#app')!;
const tools = ['👤','✦','♟','▤','☷','▣','⚗','⌁','☁','◧','⚒','◎','▦','♧','☷','⚒','▣'];
const titles=['User','Ship','Group','Quests','Inventory','Hangar','Shop','Hangar','Chat','Galaxy','Ship','Shop','Inventory','Hangar','Hangar','Shop','Quests'];
root.innerHTML = `
  <div id="top-tools" class="ui-panel">${tools.map((t,i)=>`<button class="tool ${i===1?'active':''}" data-tool="${i}" title="${titles[i]}">${t}</button>`).join('')}</div>
  <section id="hud" class="ui-panel"><header><span>✦ &nbsp; NEXUS ORBIT</span><span class="dim"><span id="ship-title">PHOENIX</span></span></header><div class="shipname">GEMINI <span class="rank">LVL 01</span></div><div class="stat-grid"><div>⚔ <b id="hpval">4,000</b></div><div>⌃ <b><span id="speedval">320 m/s</span></b></div><div>⬡ <b id="shieldval">0</b></div><div>◈ <b id="cargoval">0 / 100</b></div></div><div class="meter"><span class="hp"></span></div><div class="meter"><span class="shield"></span></div><footer><span id="coords">X: -- Y: --</span><span id="count">Players: 0</span></footer></section>
  <aside id="orbit-resource-strip" aria-label="Pilot resources"></aside>
  <div id="top-right"><button id="hangar-view" title="Open 3D ship hangar">3D HANGAR</button><button id="logout" title="Sign out">LOG OUT</button><span id="status" class="ui-panel">● Connecting</span><button id="fullscreen" title="Fullscreen">⛶</button><button id="settings" title="Settings">⚙</button></div>
  <section id="group-panel" class="ui-panel"><header><span>◈ GROUP</span><button id="group-close" title="Hide group">−</button></header><div id="group-members">No group joined. Nearby pilots appear here.</div><div class="group-actions"><button id="group-refresh">Nearby pilots</button><button id="group-leave">Clear</button></div></section><section id="pilot-window" class="ui-panel"><header><span>♟ &nbsp; PILOT</span><button id="pilot-close" title="Close Pilot window">✕</button></header><div id="pilot-details">Connecting…</div></section>
  <div id="mission" class="ui-panel"><header>QUESTS <button id="mission-toggle" title="Collapse mission">−</button></header><nav id="mission-tabs"><button class="active" data-quest-tab="description">Description</button><button data-quest-tab="overview">Overview</button><button data-quest-tab="reward">Reward</button></nav><div id="mission-body"><b>Annihilation of Streuner</b><div class="quest-task"><span>☑</span> Destroy Streuner <strong id="mission-progress">0/1</strong></div><small>Target a Streuner and press SPACE to attack.</small></div></div><div id="safe-zone-banner" aria-live="polite" hidden>SAFE ZONE</div><div id="sector">SECTOR 3-1 <span>•</span> PROTECTED SPACE</div>
  <div id="hotbar"><div id="hotbar-drag" title="Drag to move your hotbar">⠿ &nbsp; NEXUS ACTION BAR <span>DRAG TO MOVE</span></div><div id="action-row">${[['LASERS','✴'],['ROCKETS','➤'],['MINES','◉'],['DEFENSE','⬡'],['CPUS','▣']].map(([name,icon])=>`<button class="action-tool" data-category="${name}" title="${name}"><span class="category-icon">${icon}</span><span class="category-label">${name}</span></button>`).join('')}</div><div id="category-drawer"></div><div id="combat-slots">${Array.from({length:30},(_,i)=>`<button class="slot" data-slot="${i}" title="${i<10?(i+1)%10:'F'+(i-9)}"><span>${i<10?(i+1)%10:'F'+(i-9)}</span><strong>–</strong><small class="slot-name"></small><em class="slot-quantity"></em></button>`).join('')}</div><button id="collapse" title="Hide or show action bar">▴</button></div>
  <div id="mini-panel" class="ui-panel"><header><span id="mini-live">3-1 000/000</span><span class="mini-actions"><span id="mini-sector">3-1</span><button id="mini-minus" title="Zoom minimap out">−</button><button id="mini-plus" title="Zoom minimap in">+</button><button id="mini-size" title="Expand minimap">⛶</button></span></header><canvas id="minimap" width="270" height="175"></canvas><footer><span id="mini-coords">000 / 000</span><span>▤ ▰ ▰</span></footer></div>
  <div id="popup" class="ui-panel" hidden><header><span id="popup-title">SETTINGS</span><button id="close-popup">✕</button></header><div id="popup-body">Game controls and features will appear here.</div></div>
  <div id="company-select" class="company-overlay" hidden><div class="company-dialog"><h2>WELCOME TO ORBIT MMO</h2><p>Choose your company and pilot name to enter the galaxy.</p><label>Pilot name <input id="new-username" maxlength="18" value="Pilot"></label><div class="company-options"><button data-company="mars"><img src="/assets/mars.png"><b>SOLVYRA</b><small>Start in sector 1-1</small></button><button data-company="venus"><img src="/assets/venus.png"><b>VIRELLON</b><small>Start in sector 3-1</small></button></div></div></div>
  <section id="chat-panel" class="ui-panel"><header><span>GLOBAL CHAT</span><button id="chat-toggle">−</button></header><nav id="chat-tabs"><button class="active" data-chat="Global">Global</button><button data-chat="Company">Company</button><button data-chat="Group">Group</button></nav><div id="chat-feed">[System] Local chat preview. Multiplayer chat not connected.</div><form id="chat-form"><input id="chat-input" placeholder="Type a message" maxlength="180"/><button type="submit">➤</button></form></section><div id="layout-hint">DRAG PANEL HEADERS · RESIZE FROM BOTTOM-RIGHT CORNERS</div>
  <div id="help">LEFT CLICK: MOVE &nbsp; • &nbsp; WHEEL: ZOOM &nbsp; • &nbsp; 1–0: ACTION SLOTS</div>`;
document.querySelector('#hangar-view')?.addEventListener('click',()=>window.open('/hangar/hangar.html','_blank','noopener'));
let currentChatTab='Global';
document.querySelectorAll<HTMLButtonElement>('[data-chat]').forEach(b=>b.addEventListener('click',()=>{
 currentChatTab=b.dataset.chat!;document.querySelectorAll('[data-chat]').forEach(x=>x.classList.toggle('active',x===b));
 document.querySelector('#chat-feed')!.textContent=`[${currentChatTab}] Local chat preview. Multiplayer chat not connected.`;
}));
document.querySelector('#popup-body')!.addEventListener('click',e=>{const btn=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-hangar-select]');if(!btn)return;selectedShopShip=btn.dataset.hangarSelect!;renderPanel();});
document.querySelector<HTMLFormElement>('#chat-form')!.addEventListener('submit',e=>{
 e.preventDefault();const input=document.querySelector<HTMLInputElement>('#chat-input')!;if(!input.value.trim())return;
 const line=document.createElement('div');line.textContent=`[${currentChatTab}] Pilot: ${input.value.trim()}`;document.querySelector('#chat-feed')!.append(line);input.value='';
});
document.querySelector('#chat-toggle')!.addEventListener('click',()=>document.querySelector('#chat-panel')!.classList.toggle('chat-collapsed'));
const popup = document.querySelector<HTMLElement>('#popup')!;
// Movable and resizable HUD windows; positions persist locally per browser.
const movableIds = ['hud','pilot-window','mission','mini-panel','popup','group-panel'];
let frontZ = 20;
for (const id of movableIds) {
  const panel = document.getElementById(id)!;
  panel.classList.add('movable-window');
  const saved = localStorage.getItem('orbit-layout-'+id);
  if (saved) {
    try {
      const v = JSON.parse(saved);
      if (Number.isFinite(v.left) && Number.isFinite(v.top)) {
        panel.style.left = Math.max(0,Math.min(window.innerWidth-80,v.left))+'px';
        panel.style.top = Math.max(0,Math.min(window.innerHeight-40,v.top))+'px';
        panel.style.right='auto';panel.style.bottom='auto';
      }
      if (Number.isFinite(v.width)) panel.style.width=Math.max(190,v.width)+'px';
      if (Number.isFinite(v.height)) panel.style.height=Math.max(70,v.height)+'px';
    } catch { /* ignore corrupt saved layout */ }
  }
  const save = () => {const r=panel.getBoundingClientRect();localStorage.setItem('orbit-layout-'+id,JSON.stringify({left:r.left,top:r.top,width:r.width,height:r.height}));};
  const heading=panel.querySelector<HTMLElement>('header');
  heading?.addEventListener('pointerdown',event=>{
    if(event.button!==0 || (event.target as HTMLElement).closest('button,input,select'))return;
    event.preventDefault();panel.style.zIndex=String(++frontZ);
    const r=panel.getBoundingClientRect(),dx=event.clientX-r.left,dy=event.clientY-r.top;
    panel.style.left=r.left+'px';panel.style.top=r.top+'px';panel.style.right='auto';panel.style.bottom='auto';
    heading.setPointerCapture(event.pointerId);
    const move=(e:PointerEvent)=>{panel.style.left=Math.max(0,Math.min(innerWidth-50,e.clientX-dx))+'px';panel.style.top=Math.max(0,Math.min(innerHeight-30,e.clientY-dy))+'px';};
    const end=()=>{heading.removeEventListener('pointermove',move);heading.removeEventListener('pointerup',end);heading.removeEventListener('pointercancel',end);save();};
    heading.addEventListener('pointermove',move);heading.addEventListener('pointerup',end);heading.addEventListener('pointercancel',end);
  });
  const grip=document.createElement('div');grip.className='resize-grip';grip.title='Drag to resize';panel.appendChild(grip);
  grip.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;e.preventDefault();e.stopPropagation();panel.style.zIndex=String(++frontZ);
    const r=panel.getBoundingClientRect(),x=e.clientX,y=e.clientY;
    grip.setPointerCapture(e.pointerId);
    const move=(v:PointerEvent)=>{panel.style.width=Math.max(190,Math.min(innerWidth-r.left,r.width+v.clientX-x))+'px';panel.style.height=Math.max(70,Math.min(innerHeight-r.top,r.height+v.clientY-y))+'px';};
    const end=()=>{grip.removeEventListener('pointermove',move);grip.removeEventListener('pointerup',end);grip.removeEventListener('pointercancel',end);save();};
    grip.addEventListener('pointermove',move);grip.addEventListener('pointerup',end);grip.addEventListener('pointercancel',end);
  });
}

// v1.2.2 — repositionable combat hotbar, independent of draggable equipment icons.
const hotbarPanel=document.querySelector<HTMLElement>('#hotbar')!;
const hotbarHandle=document.querySelector<HTMLElement>('#hotbar-drag')!;
const savedHotbarPosition=localStorage.getItem('orbit-layout-hotbar');
if(savedHotbarPosition){try{const pos=JSON.parse(savedHotbarPosition);if(Number.isFinite(pos.x)&&Number.isFinite(pos.y)){hotbarPanel.style.setProperty('left',Math.max(0,Math.min(innerWidth-90,pos.x))+'px','important');hotbarPanel.style.setProperty('top',Math.max(0,Math.min(innerHeight-35,pos.y))+'px','important');hotbarPanel.style.setProperty('bottom','auto','important');hotbarPanel.style.setProperty('transform','none','important');}}catch{}}
hotbarHandle.addEventListener('pointerdown',e=>{
 if(e.button!==0)return;e.preventDefault();const r=hotbarPanel.getBoundingClientRect();const dx=e.clientX-r.left,dy=e.clientY-r.top;
 hotbarHandle.setPointerCapture(e.pointerId);
 const move=(v:PointerEvent)=>{hotbarPanel.style.setProperty('left',Math.max(0,Math.min(innerWidth-90,v.clientX-dx))+'px','important');hotbarPanel.style.setProperty('top',Math.max(0,Math.min(innerHeight-35,v.clientY-dy))+'px','important');hotbarPanel.style.setProperty('bottom','auto','important');hotbarPanel.style.setProperty('transform','none','important');};
 const end=()=>{hotbarHandle.removeEventListener('pointermove',move);hotbarHandle.removeEventListener('pointerup',end);hotbarHandle.removeEventListener('pointercancel',end);const r=hotbarPanel.getBoundingClientRect();localStorage.setItem('orbit-layout-hotbar',JSON.stringify({x:r.left,y:r.top}));};
 hotbarHandle.addEventListener('pointermove',move);hotbarHandle.addEventListener('pointerup',end);hotbarHandle.addEventListener('pointercancel',end);
});
let socket: WebSocket | undefined;
let profile:Profile|null=null;
let identity: {username:string;company:'venus'|'mars'}|null=null;
try {const saved=JSON.parse(localStorage.getItem('orbit-identity')||'null');if(saved&&['venus','mars'].includes(saved.company)&&typeof saved.username==='string')identity=saved;}catch{}
const companyOverlay=document.querySelector<HTMLElement>('#company-select')!;
companyOverlay.hidden=!!identity;
document.querySelectorAll<HTMLButtonElement>('[data-company]').forEach(btn=>btn.addEventListener('click',()=>{const company=btn.dataset.company as 'venus'|'mars';const username=(document.querySelector<HTMLInputElement>('#new-username')!.value.trim().replace(/[^a-zA-Z0-9_-]/g,'').slice(0,18)||'Pilot');identity={company,username};localStorage.setItem('orbit-identity',JSON.stringify(identity));companyOverlay.hidden=true;sendGame({type:'identity',...identity,token:localStorage.getItem('orbit-session')});}));
let activeTab='Ship';
let manageDroneTab=false;

let selectedShopShip='phoenix';
let shopCategory='SHIPS';
let selectedShopItem='';
let shopNotice='';
const fmt=(n:number)=>n.toLocaleString('en-GB');
const sendGame=(message:object)=>{if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(message));};
const selectedShip=()=>SHIPS.find(s=>s.id===profile?.activeShip)??SHIPS[0];
const config=()=>profile?.configs[profile.activeShip][String(profile.activeConfig) as '1'|'2'];
const stat=(kind:'shield'|'speed')=>(config()?.generator.reduce((sum,id)=>sum+(EQUIPMENT.find(e=>e.id===id)?.[kind]??0),0)??0)+(kind==='shield'?(['iris','flax'] as const).reduce((sum,type)=>sum+(profile?.droneConfigs?.[String(profile.activeConfig) as '1'|'2']?.[type]??[]).reduce((n,slot)=>n+(EQUIPMENT.find(e=>e.id===slot.generator)?.shield??0),0),0):0);
function refreshHud(){if(!profile)return;refreshPilot();const s=selectedShip();document.querySelector('#ship-title')!.textContent=s.name.toUpperCase();document.querySelector('#hpval')!.textContent=fmt(s.hp);document.querySelector('#shieldval')!.textContent=fmt(stat('shield'));document.querySelector('#speedval')!.textContent=`${s.speed+stat('speed')} m/s`;document.querySelector('#cargoval')!.textContent=`${profile.cargo} / ${s.cargo}`;}
function refreshPilot(){if(!profile)return;const premium=profile.premiumUntil>Date.now();document.querySelector('#hotbar')?.classList.toggle('premium-hotbar',premium);document.querySelector('#hotbar')?.classList.toggle('standard-hotbar',!premium);
 const resourceStrip=document.querySelector<HTMLElement>('#orbit-resource-strip');
 if(resourceStrip)resourceStrip.innerHTML=`<div class="resource-premium">${premium?'★ PREMIUM':''}</div><div title="Experience">✦ ${fmt(profile.experience)}</div><div title="Honor">✺ ${fmt(profile.honor)}</div><div title="Credits">▣ ${fmt(profile.credits)}</div><div title="Uridium">◆ ${fmt(profile.uridium)}</div><div title="Booty keys">⚿ ${fmt(profile.bootyKeys)}</div>`;document.querySelector('#pilot-details')!.innerHTML=`<div class="classic-user-head"><span>♟ &nbsp; USER</span><strong>${String(identity?.username||'Pilot').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as Record<string,string>)[c]||c)}</strong></div><div class="classic-user-cols"><div class="classic-user-left"><div><i>ID</i><b>${String(profile.playerId??'—')}</b></div><div><i>▥</i><b>${fmt(profile.level)}</b></div><div><i>✪</i><b>${fmt(profile.experience)}</b></div><div><i>♜</i><b>${fmt(profile.honor)}</b></div><div><i>★</i><b>${fmt(profile.jackpot??0)}</b></div></div><div class="classic-user-right"><div class="classic-premium ${premium?'active':''}">♛ &nbsp; ${premium?'PREMIUM':'STANDARD'}</div><div><i>C</i><b>${fmt(profile.credits)}</b></div><div><i>U</i><b>${fmt(profile.uridium)}</b></div></div></div>`;}
const defaultPrefs={mapBackground:true,miniBackground:true,drones:true,cargo:true,bonus:true,npcs:true,portals:true,labels:true,grid:false,customPhoenix:true,quality:'high',effects:'high'};
type Prefs=typeof defaultPrefs;let prefs:Prefs={...defaultPrefs};try{prefs={...prefs,...JSON.parse(localStorage.getItem('orbit-display-prefs')||'{}')}}catch{}
function showPanel(title:string){activeTab=title==='Equipment'?'Hangar':title;if(activeTab==='Hangar'&&profile&&!profile.ownedShips.includes(selectedShopShip))selectedShopShip=profile.activeShip;popup.hidden=false;document.querySelector('#popup-title')!.textContent=(activeTab==='HangarManage'?'HANGAR / MANAGE':activeTab.toUpperCase());renderPanel();}
const shopCard=(id:string,name:string,details:string,price:number,currency:string,owned=false)=>`<button class="shop-card shop-catalog-card ${selectedShopItem===id?'selected':''}" data-shop-item="${id}"><img class="shop-equipment-icon" src="${equipmentIcon(id)}" alt="${name}"><strong>${name}</strong><small>${fmt(price)} ${currency==='credits'?'CR':'URI'}</small></button>`;

function equipmentIcon(id:string):string{
 const item=EQUIPMENT.find(e=>e.id===id);
 if(!item)return '';
 const aliases:Record<string,string>={lf1:'lf-1',lf2:'lf-2',lf3:'lf-3',lf4:'lf-4',mp1:'mp-1',bo1:'sg3n-b01',bo2:'sg3n-b02',repair:'dr-01',hst1:'hst-1',hst2:'hst-2'};
 const name=aliases[id.toLowerCase()]??id.toLowerCase();
 const path=item.kind==='laser'?'weapon/laser':item.kind==='generator'?(name.startsWith('sg3n')?'generator/shield':'generator/speed'):id.startsWith('hst')?'weapon/rocketlauncher':'extra/cpu';
 return `/assets/shop-equipment/${name}.png`;
}


function shopItemDetails():string{
 if(!profile)return '';
 const supply=SHOP_SUPPLIES.find(x=>x.id===selectedShopItem && x.id!=='RB-214' && x.id!=='PIB-100');
 const equip=EQUIPMENT.find(x=>x.id===selectedShopItem);
 const drone=selectedShopItem==='iris'||selectedShopItem==='flax'?selectedShopItem:null;
 if(!supply&&!equip&&!drone)return '<h3>SELECT AN ITEM</h3><p>Choose an item to see its image, price and purchase options.</p>';
 if(drone){const n=profile.drones?.[drone]??0;const prices=drone==='iris'?[15000,24000,42000,60000,84000,96000,126000,200000]:[100000,200000,400000,800000,1600000,3200000,6400000,12800000];return `<img src="/assets/drones/${drone}-1.png" alt="${drone}"><h3>${drone.toUpperCase()} DRONE</h3><p>Owned: ${n}/8</p><div class="nexus-ship-spec"><div><span>Next purchase</span><b>${n>=8?'MAX':fmt(prices[n])+' '+(drone==='iris'?'URI':'CR')}</b></div></div><button class="nexus-shop-action" data-buy-drone="${drone}" ${n>=8?'disabled':''}>${n>=8?'MAXIMUM REACHED':'BUY DRONE'}</button>`;}
 if(supply){const packs=supply.price===0.5?2:1;const price=supply.price*packs;return `<img src="/assets/ui/hotbar/${supply.icon}.png" alt="${supply.name}"><h3>${supply.name}</h3><p>${supply.category}</p><div class="nexus-ship-spec"><div><span>Owned</span><b>${fmt(profile.ammo?.[supply.id]??0)}</b></div><div><span>Quantity</span><b>${supply.quantity*packs}</b></div><div><span>Price</span><b>${fmt(price)} ${supply.currency==='credits'?'CR':'URI'}</b></div></div><button class="nexus-shop-action" data-buy-supply="${supply.id}" data-buy-packs="${packs}">BUY AMMUNITION</button>`;}
 return `<img src="${equipmentIcon(equip!.id)}" alt="${equip!.name}"><h3>${equip!.name.toUpperCase()}</h3><p>${equip!.kind.toUpperCase()}</p><div class="nexus-ship-spec"><div><span>Owned</span><b>${fmt(profile.inventory[equip!.id]??0)}</b></div><div><span>Price</span><b>${fmt(equip!.price)} ${equip!.currency==='credits'?'CR':'URI'}</b></div></div><button class="nexus-shop-action" data-buy="${equip!.id}">BUY EQUIPMENT</button>${equip!.id==='ajp-01'?'<p>Equip in Hangar, then open USER to select a destination.</p>':''}${equip!.id==='lab-cpu'?'<p>Lab upgrade interface requires laboratory ore storage; not yet available.</p>':''}`;
}

function renderPanel(){if(popup.hidden)return;const target=document.querySelector<HTMLElement>('#popup-body')!;if(!profile){target.innerHTML='Connecting to server…';return;}const s=selectedShip();const c=config()!;
const wallet=`<div class="wallet">Credits: <b>${fmt(profile.credits)}</b> &nbsp; Uridium: <b>${fmt(profile.uridium)}</b></div>`;
if(activeTab==='User')target.innerHTML=`<h4>PILOT</h4><p>The compact Pilot window displays your level, Credits, Uridium, Honor, Experience, Premium status and Booty Keys.</p><button id="show-pilot">SHOW PILOT WINDOW</button>${c.extra.includes('ajp-01')?`<h4>ADVANCED JUMP CPU</h4><select id="advanced-jump-target">${sectorIds.filter(x=>x!=='4-4').map(x=>`<option value="${x}">${x}</option>`).join('')}</select><button id="advanced-jump-go">JUMP TO SELECTED SECTOR</button>`:''}`;
else if(activeTab==='Settings')target.innerHTML=`<div class="settings-tabs">${['Display','Gameplay','Interface','Sound','Keyboard'].map((x,i)=>`<button class="settings-tab ${i===0?'active':''}" data-settings-tab="${x}">${x}</button>`).join('')}</div><div id="settings-content"><h4>DISPLAY SETTINGS</h4><div class="settings-choice"><span>Graphic quality</span><select data-pref="quality"><option value="low" ${prefs.quality==='low'?'selected':''}>Low</option><option value="medium" ${prefs.quality==='medium'?'selected':''}>Average</option><option value="high" ${prefs.quality==='high'?'selected':''}>High</option></select></div><div class="settings-choice"><span>Effects</span><select data-pref="effects"><option value="low" ${prefs.effects==='low'?'selected':''}>Low</option><option value="high" ${prefs.effects==='high'?'selected':''}>High</option></select></div><h4>VISIBILITY</h4>${([['mapBackground','Show map background'],['miniBackground','Show minimap background'],['drones','Show drones'],['cargo','Show cargo boxes'],['bonus','Show bonus boxes'],['npcs','Show NPCs'],['portals','Show portals'],['labels','Show pilot names and titles'],['grid','Show coordinate grid'],['customPhoenix','Use custom Phoenix design']] as [keyof Prefs,string][]).map(([key,label])=>`<label class="setting-row"><span>${label}</span><input type="checkbox" data-pref="${key}" ${prefs[key]?'checked':''}></label>`).join('')}</div><div class="settings-actions"><button id="settings-save">Save</button><button id="settings-cancel">Cancel</button><button id="settings-reset">Reset</button><button id="reset-layout">Reset window positions</button></div>`;
else if(activeTab==='Ammo')target.innerHTML=`<div class="ammo-tabs"><strong>AMMUNITION · DRAG TO HOTBAR</strong><div class="ammo-categories">${['LASERS','ROCKETS','SPECIAL'].map(x=>`<button data-ammo-category="${x}" class="${ammoCategory===x?'selected':''}">${x}</button>`).join('')}</div><small>Drag an icon onto a numbered hotbar slot, or click EQUIP.</small></div><div class="ammo-grid">${ammoItems.filter(x=>x.category===ammoCategory).map(x=>`<article class="ammo-card" draggable="true" data-ammo-drag="${x.id}"><b>${x.label}</b><div class="ammo-art" style="color:${x.color};text-shadow:0 0 12px ${x.color}">${itemIcon(x.id)?`<img class="item-icon" src="${itemIcon(x.id)}" alt="">`:x.icon}</div><span>${fmt(profile?.ammo?.[x.id]??0)}</span><button data-ammo-equip="${x.id}">EQUIP TO SLOT ${selectedHotbar+1}</button></article>`).join('')}</div><p>CTRL or SPACE: fire selected laser; double-click target: fire; special items activate immediately. Rockets use separate cooldowns.</p>`;
else if(activeTab==='Drones')target.innerHTML=`<h4>DRONE HANGAR · VISUAL PREVIEW</h4><p>Purchased IRIS and FLAX drones automatically appear around your ship. Drone levels increase with NPC kill experience and persist with your pilot profile. The preview controls below do not change owned drones.</p><label>Drone type <select id="drone-type"><option value="iris">IRIS · Blue (owned: ${profile.drones?.iris??0})</option><option value="flax">FLAX · Green (owned: ${profile.drones?.flax??0})</option></select></label><label>Level <select id="drone-level">${Array.from({length:6},(_,i)=>`<option value="${i+1}">Level ${i+1}</option>`).join('')}</select></label><label>Number <select id="drone-count">${Array.from({length:9},(_,i)=>`<option value="${i}">${i}</option>`).join('')}</select></label><button id="drone-apply">APPLY DRONE PREVIEW</button>`;
else if(activeTab==='Quests')target.innerHTML=`<h4>FIRST CONTACT</h4><p>Destroy one Streuner on the starter map. Reward: 2,000 Credits and 50 Uridium.</p><p id="quest-panel-progress">${missionComplete?'Completed!':'In progress'}</p>`;
else if(activeTab==='Shop'){
 const chosen=SHIPS.find(x=>x.id===selectedShopShip)??SHIPS[0];const owned=profile.ownedShips.includes(chosen.id);const active=profile.activeShip===chosen.id;
 const shopFaction=identity?.company==='venus'?'venus':'mars';
 const shipImage=(id:string)=>`/assets/ship-frames/${SHIPS.findIndex(x=>x.id===id)+1}/00.png`;
 target.innerHTML=`<div class="nexus-shop"><aside class="nexus-shop-menu"><b>NEXUS ORBIT</b><span>MARKET</span>${['SHIPS','DRONES','LASERS','GENERATORS','ROCKET LAUNCHERS','LASER AMMO','ROCKETS','LAUNCHER AMMO','EXTRAS'].map(cat=>`<button class="${shopCategory===cat?'active':''}" data-shop-category="${cat}">${cat}</button>`).join('')}<button data-open="Hangar">MY HANGAR</button></aside><section class="nexus-shop-main"><div class="nexus-shop-top"><strong>▣ NEXUS ORBIT · STARSHIP MARKET</strong><span>▣ ${fmt(profile.credits)} CR &nbsp; ◆ ${fmt(profile.uridium)} URI</span></div>${shopNotice?`<div class="nexus-shop-notice">${shopNotice}</div>`:''}${shopCategory==='DRONES'?`<div class="nexus-equipment-list">${(['iris','flax'] as const).map(type=>{const n=profile!.drones?.[type]??0;const prices=type==='iris'?[15000,24000,42000,60000,84000,96000,126000,200000]:[100000,200000,400000,800000,1600000,3200000,6400000,12800000];return `<button class="shop-card shop-catalog-card ${selectedShopItem===type?'selected':''}" data-shop-item="${type}"><img class="shop-equipment-icon" src="/assets/drones/${type}-1.png" alt="${type.toUpperCase()} drone"><strong>${type.toUpperCase()}</strong><small>${n>=8?'MAX':fmt(prices[n])+' '+(type==='iris'?'URI':'CR')}</small></button>`}).join('')}</div>`:['LASER AMMO','ROCKETS','LAUNCHER AMMO'].includes(shopCategory)?`<div class="nexus-equipment-list">${SHOP_SUPPLIES.filter(x=>x.category===shopCategory && x.id!=='RB-214' && x.id!=='PIB-100').map(x=>`<button class="shop-card shop-catalog-card ${selectedShopItem===x.id?'selected':''}" data-shop-item="${x.id}"><img class="shop-equipment-icon" src="/assets/ui/hotbar/${x.icon}.png" alt="${x.name}"><strong>${x.name}</strong><small>${fmt(x.price===0.5?1:x.price)} ${x.currency==='credits'?'CR':'URI'}</small></button>`).join('')}</div>`:shopCategory==='SHIPS'?`<div class="nexus-shop-gallery">${SHIPS.map(x=>{const isOwned=profile!.ownedShips.includes(x.id);return `<button class="nexus-ship-tile ${selectedShopShip===x.id?'selected':''}" data-shop-select="${x.id}"><img src="${shipImage(x.id)}" alt="${x.name} ship" loading="lazy"/><strong>${x.name.toUpperCase()}</strong><span class="${isOwned?'owned':''}">${profile!.activeShip===x.id?'EQUIPPED':isOwned?'OWNED':`${fmt(x.price===0.5?1:x.price)} ${x.currency==='credits'?'CR':'URI'}`}</span></button>`}).join('')}</div>`:`<div class="nexus-equipment-list">${EQUIPMENT.filter(x=>shopCategory==='LASERS'?x.kind==='laser':shopCategory==='GENERATORS'?x.kind==='generator':shopCategory==='ROCKET LAUNCHERS'?['hst1','hst2'].includes(x.id):x.kind==='extra'&&!['hst1','hst2'].includes(x.id)).map(x=>shopCard(x.id,x.name,`${x.kind.toUpperCase()}${x.power?' · '+x.power+' damage':''}`,x.price,x.currency)).join('')}</div>`}</section><aside class="nexus-shop-detail">${shopCategory==='SHIPS'?`<img src="${shipImage(chosen.id)}" alt="${chosen.name}"/><h3>${chosen.name.toUpperCase()}</h3><p>${chosen.id==='phoenix'?'RED ANT · SCOUT FIGHTER':chosen.id==='goliath'?'3D FIGHTER PROTOTYPE · HEAVY FLAGSHIP':'Nexus Orbit '+chosen.name+' class'} · UNIFIED SHIP SKIN</p><div class="nexus-ship-spec">${[['Hit points',fmt(chosen.hp)],['Speed',String(chosen.speed)],['Laser slots',String(chosen.lasers)],['Generator slots',String(chosen.generators)],['Cargo',String(chosen.cargo)],['Price',`${fmt(chosen.price)} ${chosen.currency==='credits'?'CR':'URI'}`]].map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>${active?'<button class="nexus-shop-action" disabled>EQUIPPED</button>':owned?`<button class="nexus-shop-action" data-ship="${chosen.id}">EQUIP SHIP</button>`:`<button class="nexus-shop-action" data-buy="${chosen.id}">BUY FOR ${fmt(chosen.price)} ${chosen.currency==='credits'?'CR':'URI'}</button>`}`:shopItemDetails()}</aside></div>`;
 }

else if(activeTab==='Hangar')target.innerHTML=`<div class="nexus-hangar"><div class="nexus-hangar-heading"><strong>◈ HANGAR</strong><span>${profile.ownedShips.length} / ${SHIPS.length} SHIPS OWNED</span></div><div class="nexus-hangar-layout"><div class="nexus-hangar-fleet">${SHIPS.map((x,i)=>{const owned=profile!.ownedShips.includes(x.id);return `<button class="nexus-hangar-ship ${profile!.activeShip===x.id?'active':''} ${owned?'owned':'locked'}" data-hangar-select="${x.id}"><img src="/assets/ship-frames/${i+1}/00.png" alt="${x.name}"/><span><b>${x.name.toUpperCase()}</b><small>${profile!.activeShip===x.id?'✓ ACTIVE':owned?'OWNED':'LOCKED'}</small></span></button>`}).join('')}</div><aside class="nexus-hangar-info"><img src="/assets/ship-frames/${SHIPS.findIndex(x=>x.id===selectedShopShip)+1}/00.png" alt="Selected ship"/><h3>${(SHIPS.find(x=>x.id===selectedShopShip)??SHIPS[0]).name.toUpperCase()}</h3>${(()=>{const x=SHIPS.find(x=>x.id===selectedShopShip)??SHIPS[0];return `<div class="nexus-hangar-stats">${[['Hit points',fmt(x.hp)],['Speed',String(x.speed)],['Laser slots',String(x.lasers)],['Generator slots',String(x.generators)],['Cargo',String(x.cargo)]].map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>${profile!.activeShip===x.id?'<button class="nexus-hangar-manage" data-manage="1">MANAGE</button><small class="nexus-active-label">✓ ACTIVE SHIP</small>':profile!.ownedShips.includes(x.id)?`<button data-ship="${x.id}">EQUIP SHIP</button>`:`<button data-open="Shop">OPEN SHIP MARKET</button>`}`})()}</aside></div></div>`;
else if(activeTab==='Inventory')target.innerHTML=wallet+`<h4>AVAILABLE EQUIPMENT</h4>`+(Object.entries(profile.inventory).filter(([,count])=>count>0).map(([id,count])=>`<div class="shop-card"><img class="shop-equipment-icon" src="${equipmentIcon(id)}" alt=""><strong>${EQUIPMENT.find(e=>e.id===id)?.name??id}</strong><b>× ${count}</b></div>`).join('')||'<p>Inventory is empty. Buy items in the Shop.</p>')+`<p>Equipment fitted to ships is managed separately for each configuration.</p>`;
else if(activeTab==='HangarManage'){
 const active=SHIPS.find(x=>x.id===profile!.activeShip)??s;
 const picture=`/assets/ship-frames/${SHIPS.findIndex(x=>x.id===active.id)+1}/00.png`;
 const equipKinds:SlotType[]=['laser','generator','extra'];
 const slotMarkup=(kind:SlotType)=>c[kind].map((id,i)=>`<button class="do-equip-cell ${id?'filled':''}" data-equip-kind="${kind}" data-equip-index="${i}" title="${id?EQUIPMENT.find(e=>e.id===id)?.name??id:'Empty slot — choose inventory item'}" draggable="${!!id}"><span>${i+1}</span>${id?`<img src="${equipmentIcon(id)}" alt="${EQUIPMENT.find(e=>e.id===id)?.name??id}" onerror="this.style.opacity='0.2'">`:''}</button>`).join('');
 const inventory=EQUIPMENT.filter(e=>(profile!.inventory[e.id]??0)>0);
 target.innerHTML=`<div class="do-manager"><div class="do-top"><button data-back-hangar="1">❮ BACK</button><strong>HANGAR · ${active.name.toUpperCase()}</strong><div><button data-config="1" class="${profile.activeConfig===1?'chosen':''}">CONFIG 1</button><button data-config="2" class="${profile.activeConfig===2?'chosen':''}">CONFIG 2</button></div></div><div class="do-tabs"><button data-drone-tab="ship" class="${!manageDroneTab?'chosen':''}">SPACESHIP</button><button data-drone-tab="drones" class="${manageDroneTab?'chosen':''}">DRONES</button></div><div class="do-columns"><aside class="do-ship"><img src="${picture}" alt="${active.name}"><b>${active.name.toUpperCase()}</b><small>CONFIGURATION ${profile.activeConfig}</small></aside><div class="do-fitting">${manageDroneTab?(['iris','flax'] as const).map(type=>`<section><h4>${type.toUpperCase()} · ${profile!.drones?.[type]??0} OWNED</h4><div class="do-slot-grid">${Array.from({length:profile!.drones?.[type]??0},(_,i)=>{const slot=profile!.droneConfigs?.[String(profile!.activeConfig) as '1'|'2']?.[type]?.[i];return `<div class="do-drone-unit"><img src="/assets/drones/${type}-1.png" alt="${type}"><small>${type.toUpperCase()} ${i+1} · LV ${Math.min(6,1+Math.floor((profile!.droneXp?.[type]?.[i]??0)/10000))}</small>${(['laser','generator'] as const).map(kind=>`<button class="do-equip-cell" data-drone-fit="${type}:${i}:${kind}" title="${kind}: ${slot?.[kind]??'empty'} — select inventory item or click to remove"><img src="${slot?.[kind]?equipmentIcon(slot[kind]!):'/assets/drones/'+type+'-1.png'}" alt="${kind}"><small>${kind}</small></button>`).join('')}</div>`}).join('')}</div></section>`).join(''):equipKinds.map(kind=>`<section><h4>${kind==='laser'?'LASERS':kind==='generator'?'GENERATORS':'EXTRAS'} (${c[kind].length})</h4><div class="do-slot-grid">${slotMarkup(kind)}</div></section>`).join('')}</div><aside class="do-inventory"><h3>INVENTORY</h3><p id="do-equip-help">Select an item, then select a matching slot. Click an occupied slot to unequip it.</p><div class="do-inventory-grid">${inventory.map(e=>`<button data-inventory-item="${e.id}" data-inventory-kind="${e.kind}" draggable="true" title="${e.name} · ${profile!.inventory[e.id]} available"><img src="${equipmentIcon(e.id)}" alt="${e.name}" onerror="this.style.opacity='0.2'"><small>×${profile!.inventory[e.id]}</small></button>`).join('')||'<p>No unequipped items. Purchase equipment in the Shop.</p>'}</div><div class="do-selected" id="do-selected">No item selected</div></aside></div></div>`;
}

else if(activeTab==='Ship'||activeTab==='Pilot')target.innerHTML=`<h4>${s.name.toUpperCase()} — LEVEL 1</h4><div class="ship-stats"><span>Hit points</span><b>${fmt(s.hp)}</b><span>Shield capacity</span><b>${fmt(stat('shield'))}</b><span>Speed</span><b>${s.speed+stat('speed')} m/s</b><span>Cargo</span><b>${profile.cargo} / ${s.cargo}</b><span>Laser slots</span><b>${s.lasers}</b><span>Generator slots</span><b>${s.generators}</b><span>Extras slots</span><b>${s.extras}</b><span>Configuration</span><b>${profile.activeConfig}</b></div><button data-open="Hangar">OPEN HANGAR</button>`;
else target.innerHTML='<p>This module will be available in a future update.</p>';
}
document.querySelector('#close-popup')!.addEventListener('click',()=>popup.hidden=true);
document.querySelector('#settings')!.addEventListener('click',()=>showPanel('Settings'));
document.querySelector('#logout')!.addEventListener('click',()=>{localStorage.removeItem('orbit-session');localStorage.removeItem('orbit-identity');sessionStorage.removeItem('nexus-launch');location.href='/account/login.html';});

document.querySelector('#pilot-close')!.addEventListener('click',()=>{document.querySelector<HTMLElement>('#pilot-window')!.hidden=true;});
document.querySelector('#mission-toggle')!.addEventListener('click',()=>document.querySelector('#mission')!.classList.toggle('minimized'));
document.querySelector('#fullscreen')!.addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});});
document.querySelectorAll<HTMLButtonElement>('.tool').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.tool').forEach(b=>b.classList.remove('active'));button.classList.add('active');if(button.title==='User'){document.querySelector<HTMLElement>('#pilot-window')!.hidden=false;}else if(button.title==='Group'){document.querySelector<HTMLElement>('#group-panel')!.classList.remove('group-collapsed');updateGroupRoster();}else showPanel(button.title);}));
document.querySelector<HTMLElement>('#popup-body')!.addEventListener('input',e=>{
 const el=e.target as HTMLInputElement;
 if(el.id==='nexus-sound-enabled')gameSound.enabled=el.checked;
 else if(el.id==='nexus-sfx-volume')gameSound.volume=Number(el.value)/100;
 else if(el.id==='nexus-music-volume'){backgroundMusic.volume=Number(el.value)/100;if(backgroundMusic.volume===0)backgroundMusic.pause();else if(soundUnlocked&&gameSound.enabled)void backgroundMusic.play().catch(()=>{});}
 else return;
 saveAudioSettings();
});
document.querySelector<HTMLElement>('#popup-body')!.addEventListener('keydown',e=>{
 const el=e.target as HTMLInputElement;if(!el.matches('[data-key-index]'))return;
 e.preventDefault();e.stopPropagation();const i=Number(el.dataset.keyIndex),key=e.key===' '?'Space':e.key;
 if(key==='Escape')return;if(hotkeys.some((k,j)=>j!==i&&k.toLowerCase()===key.toLowerCase())){el.title='Already assigned';return;}
 hotkeys[i]=key;el.value=key;localStorage.setItem('nexus-hotkeys',JSON.stringify(hotkeys));
});
let hangarSelectedItem:string|null=null;
document.querySelector<HTMLElement>('#popup-body')!.addEventListener('click',e=>{
 const button=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;
 if(button.dataset.droneTab){manageDroneTab=button.dataset.droneTab==='drones';renderPanel();return;}
 if(button.dataset.droneFit){const [type,index,kind]=button.dataset.droneFit.split(':');sendGame({type:'fitDrone',drone:type,index:Number(index),kind,item:hangarSelectedItem});hangarSelectedItem=null;return;}
 if(button.dataset.inventoryItem){hangarSelectedItem=button.dataset.inventoryItem;document.querySelectorAll('[data-inventory-item]').forEach(el=>el.classList.toggle('selected',el===button));const label=document.querySelector('#do-selected');if(label)label.textContent='Selected: '+(EQUIPMENT.find(x=>x.id===hangarSelectedItem)?.name??hangarSelectedItem)+' — click a matching equipment slot';return;}
 if(button.dataset.equipKind){const kind=button.dataset.equipKind as SlotType;const index=Number(button.dataset.equipIndex);const equipped=config()?.[kind]?.[index];if(hangarSelectedItem){const item=EQUIPMENT.find(x=>x.id===hangarSelectedItem);if(item?.kind!==kind){const label=document.querySelector('#do-selected');if(label)label.textContent='Wrong slot type: choose '+item?.kind+' slot';return;}sendGame({type:'fit',kind,slot:index,item:hangarSelectedItem});hangarSelectedItem=null;}else if(equipped)sendGame({type:'fit',kind,slot:index,item:null});return;}
if(button.dataset.settingsTab){const pane=document.querySelector<HTMLElement>('#settings-content')!;document.querySelectorAll('.settings-tab').forEach(t=>t.classList.toggle('active',t===button));if(button.dataset.settingsTab==='Display'){renderPanel();return;}if(button.dataset.settingsTab==='Sound'){
 pane.innerHTML=`<h4>AUDIO SETTINGS</h4><label class="setting-row">Enable sound <input id="nexus-sound-enabled" type="checkbox" ${gameSound.enabled?'checked':''}></label><label class="setting-row">Effects volume <input id="nexus-sfx-volume" type="range" min="0" max="100" value="${Math.round(gameSound.volume*100)}"></label><label class="setting-row">Music volume <input id="nexus-music-volume" type="range" min="0" max="100" value="${Math.round(backgroundMusic.volume*100)}"></label><p>Changes save automatically.</p>`;return;
 }
 if(button.dataset.settingsTab==='Keyboard'){
 pane.innerHTML=`<h4>KEYBOARD SHORTCUTS</h4><p>Click a field and press a key to remap. F1–F20 rows require Premium; keys can be remapped to those available on your keyboard.</p><div class="nexus-key-grid">${hotkeys.map((key,i)=>`<label>${i<10?'Main '+(i+1):i<20?'Premium '+(i-9):'Premium '+(i-19)}<input data-key-index="${i}" value="${key}" readonly></label>`).join('')}</div><button id="nexus-reset-keys">Reset shortcuts</button>`;return;
 }
 pane.innerHTML='<h4>'+button.dataset.settingsTab.toUpperCase()+'</h4><p>Configure the available display options in the Display tab.</p>';return;}if(button.id==='nexus-reset-keys'){hotkeys=[...hotkeyDefaults];localStorage.setItem('nexus-hotkeys',JSON.stringify(hotkeys));document.querySelectorAll<HTMLInputElement>('[data-key-index]').forEach(el=>el.value=hotkeys[Number(el.dataset.keyIndex)]);return;}if(button.id==='drone-apply'){localStorage.setItem('orbit-drone-loadout',JSON.stringify({type:(document.querySelector('#drone-type') as HTMLSelectElement).value,level:Number((document.querySelector('#drone-level') as HTMLSelectElement).value),count:Number((document.querySelector('#drone-count') as HTMLSelectElement).value)}));popup.hidden=true;return;}if(button.id==='settings-save'){savePrefs();popup.hidden=true;return;}if(button.id==='settings-cancel'){try{prefs={...defaultPrefs,...JSON.parse(localStorage.getItem('orbit-display-prefs')||'{}')}}catch{}applyPrefs();popup.hidden=true;return;}if(button.id==='settings-reset'){prefs={...defaultPrefs};savePrefs();applyPrefs();renderPanel();return;}if(button.id==='reset-layout'){for(const id of [...movableIds,'hotbar'])localStorage.removeItem('orbit-layout-'+id);location.reload();return;}if(button.dataset.ammoCategory){ammoCategory=button.dataset.ammoCategory;renderPanel();return;}if(button.dataset.ammoEquip){if(selectedHotbar>=10&&!(profile&&profile.premiumUntil>Date.now()))return;const items=[...hotbarItems];items[selectedHotbar]=button.dataset.ammoEquip;hotbarItems=items;drawHotbar();sendGame({type:'hotbar',items});return;}if(button.dataset.shopItem){selectedShopItem=button.dataset.shopItem;renderPanel();return;}if(button.dataset.shopCategory){shopCategory=button.dataset.shopCategory;renderPanel();return;}if(button.dataset.shopSelect){selectedShopShip=button.dataset.shopSelect;shopNotice='';renderPanel();return;}if(button.dataset.buySupply){shopNotice='Ammunition purchase requested…';sendGame({type:'buySupply',id:button.dataset.buySupply,packs:Number(button.dataset.buyPacks||1)});renderPanel();return;}if(button.dataset.buyDrone){shopNotice='Drone purchase requested…';sendGame({type:'buyDrone',drone:button.dataset.buyDrone});renderPanel();return;}if(button.dataset.buy){shopNotice='Purchase requested…';sendGame({type:'purchase',id:button.dataset.buy});if(activeTab==='Shop')renderPanel();return;}if(button.dataset.ship){shopNotice='Equipping ship…';sendGame({type:'equipShip',id:button.dataset.ship});if(activeTab==='Shop')renderPanel();return;}if(button.dataset.manage){showPanel('HangarManage');return;}if(button.dataset.backHangar){showPanel('Hangar');return;}if(button.dataset.config)sendGame({type:'config',config:Number(button.dataset.config)});if(button.id==='advanced-jump-go'){const target=(document.querySelector('#advanced-jump-target') as HTMLSelectElement)?.value;if(target)sendGame({type:'advancedJump',target});return;}if(button.id==='show-pilot'){document.querySelector<HTMLElement>('#pilot-window')!.hidden=false;popup.hidden=true;}if(button.dataset.open)showPanel(button.dataset.open);});
document.querySelector<HTMLElement>('#popup-body')!.addEventListener('change',e=>{const el=e.target as HTMLInputElement;if(el.dataset.pref){const key=el.dataset.pref as keyof Prefs;(prefs as any)[key]=el.type==='checkbox'?el.checked:el.value;applyPrefs();return;}if(el.id==='grid-setting'){grid.visible=el.checked;return;}if(el.id==='labels-setting'){showLabels=el.checked;return;}if(!el.matches('select[data-kind]'))return;sendGame({type:'fit',kind:el.dataset.kind,slot:Number(el.dataset.slot),item:el.value||null});});
const itemIconMap:Record<string,string>={
 'LCB-10':'ammunition_laser_lcb-10','MCB-25':'ammunition_laser_mcb-25',
 'MCB-50':'ammunition_laser_mcb-50','UCB-100':'ammunition_laser_ucb-100',
 'RSB-75':'ammunition_laser_rsb-75','SAB-50':'ammunition_laser_sab-50',
 'R-310':'ammunition_rocket_r-310','PLT-2026':'ammunition_rocket_plt-2026',
 'PLT-2021':'ammunition_rocket_plt-2021','PLT-3030':'ammunition_rocket_plt-3030',
 'HSTRM-01':'ammunition_rocketlauncher_hstrm-01','UBR-100':'ammunition_rocketlauncher_ubr-100',
 'ECO-10':'ammunition_rocketlauncher_eco-10','PLD-8':'ammunition_specialammo_pld-8',
 'DCR-250':'ammunition_specialammo_dcr-250','ACM-1':'ammunition_mine_acm-01',
 'ISH-01':'equipment_extra_cpu_ish-01','EMP-01':'ammunition_specialammo_emp-01',
 'SMB-01':'ammunition_mine_smb-01','JUMP-CPU':'equipment_extra_cpu_jp-01',
 'REPAIR-CPU':'equipment_extra_repbot_rep-4','CLOAK-CPU':'equipment_extra_cpu_cl04k-xl','50CLOAK-CPU':'equipment_extra_cpu_cl04k-xl',
 'REPAIR-BOT-1':'equipment_extra_repbot_rep-1','REPAIR-BOT-2':'equipment_extra_repbot_rep-2','REPAIR-BOT-3':'equipment_extra_repbot_rep-3','REPAIR-BOT-4':'equipment_extra_repbot_rep-4',
 'ROCKET-CPU':'equipment_extra_cpu_rok-t01','AUTO-ROCKET-CPU':'equipment_extra_cpu_arol-x',
 'SLOT-CPU':'equipment_extra_cpu_sle-01','SHIELD-CPU':'equipment_extra_cpu_ish-01'
};
function itemIcon(id:string){const name=itemIconMap[id];return name?`/assets/ui/hotbar/${name}.png`:'';}
const ammoItems=[
 {id:'LCB-10',label:'X1 · RED',category:'LASERS',color:'#ff3549',icon:'◆'},
 {id:'MCB-25',label:'X2 · BLUE',category:'LASERS',color:'#268bff',icon:'◆'},
 {id:'MCB-50',label:'X3 · GREEN',category:'LASERS',color:'#34ef72',icon:'◆'},
 {id:'UCB-100',label:'X4 · WHITE',category:'LASERS',color:'#ffffff',icon:'◆'},
 {id:'RSB-75',label:'RSB · THICK',category:'LASERS',color:'#ce62ff',icon:'▰'},
 {id:'SAB-50',label:'SAB · SHIELD',category:'LASERS',color:'#32d9ff',icon:'◎'},
 ...['R-310','PLT-2026','PLT-2021','PLT-3030','HSTRM-01','UBR-100','ECO-10','PLD-8','DCR-250'].map(id=>({id,label:id,category:'ROCKETS',color:id==='PLD-8'?'#40bfff':id==='DCR-250'?'#ff536e':'#ffb74d',icon:'🚀'})),
 {id:'ACM-1',label:'ACM-1 MINE',category:'MINES',color:'#f0c76d',icon:'✹'},
 ...['EMP-M01','SAB-M01','DD-M01','SL-M01'].map(id=>({id,label:id,category:'MINES',color:'#f0c76d',icon:'✹'})),
 {id:'ISH-01',label:'INSTA SHIELD',category:'DEFENSE',color:'#39bdff',icon:'◉'},
 {id:'EMP-01',label:'EMP PULSE',category:'DEFENSE',color:'#38dbff',icon:'✺'},
 {id:'SMB-01',label:'SMART BOMB',category:'DEFENSE',color:'#f7a657',icon:'✷'},
 ...['ROCKET-CPU','AUTO-ROCKET-CPU','JUMP-CPU','REPAIR-CPU','CLOAK-CPU','SHIELD-CPU'].map(id=>({id,label:id==='CLOAK-CPU'?'Cloak (50)':id==='REPAIR-CPU'?'Repair Bot':id,category:'CPUS',color:'#88c5eb',icon:'▣'}))
];
let ammoCategory='LASERS';
const savedAudio=(()=>{try{return JSON.parse(localStorage.getItem('nexus-audio')||'{}')}catch{return {}}})();
const gameSound={enabled:savedAudio.enabled!==false,volume:Number.isFinite(savedAudio.effects)?savedAudio.effects:.28};
const hotkeyDefaults=['1','2','3','4','5','6','7','8','9','0',...Array.from({length:20},(_,i)=>'F'+(i+1))];
let hotkeys:string[]=(()=>{try{const a=JSON.parse(localStorage.getItem('nexus-hotkeys')||'null');return Array.isArray(a)&&a.length===30?a:hotkeyDefaults}catch{return hotkeyDefaults}})();
function saveAudioSettings(){localStorage.setItem('nexus-audio',JSON.stringify({enabled:gameSound.enabled,effects:gameSound.volume,music:backgroundMusic.volume}));}

const gameSfx:Record<string,string>={laser:'combatSounds-01.mp3',rocket:'combatSounds-02.mp3',select:'uiSounds-01.mp3',jump:'portalSounds-01.mp3',hit:'damageSounds-01.mp3'};
let soundUnlocked=false;
const backgroundMusic=new Audio('/assets/audio/classic/trackMMO-01.mp3');
backgroundMusic.loop=true;backgroundMusic.volume=Number.isFinite(savedAudio.music)?savedAudio.music:.09;
window.addEventListener('pointerdown',()=>{soundUnlocked=true;if(gameSound.enabled)void backgroundMusic.play().catch(()=>{});},{once:true});
window.addEventListener('keydown',()=>{soundUnlocked=true},{once:true});
let laserAudioContext:AudioContext|undefined;
function playGameSfx(type:string){
 if(!gameSound.enabled||!soundUnlocked)return;
 if(type==='laser'){
   try{laserAudioContext??=new AudioContext();const ctx=laserAudioContext,now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sawtooth';osc.frequency.setValueAtTime(1150,now);osc.frequency.exponentialRampToValueAtTime(190,now+.14);gain.gain.setValueAtTime(Math.max(.001,gameSound.volume*.11),now);gain.gain.exponentialRampToValueAtTime(.001,now+.15);osc.connect(gain).connect(ctx.destination);osc.start(now);osc.stop(now+.16);}catch(e){console.warn('Laser sound',e);}const clip=new Audio('/assets/audio/classic/combatSounds-05.mp3');clip.volume=gameSound.volume*.25;void clip.play().catch(()=>{});return;
 }
 const file=gameSfx[type];if(!file)return;const a=new Audio('/assets/audio/classic/'+file);a.volume=gameSound.volume;void a.play().catch(()=>{});
}
let selectedHotbar=0;let hotbarItems:string[]=['LCB-10','MCB-25','MCB-50','UCB-100','PLT-2021','PLT-3030'];
let hotbarCategory='LASERS';
function drawCategoryDrawer(){
 document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(b=>b.classList.toggle('active',b.dataset.category===hotbarCategory));
 const drawer=document.querySelector<HTMLElement>('#category-drawer')!;drawer.replaceChildren();
 for(const item of ammoItems.filter(x=>x.category===hotbarCategory&&x.id!=='SLOT-CPU'&&x.id!=='50CLOAK-CPU')){
  const tile=document.createElement('button');tile.className='drawer-item';tile.draggable=true;tile.title='Drag '+item.id+' onto a numbered slot';
  const glyph=document.createElement('strong');const image=itemIcon(item.id);if(image){const img=document.createElement('img');img.src=image;img.alt='';img.className='item-icon';glyph.append(img);}else{glyph.textContent=item.icon;glyph.style.color=item.color;}
  const label=document.createElement('span');label.textContent=item.id==='CLOAK-CPU'?'CLOAK (50)':item.id==='REPAIR-CPU'?'REPAIR BOT':item.id;
  const qty=document.createElement('small');qty.textContent=profile?.ammo?.[item.id]!==undefined?fmt(profile.ammo[item.id]):'';
  tile.append(glyph,label,qty);
  tile.addEventListener('dragstart',e=>{e.dataTransfer?.setData('text/plain',item.id);});
  tile.addEventListener('click',()=>{hotbarItems[selectedHotbar]=item.id;drawHotbar();sendGame({type:'hotbar',items:hotbarItems});});
  drawer.append(tile);
 }
}
function drawHotbar(){
 document.querySelectorAll<HTMLButtonElement>('.slot').forEach((b,i)=>{
  const item=ammoItems.find(x=>x.id===hotbarItems[i]);const icon=b.querySelector<HTMLElement>('strong')!;
  const image=item?itemIcon(item.id):'';icon.replaceChildren();if(image){const img=document.createElement('img');img.src=image;img.alt='';img.className='item-icon';icon.append(img);icon.style.color='';}else{icon.textContent=item?.icon??'–';icon.style.color=item?.color??'';}
  b.querySelector<HTMLElement>('.slot-name')!.textContent=item?.id==='CLOAK-CPU'?'Cloak':item?.id==='REPAIR-CPU'?'Repair Bot':item?.id??'';
  const amount=b.querySelector<HTMLElement>('.slot-quantity')!;
  const count=item?profile?.ammo?.[item.id]:undefined;
  amount.textContent=typeof count==='number'?count.toLocaleString('en-US'):'';
  b.classList.toggle('stock-high',typeof count==='number'&&count>10000);
  b.classList.toggle('stock-low',typeof count==='number'&&count<10);
  b.classList.toggle('stock-medium',typeof count==='number'&&count>=10&&count<=10000);
  b.dataset.item=item?.id??'';b.title=item?.label??'Drag an item here';b.disabled=false;b.draggable=!!item;
  b.classList.toggle('selected',i===selectedHotbar);b.hidden=i>=10&&!(profile&&profile.premiumUntil>Date.now());
 });
 drawCategoryDrawer();
}
function useSelected(){
 if(selectedHotbar>=10&&!(profile&&profile.premiumUntil>Date.now()))return;const id=hotbarItems[selectedHotbar];if(!id)return;
 const item=ammoItems.find(x=>x.id===id);if(!item)return;
 if(['ISH-01','EMP-01','SMB-01','ACM-1','EMP-M01','SAB-M01','DD-M01','SL-M01'].includes(id)){sendGame({type:'special',item:id});return;}
 if(item.category==='CPUS'){console.info(`${id}: CPU mechanics are not implemented yet.`);return;}
 if(!selectedNpcId)return;
 if(item.category==='ROCKETS')sendGame({type:'rocket',id:selectedNpcId,rocket:id});
 else if(item.category==='LASERS')sendGame({type:'attack',id:selectedNpcId,ammo:id});
}
function activateSlot(i:number){selectedHotbar=i;drawHotbar();}
drawHotbar();
document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(b=>b.addEventListener('click',()=>{hotbarCategory=b.dataset.category!;drawCategoryDrawer();}));
document.querySelectorAll<HTMLButtonElement>('.slot').forEach((b,i)=>{
 b.addEventListener('click',()=>{if(selectedHotbar===i)useSelected();else activateSlot(i);});
 b.addEventListener('dragstart',e=>{if(hotbarItems[i])e.dataTransfer?.setData('text/plain',hotbarItems[i]);});
 b.addEventListener('dragover',e=>{e.preventDefault();b.classList.add('drop-target');});
 b.addEventListener('dragleave',()=>b.classList.remove('drop-target'));
 b.addEventListener('drop',e=>{e.preventDefault();b.classList.remove('drop-target');const id=e.dataTransfer?.getData('text/plain');if(!id||!ammoItems.some(x=>x.id===id)||i>=10&&!(profile&&profile.premiumUntil>Date.now()))return;hotbarItems[i]=id;selectedHotbar=i;drawHotbar();sendGame({type:'hotbar',items:hotbarItems});});
});
window.addEventListener('keydown',e=>{
 if(e.code==='Tab' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLSelectElement)){e.preventDefault();document.querySelector('#hotbar')!.classList.toggle('drawer-hidden');return;}
 if(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)return;
 if(e.code==='Space'||e.code==='ControlLeft'||e.code==='ControlRight'){e.preventDefault();if(e.repeat)return;autoFire=!!selectedNpcId&&!autoFire;if(autoFire){nextAutoShot=0;playGameSfx('select');}return;}
 const i=hotkeys.findIndex(k=>k.toLowerCase()===e.key.toLowerCase());if(i>=0&&(i<10||!!profile&&profile.premiumUntil>Date.now())){e.preventDefault();activateSlot(i);useSelected();}
});
document.querySelector('#collapse')!.addEventListener('click',()=>{ const panel=document.querySelector('#hotbar')!;panel.classList.toggle('drawer-hidden');(document.querySelector('#collapse') as HTMLButtonElement).textContent=panel.classList.contains('drawer-hidden')?'▾':'▴'; });
document.querySelector('#group-close')!.addEventListener('click',()=>document.querySelector('#group-panel')!.classList.toggle('group-collapsed'));
document.querySelector('#group-refresh')!.addEventListener('click',()=>updateGroupRoster());
document.querySelector('#group-leave')!.addEventListener('click',()=>{document.querySelector('#group-members')!.textContent='No group joined. Use Nearby pilots to view other pilots.';});
document.querySelectorAll<HTMLButtonElement>('[data-quest-tab]').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('[data-quest-tab]').forEach(x=>x.classList.toggle('active',x===b));
 const body=document.querySelector<HTMLElement>('#mission-body')!;
 body.hidden=b.dataset.questTab!=='description';
 let extra=document.querySelector<HTMLElement>('#quest-extra');
 if(!extra){extra=document.createElement('div');extra.id='quest-extra';document.querySelector('#mission')!.append(extra);}
 extra.hidden=b.dataset.questTab==='description';
 extra.textContent=b.dataset.questTab==='overview'?'Annihilation of Streuner · defeat one enemy to complete your starter quest.':b.dataset.questTab==='reward'?'Starter mission reward is granted by the server on completion.':'';
}));


bootStage(20,'STARTING RENDER ENGINE…');
const app = new Application();
await app.init({ resizeTo: window, background: '#020712', antialias: true });
root.prepend(app.canvas);
const world = new Container();
app.stage.addChild(world);
const stars = new Graphics();
let seed = 12345;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
for (let i = 0; i < 1450; i++) { const x = rand() * WORLD_WIDTH, y = rand() * WORLD_HEIGHT; stars.circle(x, y, rand() * 1.4 + 0.3).fill({ color: rand() > .85 ? 0x7abaff : 0xc5dcff, alpha: .3 + rand() * .6 }); }
// Sector art from the supplied Solvyra/Virelion map pack.
// Server-authoritative sectors and jump gates; faction map connections are provisional
// because their portal fields were empty in the supplied SQL.
const sectorIds=[...Array.from({length:8},(_,i)=>`1-${i+1}`),...Array.from({length:8},(_,i)=>`3-${i+1}`),'4-1','4-3','4-4'];
let activeSector='3-1';
let portals:import('../../shared/protocol.js').PortalState[]=[];
const sectorArt=new Sprite(await Assets.load('/assets/nexus-space/3-1.webp'));
sectorArt.width=WORLD_WIDTH;sectorArt.height=WORLD_HEIGHT;sectorArt.visible=prefs.mapBackground;world.addChild(sectorArt);
function applyPrefs(){sectorArt.visible=prefs.mapBackground;grid.visible=prefs.grid;showLabels=prefs.labels;portalLayer.visible=prefs.portals;for(const v of npcVisuals.values())v.visible=prefs.npcs;for(const v of visuals.values()){v.art.children[1].visible=false;v.art.children[2].visible=false;v.art.children[3].visible=true;}}
const sx=(x:number)=>x*WORLD_WIDTH/22000;
const sy=(y:number)=>y*WORLD_HEIGHT/15000;
const stationLayer=new Container();world.addChild(stationLayer);
const baseStations:Record<string,{x:number;y:number;label:string;faction:'mars'|'venus';verified:boolean}>={
 '1-1':{x:520,y:520,label:'MARS BASE',faction:'mars',verified:false},
 '1-8':{x:WORLD_WIDTH-580,y:WORLD_HEIGHT-530,label:'MARS OUTPOST',faction:'mars',verified:false},
 '3-1':{x:WORLD_WIDTH-550,y:WORLD_HEIGHT-470,label:'VENUS BASE',faction:'venus',verified:false},
 '3-8':{x:WORLD_WIDTH-580,y:WORLD_HEIGHT-530,label:'VENUS OUTPOST',faction:'venus',verified:false},
 '4-1':{x:sx(1600),y:sy(1600),label:'MARS PVP STATION',faction:'mars',verified:true},
 '4-3':{x:sx(19500),y:sy(11600),label:'VENUS PVP STATION',faction:'venus',verified:true}
};
const marsStationTexture=await Assets.load('/assets/stations/station-red.png');
const venusStationTexture=await Assets.load('/assets/stations/station-green.png');
const marsEnergyTexture=await Assets.load('/assets/stations/station-energy-orange.png');
const venusEnergyTexture=await Assets.load('/assets/stations/station-energy-green.png');
let stationEnergy:Sprite|null=null;
function drawStations(){stationLayer.removeChildren().forEach(c=>c.destroy({children:true}));stationEnergy=null;const base=baseStations[activeSector];if(!base)return;const station=new Sprite(base.faction==='mars'?marsStationTexture:venusStationTexture);
 station.anchor.set(.5);station.width=700;station.height=805;station.position.set(base.x,base.y);stationLayer.addChild(station);
 stationEnergy=new Sprite(base.faction==='mars'?marsEnergyTexture:venusEnergyTexture);
 stationEnergy.anchor.set(.5);stationEnergy.width=315;stationEnergy.height=265;
 stationEnergy.position.set(base.x+80,base.y-180);stationEnergy.alpha=.68;stationLayer.addChild(stationEnergy);
 const perimeter=new Graphics().circle(0,0,460).stroke({color:base.faction==='mars'?0xff6959:0x4af2a1,width:5,alpha:.45});
 perimeter.position.set(base.x,base.y);stationLayer.addChild(perimeter);
 const innerRing=new Graphics().circle(0,0,350).stroke({color:base.faction==='mars'?0xffc09c:0x9cffd0,width:2,alpha:.5});
 innerRing.position.set(base.x,base.y);stationLayer.addChild(innerRing);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const turret=new Graphics().circle(0,0,12).fill({color:base.faction==='mars'?0xf77950:0x5affac,alpha:.95}).circle(0,0,20).stroke({color:0xb8e9ff,width:2,alpha:.7});turret.position.set(base.x+Math.cos(a)*350,base.y+Math.sin(a)*350);stationLayer.addChild(turret);}

 const beacon=new Graphics().circle(0,0,32).stroke({color:0xcafaff,width:7,alpha:.8}).circle(0,0,16).fill({color:0x79deff,alpha:.3});
 beacon.position.set(base.x,base.y-110);stationLayer.addChild(beacon);
 const tag=new Text({text:base.label+(base.verified?'':' • LOCATION PROVISIONAL'),style:{fontSize:25,fontWeight:'bold',fill:base.faction==='mars'?0xffb9a4:0x98ffa2,stroke:{color:0x03120a,width:5}}});tag.anchor.set(.5);tag.position.set(station.x,station.y+315);stationLayer.addChild(tag);}

drawStations();
const portalLayer=new Container();world.addChild(portalLayer);
const sectorPicker=document.createElement('select');sectorPicker.id='sector-preview';
sectorPicker.title='Current sector (travel by flying to a portal and pressing J)';
sectorPicker.style.cssText='position:fixed;right:18px;top:55px;z-index:110;background:#081522;color:#b9e9ff;border:1px solid #2c6684;border-radius:5px;padding:5px 8px;font:12px Arial';
for(const id of sectorIds){const option=document.createElement('option');option.value=id;option.textContent=id;sectorPicker.appendChild(option);}
sectorPicker.disabled=true;sectorPicker.value=activeSector;document.body.appendChild(sectorPicker);
let sectorLoadSerial=0;
async function setSector(id:string){
 if(!sectorIds.includes(id))return;
 const serial=++sectorLoadSerial;activeSector=id;sectorPicker.value=id;document.querySelector('#mini-sector')!.textContent=id;
 const background=`/assets/nexus-space/${id}.webp`;document.querySelector('#mini-live')!.textContent=id+' 000/000';
 miniBackground.src=background;const texture=await Assets.load(background);if(serial!==sectorLoadSerial)return;sectorArt.texture=texture;
 sectorArt.width=WORLD_WIDTH;sectorArt.height=WORLD_HEIGHT;
 miniBackground.src=background; // Exact same image as main game, not a separate minimap texture.
 drawStations();document.querySelector('#mini-sector')!.textContent=id;
}
// Original 20-frame transparent portal animation supplied by the player.
// The supplied portal animation contains 20 frames (00–19), not 30.
const portalIdleFrames=await Promise.all(Array.from({length:20},(_,i)=>Assets.load(`/assets/portal-animated/portal_${String(i).padStart(2,'0')}.png`)));
const animatedPortalSprites:Sprite[]=[];
const nexusGateTexture=await Assets.load('/assets/nexus-gate-ring.png');

const jumpFrames=await Promise.all(Array.from({length:32},(_,i)=>Assets.load(`/assets/portal-jump/${String(i+1).padStart(2,'0')}.webp`)));
let jumpEffect:Sprite|null=null;
function playJumpEffect(x:number,y:number){
 if(jumpEffect){jumpEffect.destroy();jumpEffect=null;}
 const sprite=new Sprite(jumpFrames[0]);sprite.anchor.set(.5);sprite.position.set(x,y);sprite.width=280;sprite.height=280;world.addChild(sprite);jumpEffect=sprite;
 const started=performance.now();
 const animate=(now:number)=>{if(jumpEffect!==sprite)return;const elapsed=now-started;const frame=Math.min(31,Math.floor(elapsed/38));sprite.texture=jumpFrames[frame];sprite.alpha=1-Math.max(0,(elapsed-900)/320);if(elapsed<1220)requestAnimationFrame(animate);else{sprite.destroy();if(jumpEffect===sprite)jumpEffect=null;}};
 requestAnimationFrame(animate);
}
function drawPortals(){animatedPortalSprites.length=0;portalLayer.removeChildren().forEach(c=>c.destroy({children:true}));for(const gate of portals){const c=new Container();c.position.set(gate.x,gate.y);const glow=new Sprite(portalIdleFrames[0]);glow.anchor.set(.5);glow.width=116;glow.height=116;glow.alpha=.83;c.addChild(glow);animatedPortalSprites.push(glow);const ring=new Sprite(nexusGateTexture);ring.anchor.set(.5);ring.width=220;ring.height=212;c.addChild(ring);const t=new Text({text:`J → ${gate.target}${gate.verified?'':' *'}`,style:{fontSize:15,fontWeight:'bold',fill:0xd5f4ff,stroke:{color:0x001020,width:4}}});t.anchor.set(.5);t.y=124;c.addChild(t);portalLayer.addChild(c);}}

world.addChild(stars);
// Procedural deep-space clouds and a distant planet; original vector graphics.
const scenery=new Container();
const nebula=new Graphics();
for(let i=0;i<110;i++){
 const a=rand()*Math.PI*2, radius=rand()*470;
 nebula.circle(WORLD_WIDTH*.66+Math.cos(a)*radius,WORLD_HEIGHT*.38+Math.sin(a)*radius*.6,35+rand()*95)
   .fill({color:i%3===0?0x3757a1:i%3===1?0x532a83:0x146d89,alpha:.009+rand()*.018});
}
scenery.addChild(nebula);
const planet=new Graphics().circle(0,0,210).fill(0x122a4c).circle(-45,-45,140).fill({color:0x365a85,alpha:.3})
 .ellipse(0,0,310,75).stroke({color:0x77a7ca,width:17,alpha:.24});
planet.position.set(WORLD_WIDTH*.82,WORLD_HEIGHT*.2);scenery.addChild(planet);
// Hide procedural scenery so the uploaded map artwork remains visible.
scenery.visible=false;world.addChild(scenery);
const grid = new Graphics();
for (let x = 0; x <= WORLD_WIDTH; x += 500) grid.moveTo(x, 0).lineTo(x, WORLD_HEIGHT);
for (let y = 0; y <= WORLD_HEIGHT; y += 500) grid.moveTo(0, y).lineTo(WORLD_WIDTH, y);
grid.stroke({ width: 1, color: 0x144061, alpha: .35 });grid.visible=prefs.grid;
// No bright map boundary: the world edge is enforced by the server.
world.addChild(grid);
const shipsLayer = new Container(); world.addChild(shipsLayer);
// Sprite sheet orientation verified against the 32 exported Phoenix images:
// frame 0 = left, 8 = up, 16 = right, 24 = down.
const headings=new Map<string,number>();
const turnRate=Math.PI*3.5; // radians/second; turn through adjacent frames
const wrapAngle=(angle:number)=>Math.atan2(Math.sin(angle),Math.cos(angle));
// Smooth server snapshots locally instead of displaying 20Hz position jumps.
const renderPositions=new Map<string,{x:number;y:number;lastX:number;lastY:number}>();
let cameraX=NaN, cameraY=NaN;

const visuals = new Map<string, { drones:Container; body: Container; label: Text; art: Container; nameplate: Container; ringTexts:Text[]; faction:Sprite; title:Text; exhaust:Container; flame:Graphics; glow:Graphics }>();
const starfighterTexture=await Assets.load('/assets/starfighter.png');
// v1.6.5: one static artwork frame per type. No animation or directional swaps.
// These URLs refer to client/public/assets/drones/swf/ in the local Vite project.
const droneTextures={
  iris:await Assets.load('/assets/drones/swf/iris-00.png'),
  flax:await Assets.load('/assets/drones/swf/flax-00.png')
};
const droneLoadout=()=>{try{const x=JSON.parse(localStorage.getItem('orbit-drone-loadout')||'null');if(x&&['iris','flax'].includes(x.type))return {type:x.type as 'iris'|'flax',count:Math.max(0,Math.min(8,Number(x.count)||0)),level:Math.max(1,Math.min(6,Number(x.level)||1))};}catch{}return {type:'iris' as const,count:0,level:1};};
const makePhoenixCustom=()=>{
  // Distinctive hand-drawn "Emberwing" starter fighter: ivory ceramic armour,
  // crimson swept wings, dark cockpit and luminous twin nacelles.
  const g=new Graphics();
  g.moveTo(48,0).lineTo(27,-8).lineTo(8,-12).lineTo(-11,-15).lineTo(-34,-31).lineTo(-30,-10).lineTo(-43,-6).lineTo(-43,6).lineTo(-30,10).lineTo(-34,31).lineTo(-11,15).lineTo(8,12).lineTo(27,8).closePath().fill(0x293442).stroke({color:0x070e19,width:3});
  for(const side of [-1,1]){
    g.moveTo(6,side*8).lineTo(-13,side*13).lineTo(-34,side*29).lineTo(-27,side*8).closePath().fill(0xe5e8e4).stroke({color:0x981e2b,width:2});
    g.moveTo(-8,side*13).lineTo(-31,side*27).lineTo(-28,side*12).closePath().fill(0xc52638);
    g.moveTo(25,side*6).lineTo(-18,side*9).lineTo(-26,side*5).lineTo(16,side*3).closePath().fill(0xe9e8df).stroke({color:0x778a9b,width:1});
    g.roundRect(-33,side*5-3,12,5,2).fill(0x116dba).stroke({color:0x78e6ff,width:1});
    g.moveTo(16,side*5).lineTo(-10,side*8).stroke({color:0xe64b34,width:2});
    g.circle(-36,side*4,3).fill(0x52cfff);
  }
  g.moveTo(45,0).lineTo(23,-5).lineTo(1,-5).lineTo(-8,0).lineTo(1,5).lineTo(23,5).closePath().fill(0xf0ede3).stroke({color:0x9e2333,width:2});
  g.moveTo(23,0).lineTo(6,-5).lineTo(-7,0).lineTo(6,5).closePath().fill(0x071626).stroke({color:0x56baf2,width:1.5});
  g.moveTo(14,-2).lineTo(0,-2).stroke({color:0x79e6ff,width:1});
  g.roundRect(-22,-3,12,6,2).fill(0x172333).stroke({color:0xffa63d,width:1});
  g.moveTo(40,0).lineTo(51,0).stroke({color:0x93e9ff,width:2});
  return g;
};
const badgeTextures={venus:await Assets.load('/assets/venus-badge-custom.png'),mars:await Assets.load('/assets/mars-badge.png')};
const rankTextures=await Promise.all(Array.from({length:30},(_,i)=>Assets.load(`/assets/ranks/${String(i+1).padStart(2,'0')}.png`).catch(()=>Assets.load('/assets/ranks/01.png'))));
// Inferno is an original vector ship. The classic Phoenix PNGs are intentionally
// not loaded or displayed, so the visible hull is not a recolour of that artwork.
function makeInfernoHull(): Graphics {
  const g=new Graphics();
  // Nose points right in local coordinates. Entire craft turns with its heading.
  g.moveTo(35,0).lineTo(11,-8).lineTo(-5,-7).lineTo(-21,-19).lineTo(-29,-18)
   .lineTo(-22,-4).lineTo(-28,0).lineTo(-22,4).lineTo(-29,18)
   .lineTo(-21,19).lineTo(-5,7).lineTo(11,8).closePath()
   .fill({color:0x181b21}).stroke({color:0x8d4430,width:1.5});
  // Split swept wings create a distinct silhouette from the Phoenix.
  for(const side of [-1,1]) {
    g.moveTo(5,side*7).lineTo(-9,side*11).lineTo(-26,side*24)
     .lineTo(-19,side*7).lineTo(-5,side*3).closePath()
     .fill({color:0x363039}).stroke({color:0xff6525,width:1.2,alpha:.9});
    g.moveTo(-8,side*9).lineTo(-20,side*19).lineTo(-15,side*8)
     .stroke({color:0xffb049,width:2,alpha:.85});
    g.moveTo(10,side*4).lineTo(-5,side*5).lineTo(-13,side*3)
     .stroke({color:0xb63820,width:2});
  }
  // Glowing molten spine and angular cockpit.
  g.moveTo(28,0).lineTo(10,-4).lineTo(-1,0).lineTo(10,4).closePath()
   .fill({color:0x692b1a}).stroke({color:0xffa03d,width:1.2});
  g.moveTo(19,0).lineTo(7,-2).lineTo(3,0).lineTo(7,2).closePath()
   .fill({color:0xffd36c});
  g.moveTo(-4,0).lineTo(-16,0).stroke({color:0xff7028,width:3});
  g.circle(-16,-5,2).circle(-16,5,2).fill({color:0xffae42});
  return g;
}
const classicShipFrames=await Promise.all(Array.from({length:32},(_,i)=>Assets.load('/assets/ship1/'+(i*2+1)+'.png')));
// Thirty-two transparent heading frames per ship, generated from user-provided 128x128 artwork.
// These are 2D heading rotations, not true multi-angle 3D renders.
bootStage(55,'LOADING SHIPS AND COMBAT ASSETS…');
const shipHeadingTextures=await Promise.all(Array.from({length:10},(_,ship)=>Promise.all(
  Array.from({length:32},(_,frame)=>Assets.load(`/assets/ship-frames/${ship+1}/${String(frame).padStart(2,'0')}.png`))
)));
// Company-specific red Orion Reach and green Virellon directional ship artwork.
const factionShipHeadingTextures:Record<'mars'|'venus',typeof shipHeadingTextures>={
 mars:await Promise.all(Array.from({length:10},(_,ship)=>Promise.all(Array.from({length:32},(_,frame)=>Assets.load(`/assets/ship-factions/mars/${ship+1}/${String(frame).padStart(2,'0')}.png`))))),
 venus:await Promise.all(Array.from({length:10},(_,ship)=>Promise.all(Array.from({length:32},(_,frame)=>Assets.load(`/assets/ship-factions/venus/${ship+1}/${String(frame).padStart(2,'0')}.png`)))))
};
const shipIdTextures=shipHeadingTextures.map(frames=>frames[0]);
const shipIdIndex:Record<string,number>={phoenix:0,yamato:1,leonov:2,defcom:3,liberator:4,piranha:5,nostromo:6,vengeance:7,bigboy:8,goliath:9};
const factionTextures={mars:await Assets.load('/assets/solvyra-planet-badge.png'),venus:await Assets.load('/assets/virelion-planet-badge.png')};
let myId = '';
let npcs: NpcState[] = [];let selectedNpcId: string|null=null;let autoFire=false;let nextAutoShot=0;let missionComplete=false;let showLabels=true;

const savePrefs=()=>localStorage.setItem('orbit-display-prefs',JSON.stringify(prefs));
type NpcState={id:string;x:number;y:number;hp:number;maxHp:number;name?:string;shield?:number;maxShield?:number};
const npcVisuals=new Map<string,Container>();
const npcTextures=new Map<string,any>();
const npcFacing=new Map<string,{x:number;y:number;angle:number}>();
const npcArtToken=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]/g,'');
async function preloadNpcArt(sector:string){
 const artSector=sector.startsWith('3-')?'1-'+sector.split('-')[1]:sector;
 try{const response=await fetch('/assets/npcs/manifest.json');const data=await response.json();for(const name of (data[artSector]??[])){
  const path=`/assets/npcs/${artSector}/${name.replaceAll(' ','_')}.png`;
  if(!npcTextures.has(artSector+':'+npcArtToken(name)))npcTextures.set(artSector+':'+npcArtToken(name),await Assets.load(path));
 }}catch(e){console.warn('NPC sprite load',e);}
}

// Daily login calendar. Claim validation and reward grants happen on the server.
const dailyOverlay=document.createElement('section');dailyOverlay.id='daily-calendar';dailyOverlay.hidden=true;
dailyOverlay.innerHTML=`<div class="daily-card"><header><span>◈ NEXUS ORBIT</span><button id="daily-close" aria-label="Close calendar">✕</button></header><h2>DAILY LOGIN REWARDS</h2><p>Claim today's reward. The calendar resets every UTC month. Premium pilots get an extra bonus on day 30.</p><div class="daily-progress" id="daily-progress"></div><div class="daily-grid" id="daily-grid"></div><div class="daily-footer"><span id="daily-status"></span><button id="daily-claim">CLAIM TODAY'S REWARD</button></div></div>`;
document.body.appendChild(dailyOverlay);
let calendarOpenedForMonth='';
const utcToday=()=>new Date().getUTCDate();
function renderDailyCalendar(open=false){
 if(!profile)return;
 const month=new Date().toISOString().slice(0,7),today=utcToday();
 const claimed=profile.dailyRewards?.month===month?profile.dailyRewards.claimedDays:[];
 const premium=profile.premiumUntil>Date.now();
 document.querySelector('#daily-progress')!.textContent=`${month} · ${claimed.length}/30 claimed · ${premium?'PREMIUM ACTIVE':'STANDARD PILOT'}`;
 document.querySelector('#daily-grid')!.innerHTML=Array.from({length:30},(_,i)=>{const day=i+1,done=claimed.includes(day),current=day===today,bonus=day===30;
 const uri=bonus?3000:day%5===0?250:50+day*10;
 return `<div class="daily-day ${done?'claimed':''} ${current?'today':''} ${bonus?'milestone':''}"><small>DAY ${day}</small><strong>${bonus?'★':day%5===0?'◆':'✦'}</strong><span>${uri.toLocaleString()} URI</span>${bonus?'<em>PREMIUM EXTRA</em>':''}${done?'<b>✓ CLAIMED</b>':''}</div>`}).join('');
 const canClaim=today<=30&&!claimed.includes(today);
 const btn=document.querySelector<HTMLButtonElement>('#daily-claim')!;btn.disabled=!canClaim;btn.textContent=canClaim?`CLAIM DAY ${today}`:today>30?'CALENDAR COMPLETE':`DAY ${today} CLAIMED`;
 document.querySelector('#daily-status')!.textContent=today>30?'Come back next month for a fresh calendar.':`Today is day ${today} (UTC).`;
 if(open)dailyOverlay.hidden=false;
}
dailyOverlay.querySelector('#daily-close')!.addEventListener('click',()=>dailyOverlay.hidden=true);
let awaitingDailyClaim=false;
dailyOverlay.querySelector('#daily-claim')!.addEventListener('click',()=>{if(utcToday()<=30){awaitingDailyClaim=true;const b=document.querySelector<HTMLButtonElement>('#daily-claim')!;b.disabled=true;b.textContent='CLAIMING…';sendGame({type:'claimDaily',day:utcToday()});}});
const dailyOpenButton=document.createElement('button');dailyOpenButton.id='daily-open';dailyOpenButton.textContent='🎁 DAILY REWARDS';dailyOpenButton.addEventListener('click',()=>renderDailyCalendar(true));document.body.appendChild(dailyOpenButton);
const combatEffects:{sourceId:string;targetId:string;item:string;started:number;damage?:number}[]=[];
const shipEffects=new Map<string,{item:string;until:number}>();
const combatLayer=new Graphics();world.addChild(combatLayer);
const mineLayer=new Graphics();world.addChild(mineLayer);
const visibleMines=new Map<string,{x:number;y:number;item:string}>();

const selectionRing=new Graphics().circle(0,0,44).stroke({color:0xff6678,width:2,alpha:.9});selectionRing.visible=false;shipsLayer.addChild(selectionRing);
let players: PlayerState[] = [];
let zoom = 1;
let retry = 0;
bootStage(85,'CONNECTING TO GAME SERVER…','Opening multiplayer connection');
function connect() {
  const url = import.meta.env.VITE_WS_URL || `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:8080`;
  socket = new WebSocket(url);
  socket.onopen = () => { bootStage(94,'AUTHENTICATING PILOT…','Waiting for server handshake'); retry = 0; document.querySelector('#status')!.textContent = '● Online'; if(identity)sendGame({type:'identity',...identity,token:localStorage.getItem('orbit-session')}); };
  socket.onclose = () => { if(!bootFinished)bootStage(85,'RECONNECTING TO SERVER…','Make sure npm run dev is running in the server folder');document.querySelector('#status')!.textContent = '● Reconnecting'; setTimeout(connect, Math.min(1000 * 2 ** retry++, 10000)); };
  socket.onmessage = async event => {
    let message: ServerMessage;
    try { message = JSON.parse(event.data); } catch { return; }
    if (message.type === 'welcome') { visibleMines.clear(); bootStage(98,'SYNCING GALAXY…');myId = message.id; profile = message.profile;hotbarItems=profile.hotbar||hotbarItems;drawHotbar();portals=message.portals;void setSector(message.mapId);drawPortals();void preloadNpcArt(message.mapId);refreshHud(); renderPanel(); bootReady(); }
    if((message as any).type==='auth-error'){localStorage.removeItem('orbit-session');location.href='/account/login.html';return;}
    if(message.type==='map'){visibleMines.clear();portals=message.portals;void setSector(message.mapId);drawPortals();void preloadNpcArt(message.mapId);selectedNpcId=null;autoFire=false;renderPositions.clear();}
    if (message.type === 'profile') { const wasClaiming=awaitingDailyClaim;awaitingDailyClaim=false;profile=message.profile;renderDailyCalendar();if(wasClaiming && profile.dailyRewards?.claimedDays.includes(utcToday()))dailyOverlay.hidden=true;if(!calendarOpenedForMonth){calendarOpenedForMonth=new Date().toISOString().slice(0,7);renderDailyCalendar(true);}hotbarItems=profile.hotbar||hotbarItems;drawHotbar(); refreshHud(); if(message.notice){shopNotice=message.notice;console.info(message.notice);}if(!popup.hidden&&(activeTab==='Shop'||activeTab==='Hangar'||activeTab==='HangarManage'))renderPanel(); }
    if (message.type === 'welcome' || message.type === 'snapshot') {players = message.players;npcs=message.npcs;}
    if(message.type==='mine'){if(message.active)visibleMines.set(message.id,{x:message.x,y:message.y,item:message.item});else visibleMines.delete(message.id);}
    if(message.type==='combat'){combatEffects.push({sourceId:message.sourceId,targetId:message.targetId,item:message.item,started:performance.now(),damage:message.damage});if(message.targetId===myId)playGameSfx('hit');if(message.sourceId===myId)playGameSfx(['R-310','PLT-2026','PLT-2021','PLT-3030','PLD-8','DCR-250','HSTRM-01','UBR-100','ECO-10'].includes(message.item)?'rocket':'laser');}
     if(message.type==='effect'){shipEffects.set(message.playerId,{item:message.item,until:message.until});}
     if(message.type==='mission'){missionComplete=message.completed;document.querySelector('#mission-progress')!.textContent=message.completed?'1/1 ✓':'0/1';renderPanel();}
  };
}
connect();
function ship(color: number) {
  const body = new Container();
  const art = new Container();
  
  // Exhaust is behind the hull and follows the actual movement heading.
  const exhaust=new Container();
  const glow=new Graphics();const flame=new Graphics();
  exhaust.addChild(glow,flame);art.addChild(exhaust);
  const hull=new Sprite(starfighterTexture);hull.anchor.set(.62,.5);hull.width=68;hull.height=34;art.addChild(hull);const customHull=makePhoenixCustom();customHull.visible=false;art.addChild(customHull);const classicHull=new Sprite(shipIdTextures[0]);classicHull.anchor.set(.5);classicHull.width=145;classicHull.height=145;art.addChild(classicHull);hull.visible=false;customHull.visible=false;classicHull.visible=true;
  // Twin hull-mounted cannon housings. They rotate with the ship's facing.
  // Firing ports are cosmetic; the number of active beams is limited by fitted lasers.
  const cannons=new Container();
  for(const side of [-1,1]){
    const barrel=new Graphics();
    barrel.roundRect(12,side*11-2,14,4,1).fill(0x314b61).stroke({color:0x78a6bc,width:.6});
    barrel.roundRect(23,side*11-1,6,2,1).fill(0x8aa6b7);
    barrel.circle(29,side*11,1).fill(0x7ce8ff);
    cannons.addChild(barrel);
  }
  art.addChild(cannons);cannons.visible=false;
  art.scale.set(1);
  body.addChild(art);
  const drones=new Container();body.addChildAt(drones,0);
  // DarkOrbit-inspired compact nameplate, anchored as a single unit to the ship.
  // Title sits above the username, while the rank, name and badge form one row.
  const nameplate=new Container();nameplate.y=35;body.addChild(nameplate);
  const title=new Text({text:'<NexusOrbit2026>',style:{fontFamily:'Arial, sans-serif',fontSize:12,fontWeight:'bold',fill:0x7c38b8,stroke:{color:0x10051b,width:3},dropShadow:{color:0x260a44,alpha:.7,blur:2,distance:1,angle:Math.PI/2}}});
  title.anchor.set(.5);title.position.set(0,49);nameplate.addChild(title);
  const rings:Text[]=[];
  for(let i=0;i<6;i++){
    const ring=new Text({text:'◎',style:{fontFamily:'Arial',fontSize:8,fontWeight:'bold',fill:0x879b8c,stroke:{color:0x050c0b,width:1.5}}});
    ring.anchor.set(.5);ring.alpha=.22;
    ring.position.set(-29+(i%3-1)*7,64+Math.floor(i/3)*7);
    nameplate.addChild(ring);rings.push(ring);
  }
  const rank=new Sprite(rankTextures[0]);
  rank.anchor.set(.5);rank.width=19;rank.height=19;rank.position.set(-29,86);nameplate.addChild(rank);
  const label=new Text({text:'',style:{fontFamily:'Arial, sans-serif',fontSize:13,fontWeight:'bold',fill:0xf5f5f5,stroke:{color:0x050505,width:3.5},dropShadow:{color:0x000000,alpha:.9,blur:1,distance:1,angle:Math.PI/2}}});
  label.anchor.set(.5,.5);label.position.set(0,86);nameplate.addChild(label);
  const faction=new Sprite(badgeTextures.venus);
  faction.anchor.set(.5);faction.width=16;faction.height=16;faction.position.set(29,86);nameplate.addChild(faction);const playerHpText=new Text({text:'',style:{fontFamily:'Arial',fontSize:11,fontWeight:'bold',fill:0x52f27c,stroke:{color:0x001307,width:2}}});playerHpText.anchor.set(.5);playerHpText.position.set(0,104);nameplate.addChild(playerHpText);
  const playerShieldText=new Text({text:'',style:{fontFamily:'Arial',fontSize:11,fontWeight:'bold',fill:0x57baff,stroke:{color:0x001322,width:2}}});playerShieldText.anchor.set(.5);playerShieldText.position.set(0,118);nameplate.addChild(playerShieldText);
  shipsLayer.addChild(body);
  return {body,label,art,drones,nameplate,ringTexts:rings,faction,title,exhaust,flame,glow};
}
function updateGroupRoster(){
 const host=document.querySelector<HTMLElement>('#group-members')!;
 const nearby=players.filter(p=>p.id!==myId&&p.mapId===activeSector);
 host.replaceChildren();
 if(!nearby.length){host.textContent='No nearby pilots. Group invitations are not enabled yet.';return;}
 for(const pilot of nearby.slice(0,8)){
   const item=document.createElement('div');item.className='group-member';
   const name=document.createElement('b');name.textContent=pilot.username||'Pilot';
   const hp=document.createElement('span');hp.textContent=`HP ${Math.ceil(pilot.hp).toLocaleString()} · SHD ${Math.ceil(pilot.shield).toLocaleString()}`;
   item.append(name,hp);host.append(item);
 }
}
const smoothShipHeadings=new Map<string,number>();
const canvas = app.canvas;
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || socket?.readyState !== WebSocket.OPEN || !myId) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left - world.x) / zoom;
  const y = (event.clientY - rect.top - world.y) / zoom;
  const gate=portals.find(p=>Math.hypot(p.x-x,p.y-y)<90);if(gate){sendGame({type:'move',x:gate.x,y:gate.y});return;}
  const enemy=npcs.filter(n=>n.hp>0&&Math.hypot(n.x-x,n.y-y)<60).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];if(enemy){if(selectedNpcId!==enemy.id)autoFire=false;selectedNpcId=enemy.id;playGameSfx('select');document.querySelector('#help')!.textContent='LOCKED: '+(enemy.name||'NPC')+' · HP '+Math.ceil(enemy.hp)+' / '+enemy.maxHp+' · DOUBLE CLICK OR CTRL/SPACE: AUTO FIRE';return;}
  socket.send(JSON.stringify({ type: 'move', x, y }));
});
canvas.addEventListener('dblclick',event=>{event.preventDefault();if(selectedNpcId){autoFire=true;nextAutoShot=0;}});
document.querySelector('#popup-body')!.addEventListener('dragstart',(event)=>{const e=event as DragEvent;const el=(e.target as HTMLElement).closest<HTMLElement>('[data-ammo-drag]');if(el&&e.dataTransfer)e.dataTransfer.setData('text/plain',el.dataset.ammoDrag||'');});
canvas.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(.55, Math.min(1.7, zoom - Math.sign(e.deltaY) * .1)); }, { passive: false });
const mini = document.querySelector<HTMLCanvasElement>('#minimap')!;
const ctx = mini.getContext('2d')!;
const miniBackground=new Image();miniBackground.src='/assets/nexus-space/3-1.webp';
let miniZoom=1;
const miniPanel=document.querySelector<HTMLElement>('#mini-panel')!;
document.querySelector('#mini-plus')!.addEventListener('click',()=>{miniZoom=Math.min(4,Math.round((miniZoom+.25)*100)/100);});
document.querySelector('#mini-minus')!.addEventListener('click',()=>{miniZoom=Math.max(1,Math.round((miniZoom-.25)*100)/100);});
document.querySelector('#mini-size')!.addEventListener('click',()=>{miniPanel.classList.toggle('expanded');});
// Click-to-move minimap. Coordinates use the same viewport and zoom transform as drawing.
// The server validates and persists the ship's movement target.
mini.style.cursor='crosshair';
mini.title='Click to navigate • DarkOrbit A1–F4 sector grid';
let miniWaypoint:{x:number;y:number}|null=null;
mini.addEventListener('pointerdown',event=>{
 if(event.button!==0||!myId)return;
 const rect=mini.getBoundingClientRect();
 if(!rect.width||!rect.height)return;
 const me=players.find(p=>p.id===myId);
 const vw=WORLD_WIDTH/miniZoom,vh=WORLD_HEIGHT/miniZoom;
 const ox=Math.max(0,Math.min(WORLD_WIDTH-vw,(me?.x??WORLD_WIDTH/2)-vw/2));
 const oy=Math.max(0,Math.min(WORLD_HEIGHT-vh,(me?.y??WORLD_HEIGHT/2)-vh/2));
 const x=Math.max(0,Math.min(WORLD_WIDTH,ox+(event.clientX-rect.left)/rect.width*vw));
 const y=Math.max(0,Math.min(WORLD_HEIGHT,oy+(event.clientY-rect.top)/rect.height*vh));
 miniWaypoint={x,y};sendGame({type:'move',x,y});
});

app.ticker.add((ticker) => {
  // Animate all visible gates in sync at 12 fps; does not affect J-key jump logic.
  const portalFrame=Math.floor(performance.now()/83.333)%portalIdleFrames.length;
  // Subtle station beacon and protected-zone boundary pulse.
  const phase=performance.now()/850;
  for(const child of stationLayer.children){if(child instanceof Graphics){child.alpha=.65+.25*Math.sin(phase);}}
  if(stationEnergy){stationEnergy.alpha=.48+.28*Math.sin(phase*1.4);stationEnergy.rotation=Math.sin(phase*.2)*.06;}
  for(const ring of animatedPortalSprites)ring.texture=portalIdleFrames[portalFrame];
  // Draw short-lived combat beams from actual cannon muzzle positions to the NPC.
  mineLayer.clear();for(const mine of visibleMines.values()){mineLayer.circle(mine.x,mine.y,11).fill({color:0xf6a331,alpha:.65});mineLayer.circle(mine.x,mine.y,16).stroke({color:0xffd477,width:2,alpha:.8});}
  combatLayer.clear();
  const effectNow=performance.now();
  for(let i=combatEffects.length-1;i>=0;i--){
    const shot=combatEffects[i],elapsed=effectNow-shot.started;
    if(elapsed>280){combatEffects.splice(i,1);continue;}
    const attacker=players.find(p=>p.id===shot.sourceId)??npcs.find(n=>n.id===shot.sourceId);
    const target=npcs.find(n=>n.id===shot.targetId)??players.find(p=>p.id===shot.targetId);
    if(!attacker||!target)continue;
    const angle=Math.atan2(target.y-attacker.y,target.x-attacker.x);
    const activeLasers=shot.sourceId===myId
      ? Math.max(1,config()?.laser.filter(Boolean).length??0)
      : 2;
    const barrels=shot.item==='NPC-LASER'?1:Math.min(2,activeLasers);
    const laserColor:Record<string,number>={
      'LCB-10':0xff3448,'MCB-25':0x239aff,'MCB-50':0x38ff74,
      'UCB-100':0xffffff,'RSB-75':0xec8cff,'SAB-50':0x39d9ff,'NPC-LASER':0xff7e30
    };
    const color=laserColor[shot.item]??0xffc966;
    const alpha=Math.max(0,1-elapsed/280);
    const isRocket=['R-310','PLT-2026','PLT-2021','PLT-3030','PLD-8','DCR-250','HSTRM-01','UBR-100','ECO-10'].includes(shot.item);
    const thick=shot.item==='RSB-75'?6:shot.item==='UCB-100'?3:2;
    for(let b=0;b<barrels;b++){
      const side=barrels===1?0:(b===0?-1:1);
      const ox=attacker.x+Math.cos(angle)*21-Math.sin(angle)*side*8;
      const oy=attacker.y+Math.sin(angle)*21+Math.cos(angle)*side*8;
      if(isRocket){const t=Math.min(1,elapsed/240);const px=ox+(target.x-ox)*t,py=oy+(target.y-oy)*t;combatLayer.circle(px,py,shot.item==='PLD-8'?10:5).fill({color,alpha});combatLayer.moveTo(px-Math.cos(angle)*22,py-Math.sin(angle)*22).lineTo(px,py).stroke({color:0xffaa44,width:3,alpha});
      }else if(shot.item==='SAB-50'){
        for(let j=0;j<7;j++){
          const t=(j+0.5)/8;
          combatLayer.circle(ox+(target.x-ox)*t,oy+(target.y-oy)*t,6+j%2*3)
            .stroke({color,width:2.5,alpha});
        }
      }else{
        combatLayer.moveTo(ox,oy).lineTo(target.x,target.y)
          .stroke({color,width:thick+7,alpha:alpha*.15});
        combatLayer.moveTo(ox,oy).lineTo(target.x,target.y)
          .stroke({color,width:thick,alpha});
      }
    }
  }
  const dt=Math.min(ticker.deltaMS/1000,0.05);
  // One selected target, server-authoritative hit validation and cooldowns.
  if(autoFire&&selectedNpcId&&performance.now()>=nextAutoShot){
    const target=npcs.find(n=>n.id===selectedNpcId&&n.hp>0);
    const self=players.find(p=>p.id===myId);
    if(!target||!self||Math.hypot(target.x-self.x,target.y-self.y)>950){autoFire=false;}
    else {const id=ammoItems.find(x=>x.id===hotbarItems[selectedHotbar]&&x.category==='LASERS')?.id??'LCB-10';if(id&&ammoItems.find(x=>x.id===id)?.category==='LASERS')sendGame({type:'attack',id:target.id,ammo:id});nextAutoShot=performance.now()+620;}
  }

  const follow=1-Math.exp(-dt*18);
  const ids = new Set(players.map(p => p.id));
  for (const [id, visual] of visuals) if (!ids.has(id)) { visual.body.destroy({ children: true }); visuals.delete(id); renderPositions.delete(id); headings.delete(id); }
  for (const p of players) {
    let visual = visuals.get(p.id);
    if (!visual) { visual = ship(p.id === myId ? 0x44caff : 0xffb44d); visuals.set(p.id, visual); }
    let pos=renderPositions.get(p.id);
    if(!pos){pos={x:p.x,y:p.y,lastX:p.x,lastY:p.y};renderPositions.set(p.id,pos);}
    // Respawns, faction spawn changes and teleports must not glide across the map.
    if(Math.hypot(p.x-pos.x,p.y-pos.y)>300){pos.x=p.x;pos.y=p.y;pos.lastX=p.x;pos.lastY=p.y;}
    pos.lastX=pos.x;pos.lastY=pos.y;
    // Exponential smoothing is framerate independent, including at 144Hz.
    pos.x+=(p.x-pos.x)*follow;pos.y+=(p.y-pos.y)*follow;
    visual.body.position.set(pos.x,pos.y);
    // Server-owned drone counts; each drone uses the same static type texture.
    // Interleave owned drone types, so mixed IRIS/FLAX fleets appear on both wings.
    // Counts remain sourced from the server; this is presentation only.
    const irisCount=Math.max(0,Math.min(8,p.drones?.iris??(p.id===myId?profile?.drones?.iris??0:0)));
    const flaxCount=Math.max(0,Math.min(8,p.drones?.flax??(p.id===myId?profile?.drones?.flax??0:0)));
    const droneList:('iris'|'flax')[]=[];
    let remainingIris=irisCount,remainingFlax=flaxCount;
    while(remainingIris>0||remainingFlax>0){
      if(remainingIris>0){droneList.push('iris');remainingIris--;}
      if(remainingFlax>0){droneList.push('flax');remainingFlax--;}
    }
    const wantedDrones=prefs.drones?droneList.length:(droneList.length?1:0);
    const wantedLabels=prefs.drones?droneList:['hidden-'+droneList.join('')];
    if(visual.drones.children.length!==wantedDrones || visual.drones.children.some((child,i)=>child.label!==wantedLabels[i])){
      visual.drones.removeChildren().forEach(child=>child.destroy({children:true}));
      if(!prefs.drones && droneList.length){
        const indicator=new Container();indicator.label=wantedLabels[0];
        const letters=new Text({text:droneList.map(type=>type==='iris'?'I':'F').join(''),style:{fontFamily:'Arial',fontSize:13,fontWeight:'bold',fill:0xffd700,stroke:{color:0x09131d,width:2}}});
        letters.anchor.set(.5);letters.scale.x=0.85;indicator.addChild(letters);
        indicator.position.set(0,-70);visual.drones.addChild(indicator);
      }
      if(prefs.drones)for(const type of droneList){
        const drone=new Container();drone.label=type;
        const sprite=new Sprite(droneTextures[type]);sprite.label='static-drone-art';sprite.anchor.set(.5);
        // Keep natural sprite proportions instead of stretching both types to a square.
        const factor=Math.min(42/Math.max(1,sprite.texture.width),42/Math.max(1,sprite.texture.height));
        sprite.scale.set(factor);drone.addChild(sprite);visual.drones.addChild(drone);
      }
    }
    // Symmetric, swept-back Standard Formation attached to the smoothed ship body.
    // Slot positions never orbit or rotate; IRIS and FLAX art stays identical.
    if(prefs.drones){
      const total=visual.drones.children.length;
      const leftCount=Math.ceil(total/2);
      const rightCount=total-leftCount;
      for(let i=0;i<total;i++){
        const left=i%2===0;
        const slot=Math.floor(i/2);
        const sideCount=left?leftCount:rightCount;
        const u=(slot+1)/(sideCount+1);
        const distance=78+slot*31;
        const x=(left?-1:1)*distance;
        const y=16+slot*13-10*Math.sin(u*Math.PI);
        const drone=visual.drones.children[i];
        drone.position.set(x,y);drone.alpha=1;drone.scale.set(1);
      }
    }

    // Aim using the server's actual travel vector. Snapshot target coordinates
    // remain stable between updates, unlike the tiny interpolated deltas.
    const dx=p.targetX-p.x,dy=p.targetY-p.y;
    const moving=Math.hypot(dx,dy)>2;
    const current=headings.get(p.id) ?? (moving?Math.atan2(dy,dx):-Math.PI/2);
    const wanted=moving?Math.atan2(dy,dx):current;
    const delta=wrapAngle(wanted-current);
    const direction=wrapAngle(current+Math.max(-turnRate*dt,Math.min(turnRate*dt,delta)));
    headings.set(p.id,direction);
    // SWF frame sequence runs counterclockwise in screen-space coordinates.
    // Right=16, Up=8, Left=0, Down=24. No physical sprite rotation.
    // Original Inferno hull points right; turn the geometry directly.
    // No directional PNG frames or inherited Phoenix silhouette.
    (visual.art.children[1] as Sprite).rotation=direction;(visual.art.children[2] as Graphics).rotation=direction;const previousHeading=smoothShipHeadings.get(p.id)??direction;
    const angleDelta=Math.atan2(Math.sin(direction-previousHeading),Math.cos(direction-previousHeading));
    const easedHeading=previousHeading+angleDelta*.23;
    smoothShipHeadings.set(p.id,easedHeading);
    (visual.art.children[3] as Sprite).texture=shipHeadingTextures[shipIdIndex[p.shipId??'phoenix']??0][((Math.round(easedHeading*32/(Math.PI*2))+8)%32+32)%32];const shipSize=({'phoenix':90,'yamato':96,'leonov':105,'defcom':100,'liberator':104,'piranha':106,'nostromo':111,'vengeance':114,'bigboy':120,'goliath':126} as Record<string,number>)[p.shipId??'phoenix']??105;(visual.art.children[3] as Sprite).width=shipSize;(visual.art.children[3] as Sprite).height=shipSize;(visual.art.children[3] as Sprite).rotation=0;(visual.art.children[4] as Container).rotation=direction;
    // Animated twin thruster jets, oriented opposite the ship's travel direction.
    // Hidden at rest; flames stay under the hull instead of obscuring it.
    visual.exhaust.visible=moving;
    if(moving){
      const t=performance.now()/1000;
      const pulse=.87+.13*Math.sin(t*27+p.x*.03);
      const length=(12+(shipIdIndex[p.shipId??'phoenix']??0)*.7)*pulse;
      visual.exhaust.rotation=direction+Math.PI/2;
      // Exhaust is attached behind the engineering hull, scaled by ship class.
      const shipClass=shipIdIndex[p.shipId??'phoenix']??0;
      const rearOffset=35+shipClass*1.1;
      visual.exhaust.position.set(-Math.cos(direction)*rearOffset,-Math.sin(direction)*rearOffset);
      const jetColor=p.company==='mars'?0xff3044:0x2bff77;
      visual.glow.clear().ellipse(0,10,9,14).fill({color:jetColor,alpha:.25});
      visual.flame.clear();
      for(const x of [-5,5]){
        visual.flame.moveTo(x-4,5).quadraticCurveTo(x-6,13,x,13+length).quadraticCurveTo(x+6,12,x+4,5).closePath().fill({color:jetColor,alpha:.78});
        visual.flame.moveTo(x-2,6).quadraticCurveTo(x-3,12,x,10+length*.65).quadraticCurveTo(x+3,12,x+2,6).closePath().fill({color:jetColor,alpha:.92});
        visual.flame.moveTo(x-1,6).lineTo(x,11+length*.32).lineTo(x+1,6).closePath().fill({color:0xffffff,alpha:.95});
      }
    }
    // Tiny embers trail the jets; animated with time but deterministic per player.
    if(moving){
      const t=performance.now()/1000;
      for(let i=0;i<3;i++){
        const x=(i-1)*6;
        const y=14+((t*28+i*11)%17);
        visual.flame.circle(x+Math.sin(t*9+i*4)*3,y,1.3+(i%2))
          .fill({color:i===1?0x8ffaff:0x167aff,alpha:.55});
      }
    }
    visual.label.visible=showLabels;
    visual.label.text = `${p.username|| (p.id===myId?identity?.username:'Pilot') ||'Pilot'}`;
    (visual.nameplate.children[visual.nameplate.children.length-2] as Text).text=`HP ${Math.ceil(p.hp).toLocaleString()}`;
    (visual.nameplate.children[visual.nameplate.children.length-1] as Text).text=`SHD ${Math.ceil(p.shield).toLocaleString()}`;
    // Keep the username precisely on the ship's centre line. Rank and company
    // badge flank the text symmetrically, regardless of username length.
    const sideOffset=visual.label.width/2+15;
    const rankSprite=visual.nameplate.children.find(child=>child instanceof Sprite && child!==visual.faction) as Sprite | undefined;
    if(rankSprite)rankSprite.position.x=-sideOffset;
    visual.ringTexts.forEach((ring,i)=>ring.position.x=-sideOffset+(i%3-1)*7);
    visual.faction.position.x=sideOffset+3;
    visual.nameplate.position.x=0;
    visual.faction.texture=badgeTextures[p.company|| (p.id===myId?identity?.company:'venus')||'venus'];
    visual.ringTexts.forEach((ring,i)=>{ring.alpha=p.gateRings?.[i]?1:.2;ring.style.fill=p.gateRings?.[i]?0xffd76d:0x75889b;});
    visual.nameplate.visible=prefs.labels;
    // Client-side location cue only; the server still decides actual combat safety.
    const base=baseStations[activeSector];
    const atBase=!!base && Math.hypot(p.x-base.x,p.y-base.y)<460;
    const atPortal=portals.some(g=>Math.hypot(p.x-g.x,p.y-g.y)<220);
    const safeBanner=document.querySelector<HTMLElement>('#safe-zone-banner')!;
    if(p.id===myId){safeBanner.hidden=!(atBase||atPortal);safeBanner.textContent='SAFE ZONE';}
    document.querySelector('#sector')!.textContent=`SECTOR ${activeSector}${activeSector.startsWith('4-')?' • PVP':''} • J TO JUMP`; 
  }
  const npcIds=new Set(npcs.map(n=>n.id));
  for(const [id,v] of npcVisuals)if(!npcIds.has(id)){v.destroy({children:true});npcVisuals.delete(id);npcFacing.delete(id);if(selectedNpcId===id){selectedNpcId=null;autoFire=false;}}
  for(const n of npcs){const sector=(activeSector.startsWith('3-')||activeSector.startsWith('2-'))?'1-'+activeSector.split('-')[1]:activeSector;let v=npcVisuals.get(n.id);if(!v){v=new Container();
 const tex=npcTextures.get(sector+':'+npcArtToken(n.name??'Streuner'));
 if(tex){const art=new Sprite(tex);art.anchor.set(.5);art.width=88;art.height=88;v.addChild(art);}else{const g=new Graphics().moveTo(17,0).lineTo(-12,-11).lineTo(-7,0).lineTo(-12,11).closePath().fill(0xd95362).stroke({color:0xffb7bf,width:1});v.addChild(g);}const label=new Text({text:n.name??'STREUNER',style:{fontSize:11,fill:0xffaab2}});label.anchor.set(.5);label.y=43;v.addChild(label);const hpText=new Text({text:'',style:{fontFamily:'Arial',fontSize:11,fontWeight:'bold',fill:0x53ff72,stroke:{color:0x001408,width:2}}});hpText.anchor.set(.5);hpText.y=57;v.addChild(hpText);const shieldText=new Text({text:'',style:{fontFamily:'Arial',fontSize:11,fontWeight:'bold',fill:0x49bcff,stroke:{color:0x001020,width:2}}});shieldText.anchor.set(.5);shieldText.y=70;v.addChild(shieldText);shipsLayer.addChild(v);npcVisuals.set(n.id,v);}const readyTex=npcTextures.get(sector+':'+npcArtToken(n.name??'Streuner'));if(readyTex&&!(v.children[0] instanceof Sprite)){const old=v.removeChildAt(0);old.destroy();const art=new Sprite(readyTex);art.anchor.set(.5);art.width=88;art.height=88;v.addChildAt(art,0);}(v.children[2] as Text).text='HP '+Math.ceil(n.hp).toLocaleString()+' / '+n.maxHp.toLocaleString();(v.children[3] as Text).text='SHD '+Math.ceil(n.shield??0).toLocaleString()+' / '+(n.maxShield??0).toLocaleString();v.visible=prefs.npcs;v.position.set(n.x,n.y);v.alpha=n.hp>0?1:.3;v.scale.set(selectedNpcId===n.id?1.08:1);const facing=npcFacing.get(n.id);if(facing){const dx=n.x-facing.x,dy=n.y-facing.y;if(Math.hypot(dx,dy)>0.25)facing.angle=Math.atan2(dy,dx);facing.x=n.x;facing.y=n.y;v.children[0].rotation=facing.angle;}else npcFacing.set(n.id,{x:n.x,y:n.y,angle:0});}
  const selected=npcs.find(n=>n.id===selectedNpcId&&n.hp>0);selectionRing.visible=!!selected;if(selected){selectionRing.position.set(selected.x,selected.y);selectionRing.rotation+=dt*.7;}else if(selectedNpcId){selectedNpcId=null;autoFire=false;}
  const me = players.find(p => p.id === myId);
  if (me) {
    const position=renderPositions.get(myId);
    if(position){
      // Camera follows the rendered player, not the unsmoothed network snapshot.
      cameraX=position.x;cameraY=position.y;
    }
    world.scale.set(zoom);
    world.position.set(app.screen.width / 2 - (Number.isFinite(cameraX)?cameraX:me.x) * zoom, app.screen.height / 2 - (Number.isFinite(cameraY)?cameraY:me.y) * zoom);
    document.querySelector('#coords')!.textContent = `X: ${Math.round(me.x)}  Y: ${Math.round(me.y)}`;document.querySelector('#mini-live')!.textContent=`${activeSector} ${Math.round(me.x/100)}/${Math.round(me.y/100)} ${((WORLD_WIDTH/mini.width)/miniZoom).toFixed(2)}pp`;  document.querySelector('#mini-coords')!.textContent = `${String.fromCharCode(65+Math.min(5,Math.floor(me.x/WORLD_WIDTH*6)))}${Math.min(4,Math.floor(me.y/WORLD_HEIGHT*4)+1)} · ${Math.round(me.x/100).toString().padStart(3,'0')} / ${Math.round(me.y/100).toString().padStart(3,'0')}`;
  }
  document.querySelector('#count')!.textContent = `Players: ${players.length}`;
  // Canvas internal resolution follows the resizable CSS dimensions.
  const miniRect=mini.getBoundingClientRect();const mw=Math.max(1,Math.round(miniRect.width)),mh=Math.max(1,Math.round(miniRect.height));if(mini.width!==mw||mini.height!==mh){mini.width=mw;mini.height=mh;}
  ctx.clearRect(0,0,mini.width,mini.height);
  const own=players.find(p=>p.id===myId);
  const centerX=own?.x??WORLD_WIDTH/2,centerY=own?.y??WORLD_HEIGHT/2;
  const visibleW=WORLD_WIDTH/miniZoom,visibleH=WORLD_HEIGHT/miniZoom;
  const originX=Math.max(0,Math.min(WORLD_WIDTH-visibleW,centerX-visibleW/2));
  const originY=Math.max(0,Math.min(WORLD_HEIGHT-visibleH,centerY-visibleH/2));
  const mx=(x:number)=>(x-originX)/visibleW*mini.width;
  const my=(y:number)=>(y-originY)/visibleH*mini.height;
  ctx.fillStyle='#07172a';ctx.fillRect(0,0,mini.width,mini.height);
  if(prefs.miniBackground&&miniBackground.complete&&miniBackground.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(miniBackground,originX/WORLD_WIDTH*miniBackground.naturalWidth,originY/WORLD_HEIGHT*miniBackground.naturalHeight,visibleW/WORLD_WIDTH*miniBackground.naturalWidth,visibleH/WORLD_HEIGHT*miniBackground.naturalHeight,0,0,mini.width,mini.height);}
  ctx.fillStyle='rgba(2,9,22,.28)';ctx.fillRect(0,0,mini.width,mini.height);
  // Classic DarkOrbit minimap: 6 columns (A–F) and 4 rows (1–4).
  ctx.save();ctx.font='9px Arial';ctx.textAlign='left';ctx.textBaseline='top';
  const cols=6,rows=4;
  for(let i=0;i<=cols;i++){
    const px=mx(i*WORLD_WIDTH/cols);if(px<0||px>mini.width)continue;
    ctx.strokeStyle='rgba(102,193,233,.24)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,mini.height);ctx.stroke();
  }
  for(let i=0;i<=rows;i++){
    const py=my(i*WORLD_HEIGHT/rows);if(py<0||py>mini.height)continue;
    ctx.strokeStyle='rgba(102,193,233,.24)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,py);ctx.lineTo(mini.width,py);ctx.stroke();
  }
  ctx.fillStyle='rgba(206,241,255,.85)';
  for(let col=0;col<cols;col++)for(let row=0;row<rows;row++){
    const px=mx((col+.08)*WORLD_WIDTH/cols),py=my((row+.08)*WORLD_HEIGHT/rows);
    const cellW=mini.width*WORLD_WIDTH/cols/visibleW;
    const cellH=mini.height*WORLD_HEIGHT/rows/visibleH;
    if(px>=0&&px<mini.width-12&&py>=0&&py<mini.height-8&&cellW>=15&&cellH>=10){
      ctx.fillText(String.fromCharCode(65+col)+(row+1),px,py);
    }
  }
  if(miniWaypoint){const wx=mx(miniWaypoint.x),wy=my(miniWaypoint.y);
    if(wx>=0&&wx<=mini.width&&wy>=0&&wy<=mini.height){
      ctx.strokeStyle='#ffdb6d';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(wx,wy,6,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(wx-10,wy);ctx.lineTo(wx+10,wy);ctx.moveTo(wx,wy-10);ctx.lineTo(wx,wy+10);ctx.stroke();
    }
    if(own&&Math.hypot(own.x-miniWaypoint.x,own.y-miniWaypoint.y)<25)miniWaypoint=null;
  }
  ctx.restore();

  ctx.strokeStyle='#4488ad';ctx.strokeRect(.5,.5,mini.width-1,mini.height-1);
  const base=baseStations[activeSector];if(base){ctx.save();ctx.fillStyle=base.faction==='mars'?'#ff7a63':'#78ff96';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;const bx=mx(base.x),by=my(base.y);ctx.fillRect(bx-11,by-9,22,18);ctx.strokeStyle='#e3faff';ctx.lineWidth=2;ctx.strokeRect(bx-11,by-9,22,18);ctx.restore();}
  for(const gate of (prefs.portals?portals:[])){ctx.strokeStyle=gate.verified?'#50e8ff':'#b88bff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(mx(gate.x),my(gate.y),5,0,Math.PI*2);ctx.stroke();}
  for(const n of (prefs.npcs?npcs:[])){ctx.fillStyle='#ff6474';ctx.fillRect(mx(n.x)-2,my(n.y)-2,4,4);}
  for(const p of players){ctx.fillStyle=p.id===myId?'#54d9ff':'#ffb44d';ctx.beginPath();ctx.arc(mx(p.x),my(p.y),p.id===myId?4:2.5,0,Math.PI*2);ctx.fill();}

});

const gateDeniedVoice=new Audio('/assets/audio/gate-access-denied.wav');gateDeniedVoice.preload='auto';
window.addEventListener('keydown',event=>{if(event.key.toLowerCase()!=='j'||event.repeat||(event.target instanceof HTMLInputElement)||(event.target instanceof HTMLTextAreaElement))return;const me=players.find(p=>p.id===myId);if(!me)return;const gate=portals.find(g=>Math.hypot(g.x-me.x,g.y-me.y)<260);if(gate){playJumpEffect(gate.x,gate.y);sendGame({type:'jump',portalId:gate.id});}else{gateDeniedVoice.currentTime=0;void gateDeniedVoice.play().catch(()=>{});}});
