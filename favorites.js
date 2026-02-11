let allWines = [];
let filteredWines = [];
let currentSort = { field: 'name', ascending: true };

document.addEventListener('DOMContentLoaded', async function() {
    await loadWines();
    setupEventListeners();
});

async function loadWines() {
    try {
        const response = await fetch('/content/favorites/_index.json');
        
        if (!response.ok) {
            showEmptyState();
            return;
        }
        
        const wines = await response.json();
        
        if (!wines || wines.length === 0) {
            showEmptyState();
            return;
        }

        allWines = wines;

        // Populate region filter
        populateRegionFilter();
        
        // Initial display
        filteredWines = [...allWines];
        sortWines();
        renderWines();

    } catch (error) {
        console.error('Error loading wines:', error);
        showEmptyState();
    }
}

function populateRegionFilter() {
    const regions = [...new Set(allWines.map(w => w.region))].sort();
    const regionSelect = document.getElementById('filterRegion');
    
    regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
    });
}

function setupEventListeners() {
    // Filters
    document.getElementById('filterType').addEventListener('change', applyFilters);
    document.getElementById('filterRegion').addEventListener('change', applyFilters);
    document.getElementById('filterPrice').addEventListener('input', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    // Sort
    document.getElementById('sortBy').addEventListener('change', (e) => {
        currentSort.field = e.target.value;
        sortWines();
        renderWines();
    });
    
    document.getElementById('sortOrder').addEventListener('click', () => {
        currentSort.ascending = !currentSort.ascending;
        document.getElementById('sortOrder').classList.toggle('desc');
        sortWines();
        renderWines();
    });
    
    // Table header clicks
    document.querySelectorAll('.wines-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (currentSort.field === field) {
                currentSort.ascending = !currentSort.ascending;
            } else {
                currentSort.field = field;
                currentSort.ascending = true;
            }
            document.getElementById('sortBy').value = field;
            document.getElementById('sortOrder').classList.toggle('desc', !currentSort.ascending);
            sortWines();
            renderWines();
        });
    });
}

function applyFilters() {
    const typeFilter = document.getElementById('filterType').value;
    const regionFilter = document.getElementById('filterRegion').value;
    const priceFilter = document.getElementById('filterPrice').value;
    
    filteredWines = allWines.filter(wine => {
        if (typeFilter && wine.type !== typeFilter) return false;
        if (regionFilter && wine.region !== regionFilter) return false;
        if (priceFilter && wine.price > parseFloat(priceFilter)) return false;
        return true;
    });
    
    sortWines();
    renderWines();
}

function clearFilters() {
    document.getElementById('filterType').value = '';
    document.getElementById('filterRegion').value = '';
    document.getElementById('filterPrice').value = '';
    filteredWines = [...allWines];
    sortWines();
    renderWines();
}

function sortWines() {
    filteredWines.sort((a, b) => {
        let aVal = a[currentSort.field];
        let bVal = b[currentSort.field];
        
        if (currentSort.field === 'price') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
        } else {
            aVal = String(aVal || '').toLowerCase();
            bVal = String(bVal || '').toLowerCase();
        }
        
        if (aVal < bVal) return currentSort.ascending ? -1 : 1;
        if (aVal > bVal) return currentSort.ascending ? 1 : -1;
        return 0;
    });
}

function renderWines() {
    if (filteredWines.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    renderCards();
    renderTable();
}

function renderCards() {
    const container = document.getElementById('winesCards');
    
    container.innerHTML = filteredWines.map(wine => `
        <div class="wine-card">
            <div class="wine-card-header">
                <div>
                    <div class="wine-card-name">${wine.name}</div>
                    <div class="wine-card-producer">${wine.producer}</div>
                </div>
                <div class="wine-card-price">€${parseFloat(wine.price || 0).toFixed(2)}</div>
            </div>
            <div class="wine-card-meta">
                <span class="wine-card-tag">${wine.type}</span>
                <span class="wine-card-tag">${wine.region}</span>
            </div>
            <div class="wine-card-description">${wine.description}</div>
            <div class="wine-card-store">${wine.store}</div>
        </div>
    `).join('');
}

function renderTable() {
    const tbody = document.getElementById('winesTableBody');
    
    tbody.innerHTML = filteredWines.map(wine => `
        <tr>
            <td>${wine.name}</td>
            <td>${wine.producer}</td>
            <td>${wine.region}</td>
            <td><span class="wine-type-badge">${wine.type}</span></td>
            <td>${wine.description}</td>
            <td class="wine-price">€${parseFloat(wine.price || 0).toFixed(2)}</td>
            <td>${wine.store}</td>
        </tr>
    `).join('');
}

function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('winesCards').style.display = 'none';
    document.querySelector('.wines-table-wrapper').style.display = 'none';
}

function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('winesCards').style.display = '';
    document.querySelector('.wines-table-wrapper').style.display = '';
}
