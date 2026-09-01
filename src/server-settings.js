const SERVER_KEY='aah:serverSettings';
const DEFAULTS={name:'',taming:1,foodDrain:1,harvest:1,incubation:1,maturation:1,imprint:1};

const q=(s,r=document)=>r.querySelector(s);
const num=(v,f=1)=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:f};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function getSettings(){
  try{
    const raw=JSON.parse(localStorage.getItem(SERVER_KEY)||'{}');
    return {
      name:String(raw.name||''),
      taming:num(raw.taming),foodDrain:num(raw.foodDrain),harvest:num(raw.harvest),
      incubation:num(raw.incubation),maturation:num(raw.maturation),imprint:num(raw.imprint)
    };
  }catch{return {...DEFAULTS}}
}

function setSettings(v){localStorage.setItem(SERVER_KEY,JSON.stringify(v))}
function fmt(v){return Number(v).toLocaleString('fr-FR',{maximumFractionDigits:2})}

function toast(msg){
  const t=q('#toast'); if(!t)return;
  t.textContent=msg;t.classList.add('show');
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2200);
}

function panelMarkup(){
  const s=getSettings();
  return `<section class="section server-settings" id="mon-serveur">
    <div class="section-head"><div><div class="eyebrow">RÉGLAGES PERSONNELS</div><h2>Mon serveur</h2><p>Enregistre tes rates une seule fois. Le Taming et l’Élevage les utiliseront automatiquement sur cet appareil.</p></div><span class="server-saved-badge">LOCAL</span></div>
    <article class="card v2-card server-settings-card">
      <div class="server-settings-head"><div><h3>${s.name?esc(s.name):'Configuration du serveur'}</h3><p class="muted">Ces réglages restent uniquement dans ton navigateur.</p></div><div class="server-rate-summary"><span>Tame <b>x${fmt(s.taming)}</b></span><span>Maturation <b>x${fmt(s.maturation)}</b></span></div></div>
      <div class="server-form-grid">
        <label class="server-field server-field-wide"><span>Nom du serveur <small>optionnel</small></span><input id="serverName" class="control" maxlength="60" placeholder="Ex. Serveur de la tribu" value="${esc(s.name)}"></label>
        <label class="server-field"><span>Taming</span><input id="serverTaming" class="control" type="number" min="0.1" step="0.1" value="${s.taming}"></label>
        <label class="server-field"><span>Food Drain</span><input id="serverFoodDrain" class="control" type="number" min="0.1" step="0.1" value="${s.foodDrain}"></label>
        <label class="server-field"><span>Récolte</span><input id="serverHarvest" class="control" type="number" min="0.1" step="0.1" value="${s.harvest}"></label>
        <label class="server-field"><span>Incubation</span><input id="serverIncubation" class="control" type="number" min="0.1" step="0.1" value="${s.incubation}"></label>
        <label class="server-field"><span>Maturation</span><input id="serverMaturation" class="control" type="number" min="0.1" step="0.1" value="${s.maturation}"></label>
        <label class="server-field"><span>Intervalle imprint</span><input id="serverImprint" class="control" type="number" min="0.1" step="0.1" value="${s.imprint}"></label>
      </div>
      <div class="actions server-actions"><button class="btn primary" id="saveServerSettings">Enregistrer mes rates</button><button class="btn" id="resetServerSettings">Remettre x1</button></div>
      <div class="server-note">💡 La rate de récolte est déjà sauvegardée pour les futurs calculateurs de farm/craft avancés.</div>
    </article>
  </section>`;
}

function bindPanel(){
  const panel=q('#mon-serveur'); if(!panel||panel.dataset.bound==='1')return;
  panel.dataset.bound='1';
  q('#saveServerSettings',panel)?.addEventListener('click',()=>{
    const next={
      name:q('#serverName',panel)?.value.trim()||'',
      taming:num(q('#serverTaming',panel)?.value),
      foodDrain:num(q('#serverFoodDrain',panel)?.value),
      harvest:num(q('#serverHarvest',panel)?.value),
      incubation:num(q('#serverIncubation',panel)?.value),
      maturation:num(q('#serverMaturation',panel)?.value),
      imprint:num(q('#serverImprint',panel)?.value)
    };
    setSettings(next);toast('Rates de Mon serveur enregistrés');
    panel.outerHTML=panelMarkup();bindPanel();
  });
  q('#resetServerSettings',panel)?.addEventListener('click',()=>{
    setSettings({...DEFAULTS});toast('Rates remis à x1');
    panel.outerHTML=panelMarkup();bindPanel();
  });
}

function ensurePanel(){
  if(location.pathname!=='/mon-ark')return;
  const app=q('#app');if(!app||q('#mon-serveur',app))return;
  const head=q('.page-head',app);
  if(head)head.insertAdjacentHTML('afterend',panelMarkup());else app.insertAdjacentHTML('afterbegin',panelMarkup());
  bindPanel();
  if(location.hash==='#mon-serveur')setTimeout(()=>q('#mon-serveur')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
}

function rateBar(kind,s){
  const label=s.name||'Mon serveur';
  const detail=kind==='taming'
    ? `Taming x${fmt(s.taming)} · Food Drain x${fmt(s.foodDrain)}`
    : `Incubation x${fmt(s.incubation)} · Maturation x${fmt(s.maturation)} · Imprint x${fmt(s.imprint)}`;
  return `<div class="server-rate-bar" data-server-rate-bar="${kind}"><div><span>⚙️ ${esc(label)}</span><small>${detail}</small></div><button class="btn small" type="button" data-reapply-server="${kind}">Réappliquer</button></div>`;
}

function applyTaming(force=false){
  if(location.pathname!=='/taming')return;
  const form=q('#app .form-card');if(!form)return;
  if(form.dataset.serverApplied==='1'&&!force)return;
  const s=getSettings();
  const tame=q('#tameRate'),food=q('#foodRate');
  if(tame)tame.value=s.taming;if(food)food.value=s.foodDrain;
  q('#calcTame')?.click();
  form.dataset.serverApplied='1';
  if(!q('[data-server-rate-bar="taming"]',form))form.insertAdjacentHTML('afterbegin',rateBar('taming',s));
}

function applyBreeding(force=false){
  if(location.pathname!=='/elevage')return;
  const form=q('#app .form-card');if(!form)return;
  if(form.dataset.serverApplied==='1'&&!force)return;
  const s=getSettings();
  const egg=q('#eggRate'),mature=q('#matureRate'),cuddle=q('#cuddleRate');
  if(egg)egg.value=s.incubation;if(mature)mature.value=s.maturation;if(cuddle)cuddle.value=s.imprint;
  q('#calcBreed')?.click();
  form.dataset.serverApplied='1';
  if(!q('[data-server-rate-bar="breeding"]',form))form.insertAdjacentHTML('afterbegin',rateBar('breeding',s));
}

function bindReapply(){
  document.querySelectorAll('[data-reapply-server]').forEach(b=>{
    if(b.dataset.bound==='1')return;b.dataset.bound='1';
    b.addEventListener('click',()=>{b.dataset.reapplyServer==='taming'?applyTaming(true):applyBreeding(true);toast('Rates de Mon serveur réappliqués')});
  });
}

function addHomeShortcut(){
  if(location.pathname!=='/')return;
  const app=q('#app');if(!app||q('[data-server-shortcut]',app))return;
  const quick=[...app.querySelectorAll('.section')].find(s=>q('h2',s)?.textContent.trim()==='Prépare ta session'||q('h2',s)?.textContent.trim()==='Accès rapide');
  const grid=quick?.querySelector('.grid');if(!grid)return;
  const s=getSettings();
  grid.insertAdjacentHTML('beforeend',`<a class="card quick-card v2-card server-shortcut" data-server-shortcut href="/mon-ark#mon-serveur"><div class="icon">⚙️</div><h3>Mon serveur</h3><p>${s.name?esc(s.name)+' · ':''}Rates sauvegardées pour Taming et Élevage.</p></a>`);
}

function run(){ensurePanel();applyTaming();applyBreeding();bindReapply();addHomeShortcut()}
const app=q('#app');if(app)new MutationObserver(()=>setTimeout(run,30)).observe(app,{childList:true,subtree:false});
addEventListener('popstate',()=>setTimeout(run,50));
addEventListener('hashchange',()=>setTimeout(run,30));
setTimeout(run,120);
