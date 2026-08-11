import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import CounterPage from './pages/CounterPage'
import DeckOddsPage from './pages/DeckOddsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/g/:gameId" element={<CounterPage />} />
      <Route path="/tools/deck-odds" element={<DeckOddsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
