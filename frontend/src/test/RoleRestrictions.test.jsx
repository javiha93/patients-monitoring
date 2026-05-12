import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// ── Shared mocks ──

let mockRole = 'Enfermería'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, displayName: 'Test User', role: mockRole },
    loginUser: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock('../services/insightsApi', () => ({
  insightsApi: {
    getByPatientAdmission: vi.fn(() => Promise.resolve({ data: [] })),
    getDismissals: vi.fn(() => Promise.resolve({ data: [] })),
  },
}))

// ── NursingAssessmentTab tests ──

import NursingAssessmentTab from '../components/NursingAssessmentTab'

vi.mock('../services/nursingApi', () => ({
  nursingApi: {
    getByAdmission: vi.fn(() => Promise.resolve({ data: [] })),
    getHistorical: vi.fn(() => Promise.resolve({ data: { content: [], last: true } })),
    create: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

describe('NursingAssessmentTab — role restrictions', () => {
  it('[KAN-99] Enfermería can see "Nueva valoración" button', async () => {
    mockRole = 'Enfermería'
    render(<NursingAssessmentTab admissionId={10} patientId={1} toast={{ success: vi.fn(), error: vi.fn() }} />)
    await waitFor(() => {
      expect(screen.getByText('Nueva valoración')).toBeInTheDocument()
    })
  })

  it('[KAN-99] Medicina cannot see "Nueva valoración" button', async () => {
    mockRole = 'Medicina'
    render(<NursingAssessmentTab admissionId={10} patientId={1} toast={{ success: vi.fn(), error: vi.fn() }} />)
    await waitFor(() => {
      expect(screen.queryByText('Nueva valoración')).not.toBeInTheDocument()
    })
  })
})

// ── DevicesTab tests ──

import DevicesTab from '../components/DevicesTab'

const mockDevices = [
  { id: 1, admissionId: 10, category: 'vascular', type: 'via_periferica', gauge: '20G', location: 'mano_derecha', lumens: null, material: null, drainNumber: null, region: null, subRegion: null, laterality: null, insertedAt: '2026-05-11T08:00:00', removedAt: null, notes: '' },
]

vi.mock('../services/deviceApi', () => ({
  deviceApi: {
    getByAdmission: vi.fn(() => Promise.resolve({ data: mockDevices })),
    create: vi.fn(() => Promise.resolve({ data: { id: 2 } })),
    update: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve()),
    hasActiveByType: vi.fn(() => Promise.resolve({ data: false })),
    getActiveDrains: vi.fn(() => Promise.resolve({ data: [] })),
  },
}))

describe('DevicesTab — role restrictions', () => {
  it('[KAN-99] Enfermería can see "Añadir" buttons', async () => {
    mockRole = 'Enfermería'
    render(<DevicesTab admissionId={10} patientId={1} toast={{ success: vi.fn(), error: vi.fn() }} />)
    await waitFor(() => {
      expect(screen.getAllByText(/Añadir/).length).toBeGreaterThan(0)
    })
  })

  it('[KAN-99] Medicina cannot see "Añadir" buttons', async () => {
    mockRole = 'Medicina'
    render(<DevicesTab admissionId={10} patientId={1} toast={{ success: vi.fn(), error: vi.fn() }} />)
    await waitFor(() => {
      expect(screen.queryByText(/Añadir/)).not.toBeInTheDocument()
    })
  })
})

// ── MedicationGrid tests ──

import MedicationGrid from '../components/MedicationGrid'

const admDate = new Date()
admDate.setHours(admDate.getHours() - 2)
const admissionDate = admDate.toISOString()

const hour = String(admDate.getHours())
const mockPrescriptions = [
  { id: 1, name: 'Paracetamol', amount: '1000', unit: 'mg', route: 'VO', frequency: 'c/8h', category: 'fixed', scheduledHours: hour, administrations: [], insulinScales: [] },
]

describe('MedicationGrid — role restrictions', () => {
  it('[KAN-99] canSign=true allows cell click', () => {
    const onSign = vi.fn()
    render(<MedicationGrid prescriptions={mockPrescriptions} admissionDate={admissionDate} onDirectSign={onSign} onDirectUnsign={vi.fn()} onOpenInsulinModal={vi.fn()} onOpenEditModal={vi.fn()} currentUser="Test" canSign={true} />)
    // Find a scheduled cell (▶) and click it
    const scheduled = document.querySelector('td[style]') || document.querySelectorAll('td')[1]
    if (scheduled) fireEvent.click(scheduled)
    // Sign behavior tested in MedicationGrid.test.jsx — here we just verify no crash
  })

  it('[KAN-99] canSign=false blocks cell click', () => {
    const onSign = vi.fn()
    const onUnsign = vi.fn()
    render(<MedicationGrid prescriptions={mockPrescriptions} admissionDate={admissionDate} onDirectSign={onSign} onDirectUnsign={onUnsign} onOpenInsulinModal={vi.fn()} onOpenEditModal={vi.fn()} currentUser="Test" canSign={false} />)
    // Click every td — none should trigger sign
    document.querySelectorAll('td').forEach(td => fireEvent.click(td))
    expect(onSign).not.toHaveBeenCalled()
    expect(onUnsign).not.toHaveBeenCalled()
  })
})

// ── PatientRecord tests (Alta hospitalaria) ──

import PatientRecord from '../pages/PatientRecord'

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
    getHistorical: vi.fn(() => Promise.resolve({ data: { content: [], last: true } })),
    create: vi.fn(() => Promise.resolve({ data: {} })),
    update: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve()),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('PatientRecord — role restrictions', () => {
  it('[KAN-99] Medicina can see "Alta hospitalaria" button', async () => {
    mockRole = 'Medicina'
    render(
      <MemoryRouter initialEntries={['/patient/1']}>
        <Routes><Route path="/patient/:id" element={<PatientRecord />} /></Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Alta hospitalaria')).toBeInTheDocument()
    })
  })

  it('[KAN-99] Enfermería cannot see "Alta hospitalaria" button', async () => {
    mockRole = 'Enfermería'
    render(
      <MemoryRouter initialEntries={['/patient/1']}>
        <Routes><Route path="/patient/:id" element={<PatientRecord />} /></Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Constantes vitales')).toBeInTheDocument()
    })
    expect(screen.queryByText('Alta hospitalaria')).not.toBeInTheDocument()
  })
})
