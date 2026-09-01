const ALIASES = {
  'Giga': 'Giganotosaurus',
  'Argy': 'Argentavis',
  'Rhynio': 'Rhyniognatha',
  'Anky': 'Ankylosaurus',
  'Doedic': 'Doedicurus'
};

const fallbackFile = name =>
  `https://ark.wiki.gg/wiki/Special:Redirect/file/${encodeURIComponent(`${name}.png`)}`;

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
        'User-Agent': 'ARK-Ascended-Hub/1.1 (+https://ark-ascended-hub.pages.dev/)'
      },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });

    if (!upstream.ok) throw new Error(`ARK Wiki ${upstream.status}`);
    const data = await upstream.json();
    const pages = Object.values(data?.query?.pages || {});
    const byTitle = new Map();

    for (const page of pages) {
      if (!page?.title) continue;
      const source = page.thumbnail?.source || page.original?.source || '';
      if (source) byTitle.set(page.title.toLowerCase(), source);
    }

    const redirects = new Map();
    for (const item of data?.query?.normalized || []) {
      redirects.set(String(item.from).toLowerCase(), item.to);
    }
    for (const item of data?.query?.redirects || []) {
      redirects.set(String(item.from).toLowerCase(), item.to);
    }

    const resolveTitle = title => {
      let current = title;
      const seen = new Set();
      while (redirects.has(current.toLowerCase()) && !seen.has(current.toLowerCase())) {
        seen.add(current.toLowerCase());
        current = redirects.get(current.toLowerCase());
      }
      return current;
    };

    const images = {};
    requested.forEach((originalName, index) => {
      const requestedTitle = lookup[index];
      const resolvedTitle = resolveTitle(requestedTitle);
      images[originalName] =
        byTitle.get(resolvedTitle.toLowerCase()) ||
        byTitle.get(requestedTitle.toLowerCase()) ||
        byTitle.get(originalName.toLowerCase()) ||
        fallbackFile(resolvedTitle);
    });

    return Response.json(
      { images, source: 'ARK Official Community Wiki' },
      { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } }
    );
  } catch (error) {
    const images = Object.fromEntries(
      requested.map((name, index) => [name, fallbackFile(lookup[index])])
    );
    return Response.json(
      { images, source: 'ARK Official Community Wiki', fallback: true },
      { status: 200, headers: { 'Cache-Control': 'public, max-age=900' } }
    );
  }
}
