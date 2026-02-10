// Netlify Function for secure geocoding
// This keeps the Geocoding API key server-side

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { address } = JSON.parse(event.body);

    if (!address) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Address is required' })
      };
    }

    // Use environment variable (set in Netlify dashboard)
    const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;

    if (!apiKey) {
      console.error('GOOGLE_GEOCODING_API_KEY not set in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Geocoding service not configured' })
      };
    }

    // Call Google Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    const data = await response.json();

    // Return the result
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
