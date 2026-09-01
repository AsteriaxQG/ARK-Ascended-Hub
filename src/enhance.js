const AAH2 = (() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const routes={home:'/',news:'/actus',creatures:'/creatures',maps:'/cartes',taming:'/taming',breeding:'/elevage',tools:'/outils',myark:'/mon-ark'};
  let data=null, busy=false;

  async function getData(){
    if(data) return data;
    try{
      const [creatures,maps,bosses]=await Promise.all([
        fetch('/data/creatures.json').then(r=>r.json()),
        fetch('/data/maps.json').then(r=>r.json()),
        fetch('/data/bosses.json').then(r=>r.json())
      ]);
      data={creatures,maps,bosses};
    }catch{data={creatures:[],maps:[],bosses:[]}}
    return data;
  }
  function store(key,fallback=[]){try{return JSON.parse(localStorage.getItem(`aah:${key}`))??fallback}catch{return fallback}}
  function route(){return location.pathname}
  function fmtDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(d)}

  function pageBanner(){
    const h=$('#app .page-head');
    if(h&&!h.classList.contains('page-banner')) h.classList.add('page-banner');
  }
  function addMetrics(target,items){
    if(!target || $('.page-metrics',target)) return;
    target.insertAdjacentHTML('beforeend',`<div class="page-metrics">${items.map(([n,l])=>`<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('')}</div>`);
  }
  function decorateCommon(){
    pageBanner();
    $$('#app .card').forEach(c=>c.classList.add('v2-card'));
  }

  async function enhanceHome(){
    const d=await getData();
    const hero=$('#app .hero'); if(!hero) return;
    hero.classList.add('hero-v2');
    const favs=store('favorites'), breed=store('breeding'), bossDone=store('bossDone');
    const activeBreed=breed.filter(x=>Number(x.end)>Date.now()).length;
    if(!$('.live-badge',hero)){
      hero.insertAdjacentHTML('afterbegin','<div class="live-badge"><span></span> ARK: SURVIVAL ASCENDED · COMPAGNON FR</div>');
      const p=$('p',hero); if(p) p.textContent='Actualités, créatures, cartes, tame, élevage, craft et progression réunis dans un hub pensé pour rester ouvert à côté du jeu.';
      const h1=$('h1',hero); if(h1) h1.innerHTML='Prépare ta survie.<br><span class="accent">Gagne du temps en jeu.</span>';
      const actions=$('.actions',hero);
      actions?.insertAdjacentHTML('afterend','<div class="hero-tags"><span>ASA uniquement</span><span>Favoris locaux</span><span>Minuteurs élevage</span><span>News officielles</span></div>');
      hero.insertAdjacentHTML('beforeend',`<aside class="hero-console"><div class="console-head"><span>SESSION STATUS</span><i></i></div><div class="console-row"><span>Créatures</span><b>${d.creatures.length}</b></div><div class="console-row"><span>Cartes suivies</span><b>${d.maps.length}</b></div><div class="console-row"><span>Favoris</span><b>${favs.length}</b></div><div class="console-row"><span>Élevages actifs</span><b>${activeBreed}</b></div><div class="console-foot">Tes données personnelles restent enregistrées sur cet appareil.</div></aside>`);
    }
    const quick=$$('.quick-card'); quick.forEach(c=>c.parentElement?.classList.add('quick-grid'));
    const sections=$$('#app .section');
    sections[0]?.classList.add('dashboard-strip');
    const lastNews=sections.find(s=>$('h2',s)?.textContent.includes('Dernière actu'));
    if(lastNews) lastNews.classList.add('home-news-section');
    const breeding=sections.find(s=>$('h2',s)?.textContent.includes('élevages'));
    if(breeding) breeding.classList.add('home-breeding-section');
    if(!$('#featuredCreatures')){
      const featured=['Rex','Argentavis','Therizinosaur'].map(n=>d.creatures.find(c=>c.name===n)).filter(Boolean);
      const host=sections[2] || sections[1];
      host?.insertAdjacentHTML('afterend',`<section class="section" id="featuredCreatures"><div class="section-head"><div><div class="eyebrow">Bestiaire</div><h2>Créatures essentielles</h2><p>Trois incontournables pour progresser, farmer et préparer les boss.</p></div><a class="btn small" href="/creatures">Voir le bestiaire</a></div><div class="grid cols-3 featured-simple">${featured.map(c=>`<a class="card featured-simple-card" href="/creatures"><div class="featured-monogram">${esc(c.name.slice(0,2).toUpperCase())}</div><div><div class="eyebrow">${esc(c.category)}</div><h3>${esc(c.name)}</h3><p>${esc(c.role)}</p><div class="chips"><span class="chip">${esc(c.diet)}</span><span class="chip">Tame ${esc(c.tame)}</span><span class="chip">${c.maps.length} maps</span></div></div><span class="arrow">→</span></a>`).join('')}</div></section>`);
    }
    refreshHomeNews();
  }

  async function refreshHomeNews(){
    const section=$('.home-news-section'); if(!section || section.dataset.live==='1') return;
    section.dataset.live='1';
    try{
      const j=await fetch('/api/news',{cache:'no-store'}).then(r=>r.json()); const n=j.items?.[0]; if(!n)return;
      const card=$('.card',section); if(!card)return;
      card.classList.add('featured-news-card');
      card.innerHTML=`${n.image?`<div class="featured-news-img" style="background-image:linear-gradient(90deg,rgba(6,15,18,.08),rgba(6,15,18,.5)),url('${esc(n.image)}')"></div>`:''}<div class="featured-news-copy"><div class="news-meta"><span class="tag teal">${esc(n.category||'ARK')}</span><span>${fmtDate(n.date)}</span></div><h3>${esc(n.title)}</h3><p>${esc((n.summary||'Actualité officielle ARK.').slice(0,230))}${(n.summary||'').length>230?'…':''}</p><a class="accent" target="_blank" rel="noreferrer" href="${esc(n.url)}">Lire la source officielle →</a></div>`;
    }catch{}
  }

  async function enhanceNews(){
    pageBanner(); const grid=$('#newsGrid'); if(!grid)return;
    grid.classList.add('news-v2-grid');
    const first=$('.news-card',grid); if(first&&!first.classList.contains('news-lead')) first.classList.add('news-lead');
    const ph=$('#app .page-head'); ph?.querySelector('button')?.classList.add('refresh-news-v2');
  }
  async function enhanceCreatures(){
    const d=await getData(); pageBanner();
    const head=$('#app .page-head'); addMetrics(head,[[d.creatures.length,'fiches'],[store('favorites').length,'favoris']]);
    const grid=$('#creatureGrid'); grid?.classList.add('creature-grid');
    const filters=$$('#app > .filters'); if(filters.length&&!$('.finder')){
      const wrap=document.createElement('div'); wrap.className='finder card'; filters[0].parentNode.insertBefore(wrap,filters[0]); filters.forEach(f=>wrap.appendChild(f));
    }
  }
  async function enhanceMaps(){
    const d=await getData(); pageBanner(); const head=$('#app .page-head'); addMetrics(head,[[d.maps.length,'cartes'],['ASA','actuel']]);
    const grid=$('#app > .grid.cols-4'); if(grid) grid.classList.add('map-selector');
    $$('.map-card').forEach(c=>c.querySelector('.map-art')?.insertAdjacentHTML('beforeend',`<span>${esc(($('h3',c)?.textContent||'AR').slice(0,2).toUpperCase())}</span>`));
  }
  function tamePresets(){
    const head=$('#app .page-head'); if(!head||$('.rate-presets',head))return;
    head.insertAdjacentHTML('beforeend','<div class="rate-presets"><span>Rates rapides</span><button class="filter-chip" data-rate="1">x1</button><button class="filter-chip" data-rate="2">x2</button><button class="filter-chip" data-rate="3">x3</button><button class="filter-chip" data-rate="5">x5</button></div>');
    $$('[data-rate]',head).forEach(b=>b.onclick=()=>{const v=b.dataset.rate;if($('#tameRate'))$('#tameRate').value=v;$('#calcTame')?.click();$$('[data-rate]',head).forEach(x=>x.classList.toggle('active',x===b))});
  }
  function breedPresets(){
    const card=$('#app .form-card'); if(!card||$('.rate-presets',card))return;
    card.insertAdjacentHTML('afterbegin','<div class="rate-presets inline"><span>Préréglages</span><button class="filter-chip" data-brate="1">x1</button><button class="filter-chip" data-brate="2">x2</button><button class="filter-chip" data-brate="5">x5</button><button class="filter-chip" data-brate="10">x10</button></div>');
    $$('[data-brate]',card).forEach(b=>b.onclick=()=>{const v=b.dataset.brate; if($('#eggRate'))$('#eggRate').value=v;if($('#matureRate'))$('#matureRate').value=v;$('#calcBreed')?.click();$$('[data-brate]',card).forEach(x=>x.classList.toggle('active',x===b))});
  }
  async function enhanceTaming(){pageBanner();tamePresets();$('#app > .grid.cols-2')?.classList.add('calculator-layout');$$('#app > .grid.cols-2 > .card').forEach((c,i)=>c.classList.add(i?'result-card':'calculator-card'))}
  async function enhanceBreeding(){pageBanner();breedPresets();$('#app > .grid.cols-2')?.classList.add('calculator-layout');$$('#app > .grid.cols-2 > .card').forEach((c,i)=>c.classList.add(i?'result-card':'calculator-card'))}
  async function enhanceMyArk(){
    const d=await getData(); pageBanner(); const head=$('#app .page-head'); if(!head||$('.progress-ring',head))return;
    const done=store('bossDone').length,total=d.bosses.reduce((n,b)=>n+(b.tiers?.length||0),0),pct=total?Math.round(done/total*100):0;
    head.insertAdjacentHTML('beforeend',`<div class="progress-ring" style="--p:${pct}"><b>${pct}%</b><span>boss</span></div>`);
  }
  async function run(){
    if(busy)return; busy=true;
    try{
      decorateCommon();
      const p=route();
      if(p==='/')await enhanceHome();
      else if(p==='/actus')await enhanceNews();
      else if(p==='/creatures')await enhanceCreatures();
      else if(p==='/cartes')await enhanceMaps();
      else if(p==='/taming')await enhanceTaming();
      else if(p==='/elevage')await enhanceBreeding();
      else if(p==='/mon-ark')await enhanceMyArk();
      else if(p==='/outils')pageBanner();
    }finally{busy=false}
  }
  const app=$('#app'); if(app)new MutationObserver(()=>queueMicrotask(run)).observe(app,{childList:true,subtree:false});
  addEventListener('popstate',()=>setTimeout(run));
  run();
  return {run};
})();
