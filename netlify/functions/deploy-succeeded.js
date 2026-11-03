// IndexNow: na elke geslaagde deploy de gewijzigde pagina's doorgeven aan Bing
// (en via IndexNow ook aan Yandex, Seznam en andere deelnemende zoekmachines).
// Netlify start een functie met deze naam automatisch na een geslaagde deploy.
// De lijst met URL's maakt build-indexes.js tijdens de build: /indexnow-urls.json.

const SITE = 'https://wijn-parade.nl';
const KEY = 'd40e2477b6e3fdf71a60dbd3091753c8';

exports.handler = async () => {
  try {
    const res = await fetch(`${SITE}/indexnow-urls.json`, { cache: 'no-store' });
    if (!res.ok) return { statusCode: 200, body: 'geen indexnow-urls.json' };
    const urlList = (await res.json()).filter(u => typeof u === 'string' && u.startsWith(SITE)).slice(0, 10000);
    if (!urlList.length) return { statusCode: 200, body: 'geen gewijzigde pagina\'s' };
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: 'wijn-parade.nl', key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
    });
    console.log(`IndexNow: ${urlList.length} URL's doorgegeven, status ${r.status}`);
    return { statusCode: 200, body: `IndexNow ${r.status}: ${urlList.length} URL's` };
  } catch (e) {
    console.log('IndexNow mislukt:', e.message);
    return { statusCode: 200, body: 'IndexNow mislukt' };
  }
};
