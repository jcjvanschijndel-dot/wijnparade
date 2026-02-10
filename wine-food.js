let winesPairings = [];
let dishesPairings = [];
let currentMode = 'wine-food'; // 'wine-food' or 'food-wine'

document.addEventListener('DOMContentLoaded', async function() {
    await loadWinesPairings();
    await loadDishesPairings();
    setupToggle();
    renderPairings();
});

async function loadWinesPairings() {
    try {
        const repoPath = 'jcjvanschijndel-dot/wijnparade';
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
        const repoPath = 'jcjvanschijndel-dot/wijnparade';
        const apiUrl = `https://api.github.com/repos/${repoPath}/contents/content/dishes-pairing`;
        
        const response = await fetch(apiUrl);
        
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
    
    if (currentMode === 'wine-food') {
        wineFoodBtn.classList.add('active');
        foodWineBtn.classList.remove('active');
    } else {
        wineFoodBtn.classList.remove('active');
        foodWineBtn.classList.add('active');
    }
}

function renderPairings() {
    const dataSource = currentMode === 'wine-food' ? winesPairings : dishesPairings;
    
    if (dataSource.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    // Update table headers
    const tableHeader = document.getElementById('tableHeader');
    if (currentMode === 'wine-food') {
        tableHeader.innerHTML = `
            <th>Wijn</th>
            <th>Gerechten</th>
        `;
    } else {
        tableHeader.innerHTML = `
            <th>Gerecht/Ingrediënt</th>
            <th>Wijnen</th>
        `;
    }
    
    // Sort alphabetically
    const sorted = [...dataSource].sort((a, b) => {
        const keyA = currentMode === 'wine-food' ? a.wine : a.dish;
        const keyB = currentMode === 'wine-food' ? b.wine : b.dish;
        return keyA.localeCompare(keyB, 'nl');
    });
    
    // Render
    renderTable(sorted);
    renderCards(sorted);
}

function renderTable(data) {
    const tbody = document.getElementById('pairingsTableBody');
    
    tbody.innerHTML = data.map(item => {
        const mainItem = currentMode === 'wine-food' ? item.wine : item.dish;
        const matchItems = currentMode === 'wine-food' ? item.dishes : item.wines;
        
        // Sort match items: sublime > very-good > good, then alphabetically
        const sortedMatches = sortMatches(matchItems || []);
        
        return `
            <tr>
                <td>${mainItem}</td>
                <td>
                    <div class="match-items">
                        ${sortedMatches.map((match, idx) => 
                            renderMatchItem(match, idx < sortedMatches.length - 1)
                        ).join('')}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderCards(data) {
    const container = document.getElementById('pairingsCards');
    
    container.innerHTML = data.map(item => {
        const mainItem = currentMode === 'wine-food' ? item.wine : item.dish;
        const matchItems = currentMode === 'wine-food' ? item.dishes : item.wines;
        
        const sortedMatches = sortMatches(matchItems || []);
        
        return `
            <div class="pairing-card">
                <div class="pairing-card-header">${mainItem}</div>
                <div class="pairing-card-items">
                    ${sortedMatches.map((match, idx) => 
                        renderMatchItem(match, idx < sortedMatches.length - 1)
                    ).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function sortMatches(matches) {
    const matchOrder = { 'sublime': 0, 'very-good': 1, 'good': 2 };
    return matches.sort((a, b) => {
        const matchDiff = (matchOrder[a.match_level] || 3) - (matchOrder[b.match_level] || 3);
        if (matchDiff !== 0) return matchDiff;
        return a.name.localeCompare(b.name, 'nl');
    });
}

function renderMatchItem(item, showSeparator) {
    const matchClass = `match-${item.match_level}`;
    const separator = showSeparator ? '<span style="color: var(--gray-300); margin: 0 0.25rem;">•</span>' : '';
    
    return `<span class="match-item ${matchClass}">${item.name}</span>${separator}`;
}

function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('pairingsCards').style.display = 'none';
    document.querySelector('.pairings-table-wrapper').style.display = 'none';
}

function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('pairingsCards').style.display = '';
    document.querySelector('.pairings-table-wrapper').style.display = '';
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
    let indentLevel = 0;

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