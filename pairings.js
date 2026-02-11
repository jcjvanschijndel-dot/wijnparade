// Load pairings from CMS
document.addEventListener('DOMContentLoaded', async function() {
    const container = document.getElementById('pairingsContainer');
    
    if (!container) return;

    try {
        const repoPath = 'jcjvanschijndel-dot/wijnparade';
        
        // Load both dishes-pairing and wines-pairing
        const [dishesData, winesData] = await Promise.all([
            loadCollection(repoPath, 'dishes-pairing'),
            loadCollection(repoPath, 'wines-pairing')
        ]);

        const allItems = [];

        // Process dishes with wines
        for (const item of dishesData) {
            const wines = parseList(item, 'wines');
            const wineNames = wines.map(w => w.name || w).filter(Boolean);
            allItems.push({
                id: item._id,
                title: item.dish,
                type: 'dish',
                subtitle: wineNames.length > 0 ? wineNames.join(', ') : 'Diverse wijnen',
                wines: wines
            });
        }

        // Process wines with dishes
        for (const item of winesData) {
            const dishes = parseList(item, 'dishes');
            const dishNames = dishes.map(d => d.dish || d).filter(Boolean);
            allItems.push({
                id: item._id,
                title: item.wine,
                type: 'wine',
                subtitle: dishNames.length > 0 ? dishNames.join(', ') : 'Diverse gerechten',
                dishes: dishes
            });
        }

        if (allItems.length > 0) {
            container.innerHTML = allItems.map(item => {
                const icon = item.type === 'dish' ? '🍽️' : '🍷';
                const label = item.type === 'dish' ? 'Gerecht' : 'Wijn';
                const pairingLabel = item.type === 'dish' ? '🍷' : '🍽️';
                
                // Build star display for dishes with wines
                let pairingHtml = '';
                if (item.type === 'dish' && item.wines && item.wines.length > 0) {
                    pairingHtml = item.wines.map(w => {
                        const name = w.name || w;
                        const stars = w.stars ? '⭐'.repeat(parseInt(w.stars)) : '';
                        return `<span style="display: block; font-size: 0.85rem; color: #4b5563; margin-top: 0.25rem;">${pairingLabel} ${name} ${stars}</span>`;
                    }).join('');
                } else if (item.type === 'wine' && item.dishes && item.dishes.length > 0) {
                    pairingHtml = item.dishes.map(d => {
                        const name = d.dish || d;
                        return `<span style="display: block; font-size: 0.85rem; color: #4b5563; margin-top: 0.25rem;">${pairingLabel} ${name}</span>`;
                    }).join('');
                }

                return `
                    <div class="pairing-card">
                        <div class="pairing-content">
                            <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 500;">${icon} ${label}</span>
                            <h3 class="pairing-title">${item.title}</h3>
                            ${pairingHtml}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #6b7280; grid-column: 1/-1;">
                    <p>Nog geen pairings toegevoegd.</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Voeg gerechten of wijnen toe via het CMS (/admin)</p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading pairings:', error);
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #6b7280; grid-column: 1/-1;">
                <p>Kon pairings niet laden.</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Probeer de pagina te verversen.</p>
            </div>
        `;
    }
});

async function loadCollection(repoPath, folder) {
    try {
        const apiUrl = `https://api.github.com/repos/${repoPath}/contents/content/${folder}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) return [];
        
        const files = await response.json();
        if (!files || files.length === 0) return [];

        const items = [];
        
        for (const file of files) {
            if (file.name.endsWith('.md')) {
                const contentResponse = await fetch(file.download_url);
                const content = await contentResponse.text();
                const parsed = parseFrontmatter(content);
                if (parsed) {
                    parsed._id = file.name.replace('.md', '');
                    items.push(parsed);
                }
            }
        }
        
        return items;
    } catch (error) {
        console.error(`Error loading ${folder}:`, error);
        return [];
    }
}

function parseList(data, key) {
    const value = data[key];
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [];
}

function parseFrontmatter(content) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter = match[1];
    const data = {};
    const lines = frontmatter.split('\n');
    
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const colonIndex = line.indexOf(':');
        
        if (colonIndex > -1 && !line.startsWith('  ') && !line.startsWith('-')) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            // Check if next lines are a list
            if (value === '' && i + 1 < lines.length && lines[i + 1].trim().startsWith('-')) {
                const listItems = [];
                i++;
                while (i < lines.length && (lines[i].trim().startsWith('-') || lines[i].startsWith('    '))) {
                    const trimmed = lines[i].trim();
                    if (trimmed.startsWith('- ')) {
                        // Could be a simple list item or start of an object
                        const itemContent = trimmed.substring(2);
                        if (itemContent.includes(':')) {
                            // Object item - parse key:value pairs
                            const obj = {};
                            const firstColonIdx = itemContent.indexOf(':');
                            const objKey = itemContent.substring(0, firstColonIdx).trim();
                            let objVal = itemContent.substring(firstColonIdx + 1).trim();
                            objVal = stripQuotes(objVal);
                            obj[objKey] = objVal;
                            
                            // Check for more properties on following indented lines
                            i++;
                            while (i < lines.length && lines[i].startsWith('    ') && !lines[i].trim().startsWith('-')) {
                                const propLine = lines[i].trim();
                                const propColonIdx = propLine.indexOf(':');
                                if (propColonIdx > -1) {
                                    const propKey = propLine.substring(0, propColonIdx).trim();
                                    let propVal = propLine.substring(propColonIdx + 1).trim();
                                    propVal = stripQuotes(propVal);
                                    obj[propKey] = propVal;
                                }
                                i++;
                            }
                            listItems.push(obj);
                            continue;
                        } else {
                            listItems.push(stripQuotes(itemContent));
                        }
                    }
                    i++;
                }
                data[key] = listItems;
                continue;
            } else {
                // Simple value
                value = stripQuotes(value);
                if (!isNaN(value) && value !== '') {
                    value = Number(value);
                }
                data[key] = value;
            }
        }
        i++;
    }

    return data;
}

function stripQuotes(str) {
    if (!str) return str;
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
        return str.slice(1, -1);
    }
    return str;
}
