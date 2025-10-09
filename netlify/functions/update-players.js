const fs = require('fs').promises;
const path = require('path');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { playerName, teamName } = JSON.parse(event.body);

    if (!playerName || !teamName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Ime igrača i ime tima su obavezni.' }),
      };
    }

    // Putanja do fajla je relativna u odnosu na lokaciju funkcije
    const filePath = path.resolve(__dirname, '../../nfl_players.json');

    let playersData;
    try {
      // Čitanje postojećeg fajla
      const fileContent = await fs.readFile(filePath, 'utf-8');
      playersData = JSON.parse(fileContent);
    } catch (readError) {
      // Ako fajl ne postoji, kreira se prazan niz
      if (readError.code === 'ENOENT') {
        playersData = [];
      } else {
        // U slučaju druge greške, izbaci je
        throw readError;
      }
    }

    // Provera da li igrač već postoji
    const playerIndex = playersData.findIndex(p => p.name === playerName);

    if (playerIndex > -1) {
      // Ažuriranje postojećeg igrača
      playersData[playerIndex].team = teamName;
    } else {
      // Dodavanje novog igrača
      playersData.push({ name: playerName, team: teamName });
    }

    // Snimanje ažuriranih podataka nazad u fajl
    await fs.writeFile(filePath, JSON.stringify(playersData, null, 2), 'utf-8');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Podaci o igraču su uspešno ažurirani.' }),
    };
  } catch (error) {
    console.error('Greška pri ažuriranju podataka:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Neuspešno ažuriranje podataka.', error: error.message }),
    };
  }
};
