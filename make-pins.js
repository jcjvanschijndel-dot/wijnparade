// Pinterest-afbeeldingen (1000x1500) maken voor de artikelen en reisgidsen,
// in het Nederlands (wijn-parade.nl) en het Engels (winehotspotter.com).
//
// Draait NIET in de Netlify-build (daar is geen browser), maar lokaal:
//   node build-indexes.js && node build-en-site.js && node make-pins.js
// Nodig: Playwright met Chromium. Bestaande pins worden alleen opnieuw gemaakt
// als titel, tekst of foto veranderd is (zie uploads/pins/pins.json).
//
// Uitvoer:
//   uploads/pins/nl/<pagina>.jpg en uploads/pins/en/<pagina>.jpg
//   uploads/pins/pins-nl.csv en pins-en.csv: voor "Bulk create pins" op Pinterest

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'uploads', 'pins');
const NL = 'https://wijn-parade.nl';
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site-config.json'), 'utf8')).en_site;
const EN = cfg.domain.replace(/\/+$/, '');

const SETS = [
  { lang: 'nl', dir: 'artikelen', kicker: 'Wijn & reizen', board: 'Wijnartikelen' },
  { lang: 'nl', dir: 'wijnreis', kicker: 'Wijnreis', board: 'Wijnreizen in Europa' },
  { lang: 'nl', dir: 'wijntips', kicker: 'Wijntips', board: 'Wijntips per stad' },
  { lang: 'en', dir: 'dist-en/articles', kicker: 'Wine & travel', board: 'Wine travel articles' },
  { lang: 'en', dir: 'dist-en/wine-travel', kicker: 'Wine travel guide', board: 'Wine travel in Europe' },
  { lang: 'en', dir: 'dist-en/wine-tips', kicker: 'Wine tips', board: 'Wine tips by city' },
];
const BRAND = {
  nl: { name: 'de_wijnparade', site: 'wijn-parade.nl' },
  en: { name: cfg.brand, site: EN.replace(/^https?:\/\//, '') },
};

const decode = s => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const csvCell = s => `"${String(s).replace(/"/g, '""')}"`;
const pick = (html, re) => { const m = html.match(re); return m ? decode(m[1]).trim() : ''; };

function pages() {
  const list = [];
  for (const set of SETS) {
    const dir = path.join(ROOT, set.dir);
    if (!fs.existsSync(dir)) { console.warn(`⚠️  ${set.dir} ontbreekt; draai eerst de build`); continue; }
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort()) {
      const html = fs.readFileSync(path.join(dir, f), 'utf8');
      const url = pick(html, /<link rel="canonical" href="([^"]+)"/);
      let title = pick(html, /<h1[^>]*>([^<]+)</).replace(/:\s*tips$/i, '');
      const desc = pick(html, /<meta name="description" content="([^"]*)"/)
        .replace(/\s*(Tips voor|Tips for) wijnhuizen.*$|\s*Tips for wineries.*$/i, '').trim();
      let img = pick(html, /<meta property="og:image" content="[^"]*?(\/uploads\/[^"]+)"/) ||
        pick(html, /src="(\/uploads\/[^"]+)"/);
      if (!url || !title || !img || !fs.existsSync(path.join(ROOT, decodeURI(img)))) {
        console.warn(`⚠️  overgeslagen: ${set.dir}/${f} (${!img ? 'geen foto' : 'gegevens ontbreken'})`);
        continue;
      }
      list.push({ ...set, id: f.replace('.html', ''), url, title, desc, img: decodeURI(img) });
    }
  }
  return list;
}

// Foto in de pagina zelf zetten: een pagina via setContent mag geen lokale bestanden laden
const MIME = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
const dataUri = img => `data:${MIME[path.extname(img).toLowerCase()] || 'image/jpeg'};base64,${fs.readFileSync(path.join(ROOT, img)).toString('base64')}`;

const template = p => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1000px;height:1500px;font-family:'Inter Display','Inter',sans-serif;background:#1e3a8a;color:#fff;overflow:hidden}
  .photo{position:absolute;inset:0 0 420px 0;background:url('${dataUri(p.img)}') center/cover no-repeat}
  .panel{position:absolute;left:0;right:0;bottom:0;min-height:560px;padding:200px 72px 64px;display:flex;flex-direction:column;justify-content:flex-end;
    background:linear-gradient(to bottom,rgba(30,58,138,0) 0,rgba(30,58,138,.92) 170px,#1e3a8a 240px)}
  .kicker{display:inline-block;align-self:flex-start;background:#fff;color:#1e3a8a;font-weight:700;font-size:26px;letter-spacing:.12em;text-transform:uppercase;padding:10px 20px;border-radius:999px;margin-bottom:28px}
  h1{font-weight:800;font-size:${p.title.length > 48 ? 64 : p.title.length > 30 ? 74 : 86}px;line-height:1.08;letter-spacing:-.01em;margin-bottom:28px}
  p{font-size:31px;line-height:1.4;color:#dbe4ff;margin-bottom:44px;display:-webkit-box;-webkit-line-clamp:${p.title.length > 48 ? 2 : 3};-webkit-box-orient:vertical;overflow:hidden}
  .brand{display:flex;justify-content:space-between;align-items:center;border-top:2px solid rgba(255,255,255,.25);padding-top:28px;font-size:28px}
  .brand b{font-weight:700}
  .brand span{color:#dbe4ff}
</style></head><body>
  <div class="photo"></div>
  <div class="panel">
    <div class="kicker">${esc(p.kicker)}</div>
    <h1>${esc(p.title)}</h1>
    ${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
    <div class="brand"><b>${esc(BRAND[p.lang].name)}</b><span>${esc(BRAND[p.lang].site)}</span></div>
  </div>
</body></html>`;

(async () => {
  const list = pages();
  const stateFile = path.join(OUT, 'pins.json');
  const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1500 } });
  let made = 0;
  const rows = { nl: [], en: [] };
  for (const p of list) {
    const rel = `${p.lang}/${p.dir.split('/').pop()}-${p.id}.jpg`;
    const file = path.join(OUT, rel);
    const html = template(p);
    const hash = crypto.createHash('sha1').update(html + fs.statSync(path.join(ROOT, p.img)).size).digest('hex');
    if (state[rel] !== hash || !fs.existsSync(file)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await page.setContent(html, { waitUntil: 'load' });
      await page.screenshot({ path: file, type: 'jpeg', quality: 84 });
      state[rel] = hash;
      made++;
    }
    rows[p.lang].push([p.title, `${NL}/uploads/pins/${rel}`, p.board, '', p.desc || p.title, p.url, '', '']);
  }
  await browser.close();
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
  const head = ['Title', 'Media URL', 'Pinterest board', 'Thumbnail', 'Description', 'Link', 'Publish date', 'Keywords'];
  for (const lang of ['nl', 'en']) {
    fs.writeFileSync(path.join(OUT, `pins-${lang}.csv`),
      [head, ...rows[lang]].map(r => r.map(csvCell).join(',')).join('\n') + '\n');
  }
  console.log(`📌 Pins: ${list.length} pagina's, ${made} nieuwe of gewijzigde afbeeldingen in uploads/pins/`);
})();
