import React, { useState, useEffect } from 'react';
import './App.css';
import Timer from './components/Timer';
import Algorytm from './components/Algorytm';

const ruchy2x2 = ["U", "U'", "U2", "R", "R'", "R2", "F", "F'", "F2"];
const ruchy3x3 = ["U", "U'", "U2", "D", "D'", "D2", "L", "L'", "L2", "R", "R'", "R2", "F", "F'", "F2", "B", "B'", "B2"];
const ruchy4x4 = [
  "U", "U'", "U2", "D", "D'", "D2", "L", "L'", "L2", "R", "R'", "R2", "F", "F'", "F2", "B", "B'", "B2",
  "Uw", "Uw'", "Uw2", "Dw", "Dw'", "Dw2", "Lw", "Lw'", "Lw2", "Rw", "Rw'", "Rw2", "Fw", "Fw'", "Fw2", "Bw", "Bw'", "Bw2"
];

function losujScramble(rodzajKostki) {
  if (rodzajKostki === 'Square 1') {
    return '';
  }

  let pulaRuchow = ruchy3x3;
  let ileRuchow = 20;

  if (rodzajKostki === '2x2') {
    pulaRuchow = ruchy2x2;
    ileRuchow = 9;
  } else if (rodzajKostki === '4x4') {
    pulaRuchow = ruchy4x4;
    ileRuchow = 40;
  }

  let wylosowane = [];
  for (let i = 0; i < ileRuchow; i++) {
    let ruch = pulaRuchow[Math.floor(Math.random() * pulaRuchow.length)];
    
    // zeby sie nie powtarzaly te same ruchy obok siebie
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

  const dajNowyScramble = () => {
    const nowy = losujScramble(typKostki);
    setScramble(nowy);
  };

  useEffect(() => {
    dajNowyScramble();
  }, [typKostki]);

  return (
    <div className="App">
      <header style={{ 
        padding: '25px 20px', 
        backgroundColor: '#111317', 
        color: 'white', 
        textAlign: 'center',
        borderBottom: '1px solid #1f242d'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2.2rem', 
          fontWeight: '700',
          letterSpacing: '1px',
          color: '#ffffff'
        }}>
          Cube<span style={{ color: '#ffb300' }}>Master</span>
        </h1>
        {typKostki !== 'Square 1' && <Algorytm scramble={scramble} />}
      </header>
      <main>
        <Timer 
          onSolveComplete={dajNowyScramble} 
          cubeType={typKostki} 
          onCubeTypeChange={setTypKostki} 
        />
      </main>
    </div>
  );
}

export default App;
