let winesPairings = [];
let dishesPairings = [];
let currentMode = 'food-wine'; // 'wine-food' or 'food-wine'

document.addEventListener('DOMContentLoaded', async function() {
    await loadWinesPairings();
    await loadDishesPairings();
    setupToggle();
    renderPairings();
});

async function loadWinesPairings() {
    try {
        const repoPath = 'jcjvanschijndel-dot/de-wijnparade';
        const apiUrl = `https://api.github.com/repos/${repoPath}/contents/content/wines-pairing`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            console.log('No wines pairings found');
            return;
        }
        
        const files = await response.json();
        
        if (!files || files.length === 0) {
            return;
        }

        winesPairings = [];
        
        for (const file of files) {
            if (file.name.endsWith('.md')) {
                const contentResponse = await fetch(file.download_url);
                const content = await contentResponse.text();
                const parsed = parseFrontmatter(content);
                if (parsed && parsed.wine) {
                    winesPairings.push(parsed);
                }
            }
        }

    } catch (error) {
        console.error('Error loading wines pairings:', error);
    }
}

async function loadDishesPairings() {
    try {
        const repoPath = 'jcjvanschijndel-dot/de-wijnparade';
        
        // Try new location first
        let apiUrl = `https://api.github.com/repos/${repoPath}/contents/content/dishes-pairing`;
        let response = await fetch(apiUrl);
        
        // If not found, try old location for backwards compatibility
        if (!response.ok) {
            console.log('Trying old pairings location...');
            apiUrl = `https://api.github.com/repos/${repoPath}/contents/content/pairings`;
            response = await fetch(apiUrl);
        }
        
        if (!response.ok) {
            console.log('No dishes pairings found');
            return;
        }
        
        const files = await response.json();
        
        if (!files || files.length === 0) {
            return;
        }

        dishesPairings = [];
        
        for (const file of files) {
            if (file.name.endsWith('.md')) {
                const contentResponse = await fetch(file.download_url);
                const content = await contentResponse.text();
                const parsed = parseFrontmatter(content);
                if (parsed && parsed.dish) {
                    dishesPairings.push(parsed);
                }
            }
        }

    } catch (error) {
        console.error('Error loading dishes pairings:', error);
    }
}

function setupToggle() {
    document.getElementById('toggleWineFood').addEventListener('click', () => {
        currentMode = 'wine-food';
        updateToggleState();
        renderPairings();
    });
    
    document.getElementById('toggleFoodWine').addEventListener('click', () => {
        currentMode = 'food-wine';
        updateToggleState();
        renderPairings();
    });
}

function updateToggleState() {
    const wineFoodBtn = document.getElementById('toggleWineFood');
    const foodWineBtn = document.getElementById('toggleFoodWine');
    
    if (currentMode === 'food-wine') {
        foodWineBtn.classList.add('active');
        wineFoodBtn.classList.remove('active');
    } else {
        wineFoodBtn.classList.add('active');
        foodWineBtn.classList.remove('active');
    }
}

function renderPairings() {
    const dataSource = currentMode === 'food-wine' ? dishesPairings : winesPairings;
    
    if (dataSource.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    // Update table headers
    const tableHeader = document.getElementById('tableHeader');
    if (currentMode === 'food-wine') {
        tableHeader.innerHTML = `
            <th>Gerecht/Ingrediënt</th>
            <th>Wijnen</th>
        `;
    } else {
        tableHeader.innerHTML = `
            <th>Wijn</th>
            <th>Gerechten</th>
        `;
    }
    
    // Sort alphabetically
    const sorted = [...dataSource].sort((a, b) => {
        const keyA = currentMode === 'food-wine' ? a.dish : a.wine;
        const keyB = currentMode === 'food-wine' ? b.dish : b.wine;
        return keyA.localeCompare(keyB, 'nl');
    });
    
    // Render
    renderTable(sorted);
    renderCards(sorted);
}

function renderTable(data) {
    const tbody = document.getElementById('pairingsTableBody');
    
    tbody.innerHTML = data.map(item => {
        const mainItem = currentMode === 'food-wine' ? item.dish : item.wine;
        const matchItems = currentMode === 'food-wine' ? item.wines : item.dishes;
        
        const sortedMatches = currentMode === 'food-wine' ? sortMatches(matchItems || []) : (matchItems || []).sort();
        
        return `
            <tr>
                <td>${mainItem}</td>
                <td>
                    ${sortedMatches.map((match, idx) => 
                        renderMatchItem(match, idx < sortedMatches.length - 1, currentMode)
                    ).join('')}
                </td>
            </tr>
        `;
    }).join('');
}

function renderCards(data) {
    const container = document.getElementById('pairingsCards');
    
    container.innerHTML = data.map(item => {
        const mainItem = currentMode === 'food-wine' ? item.dish : item.wine;
        const matchItems = currentMode === 'food-wine' ? item.wines : item.dishes;
        
        const sortedMatches = currentMode === 'food-wine' ? sortMatches(matchItems || []) : (matchItems || []).sort();
        
        return `
            <div class="wine-card">
                <div class="wine-card-header">
                    <div class="wine-card-name">${mainItem}</div>
                </div>
                <div class="wine-card-description">
                    ${sortedMatches.map((match, idx) => 
                        renderMatchItem(match, idx < sortedMatches.length - 1, currentMode)
                    ).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function sortMatches(matches) {
    return matches.sort((a, b) => {
        // Sort by stars (3 > 2 > 1), then alphabetically
        const starsA = parseInt(a.stars) || 0;
        const starsB = parseInt(b.stars) || 0;
        
        if (starsB !== starsA) return starsB - starsA; // Descending
        return a.name.localeCompare(b.name, 'nl');
    });
}

function renderMatchItem(item, showSeparator, mode) {
    // For wine-food mode: simple string
    if (mode === 'wine-food') {
        const dishName = typeof item === 'string' ? item : item.name || item;
        const separator = showSeparator ? ' <span style="color: var(--gray-300);">•</span> ' : '';
        return `<span>${dishName}</span>${separator}`;
    }
    
    // For food-wine mode: object with stars
    const stars = parseInt(item.stars) || 1;
    const starsHtml = '★'.repeat(stars);
    const matchClass = `match-stars-${stars}`;
    const separator = showSeparator ? ' <span style="color: var(--gray-300);">•</span> ' : '';
    
    return `<span class="${matchClass}">${item.name} <span class="stars">${starsHtml}</span></span>${separator}`;
}

function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('pairingsCards').style.display = 'none';
    document.querySelector('.wines-table-wrapper').style.display = 'none';
}

function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('pairingsCards').style.display = '';
    document.querySelector('.wines-table-wrapper').style.display = '';
}

function parseFrontmatter(content) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter = match[1];
    const data = {};
    let currentKey = null;
    let currentList = [];
    let currentObject = {};
    let inList = false;

    frontmatter.split('\n').forEach(line => {
        const trimmed = line.trim();
        const indent = line.search(/\S/);
        
        // List item start
        if (trimmed.startsWith('- ')) {
            if (!inList) {
                inList = true;
                currentList = [];
            }
            
            // Check if it's a simple list or object list
            const afterDash = trimmed.substring(2).trim();
            if (afterDash.includes(':')) {
                // Object in list - save previous if exists
                if (Object.keys(currentObject).length > 0) {
                    currentList.push({...currentObject});
                    currentObject = {};
                }
                // Start new object
                const [key, value] = afterDash.split(':').map(s => s.trim());
                currentObject[key] = value.replace(/^["']|["']$/g, '');
            } else {
                // Simple list item
                currentList.push(afterDash);
            }
        }
        // Object property within list
        else if (inList && indent > 2 && trimmed.includes(':')) {
            const [key, value] = trimmed.split(':').map(s => s.trim());
            currentObject[key] = value.replace(/^["']|["']$/g, '');
        }
        // Regular key-value
        else if (trimmed.includes(':') && !inList) {
            // Save previous list if exists
            if (currentKey && currentList.length > 0) {
                if (Object.keys(currentObject).length > 0) {
                    currentList.push({...currentObject});
                }
                data[currentKey] = currentList;
                currentList = [];
                currentObject = {};
                inList = false;
            }
            
            const colonIndex = trimmed.indexOf(':');
            currentKey = trimmed.substring(0, colonIndex).trim();
            let value = trimmed.substring(colonIndex + 1).trim();
            
            if (value) {
                value = value.replace(/^["']|["']$/g, '');
                if (!isNaN(value) && value !== '') {
                    value = Number(value);
                }
                data[currentKey] = value;
                currentKey = null;
            }
        }
    });
    
    // Save last list if exists
    if (currentKey && (currentList.length > 0 || Object.keys(currentObject).length > 0)) {
        if (Object.keys(currentObject).length > 0) {
            currentList.push({...currentObject});
        }
        data[currentKey] = currentList;
    }

    return data;
}
