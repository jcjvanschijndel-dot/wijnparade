#!/usr/bin/env node
/**
 * Build script: generates _index.json files from CMS markdown content
 * Runs during Netlify build so the site loads content locally (no GitHub API)
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');

console.log('🔨 Generating content indexes...');

// Get all subdirectories in content/
let dirs;
try {
    dirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
} catch (e) {
    console.log('No content directory found, skipping.');
    process.exit(0);
}

for (const dir of dirs) {
    const dirPath = path.join(CONTENT_DIR, dir);
    
    // Get all .md files
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
    
    if (files.length === 0) {
        fs.writeFileSync(path.join(dirPath, '_index.json'), '[]');
        console.log(`  📁 ${dir}: 0 entries`);
        continue;
    }
    
    const items = [];
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = parseFrontmatter(content);
        
        if (parsed) {
            parsed._id = file.replace('.md', '');
            items.push(parsed);
        }
    }
    
    fs.writeFileSync(path.join(dirPath, '_index.json'), JSON.stringify(items, null, 2));
    console.log(`  📁 ${dir}: ${items.length} entries`);
}

console.log('✅ Content indexes generated!');

// ============================================================
// STATISCHE LOCATIEPAGINA'S GENEREREN
// ============================================================

const SITE_URL = 'https://wijn-parade.nl';
const locationsDir = path.join(CONTENT_DIR, 'locations');
const staticLocationsDir = path.join(__dirname, 'locations');

if (!fs.existsSync(staticLocationsDir)) fs.mkdirSync(staticLocationsDir);

const locationFiles = fs.existsSync(locationsDir)
    ? fs.readdirSync(locationsDir).filter(f => f.endsWith('.md'))
    : [];

const typeLabels = {
    wijnbar: '🍾 Wijnbar', wijnwinkel: '🏪 Wijnwinkel',
    wijnhuis: '🏰 Wijnhuis', restaurant: '🍽️ Restaurant'
};

const sitemapUrls = [
    `${SITE_URL}/`, `${SITE_URL}/map.html`, `${SITE_URL}/value-score.html`,
    `${SITE_URL}/travelguides.html`, `${SITE_URL}/shop.html`,
];

for (const file of locationFiles) {
    const id = file.replace('.md', '');
    const raw = fs.readFileSync(path.join(locationsDir, file), 'utf8');
    const loc = parseFrontmatter(raw);
    if (!loc || !loc.name) continue;

    const name = loc.title || loc.name;
    const description = loc.description || '';
    const metaDesc = description.replace(/\s+/g, ' ').trim().substring(0, 160);
    const typeLabel = typeLabels[loc.type] || loc.type || '';
    const image = loc.image ? `${SITE_URL}${loc.image}` : `${SITE_URL}/profile-photo.jpg`;
    const pageUrl = `${SITE_URL}/locations/${id}.html`;

    const schema = {
        '@context': 'https://schema.org', '@type': 'LocalBusiness',
        name, description, image, url: loc.website || pageUrl,
        address: { '@type': 'PostalAddress', streetAddress: loc.address || '' },
        ...(loc.lat && loc.lng ? { geo: { '@type': 'GeoCoordinates', latitude: loc.lat, longitude: loc.lng } } : {})
    };

    const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <meta name="theme-color" content="#1e3a8a">
  <title>${name} | de_wijnparade</title>
  <meta name="description" content="${metaDesc.replace(/"/g,'&quot;')}">
  <meta property="og:title" content="${name} | de_wijnparade">
  <meta property="og:description" content="${metaDesc.replace(/"/g,'&quot;')}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${pageUrl}">
  <link rel="canonical" href="${pageUrl}">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <style>
    .location-hero{width:100%;height:350px;object-fit:cover;border-radius:12px;margin-bottom:2rem}
    .location-map{height:350px;border-radius:12px;border:1px solid var(--gray-200);margin:2rem 0}
    .info-section{padding:1.5rem;background:var(--gray-50);border-radius:12px;border:1px solid var(--gray-200);margin-bottom:1.5rem}
    .info-label{font-size:1.1rem;font-weight:600;color:var(--navy);margin-bottom:1rem}
    .info-value{font-size:1rem;color:var(--gray-900);line-height:1.8;white-space:pre-wrap}
    .website-btn{display:inline-block;padding:0.75rem 1.5rem;background:var(--navy);color:#fff;text-decoration:none;border-radius:8px;font-weight:500;margin:1rem 0}
    @media(max-width:768px){.location-hero{height:250px}.location-map{height:300px}}
  </style>
</head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-57CJ2STYT6"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-57CJ2STYT6');</script>
<body>
  <header class="header"><div class="container">
    <div class="header-inner">
      <a href="/map.html" class="header-logo">
        <div class="header-logo-box"><img src="/logo.svg" alt="de_wijnparade"></div>
        <span class="header-logo-name">de_wijnparade</span>
      </a>
      <a href="https://www.instagram.com/de_wijnparade/" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:6px;background:linear-gradient(135deg,#4a0e2e,#d12b64,#fff3e0);border-radius:50px;padding:0.3rem 0.65rem;text-decoration:none;"><svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg><span style="color:white;font-size:11px;font-weight:600;">Volgen</span></a>
    </div>
  </div></header>
  <main class="main"><div class="container">
    <a href="/map.html" class="back-button">← Terug naar kaart</a>
    ${loc.image ? `<img src="${loc.image}" alt="${name}" class="location-hero">` : ''}
    <div class="recipe-header">
      <h1 class="recipe-title">${name} — ${typeLabel} in ${(loc.address || "").split(",").slice(-2).join(",").trim()}</h1>
      <div class="recipe-wine">${typeLabel}</div>
    </div>
    <div class="info-section"><div class="info-label">📍 Adres</div><div class="info-value">${loc.address || ''}</div></div>
    <div class="info-section"><div class="info-label">ℹ️ Over deze locatie</div><div class="info-value">${description}</div></div>
    ${loc.website ? `<a href="${loc.website.startsWith('http') ? loc.website : 'https://' + loc.website}" target="_blank" rel="noopener" class="website-btn">Bezoek website →</a>` : ''}
    ${loc.lat && loc.lng ? `<div class="location-map" id="locationMap"></div>` : ''}
  </div></main>
  <section class="tips-form-section"><div class="container">
    <h2 class="form-title">💡 Geef je tips door!</h2>
    <p class="form-intro">Ken jij een geweldige wijn of locatie? Deel het met ons!</p>
    <form name="tips" method="POST" data-netlify="true" class="tips-form" action="/bedankt.html">
      <input type="hidden" name="form-name" value="tips">
      <div class="form-group"><label for="tip">Jouw tip</label><textarea id="tip" name="tip" rows="4" required placeholder="Vertel ons over je tip..."></textarea></div>
      <div class="form-row">
        <div class="form-group"><label for="tipname">Naam</label><input type="text" id="tipname" name="name" required placeholder="Je naam"></div>
        <div class="form-group"><label for="tipemail">E-mail</label><input type="email" id="tipemail" name="email" required placeholder="je@email.nl"></div>
      </div>
      <button type="submit" class="submit-btn">Versturen</button>
    </form>
  </div></section>
  <footer class="footer"><div class="container">
    <p>&copy; 2025 de_wijnparade | <a href="https://www.instagram.com/de_wijnparade/" target="_blank">@de_wijnparade</a></p>
  </div></footer>
  ${loc.lat && loc.lng ? `
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script>
    const map = L.map('locationMap').setView([${loc.lat}, ${loc.lng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'© OpenStreetMap',maxZoom:19}).addTo(map);
    const icons = {wijnbar:'🍾',wijnwinkel:'🏪',wijnhuis:'🏰',restaurant:'🍽️'};
    const emoji = icons['${loc.type}'] || '📍';
    L.marker([${loc.lat}, ${loc.lng}], {icon: L.divIcon({className:'',html:'<div style="background:#1e3a8a;width:40px;height:40px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,.3)">'+emoji+'</div>',iconSize:[40,40],iconAnchor:[20,20]})}).addTo(map);
  </script>` : ''}
</body></html>`;

    fs.writeFileSync(path.join(staticLocationsDir, `${id}.html`), html);
    sitemapUrls.push(pageUrl);
}

console.log(`  📍 locations: ${locationFiles.length} statische pagina's gegenereerd`);

// sitemap.xml
const today = new Date().toISOString().split('T')[0];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url><loc>${url}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${url === SITE_URL + '/' ? '1.0' : url.includes('/locations/') ? '0.8' : '0.7'}</priority></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
console.log(`  🗺️  sitemap.xml: ${sitemapUrls.length} URLs`);

// robots.txt
const robotsPath = path.join(__dirname, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
    fs.writeFileSync(robotsPath, `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
} else {
    let robots = fs.readFileSync(robotsPath, 'utf8');
    if (!robots.includes('Sitemap:')) {
        robots += `\nSitemap: ${SITE_URL}/sitemap.xml\n`;
        fs.writeFileSync(robotsPath, robots);
    }
}



/**
 * Parse YAML frontmatter from markdown content
 * Handles: quoted strings, colons in values, multi-line scalars, nested lists
 */
function parseFrontmatter(content) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;
    
    const yaml = match[1];
    const lines = yaml.split('\n');
    const result = {};
    
    let i = 0;
    
    while (i < lines.length) {
        const line = lines[i];
        
        // Skip empty lines
        if (line.trim() === '') { i++; continue; }
        
        // Top-level key: value (not indented, not a list item)
        const topMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)/);
        if (topMatch) {
            const key = topMatch[1];
            let rawValue = topMatch[2].trim();
            
            // Check if value is empty (next lines are a list or block scalar)
            if (rawValue === '' || rawValue === '>-' || rawValue === '>' || rawValue === '|' || rawValue === '|-') {
                // Check if it's a block scalar
                if (rawValue === '>-' || rawValue === '>' || rawValue === '|' || rawValue === '|-') {
                    const fold = rawValue.startsWith('>');
                    const strip = rawValue.endsWith('-');
                    i++;
                    let blockLines = [];
                    while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
                        blockLines.push(lines[i].replace(/^  /, ''));
                        i++;
                    }
                    let text = fold
                        ? blockLines.join(' ').replace(/\s+/g, ' ').trim()
                        : blockLines.join('\n');
                    if (strip) text = text.replace(/\n+$/, '');
                    result[key] = text;
                    continue;
                }
                
                // Check if next line starts a list
                if (i + 1 < lines.length && lines[i + 1].trim().startsWith('- ')) {
                    i++;
                    const list = parseList(lines, i);
                    result[key] = list.items;
                    i = list.nextIndex;
                    continue;
                }
                
                // Empty value
                result[key] = '';
                i++;
                continue;
            }
            
            // Quoted string - handle properly (may contain colons, special chars)
            if ((rawValue.startsWith('"') && rawValue.endsWith('"')) ||
                (rawValue.startsWith("'") && rawValue.endsWith("'"))) {
                result[key] = rawValue.slice(1, -1);
                i++;
                continue;
            }
            
            // Quoted string that might span... actually in frontmatter it shouldn't
            // but let's handle unclosed quotes
            if (rawValue.startsWith('"') && !rawValue.endsWith('"')) {
                let fullValue = rawValue.substring(1);
                i++;
                while (i < lines.length && !lines[i].includes('"')) {
                    fullValue += '\n' + lines[i];
                    i++;
                }
                if (i < lines.length) {
                    fullValue += '\n' + lines[i].replace(/".*$/, '').replace(/"$/, '');
                    i++;
                }
                result[key] = fullValue;
                continue;
            }
            
            // Check for continuation lines (YAML folded scalars without explicit > marker)
            // Decap CMS wraps long values like:
            //   description: first part of text
            //     continued on next line
            let fullValue = rawValue;
            while (i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                // Continuation line: starts with spaces but is NOT a list item and NOT a new key
                if (nextLine.match(/^  \S/) && !nextLine.trim().startsWith('- ') && !nextLine.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*:/)) {
                    fullValue += ' ' + nextLine.trim();
                    i++;
                } else {
                    break;
                }
            }
            
            // Plain value - convert numbers, keep strings
            result[key] = convertValue(fullValue);
            i++;
            continue;
        }
        
        i++;
    }
    
    return result;
}

/**
 * Parse a YAML list starting at index i
 */
function parseList(lines, startIndex) {
    const items = [];
    let i = startIndex;
    
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Not a list item or indented content? We're done
        if (!trimmed.startsWith('- ') && !line.startsWith('  ') && !line.startsWith('\t')) {
            break;
        }
        if (trimmed === '') { i++; continue; }
        
        // List item
        if (trimmed.startsWith('- ')) {
            const afterDash = trimmed.substring(2).trim();
            
            // Check if it's an object item (has key: value)
            const objMatch = afterDash.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)/);
            if (objMatch) {
                // Object in list
                const obj = {};
                const firstKey = objMatch[1];
                const firstVal = objMatch[2].trim();
                obj[firstKey] = convertValue(stripQuotes(firstVal));
                
                // Read additional properties
                i++;
                while (i < lines.length) {
                    const propLine = lines[i];
                    const propTrimmed = propLine.trim();
                    
                    // Must be indented and not a new list item
                    if (!propLine.startsWith('    ') && !propLine.startsWith('\t\t')) break;
                    if (propTrimmed.startsWith('- ')) break;
                    if (propTrimmed === '') { i++; continue; }
                    
                    const propMatch = propTrimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)/);
                    if (propMatch) {
                        obj[propMatch[1]] = convertValue(stripQuotes(propMatch[2].trim()));
                    }
                    i++;
                }
                
                items.push(obj);
                continue;
            } else {
                // Simple list item
                items.push(convertValue(stripQuotes(afterDash)));
                i++;
                continue;
            }
        }
        
        i++;
    }
    
    return { items, nextIndex: i };
}

function stripQuotes(str) {
    if (!str) return str;
    if ((str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))) {
        return str.slice(1, -1);
    }
    return str;
}

function convertValue(val) {
    if (typeof val !== 'string') return val;
    val = stripQuotes(val);
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val === '') return '';
    if (!isNaN(val) && val.trim() !== '') return Number(val);
    return val;
}

// ============================================================
// REGIO PAGINA'S GENEREREN (gelezen uit content/regions/*.md)
// ============================================================

// Lees regio-definities uit CMS markdown bestanden
const regionsContentPath = path.join(CONTENT_DIR, 'regions');
let REGIONS = [];
if (fs.existsSync(regionsContentPath)) {
  const regionFiles = fs.readdirSync(regionsContentPath).filter(f => f.endsWith('.md'));
  for (const file of regionFiles) {
    const raw = fs.readFileSync(path.join(regionsContentPath, file), 'utf8');
    const parsed = parseFrontmatter(raw);
    if (!parsed || !parsed.name) continue;
    REGIONS.push({
      id: file.replace('.md', ''),
      name: parsed.name,
      country: parsed.country || '',
      emoji: parsed.emoji || '🍷',
      description: parsed.description || '',
      centerLat: parseFloat(parsed.centerLat) || 0,
      centerLng: parseFloat(parsed.centerLng) || 0,
      zoom: parseInt(parsed.zoom) || 10,
      bounds: {
        minLat: parseFloat(parsed.minLat) || 0,
        maxLat: parseFloat(parsed.maxLat) || 0,
        minLng: parseFloat(parsed.minLng) || 0,
        maxLng: parseFloat(parsed.maxLng) || 0,
      }
    });
  }
  console.log(`  📖 ${REGIONS.length} regio-definities gelezen uit CMS`);
} else {
  console.log('  ⚠️  content/regions/ map niet gevonden, geen regiogidsen gegenereerd');
}


const SITE_URL_REGIONS = 'https://wijn-parade.nl';

const REGION_ICON_MAP = {
  'parijs': 'ti-building-arch',
  'rotterdam': 'ti-anchor',
  'amsterdam': 'ti-building-bridge-2',
  't-gooi': 'ti-trees',
  'limburg': 'ti-mountain',
  'rioja': 'ti-building-castle',
  'ribera-del-duero': 'ti-building-castle',
  'bordeaux': 'ti-building-castle',
  'bourgogne': 'ti-bottle',
  'champagne': 'ti-star',
  'rhone-noord': 'ti-mountain',
  'provence': 'ti-sun',
  'loire': 'ti-crown',
  'douro': 'ti-ship',
  'toscane': 'ti-sun',
  'piemonte': 'ti-mountain',
  'alto-adige': 'ti-pine-tree',
  'mosel': 'ti-mountain',
  'ahr': 'ti-mountain',
  'baskenland': 'ti-fish',
  'mallorca': 'ti-sun',
  'costa-brava': 'ti-sun',
  'malaga': 'ti-sun',
  'griekenland': 'ti-building-arch',
};
function getRegionIconClass(id) {
  return REGION_ICON_MAP[id] || 'ti-map-pin';
}

const regioDir = path.join(__dirname, 'regio');
if (!fs.existsSync(regioDir)) fs.mkdirSync(regioDir);

const typeLabelsReg = { wijnbar: 'Wijnbar', wijnwinkel: 'Wijnwinkel', wijnhuis: 'Wijnhuis', restaurant: 'Restaurant' };

// Read all location items from the already-generated _index.json
let allLocations = [];
try {
  const locIdx = path.join(CONTENT_DIR, 'locations', '_index.json');
  if (fs.existsSync(locIdx)) allLocations = JSON.parse(fs.readFileSync(locIdx, 'utf8'));
} catch(e) {}

const regionsIndex = [];

for (const region of REGIONS) {
  // Filter locations that fall within bounding box
  const locs = allLocations.filter(l => {
    const lat = parseFloat(l.lat), lng = parseFloat(l.lng);
    if (isNaN(lat) || isNaN(lng)) return false;
    return lat >= region.bounds.minLat && lat <= region.bounds.maxLat &&
           lng >= region.bounds.minLng && lng <= region.bounds.maxLng;
  });

  const pageUrl = `${SITE_URL_REGIONS}/regio/${region.id}.html`;
  const locNames = locs.slice(0, 3).map(l => l.title || l.name).join(', ');
  const metaDesc = `Ontdek de beste wijnhuizen, restaurants en wijnbars in ${region.name}. Waaronder ${locNames} — geselecteerd door de_wijnparade.`.substring(0, 160);

  // Group by type
  const byType = { wijnhuis: [], wijnbar: [], restaurant: [], wijnwinkel: [] };
  locs.forEach(l => { if (byType[l.type]) byType[l.type].push(l); });

  const renderSection = (type, items) => {
    if (!items.length) return '';
    return `<div class="region-section">
      <h2 class="region-section-title">
        ${type === 'wijnhuis' ? '<i class="ti ti-building-castle"></i>' : type === 'restaurant' ? '<i class="ti ti-tools-kitchen-2"></i>' : type === 'wijnbar' ? '<i class="ti ti-glass-full"></i>' : '<i class="ti ti-shopping-bag"></i>'}
        ${typeLabelsReg[type]} in ${region.name}
      </h2>
      <div class="region-locs">
        ${items.map(l => `
          <div class="region-loc-card">
            ${l.image ? `<img src="${l.image}" alt="${l.title || l.name}" class="region-loc-img" loading="lazy">` : ''}
            <div class="region-loc-body">
              <h3 class="region-loc-name">${l.title || l.name}</h3>
              <div class="region-loc-address">📍 ${l.address || ''}</div>
              ${l.description ? `<div class="region-loc-desc">${l.description.substring(0, 200)}${l.description.length > 200 ? '…' : ''}</div>` : ''}
              <a href="/locations/${l._id}.html" class="region-loc-link">Lees meer →</a>
              ${l.website ? `<a href="${l.website.startsWith('http') ? l.website : 'https://' + l.website}" target="_blank" rel="noopener" class="region-loc-link region-loc-web">Website →</a>` : ''}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  };

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <meta name="theme-color" content="#1e3a8a">
  <title>Wijn hotspots ${region.name} — wijnhuizen, restaurants en wijnbars | de_wijnparade</title>
  <meta name="description" content="${metaDesc.replace(/"/g,'&quot;')}">
  <meta property="og:title" content="Wijn hotspots ${region.name} | de_wijnparade">
  <meta property="og:description" content="${metaDesc.replace(/"/g,'&quot;')}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="article">
  <link rel="canonical" href="${pageUrl}">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"TouristDestination","name":"${region.name}","description":"${region.description.replace(/"/g,'\\"')}","url":"${pageUrl}"}</script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <style>
    .region-hero{background:var(--navy);color:#fff;padding:3rem 0 2rem;text-align:center}
    .region-hero-icon{width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 0.75rem;font-size:1.5rem;color:white;}
    .region-hero h1{font-size:2rem;font-weight:700;margin-bottom:0.5rem}
    .region-hero-country{opacity:0.8;font-size:1rem;margin-bottom:1.5rem}
    .region-hero-desc{max-width:680px;margin:0 auto 2rem;line-height:1.8;opacity:0.9;font-size:1rem}
    .region-map-btn{display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.5rem;background:#fff;color:var(--navy);border-radius:8px;font-weight:600;text-decoration:none;font-size:0.95rem;transition:transform 0.2s}
    .region-map-btn:hover{transform:translateY(-2px)}
    .region-stats{display:flex;justify-content:center;gap:2rem;padding:1.5rem 0;border-bottom:1px solid var(--gray-200);flex-wrap:wrap;margin-bottom:2rem}
    .region-stat{text-align:center}
    .region-stat-num{font-size:1.5rem;font-weight:700;color:var(--navy)}
    .region-stat-label{font-size:0.8rem;color:var(--gray-600)}
    .region-section{margin-bottom:3rem}
    .region-section-title{font-size:1.1rem;font-weight:600;color:var(--navy);margin-bottom:1.25rem;padding-bottom:0.5rem;border-bottom:2px solid var(--gray-200);display:flex;align-items:center;gap:0.5rem;}
    .region-locs{display:grid;gap:1.25rem}
    .region-loc-card{display:grid;grid-template-columns:120px 1fr;gap:1rem;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:12px;overflow:hidden;transition:box-shadow 0.2s}
    .region-loc-card:hover{box-shadow:0 4px 12px rgba(30,58,138,0.1)}
    .region-loc-img{width:120px;height:120px;object-fit:cover}
    .region-loc-body{padding:0.75rem 0.75rem 0.75rem 0}
    .region-loc-name{font-weight:600;color:var(--navy);margin-bottom:0.25rem}
    .region-loc-address{font-size:0.8rem;color:var(--gray-600);margin-bottom:0.4rem}
    .region-loc-desc{font-size:0.85rem;line-height:1.6;color:var(--gray-900);margin-bottom:0.5rem}
    .region-loc-link{display:inline-block;font-size:0.82rem;color:var(--navy);font-weight:500;text-decoration:none;margin-right:0.75rem}
    .region-loc-link:hover{text-decoration:underline}
    @media(max-width:600px){.region-loc-card{grid-template-columns:80px 1fr}.region-loc-img{width:80px;height:80px}.region-hero h1{font-size:1.5rem}}
  </style>
</head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-57CJ2STYT6"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-57CJ2STYT6');</script>
<body>
  <header class="header">
    <div class="container">
      <div class="header-inner">
        <a href="/travelguides.html" class="header-logo">
          <div class="header-logo-box"><img src="/logo.svg" alt="de_wijnparade"></div>
          <span class="header-logo-name">de_wijnparade</span>
        </a>
        <a href="https://www.instagram.com/de_wijnparade/" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:6px;background:linear-gradient(135deg,#4a0e2e,#d12b64,#fff3e0);border-radius:50px;padding:0.3rem 0.65rem;text-decoration:none;"><svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg><span style="color:white;font-size:11px;font-weight:600;">Volgen</span></a>
      </div>
    </div>
  </header>

  <div class="region-hero">
    <div class="container">
      <div class="region-hero-icon"><i class="ti ${getRegionIconClass(region.id)}" style="font-size:1.75rem;"></i></div>
      <h1>Wijn hotspots ${region.name}</h1>
      <div class="region-hero-country">${region.country}</div>
      <p class="region-hero-desc">${region.description}</p>
      <a href="/map.html?lat=${region.centerLat}&lng=${region.centerLng}&zoom=${region.zoom}" class="region-map-btn">
        <i class="ti ti-map-2"></i> Bekijk op de kaart
      </a>
    </div>
  </div>

  <main class="main">
    <div class="container">
      <div class="region-stats">
        ${Object.entries(byType).filter(([,v])=>v.length).map(([t,v])=>`
          <div class="region-stat">
            <div class="region-stat-num">${v.length}</div>
            <div class="region-stat-label">${t === 'wijnhuis' ? '<i class="ti ti-building-castle"></i> ' : t === 'restaurant' ? '<i class="ti ti-tools-kitchen-2"></i> ' : t === 'wijnbar' ? '<i class="ti ti-glass-full"></i> ' : '<i class="ti ti-shopping-bag"></i> '}${typeLabelsReg[t]}</div>
          </div>`).join('')}
      </div>
      ${renderSection('wijnhuis', byType.wijnhuis)}
      ${renderSection('restaurant', byType.restaurant)}
      ${renderSection('wijnbar', byType.wijnbar)}
      ${renderSection('wijnwinkel', byType.wijnwinkel)}
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      <p>&copy; 2025 de_wijnparade | <a href="https://www.instagram.com/de_wijnparade/" target="_blank">@de_wijnparade</a></p>
    </div>
  </footer>
</body>
</html>`;

  fs.writeFileSync(path.join(regioDir, `${region.id}.html`), html);

  regionsIndex.push({
    id: region.id,
    name: region.name,
    country: region.country,
    emoji: region.emoji,
    description: region.description,
    centerLat: region.centerLat,
    centerLng: region.centerLng,
    zoom: region.zoom,
    locationCount: locs.length,
    url: `/regio/${region.id}.html`,
    mapUrl: `/map.html?lat=${region.centerLat}&lng=${region.centerLng}&zoom=${region.zoom}`
  });
}

// Write regions index
const regionsContentDir = path.join(CONTENT_DIR, 'regions');
if (!fs.existsSync(regionsContentDir)) fs.mkdirSync(regionsContentDir);
fs.writeFileSync(path.join(regionsContentDir, '_index.json'), JSON.stringify(regionsIndex, null, 2));

// Add region URLs to sitemap
const sitemapPath = path.join(__dirname, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const regionUrls = regionsIndex.map(r => `  <url>\n    <loc>${SITE_URL_REGIONS}${r.url}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`).join('\n');
  sitemap = sitemap.replace('</urlset>', regionUrls + '\n</urlset>');
  fs.writeFileSync(sitemapPath, sitemap);
}

console.log(`  🌍 regio: ${regionsIndex.length} regio-pagina's gegenereerd`);
console.log('✅ Regio build klaar!');
