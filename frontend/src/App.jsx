import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import PatientList from './pages/PatientList'
import PatientRecord from './pages/PatientRecord'
import PatientHistory from './pages/PatientHistory'
import PatientMedication from './pages/PatientMedication'
import DischargedSearch from './pages/DischargedSearch'

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden bg-slate-100">
          <Routes>
            <Route path="/" element={<PatientList />} />
            <Route path="/patient/:id" element={<PatientRecord />} />
            <Route path="/patient/:id/history" element={<PatientHistory />} />
            <Route path="/patient/:id/medication" element={<PatientMedication />} />
            <Route path="/discharged" element={<DischargedSearch />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
