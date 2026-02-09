// Wine locations data - Will be loaded from CMS
let wineLocations = [];
let map;
let markers = [];
let activeFilter = 'all';

// Initialize map
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // First load locations from CMS
        await loadLocationsFromCMS();
        
        // Then initialize map
        map = L.map('map').setView([52.0, 5.0], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);

        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        if (wineLocations.length > 0) {
            addMarkers(wineLocations);
        }

    } catch (error) {
        console.error('Error initializing map:', error);
    }
});

async function loadLocationsFromCMS() {
    try {
        const repoPath = 'jcjvanschijndel-dot/wijnparade';
        const apiUrl = `https://api.github.com/repos/${repoPath}/contents/content/locations`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            console.log('No locations found in CMS');
            return;
        }
        
        const files = await response.json();
        
        if (!files || files.length === 0) {
            console.log('No location files found');
            return;
        }

        for (const file of files) {
            if (file.name.endsWith('.md')) {
                const contentResponse = await fetch(file.download_url);
                const content = await contentResponse.text();
                const parsed = parseFrontmatter(content);
                if (parsed && parsed.lat && parsed.lng) {
                    wineLocations.push({
                        id: wineLocations.length + 1,
                        name: parsed.name,
                        type: parsed.type || 'wijnbar',
                        address: parsed.address,
                        lat: parseFloat(parsed.lat),
                        lng: parseFloat(parsed.lng),
                        description: parsed.description,
                        image: parsed.image || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop',
                        website: parsed.website
                    });
                }
            }
        }
        
        console.log(`Loaded ${wineLocations.length} locations from CMS`);
        
    } catch (error) {
        console.error('Error loading locations from CMS:', error);
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

// Custom marker icons
const markerIcons = {
    wijnbar: L.divIcon({
        className: 'custom-div-icon',
        html: '<div style="background: #1e3a8a; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🍾</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    }),
    wijnwinkel: L.divIcon({
        className: 'custom-div-icon',
        html: '<div style="background: #1e3a8a; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏪</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    }),
    wijnhuis: L.divIcon({
        className: 'custom-div-icon',
        html: '<div style="background: #1e3a8a; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏰</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    })
};

// Create popup content
function createPopupContent(location) {
    return `
        <div style="min-width: 250px; max-width: 300px;">
            <img src="${location.image}" alt="${location.name}" class="popup-image">
            <div class="popup-body">
                <h3 class="popup-title">${location.name}</h3>
                <p class="popup-address">📍 ${location.address}</p>
                <p class="popup-description">${location.description}</p>
                <a href="${location.website}" target="_blank" class="popup-link">Bezoek website →</a>
            </div>
        </div>
    `;
}

// Add markers to map
function addMarkers(locations) {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    locations.forEach(location => {
        const marker = L.marker([location.lat, location.lng], {
            icon: markerIcons[location.type]
        }).addTo(map);

        marker.bindPopup(createPopupContent(location), {
            maxWidth: 300
        });

        markers.push(marker);
    });

    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Filter functionality
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.type;

        let filtered = wineLocations;
        if (activeFilter !== 'all') {
            filtered = wineLocations.filter(loc => loc.type === activeFilter);
        }

        addMarkers(filtered);
    });
});