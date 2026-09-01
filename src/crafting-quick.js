const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let recipes=[];
let loading=false;

async function loadRecipes(){
  if(recipes.length||loading)return;
  loading=true;
  try{
    const r=await fetch('/data/crafting.json',{cache:'no-store'});
    if(r.ok)recipes=await r.json();
  }catch{}
  loading=false;
}

function selectRecipe(name){
  const sel=$('#recipeSelect');
  if(!sel)return;
  sel.value=name;
  sel.dispatchEvent(new Event('change',{bubbles:true}));
  $('#calcCraft')?.click();
  const result=$('#craftResult')?.closest('.card');
  result?.scrollIntoView({behavior:'smooth',block:'center'});
}

function recipeCard(r){
  const ingredients=Object.entries(r.ingredients||{});
  return `<article class="craft-quick-card" data-quick-recipe="${esc(r.name)}" tabindex="0" role="button" aria-label="Sélectionner ${esc(r.name)}">
    <div class="craft-quick-top">
      <div>
        <span class="craft-station">${esc(r.station||'Station inconnue')}</span>
        <h4>${esc(r.name)}</h4>
      </div>
      <span class="craft-arrow">→</span>
    </div>
    <div class="craft-ingredient-list">
      ${ingredients.map(([name,qty])=>`<div class="craft-ingredient"><span>${esc(name)}</span><b>${esc(qty)}</b></div>`).join('')}
    </div>
    <div class="craft-quick-foot">Cliquer pour charger dans le calculateur</div>
  </article>`;
}

async function enhance(){
  if(location.pathname!=='/outils')return;
  await loadRecipes();
  if(!recipes.length)return;
  const cards=$$('#toolContent .card');
  const quick=cards.find(c=>$('h3',c)?.textContent.trim()==='Recettes rapides');
  if(!quick||quick.dataset.enhancedRecipes==='1')return;
  quick.dataset.enhancedRecipes='1';
  quick.classList.add('craft-quick-wrap');
  quick.innerHTML=`
    <div class="craft-quick-head">
      <div><div class="eyebrow">CRAFT RAPIDE</div><h3>Recettes rapides</h3><p class="muted">Quantités de base pour x1. Clique sur une recette pour la charger automatiquement dans le calculateur.</p></div>
      <input id="quickRecipeSearch" class="control" placeholder="Rechercher une recette…" aria-label="Rechercher une recette">
    </div>
    <div id="quickRecipeGrid" class="craft-quick-grid">${recipes.map(recipeCard).join('')}</div>`;

  $$('[data-quick-recipe]',quick).forEach(card=>{
    card.addEventListener('click',()=>selectRecipe(card.dataset.quickRecipe));
    card.addEventListener('keydown',e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      e.preventDefault();
      selectRecipe(card.dataset.quickRecipe);
    });
  });
  $('#quickRecipeSearch',quick)?.addEventListener('input',e=>{
    const q=e.target.value.trim().toLowerCase();
    $$('[data-quick-recipe]',quick).forEach(card=>{
      card.classList.toggle('hidden',q&&!card.textContent.toLowerCase().includes(q));
    });
  });
}

const app=$('#app');
if(app)new MutationObserver(()=>setTimeout(enhance,50)).observe(app,{childList:true,subtree:true});
document.addEventListener('click',()=>setTimeout(enhance,60));
addEventListener('popstate',()=>setTimeout(enhance,60));
setTimeout(enhance,120);
