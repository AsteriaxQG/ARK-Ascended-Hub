const INTERACTIVE = 'button,a,input,select,textarea,label';
let opening = false;

function openCreatureCard(card){
  if(!card || opening) return;
  const direct = card.querySelector('[data-creature], [data-family-creature]');
  if(!direct) return;
  opening = true;
  direct.click();
  setTimeout(()=>{ opening = false; },120);
}

function prepareCards(){
  document.querySelectorAll('.creature-card').forEach(card => {
    card.classList.add('card-clickable');
    card.tabIndex = 0;
    card.setAttribute('role','button');
    const title = card.querySelector('h3')?.textContent?.trim() || card.dataset.frName || card.dataset.name || 'créature';
    card.setAttribute('aria-label', `Ouvrir la fiche ${title}`);
  });
}

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : event.target?.parentElement;
  if(!target) return;
  const card = target.closest('.creature-card');
  if(!card) return;
  if(target.closest(INTERACTIVE)) return;
  event.preventDefault();
  openCreatureCard(card);
});

document.addEventListener('keydown', event => {
  if(event.key !== 'Enter' && event.key !== ' ') return;
  const target = event.target instanceof Element ? event.target : null;
  const card = target?.closest('.creature-card');
  if(!card) return;
  if(target.closest(INTERACTIVE)) return;
  event.preventDefault();
  openCreatureCard(card);
});

const app = document.getElementById('app');
if(app){
  const observer = new MutationObserver(() => {
    clearTimeout(observer._timer);
    observer._timer = setTimeout(prepareCards, 30);
  });
  observer.observe(app,{childList:true,subtree:true});
}

prepareCards();
