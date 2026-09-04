const UTRECHT = { lat: 52.0907, lng: 5.1214 };

const REGION_ICONS = {
  'parijs': 'ti-building-arch',
  'rotterdam': 'ti-anchor',
  'amsterdam': 'ti-bike',
  't-gooi': 'ti-trees',
  'limburg': 'ti-mountain',
  'rioja': 'ti-wine',
  'ribera-del-duero': 'ti-building-castle',
  'bordeaux': 'ti-building-castle',
  'bourgogne': 'ti-wine',
  'champagne': 'ti-glass-full',
  'rhone-noord': 'ti-mountain-2',
  'provence': 'ti-sun',
  'loire': 'ti-crown',
  'douro': 'ti-waves',
  'toscane': 'ti-building-church',
  'piemonte': 'ti-leaf',
  'alto-adige': 'ti-snowflake',
  'mosel': 'ti-droplets',
  'ahr': 'ti-bottle',
  'baskenland': 'ti-fish',
  'mallorca': 'ti-umbrella-beach',
  'costa-brava': 'ti-wave-sine',
  'malaga': 'ti-sun-high',
  'griekenland': 'ti-building-columns',
};

function getRegionIcon(id) {
  return REGION_ICONS[id] || 'ti-map-pin';
}


function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) / 50) * 50;
}

let allRegions = [];

document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('/content/regions/_index.json');
        if (!response.ok) { showEmpty(); return; }
        allRegions = await response.json();
        allRegions = allRegions
            .filter(r => r.locationCount > 0)
            .map(r => ({ ...r, km: haversineKm(UTRECHT.lat, UTRECHT.lng, r.centerLat, r.centerLng) }));

        if (!allRegions.length) { showEmpty(); return; }

        populateFilters();
        setupFilters();
        render();
    } catch(e) { showEmpty(); }
});

function populateFilters() {
    const countries = [...new Set(allRegions.map(r => r.country))].sort();
    const sel = document.getElementById('filterCountry');
    countries.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        sel.appendChild(opt);
    });
}

function setupFilters() {
    document.getElementById('filterCountry').addEventListener('change', render);
    document.getElementById('filterDistance').addEventListener('change', render);
}

function getFiltered() {
    const country = document.getElementById('filterCountry').value;
    const maxKm = parseInt(document.getElementById('filterDistance').value) || Infinity;
    return allRegions.filter(r =>
        (!country || r.country === country) && r.km <= maxKm
    );
}

function render() {
    const filtered = getFiltered();
    const container = document.getElementById('regionsList');

    if (!filtered.length) {
        container.innerHTML = '<p style="color:var(--text-secondary);padding:2rem 0;text-align:center;">Geen regio\'s gevonden voor deze filters.</p>';
        return;
    }

    // Group by country, sort countries by nearest region
    const byCountry = {};
    filtered.forEach(r => {
        if (!byCountry[r.country]) byCountry[r.country] = [];
        byCountry[r.country].push(r);
    });

    // Sort each country's regions by distance
    Object.values(byCountry).forEach(list => list.sort((a,b) => a.km - b.km));

    // Sort countries by their nearest region
    const sortedCountries = Object.keys(byCountry).sort((a,b) =>
        byCountry[a][0].km - byCountry[b][0].km
    );

    container.innerHTML = sortedCountries.map(country => `
        <div class="country-group">
            <h2 class="country-heading">${country}</h2>
            <div class="country-regions">
                ${byCountry[country].map(r => `
                <div class="region-row">
                    <div class="region-row-left">
                        <div class="region-row-header">
                            <span class="region-row-emoji">${r.emoji}</span>
                            <div>
                                <div class="region-row-name">${r.name}</div>
                                <div class="region-row-meta">±${r.km} km van Utrecht &middot; ${r.locationCount} locaties</div>
                            </div>
                        </div>
                        <p class="region-row-intro">${r.description.split('.').slice(0,2).join('.')}.</p>
                    </div>
                    <div class="region-row-actions">
                        <a href="${r.url}" class="region-btn-primary">Bekijk gids →</a>
                        <a href="${r.mapUrl}" class="region-btn-map">🗺️ Kaart</a>
                    </div>
                </div>`).join('')}
            </div>
        </div>`).join('');
}

function showEmpty() {
    document.getElementById('regionsList').innerHTML =
        '<p style="color:var(--text-secondary);padding:2rem 0;text-align:center;">Regiogidsen worden geladen tijdens de volgende deploy.</p>';
}
