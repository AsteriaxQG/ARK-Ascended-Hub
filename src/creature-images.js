const cache = new Map();
let pending = false;

const IMAGE_FILES = {
  'Spinosaur': 'Spino.png',
  'Fire Wyvern': 'Fire Wyvern.png',
  'Lightning Wyvern': 'Lightning Wyvern.png',
  'Poison Wyvern': 'Poison Wyvern.png',
  'Ice Wyvern': 'Ice Wyvern.png',
  'Wyverne de feu': 'Fire Wyvern.png',
  'Wyverne de foudre': 'Lightning Wyvern.png',
  'Wyverne de poison': 'Poison Wyvern.png',
  'Wyverne de glace': 'Ice Wyvern.png'
};

const DISPLAY_NAMES = {
  'Fire Wyvern':'Wyverne de feu',
  'Lightning Wyvern':'Wyverne de foudre',
  'Poison Wyvern':'Wyverne de poison',
  'Ice Wyvern':'Wyverne de glace'
};

function displayName(name){ return DISPLAY_NAMES[name] || name; }

function directWikiImage(name){
  const file = IMAGE_FILES[name] || `${name}.png`;
  return `https://ark.wiki.gg/wiki/Special:Redirect/file/${encodeURIComponent(file)}`;
}

function creatureNamesOnPage(){
  return [...document.querySelectorAll('.creature-card[data-name]')]
    .map(card => card.dataset.name)
    .filter(Boolean);
}

function fallback(container, name){
  if(!container) return;
  container.classList.add('creature-img-fallback');
  container.innerHTML = `<div class="creature-fallback-mark">${String(displayName(name) || '?').slice(0,2).toUpperCase()}</div><small>Image ARK indisponible</small>`;
}

function makeCreatureImage(name, src, internalName=name){
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.alt = `${displayName(name)} — ARK: Survival Ascended`;
  img.src = src;
  img.dataset.arkCreatureImage = '1';
  img.addEventListener('error', () => {
    const direct = directWikiImage(internalName);
    if(img.dataset.directFallback !== '1' && img.src !== direct){
      img.dataset.directFallback = '1';
      img.src = direct;
      return;
    }
    const wrap = img.parentElement;
    if(wrap) fallback(wrap, internalName);
  });
  return img;
}

function prepareCards(){
  document.querySelectorAll('.creature-card[data-name]').forEach(card => {
    const internal = card.dataset.name;
    const visible = card.dataset.frName || displayName(internal);
    if(DISPLAY_NAMES[internal]) card.dataset.frName = visible;
    const h3 = card.querySelector('h3');
    if(h3 && DISPLAY_NAMES[internal]) h3.textContent = visible;
    card.tabIndex = 0;
    card.setAttribute('role','button');
    card.setAttribute('aria-label', `Ouvrir la fiche ${visible}`);
  });
}

function applyCardImages(){
  prepareCards();
  document.querySelectorAll('.creature-card[data-name]').forEach(card => {
    const name = card.dataset.name;
    const container = card.querySelector('.creature-img');
    if(!name || !container) return;
    const src = cache.get(name) || directWikiImage(name);
    const current = container.querySelector('img[data-ark-creature-image="1"]');
    if(current) return;
    container.classList.remove('creature-img-fallback');
    container.innerHTML = '';
    container.appendChild(makeCreatureImage(card.dataset.frName || displayName(name), src, name));
  });
}

function applyModalImage(){
  const modal = document.querySelector('#modal .modal-panel');
  if(!modal) return;
  const h1 = modal.querySelector('h1');
  const rawName = modal.dataset.arkName || h1?.textContent?.trim();
  const internalName = Object.keys(DISPLAY_NAMES).find(k => DISPLAY_NAMES[k] === rawName) || rawName;
  if(!internalName) return;
  const visibleName = displayName(internalName);
  modal.dataset.arkName = internalName;
  if(h1 && DISPLAY_NAMES[internalName]) h1.textContent = visibleName;
  const src = cache.get(internalName) || directWikiImage(internalName);

  let target = modal.querySelector('.detail-img');
  if(!target) return;

  if(target.tagName === 'IMG') {
    if(target.dataset.arkCreatureImage === '1') return;
    target.src = src;
    target.alt = `${visibleName} — ARK: Survival Ascended`;
    target.referrerPolicy = 'no-referrer';
    target.dataset.arkCreatureImage = '1';
    target.addEventListener('error', () => {
      const direct = directWikiImage(internalName);
      if(target.dataset.directFallback !== '1' && target.src !== direct){
        target.dataset.directFallback = '1';
        target.src = direct;
      }
    });
    return;
  }

  const img = makeCreatureImage(visibleName, src, internalName);
  img.className = 'detail-img';
  target.replaceWith(img);
}

async function hydrate(){
  if(pending) return;
  prepareCards();
  const names = [...new Set(creatureNamesOnPage())].filter(name => !cache.has(name));
  if(!names.length){
    applyCardImages();
    applyModalImage();
    return;
  }

  pending = true;
  try{
    const res = await fetch(`/api/creature-images?names=${encodeURIComponent(names.join(','))}`, { cache:'force-cache' });
    if(res.ok){
      const data = await res.json();
      Object.entries(data.images || {}).forEach(([name, src]) => {
        if(src) cache.set(name, src);
      });
    }
  }catch{}

  names.forEach(name => {
    if(!cache.get(name)) cache.set(name, directWikiImage(name));
  });

  pending = false;
  applyCardImages();
  applyModalImage();
}

/* L'ouverture des cartes est volontairement gérée uniquement par creature-card-clicks.js.
   Cela évite de créer deux modales superposées sur un seul clic. */

const app = document.getElementById('app');
if(app){
  const observer = new MutationObserver(() => {
    clearTimeout(observer.timer);
    observer.timer = setTimeout(hydrate, 60);
  });
  observer.observe(app, { childList:true, subtree:true });
}

window.addEventListener('popstate', () => setTimeout(hydrate, 60));
document.addEventListener('click', () => setTimeout(hydrate, 100));
setTimeout(hydrate, 120);
