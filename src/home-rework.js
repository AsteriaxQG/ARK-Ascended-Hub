const q=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?v:new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'long',year:'numeric'}).format(d)};
let running=false;

function fallback(){return {
  version:'v93.7',title:'ASA Server Patch Notes — v93.7',date:'2026-08-27',platform:'Serveurs ASA',
  url:'https://survivetheark.com/index.php?/forums/topic/773786-asa-server-patch-notes-server-v937-updated-08272026/',
  highlights:['Ajout du Boaratos sur Astraeos','Ajout du Concavenator et de ses variantes','Ajout du Galleon pour Tides of Fortune','Ajout du Trireme pour Astraeos','Astraeos 0.1.4 : nouvelles zones, boss et contenu','Correctifs généraux, performances et exploits']
}}

async function patchData(){
  try{const r=await fetch('/api/patch-note',{cache:'no-store'});const j=await r.json();return j?.version?j:fallback()}catch{return fallback()}
}

function patchMarkup(p){
  const items=(p.highlights||[]).slice(0,6);
  return `<section class="section home-patch-section" id="latestPatch">
    <div class="section-head patch-section-head"><div><div class="eyebrow">MISE À JOUR OFFICIELLE</div><h2>Dernier Patch Note</h2><p>Le dernier changelog ARK: Survival Ascended à connaître avant de lancer ta session.</p></div><span class="patch-live ${p.live===false?'offline':''}">${p.live===false?'CACHE':'SOURCE OFFICIELLE'}</span></div>
    <article class="card patch-card v2-card">
      <div class="patch-version-panel"><span class="patch-kicker">ASA PATCH</span><strong>${esc(p.version)}</strong><span>${esc(p.platform||'ARK: Survival Ascended')}</span><time>${esc(fmt(p.date))}</time></div>
      <div class="patch-main"><div class="patch-title-row"><div><div class="news-meta"><span class="tag teal">PATCH NOTE</span><span>${esc(fmt(p.date))}</span></div><h3>${esc(p.title||`Patch ${p.version}`)}</h3></div><a class="btn primary patch-source" target="_blank" rel="noreferrer" href="${esc(p.url)}">Patch complet ↗</a></div>
        <div class="patch-highlights">${items.map((x,i)=>`<div class="patch-point"><span>${String(i+1).padStart(2,'0')}</span><p>${esc(x)}</p></div>`).join('')}</div>
        <div class="patch-tags"><span>Boaratos</span><span>Concavenator</span><span>Galleon</span><span>Trireme</span><span>Astraeos 0.1.4</span></div>
      </div>
    </article>
  </section>`;
}

async function run(){
  if(location.pathname!=='/'||running)return;
  const app=q('#app'); if(!app)return;
  running=true;
  try{
    app.classList.add('home-reworked');
    const quick=[...app.querySelectorAll('.section')].find(s=>q('h2',s)?.textContent.trim()==='Accès rapide');
    if(quick){q('h2',quick).textContent='Prépare ta session';const p=q('.section-head p',quick);if(p)p.textContent='Les raccourcis les plus utiles avant et pendant ta partie.';quick.classList.add('home-session-tools')}
    const hero=q('.hero-v2');
    if(hero&&!q('.hero-mini-status',hero)){
      const actions=q('.actions',hero);actions?.insertAdjacentHTML('beforebegin','<div class="hero-mini-status"><span>LIVE</span><b>Infos ASA à jour</b><i>Patchs · News · Bestiaire · Outils</i></div>');
    }
    if(!q('#latestPatch',app)){
      const p=await patchData();
      const dash=q('.dashboard-strip',app);
      if(dash)dash.insertAdjacentHTML('afterend',patchMarkup(p));else hero?.insertAdjacentHTML('afterend',patchMarkup(p));
      const consoleHead=q('.hero-console .console-head',hero);
      if(consoleHead&&!q('.console-patch',consoleHead))consoleHead.insertAdjacentHTML('beforeend',`<span class="console-patch">PATCH ${esc(p.version)}</span>`);
    }
  }finally{running=false}
}

const app=q('#app');
if(app)new MutationObserver(()=>setTimeout(run,30)).observe(app,{childList:true,subtree:false});
addEventListener('popstate',()=>setTimeout(run,50));
setTimeout(run,80);
