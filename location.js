// Load individual location from CMS based on URL parameter
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
        const repoPath = 'jcjvanschijndel-dot/wijnparade';
        const apiUrl = `https://api.github.com/repos/${repoPath}/contents/content/locations`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            showError('Kon locaties niet laden');
            return;
        }
        
        const files = await response.json();
        let location = null;
        let fileIndex = 0;
        
        // Find the location by index (id is the index in the list)
        for (const file of files) {
            if (file.name.endsWith('.md')) {
                if (fileIndex == locationId) {
                    const contentResponse = await fetch(file.download_url);
                    const content = await contentResponse.text();
                    location = parseFrontmatter(content);
                    break;
                }
                fileIndex++;
            }
        }
        
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
    // Update title
    document.title = `${location.name} | de_wijnparade`;
    
    // Update image
    const img = document.getElementById('locationImage');
    if (img) {
        img.src = location.image || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&h=600&fit=crop';
        img.alt = location.name;
        img.onerror = function() {
            this.src = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&h=600&fit=crop';
        };
    }
    
    // Update name
    const nameEl = document.getElementById('locationName');
    if (nameEl) nameEl.textContent = location.name;
    
    // Update type
    const typeEl = document.getElementById('locationType');
    if (typeEl) typeEl.textContent = getTypeLabel(location.type);
    
    // Update address
    const addressEl = document.getElementById('locationAddress');
    if (addressEl) addressEl.textContent = location.address;
    
    // Update description
    const descEl = document.getElementById('locationDescription');
    if (descEl) descEl.textContent = location.description;
    
    // Update website
    const websiteEl = document.getElementById('locationWebsite');
    if (websiteEl && location.website) {
        websiteEl.innerHTML = `<a href="${location.website}" target="_blank" class="website-btn">Bezoek website →</a>`;
    }
    
    // Initialize map
    if (location.lat && location.lng) {
        const map = L.map('locationMap').setView([location.lat, location.lng], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);
        
        // Add marker
        const icon = getMarkerIcon(location.type);
        L.marker([location.lat, location.lng], { icon }).addTo(map);
        
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
}

function getTypeLabel(type) {
    const labels = {
        'wijnbar': '🍾 Wijnbar',
        'wijnwinkel': '🏪 Wijnwinkel',
        'wijnhuis': '🏰 Wijnhuis',
        'restaurant': '🍽️ Restaurant'
    };
    return labels[type] || type;
}

function getMarkerIcon(type) {
    const icons = {
        'wijnbar': '🍾',
        'wijnwinkel': '🏪',
        'wijnhuis': '🏰',
        'restaurant': '🍽️'
    };
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

function parseFrontmatter(content) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter = match[1];
    const data = {};

    frontmatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1);
            }
            
            if (!isNaN(value) && value !== '') {
                value = Number(value);
            }
            
            data[key] = value;
        }
    });

    return data;
}