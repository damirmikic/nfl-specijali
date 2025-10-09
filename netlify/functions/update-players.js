const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Supabase URL ili ključ nisu podešeni." }),
    };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { playerName, teamName } = JSON.parse(event.body);

    if (!playerName || !teamName) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Ime igrača i tima su obavezni.' }) };
    }

    // `upsert` će uraditi UPDATE ako igrač postoji, ili INSERT ako ne postoji.
    // `onConflict: 'name'` kaže Supabase-u da je 'name' kolona jedinstvena.
    const { data, error } = await supabase
      .from('players')
      .upsert({ name: playerName, team: teamName }, { onConflict: 'name' });

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Igrač je uspešno sačuvan u bazi.' }),
    };
  } catch (error) {
    console.error('Greška pri ažuriranju igrača:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Neuspešno ažuriranje igrača.', error: error.message }),
    };
  }
};
