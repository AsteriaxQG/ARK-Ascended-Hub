let mapsCache=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

async function getMaps(){
  if(mapsCache)return mapsCache;
  try{mapsCache=await fetch('/data/maps.json',{cache:'force-cache'}).then(r=>r.json())}
  catch{mapsCache=[]}
  return mapsCache;
}

function hideLegacyDetail(){
  if(location.pathname!=='/cartes')return;
  const detail=document.querySelector('.map-detail');
  const section=detail?.closest('.section');
  if(section)section.style.display='none';
  document.querySelectorAll('[data-map-card]').forEach(card=>{
    card.tabIndex=0;
    card.setAttribute('role','button');
    card.setAttribute('aria-label',`Ouvrir la fiche ${card.dataset.mapCard}`);
  });
}

function closeMapModal(){document.querySelector('#mapDetailModal')?.remove()}

function modalHtml(map){
  const resources=(map.resources||[]).map(r=>`<span class="resource-pill">${esc(r)}</span>`).join('');
  const hotspots=(map.hotspots||[]).map(([name,where])=>`<div class="map-modal-hotspot"><b>${esc(name)}</b><span>${esc(where)}</span></div>`).join('');
  return `<div class="modal map-detail-modal" id="mapDetailModal" role="dialog" aria-modal="true" aria-labelledby="mapDetailTitle">
    <div class="modal-panel map-modal-panel">
      <button class="modal-close" type="button" data-map-close aria-label="Fermer la fiche">✕</button>
      <div class="map-modal-hero">
        <div class="map-modal-monogram">${esc(map.name.slice(0,2).toUpperCase())}</div>
        <div>
          <div class="eyebrow">CARTE ARK: SURVIVAL ASCENDED</div>
          <h1 id="mapDetailTitle">${esc(map.name)}</h1>
          <div class="chips"><span class="chip">${esc(map.status||'')}</span><span class="chip">${esc(map.biome||'')}</span></div>
        </div>
      </div>
      <div class="map-modal-grid">
        <section class="map-modal-block">
          <div class="eyebrow">RESSOURCES PRINCIPALES</div>
          <h3>Ce que tu peux y farmer</h3>
          <div class="resource-list map-modal-resources">${resources}</div>
        </section>
        <section class="map-modal-block">
          <div class="eyebrow">REPÈRES DE FARM</div>
          <h3>Zones utiles</h3>
          <div class="map-modal-hotspots">${hotspots||'<div class="muted">Aucun repère renseigné pour cette carte.</div>'}</div>
        </section>
      </div>
      <div class="notice">Ces repères sont des aides rapides. Les spawns et coordonnées exactes peuvent varier selon les mises à jour et les réglages du serveur.</div>
    </div>
  </div>`;
}

async function openMap(name){
  const maps=await getMaps();
  const map=maps.find(m=>m.name===name);
  if(!map)return;
  closeMapModal();
  document.body.insertAdjacentHTML('beforeend',modalHtml(map));
  const modal=document.querySelector('#mapDetailModal');
  modal?.querySelector('[data-map-close]')?.focus();
}

/* Capture le clic avant l'ancien handler d'app.js pour éviter le rerender qui envoyait le détail en bas. */
document.addEventListener('click',event=>{
  if(location.pathname!=='/cartes')return;
  const card=event.target.closest('[data-map-card]');
  if(!card)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openMap(card.dataset.mapCard);
},true);

document.addEventListener('keydown',event=>{
  if(location.pathname!=='/cartes'||(event.key!=='Enter'&&event.key!==' '))return;
  const card=event.target.closest('[data-map-card]');
  if(!card)return;
  event.preventDefault();
  openMap(card.dataset.mapCard);
});

document.addEventListener('click',event=>{
  const close=event.target.closest('[data-map-close]');
  if(close){event.preventDefault();closeMapModal();return}
  if(event.target.id==='mapDetailModal')closeMapModal();
});

document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMapModal()});

const app=document.getElementById('app');
if(app)new MutationObserver(()=>setTimeout(hideLegacyDetail,20)).observe(app,{childList:true,subtree:false});
window.addEventListener('popstate',()=>setTimeout(hideLegacyDetail,30));
setTimeout(hideLegacyDetail,60);
