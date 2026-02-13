// Load individual location based on URL parameter
document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const locationId = urlParams.get('id');
    
    if (!locationId) {
        showError('Geen locatie geselecteerd');
        return;
    }
    
    await loadLocation(locationId);
});

async function loadLocation(locationId) {
    try {
        const response = await fetch('/content/locations/_index.json');
        
        if (!response.ok) {
            showError('Locaties niet gevonden');
            return;
        }
        
        const locations = await response.json();
        const location = locations.find(l => l._id === locationId);
        
        if (!location) {
            showError('Locatie niet gevonden');
            return;
        }
        
        renderLocation(location);
        
    } catch (error) {
        console.error('Error loading location:', error);
        showError('Fout bij laden van locatie');
    }
}

function renderLocation(location) {
    document.title = `${location.name} | de_wijnparade`;
    
    const img = document.getElementById('locationImage');
    if (img) {
        const imageSrc = location.image || '';
        console.log('[DEBUG] Image veld uit JSON:', JSON.stringify(location.image));
        console.log('[DEBUG] Image pad dat geladen wordt:', imageSrc || '(leeg — fallback wordt gebruikt)');
        
        if (imageSrc) {
            img.src = imageSrc;
        } else {
            img.src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&h=600&fit=crop';
        }
        img.alt = location.name;
        img.onerror = function() {
            console.warn('[DEBUG] Afbeelding kon niet geladen worden:', imageSrc, '— fallback wordt getoond');
            this.src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&h=600&fit=crop';
        };
    }
    
    const galleryEl = document.getElementById('locationGallery');
    if (galleryEl && location.gallery && location.gallery.length > 0) {
        galleryEl.style.display = 'grid';
        galleryEl.innerHTML = location.gallery.map(photo => {
            const photoUrl = typeof photo === 'string' ? photo : photo.photo || photo;
            return `<img src="${photoUrl}" alt="${location.name}" onerror="this.style.display='none'">`;
        }).join('');
    }
    
    const nameEl = document.getElementById('locationName');
    if (nameEl) nameEl.textContent = location.name;
    
    const typeEl = document.getElementById('locationType');
    if (typeEl) typeEl.textContent = getTypeLabel(location.type);
    
    const addressEl = document.getElementById('locationAddress');
    if (addressEl) addressEl.textContent = location.address;
    
    const descEl = document.getElementById('locationDescription');
    if (descEl) descEl.textContent = location.description;
    
    const websiteEl = document.getElementById('locationWebsite');
    if (websiteEl && location.website) {
        websiteEl.innerHTML = `<a href="${location.website}" target="_blank" class="website-btn">Bezoek website →</a>`;
    }
    
    if (location.lat && location.lng) {
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lng);
        const map = L.map('locationMap').setView([lat, lng], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);
        
        const icon = getMarkerIcon(location.type);
        L.marker([lat, lng], { icon }).addTo(map);
        
        setTimeout(() => map.invalidateSize(), 100);
    }
}

function getTypeLabel(type) {
    const labels = { 'wijnbar': '🍾 Wijnbar', 'wijnwinkel': '🏪 Wijnwinkel', 'wijnhuis': '🏰 Wijnhuis', 'restaurant': '🍽️ Restaurant' };
    return labels[type] || type;
}

function getMarkerIcon(type) {
    const icons = { 'wijnbar': '🍾', 'wijnwinkel': '🏪', 'wijnhuis': '🏰', 'restaurant': '🍽️' };
    const emoji = icons[type] || '📍';
    
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background: #1e3a8a; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${emoji}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
}

function showError(message) {
    const container = document.querySelector('.main .container');
    if (container) {
        container.innerHTML = `
            <div style="padding: 3rem; text-align: center;">
                <h2 style="color: var(--navy); margin-bottom: 1rem;">${message}</h2>
                <a href="map.html" style="color: var(--navy);">← Terug naar kaart</a>
            </div>
        `;
    }
}
