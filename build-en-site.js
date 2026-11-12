// Engelse site (bijv. winehotspotter.com) maken uit de Engelse pagina's die
// build-indexes.js in en/ zet. Draait na build-indexes.js (zie build.sh).
//
// - dist-en/ krijgt alle pagina's uit en/, zonder /en/ in het adres, met de
//   Engelse merknaam en Instagram-account uit site-config.json.
// - Foto's en de JSON-bestanden van de kaart blijven op wijn-parade.nl; de
//   Engelse site haalt ze via een proxy-regel in dist-en/_redirects op.
// - Zolang "live" in site-config.json op false staat, krijgen de Engelse
//   pagina's noindex en verandert er niets aan de Nederlandse site.
// - Staat "live" op true, dan sturen alle /en/-adressen van wijn-parade.nl
//   permanent door naar het nieuwe domein, en linken de taalkeuze en de
//   hreflang-tags van de Nederlandse pagina's naar het nieuwe domein.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const NL = 'https://wijn-parade.nl';
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site-config.json'), 'utf8')).en_site;
const D = cfg.domain.replace(/\/+$/, '');
const LIVE = cfg.live === true;
const SRC = path.join(ROOT, 'en');
const OUT = path.join(ROOT, 'dist-en');
const NL_ANALYTICS_ID = 'G-57CJ2STYT6';
const INDEXNOW_KEY = 'd40e2477b6e3fdf71a60dbd3091753c8';

// Bestanden die de Engelse site zelf serveert (klein; meegekopieerd)
const ASSETS = ['styles.css', 'map.js', 'travelguides.js', 'favicon.ico', 'favicon-16x16.png',
  'favicon-32x32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'logo.svg',
  `${INDEXNOW_KEY}.txt`];
// Paden die op de Engelse site blijven werken zonder herschrijven
const KEEP = /^(uploads\/|content\/|manifest\.json$|regions\.json$)/;

const fail = msg => { console.error(`❌ Engelse site: ${msg}`); process.exit(1); };
const mustReplace = (s, from, to, file) => {
  if (!s.includes(from)) fail(`tekst niet gevonden in ${file}: ${from}`);
  return s.split(from).join(to);
};

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// --- 1. Engelse HTML-pagina's omzetten ---
function transformEn(html) {
  // Links naar pagina's die alleen in het Nederlands bestaan (Value Score, app installeren)
  // horen niet in het menu van de Engelse site
  html = html.replace(/\s*<a href="\/(value-score|install)"[^>]*hreflang="nl"[^>]*>[\s\S]*?<\/a>/g, '');
  html = html.split(`${NL}/en/`).join(`${D}/`).split(`${NL}/en"`).join(`${D}/"`);
  html = html.replace(/(href|src|action)="\/([^"]*)"/g, (m, attr, p) => {
    if (p === 'en') return `${attr}="/"`;
    if (p.startsWith('en/')) return `${attr}="/${p.slice(3)}"`;
    if (KEEP.test(p) || ASSETS.includes(p)) return m;
    return `${attr}="${NL}/${p}"`;   // Nederlandse pagina (taalkeuze e.d.)
  });
  html = html.split('instagram.com/de_wijnparade/').join(`instagram.com/${cfg.instagram}/`)
    .split('@de_wijnparade').join(`@${cfg.instagram}`)
    .split('de_wijnparade').join(cfg.brand);
  // Eigen Google Analytics-property voor de Engelse site
  if (cfg.analytics_id) html = html.split(NL_ANALYTICS_ID).join(cfg.analytics_id);
  if (!LIVE) html = html.replace('<head>', '<head>\n  <meta name="robots" content="noindex">');
  return html;
}

if (!fs.existsSync(SRC)) fail('map en/ bestaat niet; draai eerst build-indexes.js');
fs.rmSync(OUT, { recursive: true, force: true });
let pages = 0;
for (const f of walk(SRC)) {
  const rel = path.relative(SRC, f);
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (f.endsWith('.html')) {
    let html = transformEn(fs.readFileSync(f, 'utf8'));
    // Pinterest: website claimen (meta-tag op de homepage)
    if (rel === 'index.html' && cfg.pinterest_verify) {
      html = html.replace('<head>', `<head>\n  <meta name="p:domain_verify" content="${cfg.pinterest_verify}"/>`);
    }
    if (/(href|src)="\/en[/"]/.test(html) || html.includes(`${NL}/en/`)) fail(`${rel} bevat nog /en/-links`);
    if (/de_wijnparade/.test(html)) fail(`${rel} bevat nog de_wijnparade`);
    if (cfg.analytics_id && html.includes(NL_ANALYTICS_ID)) fail(`${rel} bevat nog het Analytics-ID van wijn-parade.nl`);
    fs.writeFileSync(dest, html);
    pages++;
  } else if (rel === 'regions.json') {
    fs.writeFileSync(dest, fs.readFileSync(f, 'utf8').split('"/en/').join('"/'));
  } else {
    fs.copyFileSync(f, dest);
  }
}

// --- 2. Scripts en vaste bestanden ---
for (const a of ASSETS) {
  const from = path.join(ROOT, a);
  if (!fs.existsSync(from)) fail(`${a} ontbreekt`);
  let s = fs.readFileSync(from);
  if (a === 'map.js') {
    // locatielinks op de kaart: Engelse pagina op dit domein, anders de Nederlandse op wijn-parade.nl
    s = mustReplace(s.toString(), "EN && location.hasEn ? '/en' : ''", `EN && location.hasEn ? '' : '${NL}'`, a);
  } else if (a === 'travelguides.js') {
    s = mustReplace(s.toString(), "'/en/regions.json'", "'/regions.json'", a);
  }
  fs.writeFileSync(path.join(OUT, a), s);
}
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
Object.assign(manifest, { name: cfg.brand, short_name: cfg.brand, description: 'Wine bars, wineries, restaurants and wine hotels worth the trip' });
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

// --- 3. Sitemap, robots, IndexNow ---
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const urlBlocks = sitemap.match(/<url>[\s\S]*?<\/url>/g) || [];
const isEn = b => b.includes(`<loc>${NL}/en/`) || b.includes(`<loc>${NL}/en<`);
const enBlocks = urlBlocks.filter(isEn).map(b => b.split(`${NL}/en/`).join(`${D}/`).split(`${NL}/en<`).join(`${D}/<`));
const head = sitemap.slice(0, sitemap.indexOf('<url>')).trimEnd() + '\n';
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `${head}${enBlocks.map(b => '  ' + b).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${D}/sitemap.xml\n`);
const indexnow = fs.existsSync(path.join(ROOT, 'indexnow-urls.json'))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, 'indexnow-urls.json'), 'utf8')) : [];
const enIndexnow = indexnow.filter(u => u.startsWith(`${NL}/en/`)).map(u => D + u.slice(NL.length + 3));
fs.writeFileSync(path.join(OUT, 'indexnow-urls.json'), JSON.stringify(LIVE ? enIndexnow : []));

// --- 4. _redirects van de Engelse site ---
const nlRedirects = fs.existsSync(path.join(ROOT, '_redirects')) ? fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8') : '';
const oldEn = nlRedirects.split('\n').filter(l => /^\/en\/\S+\s+\/en\//.test(l))
  .map(l => l.replace(/^\/en\//, '/').replace(/\s\/en\//, ' /'));
fs.writeFileSync(path.join(OUT, '_redirects'), [
  '# Foto\'s en kaartgegevens staan op wijn-parade.nl',
  `/uploads/*  ${NL}/uploads/:splat  200`,
  `/content/*  ${NL}/content/:splat  200`,
  '# Oude /en/-adressen en Nederlandse paden op dit domein',
  '/en  /  301!',
  '/en/*  /:splat  301!',
  '/map  /wine-map  301!',
  '/map.html  /wine-map  301!',
  '/travelguides  /wine-travel  301!',
  '/travelguides.html  /wine-travel  301!',
  `/pairings  ${NL}/wijn-spijs  301!`,
  `/pairings.html  ${NL}/wijn-spijs  301!`,
  `/products/*  ${NL}/shop  301!`,
  '# Hernoemde locaties',
  ...oldEn,
  '',
].join('\n'));

// --- 5. Nederlandse site ---
// De map dist-en/ hoort niet op wijn-parade.nl
let nlR = nlRedirects.trimEnd() + '\n\n# Uitvoer van de Engelse site niet tonen op wijn-parade.nl\n/dist-en/*  /dist-en-niet-gevonden  404!\n';
if (LIVE) {
  // Taalkeuze en hreflang naar het nieuwe domein
  const skip = new Set(['en', 'dist-en', 'admin', 'node_modules', '.git', 'uploads', 'content']);
  const nlHtml = [];
  for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const p = path.join(ROOT, e.name);
    if (e.isDirectory()) nlHtml.push(...walk(p).filter(f => f.endsWith('.html')));
    else if (e.name.endsWith('.html')) nlHtml.push(p);
  }
  for (const f of nlHtml) {
    const s = fs.readFileSync(f, 'utf8');
    const t = s.split(`${NL}/en/`).join(`${D}/`).split(`${NL}/en"`).join(`${D}/"`)
      .replace(/href="\/en(\/[^"]*)?"/g, (m, rest) => `href="${D}${rest || '/'}"`);
    if (t !== s) fs.writeFileSync(f, t);
  }
  // Oude /en/-omleidingen meteen naar het nieuwe domein, daarna alles onder /en/
  nlR = nlR.split('\n').map(l => /^\/en\/\S+\s+\/en\//.test(l) ? l.replace(/\s\/en\//, ` ${D}/`) : l).join('\n')
    + `\n# Engelse site verhuisd naar ${D}\n/en  ${D}/  301!\n/en/*  ${D}/:splat  301!\n`;
  // llms.txt: Engelse links naar het nieuwe domein
  const llms = path.join(ROOT, 'llms.txt');
  if (fs.existsSync(llms)) fs.writeFileSync(llms, fs.readFileSync(llms, 'utf8').split(`${NL}/en/`).join(`${D}/`));
  // Nederlandse sitemap zonder Engelse pagina's
  const nlBlocks = urlBlocks.filter(b => !isEn(b));
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `${head}${nlBlocks.map(b => '  ' + b).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(ROOT, 'indexnow-urls.json'), JSON.stringify(indexnow.filter(u => !u.startsWith(`${NL}/en/`))));
}
fs.writeFileSync(path.join(ROOT, '_redirects'), nlR);

console.log(`🌍 Engelse site (${D}): ${pages} pagina's in dist-en/, ${enBlocks.length} in de sitemap${LIVE ? ', live' : ', nog niet live (noindex)'}`);
