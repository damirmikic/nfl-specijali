// This function fetches the list of upcoming games.
// It securely accesses and rotates API keys from your Netlify environment variables.

// To enable this function, you must do two things:
// 1. Create an environment variable in your Netlify site settings called `API_KEYS`.
// 2. The value should be your API keys, separated by commas (e.g., key1,key2,key3).

const fetch = require('node-fetch');

// Store key index outside the handler to rotate on each invocation
let keyIndex = 0;

exports.handler = async function (event, context) {
  const { sport } = event.queryStringParameters;

  const apiKeysString = process.env.API_KEYS;
  if (!apiKeysString) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "API_KEYS environment variable not set." }),
    };
  }

  const apiKeys = apiKeysString.split(',');
  
  // Rotate to the next key for the next function execution
  const apiKey = apiKeys[keyIndex].trim();
  keyIndex = (keyIndex + 1) % apiKeys.length;

  const apiUrl = `https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
        // If one key fails, you could implement logic to try the next one.
        // For now, we'll return the error.
        const errorData = await response.json();
        return {
            statusCode: response.status,
            body: JSON.stringify(errorData),
        }
    }
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Fetch error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch data from The Odds API', error: error.message }),
    };
  }
};
