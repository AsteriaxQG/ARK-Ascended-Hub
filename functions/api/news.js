const HOME = 'https://survivetheark.com/';
const decode = s => String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const meta = (html, prop) => {
  const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i');
  return decode((html.match(re1)||html.match(re2)||[])[1]||'');
};
async function detail(url){
  try{
    const r = await fetch(url,{headers:{'User-Agent':'ARK-Ascended-Hub/1.0'}});
    const h = await r.text();
    const title = meta(h,'og:title') || decode((h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]);
    const summary = meta(h,'og:description') || meta(h,'description');
    const image = meta(h,'og:image');
    const d = (h.match(/<time[^>]+datetime=["']([^"']+)["']/i)||[])[1] || '';
    return {title:title.replace(/\s+-\s+Announcements.*$/i,''),summary,image,date:d,author:'Studio Wildcard',url,category:/Community Crunch/i.test(title)?'Community Crunch':'Annonce'};
  }catch{return null}
}
export async function onRequestGet(){
  const headers={'content-type':'application/json;charset=UTF-8','cache-control':'public,max-age=900','access-control-allow-origin':'*'};
  try{
    const r = await fetch(HOME,{headers:{'User-Agent':'ARK-Ascended-Hub/1.0'}});
    if(!r.ok) throw new Error('source');
    const html=await r.text();
    const links=[...html.matchAll(/href=["'](https?:\/\/survivetheark\.com\/index\.php\?[^"']*\/forums\/topic\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map(m=>({url:m[1].replace(/&amp;/g,'&'),text:decode(m[2])}))
      .filter(x=>x.text && (/(Community Crunch|Update|ARK|Astraeos|Genesis|Fjordur|Lost Colony)/i.test(x.text)));
    const unique=[]; const seen=new Set();
    for(const l of links){ if(!seen.has(l.url)){seen.add(l.url);unique.push(l)} if(unique.length>=10)break; }
    if(!unique.length) throw new Error('parse');
    const items=(await Promise.all(unique.map(x=>detail(x.url)))).filter(Boolean);
    if(!items.length) throw new Error('details');
    return new Response(JSON.stringify({items,live:true,updatedAt:new Date().toISOString()}),{headers});
  }catch(e){
    return new Response(JSON.stringify({items:[],live:false,error:'Source officielle momentanément indisponible.'}),{status:200,headers});
  }
}
