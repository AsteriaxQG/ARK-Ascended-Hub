const cache = new Map();
let pending = false;

function creatureNamesOnPage(){
  return [...document.querySelectorAll('.creature-card[data-name]')]
    .map(card => card.dataset.name)
    .filter(Boolean);
}

function fallback(container, name){
  if(!container) return;
  container.classList.add('creature-img-fallback');
  container.innerHTML = `<div class="creature-fallback-mark">${String(name || '?').slice(0,2).toUpperCase()}</div><small>Image ARK indisponible</small>`;
}

function makeCreatureImage(name, src){
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.alt = `${name} — ARK: Survival Ascended`;
  img.src = src;
  img.dataset.arkCreatureImage = '1';
  img.addEventListener('error', () => {
    const wrap = img.parentElement;
    if(wrap) fallback(wrap, name);
  }, { once:true });
  return img;
}

function prepareCards(){
  document.querySelectorAll('.creature-card[data-name]').forEach(card => {
    card.tabIndex = 0;
    card.setAttribute('role','button');
    card.setAttribute('aria-label', `Ouvrir la fiche ${card.dataset.name}`);
  });
}

function applyCardImages(){
  prepareCards();
  document.querySelectorAll('.creature-card[data-name]').forEach(card => {
    const name = card.dataset.name;
    const container = card.querySelector('.creature-img');
    if(!name || !container) return;
    const src = cache.get(name);
    if(!src) return;
    const current = container.querySelector('img[data-ark-creature-image="1"]');
    if(current && current.src === src) return;
    container.classList.remove('creature-img-fallback');
    container.innerHTML = '';
    container.appendChild(makeCreatureImage(name, src));
  });
}

function applyModalImage(){
  const modal = document.querySelector('#modal .modal-panel');
  if(!modal) return;
  const name = modal.querySelector('h1')?.textContent?.trim();
  const src = cache.get(name);
  if(!name || !src) return;

  let target = modal.querySelector('.detail-img');
  if(!target) return;

  if(target.tagName === 'IMG') {
    target.src = src;
    target.alt = `${name} — ARK: Survival Ascended`;
    target.referrerPolicy = 'no-referrer';
    target.dataset.arkCreatureImage = '1';
    return;
  }

  const img = makeCreatureImage(name, src);
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
    const data = await res.json();
    Object.entries(data.images || {}).forEach(([name, src]) => cache.set(name, src || ''));
  }catch{}
  pending = false;
  applyCardImages();
  applyModalImage();
}

function openCard(card){
  if(!card) return;
  const button = card.querySelector('[data-creature]');
  button?.click();
  setTimeout(hydrate, 60);
}

document.addEventListener('click', event => {
  const card = event.target.closest('.creature-card[data-name]');
  if(!card) return;
  if(event.target.closest('button,a,input,select,textarea,label')) return;
  openCard(card);
});

document.addEventListener('keydown', event => {
  if(event.key !== 'Enter' && event.key !== ' ') return;
  const card = event.target.closest('.creature-card[data-name]');
  if(!card) return;
  if(event.target.closest('button,a,input,select,textarea,label')) return;
  event.preventDefault();
  openCard(card);
});

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
