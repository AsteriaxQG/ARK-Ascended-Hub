const WYVERNS = [
  {name:'Fire Wyvern',fr:'Wyverne de feu',icon:'🔥',desc:'Souffle de feu en cône. Variante emblématique de Scorched Earth.',maps:'Scorched Earth · Ragnarok'},
  {name:'Lightning Wyvern',fr:'Wyverne de foudre',icon:'⚡',desc:'Rayon électrique continu, très dangereux à moyenne distance.',maps:'Scorched Earth · Ragnarok'},
  {name:'Poison Wyvern',fr:'Wyverne de poison',icon:'☠',desc:'Projette une boule toxique explosive, idéale pour harceler à distance.',maps:'Scorched Earth · Ragnarok'},
  {name:'Ice Wyvern',fr:'Wyverne de glace',icon:'❄',desc:'Souffle glacé qui ralentit les cibles. Variante native de Ragnarok.',maps:'Ragnarok'}
];

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];

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
      <div><div class="eyebrow">FAMILLE DE CRÉATURES</div><h2>Les Wyvernes</h2><p>Chaque variante possède son propre souffle, ses zones de spawn et sa fiche. Pour les apprivoiser, il faut voler un œuf puis élever le bébé.</p></div>
      <div class="wyvern-family-count"><b>4</b><span>variantes principales</span></div>
    </div>
    <div class="wyvern-variant-grid">
      ${WYVERNS.map(w=>`<article class="card wyvern-variant-card creature-card" data-name="${w.name}" tabindex="0" role="button" aria-label="Ouvrir la fiche ${w.fr}">
        <div class="creature-img"><div class="wyvern-element">${w.icon}</div></div>
        <div class="wyvern-variant-body">
          <div class="eyebrow">WYVERN · ${w.fr.replace('Wyverne de ','').toUpperCase()}</div>
          <h3>${w.fr}</h3>
          <p>${w.desc}</p>
          <div class="chips"><span class="chip">Œuf</span><span class="chip">Lait de Wyvern</span></div>
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
    const h3=q('h3',card);
    if(h3&&h3.textContent!==w.fr)h3.textContent=w.fr;
    const top=q('.creature-top > div',card);
    if(top&&!q('.wyvern-family-chip',top))top.insertAdjacentHTML('beforeend',`<span class="wyvern-family-chip">${w.icon} Famille Wyvern</span>`);
  });
}

function decorateModal(){
  const modal=q('#modal .modal-panel');
  if(!modal)return;
  const h1=q('h1',modal); if(!h1)return;
  const w=WYVERNS.find(x=>x.name===h1.textContent.trim());
  if(!w||q('.wyvern-modal-label',modal))return;
  h1.insertAdjacentHTML('afterend',`<div class="wyvern-modal-label">${w.icon} ${w.fr}</div>`);
  const p=q('p.muted',modal);
  p?.insertAdjacentHTML('afterend',`<div class="wyvern-tip"><b>Méthode :</b> voler un œuf dans un nid sauvage, l’incuber, puis nourrir le bébé avec du Lait de Wyvern.</div>`);
  const tame=q('[data-tame-creature]',modal); if(tame)tame.remove();
}

function run(){showcase();decorateGrid();decorateModal()}
const app=q('#app');
if(app)new MutationObserver(()=>setTimeout(run,40)).observe(app,{childList:true,subtree:true});
document.addEventListener('click',()=>setTimeout(run,60));
addEventListener('popstate',()=>setTimeout(run,60));
setTimeout(run,100);
