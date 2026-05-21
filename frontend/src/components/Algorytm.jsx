import React, { useState, useEffect } from 'react';


const chars = [
  "U", "U'", "U2", "D", "D'", "D2", "L", "L'",
   "L2", "R", "R'", "R2", "F", "F'", "F2", "B"
   , "B'", "B2"
];

function generateSequence(length = 9) {
  const result = [];

  for (let i = 0; i < length; i++) {
    let randomChar;

    do {
      randomChar = chars[Math.floor(Math.random() * chars.length)];
    } while (result[i - 1] === randomChar);

    result.push(randomChar);
  }

  return result;
}

export default function App() {
  const [items, setItems] = useState([]);

  return (
    <div>
      <button onClick={() => setItems(generateSequence())}>
        Losuj
      </button>

      <div style={{ marginTop: 20 }}>
        {items.join(" ")}
      </div>
    </div>
  );
}