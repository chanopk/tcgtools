import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import CounterPage from './pages/CounterPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/g/:gameId" element={<CounterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
