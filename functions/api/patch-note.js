const SOURCE='https://survivetheark.com/index.php?/forums/topic/773786-asa-server-patch-notes/';
const FALLBACK={
  version:'v93.7',
  title:'Notes de mise à jour serveur ASA — v93.7',
  date:'2026-08-27',
  platform:'Serveurs ASA',
  url:'https://survivetheark.com/index.php?/forums/topic/773786-asa-server-patch-notes-server-v937-updated-08272026/',
  highlights:[
    'Correction d’un plantage serveur',
    'Ajout du Boaratos sur Astraeos, un énorme sanglier extrêmement agressif et brûlant, présent exclusivement sur Astraeos.',
    'Ajout du Concavenator sur Scorched Earth, Ragnarok, Extinction et Astraeos.',
    'Ajout du X-Concavenator sur Genesis.',
    'Ajout du Concavenator aberrant sur Aberration. Ce chasseur de meute impitoyable se déplace sous les dunes, attaque depuis les airs et aveugle ses proies avec des nuages de sable.',
    'Ajout du Galleon pour les propriétaires de Tides of Fortune : un immense navire conçu pour les bases-forteresses et équipé d’une puissante batterie de canons.'
  ]
};

const decode=s=>String(s||'')
  .replace(/<[^>]*>/g,' ')
  .replace(/&nbsp;/g,' ')
  .replace(/&amp;/g,'&')
  .replace(/&#039;/g,"'")
  .replace(/&quot;/g,'"')
  .replace(/\s+/g,' ')
  .trim();

const meta=(html,prop)=>{
  const a=new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,'i');
  const b=new RegExp(`<meta[^>]+content=["']([^"']+)[^>]+(?:property|name)=["']${prop}["']`,'i');
  return decode((html.match(a)||html.match(b)||[])[1]||'');
};

function isoFromUS(v){
  const m=String(v||'').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if(!m)return '';
  return `${m[3]}-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;
}

function normalize(text){return String(text||'').replace(/\s+/g,' ').trim().toLowerCase()}

function translateKnown(text){
  const t=normalize(text);
  if(t==='fixed a server crash') return 'Correction d’un plantage serveur';
  if(t.startsWith('added the boaratos to astraeos')) return 'Ajout du Boaratos sur Astraeos, un énorme sanglier extrêmement agressif et brûlant, présent exclusivement sur Astraeos.';
  if(t.startsWith('added the concavenator to scorched earth')) return 'Ajout du Concavenator sur Scorched Earth, Ragnarok, Extinction et Astraeos.';
  if(t.startsWith('added the x-concavenator to genesis')) return 'Ajout du X-Concavenator sur Genesis.';
  if(t.startsWith('added the aberrant concavenator to aberration')) return 'Ajout du Concavenator aberrant sur Aberration. Ce chasseur de meute impitoyable se déplace sous les dunes, attaque depuis les airs et aveugle ses proies avec des nuages de sable.';
  if(t.startsWith('added the galleon for owners of tides of fortune')) return 'Ajout du Galleon pour les propriétaires de Tides of Fortune : un immense navire conçu pour les bases-forteresses et équipé d’une puissante batterie de canons.';
  if(t.startsWith('the shipyard and the various ship ammunition types can now also be crafted')) return 'Le chantier naval et ses différents types de munitions peuvent désormais être fabriqués si vous possédez Astraeos.';
  return '';
}

function localFrenchFallback(text){
  const known=translateKnown(text); if(known)return known;
  let out=String(text||'').trim();
  out=out
    .replace(/^Fixed an? /i,'Correction de ')
    .replace(/^Fixed /i,'Correction : ')
    .replace(/^Added the /i,'Ajout du ')
    .replace(/^Added /i,'Ajout de ')
    .replace(/^Removed /i,'Suppression de ')
    .replace(/^Updated /i,'Mise à jour de ')
    .replace(/^Improved /i,'Amélioration de ')
    .replace(/^Reduced /i,'Réduction de ')
    .replace(/^Increased /i,'Augmentation de ')
    .replace(/ server crash/gi,' plantage serveur')
    .replace(/ to Scorched Earth/gi,' sur Scorched Earth')
    .replace(/ to Ragnarok/gi,' sur Ragnarok')
    .replace(/ to Extinction/gi,' sur Extinction')
    .replace(/ to Genesis/gi,' sur Genesis')
    .replace(/ to Aberration/gi,' sur Aberration')
    .replace(/ to Astraeos/gi,' sur Astraeos')
    .replace(/ can now also /gi,' peut désormais également ')
    .replace(/ can now /gi,' peut désormais ')
    .replace(/ for owners of /gi,' pour les propriétaires de ')
    .replace(/ exclusively on /gi,' exclusivement sur ')
    .replace(/\s+/g,' ')
    .trim();
  return out;
}

async function translateExternal(text){
  if(!text)return '';
  try{
    const endpoint='https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q='+encodeURIComponent(text);
    const r=await fetch(endpoint,{headers:{'Accept':'application/json'}});
    if(!r.ok)throw new Error(`translate ${r.status}`);
    const j=await r.json();
    const translated=Array.isArray(j?.[0])?j[0].map(part=>part?.[0]||'').join(''):'';
    if(!translated || normalize(translated)===normalize(text)) throw new Error('not translated');
    return translated
      .replace(/Terre brûlée/gi,'Scorched Earth')
      .replace(/Genèse/gi,'Genesis')
      .replace(/Ragnarök/gi,'Ragnarok')
      .trim();
  }catch{return ''}
}

async function translateLine(text){
  const known=translateKnown(text); if(known)return known;
  const external=await translateExternal(text); if(external)return external;
  return localFrenchFallback(text);
}

export async function onRequestGet(){
  const headers={
    'content-type':'application/json;charset=UTF-8',
    'cache-control':'public,max-age=300,s-maxage=300',
    'access-control-allow-origin':'*'
  };

  try{
    const r=await fetch(SOURCE,{headers:{'Accept':'text/html','User-Agent':'ARK-Ascended-Hub/1.0 (+https://ark-ascended-hub.pages.dev/)'}});
    if(!r.ok)throw new Error(`source ${r.status}`);

    const html=await r.text();
    const officialTitle=meta(html,'og:title')||'';
    const version=(officialTitle.match(/(?:Server:?\s*)?(v\d+(?:\.\d+)?)/i)||[])[1]||FALLBACK.version;
    const updated=(officialTitle.match(/Updated:\s*([0-9/]+)/i)||[])[1]||'';
    const body=(html.match(/data-role=["']commentContent["'][^>]*>([\s\S]*?)<\/div>/i)||[])[1]||'';
    const points=[...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      .map(m=>decode(m[1]))
      .filter(x=>x.length>12&&x.length<360&&!/discord|followers|share/i.test(x))
      .slice(0,6);

    const sourceHighlights=points.length>=3?points:FALLBACK.highlights;
    const translated=await Promise.all(sourceHighlights.map(translateLine));

    return new Response(JSON.stringify({
      version,
      title:`Notes de mise à jour serveur ASA — ${version}`,
      date:isoFromUS(updated)||FALLBACK.date,
      platform:'Serveurs ASA',
      url:SOURCE,
      highlights:translated,
      live:true,
      language:'fr',
      translation:'automatique',
      officialTitle:decode(officialTitle),
      updatedAt:new Date().toISOString()
    }),{headers});
  }catch(error){
    return new Response(JSON.stringify({...FALLBACK,live:false,language:'fr',translation:'fallback'}),{status:200,headers});
  }
}
