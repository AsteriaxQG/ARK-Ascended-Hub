const cache = new Map();
let pending = false;

function creatureNamesOnPage(){
  return [...document.querySelectorAll('.creature-card[data-name]')]
    .map(card => card.dataset.name)
    .filter(Boolean);
}

function makeCreatureImage(name, src){
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.alt = `${name} — ARK: Survival Ascended`;
  img.src = src;
  img.addEventListener('error', () => {
    img.remove();
    const wrap = img.closest?.('.creature-img');
    if(wrap) fallback(wrap, name);
  }, { once:true });
  return img;
}

function fallback(container, name){
  if(!container || container.querySelector('img')) return;
  container.classList.add('creature-img-fallback');
  container.innerHTML = `<div class="creature-fallback-mark">${String(name || '?').slice(0,2).toUpperCase()}</div><small>Image ARK indisponible</small>`;
}

function applyCardImages(){
  document.querySelectorAll('.creature-card[data-name]').forEach(card => {
    const name = card.dataset.name;
    const container = card.querySelector('.creature-img');
    if(!name || !container) return;
    const src = cache.get(name);
    if(!src) return;
    const current = container.querySelector('img');
    if(current?.dataset?.arkCreatureImage === '1') return;
    container.innerHTML = '';
    const img = makeCreatureImage(name, src);
    img.dataset.arkCreatureImage = '1';
    container.appendChild(img);
  });
}

function applyModalImage(){
  const modal = document.querySelector('#modal .modal-panel');
  if(!modal) return;
  const name = modal.querySelector('h1')?.textContent?.trim();
  const target = modal.querySelector('.detail-img');
  const src = cache.get(name);
  if(!name || !target || !src) return;
  if(target.tagName === 'IMG') {
    target.src = src;
    target.alt = `${name} — ARK: Survival Ascended`;
    target.referrerPolicy = 'no-referrer';
    return;
  }
  const img = makeCreatureImage(name, src);
  img.className = 'detail-img';
  target.replaceWith(img);
}

async function hydrate(){
  if(pending) return;
  const names = [...new Set(creatureNamesOnPage())].filter(name => !cache.has(name));
  if(!names.length){ applyCardImages(); applyModalImage(); return; }
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

const observer = new MutationObserver(() => {
  clearTimeout(observer.timer);
  observer.timer = setTimeout(hydrate, 60);
});

observer.observe(document.getElementById('app'), { childList:true, subtree:true });
window.addEventListener('popstate', hydrate);
document.addEventListener('click', () => setTimeout(hydrate, 80));
setTimeout(hydrate, 120);
