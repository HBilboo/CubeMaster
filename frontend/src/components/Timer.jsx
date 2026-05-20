import React, { useState, useEffect } from 'react';

const Timer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

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

  // Style w zmiennych dla czytelności
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh', // Cała wysokość ekranu
      backgroundColor: '#1a1a1a', // Ciemne tło (lepiej wygląda dla timera)
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    },
    instruction: {
      fontSize: '1.2rem',
      color: '#888',
      marginBottom: '40px'
    },
    timerDisplay: {
      fontSize: '10rem', // Bardzo duże cyfry
      fontWeight: 'bold',
      fontFamily: 'monospace',
      color: isRunning ? '#2ecc71' : '#ffffff',
      margin: '20px 0'
    },
    resetBtn: {
      padding: '12px 30px',
      fontSize: '1rem',
      backgroundColor: '#333',
      color: '#fff',
      border: '1px solid #444',
      borderRadius: '8px',
      cursor: 'pointer',
      marginTop: '20px',
      transition: 'background 0.2s'
    },
    resultSection: {
      marginTop: '100px', // Duży odstęp od timera
      textAlign: 'center',
      padding: '20px',
      borderTop: '1px solid #333',
      width: '100%',
      maxWidth: '400px'
    },
    resultText: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#3498db'
    }
  };

  return (
    <div style={styles.container}>
      {/* Instrukcja */}
      <div style={styles.instruction}>
        {isRunning ? 'Mierzenie czasu...' : 'Naciśnij SPACJĘ, aby zacząć'}
      </div>
      
      {/* Licznik */}
      <div style={styles.timerDisplay}>
        {formatTime(time)}
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
    </div>
  );
};

export default Timer;