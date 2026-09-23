// generate-locaties.js
// Maakt bij elke build een statische pagina /locaties.html met gewone links
// naar alle locatiepagina's, gegroepeerd per land. Geen extra packages nodig.
//
// Gebruik (in build.sh):  node generate-locaties.js content/locations

const fs = require('fs');
const path = require('path');

const SITE = 'https://wijn-parade.nl';
const DIR = process.argv[2] || 'content/locations';
const OUT = 'locaties.html';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Leest alleen eenvoudige regels "sleutel: waarde" uit de frontmatter.
function frontmatter(text) {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---/);
  const data = {};
  if (!m) return data;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.+)$/);
    if (kv && !/^[|>]/.test(kv[2].trim())) {
      data[kv[1].toLowerCase()] = kv[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return data;
}

if (!fs.existsSync(DIR)) {
  console.error(`[locaties] Map niet gevonden: ${DIR}`);
  process.exit(1);
}

const locaties = fs.readdirSync(DIR)
  .filter(f => f.endsWith('.md') && !f.startsWith('_'))
  .map(f => {
    const d = frontmatter(fs.readFileSync(path.join(DIR, f), 'utf8'));
    const adres = d.address || d.adres || '';
    const land = d.country || d.land || adres.split(',').pop().trim() || 'Overig';
    return {
      slug: f.replace(/\.md$/, ''),
      naam: d.title || d.name || d.naam || f.replace(/\.md$/, ''),
      type: d.type || d.category || d.categorie || '',
      land,
    };
  });

const perLand = {};
for (const l of locaties) (perLand[l.land] ||= []).push(l);

const secties = Object.keys(perLand).sort((a, b) => a.localeCompare(b, 'nl'))
  .map(land => {
    const items = perLand[land]
      .sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))
      .map(l => `      <li><a href="/locations/${esc(l.slug)}">${esc(l.naam)}</a>` +
        (l.type ? ` <span class="type">${esc(l.type)}</span>` : '') + `</li>`)
      .join('\n');
    return `    <section>\n      <h2>${esc(land)} (${perLand[land].length})</h2>\n      <ul>\n${items}\n      </ul>\n    </section>`;
  }).join('\n');

const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alle wijnlocaties | de_wijnparade</title>
  <meta name="description" content="Overzicht van alle ${locaties.length} wijnhuizen, wijnbars, restaurants en wijnwinkels op de_wijnparade, per land.">
  <link rel="canonical" href="${SITE}/locaties">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 1.5rem; color: #1f2937; }
    h1 { color: #1e3a8a; }
    h2 { margin-top: 2rem; border-bottom: 1px solid #e5e7eb; padding-bottom: .3rem; }
    ul { columns: 2; column-gap: 2rem; padding-left: 1.2rem; }
    li { margin: .25rem 0; break-inside: avoid; }
    a { color: #1e3a8a; }
    .type { color: #6b7280; font-size: .85em; }
    @media (max-width: 600px) { ul { columns: 1; } }
  </style>
</head>
<body>
  <p><a href="/">← Home</a> · <a href="/map">Naar de kaart</a></p>
  <h1>Alle wijnlocaties</h1>
  <p>${locaties.length} plekken, per land op een rij.</p>
${secties}
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log(`[locaties] ${OUT} gemaakt met ${locaties.length} locaties in ${Object.keys(perLand).length} landen.`);
