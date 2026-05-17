import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PatientList from '../pages/PatientList'

let mockRole = 'Enfermería'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'nurse1', displayName: 'Test Nurse', role: mockRole },
    loginUser: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock('../services/authApi', () => ({
  getUsersByRole: vi.fn(() => Promise.resolve([])),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const basePatient = {
  id: 1, admissionId: 10, nhc: 'NHC-001', firstName: 'Ana', lastName: 'García',
  birthDate: '1985-03-15', sex: 'female', triageLevel: 2, matCategory: 'Dolor torácico',
  admissionDate: '2024-01-10T08:30:00', location: 'T03', specialty: 'Medicina', status: 'active',
}

const { patientApi } = vi.hoisted(() => ({
  patientApi: {
    listActive: vi.fn(() => Promise.resolve({ data: [] })),
    create: vi.fn(() => Promise.resolve({ data: {} })),
    updateLocation: vi.fn(() => Promise.resolve({ data: {} })),
    updateSpecialty: vi.fn(() => Promise.resolve({ data: {} })),
    assignNurse: vi.fn(() => Promise.resolve({ data: {} })),
    assignDoctor: vi.fn(() => Promise.resolve({ data: {} })),
    unassignNurse: vi.fn(() => Promise.resolve({ data: {} })),
    unassignDoctor: vi.fn(() => Promise.resolve({ data: {} })),
    updateTriage: vi.fn(() => Promise.resolve({ data: {} })),
    markAdmitted: vi.fn(() => Promise.resolve({ data: {} })),
    assignBed: vi.fn(() => Promise.resolve({ data: {} })),
    updateObservations: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))
vi.mock('../services/patientApi', () => ({ patientApi }))

const { locationApi } = vi.hoisted(() => ({
  locationApi: {
    getAllStatus: vi.fn(() => Promise.resolve({ data: [] })),
    updateStatus: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))
vi.mock('../services/locationApi', () => ({ locationApi }))

vi.mock('../services/labTestApi', () => ({
  labTestApi: { create: vi.fn(() => Promise.resolve({ data: {} })) },
}))
vi.mock('../services/ecgApi', () => ({
  ecgApi: { create: vi.fn(() => Promise.resolve({ data: {} })) },
}))
vi.mock('../services/radiologyApi', () => ({
  radiologyApi: { create: vi.fn(() => Promise.resolve({ data: {} })) },
}))
vi.mock('../services/notificationApi', () => ({
  notificationApi: {
    getUnseenLab: vi.fn(() => Promise.resolve({ data: [] })),
    markAllSeen: vi.fn(() => Promise.resolve()),
    markSeenForAdmission: vi.fn(() => Promise.resolve()),
    getUnseenMed: vi.fn(() => Promise.resolve({ data: [] })),
    markAllMedSeen: vi.fn(() => Promise.resolve()),
    markMedSeenForAdmission: vi.fn(() => Promise.resolve()),
  },
}))
vi.mock('../services/vitalsApi', () => ({
  vitalsApi: { create: vi.fn(() => Promise.resolve({ data: {} })) },
}))
vi.mock('../services/nursingApi', () => ({
  nursingApi: { create: vi.fn(() => Promise.resolve({ data: {} })) },
}))

function renderList() {
  return render(
    <MemoryRouter>
      <PatientList />
    </MemoryRouter>
  )
}

afterEach(() => { sessionStorage.clear() })

// ── Sidebar / Header changes ──

describe('Header and count', () => {
  it('does not show "Pacientes activos" title', async () => {
    patientApi.listActive.mockResolvedValueOnce({ data: [basePatient] })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.queryByText('Pacientes activos')).not.toBeInTheDocument()
  })

  it('shows patient count in the sticky action bar', async () => {
    patientApi.listActive.mockResolvedValueOnce({ data: [basePatient] })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const count = screen.getByTestId('patient-count')
    expect(count).toHaveTextContent('1 pacientes')
  })

  it('shows filtered count when filters are active', async () => {
    patientApi.listActive.mockResolvedValueOnce({
      data: [
        basePatient,
        { ...basePatient, id: 2, admissionId: 11, firstName: 'Carlos', lastName: 'López', location: 'R60' },
      ],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    // Open filters and filter by zone T
    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(screen.getByText('Trat.'))
    await waitFor(() => {
      const count = screen.getByTestId('patient-count')
      expect(count).toHaveTextContent('1 de 2')
    })
  })
})

// ── Empty locations ──

describe('Empty locations feature', () => {
  it('shows "Ver ubicaciones vacías" checkbox in filters', async () => {
    patientApi.listActive.mockResolvedValueOnce({ data: [basePatient] })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    expect(screen.getByText('Ver ubicaciones vacías')).toBeInTheDocument()
  })

  it('does not show empty location rows when checkbox is unchecked', async () => {
    patientApi.listActive.mockResolvedValueOnce({ data: [basePatient] })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.queryAllByTestId('empty-location-row')).toHaveLength(0)
  })

  it('shows empty location rows when checkbox is checked', async () => {
    // Patient occupies T03, so T03 should NOT appear as empty
    patientApi.listActive.mockResolvedValueOnce({ data: [basePatient] })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(screen.getByTestId('show-empty-locations'))
    await waitFor(() => {
      const emptyRows = screen.queryAllByTestId('empty-location-row')
      expect(emptyRows.length).toBeGreaterThan(0)
    })
    // T03 is occupied, should not appear as empty
    const emptyRows = screen.queryAllByTestId('empty-location-row')
    const locationTexts = emptyRows.map(r => r.querySelector('td:nth-child(2)').textContent)
    expect(locationTexts).not.toContain('T03')
  })

  it('shows Limpia badge by default for empty locations', async () => {
    patientApi.listActive.mockResolvedValueOnce({ data: [basePatient] })
    locationApi.getAllStatus.mockResolvedValueOnce({ data: [] })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(screen.getByTestId('show-empty-locations'))
    await waitFor(() => {
      const limpias = screen.queryAllByText('Limpia')
      expect(limpias.length).toBeGreaterThan(0)
    })
  })

  it('shows Sucia badge and priority when location is dirty', async () => {
    patientApi.listActive.mockResolvedValueOnce({ data: [basePatient] })
    locationApi.getAllStatus.mockResolvedValueOnce({
      data: [{ location: 'T04', clean: false, priority: 2 }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(screen.getByTestId('show-empty-locations'))
    await waitFor(() => {
      expect(screen.getByText('Sucia')).toBeInTheDocument()
      expect(screen.getByText('P2')).toBeInTheDocument()
    })
  })

  it('respects zone filter for empty locations', async () => {
    patientApi.listActive.mockResolvedValueOnce({ data: [] })
    renderList()
    await waitFor(() => screen.getByText('No hay pacientes'))
    fireEvent.click(screen.getByText('Filtros'))
    // Filter to Rápida zone only
    fireEvent.click(screen.getByText('Ráp.'))
    fireEvent.click(screen.getByTestId('show-empty-locations'))
    await waitFor(() => {
      const emptyRows = screen.queryAllByTestId('empty-location-row')
      // Rápida has R60-R69 = 10 locations
      expect(emptyRows.length).toBe(10)
      const locationTexts = emptyRows.map(r => r.querySelector('td:nth-child(2)').textContent)
      locationTexts.forEach(loc => expect(loc).toMatch(/^R/))
    })
  })

  it('calls updateStatus API when changing Limpia to Sucia', async () => {
    patientApi.listActive.mockResolvedValueOnce({ data: [basePatient] })
    locationApi.getAllStatus.mockResolvedValueOnce({ data: [] })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(screen.getByTestId('show-empty-locations'))
    await waitFor(() => {
      expect(screen.queryAllByText('Limpia').length).toBeGreaterThan(0)
    })
    // Click the first Limpia badge to open dropdown
    const firstLimpia = screen.queryAllByText('Limpia')[0]
    fireEvent.click(firstLimpia)
    // Select Sucia from dropdown
    await waitFor(() => {
      const suciaOption = screen.getByRole('button', { name: 'Sucia' })
      fireEvent.click(suciaOption)
    })
    await waitFor(() => {
      expect(locationApi.updateStatus).toHaveBeenCalled()
    })
  })
})

// ── Sidebar ──

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ dark: false, toggle: vi.fn() }),
}))

describe('Sidebar', () => {
  it('shows Urgencias link instead of Pacientes', async () => {
    const { default: Sidebar } = await import('../components/Sidebar')
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.getByText('Urgencias')).toBeInTheDocument()
    expect(screen.queryByText('Pacientes')).not.toBeInTheDocument()
  })

  it('does not show Dados de alta link', async () => {
    const { default: Sidebar } = await import('../components/Sidebar')
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.queryByText('Dados de alta')).not.toBeInTheDocument()
  })
})
