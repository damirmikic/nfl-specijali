// This function fetches the list of upcoming games.
// It securely accesses and RANDOMLY selects an API key from your Netlify environment variables.

const fetch = require('node-fetch');

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
  
  // Select a random key from the array for each invocation
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)].trim();

  const apiUrl = `https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
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

