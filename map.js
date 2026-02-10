// Wine locations data - Will be loaded from CMS
let wineLocations = [];
let map;
let markers = [];
let activeFilter = 'all';
let infoWindow;

// Initialize map - called by Google Maps API
function initMap() {
    // Default center (Netherlands)
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 52.0, lng: 5.0 },
        zoom: 7,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    infoWindow = new google.maps.InfoWindow();

    // Load locations from CMS
    loadLocationsFromCMS();
}

async function loadLocationsFromCMS() {
    try {
        const repoPath = 'jcjvanschijndel-dot/de-wijnparade';
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
                        id: file.name.replace('.md', ''),
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
        
        if (wineLocations.length > 0) {
            addMarkers(wineLocations);
            fitMapToMarkers();
        }
        
    } catch (error) {
        console.error('Error loading locations from CMS:', error);
    }
}

function addMarkers(locations) {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    locations.forEach(location => {
        if (activeFilter !== 'all' && location.type !== activeFilter) {
            return;
        }

        const marker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            title: location.name,
            icon: getMarkerIcon(location.type),
            animation: google.maps.Animation.DROP
        });

        marker.addListener('click', () => {
            const content = createInfoWindowContent(location);
            infoWindow.setContent(content);
            infoWindow.open(map, marker);
        });

        markers.push(marker);
    });
}

function getMarkerIcon(type) {
    const icons = {
        'wijnbar': '🍾',
        'wijnwinkel': '🏪',
        'wijnhuis': '🏰',
        'restaurant': '🍽️'
    };
    
    const emoji = icons[type] || '📍';
    
    return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                <circle cx="20" cy="20" r="18" fill="#1e3a8a" stroke="white" stroke-width="3"/>
                <text x="20" y="20" text-anchor="middle" dominant-baseline="central" font-size="20">${emoji}</text>
            </svg>
        `)}`,
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20)
    };
}

function createInfoWindowContent(location) {
    return `
        <div style="max-width: 250px; padding: 0.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; color: #1e3a8a; margin-bottom: 0.25rem;">${location.name}</h3>
            <p style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem;">${getTypeLabel(location.type)}</p>
            <p style="font-size: 0.8rem; color: #4b5563; margin-bottom: 0.75rem;">📍 ${location.address}</p>
            <a href="location.html?id=${location.id}" style="display: inline-block; padding: 0.4rem 0.8rem; background: #1e3a8a; color: white; text-decoration: none; border-radius: 6px; font-size: 0.85rem; font-weight: 500;">Lees verder →</a>
        </div>
    `;
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

function fitMapToMarkers() {
    if (markers.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => {
        bounds.extend(marker.getPosition());
    });
    map.fitBounds(bounds);
}

// Filter functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update filter
            activeFilter = this.dataset.type;
            
            // Re-render markers
            if (wineLocations.length > 0) {
                addMarkers(wineLocations);
                if (activeFilter === 'all') {
                    fitMapToMarkers();
                }
            }
        });
    });
});

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
