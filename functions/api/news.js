const HOME = 'https://survivetheark.com/';
const NOW = Date.now();

const FALLBACK = [
  {
    title:'Community Crunch 521: Big Ship Energy',
    date:'2026-08-29T00:00:00Z',
    author:'Studio Wildcard',
    url:'https://survivetheark.com/index.php?/forums/topic/774175-community-crunch-521-big-ship-energy/',
    category:'Community Crunch',
    summary:'Le Galleon prend la mer, avec les dernières informations officielles ARK: Survival Ascended.'
  },
  {
    title:'Astraeos Heaven & Abyss Update is now live!',
    date:'2026-08-27T17:07:00Z',
    author:'Studio Wildcard',
    url:'https://survivetheark.com/index.php?/forums/topic/774170-astraeos-heaven-abyss-update-is-now-live/',
    category:'Mise à jour',
    summary:'Astraeos 1.0, Heaven & Abyss, nouveaux environnements, Trireme, Boaratos et nouveaux combats de boss.'
  },
  {
    title:'Community Crunch 520: Three heads. One very good boy.',
    date:'2026-08-22T00:00:00Z',
    author:'Studio Wildcard',
    url:'https://survivetheark.com/index.php?/forums/topic/774159-community-crunch-520-three-heads-one-very-good-boy/',
    category:'Community Crunch',
    summary:'Actualités officielles ARK, événements, réseau officiel et nouveautés communautaires.'
  },
  {
    title:'Community Crunch 519: Tusk, Tusk, Boom!',
    date:'2026-08-15T00:00:00Z',
    author:'Studio Wildcard',
    url:'https://survivetheark.com/index.php?/forums/topic/774142-community-crunch-519-tusk-tusk-boom/',
    category:'Community Crunch',
    summary:'Présentation du Boaratos et des nouveautés prévues pour Astraeos.'
  },
  {
    title:'Community Crunch 518: Long Live the King!',
    date:'2026-08-08T00:00:00Z',
    author:'Studio Wildcard',
    url:'https://survivetheark.com/',
    category:'Community Crunch',
    summary:'Actualités officielles et aperçu des nouveautés ARK: Survival Ascended.'
  }
];

const decode = s => String(s||'')
  .replace(/<script[\s\S]*?<\/script>/gi,' ')
  .replace(/<style[\s\S]*?<\/style>/gi,' ')
  .replace(/<[^>]*>/g,' ')
  .replace(/&nbsp;/g,' ')
  .replace(/&amp;/g,'&')
  .replace(/&#039;/g,"'")
  .replace(/&quot;/g,'"')
  .replace(/&#x27;/g,"'")
  .replace(/\s+/g,' ')
  .trim();

const meta = (html, prop) => {
  const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i');
  return decode((html.match(re1)||html.match(re2)||[])[1]||'');
};

function normalizeUrl(raw){
  if(!raw) return '';
  const clean=raw.replace(/&amp;/g,'&');
  try{return new URL(clean,HOME).href}catch{return ''}
}

function validIso(value){
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return '';
  if(d.getTime()>NOW+86400000 || d.getFullYear()<2025) return '';
  return d.toISOString();
}

function visibleDate(html){
  const text=decode(html);
  const patterns=[
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d{2})\b/i,
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i,
    /\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/
  ];
  for(const re of patterns){
    const m=text.match(re);
    if(!m) continue;
    let value='';
    if(/[A-Za-z]/.test(m[1])) value=`${m[1]} ${m[2]}, ${m[3]}`;
    else if(/[A-Za-z]/.test(m[2])) value=`${m[2]} ${m[1]}, ${m[3]}`;
    else value=`${m[3]}-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}T00:00:00Z`;
    const iso=validIso(value); if(iso) return iso;
  }
  return '';
}

function bestDate(html){
  const candidates=[
    meta(html,'article:published_time'),
    meta(html,'article:modified_time'),
    meta(html,'datePublished'),
    meta(html,'dateModified'),
    meta(html,'date'),
    meta(html,'publish_date')
  ];

  for(const m of html.matchAll(/<time[^>]+datetime=["']([^"']+)["']/gi)) candidates.push(m[1]);
  for(const m of html.matchAll(/["'](?:datePublished|dateModified|uploadDate)["']\s*:\s*["']([^"']+)["']/gi)) candidates.push(m[1]);

  const valid=candidates.map(validIso).filter(Boolean).sort((a,b)=>Date.parse(b)-Date.parse(a));
  return valid[0] || visibleDate(html) || '';
}

function normalizeTitle(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}

function repairedDate(item){
  const direct=validIso(item.date); if(direct) return direct;
  const key=normalizeTitle(item.title);
  const known=FALLBACK.find(x=>normalizeTitle(x.title)===key);
  if(known) return known.date;

  const crunch=String(item.title||'').match(/Community Crunch\s+(\d+)/i);
  if(crunch){
    const n=Number(crunch[1]);
    if(Number.isFinite(n) && n>450 && n<=521){
      const anchor=Date.UTC(2026,7,29);
      return new Date(anchor-(521-n)*7*86400000).toISOString();
    }
  }

  const titleDate=String(item.title||'').match(/(?:Updated|Update|Live)?\s*[:\-]?\s*(\d{1,2})[\/.](\d{1,2})[\/.](20\d{2})/i);
  if(titleDate){
    const iso=validIso(`${titleDate[3]}-${String(titleDate[1]).padStart(2,'0')}-${String(titleDate[2]).padStart(2,'0')}T00:00:00Z`);
    if(iso) return iso;
  }
  return '';
}

function categoryFor(title){
  if(/Community Crunch/i.test(title)) return 'Community Crunch';
  if(/update|patch|live|release|launch|roadmap/i.test(title)) return 'Mise à jour';
  return 'Annonce';
}

async function detail(url, hintedTitle=''){
  try{
    const r = await fetch(url,{headers:{'Accept':'text/html','User-Agent':'ARK-Ascended-Hub/2.1 (+https://ark-ascended-hub.pages.dev/)'}});
    if(!r.ok) return null;
    const h = await r.text();
    const title = meta(h,'og:title') || hintedTitle || decode((h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]);
    const cleanTitle=decode(title.replace(/\s+-\s+Announcements.*$/i,'').replace(/\s+-\s+ARK.*Official.*$/i,''));
    const summary = meta(h,'og:description') || meta(h,'description') || '';
    const image = meta(h,'og:image');
    const date = bestDate(h);
    return {title:cleanTitle,summary,image,date,author:'Studio Wildcard',url,category:categoryFor(cleanTitle)};
  }catch{return null}
}

function discoverLinks(html){
  const found=[];
  const seen=new Set();
  const re=/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for(const m of html.matchAll(re)){
    const url=normalizeUrl(m[1]);
    const text=decode(m[2]);
    if(!url||!text) continue;
    if(!/survivetheark\.com/i.test(url)) continue;
    if(!/(\/forums\/topic\/|\/articles\.html\/)/i.test(url)) continue;
    if(!/(Community Crunch|Astraeos|ARK: Survival Ascended|Update|Genesis|Fjordur|Lost Colony|Roadmap|Patch|Tides of Fortune)/i.test(text)) continue;
    const canonical=url.replace(/([?&])comment=\d+.*$/i,'').replace(/([?&])do=findComment.*$/i,'');
    if(seen.has(canonical)) continue;
    seen.add(canonical);
    found.push({url:canonical,title:text});
    if(found.length>=20) break;
  }
  return found;
}

function sortAndClean(items){
  const unique=[];
  const seen=new Set();
  for(const raw of items){
    if(!raw?.title||!raw?.url) continue;
    const item={...raw,date:repairedDate(raw)};
    if(!item.date) continue;
    const key=normalizeTitle(item.title);
    if(seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  for(const fallback of FALLBACK){
    const key=normalizeTitle(fallback.title);
    if(!seen.has(key)){seen.add(key);unique.push(fallback)}
  }

  unique.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
  return unique.filter(x=>Date.parse(x.date)>=Date.UTC(2026,0,1)).slice(0,12);
}

export async function onRequestGet(){
  const headers={
    'content-type':'application/json;charset=UTF-8',
    'cache-control':'public,max-age=180,s-maxage=180',
    'access-control-allow-origin':'*'
  };
  try{
    const r = await fetch(HOME,{headers:{'Accept':'text/html','User-Agent':'ARK-Ascended-Hub/2.1 (+https://ark-ascended-hub.pages.dev/)'}});
    if(!r.ok) throw new Error(`source ${r.status}`);
    const html=await r.text();
    const links=discoverLinks(html);
    if(!links.length) throw new Error('parse');

    const detailed=(await Promise.all(links.map(x=>detail(x.url,x.title)))).filter(Boolean);
    const items=sortAndClean(detailed);
    if(!items.length) throw new Error('details');

    return new Response(JSON.stringify({items,live:true,source:'survivetheark.com',updatedAt:new Date().toISOString()}),{headers});
  }catch(e){
    return new Response(JSON.stringify({items:FALLBACK,live:false,source:'fallback-2026',updatedAt:new Date().toISOString(),error:'Source officielle momentanément indisponible : affichage du cache récent 2026.'}),{status:200,headers});
  }
}
