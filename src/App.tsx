import { Route, Routes } from 'react-router-dom'
import About from './pages/About'
import Home from './pages/Home'
import Play from './pages/Play'
import Result from './pages/Result'
import Setup from './pages/Setup'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/play" element={<Play />} />
      <Route path="/result" element={<Result />} />
    </Routes>
  )
}
