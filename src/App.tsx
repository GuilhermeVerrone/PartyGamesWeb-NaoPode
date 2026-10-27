import { Route, Routes } from 'react-router-dom'

function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <h1 className="text-4xl font-bold">Não Pode</h1>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}
