const INTERACTIVE = 'button,a,input,select,textarea,label';

function openCreatureCard(card){
  if(!card) return;
  const name = card.dataset.name;
  const direct = card.querySelector('[data-creature], [data-family-creature]');
  if(direct){ direct.click(); return; }
  if(!name) return;
  const btn = [...document.querySelectorAll('#creatureGrid [data-creature]')]
    .find(el => el.dataset.creature === name);
  btn?.click();
}

function prepareCards(){
  document.querySelectorAll('.creature-card').forEach(card => {
    card.classList.add('card-clickable');
    card.tabIndex = 0;
    card.setAttribute('role','button');
    const title = card.querySelector('h3')?.textContent?.trim() || card.dataset.name || 'créature';
    card.setAttribute('aria-label', `Ouvrir la fiche ${title}`);
  });
}

document.addEventListener('click', event => {
  const card = event.target.closest('.creature-card');
  if(!card) return;
  if(event.target.closest(INTERACTIVE)) return;
  openCreatureCard(card);
});

document.addEventListener('keydown', event => {
  if(event.key !== 'Enter' && event.key !== ' ') return;
  const card = event.target.closest('.creature-card');
  if(!card) return;
  if(event.target.closest(INTERACTIVE)) return;
  event.preventDefault();
  openCreatureCard(card);
});

const app = document.getElementById('app');
if(app){
  const observer = new MutationObserver(() => {
    clearTimeout(observer._timer);
    observer._timer = setTimeout(prepareCards, 40);
  });
  observer.observe(app,{childList:true,subtree:true});
}

prepareCards();
