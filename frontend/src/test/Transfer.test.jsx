import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PatientList from '../pages/PatientList'
import TransferModal from '../components/TransferModal'

// ── Mocks ──

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

const admittedPatient = {
  id: 1, admissionId: 10, nhc: 'NHC-001', firstName: 'Ana', lastName: 'García',
  birthDate: '1985-03-15', sex: 'female', triageLevel: 2, matCategory: 'Dolor torácico',
  admissionDate: '2024-01-10T08:30:00', location: 'T03', specialty: 'Medicina', status: 'active',
  admitted: true, bedNumber: '1023B',
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

const { transferApi } = vi.hoisted(() => ({
  transferApi: {
    list: vi.fn(() => Promise.resolve({ data: [] })),
    create: vi.fn(() => Promise.resolve({ data: { id: 1, admissionId: 10, queuePosition: 1 } })),
    delete: vi.fn(() => Promise.resolve()),
  },
}))
vi.mock('../services/transferApi', () => ({ transferApi }))

vi.mock('../services/locationApi', () => ({
  locationApi: {
    getAllStatus: vi.fn(() => Promise.resolve({ data: [] })),
    updateStatus: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))
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

afterEach(() => {
  sessionStorage.clear()
  mockRole = 'Enfermería'
})

// ── TransferModal unit tests ──

describe('TransferModal', () => {
  const onClose = vi.fn()
  const onConfirm = vi.fn()
  const patient = admittedPatient

  it('renders modal with patient info and bed number', () => {
    render(<TransferModal open={true} patient={patient} onClose={onClose} onConfirm={onConfirm} />)
    expect(screen.getByRole('heading', { name: 'Solicitar traslado' })).toBeInTheDocument()
    expect(screen.getByText(/1023B/)).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(<TransferModal open={false} patient={patient} onClose={onClose} onConfirm={onConfirm} />)
    expect(screen.queryByText('Solicitar traslado')).not.toBeInTheDocument()
  })

  it('shows three transport type buttons', () => {
    render(<TransferModal open={true} patient={patient} onClose={onClose} onConfirm={onConfirm} />)
    expect(screen.getByTestId('transport-silla')).toHaveTextContent('Silla')
    expect(screen.getByTestId('transport-camilla')).toHaveTextContent('Camilla')
    expect(screen.getByTestId('transport-cama')).toHaveTextContent('Cama')
  })

  it('shows three checkbox options', () => {
    render(<TransferModal open={true} patient={patient} onClose={onClose} onConfirm={onConfirm} />)
    expect(screen.getByText('Soporte respiratorio')).toBeInTheDocument()
    expect(screen.getByText('Monitorización para subir')).toBeInTheDocument()
    expect(screen.getByText('Palo para bomba')).toBeInTheDocument()
  })

  it('confirm button is disabled until transport type is selected', () => {
    render(<TransferModal open={true} patient={patient} onClose={onClose} onConfirm={onConfirm} />)
    const btn = screen.getByTestId('confirm-transfer')
    expect(btn).toBeDisabled()
    fireEvent.click(screen.getByTestId('transport-silla'))
    expect(btn).not.toBeDisabled()
  })

  it('calls onConfirm with correct data', () => {
    render(<TransferModal open={true} patient={patient} onClose={onClose} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByTestId('transport-camilla'))
    fireEvent.click(screen.getByTestId('respiratory-support'))
    fireEvent.click(screen.getByTestId('iv-pole-required'))
    fireEvent.click(screen.getByTestId('confirm-transfer'))
    expect(onConfirm).toHaveBeenCalledWith({
      admissionId: 10,
      transportType: 'camilla',
      respiratorySupport: true,
      monitoringRequired: false,
      ivPoleRequired: true,
    })
  })

  it('calls onClose when cancel is clicked', () => {
    render(<TransferModal open={true} patient={patient} onClose={onClose} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalled()
  })
})

// ── Transfer integration in PatientList ──

describe('Transfer in PatientList', () => {
  it('shows transfer call button on hover for nurse when bed is assigned', async () => {
    mockRole = 'Enfermería'
    patientApi.listActive.mockResolvedValueOnce({ data: [admittedPatient] })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    // The button exists but is hidden (group-hover). In jsdom we can still query it.
    const callBtn = screen.getByTestId('transfer-call-btn')
    expect(callBtn).toBeInTheDocument()
  })

  it('shows transfer call button for doctor role too', async () => {
    mockRole = 'Medicina'
    patientApi.listActive.mockResolvedValueOnce({ data: [admittedPatient] })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByTestId('transfer-call-btn')).toBeInTheDocument()
  })

  it('opens transfer modal when call button is clicked', async () => {
    mockRole = 'Enfermería'
    patientApi.listActive.mockResolvedValueOnce({ data: [admittedPatient] })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByTestId('transfer-call-btn'))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Solicitar traslado' })).toBeInTheDocument()
    })
  })

  it('calls transferApi.create and shows badge after confirming', async () => {
    mockRole = 'Enfermería'
    patientApi.listActive.mockResolvedValueOnce({ data: [admittedPatient] })
    transferApi.create.mockResolvedValueOnce({ data: { id: 1, admissionId: 10, queuePosition: 3 } })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByTestId('transfer-call-btn'))
    await waitFor(() => screen.getByRole('heading', { name: 'Solicitar traslado' }))
    fireEvent.click(screen.getByTestId('transport-silla'))
    fireEvent.click(screen.getByTestId('confirm-transfer'))
    await waitFor(() => {
      expect(transferApi.create).toHaveBeenCalledWith(expect.objectContaining({
        admissionId: 10,
        transportType: 'silla',
        requestedBy: 'Test Nurse',
      }))
    })
    await waitFor(() => {
      expect(screen.getByTestId('transfer-badge')).toHaveTextContent('3')
    })
  })

  it('shows queue badge instead of call button when transfer exists', async () => {
    mockRole = 'Enfermería'
    patientApi.listActive.mockResolvedValueOnce({ data: [admittedPatient] })
    transferApi.list.mockResolvedValueOnce({
      data: [{ id: 1, admissionId: 10, queuePosition: 2, transportType: 'cama', respiratorySupport: false, monitoringRequired: false, ivPoleRequired: false, requestedBy: 'Test', requestedAt: '2024-01-10T10:00:00' }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    await waitFor(() => {
      expect(screen.getByTestId('transfer-badge')).toHaveTextContent('2')
    })
    expect(screen.queryByTestId('transfer-call-btn')).not.toBeInTheDocument()
  })

  it('does not show call button for admin role', async () => {
    mockRole = 'Administrativo'
    patientApi.listActive.mockResolvedValueOnce({ data: [admittedPatient] })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    // Admin sees the bed input, not the bed-number span with call button
    expect(screen.queryByTestId('transfer-call-btn')).not.toBeInTheDocument()
  })

  it('does not show call button when patient has no bed number', async () => {
    mockRole = 'Enfermería'
    patientApi.listActive.mockResolvedValueOnce({
      data: [{ ...admittedPatient, bedNumber: '' }],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.queryByTestId('transfer-call-btn')).not.toBeInTheDocument()
  })
})
