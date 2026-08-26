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
// STATISCHE LOCATIEPAGINA'S GENEREREN
// ============================================================

const SITE_URL = 'https://wijn-parade.nl';
const locationsDir = path.join(CONTENT_DIR, 'locations');
const staticLocationsDir = path.join(__dirname, 'locations');

// Maak /locations/ map aan als die niet bestaat
if (!fs.existsSync(staticLocationsDir)) {
    fs.mkdirSync(staticLocationsDir);
}

const locationFiles = fs.existsSync(locationsDir)
    ? fs.readdirSync(locationsDir).filter(f => f.endsWith('.md'))
    : [];

const typeLabels = {
    wijnbar: '🍾 Wijnbar',
    wijnwinkel: '🏪 Wijnwinkel',
    wijnhuis: '🏰 Wijnhuis',
    restaurant: '🍽️ Restaurant'
};

const sitemapUrls = [
    `${SITE_URL}/`,
    `${SITE_URL}/map.html`,
    `${SITE_URL}/value-score.html`,
    `${SITE_URL}/toplists.html`,
    `${SITE_URL}/travelguides.html`,
    `${SITE_URL}/wine-food.html`,
    `${SITE_URL}/shop.html`,
];

for (const file of locationFiles) {
    const id = file.replace('.md', '');
    const content = fs.readFileSync(path.join(locationsDir, file), 'utf8');
    const loc = parseFrontmatter(content);
    if (!loc || !loc.name) continue;

    const name = loc.title || loc.name;
    const description = loc.description || '';
    const metaDesc = description.replace(/\s+/g, ' ').trim().substring(0, 160);
    const typeLabel = typeLabels[loc.type] || loc.type || '';
    const image = loc.image
        ? `${SITE_URL}${loc.image}`
        : `${SITE_URL}/profile-photo.jpg`;
    const pageUrl = `${SITE_URL}/locations/${id}.html`;

    // Schema.org JSON-LD
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name,
        description,
        address: { '@type': 'PostalAddress', streetAddress: loc.address || '' },
        image,
        url: loc.website || pageUrl,
        ...(loc.lat && loc.lng ? { geo: { '@type': 'GeoCoordinates', latitude: loc.lat, longitude: loc.lng } } : {})
    };

    const html = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <meta name="theme-color" content="#1e3a8a">
    <title>${name} | de_wijnparade</title>
    <meta name="description" content="${metaDesc.replace(/"/g, '&quot;')}">
    <meta property="og:title" content="${name} | de_wijnparade">
    <meta property="og:description" content="${metaDesc.replace(/"/g, '&quot;')}">
    <meta property="og:image" content="${image}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:type" content="website">
    <link rel="canonical" href="${pageUrl}">
    <script type="application/ld+json">${JSON.stringify(schema)}</script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <style>
        .location-hero { width:100%; height:350px; object-fit:cover; border-radius:12px; margin-bottom:2rem; }
        .location-map { height:350px; border-radius:12px; border:1px solid var(--gray-200); margin:2rem 0; }
        .info-section { padding:1.5rem; background:var(--gray-50); border-radius:12px; border:1px solid var(--gray-200); margin-bottom:1.5rem; }
        .info-label { font-size:1.1rem; font-weight:600; color:var(--navy); margin-bottom:1rem; }
        .info-value { font-size:1rem; color:var(--gray-900); line-height:1.8; white-space:pre-wrap; }
        .website-btn { display:inline-block; padding:0.75rem 1.5rem; background:var(--navy); color:#fff; text-decoration:none; border-radius:8px; font-weight:500; margin:1rem 0; }
        @media(max-width:768px){ .location-hero{height:250px;} .location-map{height:300px;} }
    </style>
</head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-57CJ2STYT6"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-57CJ2STYT6');</script>
<body>
    <header class="header">
        <div class="container">
            <a href="/map.html" class="instagram-profile-link">
                <img src="/profile-photo.jpg" alt="de_wijnparade" class="profile-photo-img">
                <span>← Terug</span>
            </a>
        </div>
    </header>
    <main class="main">
        <div class="container">
            <a href="/map.html" class="back-button">← Terug naar kaart</a>
            ${loc.image ? `<img src="${loc.image}" alt="${name}" class="location-hero">` : ''}
            <div class="recipe-header">
                <h1 class="recipe-title">${name}</h1>
                <div class="recipe-wine">${typeLabel}</div>
            </div>
            <div class="info-section">
                <div class="info-label">📍 Adres</div>
                <div class="info-value">${loc.address || ''}</div>
            </div>
            <div class="info-section">
                <div class="info-label">ℹ️ Over deze locatie</div>
                <div class="info-value">${description}</div>
            </div>
            ${loc.website ? `<a href="${loc.website}" target="_blank" rel="noopener" class="website-btn">Bezoek website →</a>` : ''}
            ${loc.lat && loc.lng ? `<div class="location-map" id="locationMap"></div>` : ''}
        </div>
    </main>
    <section class="tips-form-section">
        <div class="container">
            <h2 class="form-title">💡 Geef je tips door!</h2>
            <p class="form-intro">Ken jij een geweldige wijn of locatie? Deel het met ons!</p>
            <form name="tips" method="POST" data-netlify="true" class="tips-form" action="/bedankt.html">
                <input type="hidden" name="form-name" value="tips">
                <div class="form-group"><label for="tip">Jouw tip</label><textarea id="tip" name="tip" rows="4" required placeholder="Vertel ons over je tip..."></textarea></div>
                <div class="form-row">
                    <div class="form-group"><label for="name">Naam</label><input type="text" id="name" name="name" required placeholder="Je naam"></div>
                    <div class="form-group"><label for="email">E-mail</label><input type="email" id="email" name="email" required placeholder="je@email.nl"></div>
                </div>
                <button type="submit" class="submit-btn">Versturen</button>
            </form>
        </div>
    </section>
    <footer class="footer">
        <div class="container">
            <p>&copy; 2025 de_wijnparade | <a href="https://www.instagram.com/de_wijnparade/" target="_blank">@de_wijnparade</a></p>
        </div>
    </footer>
    ${loc.lat && loc.lng ? `
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    <script>
        const map = L.map('locationMap').setView([${loc.lat}, ${loc.lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
        const icons = { wijnbar:'🍾', wijnwinkel:'🏪', wijnhuis:'🏰', restaurant:'🍽️' };
        const emoji = icons['${loc.type}'] || '📍';
        L.divIcon && L.marker([${loc.lat}, ${loc.lng}], {
            icon: L.divIcon({ className:'', html:'<div style="background:#1e3a8a;width:40px;height:40px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,.3)">'+emoji+'</div>', iconSize:[40,40], iconAnchor:[20,20] })
        }).addTo(map);
    </script>` : ''}
</body>
</html>`;

    fs.writeFileSync(path.join(staticLocationsDir, `${id}.html`), html);
    sitemapUrls.push(pageUrl);
}

console.log(`  📍 locations: ${locationFiles.length} statische pagina's gegenereerd`);

// ============================================================
// SITEMAP.XML GENEREREN
// ============================================================

const today = new Date().toISOString().split('T')[0];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url === SITE_URL + '/' ? '1.0' : url.includes('/locations/') ? '0.8' : '0.7'}</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
console.log(`  🗺️  sitemap.xml: ${sitemapUrls.length} URLs`);

// ============================================================
// ROBOTS.TXT GENEREREN (alleen als nog niet bestaat)
// ============================================================

const robotsPath = path.join(__dirname, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
    fs.writeFileSync(robotsPath, `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
    console.log('  🤖 robots.txt aangemaakt');
} else {
    // Zorg dat sitemap-regel er in staat
    let robots = fs.readFileSync(robotsPath, 'utf8');
    if (!robots.includes('Sitemap:')) {
        robots += `\nSitemap: ${SITE_URL}/sitemap.xml\n`;
        fs.writeFileSync(robotsPath, robots);
        console.log('  🤖 robots.txt: sitemap regel toegevoegd');
    }
}

console.log('✅ SEO build klaar!');
