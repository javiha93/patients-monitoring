import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NewPatientModal from '../components/NewPatientModal'

// Mock patientApi
const mockSearchByNhc = vi.fn()
vi.mock('../services/patientApi', () => ({
  patientApi: {
    searchByNhc: (...args) => mockSearchByNhc(...args),
    reopen: vi.fn(() => Promise.resolve({ data: {} })),
    listActive: vi.fn(() => Promise.resolve({ data: [] })),
    create: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('NewPatientModal — Admin mode', () => {
  it('[KAN-100] shows search icon next to NHC when isAdmin', () => {
    render(<NewPatientModal open={true} onClose={vi.fn()} onSubmit={vi.fn()} isAdmin={true} />)
    expect(screen.getByTitle('Buscar paciente por NHC')).toBeInTheDocument()
  })

  it('[KAN-100] hides search icon when not admin', () => {
    render(<NewPatientModal open={true} onClose={vi.fn()} onSubmit={vi.fn()} isAdmin={false} />)
    expect(screen.queryByTitle('Buscar paciente por NHC')).not.toBeInTheDocument()
  })

  it('[KAN-100] hides triage section when isAdmin', () => {
    render(<NewPatientModal open={true} onClose={vi.fn()} onSubmit={vi.fn()} isAdmin={true} />)
    expect(screen.queryByText('Triaje')).not.toBeInTheDocument()
    expect(screen.queryByText('Nivel de triaje')).not.toBeInTheDocument()
  })

  it('[KAN-100] shows triage section when not admin', () => {
    render(<NewPatientModal open={true} onClose={vi.fn()} onSubmit={vi.fn()} isAdmin={false} />)
    expect(screen.getByText('Triaje')).toBeInTheDocument()
  })

  it('[KAN-100] shows "not found" message after NHC search', async () => {
    mockSearchByNhc.mockResolvedValueOnce({ data: { status: 'not_found', nhc: 'NHC-999' } })
    render(<NewPatientModal open={true} onClose={vi.fn()} onSubmit={vi.fn()} isAdmin={true} />)

    fireEvent.change(screen.getByPlaceholderText('NHC-000000'), { target: { value: 'NHC-999' } })
    fireEvent.click(screen.getByTitle('Buscar paciente por NHC'))

    await waitFor(() => {
      expect(screen.getByText(/No existe en la base de datos/)).toBeInTheDocument()
    })
  })

  it('[KAN-100] shows "active" error after NHC search', async () => {
    mockSearchByNhc.mockResolvedValueOnce({ data: { status: 'active', patientId: 1, firstName: 'Ana', lastName: 'García', nhc: 'NHC-001' } })
    render(<NewPatientModal open={true} onClose={vi.fn()} onSubmit={vi.fn()} isAdmin={true} />)

    fireEvent.change(screen.getByPlaceholderText('NHC-000000'), { target: { value: 'NHC-001' } })
    fireEvent.click(screen.getByTitle('Buscar paciente por NHC'))

    await waitFor(() => {
      expect(screen.getByText(/ya tiene un ingreso activo/)).toBeInTheDocument()
    })
    // Submit button should be disabled
    expect(screen.getByText('Abrir ficha').closest('button')).toBeDisabled()
  })

  it('[KAN-100] shows "reopen" option for inactive patient', async () => {
    mockSearchByNhc.mockResolvedValueOnce({ data: { status: 'inactive', patientId: 5, firstName: 'Pedro', lastName: 'López', nhc: 'NHC-005' } })
    render(<NewPatientModal open={true} onClose={vi.fn()} onSubmit={vi.fn()} isAdmin={true} />)

    fireEvent.change(screen.getByPlaceholderText('NHC-000000'), { target: { value: 'NHC-005' } })
    fireEvent.click(screen.getByTitle('Buscar paciente por NHC'))

    await waitFor(() => {
      expect(screen.getByText(/Paciente encontrado/)).toBeInTheDocument()
      expect(screen.getByText('Reabrir ingreso')).toBeInTheDocument()
    })
  })
})
