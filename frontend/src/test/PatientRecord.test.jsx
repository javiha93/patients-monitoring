import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PatientRecord from '../pages/PatientRecord'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { displayName: 'Gregory House', role: 'Medicina' }, loginUser: vi.fn(), logout: vi.fn() }),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockPatient = {
  id: 1, nhc: 'NHC-001', firstName: 'Ana', lastName: 'García',
  birthDate: '1985-03-15', sex: 'female',
  activeAdmission: { id: 10, admissionDate: '2024-01-10T08:30:00', matCategory: 'Fiebre', location: 'B1' },
}

vi.mock('../services/patientApi', () => ({
  patientApi: {
    getPatient: vi.fn(() => Promise.resolve({ data: mockPatient })),
    discharge: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

vi.mock('../services/vitalsApi', () => ({
  vitalsApi: {
    getByAdmission: vi.fn(() => Promise.resolve({ data: [] })),
    getHistorical: vi.fn(() => Promise.resolve({ data: { content: [], hasMore: false } })),
    create: vi.fn(() => Promise.resolve({ data: {} })),
    update: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('../services/insightsApi', () => ({
  insightsApi: {
    getByPatientAdmission: vi.fn(() => Promise.resolve({ data: [] })),
    getDismissals: vi.fn(() => Promise.resolve({ data: [] })),
  },
}))

vi.mock('../services/nursingApi', () => ({
  nursingApi: {
    getByAdmission: vi.fn(() => Promise.resolve({ data: [] })),
    getHistorical: vi.fn(() => Promise.resolve({ data: { content: [], hasMore: false } })),
  },
}))

vi.mock('../services/prescriptionApi', () => ({
  prescriptionApi: {
    getByAdmission: vi.fn(() => Promise.resolve({ data: [] })),
  },
}))

vi.mock('../services/deviceApi', () => ({
  deviceApi: {
    getByAdmission: vi.fn(() => Promise.resolve({ data: [] })),
    create: vi.fn(() => Promise.resolve({ data: {} })),
    update: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve()),
    hasActiveByType: vi.fn(() => Promise.resolve({ data: false })),
    getActiveDrains: vi.fn(() => Promise.resolve({ data: [] })),
  },
}))

function renderRecord() {
  return render(
    <MemoryRouter initialEntries={['/patient/1']}>
      <Routes>
        <Route path="/patient/:id" element={<PatientRecord />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PatientRecord: renderizado sin errores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza la ficha del paciente sin error de hooks', async () => {
    renderRecord()
    await waitFor(() => {
      expect(screen.getByText('Constantes vitales')).toBeInTheDocument()
    })
  })

  it('muestra el estado de carga antes de recibir datos', () => {
    renderRecord()
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('muestra las pestañas de constantes y enfermería', async () => {
    renderRecord()
    await waitFor(() => {
      expect(screen.getByText('Constantes vitales')).toBeInTheDocument()
      expect(screen.getByText('Valoración enfermería')).toBeInTheDocument()
    })
  })

  it('muestra botón de alta hospitalaria cuando hay ingreso activo', async () => {
    renderRecord()
    await waitFor(() => {
      expect(screen.getByText('Alta hospitalaria')).toBeInTheDocument()
    })
  })
})
