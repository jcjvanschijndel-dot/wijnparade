// ============================================================
// CONFIGURATIE - Plak hier je Google Sheets CSV-link
// ============================================================
// Stap 1: Open je Google Sheet
// Stap 2: Bestand → Delen → Publiceren op internet
// Stap 3: Kies "Kommagescheiden waarden (.csv)" en klik Publiceren
// Stap 4: Plak de URL hieronder
//
// Je sheet moet deze kolommen hebben (eerste rij = headers):
// Naam | Producent | Gebied | Land | Kleur | Prijs | Value Score | Gem. Rating
// ============================================================
const GOOGLE_SHEET_CSV_URL = 'PLAK_HIER_JE_GOOGLE_SHEETS_CSV_URL';
// ============================================================

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
        // Check if Google Sheets URL is configured
        if (!GOOGLE_SHEET_CSV_URL || GOOGLE_SHEET_CSV_URL === 'PLAK_HIER_JE_GOOGLE_SHEETS_CSV_URL') {
            console.warn('Google Sheets URL niet ingesteld in value-score.js');
            // Fallback to CMS data
            return await loadWinesFromCMS();
        }

        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        
        if (!response.ok) {
            console.error('Kon Google Sheet niet laden, fallback naar CMS');
            return await loadWinesFromCMS();
        }
        
        const csvText = await response.text();
        const rows = parseCSV(csvText);
        
        if (rows.length < 2) {
            showEmptyState();
            return;
        }

        // First row = headers
        const headers = rows[0].map(h => h.trim().toLowerCase());
        console.log('Sheet headers:', headers);
        console.log('Total rows:', rows.length);
        
        // Map headers to our fields
        const colMap = {
            name: findCol(headers, ['naam', 'name']),
            producer: findCol(headers, ['producent', 'producer']),
            region: findCol(headers, ['gebied', 'region', 'regio']),
            country: findCol(headers, ['land', 'country']),
            color: findCol(headers, ['kleur', 'color', 'type']),
            price: findCol(headers, ['prijs', 'price']),
            value_score: findCol(headers, ['value score', 'valuescore', 'value_score', 'score']),
            rating: findCol(headers, ['gem. rating', 'gem rating', 'gemiddelde rating', 'rating', 'avg rating'])
        };
        console.log('Column mapping:', colMap);

        allWines = [];
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0 || row.every(cell => cell.trim() === '')) continue;
            
            const rawColor = getCell(row, colMap.color);
            const wine = {
                name: getCell(row, colMap.name),
                producer: getCell(row, colMap.producer),
                region: getCell(row, colMap.region),
                country: getCell(row, colMap.country),
                color: rawColor ? rawColor.charAt(0).toUpperCase() + rawColor.slice(1).toLowerCase() : '',
                price: parseNumber(getCell(row, colMap.price)),
                value_score: parseNumber(getCell(row, colMap.value_score)),
                rating: parseNumber(getCell(row, colMap.rating))
            };
            
            // Skip rows without a name
            if (wine.name) {
                allWines.push(wine);
            }
        }

        console.log('Wines loaded:', allWines.length);
        if (allWines.length > 0) console.log('First wine:', allWines[0]);

        if (allWines.length === 0) {
            showEmptyState();
            return;
        }

        populateFilters();
        filteredWines = [...allWines];
        sortWines();
        renderWines();

    } catch (error) {
        console.error('Error loading from Google Sheets:', error);
        await loadWinesFromCMS();
    }
}

// Fallback: load from CMS _index.json
async function loadWinesFromCMS() {
    try {
        const response = await fetch('/content/value-scores/_index.json');
        if (!response.ok) { showEmptyState(); return; }
        
        const wines = await response.json();
        if (!wines || wines.length === 0) { showEmptyState(); return; }

        allWines = wines.map(w => ({
            ...w,
            price: parseFloat(w.price) || 0,
            value_score: parseFloat(w.value_score) || 0,
            rating: parseFloat(w.rating) || 0
        }));

        populateFilters();
        filteredWines = [...allWines];
        sortWines();
        renderWines();
    } catch (error) {
        console.error('Error loading wines:', error);
        showEmptyState();
    }
}

// CSV parser that auto-detects delimiter (comma or semicolon)
function parseCSV(text) {
    // Auto-detect delimiter: check first line for semicolons vs commas
    const firstLine = text.split('\n')[0];
    const semicolons = (firstLine.match(/;/g) || []).length;
    const commas = (firstLine.match(/,/g) || []).length;
    const delimiter = semicolons > commas ? ';' : ',';
    
    console.log(`CSV delimiter detected: "${delimiter}"`);
    
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        
        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                currentField += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === delimiter) {
                currentRow.push(currentField);
                currentField = '';
            } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
                currentRow.push(currentField);
                currentField = '';
                if (currentRow.length > 0) rows.push(currentRow);
                currentRow = [];
                if (char === '\r') i++;
            } else {
                currentField += char;
            }
        }
    }
    
    // Last field/row
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }
    
    return rows;
}

function findCol(headers, names) {
    for (const name of names) {
        const idx = headers.indexOf(name);
        if (idx !== -1) return idx;
    }
    return -1;
}

function getCell(row, colIndex) {
    if (colIndex < 0 || colIndex >= row.length) return '';
    return (row[colIndex] || '').trim();
}

function parseNumber(str) {
    if (!str) return 0;
    // Handle comma as decimal separator (Dutch format)
    const cleaned = str.replace(/[€\s]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function populateFilters() {
    const regions = [...new Set(allWines.map(w => w.region))].filter(Boolean).sort();
    const regionSelect = document.getElementById('filterRegion');
    // Clear existing options except first
    regionSelect.innerHTML = '<option value="">Alle</option>';
    regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
    });
    
    const countries = [...new Set(allWines.map(w => w.country))].filter(Boolean).sort();
    const countrySelect = document.getElementById('filterCountry');
    countrySelect.innerHTML = '<option value="">Alle</option>';
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
                currentSort.ascending = (field === 'value_score' || field === 'rating') ? false : true;
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
        
        if (['price', 'rating', 'value_score'].includes(currentSort.field)) {
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
                <div class="wine-card-price">€${wine.price.toFixed(2)}</div>
            </div>
            <div class="wine-card-meta">
                <span class="wine-card-tag">${wine.color}</span>
                <span class="wine-card-tag">${wine.region}</span>
                <span class="wine-card-tag">${wine.country}</span>
            </div>
            <div class="wine-card-meta" style="margin-top: 0.5rem;">
                ${wine.rating ? `<span style="color: var(--gray-600); font-size: 0.85rem;">Gem. Rating: <strong>${wine.rating}</strong></span>` : ''}
                <span style="color: var(--gray-600); font-size: 0.85rem;">Value Score:</span>
                <span class="value-score-inline">${wine.value_score}</span>
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
            <td>${wine.rating || '—'}</td>
            <td class="wine-price">€${wine.price.toFixed(2)}</td>
            <td><strong>${wine.value_score}</strong></td>
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
