import React, { useState, useEffect } from 'react';
import './App.css';
import Timer from './components/Timer';
import Algorytm from './components/Algorytm';
import EkranLogowania from './components/EkranLogowania';

const ruchy2x2 = ["U", "U'", "U2", "R", "R'", "R2", "F", "F'", "F2"];
const ruchy3x3 = ["U", "U'", "U2", "D", "D'", "D2", "L", "L'", "L2", "R", "R'", "R2", "F", "F'", "F2", "B", "B'", "B2"];
const ruchy4x4 = [
  "U", "U'", "U2", "D", "D'", "D2", "L", "L'", "L2", "R", "R'", "R2", "F", "F'", "F2", "B", "B'", "B2",
  "Uw", "Uw'", "Uw2", "Dw", "Dw'", "Dw2", "Lw", "Lw'", "Lw2", "Rw", "Rw'", "Rw2", "Fw", "Fw'", "Fw2", "Bw", "Bw'", "Bw2"
];
const square_1 = [
  "/", 
  "(1,0)", "(0,1)", "(-1,0)", "(0,-1)",
  "(1,1)", "(-1,-1)", "(2,0)", "(0,2)",
  "(-2,0)", "(0,-2)", "(2,1)", "(1,2)",
  "(-2,-1)", "(-1,-2)", "(3,0)", "(0,3)",
  "(-3,0)", "(0,-3)", "(3,1)", "(1,3)",
  "(-3,-1)", "(-1,-3)", "(2,2)", "(-2,-2)",
  "(3,2)", "(2,3)", "(-3,-2)", "(-2,-3)"
];
const pyraminx = [
  "U", "U'", "R", "R'", "L", "L'", "B", "B'", 
  "u", "u'", "r", "r'", "l", "l'", "b", "b'"
];
const skewb = [
  "R", "R'", "L", "L'", "U", "U'", "B", "B'"
];

function losujScramble(rodzajKostki) {
  let pulaRuchow = ruchy3x3;
  let ileRuchow = 20;

  if (rodzajKostki === '2x2') {
    pulaRuchow = ruchy2x2;
    ileRuchow = 9;
  } else if (rodzajKostki === '4x4') {
    pulaRuchow = ruchy4x4;
    ileRuchow = 40;
  } else if (rodzajKostki === 'square_1') {
    pulaRuchow = square_1;
    ileRuchow = 40;
  } else if (rodzajKostki === 'pyraminx') {
    pulaRuchow = pyraminx;
    ileRuchow = 11;
  } else if (rodzajKostki === 'skewb') {
    pulaRuchow = skewb;
    ileRuchow = 10;
  }

  let wylosowane = [];
  for (let i = 0; i < ileRuchow; i++) {
    let ruch = pulaRuchow[Math.floor(Math.random() * pulaRuchow.length)];
    if (wylosowane.length > 0) {
      while (wylosowane[wylosowane.length - 1][0] === ruch[0]) {
        ruch = pulaRuchow[Math.floor(Math.random() * pulaRuchow.length)];
      }
    }
    wylosowane.push(ruch);
  }

  return wylosowane.join(" ");
}

function App() {
  const [typKostki, setTypKostki] = useState('3x3');
  const [scramble, setScramble] = useState('');
  const [czyOnline, setCzyOnline] = useState(navigator.onLine);
  
  // stan zalogowanego uzytkownika wczytywany z localStorage
  const [uzytkownik, setUzytkownik] = useState(() => {
    return localStorage.getItem('cubemaster_uzytkownik') || '';
  });

  const zalogujSie = (nick) => {
    localStorage.setItem('cubemaster_uzytkownik', nick);
    // automatyczna synchronizacja z nickiem rankingu dnia
    localStorage.setItem('cubemaster_user_nick', nick);
    setUzytkownik(nick);
  };

  const wylogujSie = () => {
    localStorage.removeItem('cubemaster_uzytkownik');
    setUzytkownik('');
  };

  const dajNowyScramble = () => {
    const nowy = losujScramble(typKostki);
    setScramble(nowy);
  };

  useEffect(() => {
    dajNowyScramble();
  }, [typKostki]);

  useEffect(() => {
    const obslugaOnline = () => setCzyOnline(true);
    const obslugaOffline = () => setCzyOnline(false);

    window.addEventListener('online', obslugaOnline);
    window.addEventListener('offline', obslugaOffline);

    return () => {
      window.removeEventListener('online', obslugaOnline);
      window.removeEventListener('offline', obslugaOffline);
    };
  }, []);

  // jesli nie jestesmy zalogowani, to najpierw pokazujemy ekran logowania
  if (uzytkownik === '') {
    return <EkranLogowania onLogin={zalogujSie} />;
  }

  return (
    <div className="App">
      <header style={{ 
        padding: '25px 20px', 
        backgroundColor: '#505050', 
        color: 'white', 
        textAlign: 'center',
        borderBottom: '1px solid #1f242d',
        position: 'relative'
      }}>
        {/* Wskaźnik zalogowanego gracza z przyciskiem wylogowania po lewej */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem',
          backgroundColor: '#1f242d',
          padding: '6px 12px',
          borderRadius: '20px',
          border: '1px solid #2d3748'
        }}>
          <span style={{ color: '#a0aec0', fontWeight: '500' }}>
            <strong style={{ color: '#ffb300' }}>{uzytkownik}</strong>
          </span>
          <button 
            onClick={wylogujSie}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff4757',
              cursor: 'pointer',
              fontWeight: 'bold',
              padding: 0,
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            Wyloguj
          </button>
        </div>

        {/* Wskaźnik Online/Offline po prawej */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.9rem',
          backgroundColor: '#1f242d',
          padding: '6px 12px',
          borderRadius: '20px',
          border: '1px solid #2d3748'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: czyOnline ? '#2ed573' : '#ff4757',
            display: 'inline-block',
            boxShadow: czyOnline ? '0 0 8px #2ed573' : '0 0 8px #ff4757'
          }} />
          <span style={{ color: '#a0aec0', fontWeight: '500' }}>
            {czyOnline ? 'Tryb Online' : 'Tryb Offline'}
          </span>
        </div>

        <h1 style={{ 
          margin: 0, 
          fontSize: '2.2rem', 
          fontWeight: '700',
          letterSpacing: '1px',
          color: '#ffffff'
        }}>
          Cube<span style={{ color: '#ffb300' }}>Master</span>
        </h1>
        {typKostki !== '' && <Algorytm scramble={scramble} />}
      </header>
      <main>
        <Timer 
          onSolveComplete={dajNowyScramble} 
          cubeType={typKostki} 
          onCubeTypeChange={setTypKostki} 
          scramble={scramble}
        />
      </main>
    </div>
  );
}

export default App;
