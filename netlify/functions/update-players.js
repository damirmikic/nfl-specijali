const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: JSON.stringify({ message: "Supabase kredencijali nisu podešeni." }) };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { playerName, teamName } = JSON.parse(event.body);

    if (!playerName || !teamName) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Nedostaje ime igrača ili tima.' }) };
    }

    // Pokušavamo najobičniji INSERT. Ako ovo ne uspe, problem je 100% RLS ili konekcija.
    const { data, error } = await supabase
      .from('players')
      .insert([
        { name: playerName, team: teamName }
      ])
      .select();

    // Ako postoji greška, vraćamo je
    if (error) {
      console.error('Supabase greška prilikom INSERT-a:', error);
      return {
        statusCode: 400, // Vraćamo 400 da bi response.ok bio 'false' na frontendu
        body: JSON.stringify({ 
          message: 'Supabase greška: Nije moguće upisati igrača.',
          details: error.message
        }),
      };
    }

    // Ako je sve OK
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Igrač je uspešno ubačen u bazu.',
        returnData: data 
      }),
    };
  } catch (error) {
    console.error('Greška u izvršavanju funkcije:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Greška na serveru.', error: error.message }),
    };
  }
};
