// ============================================================
// CONFIGURATIE - Plak hier je Google Sheets CSV-link
// ============================================================
// Je sheet moet deze kolommen hebben (eerste rij = headers):
// Naam | Producent | Land | Gebied | Kleur | Omschrijving | Beschikbaar | Prijs
// ============================================================
const SHOP_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRiNczSnAUOxSJ6YUCy5wocv8CI7Ic5MWei2KZoEaBJk8iAfiixA04RnvxMPr6n8stYFpqELKELYBW5/pub?output=csv';
// ============================================================

let allWines = [];
let filteredWines = [];
let currentSort = { field: 'originalIndex', ascending: true };

document.addEventListener('DOMContentLoaded', async function() {
    await loadWines();
    setupEventListeners();
    setupModal();
});

async function loadWines() {
    try {
        if (!SHOP_SHEET_CSV_URL || SHOP_SHEET_CSV_URL === 'PLAK_HIER_JE_GOOGLE_SHEETS_CSV_URL') {
            console.warn('Google Sheets URL niet ingesteld in shop.js');
            showEmptyState();
            return;
        }

        const response = await fetch(SHOP_SHEET_CSV_URL);
        if (!response.ok) { showEmptyState(); return; }
        
        const csvText = await response.text();
        const rows = parseCSV(csvText);
        
        if (rows.length < 2) { showEmptyState(); return; }

        const headers = rows[0].map(h => h.trim().toLowerCase());

        const colMap = {
            name: findCol(headers, ['naam', 'name']),
            producer: findCol(headers, ['producent', 'producer']),
            country: findCol(headers, ['land', 'country']),
            region: findCol(headers, ['gebied', 'region', 'regio']),
            color: findCol(headers, ['kleur', 'color', 'type']),
            rating: findCol(headers, ['omschrijving', 'description', 'beschrijving']),
            available: findCol(headers, ['beschikbaar', 'available', 'aantal', 'flessen', 'voorraad']),
            price: findCol(headers, ['prijs', 'price'])
        };

        allWines = [];
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0 || row.every(cell => cell.trim() === '')) continue;
            
            const rawColor = getCell(row, colMap.color);
            const rawAvailable = getCell(row, colMap.available);
            const isComingSoon = rawAvailable.toLowerCase().replace(/\s/g, '') === 'comingsoon';
            const wine = {
                name: getCell(row, colMap.name),
                producer: getCell(row, colMap.producer),
                country: getCell(row, colMap.country),
                region: getCell(row, colMap.region),
                color: rawColor ? rawColor.charAt(0).toUpperCase() + rawColor.slice(1).toLowerCase() : '',
                rating: getCell(row, colMap.rating),
                available: isComingSoon ? 'coming-soon' : (parseInt(rawAvailable) || 0),
                price: parseNumber(getCell(row, colMap.price)),
                originalIndex: i - 1
            };
            
            if (wine.name) allWines.push(wine);
        }

        if (allWines.length === 0) { showEmptyState(); return; }

        populateFilters();
        filteredWines = [...allWines];
        sortWines();
        renderWines();

    } catch (error) {
        console.error('Error loading wines:', error);
        showEmptyState();
    }
}

// CSV parser with auto-detect delimiter
function parseCSV(text) {
    const firstLine = text.split('\n')[0];
    const semicolons = (firstLine.match(/;/g) || []).length;
    const commas = (firstLine.match(/,/g) || []).length;
    const delimiter = semicolons > commas ? ';' : ',';
    
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        
        if (inQuotes) {
            if (char === '"' && nextChar === '"') { currentField += '"'; i++; }
            else if (char === '"') { inQuotes = false; }
            else { currentField += char; }
        } else {
            if (char === '"') { inQuotes = true; }
            else if (char === delimiter) { currentRow.push(currentField); currentField = ''; }
            else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
                currentRow.push(currentField); currentField = '';
                if (currentRow.length > 0) rows.push(currentRow);
                currentRow = [];
                if (char === '\r') i++;
            } else { currentField += char; }
        }
    }
    if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
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
    const cleaned = str.replace(/[€\s]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function populateFilters() {
    const countries = [...new Set(allWines.map(w => w.country))].filter(Boolean).sort();
    const countrySelect = document.getElementById('filterCountry');
    countrySelect.innerHTML = '<option value="">Alle</option>';
    countries.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        countrySelect.appendChild(opt);
    });
}

function setupEventListeners() {
    document.getElementById('filterColor').addEventListener('change', applyFilters);
    document.getElementById('filterCountry').addEventListener('change', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    document.getElementById('sortBy').addEventListener('change', (e) => {
        currentSort.field = e.target.value;
        sortWines(); renderWines();
    });
    
    document.getElementById('sortOrder').addEventListener('click', () => {
        currentSort.ascending = !currentSort.ascending;
        document.getElementById('sortOrder').textContent = currentSort.ascending ? '↑' : '↓';
        sortWines(); renderWines();
    });
    
    document.querySelectorAll('.shop-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (currentSort.field === field) {
                currentSort.ascending = !currentSort.ascending;
            } else {
                currentSort.field = field;
                currentSort.ascending = ['price', 'available'].includes(field) ? false : true;
            }
            document.getElementById('sortBy').value = field;
            document.getElementById('sortOrder').textContent = currentSort.ascending ? '↑' : '↓';
            sortWines(); renderWines();
        });
    });
}

function applyFilters() {
    const colorFilter = document.getElementById('filterColor').value;
    const countryFilter = document.getElementById('filterCountry').value;
    
    filteredWines = allWines.filter(wine => {
        if (colorFilter && wine.color !== colorFilter) return false;
        if (countryFilter && wine.country !== countryFilter) return false;
        return true;
    });
    
    sortWines(); renderWines();
}

function clearFilters() {
    document.getElementById('filterColor').value = '';
    document.getElementById('filterCountry').value = '';
    filteredWines = [...allWines];
    sortWines(); renderWines();
}

function sortWines() {
    filteredWines.sort((a, b) => {
        let aVal = a[currentSort.field];
        let bVal = b[currentSort.field];
        
        if (['price', 'available', 'originalIndex'].includes(currentSort.field)) {
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
    if (filteredWines.length === 0) { showEmptyState(); return; }
    hideEmptyState();
    renderCards();
    renderTable();
}

function getStockClass(available) {
    if (available === 'coming-soon') return 'stock-soon';
    if (available <= 0) return 'stock-out';
    if (available <= 3) return 'stock-low';
    return 'stock-available';
}

function getStockText(available) {
    if (available === 'coming-soon') return 'Coming soon';
    if (available <= 0) return 'Uitverkocht';
    return `${available} flessen`;
}

function renderCards() {
    const container = document.getElementById('shopCards');
    
    container.innerHTML = filteredWines.map((wine, idx) => `
        <div class="shop-card">
            <div class="shop-card-header">
                <div>
                    <div class="shop-card-name">${wine.name}</div>
                    <div class="shop-card-producer">${wine.producer}</div>
                </div>
                <div class="shop-card-price">€${wine.price.toFixed(2)}</div>
            </div>
            <div class="shop-card-meta">
                ${wine.color ? `<span class="shop-card-tag">${wine.color}</span>` : ''}
                ${wine.country ? `<span class="shop-card-tag">${wine.country}</span>` : ''}
                ${wine.region ? `<span class="shop-card-tag">${wine.region}</span>` : ''}
            </div>
            <div class="shop-card-details">
                ${wine.rating ? `<span class="shop-card-description">${wine.rating}</span>` : ''}
            </div>
            <div class="shop-card-stock-row">
                <span class="shop-card-stock ${getStockClass(wine.available)}">${getStockText(wine.available)}</span>
            </div>
            <div class="shop-card-footer">
                <span></span>
                <button class="order-btn" onclick="openOrder(${idx})" ${wine.available <= 0 || wine.available === 'coming-soon' ? 'disabled' : ''}>
                    ${wine.available === 'coming-soon' ? 'Coming soon' : wine.available <= 0 ? 'Uitverkocht' : 'Aanvragen'}
                </button>
            </div>
        </div>
    `).join('');
}

function renderTable() {
    const tbody = document.getElementById('shopTableBody');
    
    tbody.innerHTML = filteredWines.map((wine, idx) => `
        <tr>
            <td style="font-weight:500;">${wine.name}</td>
            <td>${wine.producer}</td>
            <td>${wine.country}</td>
            <td>${wine.region}</td>
            <td class="wine-description-cell">${wine.rating || '—'}</td>
            <td><span class="${getStockClass(wine.available)}">${getStockText(wine.available)}</span></td>
            <td class="wine-price-cell">€${wine.price.toFixed(2)}</td>
            <td>
                <button class="order-btn" onclick="openOrder(${idx})" ${wine.available <= 0 || wine.available === 'coming-soon' ? 'disabled' : ''}>
                    ${wine.available === 'coming-soon' ? 'Coming soon' : wine.available <= 0 ? 'Uitverkocht' : 'Aanvragen'}
                </button>
            </td>
        </tr>
    `).join('');
}

// Modal / Order Form
let selectedWine = null;

function setupModal() {
    const modal = document.getElementById('orderModal');
    const closeBtn = document.getElementById('modalClose');
    
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
    
    // Update total when quantity changes
    document.getElementById('orderQuantity').addEventListener('input', updateTotal);
    
    // Form submit
    document.getElementById('orderForm').addEventListener('submit', handleSubmit);
}

function openOrder(index) {
    selectedWine = filteredWines[index];
    if (!selectedWine || selectedWine.available <= 0 || selectedWine.available === 'coming-soon') return;
    
    // Fill modal info
    document.getElementById('modalWineInfo').innerHTML = `
        <div class="modal-wine-name">${selectedWine.name}</div>
        <div class="modal-wine-detail">${selectedWine.producer} · ${selectedWine.region}, ${selectedWine.country}</div>
        <div class="modal-wine-price">€${selectedWine.price.toFixed(2)} per fles</div>
    `;
    
    // Set hidden fields
    document.getElementById('formWine').value = selectedWine.name;
    document.getElementById('formPrice').value = `€${selectedWine.price.toFixed(2)}`;
    
    // Set max quantity
    const qtyInput = document.getElementById('orderQuantity');
    qtyInput.max = selectedWine.available;
    qtyInput.value = 1;
    
    updateTotal();
    
    // Show form, hide success
    document.getElementById('orderForm').style.display = '';
    document.getElementById('orderSuccess').style.display = 'none';
    
    // Show modal
    document.getElementById('orderModal').classList.add('active');
}

function updateTotal() {
    if (!selectedWine) return;
    const qty = parseInt(document.getElementById('orderQuantity').value) || 1;
    const total = qty * selectedWine.price;
    document.getElementById('orderTotal').textContent = `Totaal: €${total.toFixed(2)}`;
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Add total to form
    const qty = parseInt(document.getElementById('orderQuantity').value) || 1;
    const total = qty * selectedWine.price;
    formData.append('totaal', `€${total.toFixed(2)}`);
    
    try {
        const response = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        });
        
        if (response.ok) {
            // Show success
            document.getElementById('orderForm').style.display = 'none';
            document.getElementById('orderSuccess').style.display = 'block';
            form.reset();
        } else {
            alert('Er ging iets mis. Probeer het opnieuw.');
        }
    } catch (error) {
        alert('Er ging iets mis. Probeer het opnieuw.');
    }
}

function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('shopCards').style.display = 'none';
    document.querySelector('.shop-table-wrapper').style.display = 'none';
}

function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('shopCards').style.display = '';
    document.querySelector('.shop-table-wrapper').style.display = '';
}
