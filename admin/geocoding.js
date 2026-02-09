// Auto-geocoding for location entries
// This script runs in the CMS and automatically fills lat/lng based on address

CMS.registerEventListener({
  name: 'preSave',
  handler: async ({ entry }) => {
    // Only process location entries
    if (entry.get('collection') !== 'locations') {
      return entry;
    }

    const address = entry.getIn(['data', 'address']);
    const lat = entry.getIn(['data', 'lat']);
    const lng = entry.getIn(['data', 'lng']);

    // If coordinates are already filled, don't override
    if (lat && lng) {
      return entry;
    }

    // If no address, can't geocode
    if (!address) {
      alert('Vul een adres in om de locatie op de kaart te plaatsen.');
      throw new Error('Address required for geocoding');
    }

    try {
      // Use Nominatim (OpenStreetMap) for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'WijnParade/1.0'
          }
        }
      );

      const results = await response.json();

      if (results && results.length > 0) {
        const location = results[0];
        
        // Update entry with coordinates
        return entry
          .setIn(['data', 'lat'], parseFloat(location.lat))
          .setIn(['data', 'lng'], parseFloat(location.lon));
      } else {
        alert(`Adres "${address}" kon niet worden gevonden. Vul handmatig coördinaten in.`);
        throw new Error('Address not found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Fout bij ophalen coördinaten. Probeer opnieuw of vul handmatig in.');
      throw error;
    }
  }
});
