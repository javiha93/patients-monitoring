import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PatientList from '../pages/PatientList'

let mockRole = 'Medicina'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'doc1', displayName: 'Dr. Test', role: mockRole },
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

// ── Admitted row styling ──

describe('Admitted patient styling', () => {
  it('applies purple background to admitted patient row', async () => {
    patientApi.listActive.mockResolvedValueOnce({
      data: [{ ...basePatient, admitted: true }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const row = screen.getByText('García, Ana').closest('tr')
    expect(row.className).toContain('pm-admitted')
  })

  it('does not apply purple background to non-admitted patient row', async () => {
    patientApi.listActive.mockResolvedValueOnce({
      data: [{ ...basePatient, admitted: false }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const row = screen.getByText('García, Ana').closest('tr')
    expect(row.className).not.toContain('pm-admitted')
  })
})

// ── Bed number display ──

describe('Bed number display', () => {
  it('shows bed number in blue when admitted with bed assigned', async () => {
    patientApi.listActive.mockResolvedValueOnce({
      data: [{ ...basePatient, admitted: true, bedNumber: '1023B' }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const bedNum = screen.getByTestId('bed-number')
    expect(bedNum).toHaveTextContent('1023B')
    expect(bedNum.className).toContain('text-blue-600')
  })

  it('shows bed pending icon when admitted without bed', async () => {
    patientApi.listActive.mockResolvedValueOnce({
      data: [{ ...basePatient, admitted: true, bedNumber: '' }],
    })
    // Non-admin role should see the pending icon, not an input
    mockRole = 'Enfermería'
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByTestId('bed-pending')).toBeInTheDocument()
    mockRole = 'Medicina'
  })

  it('shows nothing in bed cell when patient is not admitted', async () => {
    patientApi.listActive.mockResolvedValueOnce({
      data: [{ ...basePatient, admitted: false }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const bedCell = screen.getByTestId('bed-cell')
    expect(bedCell.children.length).toBe(0)
  })

  it('shows Cama column header', async () => {
    patientApi.listActive.mockResolvedValueOnce({ data: [basePatient] })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByText('Cama')).toBeInTheDocument()
  })
})

// ── Doctor admit toggle ──

describe('Doctor admit toggle', () => {
  beforeEach(() => { mockRole = 'Medicina' })

  it('shows Ingresar button for doctor when patient selected', async () => {
    patientApi.listActive.mockResolvedValueOnce({
      data: [{ ...basePatient, admitted: false }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('García, Ana'))
    expect(screen.getByTestId('admit-toggle')).toHaveTextContent('Ingresar')
  })

  it('shows Ingresado button when patient is already admitted', async () => {
    patientApi.listActive.mockResolvedValueOnce({
      data: [{ ...basePatient, admitted: true }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('García, Ana'))
    expect(screen.getByTestId('admit-toggle')).toHaveTextContent('Ingresado')
  })

  it('calls markAdmitted API when toggling', async () => {
    patientApi.listActive.mockResolvedValueOnce({
      data: [{ ...basePatient, admitted: false }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('García, Ana'))
    fireEvent.click(screen.getByTestId('admit-toggle'))
    await waitFor(() => {
      expect(patientApi.markAdmitted).toHaveBeenCalledWith(10, true)
    })
  })

  it('does not show admit toggle for nurse role', async () => {
    mockRole = 'Enfermería'
    patientApi.listActive.mockResolvedValueOnce({
      data: [{ ...basePatient, admitted: false }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('García, Ana'))
    expect(screen.queryByTestId('admit-toggle')).not.toBeInTheDocument()
    mockRole = 'Medicina'
  })
})

// ── Admin bed assignment ──

describe('Admin bed assignment', () => {
  beforeEach(() => { mockRole = 'Administrativo' })
  afterEach(() => { mockRole = 'Medicina' })

  it('shows editable bed input for admin when patient is admitted', async () => {
    patientApi.listActive.mockResolvedValueOnce({
      data: [{ ...basePatient, admitted: true, bedNumber: '' }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const input = screen.getByTestId('bed-input')
    expect(input).toBeInTheDocument()
    expect(input.tagName).toBe('INPUT')
  })

  it('calls assignBed API on blur with new value', async () => {
    patientApi.listActive.mockResolvedValueOnce({
      data: [{ ...basePatient, admitted: true, bedNumber: '' }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const input = screen.getByTestId('bed-input')
    fireEvent.change(input, { target: { value: '1023B' } })
    fireEvent.blur(input)
    await waitFor(() => {
      expect(patientApi.assignBed).toHaveBeenCalledWith(10, '1023B')
    })
  })

  it('does not show bed input for non-admitted patient', async () => {
    patientApi.listActive.mockResolvedValueOnce({
      data: [{ ...basePatient, admitted: false }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.queryByTestId('bed-input')).not.toBeInTheDocument()
  })
})
