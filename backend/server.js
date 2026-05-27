const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

// wczytywanie pliku .env z glownego folderu
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;
const dbName = process.env.DB_NAME || 'cubemaster';

// najpierw polaczenie bez wybranej bazy, zeby sprawdzic czy ta baza w ogole istnieje
const polaczeniePoczatkowe = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
});

let baza = null;

// Uruchamiamy serwer Express natychmiast, zeby serwer zawsze wstal i odpowiadal!
app.listen(port, () => {
  console.log(`==================================================`);
  console.log(`🚀 Serwer Express CubeMaster wystartowal na porcie ${port}!`);
  console.log(`==================================================`);

  // W tle próbujemy połączyć się z MySQL i przygotować bazę oraz tabelę
  polaczeniePoczatkowe.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
    if (err) {
      console.log(`\n⚠️  [OSTRZEZENIE] Nie udalo sie polaczyc z MySQL lub zalozyc bazy danych:`);
      console.log(`   Blad: ${err.message}`);
      console.log(`   👉 Upewnij sie, ze serwer MySQL (np. XAMPP, WAMP, Docker) jest WLACZONY!`);
      console.log(`   👉 Sprawdz, czy dane logowania w pliku .env w glownym folderze sa poprawne.\n`);
      polaczeniePoczatkowe.end();
      return;
    }
    
    console.log(`✅ Połączono z MySQL. Baza danych "${dbName}" gotowa!`);
    polaczeniePoczatkowe.end();

    // Tworzymy właściwą pulę połączeń z bazą
    baza = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Sprawdzenie i tworzenie tabeli
    baza.query(
      `CREATE TABLE IF NOT EXISTS wyniki (
        id VARCHAR(255) PRIMARY KEY,
        value INT NOT NULL,
        cubeType VARCHAR(50) NOT NULL,
        isDnf TINYINT(1) DEFAULT 0,
        isPlusTwo TINYINT(1) DEFAULT 0,
        scramble TEXT
      )`,
      (err) => {
        if (err) {
          console.error('❌ Blad przy tworzeniu tabeli "wyniki":', err.message);
        } else {
          console.log('🎉 Tabela "wyniki" zostala sprawdzona i jest gotowa w MySQL!');
        }
      }
    );
  });
});

// pobranie wszystkich wynikow
app.get('/items', (req, res) => {
  if (!baza) {
    return res.status(503).json({ blad: 'Baza danych MySQL nie jest podlaczona! Uruchom MySQL w XAMPP.' });
  }
  baza.query('SELECT * FROM wyniki', (err, rows) => {
    if (err) {
      return res.status(500).json({ blad: 'Nie udalo sie pobrac danych z bazy' });
    }
    res.json(rows);
  });
});

// dodanie pojedynczego wyniku
app.post('/items', (req, res) => {
  if (!baza) {
    return res.status(503).json({ blad: 'Baza danych MySQL nie jest podlaczona! Uruchom MySQL w XAMPP.' });
  }
  const { id, value, cubeType, isDnf, isPlusTwo, scramble } = req.body;
  baza.query(
    'INSERT INTO wyniki (id, value, cubeType, isDnf, isPlusTwo, scramble) VALUES (?, ?, ?, ?, ?, ?)',
    [id, value, cubeType, isDnf ? 1 : 0, isPlusTwo ? 1 : 0, scramble || ''],
    (err) => {
      if (err) {
        return res.status(500).json({ blad: 'Nie udalo sie dodac wyniku do bazy' });
      }
      res.json({ status: 'ok' });
    }
  );
});

// edycja wyniku (np. zmiana DNF)
app.put('/items/:id', (req, res) => {
  if (!baza) {
    return res.status(503).json({ blad: 'Baza danych MySQL nie jest podlaczona! Uruchom MySQL w XAMPP.' });
  }
  const { id } = req.params;
  const { isDnf, isPlusTwo } = req.body;
  
  if (isDnf !== undefined) {
    baza.query(
      'UPDATE wyniki SET isDnf = ? WHERE id = ?',
      [isDnf ? 1 : 0, id],
      (err) => {
        if (err) {
          return res.status(500).json({ blad: 'Nie udalo sie zmienic statusu DNF' });
        }
        res.json({ status: 'ok' });
      }
    );
  } else if (isPlusTwo !== undefined) {
    baza.query(
      'UPDATE wyniki SET isPlusTwo = ? WHERE id = ?',
      [isPlusTwo ? 1 : 0, id],
      (err) => {
        if (err) {
          return res.status(500).json({ blad: 'Nie udalo sie zmienic statusu +2' });
        }
        res.json({ status: 'ok' });
      }
    );
  } else {
    res.status(400).json({ blad: 'Brak odpowiednich pol do aktualizacji' });
  }
});

// usuniecie pojedynczego wyniku
app.delete('/items/:id', (req, res) => {
  if (!baza) {
    return res.status(503).json({ blad: 'Baza danych MySQL nie jest podlaczona! Uruchom MySQL w XAMPP.' });
  }
  const { id } = req.params;
  baza.query('DELETE FROM wyniki WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ blad: 'Nie udalo sie usunac wyniku z bazy' });
    }
    res.json({ status: 'ok' });
  });
});

// endpoint do synchronizacji calej paczki danych z offline
app.post('/sync', async (req, res) => {
  if (!baza) {
    return res.status(503).json({ blad: 'Baza danych MySQL nie jest podlaczona! Uruchom MySQL w XAMPP.' });
  }
  const { wyniki, usuniete } = req.body;

  const wykonajZapytanie = (sql, parametry) => {
    return new Promise((resolve, reject) => {
      baza.query(sql, parametry, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };

  try {
    // 1. Obsluga usuniec rekordow offline
    if (usuniete && usuniete.length > 0) {
      for (let i = 0; i < usuniete.length; i++) {
        await wykonajZapytanie('DELETE FROM wyniki WHERE id = ?', [usuniete[i]]);
      }
    }

    // 2. Obsluga nowych i zmodyfikowanych rekordow
    if (wyniki && wyniki.length > 0) {
      for (let i = 0; i < wyniki.length; i++) {
        const item = wyniki[i];
        const istnieje = await wykonajZapytanie('SELECT id FROM wyniki WHERE id = ?', [item.id]);
        
        if (istnieje.length > 0) {
          await wykonajZapytanie(
            'UPDATE wyniki SET value = ?, cubeType = ?, isDnf = ?, isPlusTwo = ?, scramble = ? WHERE id = ?',
            [item.value, item.cubeType, item.isDnf ? 1 : 0, item.isPlusTwo ? 1 : 0, item.scramble || '', item.id]
          );
        } else {
          await wykonajZapytanie(
            'INSERT INTO wyniki (id, value, cubeType, isDnf, isPlusTwo, scramble) VALUES (?, ?, ?, ?, ?, ?)',
            [item.id, item.value, item.cubeType, item.isDnf ? 1 : 0, item.isPlusTwo ? 1 : 0, item.scramble || '']
          );
        }
      }
    }

    // po calej operacji pobieramy aktualny stan bazy i zwracamy do frontendu
    const wszystkie = await wykonajZapytanie('SELECT * FROM wyniki', []);
    res.json(wszystkie);

  } catch (err) {
    console.error('Blad podczas synchronizacji:', err);
    res.status(500).json({ blad: 'Blad serwera podczas synchronizacji danych' });
  }
});
