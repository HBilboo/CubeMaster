import React from 'react';

export default function Algorytm(props) {
  return (
    <div style={{
      marginTop: '15px',
      padding: '10px 20px',
      backgroundColor: '#1f242d',
      borderRadius: '8px',
      border: '1px solid #2d3748',
      display: 'inline-block',
      maxWidth: '90%',
      wordBreak: 'break-word',
      boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
    }}>
      <div style={{
        fontSize: '1.4rem',
        fontWeight: '500',
        fontFamily: 'monospace',
        color: '#ffb300',
        letterSpacing: '2px',
        lineHeight: '1.6',
        textShadow: '0 0 8px rgba(255, 179, 0, 0.2)'
      }}>
        {props.scramble ? props.scramble : 'Generowanie algorytmu...'}
      </div>
    </div>
  );
}