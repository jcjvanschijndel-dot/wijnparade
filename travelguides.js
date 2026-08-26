document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('/content/regions/_index.json');
        if (!response.ok) { showEmpty(); return; }
        const regions = await response.json();
        if (!regions || regions.length === 0) { showEmpty(); return; }
        renderRegions(regions);
    } catch(e) {
        showEmpty();
    }
});

function renderRegions(regions) {
    const grid = document.getElementById('regionsGrid');
    grid.innerHTML = regions
        .filter(r => r.locationCount > 0)
        .sort((a, b) => b.locationCount - a.locationCount)
        .map(r => `
        <a href="${r.url}" class="region-card">
            <div class="region-card-top">
                <span class="region-emoji">${r.emoji}</span>
                <span class="region-count">${r.locationCount} locaties</span>
            </div>
            <div class="region-name">${r.name}</div>
            <div class="region-country">${r.country}</div>
            <div class="region-desc">${r.description.substring(0, 140)}…</div>
            <div class="region-card-footer">
                <span class="region-card-link">Bekijk regiogids →</span>
                <a href="${r.mapUrl}" class="region-map-link" onclick="event.stopPropagation()">🗺️ Op kaart</a>
            </div>
        </a>`).join('');
}

function showEmpty() {
    document.getElementById('regionsGrid').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
}
