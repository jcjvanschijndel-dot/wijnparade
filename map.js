// Wine locations data - Will be managed via CMS
const wineLocations = [
    {
        id: 1,
        name: "Zoldering",
        type: "wijnbar",
        address: "Utrechtsestraat 141H, Amsterdam",
        lat: 52.3625734,
        lng: 4.9013456,
        description: "Restaurant & wijnbar met meer dan 800 referenties. Een uitgebreide wijnkaart met focus op natuurwijnen.",
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop",
        website: "https://www.zoldering.nl"
    },
    {
        id: 2,
        name: "Grapedistrict",
        type: "wijnwinkel",
        address: "Haarlemmerstraat 65, Amsterdam",
        lat: 52.3702157,
        lng: 4.8951679,
        description: "Gespecialiseerde wijnwinkel met focus op natuurlijke en biologische wijnen van kleine producenten.",
        image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=300&fit=crop",
        website: "https://www.grapedistrict.nl"
    },
    {
        id: 3,
        name: "Champagne Bollinger",
        type: "wijnhuis",
        address: "16 Rue Jules Lobet, Aÿ, Frankrijk",
        lat: 49.0567,
        lng: 4.0058,
        description: "Iconisch Champagnehuis, bekend om hun krachtige en complexe champagnes sinds 1829.",
        image: "https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&h=300&fit=crop",
        website: "https://www.champagne-bollinger.com"
    }
];

let map;
let markers = [];
let activeFilter = 'all';

// Initialize map
document.addEventListener('DOMContentLoaded', function() {
    try {
        map = L.map('map').setView([52.0, 5.0], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);

        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        addMarkers(wineLocations);

    } catch (error) {
        console.error('Error initializing map:', error);
    }
});

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