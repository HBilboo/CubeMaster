import React, { useState, useEffect, useRef } from 'react';
import RankingDnia from './RankingDnia';

const Timer = (props) => {
  const [czas, setCzas] = useState(0);
  const [czyDziala, setCzyDziala] = useState(false);
  const [wyniki, setWyniki] = useState(() => {
    const zapisane = localStorage.getItem('cubemaster_wyniki');
    return zapisane ? JSON.parse(zapisane) : [];
  });
  
  const [czyOnline, setCzyOnline] = useState(navigator.onLine);
  const rankingRef = useRef(null);
  
  // stany to: 'nic', 'trzymanie', 'gotowy', 'odliczanie'
  const [stan, setStan] = useState('nic'); 
  
  // ref do stanu zeby sie react nie gubil w eventach
  const stanRef = useRef('nic');
  stanRef.current = stan;

  const czasomierzGotowosci = useRef(null);
  const dopieroCoZatrzymany = useRef(false);

  // automatyczny zapis do localStorage przy kazdej zmianie
  useEffect(() => {
    localStorage.setItem('cubemaster_wyniki', JSON.stringify(wyniki));
  }, [wyniki]);

  // funkcja do synchronizacji danych z baza MySQL przez backend
  const synchronizujDane = async (obecneWyniki = wyniki) => {
    if (!navigator.onLine) return;

    try {
      const usunieteZapisane = JSON.parse(localStorage.getItem('cubemaster_usuniete')) || [];
      
      const odpowiedz = await fetch('http://localhost:5000/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wyniki: obecneWyniki,
          usuniete: usunieteZapisane
        })
      });

      if (odpowiedz.ok === true) {
        const daneZBazy = await odpowiedz.json();
        
        // oznaczamy wszystkie wyniki z bazy jako zsynchronizowane
        const zsynchronizowane = daneZBazy.map(item => ({
          ...item,
          synced: true,
          isDnf: item.isDnf === 1 || item.isDnf === true,
          isPlusTwo: item.isPlusTwo === 1 || item.isPlusTwo === true
        }));

        setWyniki(zsynchronizowane);
        localStorage.setItem('cubemaster_wyniki', JSON.stringify(zsynchronizowane));
        localStorage.setItem('cubemaster_usuniete', JSON.stringify([]));

        // aktualizujemy ranking dnia o dzisiejsze ułożenia
        if (rankingRef.current) {
          zsynchronizowane.forEach(w => {
            const dataUlozenia = new Date(Number(w.id));
            const dzis = new Date();
            if (dataUlozenia.toDateString() === dzis.toDateString()) {
              rankingRef.current.dodajWynik(w.id, w.value, w.isDnf, w.isPlusTwo, w.scramble || '', w.cubeType);
            }
          });
        }
      }
    } catch (e) {
      console.log('Brak polaczenia z serwerem lub blad:', e);
    }
  };

  // nasluchiwanie zmiany statusu internetu
  useEffect(() => {
    const obslugaOnline = () => {
      setCzyOnline(true);
      synchronizujDane();
    };
    const obslugaOffline = () => {
      setCzyOnline(false);
    };

    window.addEventListener('online', obslugaOnline);
    window.addEventListener('offline', obslugaOffline);

    // pierwsza synchronizacja przy wejsciu na strone
    synchronizujDane();

    return () => {
      window.removeEventListener('online', obslugaOnline);
      window.removeEventListener('offline', obslugaOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const solveId = Date.now();
      const nowyWynik = {
        id: String(solveId),
        value: czas,
        cubeType: props.cubeType,
        scramble: props.scramble || '',
        isDnf: false,
        isPlusTwo: false,
        synced: false // nowo dodany lokalny rekord
      };

      const noweWyniki = [...wyniki, nowyWynik];
      setWyniki(noweWyniki);
      localStorage.setItem('cubemaster_wyniki', JSON.stringify(noweWyniki));

      if (rankingRef.current) {
        rankingRef.current.dodajWynik(solveId, czas, false, false, props.scramble || '');
      }

      if (props.onSolveComplete) {
        props.onSolveComplete();
      }

      // natychmiastowa proba synchronizacji z baza danych
      synchronizujDane(noweWyniki);
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
    const noweWyniki = wyniki.map((w) => {
      if (String(w.id) === String(id)) {
        const nowaDnf = !w.isDnf;
        if (rankingRef.current) {
          rankingRef.current.ustawDnf(id, nowaDnf);
        }
        return { ...w, isDnf: nowaDnf, synced: false };
      }
      return w;
    });

    setWyniki(noweWyniki);
    localStorage.setItem('cubemaster_wyniki', JSON.stringify(noweWyniki));
    synchronizujDane(noweWyniki);
  };

  const zmienPlusTwo = (id) => {
    const noweWyniki = wyniki.map((w) => {
      if (String(w.id) === String(id)) {
        const nowaPlusTwo = !w.isPlusTwo;
        if (rankingRef.current) {
          rankingRef.current.ustawPlusTwo(id, nowaPlusTwo);
        }
        return { ...w, isPlusTwo: nowaPlusTwo, synced: false };
      }
      return w;
    });

    setWyniki(noweWyniki);
    localStorage.setItem('cubemaster_wyniki', JSON.stringify(noweWyniki));
    synchronizujDane(noweWyniki);
  };

  const usunWynikZeWszystkich = (id) => {
    // jesli rekord byl zsynchronizowany z baza, dodajemy go do kolejki usunietych
    const doUsuniecia = wyniki.find(w => String(w.id) === String(id));
    if (doUsuniecia && doUsuniecia.synced === true) {
      const usunieteZapisane = JSON.parse(localStorage.getItem('cubemaster_usuniete')) || [];
      localStorage.setItem('cubemaster_usuniete', JSON.stringify([...usunieteZapisane, id]));
    }

    const noweWyniki = wyniki.filter((w) => String(w.id) !== String(id));
    setWyniki(noweWyniki);
    localStorage.setItem('cubemaster_wyniki', JSON.stringify(noweWyniki));

    if (rankingRef.current) {
      rankingRef.current.usunWynik(id);
    }

    synchronizujDane(noweWyniki);
  };

  const najlepszyCzas = (lista) => {
    const poprawne = lista.filter((w) => !w.isDnf);
    if (poprawne.length === 0) return '-';
    const czasy = poprawne.map((w) => w.isPlusTwo ? w.value + 2000 : w.value);
    const min = Math.min(...czasy);
    return formatujCzas(min) + 's';
  };

  const sredniaSuma = (lista) => {
    const poprawne = lista.filter((w) => !w.isDnf);
    if (poprawne.length === 0) return '-';
    const czasy = poprawne.map((w) => w.isPlusTwo ? w.value + 2000 : w.value);
    const suma = czasy.reduce((acc, w) => acc + w, 0);
    const avg = suma / czasy.length;
    return formatujCzas(avg) + 's';
  };

  const obliczAo5 = (lista) => {
    const poprawne = lista.filter((w) => !w.isDnf);
    if (poprawne.length < 5) return '-';
    const ostatnie5 = poprawne.slice(-5).map((w) => w.isPlusTwo ? w.value + 2000 : w.value);
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

    const czasy = poprawne.map((w) => w.isPlusTwo ? w.value + 2000 : w.value);
    for (let i = 0; i <= czasy.length - 5; i++) {
      const grupa5 = czasy.slice(i, i + 5);
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

  const wynikiDlaKostki = wyniki.filter(w => String(w.cubeType) === String(props.cubeType));

  const wyczyscKategorie = () => {
    if (window.confirm(`Czy chcesz wyczyścić historię dla kostki ${props.cubeType}?`)) {
      const doUsuniecia = wyniki.filter(w => String(w.cubeType) === String(props.cubeType) && w.synced === true);
      if (doUsuniecia.length > 0) {
        const usunieteZapisane = JSON.parse(localStorage.getItem('cubemaster_usuniete')) || [];
        localStorage.setItem('cubemaster_usuniete', JSON.stringify([...usunieteZapisane, ...doUsuniecia.map(w => w.id)]));
      }
      const noweWyniki = wyniki.filter(w => String(w.cubeType) !== String(props.cubeType));
      setWyniki(noweWyniki);
      localStorage.setItem('cubemaster_wyniki', JSON.stringify(noweWyniki));
      synchronizujDane(noweWyniki);
    }
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

      {/* Lewy panel - Wybór kostki, Historia i Statystyki */}
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
            <option value="square_1">Square-1</option>
            <option value="pyraminx">Pyraminx</option>
            <option value="skewb">Skewb</option>
          </select>
        </div>

        <div className="times-history-container">
          <div className="times-history-title">
            <span>Historia czasów</span>
            {wynikiDlaKostki.length > 0 && (
              <button className="clear-history-btn" onClick={wyczyscKategorie}>
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
              {wynikiDlaKostki.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ color: '#666', fontStyle: 'italic', paddingTop: '15px', textAlign: 'center' }}>
                    Brak czasów
                  </td>
                </tr>
              ) : (
                wynikiDlaKostki.map((item, index) => (
                  <tr key={item.id} style={item.isDnf ? { opacity: 0.6 } : {}}>
                    <td style={{ textAlign: 'center', color: item.isDnf ? 'rgba(255, 255, 255, 0.3)' : 'inherit' }}>
                      {item.cubeType || '3x3'} {item.synced ? '☁️' : '⏳'}
                    </td>
                    <td style={{ 
                      fontWeight: '600', 
                      color: item.isDnf ? 'rgba(255, 255, 255, 0.4)' : '#3498db', 
                      textAlign: 'center',
                      textDecoration: item.isDnf ? 'line-through' : 'none' 
                    }}>
                      {formatujCzas(item.isPlusTwo ? item.value + 2000 : item.value)}s
                      {item.isPlusTwo && <span style={{ fontSize: '0.75rem', color: '#e74c3c', marginLeft: '4px' }}>+2</span>}
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
                <td className="stats-value accent">{najlepszyCzas(wynikiDlaKostki)}</td>
              </tr>
              <tr>
                <td className="stats-label">Średnia sesji:</td>
                <td className="stats-value">{sredniaSuma(wynikiDlaKostki)}</td>
              </tr>
              <tr>
                <td className="stats-label">Aktualny Ao5:</td>
                <td className="stats-value highlight">{obliczAo5(wynikiDlaKostki)}</td>
              </tr>
              <tr>
                <td className="stats-label">Najlepszy Ao5:</td>
                <td className="stats-value highlight">{najlepszeAo5(wynikiDlaKostki)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Prawy panel - Ranking Dnia */}
      <div className="sidebar-container-right">
        <RankingDnia 
          ref={rankingRef} 
          cubeType={props.cubeType} 
          onToggleDnf={zmienDnf}
          onTogglePlusTwo={zmienPlusTwo}
          onDeleteSolve={usunWynikZeWszystkich}
        />
      </div>

    </div>
  );
};

export default Timer;