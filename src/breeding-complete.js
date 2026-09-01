const BREEDING_EXACT = {
  'Rex':[300,5550,97],
  'Argentavis':[180,5550,117],
  'Therizinosaur':[100,5550,92],
  'Giganotosaurus':[3000,18480,583],
  'Yutyrannus':[300,5550,117],
  'Baryonyx':[100,5550,92],
  'Rock Drake':[360,5550,310],
  'Snow Owl':[180,5550,117],
  'Managarmr':[150,5550,117]
};

const DISPLAY_NAMES = {
  'Fire Wyvern':'Wyverne de feu',
  'Lightning Wyvern':'Wyverne de foudre',
  'Poison Wyvern':'Wyverne de poison',
  'Ice Wyvern':'Wyverne de glace'
};

const NON_STANDARD = new Set([
  'Oasisaur','Rhyniognatha','Reaper','Phoenix'
]);

const CATEGORY_DEFAULTS = {
  'Dinosaure':[120,5550,105],
  'Mammifère':[240,4800,110],
  'Oiseau':[180,4800,110],
  'Reptile':[180,5550,115],
  'Reptile marin':[240,5550,120],
  'Créature fantastique':[300,7200,150],
  'Wyvern':[300,5550,150],
  'Invertébré':[180,4800,110],
  'Créature':[240,5550,120]
};

let creatures=[];
let currentProfiles=new Map();
const $=(s,r=document)=>r.querySelector(s);

function fmtDuration(mins){
  if(!Number.isFinite(mins)||mins<=0)return '—';
  const d=Math.floor(mins/1440), h=Math.floor((mins%1440)/60), m=Math.round(mins%60);
  return `${d?d+' j ':''}${h?h+' h ':''}${m||(!d&&!h)?m+' min':''}`.trim();
}

function displayName(name){return DISPLAY_NAMES[name]||name}

function profileFor(c){
  const exact=BREEDING_EXACT[c.name];
  const base=exact||CATEGORY_DEFAULTS[c.category]||[180,5550,120];
  return {name:c.name,label:displayName(c.name),hatch:base[0],mature:base[1],cuddle:base[2],estimated:!exact};
}

function breedingCreatures(){
  return creatures
    .filter(c=>!NON_STANDARD.has(c.name))
    .map(profileFor)
    .sort((a,b)=>a.label.localeCompare(b.label,'fr',{sensitivity:'base'}));
}

function resultMarkup(p,eggRate,matureRate,cuddleRate){
  const hatch=p.hatch/Math.max(.1,eggRate);
  const mature=p.mature/Math.max(.1,matureRate);
  const cuddle=p.cuddle*Math.max(.1,cuddleRate);
  const imprints=Math.max(1,Math.floor(mature/Math.max(1,cuddle)));
  return `<div class="result-grid">
    <div class="result-item"><span>Incubation / gestation</span><b>${fmtDuration(hatch)}</b></div>
    <div class="result-item"><span>Maturation</span><b>${fmtDuration(mature)}</b></div>
    <div class="result-item"><span>Intervalle imprint</span><b>${fmtDuration(cuddle)}</b></div>
    <div class="result-item"><span>Imprints possibles</span><b>~${imprints}</b></div>
  </div>${p.estimated?'<div class="notice" style="margin-top:14px"><b>Estimation :</b> cette espèce utilise encore un profil générique. Les rates serveur et les valeurs ASA exactes peuvent modifier le résultat.</div>':'<div class="notice" style="margin-top:14px">Profil d’élevage dédié disponible pour cette espèce.</div>'}`;
}

function updateResult(){
  const select=$('#breedSpecies'), box=$('#breedResult');
  if(!select||!box)return;
  const p=currentProfiles.get(select.value);
  if(!p)return;
  box.innerHTML=resultMarkup(p,+$('#eggRate')?.value||1,+$('#matureRate')?.value||1,+$('#cuddleRate')?.value||1);
}

function renderTracking(){
  const host=$('#breedTracking'); if(!host)return;
  let items=[]; try{items=JSON.parse(localStorage.getItem('aah:breeding')||'[]')}catch{}
  if(!items.length){host.innerHTML='<div class="empty">Aucun bébé suivi. Ajoute-en depuis le calculateur ci-dessus.</div>';return}
  host.innerHTML=`<div class="grid cols-2">${items.map((b,i)=>`<article class="card"><div class="myark-row"><div><b>${String(b.label||'Bébé').replace(/[&<>"']/g,'')}</b><div class="muted">${displayName(b.species||'')}</div></div><span class="countdown" data-countdown="${b.end}"></span><button class="btn small danger" data-breeding-remove="${i}">Supprimer</button></div></article>`).join('')}</div>`;
}

function addTracking(){
  const select=$('#breedSpecies'); if(!select)return;
  const p=currentProfiles.get(select.value); if(!p)return;
  const rate=Math.max(.1,+$('#matureRate')?.value||1);
  const mins=p.mature/rate;
  const label=$('#babyName')?.value.trim()||`${p.label} bébé`;
  let items=[]; try{items=JSON.parse(localStorage.getItem('aah:breeding')||'[]')}catch{}
  items.push({species:p.name,label,end:Date.now()+mins*60000,created:Date.now(),estimated:p.estimated});
  localStorage.setItem('aah:breeding',JSON.stringify(items));
  renderTracking();
  const toast=$('#toast'); if(toast){toast.textContent='Élevage ajouté au suivi';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200)}
}

function hydrateBreeding(){
  if(location.pathname!=='/elevage')return;
  const select=$('#breedSpecies'); if(!select||select.dataset.complete==='1')return;
  const list=breedingCreatures();
  currentProfiles=new Map(list.map(p=>[p.name,p]));
  const old=select.value;
  select.innerHTML=list.map(p=>`<option value="${p.name.replace(/"/g,'&quot;')}">${p.label}${p.estimated?' · estimation':''}</option>`).join('');
  if(currentProfiles.has(old))select.value=old;
  else if(currentProfiles.has('Rex'))select.value='Rex';
  select.dataset.complete='1';
  const label=select.closest('.full')?.querySelector('label');
  if(label)label.textContent=`Espèce · ${list.length} disponibles`;
  updateResult();
}

function routeRun(){setTimeout(hydrateBreeding,40)}

fetch('/data/creatures.json',{cache:'no-store'})
  .then(r=>r.json())
  .then(data=>{creatures=Array.isArray(data)?data:[];routeRun()})
  .catch(()=>{});

const app=$('#app');
if(app)new MutationObserver(routeRun).observe(app,{childList:true,subtree:false});
addEventListener('popstate',routeRun);

document.addEventListener('change',e=>{
  if(location.pathname!=='/elevage')return;
  if(['breedSpecies','eggRate','matureRate','cuddleRate'].includes(e.target?.id))updateResult();
},true);

document.addEventListener('click',e=>{
  if(location.pathname!=='/elevage')return;
  if(e.target?.id==='calcBreed'){
    e.preventDefault();e.stopImmediatePropagation();updateResult();
  }
  if(e.target?.id==='trackBreed'){
    e.preventDefault();e.stopImmediatePropagation();addTracking();
  }
  const rm=e.target?.closest?.('[data-breeding-remove]');
  if(rm){
    e.preventDefault();e.stopImmediatePropagation();
    let items=[];try{items=JSON.parse(localStorage.getItem('aah:breeding')||'[]')}catch{}
    items.splice(+rm.dataset.breedingRemove,1);
    localStorage.setItem('aah:breeding',JSON.stringify(items));
    renderTracking();
  }
},true);

routeRun();