let allRegions = [];
// Engelse versie (/en/wine-travel): Engelse regiolijst en teksten
const EN = document.documentElement.lang === 'en';

document.addEventListener('DOMContentLoaded', async function() {
  try {
    const response = await fetch(EN ? '/en/regions.json' : '/content/regions/_index.json');
    if (!response.ok) { showEmpty(); return; }
    allRegions = await response.json();
    allRegions = allRegions.filter(r => r.locationCount > 0);
    if (!allRegions.length) { showEmpty(); return; }
    populateFilters();
    document.getElementById('filterCountry').addEventListener('change', render);
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

function getFiltered() {
  const country = document.getElementById('filterCountry').value;
  return allRegions.filter(r => !country || r.country === country);
}

function render() {
  const filtered = getFiltered();
  const container = document.getElementById('regionsList');
  if (!filtered.length) {
    container.innerHTML = `<p style="color:var(--gray-600);padding:2rem 0;text-align:center;">${EN ? 'No regions found for these filters.' : 'Geen regio\'s gevonden voor deze filters.'}</p>`;
    return;
  }

  const byCountry = {};
  filtered.forEach(r => {
    if (!byCountry[r.country]) byCountry[r.country] = [];
    byCountry[r.country].push(r);
  });
  const lang = EN ? 'en' : 'nl';
  // Nederland eerst (met Amsterdam bovenaan), daarna de andere landen op alfabet
  const isNL = c => c === 'Nederland' || c === 'Netherlands' || c === 'The Netherlands';
  const first = r => (r.id === 'amsterdam' || /^amsterdam$/i.test(r.name)) ? 0 : 1;
  Object.values(byCountry).forEach(list => list.sort((a, b) => first(a) - first(b) || a.name.localeCompare(b.name, lang)));
  const sortedCountries = Object.keys(byCountry).sort((a, b) => isNL(b) - isNL(a) || a.localeCompare(b, lang));

  container.innerHTML = sortedCountries.map(country => `
    <div class="country-group">
      <h2 class="country-heading">${country}</h2>
      <div class="country-regions">
        ${byCountry[country].map(r => `
        <a href="${r.url}" class="region-row">
          <div class="region-row-left">
            <div class="region-row-name">${r.name}<span class="region-row-count">${r.locationCount} hotspots</span></div>
            <p class="region-row-intro">${r.shortDescription || r.description.split('.').slice(0,2).join('.') + '.'}</p>
          </div>
          <span class="region-row-link">${EN ? 'View guide →' : 'Bekijk gids →'}</span>
        </a>`).join('')}
      </div>
    </div>`).join('');
}

function showEmpty() {
  document.getElementById('regionsList').innerHTML =
    `<p style="color:var(--gray-600);padding:2rem 0;text-align:center;">${EN ? 'Travel guides will be available after the next deploy.' : 'Regiogidsen worden geladen tijdens de volgende deploy.'}</p>`;
}
