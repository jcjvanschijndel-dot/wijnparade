// Auto-geocoding for location entries using Google Maps API
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
      // Use Google Maps Geocoding API
      const apiKey = 'AIzaSyDgiuASYiN5pPKX3zNhoaEwuZ1zUxUYty0';
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        
        // Update entry with coordinates
        return entry
          .setIn(['data', 'lat'], location.lat)
          .setIn(['data', 'lng'], location.lng);
      } else if (data.status === 'ZERO_RESULTS') {
        alert(`Adres "${address}" kon niet worden gevonden. Vul handmatig coördinaten in.`);
        throw new Error('Address not found');
      } else if (data.status === 'REQUEST_DENIED') {
        alert('Google Maps API fout. Controleer je API key configuratie.');
        console.error('API Error:', data.error_message);
        throw new Error('API request denied');
      } else {
        alert(`Fout bij ophalen coördinaten: ${data.status}. Probeer opnieuw of vul handmatig in.`);
        throw new Error('Geocoding failed');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Fout bij ophalen coördinaten. Probeer opnieuw of vul handmatig in.');
      throw error;
    }
  }
});
