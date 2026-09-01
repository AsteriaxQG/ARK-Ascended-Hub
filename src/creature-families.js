const WYVERNS = [
  {name:'Fire Wyvern',fr:'Wyverne de feu',icon:'🔥',element:'Feu',desc:'Souffle de feu en cône. Variante emblématique de Scorched Earth.',maps:'Scorched Earth · Ragnarok',aliases:['fire wyvern','wyvern fire','wyverne feu']},
  {name:'Lightning Wyvern',fr:'Wyverne de foudre',icon:'⚡',element:'Foudre',desc:'Rayon électrique continu, extrêmement dangereux à moyenne et longue distance.',maps:'Scorched Earth · Ragnarok',aliases:['lightning wyvern','wyvern lightning','wyverne foudre']},
  {name:'Poison Wyvern',fr:'Wyverne de poison',icon:'☠',element:'Poison',desc:'Projette une boule toxique explosive permettant d’attaquer à distance.',maps:'Scorched Earth · Ragnarok',aliases:['poison wyvern','wyvern poison','wyverne poison']},
  {name:'Ice Wyvern',fr:'Wyverne de glace',icon:'❄',element:'Glace',desc:'Souffle glacé qui ralentit fortement les cibles. Variante native de Ragnarok.',maps:'Ragnarok',aliases:['ice wyvern','wyvern ice','wyverne glace']}
];

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const byInternal=name=>WYVERNS.find(w=>w.name===name);
const byAnyName=name=>WYVERNS.find(w=>w.name===name||w.fr===name);

function openCreature(name){
  const btn=qa('#creatureGrid [data-creature]').find(b=>b.dataset.creature===name);
  btn?.click();
}

function showcase(){
  if(location.pathname!=='/creatures')return;
  const app=q('#app'), grid=q('#creatureGrid');
  if(!app||!grid||q('#wyvernFamily'))return;
  const section=document.createElement('section');
  section.id='wyvernFamily';
  section.className='wyvern-family';
  section.innerHTML=`
    <div class="wyvern-family-head">
      <div><div class="eyebrow">FAMILLE DE CRÉATURES</div><h2>Les Wyvernes</h2><p>Les quatre variantes principales sont présentées séparément. Chacune possède son propre souffle et sa propre fiche. Pour les apprivoiser, il faut voler un œuf sauvage, l’incuber puis élever le bébé.</p></div>
      <div class="wyvern-family-count"><b>4</b><span>variantes principales</span></div>
    </div>
    <div class="wyvern-variant-grid">
      ${WYVERNS.map(w=>`<article class="card wyvern-variant-card creature-card" data-name="${w.name}" data-fr-name="${w.fr}" tabindex="0" role="button" aria-label="Ouvrir la fiche ${w.fr}">
        <div class="creature-img"><div class="wyvern-element">${w.icon}</div></div>
        <div class="wyvern-variant-body">
          <div class="eyebrow">WYVERNE · ${w.element.toUpperCase()}</div>
          <h3>${w.fr}</h3>
          <p>${w.desc}</p>
          <div class="chips"><span class="chip">Obtention par œuf</span><span class="chip">Lait de Wyvern</span></div>
          <small>${w.maps}</small>
          <button class="btn small" data-family-creature="${w.name}">Voir la fiche</button>
        </div>
      </article>`).join('')}
    </div>`;
  grid.parentNode.insertBefore(section,grid);
  qa('[data-family-creature]',section).forEach(b=>b.onclick=e=>{e.stopPropagation();openCreature(b.dataset.familyCreature)});
  qa('.wyvern-variant-card',section).forEach(card=>{
    card.onclick=e=>{if(e.target.closest('button,a'))return;openCreature(card.dataset.name)};
    card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openCreature(card.dataset.name)}};
  });
}

function decorateGrid(){
  if(location.pathname!=='/creatures')return;
  WYVERNS.forEach(w=>{
    const card=qa('#creatureGrid .creature-card').find(c=>c.dataset.name===w.name);
    if(!card)return;
    card.classList.add('wyvern-grid-card');
    card.dataset.frName=w.fr;
    card.setAttribute('aria-label',`Ouvrir la fiche ${w.fr}`);
    const h3=q('h3',card);
    if(h3)h3.textContent=w.fr;
    const top=q('.creature-top > div',card);
    if(top&&!q('.wyvern-family-chip',top))top.insertAdjacentHTML('beforeend',`<span class="wyvern-family-chip">${w.icon} Wyverne de ${w.element.toLowerCase()}</span>`);
  });
}

function decorateModal(){
  const modal=q('#modal .modal-panel');
  if(!modal)return;
  const h1=q('h1',modal); if(!h1)return;
  const w=byAnyName(h1.textContent.trim())||byInternal(modal.dataset.arkName);
  if(!w)return;
  modal.dataset.arkName=w.name;
  h1.textContent=w.fr;
  if(!q('.wyvern-modal-label',modal))h1.insertAdjacentHTML('afterend',`<div class="wyvern-modal-label">${w.icon} Variante ${w.element}</div>`);
  const p=q('p.muted',modal);
  if(p&&!q('.wyvern-tip',modal))p.insertAdjacentHTML('afterend',`<div class="wyvern-tip"><b>Obtention :</b> voler un œuf de ${w.fr.toLowerCase()} dans un nid sauvage, l’incuber, puis nourrir le bébé avec du Lait de Wyvern.</div>`);
  const tame=q('[data-tame-creature]',modal); if(tame)tame.remove();
}

function translateGlobalSearchResults(){
  const box=q('#searchResults');
  if(!box)return;
  qa('.search-hit b',box).forEach(el=>{
    const w=byInternal(el.textContent.trim());
    if(w)el.textContent=w.fr;
  });
}

function enableFrenchAndEnglishCreatureSearch(){
  const input=q('#creatureSearch');
  if(!input||input.dataset.wyvernAliases==='1')return;
  input.dataset.wyvernAliases='1';
  input.addEventListener('input',()=>{
    setTimeout(()=>{
      const needle=input.value.trim().toLowerCase();
      if(!needle)return;
      WYVERNS.forEach(w=>{
        const matches=[w.fr,w.name,...w.aliases].some(v=>v.toLowerCase().includes(needle)||needle.includes(v.toLowerCase()));
        if(!matches)return;
        const card=qa('#creatureGrid .creature-card').find(c=>c.dataset.name===w.name);
        if(card)card.classList.remove('hidden');
      });
    },0);
  });
}

function enableGlobalAliasSearch(){
  const input=q('#globalSearch');
  if(!input||input.dataset.wyvernAliases==='1')return;
  input.dataset.wyvernAliases='1';
  input.addEventListener('input',()=>{
    const needle=input.value.trim().toLowerCase();
    const w=WYVERNS.find(x=>[x.fr,x.name,...x.aliases].some(v=>v.toLowerCase().includes(needle)||needle.includes(v.toLowerCase())));
    if(!w||needle.length<3)return;
    setTimeout(()=>{
      translateGlobalSearchResults();
      const box=q('#searchResults');
      if(!box)return;
      const existing=qa('.search-hit b',box).some(b=>b.textContent.trim()===w.fr);
      if(existing)return;
      const hit=document.createElement('div');
      hit.className='search-hit wyvern-search-hit';
      hit.innerHTML=`<b>${w.fr}</b><small>Créature · Wyvern</small>`;
      hit.onclick=()=>{history.pushState({},'','/creatures');window.dispatchEvent(new PopStateEvent('popstate'));setTimeout(()=>openCreature(w.name),100);input.value='';box.classList.add('hidden')};
      box.prepend(hit);box.classList.remove('hidden');
    },0);
  });
}

function run(){
  showcase();
  decorateGrid();
  decorateModal();
  enableFrenchAndEnglishCreatureSearch();
  enableGlobalAliasSearch();
  translateGlobalSearchResults();
}
const app=q('#app');
if(app)new MutationObserver(()=>setTimeout(run,40)).observe(app,{childList:true,subtree:true});
document.addEventListener('click',()=>setTimeout(run,60));
addEventListener('popstate',()=>setTimeout(run,60));
setTimeout(run,100);
