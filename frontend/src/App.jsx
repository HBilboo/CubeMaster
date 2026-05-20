import './App.css'
import Timer from './components/Timer'

function App() {
  return (
    <div className="App">
      <header style={{ padding: '20px', backgroundColor: '#282c34', color: 'white', textAlign: 'center' }}>
        <h1>CubeMaster</h1>
      </header>
      <main>
        <Timer />
      </main>
    </div>
  )
}

export default App
