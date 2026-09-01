const cache = new Map();
let pending = false;

const IMAGE_FILES = {
  'Spinosaur': 'Spino.png',
  'Wyverne de feu': 'Fire Wyvern.png',
  'Wyverne de foudre': 'Lightning Wyvern.png',
  'Wyverne de poison': 'Poison Wyvern.png',
  'Wyverne de glace': 'Ice Wyvern.png'
};

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
    const direct = directWikiImage(name);
    if(img.dataset.directFallback !== '1' && img.src !== direct){
      img.dataset.directFallback = '1';
      img.src = direct;
      return;
    }
    const wrap = img.parentElement;
    if(wrap) fallback(wrap, name);
  });
  return img;
}

function prepareCards(){
  document.querySelectorAll('.creature-card[data-name]').forEach(card => {
    card.tabIndex = 0;
    card.setAttribute('role','button');
    card.setAttribute('aria-label', `Ouvrir la fiche ${card.dataset.frName || card.dataset.name}`);
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
    container.appendChild(makeCreatureImage(card.dataset.frName || name, src));
  });
}

function applyModalImage(){
  const modal = document.querySelector('#modal .modal-panel');
  if(!modal) return;
  const displayedName = modal.querySelector('h1')?.textContent?.trim();
  const name = modal.dataset.arkName || displayedName;
  if(!name) return;
  const src = cache.get(name) || directWikiImage(displayedName || name) || directWikiImage(name);

  let target = modal.querySelector('.detail-img');
  if(!target) return;

  if(target.tagName === 'IMG') {
    if(target.dataset.arkCreatureImage === '1') return;
    target.src = src;
    target.alt = `${displayedName || name} — ARK: Survival Ascended`;
    target.referrerPolicy = 'no-referrer';
    target.dataset.arkCreatureImage = '1';
    target.addEventListener('error', () => {
      const direct = directWikiImage(displayedName || name);
      if(target.dataset.directFallback !== '1' && target.src !== direct){
        target.dataset.directFallback = '1';
        target.src = direct;
      }
    });
    return;
  }

  const img = makeCreatureImage(displayedName || name, src);
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
