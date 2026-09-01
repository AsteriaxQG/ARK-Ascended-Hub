const SOURCE='https://survivetheark.com/index.php?/forums/topic/773786-asa-server-patch-notes/';
const FALLBACK={
  version:'v93.7',
  title:'ASA Server Patch Notes — v93.7',
  date:'2026-08-27',
  platform:'Serveurs ASA',
  url:'https://survivetheark.com/index.php?/forums/topic/773786-asa-server-patch-notes-server-v937-updated-08272026/',
  highlights:[
    'Ajout du Boaratos sur Astraeos',
    'Ajout du Concavenator et de ses variantes X et Aberrante',
    'Ajout du Galleon pour Tides of Fortune',
    'Ajout du Trireme pour Astraeos',
    'Astraeos passe en version officielle 0.1.4',
    'Correctifs généraux, performances et exploits'
  ]
};
const decode=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const meta=(html,prop)=>{
  const a=new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,'i');
  const b=new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,'i');
  return decode((html.match(a)||html.match(b)||[])[1]||'');
};
function isoFromUS(v){
  const m=String(v||'').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); if(!m)return '';
  return `${m[3]}-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;
}
export async function onRequestGet(){
  const headers={'content-type':'application/json;charset=UTF-8','cache-control':'public,max-age=1800,s-maxage=1800','access-control-allow-origin':'*'};
  try{
    const r=await fetch(SOURCE,{headers:{'Accept':'text/html','User-Agent':'ARK-Ascended-Hub/1.0 (+https://ark-ascended-hub.pages.dev/)'}});
    if(!r.ok)throw new Error(`source ${r.status}`);
    const html=await r.text();
    const title=meta(html,'og:title')||FALLBACK.title;
    const version=(title.match(/(?:Server:?\s*)?(v\d+(?:\.\d+)?)/i)||[])[1]||FALLBACK.version;
    const updated=(title.match(/Updated:\s*([0-9/]+)/i)||[])[1]||'';
    const body=(html.match(/data-role=["']commentContent["'][^>]*>([\s\S]*?)<\/div>/i)||[])[1]||'';
    const points=[...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(m=>decode(m[1])).filter(x=>x.length>12&&x.length<220&&!/discord|followers|share/i.test(x));
    const highlights=points.slice(0,6);
    return new Response(JSON.stringify({
      version,title:decode(title.replace(/\s+-\s+Changelog.*$/i,'')),date:isoFromUS(updated)||FALLBACK.date,platform:'Serveurs ASA',url:SOURCE,
      highlights:highlights.length>=3?highlights:FALLBACK.highlights,live:true,updatedAt:new Date().toISOString()
    }),{headers});
  }catch(error){
    return new Response(JSON.stringify({...FALLBACK,live:false}),{status:200,headers});
  }
}
