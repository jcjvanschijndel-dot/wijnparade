const UTRECHT = { lat: 52.0907, lng: 5.1214 };

const REGION_ICONS = {
  'parijs': 'ti-building-arch',
  'rotterdam': 'ti-anchor',
  'amsterdam': 'ti-building-bridge-2',
  't-gooi': 'ti-trees',
  'limburg': 'ti-mountain',
  'rioja': 'ti-building-castle',
  'ribera-del-duero': 'ti-building-castle',
  'bordeaux': 'ti-building-castle',
  'bourgogne': 'ti-bottle',
  'champagne': 'ti-star',
  'rhone-noord': 'ti-mountain',
  'provence': 'ti-sun',
  'loire': 'ti-crown',
  'douro': 'ti-ship',
  'toscane': 'ti-sun',
  'piemonte': 'ti-mountain',
  'alto-adige': 'ti-pine-tree',
  'mosel': 'ti-mountain',
  'ahr': 'ti-mountain',
  'baskenland': 'ti-fish',
  'mallorca': 'ti-sun',
  'costa-brava': 'ti-sun',
  'malaga': 'ti-sun',
  'griekenland': 'ti-building-arch',
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
  return allRegions.filter(r => (!country || r.country === country) && r.km <= maxKm);
}

function render() {
  const filtered = getFiltered();
  const container = document.getElementById('regionsList');
  if (!filtered.length) {
    container.innerHTML = '<p style="color:var(--gray-600);padding:2rem 0;text-align:center;">Geen regio\'s gevonden voor deze filters.</p>';
    return;
  }

  const byCountry = {};
  filtered.forEach(r => {
    if (!byCountry[r.country]) byCountry[r.country] = [];
    byCountry[r.country].push(r);
  });
  Object.values(byCountry).forEach(list => list.sort((a,b) => a.km - b.km));
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
              <div class="region-icon-box">
                <i class="ti ${getRegionIcon(r.id)}"></i>
              </div>
              <div>
                <div class="region-row-name">${r.name}</div>
                <div class="region-row-meta">±${r.km} km van Utrecht &middot; ${r.locationCount} locaties</div>
              </div>
            </div>
            <p class="region-row-intro">${r.description.split('.').slice(0,2).join('.')}.</p>
          </div>
          <div class="region-row-actions">
            <a href="${r.url}" class="region-btn-primary">Bekijk gids →</a>
            <a href="${r.mapUrl}" class="region-btn-map"><i class="ti ti-map-2" style="font-size:13px;vertical-align:-2px;"></i> Kaart</a>
          </div>
        </div>`).join('')}
      </div>
    </div>`).join('');
}

function showEmpty() {
  document.getElementById('regionsList').innerHTML =
    '<p style="color:var(--gray-600);padding:2rem 0;text-align:center;">Regiogidsen worden geladen tijdens de volgende deploy.</p>';
}
