import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import PatientList from './pages/PatientList'
import PatientRecord from './pages/PatientRecord'
import PatientHistory from './pages/PatientHistory'
import PatientMedication from './pages/PatientMedication'
import PatientTests from './pages/PatientTests'
import DischargedSearch from './pages/DischargedSearch'
import Reports from './pages/Reports'
import Login from './pages/Login'

function AppContent() {
  const { user } = useAuth()

  if (!user) return <Login />

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-900">
        <Routes>
          <Route path="/" element={<PatientList />} />
          <Route path="/patient/:id" element={<PatientRecord />} />
          <Route path="/patient/:id/history" element={<PatientHistory />} />
          <Route path="/patient/:id/medication" element={<PatientMedication />} />
          <Route path="/patient/:id/tests" element={<PatientTests />} />
          <Route path="/discharged" element={<DischargedSearch />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
