let pairings = [];
let currentMode = 'wine-food'; // 'wine-food' or 'food-wine'

document.addEventListener('DOMContentLoaded', async function() {
    await loadPairings();
    setupToggle();
    renderPairings();
});

async function loadPairings() {
    try {
        const repoPath = 'jcjvanschijndel-dot/wijnparade';
        const apiUrl = `https://api.github.com/repos/${repoPath}/contents/content/pairings`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            showEmptyState();
            return;
        }
        
        const files = await response.json();
        
        if (!files || files.length === 0) {
            showEmptyState();
            return;
        }

        pairings = [];
        
        for (const file of files) {
            if (file.name.endsWith('.md')) {
                const contentResponse = await fetch(file.download_url);
                const content = await contentResponse.text();
                const parsed = parseFrontmatter(content);
                if (parsed) {
                    pairings.push(parsed);
                }
            }
        }

        if (pairings.length === 0) {
            showEmptyState();
        }

    } catch (error) {
        console.error('Error loading pairings:', error);
        showEmptyState();
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
    if (pairings.length === 0) {
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
    
    // Group data
    const grouped = groupPairings();
    
    // Render
    renderTable(grouped);
    renderCards(grouped);
}

function groupPairings() {
    const grouped = {};
    
    pairings.forEach(pairing => {
        if (currentMode === 'wine-food') {
            // Group by wine
            const wine = pairing.wine;
            if (!grouped[wine]) {
                grouped[wine] = [];
            }
            grouped[wine].push({
                name: pairing.dish,
                match: pairing.match_level
            });
        } else {
            // Group by dish
            const dish = pairing.dish;
            if (!grouped[dish]) {
                grouped[dish] = [];
            }
            grouped[dish].push({
                name: pairing.wine,
                match: pairing.match_level
            });
        }
    });
    
    // Sort alphabetically and sort matches within each group
    const sorted = {};
    Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'nl')).forEach(key => {
        // Sort matches: sublime > very-good > good, then alphabetically
        sorted[key] = grouped[key].sort((a, b) => {
            const matchOrder = { 'sublime': 0, 'very-good': 1, 'good': 2 };
            const matchDiff = (matchOrder[a.match] || 3) - (matchOrder[b.match] || 3);
            if (matchDiff !== 0) return matchDiff;
            return a.name.localeCompare(b.name, 'nl');
        });
    });
    
    return sorted;
}

function renderTable(grouped) {
    const tbody = document.getElementById('pairingsTableBody');
    
    tbody.innerHTML = Object.entries(grouped).map(([key, items]) => `
        <tr>
            <td>${key}</td>
            <td>
                <div class="match-items">
                    ${items.map(item => renderMatchItem(item)).join('')}
                </div>
            </td>
        </tr>
    `).join('');
}

function renderCards(grouped) {
    const container = document.getElementById('pairingsCards');
    
    container.innerHTML = Object.entries(grouped).map(([key, items]) => `
        <div class="pairing-card">
            <div class="pairing-card-header">${key}</div>
            <div class="pairing-card-items">
                ${items.map(item => renderMatchItem(item)).join('')}
            </div>
        </div>
    `).join('');
}

function renderMatchItem(item) {
    const matchClass = `match-${item.match}`;
    const separator = '<span style="color: var(--gray-300); margin: 0 0.25rem;">•</span>';
    
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

    frontmatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1);
            }
            
            data[key] = value;
        }
    });

    return data;
}