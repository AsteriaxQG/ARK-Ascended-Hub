const ALIASES = {
  'Spinosaur': 'Spinosaurus',
  'Therizinosaur': 'Therizinosaurus',
  'Giga': 'Giganotosaurus',
  'Argy': 'Argentavis',
  'Rhynio': 'Rhyniognatha',
  'Anky': 'Ankylosaurus',
  'Doedic': 'Doedicurus'
};

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const requested = (url.searchParams.get('names') || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
    .slice(0, 60);

  if (!requested.length) {
    return Response.json({ images: {} }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  }

  const lookup = requested.map(name => ALIASES[name] || name);
  const api = new URL('https://ark.wiki.gg/api.php');
  api.searchParams.set('action', 'query');
  api.searchParams.set('format', 'json');
  api.searchParams.set('redirects', '1');
  api.searchParams.set('prop', 'pageimages');
  api.searchParams.set('piprop', 'thumbnail|original');
  api.searchParams.set('pithumbsize', '1000');
  api.searchParams.set('titles', lookup.join('|'));

  try {
    const upstream = await fetch(api.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ARK-Ascended-Hub/1.0 (+https://ark-ascended-hub.pages.dev/)'
      },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });

    if (!upstream.ok) throw new Error(`ARK Wiki ${upstream.status}`);
    const data = await upstream.json();
    const byTitle = {};

    for (const page of Object.values(data?.query?.pages || {})) {
      if (!page?.title) continue;
      const source = page.thumbnail?.source || page.original?.source || '';
      if (source) byTitle[page.title] = source;
    }

    const images = {};
    requested.forEach((originalName, index) => {
      const resolvedName = lookup[index];
      images[originalName] = byTitle[resolvedName] || byTitle[originalName] || '';
    });

    return Response.json(
      { images, source: 'ARK Official Community Wiki' },
      { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } }
    );
  } catch (error) {
    return Response.json(
      { images: {}, error: 'Impossible de charger les images ARK pour le moment.' },
      { status: 200, headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  }
}
