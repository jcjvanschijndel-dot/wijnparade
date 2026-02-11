let winesPairings = [];
let dishesPairings = [];
let currentMode = 'food-wine';

document.addEventListener('DOMContentLoaded', async function() {
    await loadWinesPairings();
    await loadDishesPairings();
    setupToggle();
    renderPairings();
});

async function loadWinesPairings() {
    try {
        const response = await fetch('/content/wines-pairing/_index.json');
        
        if (!response.ok) {
            console.log('No wines pairings found');
            return;
        }
        
        const data = await response.json();
        winesPairings = data.filter(item => item.wine);

    } catch (error) {
        console.error('Error loading wines pairings:', error);
    }
}

async function loadDishesPairings() {
    try {
        const response = await fetch('/content/dishes-pairing/_index.json');
        
        if (!response.ok) {
            console.log('No dishes pairings found');
            return;
        }
        
        const data = await response.json();
        dishesPairings = data.filter(item => item.dish);

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
    
    const sorted = [...dataSource].sort((a, b) => {
        const keyA = currentMode === 'food-wine' ? a.dish : a.wine;
        const keyB = currentMode === 'food-wine' ? b.dish : b.wine;
        return keyA.localeCompare(keyB, 'nl');
    });
    
    renderTable(sorted);
    renderCards(sorted);
}

function renderTable(data) {
    const tbody = document.getElementById('pairingsTableBody');
    
    tbody.innerHTML = data.map(item => {
        const mainItem = currentMode === 'food-wine' ? item.dish : item.wine;
        const matchItems = currentMode === 'food-wine' ? item.wines : item.dishes;
        
        const sortedMatches = currentMode === 'food-wine' ? sortMatches(matchItems || []) : sortDishes(matchItems || []);
        
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
        
        const sortedMatches = currentMode === 'food-wine' ? sortMatches(matchItems || []) : sortDishes(matchItems || []);
        
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
    if (!Array.isArray(matches)) return [];
    return [...matches].sort((a, b) => {
        const starsA = parseInt(a.stars) || 0;
        const starsB = parseInt(b.stars) || 0;
        if (starsB !== starsA) return starsB - starsA;
        const nameA = (typeof a === 'string' ? a : a.name) || '';
        const nameB = (typeof b === 'string' ? b : b.name) || '';
        return nameA.localeCompare(nameB, 'nl');
    });
}

function sortDishes(dishes) {
    if (!Array.isArray(dishes)) return [];
    return [...dishes].sort((a, b) => {
        const nameA = (typeof a === 'string' ? a : a.dish || a.name) || '';
        const nameB = (typeof b === 'string' ? b : b.dish || b.name) || '';
        return nameA.localeCompare(nameB, 'nl');
    });
}

function renderMatchItem(item, showSeparator, mode) {
    if (mode === 'wine-food') {
        const dishName = typeof item === 'string' ? item : (item.dish || item.name || item);
        const separator = showSeparator ? ' <span style="color: var(--gray-300);">•</span> ' : '';
        return `<span>${dishName}</span>${separator}`;
    }
    
    const name = typeof item === 'string' ? item : (item.name || item);
    const stars = parseInt(item.stars) || 1;
    const starsHtml = '★'.repeat(stars);
    const matchClass = `match-stars-${stars}`;
    const separator = showSeparator ? ' <span style="color: var(--gray-300);">•</span> ' : '';
    
    return `<span class="${matchClass}">${name} <span class="stars">${starsHtml}</span></span>${separator}`;
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
