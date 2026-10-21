// Ontbrekende coördinaten aanvullen tijdens de Netlify-build
//
// Locaties die via het CMS of via Claude zijn toegevoegd zonder lat/lng krijgen
// hier coördinaten op basis van hun adres (Google Geocoding API, dezelfde sleutel
// als de geocode-functie van het CMS: GOOGLE_GEOCODING_API_KEY). De coördinaten
// worden alleen in de build-kopie van het .md-bestand gezet, zodat ze op de kaart,
// in de regiogidsen en in het kruimelpad meetellen. In git verandert niets.
// Zonder sleutel of bij een fout gaat de build gewoon door.

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'content', 'locations');
const key = process.env.GOOGLE_GEOCODING_API_KEY;

(async () => {
  const missing = fs.readdirSync(dir).filter(f => f.endsWith('.md')).filter(f => {
    const fm = (fs.readFileSync(path.join(dir, f), 'utf8').match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
    return /^address:\s*\S/m.test(fm) && !(/^lat:\s*-?\d/m.test(fm) && /^lng:\s*-?\d/m.test(fm));
  });
  if (!missing.length) return;
  if (!key) {
    console.log(`  ⚠️  geocoding: ${missing.length} locatie(s) zonder coördinaten, maar GOOGLE_GEOCODING_API_KEY ontbreekt in de build`);
    return;
  }

  let ok = 0;
  for (const f of missing) {
    const file = path.join(dir, f);
    const text = fs.readFileSync(file, 'utf8');
    const addrLine = text.match(/^address:\s*(.+)$/m);
    const address = addrLine[1].trim().replace(/^(['"])(.*)\1$/, '$2');
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`);
      const data = await res.json();
      const loc = data.status === 'OK' && data.results[0] && data.results[0].geometry.location;
      if (!loc) { console.log(`  ⚠️  geocoding: ${f}: ${data.status}${data.error_message ? ` (${data.error_message})` : ''}`); continue; }
      // Bestaande lege lat/lng-regels weghalen en de coördinaten direct na het adres zetten
      const updated = text.replace(/^(lat|lng):[^\n]*\n/gm, '')
        .replace(addrLine[0], `${addrLine[0]}\nlat: ${loc.lat}\nlng: ${loc.lng}`);
      fs.writeFileSync(file, updated);
      ok++;
    } catch (e) {
      console.log(`  ⚠️  geocoding: ${f}: ${e.message}`);
    }
  }
  console.log(`  📌 geocoding: ${ok} van ${missing.length} locatie(s) zonder coördinaten aangevuld`);
})();
