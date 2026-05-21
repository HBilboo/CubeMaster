import React, { useState, useEffect, useRef } from 'react';

const Timer = (props) => {
  const [czas, setCzas] = useState(0);
  const [czyDziala, setCzyDziala] = useState(false);
  const [wyniki, setWyniki] = useState([]);
  
  // stany to: 'nic', 'trzymanie', 'gotowy', 'odliczanie'
  const [stan, setStan] = useState('nic'); 
  
  // ref do stanu zeby sie react nie gubil w eventach
  const stanRef = useRef('nic');
  stanRef.current = stan;

  const czasomierzGotowosci = useRef(null);
  const dopieroCoZatrzymany = useRef(false);

  // odliczanie sekund na ekranie
  useEffect(() => {
    let interwal;

    if (czyDziala === true) {
      const startTime = Date.now();

      interwal = setInterval(() => {
        setCzas(Date.now() - startTime);
      }, 10);
    }

    return () => {
      clearInterval(interwal);
    };
  }, [czyDziala]);

  // zapisywanie czasu do historii po stopie
  useEffect(() => {
    if (czyDziala === false && czas > 0) {
      setWyniki((stareWyniki) => [
        ...stareWyniki,
        {
          id: Date.now(),
          value: czas,
          cubeType: props.cubeType
        },
      ]);
      if (props.onSolveComplete) {
        props.onSolveComplete();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [czyDziala]);

  // cala logika spacji
  useEffect(() => {
    const klawiszWdol = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();

        // usuwamy focus z przyciskow zeby spacja ich znowu nie klikala
        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }

        const obecnyStan = stanRef.current;

        // stopowanie timera
        if (obecnyStan === 'odliczanie') {
          setCzyDziala(false);
          setStan('nic');
          dopieroCoZatrzymany.current = true;
          return;
        }

        // przygotowanie do startu
        if (obecnyStan === 'nic' && dopieroCoZatrzymany.current === false) {
          if (event.repeat === true) return; 
          
          setStan('trzymanie');
          setCzas(0);
          
          // trzeba trzymac 300ms zeby sie zaswiecil na zielono
          czasomierzGotowosci.current = setTimeout(() => {
            if (stanRef.current === 'trzymanie') {
              setStan('gotowy');
            }
          }, 300);
        }
      }
    };

    const klawiszWgore = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();

        if (dopieroCoZatrzymany.current === true) {
          dopieroCoZatrzymany.current = false;
          return;
        }

        const obecnyStan = stanRef.current;

        // puszczenie za wczesnie
        if (obecnyStan === 'trzymanie') {
          if (czasomierzGotowosci.current) {
            clearTimeout(czasomierzGotowosci.current);
          }
          setStan('nic');
        }

        // puszczenie jak juz zielony i start!
        if (obecnyStan === 'gotowy') {
          if (czasomierzGotowosci.current) {
            clearTimeout(czasomierzGotowosci.current);
          }
          setStan('odliczanie');
          setCzyDziala(true);
        }
      }
    };

    window.addEventListener('keydown', klawiszWdol);
    window.addEventListener('keyup', klawiszWgore);
    
    return () => {
      window.removeEventListener('keydown', klawiszWdol);
      window.removeEventListener('keyup', klawiszWgore);
      if (czasomierzGotowosci.current) {
        clearTimeout(czasomierzGotowosci.current);
      }
    };
  }, []);

  const formatujCzas = (ms) => {
    return (ms / 1000).toFixed(2);
  };

  const zmienDnf = (id) => {
    setWyniki((stareWyniki) =>
      stareWyniki.map((w) => (w.id === id ? { ...w, isDnf: !w.isDnf } : w))
    );
  };

  const najlepszyCzas = (lista) => {
    const poprawne = lista.filter((w) => !w.isDnf);
    if (poprawne.length === 0) return '-';
    const min = Math.min(...poprawne.map((w) => w.value));
    return formatujCzas(min) + 's';
  };

  const sredniaSuma = (lista) => {
    const poprawne = lista.filter((w) => !w.isDnf);
    if (poprawne.length === 0) return '-';
    const suma = poprawne.reduce((acc, w) => acc + w.value, 0);
    const avg = suma / poprawne.length;
    return formatujCzas(avg) + 's';
  };

  const obliczAo5 = (lista) => {
    const poprawne = lista.filter((w) => !w.isDnf);
    if (poprawne.length < 5) return '-';
    const ostatnie5 = poprawne.slice(-5).map((w) => w.value);
    const min = Math.min(...ostatnie5);
    const max = Math.max(...ostatnie5);
    const suma = ostatnie5.reduce((acc, val) => acc + val, 0);
    const avg = (suma - min - max) / 3;
    return formatujCzas(avg) + 's';
  };

  const najlepszeAo5 = (lista) => {
    const poprawne = lista.filter((w) => !w.isDnf);
    if (poprawne.length < 5) return '-';
    let bestAvg = Infinity;

    for (let i = 0; i <= poprawne.length - 5; i++) {
      const grupa5 = poprawne.slice(i, i + 5).map((w) => w.value);
      const min = Math.min(...grupa5);
      const max = Math.max(...grupa5);
      const suma = grupa5.reduce((acc, val) => acc + val, 0);
      const avg = (suma - min - max) / 3;

      if (avg < bestAvg) {
        bestAvg = avg;
      }
    }

    return bestAvg === Infinity ? '-' : formatujCzas(bestAvg) + 's';
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 150px)', 
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      backgroundColor: '#1a1a1a', 
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
    },
    instruction: {
      fontSize: '1.2rem',
      color: '#888',
      marginBottom: '40px',
    },
    timerDisplay: {
      fontSize: '10rem',
      fontWeight: 'bold',
      fontFamily: 'monospace',
      color: stan === 'trzymanie' ? '#ff4757' : stan === 'gotowy' ? '#2ed573' : '#ffffff',
      margin: '20px 0',
    },
    resultSection: {
      marginTop: '60px',
      textAlign: 'center',
      padding: '20px',
      borderTop: '1px solid #333',
      width: '100%',
      maxWidth: '400px',
    },
    resultText: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#3498db',
    },
  };

  return (
    <div style={styles.container}>
      
      <div className="sidebar-container">
        
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#1f242d',
          borderRadius: '8px',
          border: '1px solid #2d3748'
        }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ffb300', fontSize: '0.95rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            WYBÓR KOSTKI:
          </label>
          <select 
            value={props.cubeType} 
            onChange={(e) => props.onCubeTypeChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#111317',
              color: 'white',
              border: '1px solid #4a5568',
              borderRadius: '6px',
              fontSize: '1rem',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            <option value="2x2">2x2</option>
            <option value="3x3">3x3</option>
            <option value="4x4">4x4</option>
            <option value="Square 1">Square-1</option>
          </select>
        </div>

        <div className="times-history-container">
          <div className="times-history-title">
            <span>Historia czasów</span>
            {wyniki.length > 0 && (
              <button className="clear-history-btn" onClick={() => setWyniki([])}>
                Wyczyść
              </button>
            )}
          </div>
          <table className="times-history-table">
            <thead>
              <tr>
                <th>Rodzaj</th>
                <th>Czas</th>
                <th>DNF</th>
              </tr>
            </thead>
            <tbody>
              {wyniki.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ color: '#666', fontStyle: 'italic', paddingTop: '15px', textAlign: 'center' }}>
                    Brak czasów
                  </td>
                </tr>
              ) : (
                wyniki.map((item, index) => (
                  <tr key={item.id} style={item.isDnf ? { opacity: 0.6 } : {}}>
                    <td style={{ textAlign: 'center', color: item.isDnf ? 'rgba(255, 255, 255, 0.3)' : 'inherit' }}>{item.cubeType || '3x3'}</td>
                    <td style={{ 
                      fontWeight: '600', 
                      color: item.isDnf ? 'rgba(255, 255, 255, 0.4)' : '#3498db', 
                      textAlign: 'center',
                      textDecoration: item.isDnf ? 'line-through' : 'none' 
                    }}>
                      {formatujCzas(item.value)}s
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`dnf-btn ${item.isDnf ? 'active' : ''}`}
                        onClick={() => zmienDnf(item.id)}
                        title="Oznacz jako DNF"
                      >
                        DNF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="stats-container">
          <div className="stats-title">Statystyki sesji</div>
          <table className="stats-table">
            <tbody>
              <tr>
                <td className="stats-label">Najlepszy singiel:</td>
                <td className="stats-value accent">{najlepszyCzas(wyniki)}</td>
              </tr>
              <tr>
                <td className="stats-label">Średnia sesji:</td>
                <td className="stats-value">{sredniaSuma(wyniki)}</td>
              </tr>
              <tr>
                <td className="stats-label">Aktualny Ao5:</td>
                <td className="stats-value highlight">{obliczAo5(wyniki)}</td>
              </tr>
              <tr>
                <td className="stats-label">Najlepszy Ao5:</td>
                <td className="stats-value highlight">{najlepszeAo5(wyniki)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.resultSection}>
        {czyDziala === false && czas > 0 ? (
          <>
            <p style={{ color: '#888', marginBottom: '5px' }}>Twój czas:</p>
            <div style={styles.resultText}>{formatujCzas(czas)}s</div>
          </>
        ) : (
          <p style={{ color: '#444' }}>Oczekiwanie na pierwsze ułożenie</p>
        )}
      </div>

      <div style={styles.instruction}>
        {stan === 'nic' && 'Przytrzymaj SPACJĘ, aby przygotować timer'}
        {stan === 'trzymanie' && 'Trzymaj spację...'}
        {stan === 'gotowy' && 'PUŚĆ SPACJĘ, ABY ROZPOCZĄĆ!'}
        {stan === 'odliczanie' && 'Naciśnij SPACJĘ, aby zatrzymać'}
      </div>

      <div style={styles.timerDisplay}>
        {formatujCzas(czas)}
      </div>
    </div>
  );
};

export default Timer;