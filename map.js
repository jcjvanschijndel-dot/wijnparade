// Wine locations data - loaded from local content index
let wineLocations = [];
let map;
let markers = [];
let activeFilter = 'all';
let infoWindow;

function initMap() {
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
    loadLocationsFromCMS();
    initSearch();
}

async function loadLocationsFromCMS() {
    try {
        const response = await fetch('/content/locations/_index.json');
        
        if (!response.ok) {
            console.log('No locations index found');
            return;
        }
        
        const locations = await response.json();
        
        if (!locations || locations.length === 0) {
            console.log('No locations found');
            return;
        }

        for (const parsed of locations) {
            if (parsed.lat && parsed.lng) {
                wineLocations.push({
                    id: parsed._id,
                    name: parsed.title || parsed.name,
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
        
        console.log(`Loaded ${wineLocations.length} locations`);
        
        if (wineLocations.length > 0) {
            addMarkers(wineLocations);
            fitMapToMarkers();
        }
        
    } catch (error) {
        console.error('Error loading locations:', error);
    }
}

function addMarkers(locations) {
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    locations.forEach(location => {
        if (activeFilter !== 'all' && location.type !== activeFilter) return;

        const marker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            title: location.name,
            icon: getMarkerIcon(location.type),
            animation: google.maps.Animation.DROP
        });

        marker.addListener('click', () => {
            infoWindow.setContent(createInfoWindowContent(location));
            infoWindow.open(map, marker);
        });

        markers.push(marker);
    });
}

function getMarkerIcon(type) {
    const icons = { 'wijnbar': '🍾', 'wijnwinkel': '🏪', 'wijnhuis': '🏰', 'restaurant': '🍽️' };
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
    const imgSrc = location.image || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop';
    return `
        <div style="max-width: 280px; padding: 0; overflow: hidden;">
            <img src="${imgSrc}" alt="${location.name}" style="width: 100%; height: 140px; object-fit: cover; display: block;" onerror="this.src='https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop'">
            <div style="padding: 0.75rem;">
                <h3 style="font-size: 1rem; font-weight: 600; color: #1e3a8a; margin-bottom: 0.25rem;">${location.name}</h3>
                <p style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem;">${getTypeLabel(location.type)}</p>
                <p style="font-size: 0.8rem; color: #4b5563; margin-bottom: 0.75rem;">📍 ${location.address}</p>
                <a href="location.html?id=${location.id}" style="display: inline-block; padding: 0.4rem 0.8rem; background: #1e3a8a; color: white; text-decoration: none; border-radius: 6px; font-size: 0.85rem; font-weight: 500;">Lees verder →</a>
            </div>
        </div>
    `;
}

function getTypeLabel(type) {
    const labels = { 'wijnbar': '🍾 Wijnbar', 'wijnwinkel': '🏪 Wijnwinkel', 'wijnhuis': '🏰 Wijnhuis', 'restaurant': '🍽️ Restaurant' };
    return labels[type] || type;
}

function fitMapToMarkers() {
    if (markers.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => bounds.extend(marker.getPosition()));
    map.fitBounds(bounds);
}

function initSearch() {
    const input = document.getElementById('mapSearch');
    if (!input) return;

    const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: [] }, // worldwide
        fields: ['geometry', 'name']
    });

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(14);
        }

        // Clear input after short delay so dropdown closes cleanly
        setTimeout(() => { input.value = ''; }, 300);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            activeFilter = this.dataset.type;
            if (wineLocations.length > 0) {
                addMarkers(wineLocations);
                if (activeFilter === 'all') fitMapToMarkers();
            }
        });
    });
});
