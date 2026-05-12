import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PatientTests from '../pages/PatientTests'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { displayName: 'Javier Herrada', role: 'Enfermería' }, loginUser: vi.fn(), logout: vi.fn() }),
}))

const mockPatient = {
  id: 1, nhc: 'NHC-001', firstName: 'Ana', lastName: 'García',
  birthDate: '1985-03-15', sex: 'female',
  activeAdmission: { id: 10, admissionDate: '2024-01-10T08:00:00' },
}

const mockTests = [
  { id: 1, category: 'analitica', label: 'Hemograma + Bioquímica', status: 'pending_validation', requestedAt: '2024-01-10T09:00:00', requestedBy: 'Dr. García', externalId: null, results: [] },
  { id: 2, category: 'cultivo', label: 'Hemocultivo x2', status: 'pending_receipt', requestedAt: '2024-01-10T10:00:00', requestedBy: 'Dr. López', externalId: 'LAB-001', results: [] },
  { id: 3, category: 'analitica', label: 'Coagulación', status: 'results', requestedAt: '2024-01-10T08:00:00', requestedBy: 'Dr. García', externalId: 'LAB-002', results: [
    { id: 1, category: 'Coagulación', name: 'INR', value: '1.1', unit: '', refRange: '0.8-1.2', flag: 'normal' },
    { id: 2, category: 'Coagulación', name: 'Fibrinógeno', value: '450', unit: 'mg/dL', refRange: '200-400', flag: 'high' },
  ]},
]

vi.mock('../services/patientApi', () => ({
  patientApi: {
    getPatient: vi.fn(() => Promise.resolve({ data: mockPatient })),
  },
}))

vi.mock('../services/labTestApi', () => ({
  labTestApi: {
    getByAdmission: vi.fn(() => Promise.resolve({ data: [] })),
    getById: vi.fn(() => Promise.resolve({ data: {} })),
    create: vi.fn(() => Promise.resolve({ data: { id: 4 } })),
    validate: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve()),
  },
}))

import { labTestApi as mockLabTestApi } from '../services/labTestApi'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/patient/1/tests']}>
      <Routes>
        <Route path="/patient/:id/tests" element={<PatientTests />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PatientTests: Pruebas de laboratorio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: mockTests })
  })

  it('muestra la lista de pruebas con sus estados', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Hemograma + Bioquímica'))
    expect(screen.getByText('Hemocultivo x2')).toBeInTheDocument()
    expect(screen.getByText('Coagulación')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de validar')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de recibir')).toBeInTheDocument()
    expect(screen.getByText('Resultados')).toBeInTheDocument()
  })

  it('muestra el nombre del paciente en header y action bar', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Hemograma + Bioquímica'))
    expect(screen.getAllByText('García, Ana').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/NHC-001/).length).toBeGreaterThanOrEqual(1)
  })

  it('abre modal de nueva prueba al clicar Solicitar', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Solicitar prueba'))
    fireEvent.click(screen.getByText('Solicitar prueba'))
    expect(screen.getByText('Solicitar prueba de laboratorio')).toBeInTheDocument()
  })

  it('clicar prueba pending_validation abre modal de validación', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Hemograma + Bioquímica'))
    fireEvent.click(screen.getByText('Hemograma + Bioquímica'))
    expect(screen.getByText('Validar prueba')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/LAB-2024/)).toBeInTheDocument()
  })

  it('clicar prueba con resultados abre visor de resultados', async () => {
    mockLabTestApi.getById.mockResolvedValue({ data: mockTests[2] })
    renderPage()
    await waitFor(() => screen.getByText('Coagulación'))
    fireEvent.click(screen.getByText('Coagulación'))
    await waitFor(() => screen.getByText('INR'))
    expect(screen.getByText('Fibrinógeno')).toBeInTheDocument()
    expect(screen.getByText('450')).toBeInTheDocument()
  })

  it('muestra mensaje vacío cuando no hay pruebas', async () => {
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: [] })
    renderPage()
    await waitFor(() => screen.getByText('No hay pruebas de laboratorio solicitadas'))
  })

  it('muestra externalId en pruebas validadas', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Hemocultivo x2'))
    expect(screen.getByText(/LAB-001/)).toBeInTheDocument()
  })
})
