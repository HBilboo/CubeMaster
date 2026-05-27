import React, { useState, useImperativeHandle, forwardRef } from 'react';

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const RankingDnia = forwardRef(({ cubeType, onToggleDnf, onTogglePlusTwo, onDeleteSolve }, ref) => {
  const [nick, setNick] = useState(() => {
    return localStorage.getItem('cubemaster_user_nick') || 'Zawodnik';
  });

  const [activeSolveId, setActiveSolveId] = useState(null);

  const [rankingi, setRankingi] = useState(() => {
    const dzis = getTodayDateString();
    const zapisane = localStorage.getItem('cubemaster_daily_ranking');
    if (zapisane) {
      try {
        const sparsowane = JSON.parse(zapisane);
        // Jeśli dane pochodzą z dzisiaj, ładujemy je i odfiltrowujemy boty (isMock: true)
        if (sparsowane.data === dzis) {
          return (sparsowane.wpisy || []).filter(w => !w.isMock);
        }
      } catch (e) {
        console.error('Błąd wczytywania rankingu', e);
      }
    }
    
    // Zaczynamy z pustym rankingiem
    localStorage.setItem('cubemaster_daily_ranking', JSON.stringify({ data: dzis, wpisy: [] }));
    return [];
  });

  const zmienNick = (nowyNick) => {
    setNick(nowyNick);
    localStorage.setItem('cubemaster_user_nick', nowyNick);
  };

  const wyczyscRanking = () => {
    if (window.confirm('Czy na pewno chcesz wyczyścić dzisiejszy ranking dla wszystkich kostek?')) {
      const dzis = getTodayDateString();
      setRankingi([]);
      localStorage.setItem('cubemaster_daily_ranking', JSON.stringify({ data: dzis, wpisy: [] }));
      setActiveSolveId(null);
    }
  };

  useImperativeHandle(ref, () => ({
    dodajWynik(id, czasMs, isDnf = false, isPlusTwo = false, scramble = '', customCubeType = '') {
      const dzis = getTodayDateString();
      const nowyWpis = {
        id: String(id),
        name: nick,
        value: czasMs,
        cubeType: customCubeType || cubeType,
        date: dzis,
        isDnf: isDnf,
        isPlusTwo: isPlusTwo,
        scramble: scramble
      };

      setRankingi(stareWpisy => {
        let aktualneWpisy = [...stareWpisy];
        
        // Zabezpieczenie przed przejściem na kolejny dzień bez odświeżania strony
        const zapisane = localStorage.getItem('cubemaster_daily_ranking');
        if (zapisane) {
          try {
            const sparsowane = JSON.parse(zapisane);
            if (sparsowane.data !== dzis) {
              aktualneWpisy = []; // Wyczyszczenie wczorajszych wpisów
            }
          } catch(e) {}
        }

        // Usuwamy stare wystąpienie o tym samym ID przed dodaniem
        const oczyszczone = aktualneWpisy.filter(w => String(w.id) !== String(id));
        const noweWpisy = [...oczyszczone, nowyWpis];
        localStorage.setItem('cubemaster_daily_ranking', JSON.stringify({ data: dzis, wpisy: noweWpisy }));
        return noweWpisy;
      });
    },
    usunWynik(id) {
      setRankingi(stareWpisy => {
        const noweWpisy = stareWpisy.filter(w => String(w.id) !== String(id));
        const dzis = getTodayDateString();
        localStorage.setItem('cubemaster_daily_ranking', JSON.stringify({ data: dzis, wpisy: noweWpisy }));
        return noweWpisy;
      });
      if (String(activeSolveId) === String(id)) {
        setActiveSolveId(null);
      }
    },
    ustawDnf(id, isDnf) {
      setRankingi(stareWpisy => {
        const noweWpisy = stareWpisy.map(w => String(w.id) === String(id) ? { ...w, isDnf: isDnf } : w);
        const dzis = getTodayDateString();
        localStorage.setItem('cubemaster_daily_ranking', JSON.stringify({ data: dzis, wpisy: noweWpisy }));
        return noweWpisy;
      });
    },
    ustawPlusTwo(id, isPlusTwo) {
      setRankingi(stareWpisy => {
        const noweWpisy = stareWpisy.map(w => String(w.id) === String(id) ? { ...w, isPlusTwo: isPlusTwo } : w);
        const dzis = getTodayDateString();
        localStorage.setItem('cubemaster_daily_ranking', JSON.stringify({ data: dzis, wpisy: noweWpisy }));
        return noweWpisy;
      });
    }
  }));

  // Filtrujemy rekordy po typie kostki i sortujemy: najpierw poprawne czasy rosnąco, potem DNF na koniec.
  // Przy sortowaniu uwzględniamy karę +2 sekundy.
  const dzisiejszeWynikiDlaKostki = rankingi
    .filter(w => w.cubeType === cubeType)
    .sort((a, b) => {
      if (a.isDnf && !b.isDnf) return 1;
      if (!a.isDnf && b.isDnf) return -1;
      const valA = a.isPlusTwo ? a.value + 2000 : a.value;
      const valB = b.isPlusTwo ? b.value + 2000 : b.value;
      return valA - valB;
    })
    .slice(0, 10);

  const formatujCzas = (ms) => {
    return (ms / 1000).toFixed(2);
  };

  return (
    <div className="ranking-container" style={{ position: 'relative' }}>
      
      {/* Tło do zamykania menu po kliknięciu poza nie */}
      {activeSolveId !== null && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 90,
            background: 'transparent'
          }}
          onClick={() => setActiveSolveId(null)}
        />
      )}

      <div className="ranking-title-row">
        <span className="ranking-title">Ranking Dnia ({cubeType})</span>
        <button className="reset-ranking-btn" onClick={wyczyscRanking} title="Wyczyść ranking dnia">
          Wyczyść
        </button>
      </div>


      <table className="ranking-table">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>Poz.</th>
            <th style={{ textAlign: 'left' }}>Gracz</th>
            <th style={{ textAlign: 'right' }}>Czas</th>
            <th style={{ width: '50px', textAlign: 'center' }}>Opcje</th>
          </tr>
        </thead>
        <tbody>
          {dzisiejszeWynikiDlaKostki.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ color: '#666', fontStyle: 'italic', padding: '15px 0', textAlign: 'center' }}>
                Brak ułożeń na dziś
              </td>
            </tr>
          ) : (
            dzisiejszeWynikiDlaKostki.map((item, index) => {
              const pozycja = index + 1;
              let medalClass = '';
              let medalEmoji = '';
              
              // Medale tylko dla poprawnych ułożeń
          

              return (
                <tr key={item.id} className="user-row" style={item.isDnf ? { opacity: 0.5 } : {}}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    {item.isDnf ? (
                      <span className="rank-number">—</span>
                    ) : medalEmoji ? (
                      <span className={`rank-medal ${medalClass}`} title={`Miejsce ${pozycja}`}>
                        {medalEmoji}
                      </span>
                    ) : (
                      <span className="rank-number">{pozycja}</span>
                    )}
                  </td>
                  <td className="player-name" style={{ textDecoration: item.isDnf ? 'line-through' : 'none' }}>
                    {item.name} <span className="you-tag">(Ty)</span>
                  </td>
                  <td style={{ 
                    textAlign: 'right', 
                    fontWeight: '600', 
                    color: item.isDnf ? 'rgba(255, 255, 255, 0.4)' : '#ffb300',
                    textDecoration: item.isDnf ? 'line-through' : 'none'
                  }}>
                    {formatujCzas(item.isPlusTwo ? item.value + 2000 : item.value)}s
                    {item.isPlusTwo && <span style={{ fontSize: '0.7rem', color: '#e74c3c', marginLeft: '3px' }}>+2</span>}
                  </td>
                  <td style={{ textAlign: 'center', position: 'relative' }}>
                    <button
                      className="solve-settings-btn"
                      onClick={() => setActiveSolveId(activeSolveId === item.id ? null : item.id)}
                      title="Ustawienia ułożenia"
                    >
                      ⚙️
                    </button>

                    {activeSolveId === item.id && (
                      <div className="solve-dropdown" style={{ zIndex: 100 }}>
                        <div className="dropdown-scramble">
                          <strong>Scramble:</strong>
                          <code>{item.scramble || 'Brak algorytmu'}</code>
                        </div>
                        <div className="dropdown-divider" />
                        <div className="dropdown-actions">
                          <button
                            className={`dropdown-btn ${item.isDnf ? 'active' : ''}`}
                            onClick={() => {
                              onToggleDnf && onToggleDnf(item.id);
                            }}
                          >
                            {item.isDnf ? 'Wycofaj DNF' : 'Oznacz DNF'}
                          </button>
                          <button
                            className={`dropdown-btn ${item.isPlusTwo ? 'active' : ''}`}
                            onClick={() => {
                              onTogglePlusTwo && onTogglePlusTwo(item.id);
                            }}
                          >
                            {item.isPlusTwo ? 'Wycofaj +2' : 'Oznacz +2'}
                          </button>
                          <button
                            className="dropdown-btn delete-btn"
                            onClick={() => {
                              if (window.confirm('Czy na pewno chcesz usunąć to ułożenie?')) {
                                onDeleteSolve && onDeleteSolve(item.id);
                              }
                            }}
                          >
                            Usuń ułożenie
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
});

export default RankingDnia;
