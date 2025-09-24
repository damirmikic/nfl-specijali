// netlify/functions/get-odds.js

exports.handler = async function (event, context) {
  const { sport, eventId, markets, regions, oddsFormat } = event.queryStringParameters;
  
  // Pristupanje API ključevima iz environment variables
  const apiKeys = process.env.API_KEYS.split(',');
  
  // Jednostavna rotacija ključeva
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

  const apiUrl = `https://api.the-odds-api.com/v4/sports/${sport}/events/${eventId}/odds?apiKey=${apiKey}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data' }),
    };
  }
};
