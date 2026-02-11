let allWines = [];
let filteredWines = [];
let currentSort = { field: 'value_score', ascending: false };

document.addEventListener('DOMContentLoaded', async function() {
    await loadIntroText();
    await loadWines();
    setupEventListeners();
});

async function loadIntroText() {
    try {
        const response = await fetch('/content/value-score-intro.json');
        if (response.ok) {
            const data = await response.json();
            const introEl = document.getElementById('pageIntro');
            if (introEl && data.intro) {
                introEl.innerHTML = `<p>${data.intro}</p>`;
            }
        }
    } catch (error) {
        console.log('No intro text configured');
        const el = document.getElementById('pageIntro');
        if (el) el.style.display = 'none';
    }
}

async function loadWines() {
    try {
        const response = await fetch('/content/value-scores/_index.json');
        
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

        // Populate filters
        populateFilters();
        
        // Initial display
        filteredWines = [...allWines];
        sortWines();
        renderWines();

    } catch (error) {
        console.error('Error loading wines:', error);
        showEmptyState();
    }
}

function populateFilters() {
    const regions = [...new Set(allWines.map(w => w.region))].filter(Boolean).sort();
    const regionSelect = document.getElementById('filterRegion');
    regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
    });
    
    const countries = [...new Set(allWines.map(w => w.country))].filter(Boolean).sort();
    const countrySelect = document.getElementById('filterCountry');
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countrySelect.appendChild(option);
    });
}

function setupEventListeners() {
    document.getElementById('filterColor').addEventListener('change', applyFilters);
    document.getElementById('filterRegion').addEventListener('change', applyFilters);
    document.getElementById('filterCountry').addEventListener('change', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    document.getElementById('sortBy').addEventListener('change', (e) => {
        currentSort.field = e.target.value;
        sortWines();
        renderWines();
    });
    
    document.getElementById('sortOrder').addEventListener('click', () => {
        currentSort.ascending = !currentSort.ascending;
        document.getElementById('sortOrder').textContent = currentSort.ascending ? '↑' : '↓';
        sortWines();
        renderWines();
    });
    
    document.querySelectorAll('.wines-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (currentSort.field === field) {
                currentSort.ascending = !currentSort.ascending;
            } else {
                currentSort.field = field;
                currentSort.ascending = field === 'value_score' ? false : true;
            }
            document.getElementById('sortBy').value = field;
            document.getElementById('sortOrder').textContent = currentSort.ascending ? '↑' : '↓';
            sortWines();
            renderWines();
        });
    });
}

function applyFilters() {
    const colorFilter = document.getElementById('filterColor').value;
    const regionFilter = document.getElementById('filterRegion').value;
    const countryFilter = document.getElementById('filterCountry').value;
    
    filteredWines = allWines.filter(wine => {
        if (colorFilter && wine.color !== colorFilter) return false;
        if (regionFilter && wine.region !== regionFilter) return false;
        if (countryFilter && wine.country !== countryFilter) return false;
        return true;
    });
    
    sortWines();
    renderWines();
}

function clearFilters() {
    document.getElementById('filterColor').value = '';
    document.getElementById('filterRegion').value = '';
    document.getElementById('filterCountry').value = '';
    filteredWines = [...allWines];
    sortWines();
    renderWines();
}

function sortWines() {
    filteredWines.sort((a, b) => {
        let aVal = a[currentSort.field];
        let bVal = b[currentSort.field];
        
        if (currentSort.field === 'price' || currentSort.field === 'rating' || currentSort.field === 'value_score') {
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
                <span class="wine-card-tag">${wine.color}</span>
                <span class="wine-card-tag">${wine.region}</span>
                <span class="wine-card-tag">${wine.country}</span>
            </div>
            <div class="wine-card-meta">
                <span style="color: var(--gray-600); font-size: 0.85rem;">Value Score:</span>
                <span class="value-score-inline">${parseInt(wine.value_score || 0)}</span>
            </div>
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
            <td>${wine.country}</td>
            <td><span class="wine-type-badge">${wine.color}</span></td>
            <td class="wine-price">€${parseFloat(wine.price || 0).toFixed(2)}</td>
            <td><strong>${parseInt(wine.value_score || 0)}</strong></td>
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
