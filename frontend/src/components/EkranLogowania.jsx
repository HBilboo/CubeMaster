import React, { useState } from 'react';

export default function EkranLogowania(props) {
  const [wpisanyNick, setWpisanyNick] = useState('');

  const obslugaWejscia = (e) => {
    e.preventDefault();
    if (wpisanyNick.trim() === '') {
      alert('Musisz wpisac nazwe uzytkownika!');
      return;
    }
    props.onLogin(wpisanyNick.trim());
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#111317',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        padding: '40px',
        backgroundColor: '#1f242d',
        borderRadius: '12px',
        border: '1px solid #2d3748',
        boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h2 style={{
          margin: '0 0 10px 0',
          fontSize: '2rem',
          color: '#ffffff',
          fontWeight: '700'
        }}>
          Cube<span style={{ color: '#ffb300' }}>Master</span>
        </h2>
        <p style={{ color: '#a0aec0', fontSize: '0.95rem', marginBottom: '30px' }}>
          Zaloguj sie, aby mierzyc i synchronizowac czasy!
        </p>

        {/* Kontrolowany formularz logowania */}
        <form onSubmit={obslugaWejscia}>
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#ffb300',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              letterSpacing: '0.5px'
            }}>
              NAZWA UŻYTKOWNIKA:
            </label>
            <input
              type="text"
              value={wpisanyNick}
              onChange={(e) => setWpisanyNick(e.target.value)}
              maxLength={15}
              placeholder="Wpisz swoj nick..."
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#111317',
                color: 'white',
                border: '1px solid #4a5568',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#ffb300',
              color: '#111317',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1.05rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 6px rgba(255, 179, 0, 0.2)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#ffa000'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ffb300'}
          >
            ZALOGUJ SIĘ
          </button>
        </form>
      </div>
    </div>
  );
}
