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
      body: JSON.stringify({ message: "Supabase URL ili ključ nisu podešeni u Netlify environment variables." }),
    };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { playerName, teamName } = JSON.parse(event.body);

    if (!playerName || !teamName) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Ime igrača i tima su obavezni.' }) };
    }

    // `upsert` će uraditi UPDATE ako igrač postoji, ili INSERT ako ne postoji.
    // Vraćamo `select()` da bismo videli šta je upisano.
    const { data, error } = await supabase
      .from('players')
      .upsert({ name: playerName, team: teamName }, { onConflict: 'name' })
      .select(); // <-- VAŽNO: Dodali smo .select()

    // ===== KLJUČNI DEO ZA DEBAGOVANJE =====
    // Ako Supabase vrati grešku (npr. zbog RLS-a), sada ćemo je uhvatiti i poslati nazad.
    if (error) {
      console.error('Supabase greška:', error);
      // Vraćamo status 500 sa tačnom porukom o grešci iz baze.
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          message: 'Supabase je vratio grešku prilikom upisivanja.',
          details: error.message,
          hint: error.hint
        }),
      };
    }
    // =======================================

    // Ako je sve prošlo kako treba, vraćamo podatke koji su upisani.
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Igrač je uspešno sačuvan u bazi.',
        returnData: data 
      }),
    };
  } catch (error) {
    console.error('Greška u izvršavanju funkcije:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Neuspešno izvršavanje funkcije.', error: error.message }),
    };
  }
};
