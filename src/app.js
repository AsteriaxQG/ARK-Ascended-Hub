const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmtDate = value => {
  if(!value) return 'Date inconnue';
  const d = new Date(value); if(Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(d);
};
const fmtDuration = mins => {
  if(!Number.isFinite(mins) || mins <= 0) return '—';
  const h=Math.floor(mins/60), m=Math.round(mins%60);
  return h ? `${h} h ${m} min` : `${m} min`;
};
const routePaths={home:'/',news:'/actus',creatures:'/creatures',maps:'/cartes',taming:'/taming',breeding:'/elevage',tools:'/outils',myark:'/mon-ark'};
const pathRoutes=Object.fromEntries(Object.entries(routePaths).map(([k,v])=>[v,k]));
const store={
  get(k,f=[]){try{return JSON.parse(localStorage.getItem(`aah:${k}`))??f}catch{return f}},
  set(k,v){localStorage.setItem(`aah:${k}`,JSON.stringify(v))}
};
const state={creatures:[],maps:[],crafting:[],bosses:[],newsFallback:[],news:[],images:{},creatureFilter:'Tous',mapFilter:null,tool:'craft'};

async function loadData(){
  const [creatures,maps,crafting,bosses,newsFallback]=await Promise.all([
    fetch('/data/creatures.json').then(r=>r.json()),fetch('/data/maps.json').then(r=>r.json()),fetch('/data/crafting.json').then(r=>r.json()),fetch('/data/bosses.json').then(r=>r.json()),fetch('/data/news-fallback.json').then(r=>r.json())
  ]);
  Object.assign(state,{creatures,maps,crafting,bosses,newsFallback,news:newsFallback});
  resolveCreatureImages().catch(()=>{});
}
async function resolveCreatureImages(){
  const chunks=[]; for(let i=0;i<state.creatures.length;i+=20) chunks.push(state.creatures.slice(i,i+20));
  for(const chunk of chunks){
    const titles=chunk.map(c=>c.name).join('|');
    const u=`https://ark.wiki.gg/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=700&titles=${encodeURIComponent(titles)}`;
    try{
      const j=await fetch(u).then(r=>r.json());
      Object.values(j?.query?.pages||{}).forEach(p=>{if(p.title&&p.thumbnail?.source) state.images[p.title]=p.thumbnail.source});
    }catch{}
  }
  if(currentRoute()==='creatures') render();
}
function imgFor(name){
  if(state.images[name]) return state.images[name];
  const aliases={'Spinosaur':'Spinosaurus','Therizinosaur':'Therizinosaurus','Giganotosaurus':'Giganotosaurus','Rock Drake':'Rock Drake'};
  return state.images[aliases[name]]||'';
}
function currentRoute(){return pathRoutes[location.pathname]||'home'}
function go(route){history.pushState({},'',routePaths[route]||'/');render();window.scrollTo({top:0,behavior:'smooth'})}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2200)}
function navActive(){const r=currentRoute();$$('.main-nav a').forEach(a=>a.classList.toggle('active',a.dataset.route===r));}
function setTitle(t){document.title=`${t} — ARK Ascended Hub`}

function home(){
  setTitle('Accueil'); const favs=store.get('favorites',[]), breed=store.get('breeding',[]), bossDone=store.get('bossDone',[]);
  const latest=state.news[0]||state.newsFallback[0];
  return `<section class="hero">
    <div class="eyebrow">Compagnon ARK: Survival Ascended</div>
    <h1>Survis mieux.<br><span class="accent">Prépare tout.</span></h1>
    <p>Actualités officielles, créatures, cartes, tame, élevage, craft et progression réunis dans un seul hub pensé pour accompagner ta partie.</p>
    <div class="actions"><button class="btn primary" data-go="taming">Calculer un tame</button><button class="btn" data-go="creatures">Explorer les créatures</button><button class="btn ghost" data-go="news">Voir les actualités</button></div>
  </section>
  <section class="section"><div class="grid cols-4">
    ${stat('🦖',state.creatures.length,'Créatures référencées')}${stat('🗺️',state.maps.length,'Cartes suivies')}${stat('★',favs.length,'Favoris dans Mon ARK')}${stat('✓',bossDone.length,'Objectifs boss validés')}
  </div></section>
  <section class="section"><div class="section-head"><div><h2>Accès rapide</h2><p>Les outils utiles pendant une session.</p></div></div>
    <div class="grid cols-4">
      ${quick('🧪','Taming','Niveau, rates, nourriture, narcotiques et durée estimée.','taming')}
      ${quick('🥚','Élevage','Incubation, maturation, imprint et minuteurs.','breeding')}
      ${quick('⚒️','Craft','Multiplie les crafts et totalise les ressources.','tools')}
      ${quick('📋','Progression','Favoris, boss cochés et élevages en cours.','myark')}
    </div>
  </section>
  <section class="section"><div class="section-head"><div><h2>Dernière actu</h2><p>Studio Wildcard / ARK officiel</p></div><button class="btn small" data-go="news">Toutes les actus</button></div>
    ${latest?`<article class="card"><div class="news-meta"><span class="tag teal">${esc(latest.category||'ARK')}</span><span>${fmtDate(latest.date)}</span></div><h3>${esc(latest.title)}</h3><p class="muted">${esc(latest.summary||'Dernière publication officielle ARK.')}</p><a class="accent" target="_blank" rel="noreferrer" href="${esc(latest.url)}">Lire la source →</a></article>`:''}
  </section>
  <section class="section"><div class="section-head"><div><h2>Mes élevages en cours</h2><p>Suivi local sur cet appareil.</p></div><button class="btn small" data-go="breeding">Gérer</button></div>${breed.length?renderBreedMini(breed):'<div class="empty">Aucun élevage suivi pour le moment.</div>'}</section>`;
}
function stat(icon,n,label){return `<div class="card stat-card"><i>${icon}</i><b>${n}</b><span>${label}</span></div>`}
function quick(icon,title,text,route){return `<article class="card quick-card" data-go="${route}"><div class="icon">${icon}</div><h3>${title}</h3><p>${text}</p></article>`}

async function refreshNews(showToast=true){
  const btn=$('#refreshNews'); if(btn){btn.disabled=true;btn.textContent='Actualisation…'}
  try{
    const j=await fetch('/api/news',{cache:'no-store'}).then(r=>r.json());
    if(j.items?.length){state.news=j.items; if(showToast)toast(`${j.items.length} actualités récupérées`)}
    else {state.news=state.newsFallback;if(showToast)toast('Source live indisponible — affichage du cache de secours')}
  }catch{state.news=state.newsFallback;if(showToast)toast('Source live indisponible — affichage du cache de secours')}
  if(currentRoute()==='news') render();
}
function newsPage(){
  setTitle('Actualités');
  return `<div class="page-head"><div><div class="eyebrow">ARK officiel</div><h1>Actualités</h1><p>Community Crunch, mises à jour et annonces Studio Wildcard.</p></div><button id="refreshNews" class="btn primary">↻ Rafraîchir</button></div>
  <div class="filters"><button class="filter-chip active" data-news-filter="all">Tout</button><button class="filter-chip" data-news-filter="Community Crunch">Community Crunch</button><button class="filter-chip" data-news-filter="other">Mises à jour / annonces</button></div>
  <div id="newsGrid" class="grid cols-3">${state.news.map(newsCard).join('')}</div>
  <div class="notice">Les articles restent sur leur source officielle. Le Hub affiche seulement les informations utiles et renvoie vers Studio Wildcard pour le contenu complet.</div>`;
}
function newsCard(n){const bg=n.image?`style="background-image:linear-gradient(0deg,rgba(4,12,15,.25),rgba(4,12,15,.08)),url('${esc(n.image)}')"`:'';return `<article class="card news-card" data-news-category="${esc(n.category||'Annonce')}"><div class="news-cover" ${bg}></div><div class="news-body"><div class="news-meta"><span class="tag teal">${esc(n.category||'Annonce')}</span><span>${fmtDate(n.date)}</span></div><h3>${esc(n.title)}</h3><p>${esc((n.summary||'Actualité officielle ARK.').slice(0,180))}${(n.summary||'').length>180?'…':''}</p><a href="${esc(n.url)}" target="_blank" rel="noreferrer">Lire l'article officiel →</a></div></article>`}

function creaturesPage(){
  setTitle('Créatures'); const cats=['Tous',...new Set(state.creatures.map(c=>c.category))];
  return `<div class="page-head"><div><div class="eyebrow">Bestiaire ASA</div><h1>Créatures</h1><p>${state.creatures.length} fiches avec rôle, maps, tame et favoris.</p></div></div>
  <div class="filters"><input class="control" id="creatureSearch" placeholder="Rechercher une créature…"><select class="control" id="creatureMap"><option value="">Toutes les maps</option>${state.maps.map(m=>`<option>${esc(m.name)}</option>`).join('')}</select></div>
  <div class="filters">${cats.map((c,i)=>`<button class="filter-chip ${i===0?'active':''}" data-creature-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
  <div id="creatureGrid" class="grid cols-3">${state.creatures.map(creatureCard).join('')}</div>`;
}
function creatureCard(c){const fav=store.get('favorites',[]).includes(c.name),img=imgFor(c.name);return `<article class="card creature-card" data-name="${esc(c.name)}" data-cat="${esc(c.category)}" data-maps="${esc(c.maps.join('|'))}"><div class="creature-img">${img?`<img loading="lazy" src="${esc(img)}" alt="${esc(c.name)}">`:`<div class="eyebrow">ARK CREATURE</div>`}</div><div class="creature-body"><div class="creature-top"><div><h3>${esc(c.name)}</h3><div class="muted">${esc(c.role)}</div></div><button class="fav ${fav?'active':''}" data-fav="${esc(c.name)}" title="Ajouter à Mon ARK">★</button></div><div class="chips"><span class="chip">${esc(c.category)}</span><span class="chip">${esc(c.diet)}</span><span class="chip">Tame ${esc(c.tame)}</span></div><div class="creature-stats"><span>Selle <b>${c.saddle||'Aucune'}</b></span><span>Maps <b>${c.maps.length}</b></span></div><div class="actions"><button class="btn small" data-creature="${esc(c.name)}">Voir la fiche</button>${['KO','Passif'].includes(c.tame)?`<button class="btn small ghost" data-tame-creature="${esc(c.name)}">Tame</button>`:''}</div></div></article>`}
function creatureModal(c){const img=imgFor(c.name);return `<div class="modal" id="modal"><div class="modal-panel"><button class="modal-close" data-close>✕</button><div class="detail-grid"><div>${img?`<img class="detail-img" src="${esc(img)}" alt="${esc(c.name)}">`:'<div class="detail-img"></div>'}</div><div><div class="eyebrow">${esc(c.category)}</div><h1>${esc(c.name)}</h1><p class="muted">${esc(c.role)} · ${esc(c.diet)} · méthode ${esc(c.tame)}</p><div class="chips">${c.maps.map(m=>`<span class="chip">${esc(m)}</span>`).join('')}</div><h3>Nourritures conseillées</h3><div class="resource-list">${c.foods.map(f=>`<span class="resource-pill">${esc(f)}</span>`).join('')}</div><p class="muted">Niveau de selle : <b>${c.saddle||'aucune selle'}</b></p><div class="actions"><button class="btn primary" data-tame-creature="${esc(c.name)}">Ouvrir dans le calculateur</button><a class="btn" target="_blank" rel="noreferrer" href="https://ark.wiki.gg/wiki/${encodeURIComponent(c.name.replaceAll(' ','_'))}">Wiki →</a></div></div></div></div></div>`}

function mapsPage(){setTitle('Cartes & ressources');const selected=state.mapFilter||state.maps[0]?.name;const m=state.maps.find(x=>x.name===selected)||state.maps[0];return `<div class="page-head"><div><div class="eyebrow">Exploration</div><h1>Cartes & ressources</h1><p>Raccourcis de farm et zones utiles par carte.</p></div></div><div class="grid cols-4">${state.maps.map(x=>`<article class="card map-card" data-map-card="${esc(x.name)}"><div class="map-art"></div><div class="news-meta"><span class="tag teal">${esc(x.status)}</span><span>${esc(x.biome)}</span></div><h3>${esc(x.name)}</h3><div class="resource-list">${x.resources.slice(0,4).map(r=>`<span class="resource-pill">${esc(r)}</span>`).join('')}</div></article>`).join('')}</div>
  <section class="section"><div class="map-detail"><div class="card"><div class="eyebrow">Carte sélectionnée</div><h2>${esc(m.name)}</h2><p class="muted">${esc(m.biome)}</p><div class="resource-list">${m.resources.map(r=>`<span class="resource-pill">${esc(r)}</span>`).join('')}</div></div><div class="card"><h3>Repères de farm</h3>${m.hotspots.map(([r,d])=>`<div class="hotspot"><b>${esc(r)}</b><span>${esc(d)}</span></div>`).join('')}<div class="notice">Ces repères sont des aides rapides. Pour des coordonnées exactes et les spawns, ouvre la carte interactive du wiki officiel communautaire.</div></div></div></section>`}

function tamingPage(prefill=''){setTitle('Calculateur de tame');const valid=state.creatures.filter(c=>c.baseMinutes>0);const selected=prefill||sessionStorage.getItem('aah:tameCreature')||'Rex';sessionStorage.removeItem('aah:tameCreature');return `<div class="page-head"><div><div class="eyebrow">Calculateur</div><h1>Taming</h1><p>Estimation rapide selon le niveau et les rates de ton serveur.</p></div></div><div class="grid cols-2"><section class="card form-card"><div class="form-grid"><div class="full"><label>Créature</label><select id="tameCreature" class="control" style="width:100%">${valid.map(c=>`<option ${c.name===selected?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div><label>Niveau sauvage</label><input id="tameLevel" class="control" type="number" min="1" max="450" value="150" style="width:100%"></div><div><label>Rate de Taming</label><input id="tameRate" class="control" type="number" min="0.1" step="0.1" value="1" style="width:100%"></div><div><label>Food drain</label><input id="foodRate" class="control" type="number" min="0.1" step="0.1" value="1" style="width:100%"></div><div><label>Marge sécurité narcotiques</label><select id="narcMargin" class="control" style="width:100%"><option value="1">Normale</option><option value="1.2" selected>+20%</option><option value="1.4">+40%</option></select></div></div><div class="actions"><button id="calcTame" class="btn primary">Calculer</button></div></section><section class="card"><h3>Résultat</h3><div id="tameResult" class="result-box">${tameResult(selected,150,1,1,1.2)}</div><div class="notice">Les chiffres sont volontairement présentés comme <b>estimations</b> : les mécaniques ASA, le type de nourriture, les réglages serveur et certaines méthodes spéciales peuvent modifier le résultat. La fiche indique les meilleures nourritures à privilégier.</div></section></div>`}
function tameResult(name,level,rate,foodRate,margin){const c=state.creatures.find(x=>x.name===name);if(!c)return '';const levelFactor=.72+level/535;const mins=(c.baseMinutes*levelFactor)/(Math.max(.1,rate)*Math.max(.1,foodRate));const bites=Math.max(1,Math.ceil((level/8.5+10)/Math.max(.4,rate)));const narc=c.tame==='KO'?Math.ceil(level*c.narcoticFactor*margin/Math.max(.7,rate)):0;const eff=Math.max(55,Math.min(99.9,99.4-(bites-1)*.22));return `<div class="result-grid"><div class="result-item"><span>Durée estimée</span><b>${fmtDuration(mins)}</b></div><div class="result-item"><span>Portions estimées</span><b>~${bites}</b></div><div class="result-item"><span>Narcotiques</span><b>${narc||'—'}</b></div><div class="result-item"><span>Efficacité cible</span><b>~${eff.toFixed(1)}%</b></div></div><div class="chips" style="margin-top:14px">${c.foods.map((f,i)=>`<span class="chip">${i===0?'★ ':''}${esc(f)}</span>`).join('')}</div>`}

const breedSpecies=[
 ['Rex',300,5550,97],['Argentavis',180,5550,117],['Therizinosaur',100,5550,92],['Giganotosaurus',3000,18480,583],['Yutyrannus',300,5550,117],['Baryonyx',100,5550,92],['Rock Drake',360,5550,310],['Snow Owl',180,5550,117],['Managarmr',150,5550,117]
];
function breedingPage(){setTitle('Élevage');return `<div class="page-head"><div><div class="eyebrow">Nurserie</div><h1>Élevage</h1><p>Estimation des temps et suivi de plusieurs bébés.</p></div></div><div class="grid cols-2"><section class="card form-card"><div class="form-grid"><div class="full"><label>Espèce</label><select id="breedSpecies" class="control" style="width:100%">${breedSpecies.map(x=>`<option>${x[0]}</option>`).join('')}</select></div><div><label>Rate incubation</label><input id="eggRate" class="control" type="number" value="1" min="0.1" step="0.1" style="width:100%"></div><div><label>Rate maturation</label><input id="matureRate" class="control" type="number" value="1" min="0.1" step="0.1" style="width:100%"></div><div><label>Rate intervalle imprint</label><input id="cuddleRate" class="control" type="number" value="1" min="0.1" step="0.1" style="width:100%"></div><div><label>Nom du bébé (optionnel)</label><input id="babyName" class="control" placeholder="Ex. Rex Boss 01" style="width:100%"></div></div><div class="actions"><button id="calcBreed" class="btn primary">Calculer</button><button id="trackBreed" class="btn">Ajouter au suivi</button></div></section><section class="card"><h3>Résultat</h3><div id="breedResult" class="result-box">${breedResult('Rex',1,1,1)}</div></section></div><section class="section"><div class="section-head"><div><h2>Suivi des élevages</h2><p>Les minuteurs sont conservés sur cet appareil.</p></div></div><div id="breedTracking">${renderBreedTracking()}</div></section>`}
function breedResult(name,eggRate,matureRate,cuddleRate){const s=breedSpecies.find(x=>x[0]===name)||breedSpecies[0];const hatch=s[1]/Math.max(.1,eggRate),mature=s[2]/Math.max(.1,matureRate),cuddle=s[3]*Math.max(.1,cuddleRate);const imprints=Math.max(1,Math.floor(mature/Math.max(1,cuddle)));return `<div class="result-grid"><div class="result-item"><span>Incubation</span><b>${fmtDuration(hatch)}</b></div><div class="result-item"><span>Maturation</span><b>${fmtDuration(mature)}</b></div><div class="result-item"><span>Intervalle imprint</span><b>${fmtDuration(cuddle)}</b></div><div class="result-item"><span>Imprints possibles</span><b>~${imprints}</b></div></div>`}
function renderBreedMini(items){return `<div class="grid cols-3">${items.slice(0,3).map(b=>`<div class="card"><b>${esc(b.label)}</b><div class="muted">${esc(b.species)}</div><p class="countdown" data-countdown="${b.end}"></p></div>`).join('')}</div>`}
function renderBreedTracking(){const items=store.get('breeding',[]);if(!items.length)return '<div class="empty">Aucun bébé suivi. Ajoute-en depuis le calculateur ci-dessus.</div>';return `<div class="grid cols-2">${items.map((b,i)=>`<article class="card"><div class="myark-row"><div><b>${esc(b.label)}</b><div class="muted">${esc(b.species)}</div></div><span class="countdown" data-countdown="${b.end}"></span><button class="btn small danger" data-remove-breed="${i}">Supprimer</button></div></article>`).join('')}</div>`}
function updateCountdowns(){$$('[data-countdown]').forEach(el=>{const ms=Number(el.dataset.countdown)-Date.now();if(ms<=0){el.textContent='Mature';return}const total=Math.floor(ms/1000),d=Math.floor(total/86400),h=Math.floor(total%86400/3600),m=Math.floor(total%3600/60),s=total%60;el.textContent=`${d?d+'j ':''}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`})}

function toolsPage(){setTitle('Outils');return `<div class="page-head"><div><div class="eyebrow">Boîte à outils</div><h1>Outils</h1><p>Craft, boss et préparation de session.</p></div></div><div class="tool-tabs"><button class="btn tool-tab ${state.tool==='craft'?'active':''}" data-tool="craft">⚒️ Craft</button><button class="btn tool-tab ${state.tool==='boss'?'active':''}" data-tool="boss">👹 Boss</button><button class="btn tool-tab ${state.tool==='prep'?'active':''}" data-tool="prep">🎒 Checklist départ</button></div><div id="toolContent">${toolContent()}</div>`}
function toolContent(){if(state.tool==='boss')return bossTool();if(state.tool==='prep')return prepTool();return craftTool()}
function craftTool(){return `<div class="grid cols-2"><section class="card form-card"><label>Objet</label><select id="recipeSelect" class="control" style="width:100%">${state.crafting.map(r=>`<option>${esc(r.name)}</option>`).join('')}</select><div style="margin-top:13px"><label>Quantité</label><input id="recipeQty" class="control qty" type="number" min="1" value="1"></div><div class="actions"><button id="calcCraft" class="btn primary">Calculer</button></div></section><section class="card"><h3>Ressources totales</h3><div id="craftResult">${craftResult(state.crafting[0],1)}</div></section></div><section class="section"><div class="card"><h3>Recettes rapides</h3>${state.crafting.map(r=>`<div class="recipe-row"><b>${esc(r.name)}</b><span class="muted">${esc(r.station)}</span></div>`).join('')}</div></section>`}
function craftResult(r,qty){if(!r)return '';return `<div class="news-meta"><span class="tag teal">${esc(r.station)}</span><span>x${qty}</span></div>${Object.entries(r.ingredients).map(([k,v])=>`<div class="recipe-row"><b>${esc(k)}</b><span>${v*qty}</span></div>`).join('')}`}
function bossTool(){const done=store.get('bossDone',[]);return `<div class="card"><h3>Progression Boss</h3>${state.bosses.flatMap(b=>b.tiers.map(t=>{const id=`${b.map}|${b.name}|${t}`,checked=done.includes(id);return `<label class="boss-row"><input class="check" type="checkbox" data-boss="${esc(id)}" ${checked?'checked':''}><span><b>${esc(b.name)} — ${esc(t)}</b><small class="muted">${esc(b.map)} · Conseil : ${esc(b.suggest)}</small></span></label>`})).join('')}</div>`}
function prepTool(){const defaults=['Nourriture / eau','Armure de secours','Munitions','Cryopods / dinos','Médicaments','Grappin / parachute','Lit / sleeping bags','GPS / carte','Outils de farm','Retour sécurisé à la base'];const checks=store.get('prepChecks',[]);return `<div class="grid cols-2"><div class="card"><h3>Checklist départ</h3>${defaults.map(x=>`<label class="boss-row"><input class="check" type="checkbox" data-prep="${esc(x)}" ${checks.includes(x)?'checked':''}><b>${esc(x)}</b></label>`).join('')}</div><div class="card"><h3>Avant un boss</h3><p class="muted">Répare les selles et armures, vérifie les soins, la nourriture des dinos, les tributs et le poids de chaque survivant.</p><div class="notice">Les compositions varient selon la map, le tier du boss, tes stats de serveur et les mutations de tes créatures.</div></div></div>`}

function myArkPage(){setTitle('Mon ARK');const favs=store.get('favorites',[]),done=store.get('bossDone',[]),breed=store.get('breeding',[]);return `<div class="page-head"><div><div class="eyebrow">Espace personnel</div><h1>Mon ARK</h1><p>Tout reste local dans ton navigateur, sans compte obligatoire.</p></div></div><div class="grid cols-3">${stat('★',favs.length,'Créatures favorites')}${stat('✓',done.length,'Boss / tiers terminés')}${stat('🥚',breed.length,'Élevages suivis')}</div><section class="section"><div class="section-head"><div><h2>Créatures favorites</h2><p>Accès direct aux fiches que tu utilises le plus.</p></div></div>${favs.length?`<div class="grid cols-3">${state.creatures.filter(c=>favs.includes(c.name)).map(creatureCard).join('')}</div>`:'<div class="empty">Aucune créature favorite. Clique sur ★ dans le bestiaire.</div>'}</section><section class="section"><div class="section-head"><div><h2>Élevages</h2></div></div>${renderBreedTracking()}</section>`}

function render(){const r=currentRoute();navActive();$('#app').innerHTML=({home,news:newsPage,creatures:creaturesPage,maps:mapsPage,taming:tamingPage,breeding:breedingPage,tools:toolsPage,myark:myArkPage}[r]||home)();bindPage();updateCountdowns();}
function bindPage(){
  $$('[data-go]').forEach(x=>x.onclick=()=>go(x.dataset.go));
  $('#refreshNews')?.addEventListener('click',()=>refreshNews(true));
  $$('[data-news-filter]').forEach(b=>b.onclick=()=>{$$('[data-news-filter]').forEach(x=>x.classList.toggle('active',x===b));$$('[data-news-category]').forEach(c=>{const f=b.dataset.newsFilter;c.classList.toggle('hidden',f!=='all' && (f==='other'?c.dataset.newsCategory==='Community Crunch':c.dataset.newsCategory!==f))})});
  const filterCreatures=()=>{const q=($('#creatureSearch')?.value||'').toLowerCase(),map=$('#creatureMap')?.value||'',cat=state.creatureFilter;$$('#creatureGrid .creature-card').forEach(c=>{const okQ=c.dataset.name.toLowerCase().includes(q),okM=!map||c.dataset.maps.includes(map),okC=cat==='Tous'||c.dataset.cat===cat;c.classList.toggle('hidden',!(okQ&&okM&&okC))})};
  $('#creatureSearch')?.addEventListener('input',filterCreatures);$('#creatureMap')?.addEventListener('change',filterCreatures);
  $$('[data-creature-cat]').forEach(b=>b.onclick=()=>{state.creatureFilter=b.dataset.creatureCat;$$('[data-creature-cat]').forEach(x=>x.classList.toggle('active',x===b));filterCreatures()});
  $$('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();let f=store.get('favorites',[]),name=b.dataset.fav;if(f.includes(name)){f=f.filter(x=>x!==name);toast(`${name} retiré des favoris`)}else{f.push(name);toast(`${name} ajouté à Mon ARK`)}store.set('favorites',f);b.classList.toggle('active',f.includes(name))});
  $$('[data-creature]').forEach(b=>b.onclick=()=>{const c=state.creatures.find(x=>x.name===b.dataset.creature);document.body.insertAdjacentHTML('beforeend',creatureModal(c));bindModal()});
  $$('[data-tame-creature]').forEach(b=>b.onclick=()=>{sessionStorage.setItem('aah:tameCreature',b.dataset.tameCreature);$('#modal')?.remove();go('taming')});
  $$('[data-map-card]').forEach(c=>c.onclick=()=>{state.mapFilter=c.dataset.mapCard;render()});
  const updateTame=()=>{$('#tameResult').innerHTML=tameResult($('#tameCreature').value,+$('#tameLevel').value,+$('#tameRate').value,+$('#foodRate').value,+$('#narcMargin').value)};$('#calcTame')?.addEventListener('click',updateTame);['tameCreature','tameLevel','tameRate','foodRate','narcMargin'].forEach(id=>$(`#${id}`)?.addEventListener('change',updateTame));
  const updateBreed=()=>{$('#breedResult').innerHTML=breedResult($('#breedSpecies').value,+$('#eggRate').value,+$('#matureRate').value,+$('#cuddleRate').value)};$('#calcBreed')?.addEventListener('click',updateBreed);
  $('#trackBreed')?.addEventListener('click',()=>{const species=$('#breedSpecies').value,s=breedSpecies.find(x=>x[0]===species),rate=Math.max(.1,+$('#matureRate').value),mins=s[2]/rate,label=$('#babyName').value.trim()||`${species} bébé`,items=store.get('breeding',[]);items.push({species,label,end:Date.now()+mins*60000,created:Date.now()});store.set('breeding',items);$('#breedTracking').innerHTML=renderBreedTracking();bindPage();toast('Élevage ajouté au suivi')});
  $$('[data-remove-breed]').forEach(b=>b.onclick=()=>{const a=store.get('breeding',[]);a.splice(+b.dataset.removeBreed,1);store.set('breeding',a);render()});
  $$('[data-tool]').forEach(b=>b.onclick=()=>{state.tool=b.dataset.tool;render()});
  const updCraft=()=>{$('#craftResult').innerHTML=craftResult(state.crafting.find(r=>r.name===$('#recipeSelect').value),Math.max(1,+$('#recipeQty').value||1))};$('#calcCraft')?.addEventListener('click',updCraft);$('#recipeSelect')?.addEventListener('change',updCraft);$('#recipeQty')?.addEventListener('input',updCraft);
  $$('[data-boss]').forEach(c=>c.onchange=()=>{let a=store.get('bossDone',[]);if(c.checked&&!a.includes(c.dataset.boss))a.push(c.dataset.boss);if(!c.checked)a=a.filter(x=>x!==c.dataset.boss);store.set('bossDone',a)});
  $$('[data-prep]').forEach(c=>c.onchange=()=>{let a=store.get('prepChecks',[]);if(c.checked&&!a.includes(c.dataset.prep))a.push(c.dataset.prep);if(!c.checked)a=a.filter(x=>x!==c.dataset.prep);store.set('prepChecks',a)});
}
function bindModal(){$('[data-close]')?.addEventListener('click',()=>$('#modal')?.remove());$('#modal')?.addEventListener('click',e=>{if(e.target.id==='modal')e.currentTarget.remove()});$$('#modal [data-tame-creature]').forEach(b=>b.onclick=()=>{sessionStorage.setItem('aah:tameCreature',b.dataset.tameCreature);$('#modal')?.remove();go('taming')})}
function searchIndex(){const items=[];state.creatures.forEach(c=>items.push({label:c.name,type:'Créature',route:'creatures',keywords:[c.role,c.diet,...c.maps].join(' '),action:()=>{go('creatures');setTimeout(()=>{const b=$(`[data-creature="${CSS.escape(c.name)}"]`);b?.click()},40)}}));state.maps.forEach(m=>items.push({label:m.name,type:'Carte',route:'maps',keywords:m.resources.join(' '),action:()=>{state.mapFilter=m.name;go('maps')}}));state.crafting.forEach(r=>items.push({label:r.name,type:'Craft',route:'tools',keywords:Object.keys(r.ingredients).join(' '),action:()=>{state.tool='craft';go('tools');setTimeout(()=>{$('#recipeSelect').value=r.name;$('#recipeSelect').dispatchEvent(new Event('change'))},30)}}));state.bosses.forEach(b=>items.push({label:b.name,type:'Boss',route:'tools',keywords:`${b.map} ${b.suggest}`,action:()=>{state.tool='boss';go('tools')}}));return items}
function setupSearch(){const input=$('#globalSearch'),box=$('#searchResults');const run=()=>{const q=input.value.trim().toLowerCase();if(!q){box.classList.add('hidden');return}const res=searchIndex().filter(x=>`${x.label} ${x.type} ${x.keywords}`.toLowerCase().includes(q)).slice(0,8);box.innerHTML=res.length?res.map((r,i)=>`<div class="search-hit" data-search-i="${i}"><b>${esc(r.label)}</b><small>${esc(r.type)}</small></div>`).join(''):'<div class="search-hit muted">Aucun résultat</div>';box.classList.remove('hidden');$$('[data-search-i]',box).forEach(el=>el.onclick=()=>{res[+el.dataset.searchI].action();input.value='';box.classList.add('hidden')})};input.addEventListener('input',run);document.addEventListener('click',e=>{if(!e.target.closest('.search-strip'))box.classList.add('hidden')});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input.focus();input.select()}if(e.key==='Escape')box.classList.add('hidden')})}

window.addEventListener('popstate',render);
$$('[data-route]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();go(a.dataset.route);$('.main-nav').classList.remove('open')}));
$('#menuBtn').onclick=()=>$('.main-nav').classList.toggle('open');
setInterval(updateCountdowns,1000);

await loadData();setupSearch();render();refreshNews(false);
