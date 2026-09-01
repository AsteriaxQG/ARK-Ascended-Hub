const WYVERN_ALIASES = {
  'Fire Wyvern':['fire wyvern','wyverne de feu','wyverne feu'],
  'Lightning Wyvern':['lightning wyvern','wyverne de foudre','wyverne foudre'],
  'Poison Wyvern':['poison wyvern','wyverne de poison','wyverne poison'],
  'Ice Wyvern':['ice wyvern','wyverne de glace','wyverne glace']
};

let creatureCategory = 'Tous';

function norm(value){
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}

function creatureMatchesSearch(card, query){
  if(!query) return true;
  const internal = card.dataset.name || '';
  const visible = card.dataset.frName || card.querySelector('h3')?.textContent || internal;
  const haystack = [internal, visible, ...(WYVERN_ALIASES[internal] || [])].map(norm).join(' ');
  return haystack.includes(query);
}

function applyCreatureFilters(){
  const grid = document.querySelector('#creatureGrid');
  if(!grid) return;

  const query = norm(document.querySelector('#creatureSearch')?.value);
  const map = document.querySelector('#creatureMap')?.value || '';

  grid.querySelectorAll('.creature-card').forEach(card => {
    const okSearch = creatureMatchesSearch(card, query);
    const okMap = !map || String(card.dataset.maps || '').split('|').includes(map);
    const okCategory = creatureCategory === 'Tous' || card.dataset.cat === creatureCategory;
    card.classList.toggle('hidden', !(okSearch && okMap && okCategory));
  });

  const family = document.querySelector('#wyvernFamily');
  if(family){
    const anyWyvernVisible = [...grid.querySelectorAll('.creature-card[data-name]')]
      .some(card => WYVERN_ALIASES[card.dataset.name] && !card.classList.contains('hidden'));
    family.classList.toggle('hidden', !anyWyvernVisible);
  }
}

function applyNewsFilter(filter){
  document.querySelectorAll('[data-news-filter]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.newsFilter === filter);
  });
  document.querySelectorAll('[data-news-category]').forEach(card => {
    const category = card.dataset.newsCategory;
    const show = filter === 'all' || (filter === 'other' ? category !== 'Community Crunch' : category === filter);
    card.classList.toggle('hidden', !show);
  });
}

document.addEventListener('click', event => {
  const categoryButton = event.target.closest('[data-creature-cat]');
  if(categoryButton){
    creatureCategory = categoryButton.dataset.creatureCat || 'Tous';
    document.querySelectorAll('[data-creature-cat]').forEach(btn => btn.classList.toggle('active', btn === categoryButton));
    applyCreatureFilters();
    return;
  }

  const newsButton = event.target.closest('[data-news-filter]');
  if(newsButton){
    applyNewsFilter(newsButton.dataset.newsFilter || 'all');
  }
});

document.addEventListener('input', event => {
  if(event.target?.id === 'creatureSearch') applyCreatureFilters();
});

document.addEventListener('change', event => {
  if(event.target?.id === 'creatureMap') applyCreatureFilters();
});

window.addEventListener('popstate', () => {
  creatureCategory = 'Tous';
  setTimeout(() => {
    if(location.pathname === '/creatures') applyCreatureFilters();
    if(location.pathname === '/actus') applyNewsFilter('all');
  }, 50);
});

const app = document.getElementById('app');
if(app){
  new MutationObserver(() => {
    clearTimeout(app._filterTimer);
    app._filterTimer = setTimeout(() => {
      if(location.pathname === '/creatures') applyCreatureFilters();
    }, 80);
  }).observe(app,{childList:true,subtree:false});
}
