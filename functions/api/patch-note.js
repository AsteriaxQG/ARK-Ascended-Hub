const SOURCE='https://survivetheark.com/index.php?/forums/topic/773786-asa-server-patch-notes/';
const FALLBACK={
  version:'v93.7',
  title:'Notes de mise à jour serveur ASA — v93.7',
  date:'2026-08-27',
  platform:'Serveurs ASA',
  url:'https://survivetheark.com/index.php?/forums/topic/773786-asa-server-patch-notes-server-v937-updated-08272026/',
  highlights:[
    'Correction d’un plantage serveur',
    'Ajout du Boaratos sur Astraeos, un énorme sanglier agressif et brûlant exclusif à cette carte',
    'Ajout du Concavenator sur Scorched Earth, Ragnarok, Extinction et Astraeos',
    'Ajout du X-Concavenator sur Genesis',
    'Ajout du Concavenator aberrant sur Aberration',
    'Le chantier naval et ses différents types de munitions peuvent désormais être fabriqués si vous possédez Astraeos'
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

function polishFrench(text){
  return String(text||'')
    .replace(/Ajouté le /gi,'Ajout du ')
    .replace(/Ajoutée? (?:de |du |des )?/gi,'Ajout de ')
    .replace(/Correction d['’]un crash serveur/gi,'Correction d’un plantage serveur')
    .replace(/crash serveur/gi,'plantage serveur')
    .replace(/Terre brûlée/gi,'Scorched Earth')
    .replace(/Ragnarök/gi,'Ragnarok')
    .replace(/Extinction/gi,'Extinction')
    .replace(/Genèse/gi,'Genesis')
    .replace(/Aberration/gi,'Aberration')
    .replace(/Astraeos/gi,'Astraeos')
    .replace(/Boaratos/gi,'Boaratos')
    .replace(/Concavenator/gi,'Concavenator')
    .replace(/Galleon/gi,'Galleon')
    .replace(/Trireme/gi,'Trireme')
    .replace(/Tides of Fortune/gi,'Tides of Fortune')
    .replace(/\s+/g,' ')
    .trim();
}

async function translateToFrench(text){
  if(!text)return '';
  try{
    const endpoint='https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q='+encodeURIComponent(text);
    const r=await fetch(endpoint,{
      headers:{'Accept':'application/json','User-Agent':'ARK-Ascended-Hub/1.0 (+https://ark-ascended-hub.pages.dev/)'}
    });
    if(!r.ok)throw new Error(`translate ${r.status}`);
    const j=await r.json();
    const translated=Array.isArray(j?.[0])?j[0].map(part=>part?.[0]||'').join(''):'';
    return polishFrench(translated||text);
  }catch{
    return text;
  }
}

async function translateHighlights(points){
  const results=await Promise.all(points.slice(0,6).map(translateToFrench));
  return results.map(polishFrench).filter(Boolean);
}

export async function onRequestGet(){
  const headers={
    'content-type':'application/json;charset=UTF-8',
    'cache-control':'public,max-age=1800,s-maxage=1800',
    'access-control-allow-origin':'*'
  };

  try{
    const r=await fetch(SOURCE,{
      headers:{
        'Accept':'text/html',
        'User-Agent':'ARK-Ascended-Hub/1.0 (+https://ark-ascended-hub.pages.dev/)'
      }
    });
    if(!r.ok)throw new Error(`source ${r.status}`);

    const html=await r.text();
    const officialTitle=meta(html,'og:title')||'';
    const version=(officialTitle.match(/(?:Server:?\s*)?(v\d+(?:\.\d+)?)/i)||[])[1]||FALLBACK.version;
    const updated=(officialTitle.match(/Updated:\s*([0-9/]+)/i)||[])[1]||'';
    const body=(html.match(/data-role=["']commentContent["'][^>]*>([\s\S]*?)<\/div>/i)||[])[1]||'';
    const points=[...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      .map(m=>decode(m[1]))
      .filter(x=>x.length>12&&x.length<280&&!/discord|followers|share/i.test(x));

    const sourceHighlights=points.slice(0,6);
    const translated=sourceHighlights.length>=3?await translateHighlights(sourceHighlights):FALLBACK.highlights;
    const translationSucceeded=translated.some((x,i)=>x!==sourceHighlights[i]);

    return new Response(JSON.stringify({
      version,
      title:`Notes de mise à jour serveur ASA — ${version}`,
      date:isoFromUS(updated)||FALLBACK.date,
      platform:'Serveurs ASA',
      url:SOURCE,
      highlights:translated.length>=3?translated:FALLBACK.highlights,
      live:true,
      language:translationSucceeded?'fr':'en',
      translation:translationSucceeded?'automatique':'source',
      officialTitle:decode(officialTitle),
      updatedAt:new Date().toISOString()
    }),{headers});
  }catch(error){
    return new Response(JSON.stringify({...FALLBACK,live:false,language:'fr',translation:'fallback'}),{status:200,headers});
  }
}
