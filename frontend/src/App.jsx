import './App.css'
import Timer from './components/Timer'
import Algorytm from './components/Algorytm'

function App() {
  return (
    <div className="App">
      <header style={{ padding: '20px', backgroundColor: '#282c34', color: 'white', textAlign: 'center' }}>
        <h1>CubeMaster
          <br />
          <Algorytm />
        </h1>
        
        
      </header>
      <main>
        <Timer />
      </main>
    </div>
  )
}

export default App
