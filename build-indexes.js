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
const regioDir = path.join(__dirname, 'regio');
if (!fs.existsSync(regioDir)) fs.mkdirSync(regioDir);

const typeLabelsReg = { wijnbar: '🍾 Wijnbar', wijnwinkel: '🏪 Wijnwinkel', wijnhuis: '🏰 Wijnhuis', restaurant: '🍽️ Restaurant' };

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
  const metaDesc = region.description.substring(0, 160);

  // Group by type
  const byType = { wijnhuis: [], wijnbar: [], restaurant: [], wijnwinkel: [] };
  locs.forEach(l => { if (byType[l.type]) byType[l.type].push(l); });

  const renderSection = (type, items) => {
    if (!items.length) return '';
    return `<div class="region-section">
      <h2 class="region-section-title">${typeLabelsReg[type]}</h2>
      <div class="region-locs">
        ${items.map(l => `
          <div class="region-loc-card">
            ${l.image ? `<img src="${l.image}" alt="${l.title || l.name}" class="region-loc-img" loading="lazy">` : ''}
            <div class="region-loc-body">
              <div class="region-loc-name">${l.title || l.name}</div>
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
  <title>${region.name} Wijnreis | de_wijnparade</title>
  <meta name="description" content="${metaDesc.replace(/"/g,'&quot;')}">
  <meta property="og:title" content="${region.name} Wijnreis | de_wijnparade">
  <meta property="og:description" content="${metaDesc.replace(/"/g,'&quot;')}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="article">
  <link rel="canonical" href="${pageUrl}">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"TouristDestination","name":"${region.name}","description":"${region.description.replace(/"/g,'\\"')}","url":"${pageUrl}"}</script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <style>
    .region-hero{background:var(--navy);color:#fff;padding:3rem 0 2rem;text-align:center}
    .region-hero-emoji{font-size:3rem;margin-bottom:0.5rem}
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
    .region-section-title{font-size:1.3rem;font-weight:600;color:var(--navy);margin-bottom:1.25rem;padding-bottom:0.5rem;border-bottom:2px solid var(--gray-200)}
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
      <a href="/travelguides.html" class="instagram-profile-link">
        <img src="/profile-photo.jpg" alt="de_wijnparade" class="profile-photo-img">
        <span>← Reisgidsen</span>
      </a>
    </div>
  </header>

  <div class="region-hero">
    <div class="container">
      <div class="region-hero-emoji">${region.emoji}</div>
      <h1>${region.name}</h1>
      <div class="region-hero-country">${region.country}</div>
      <p class="region-hero-desc">${region.description}</p>
      <a href="/map.html?lat=${region.centerLat}&lng=${region.centerLng}&zoom=${region.zoom}" class="region-map-btn">
        🗺️ Bekijk op de kaart
      </a>
    </div>
  </div>

  <main class="main">
    <div class="container">
      <div class="region-stats">
        ${Object.entries(byType).filter(([,v])=>v.length).map(([t,v])=>`
          <div class="region-stat">
            <div class="region-stat-num">${v.length}</div>
            <div class="region-stat-label">${typeLabelsReg[t]}</div>
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
