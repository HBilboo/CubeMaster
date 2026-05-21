import React, { useState, useEffect } from 'react';

const Timer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [times, setTimes] = useState([]);

  // Obsługa odliczania czasu
  useEffect(() => {
    let interval;

    if (isRunning) {
      const startTime = Date.now();

      interval = setInterval(() => {
        setTime(Date.now() - startTime);
      }, 10);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isRunning]);

  // Zapisywanie zakończonych czasów do historii
  useEffect(() => {
    if (!isRunning && time > 0) {
      setTimes((prevTimes) => [
        ...prevTimes,
        {
          id: Date.now(),
          value: time,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Obsługa spacji (Start / Stop)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (isRunning) {
          setIsRunning(false);
        } else {
          setTime(0);
          setIsRunning(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning]);

  const formatTime = (ms) => {
    return (ms / 1000).toFixed(2);
  };

  // Przełączanie statusu DNF pojedynczego czasu
  const toggleDnf = (id) => {
    setTimes((prevTimes) =>
      prevTimes.map((t) => (t.id === id ? { ...t, isDnf: !t.isDnf } : t))
    );
  };

  // Statystyka: Najlepszy singiel
  const calculateBestSingle = (solvesList) => {
    const validSolves = solvesList.filter((t) => !t.isDnf);
    if (validSolves.length === 0) return '-';
    const min = Math.min(...validSolves.map((t) => t.value));
    return formatTime(min) + 's';
  };

  // Statystyka: Średnia całej sesji (Session Mean)
  const calculateSessionMean = (solvesList) => {
    const validSolves = solvesList.filter((t) => !t.isDnf);
    if (validSolves.length === 0) return '-';
    const sum = validSolves.reduce((acc, t) => acc + t.value, 0);
    const avg = sum / validSolves.length;
    return formatTime(avg) + 's';
  };

  // Statystyka: Aktualny Ao5 (Average of 5) - zgodnie z zasadami WCA (odrzucamy najlepszy i najgorszy, wyciągamy średnią z pozostałych 3)
  const calculateAo5 = (solvesList) => {
    const validSolves = solvesList.filter((t) => !t.isDnf);
    if (validSolves.length < 5) return '-';
    // Pobieramy 5 ostatnich czasów
    const last5 = validSolves.slice(-5).map((t) => t.value);
    const min = Math.min(...last5);
    const max = Math.max(...last5);
    const sum = last5.reduce((acc, val) => acc + val, 0);
    const avg = (sum - min - max) / 3;
    return formatTime(avg) + 's';
  };

  // Statystyka: Najlepszy Ao5 w sesji (Best Ao5)
  const calculateBestAo5 = (solvesList) => {
    const validSolves = solvesList.filter((t) => !t.isDnf);
    if (validSolves.length < 5) return '-';
    let bestAvg = Infinity;

    // Przesuwamy okno o wielkości 5 po całej sesji
    for (let i = 0; i <= validSolves.length - 5; i++) {
      const group5 = validSolves.slice(i, i + 5).map((t) => t.value);
      const min = Math.min(...group5);
      const max = Math.max(...group5);
      const sum = group5.reduce((acc, val) => acc + val, 0);
      const avg = (sum - min - max) / 3;

      if (avg < bestAvg) {
        bestAvg = avg;
      }
    }

    return bestAvg === Infinity ? '-' : formatTime(bestAvg) + 's';
  };

  // Style dla pozostałych elementów interfejsu (stylowanie panelu bocznego, tabeli, itp. jest w index.css)
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 150px)', // Dostosowanie do wysokości nagłówka
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      backgroundColor: '#1a1a1a', // Ciemne tło
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
      fontSize: '10rem', // Bardzo duże cyfry
      fontWeight: 'bold',
      fontFamily: 'monospace',
      color: isRunning ? '#2ecc71' : '#ffffff',
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
      {/* Panel boczny z historią i statystykami (po lewej stronie) */}
      <div className="sidebar-container">
        {/* Panel z historią czasów */}
        <div className="times-history-container">
          <div className="times-history-title">
            <span>Historia czasów</span>
            {times.length > 0 && (
              <button className="clear-history-btn" onClick={() => setTimes([])}>
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
              {times.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ color: '#666', fontStyle: 'italic', paddingTop: '15px', textAlign: 'center' }}>
                    Brak czasów
                  </td>
                </tr>
              ) : (
                times.map((item, index) => (
                  <tr key={item.id} style={item.isDnf ? { opacity: 0.6 } : {}}>
                    <td style={{ textAlign: 'center', color: item.isDnf ? 'rgba(255, 255, 255, 0.3)' : 'inherit' }}>3x3x3</td>
                    <td style={{ 
                      fontWeight: '600', 
                      color: item.isDnf ? 'rgba(255, 255, 255, 0.4)' : '#3498db', 
                      textAlign: 'center',
                      textDecoration: item.isDnf ? 'line-through' : 'none' 
                    }}>
                      {formatTime(item.value)}s
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`dnf-btn ${item.isDnf ? 'active' : ''}`}
                        onClick={() => toggleDnf(item.id)}
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

        {/* Panel ze statystykami Ao5, średnią itp. */}
        <div className="stats-container">
          <div className="stats-title">Statystyki sesji</div>
          <table className="stats-table">
            <tbody>
              <tr>
                <td className="stats-label">Najlepszy singiel:</td>
                <td className="stats-value accent">{calculateBestSingle(times)}</td>
              </tr>
              <tr>
                <td className="stats-label">Średnia sesji:</td>
                <td className="stats-value">{calculateSessionMean(times)}</td>
              </tr>
              <tr>
                <td className="stats-label">Aktualny Ao5:</td>
                <td className="stats-value highlight">{calculateAo5(times)}</td>
              </tr>
              <tr>
                <td className="stats-label">Najlepszy Ao5:</td>
                <td className="stats-value highlight">{calculateBestAo5(times)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Wynik na samym dole */}
      <div style={styles.resultSection}>
        {!isRunning && time > 0 ? (
          <>
            <p style={{ color: '#888', marginBottom: '5px' }}>Twój czas:</p>
            <div style={styles.resultText}>{formatTime(time)}s</div>
          </>
        ) : (
          <p style={{ color: '#444' }}>Oczekiwanie na pierwsze ułożenie</p>
        )}
      </div>

      {/* Instrukcja */}
      <div style={styles.instruction}>
        {isRunning ? 'Mierzenie czasu...' : 'Naciśnij SPACJĘ, aby zacząć'}
      </div>

      {/* Licznik (Timer) */}
      <div style={styles.timerDisplay}>
        {formatTime(time)}
      </div>
    </div>
  );
};

export default Timer;