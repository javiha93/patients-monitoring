import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PatientList from '../pages/PatientList'

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock API
const mockPatients = [
  { id: 1, admissionId: 10, nhc: 'NHC-001', firstName: 'Ana', lastName: 'García', birthDate: '1985-03-15', sex: 'female', triageLevel: 2, matCategory: 'Dolor torácico', admissionDate: '2024-01-10T08:30:00', location: 'B1', status: 'active' },
  { id: 2, admissionId: 11, nhc: 'NHC-002', firstName: 'Carlos', lastName: 'López', birthDate: '1970-07-22', sex: 'male', triageLevel: 4, matCategory: 'Fiebre', admissionDate: '2024-01-11T14:00:00', location: 'B3', status: 'active' },
]

vi.mock('../services/patientApi', () => ({
  patientApi: {
    listActive: vi.fn(() => Promise.resolve({ data: mockPatients })),
    create: vi.fn((data) => Promise.resolve({ data: { id: 3, ...data } })),
  },
}))

function renderList() {
  return render(
    <MemoryRouter>
      <PatientList />
    </MemoryRouter>
  )
}

describe('KAN-5: Listado de pacientes', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('[KAN-5] muestra la lista de pacientes activos', async () => {
    renderList()
    await waitFor(() => {
      expect(screen.getByText('García, Ana')).toBeInTheDocument()
      expect(screen.getByText('López, Carlos')).toBeInTheDocument()
    })
  })

  it('[KAN-5] muestra la columna Ubicación en la tabla', async () => {
    renderList()
    await waitFor(() => {
      expect(screen.getByText('Ubicación')).toBeInTheDocument()
      expect(screen.getByText('B1')).toBeInTheDocument()
      expect(screen.getByText('B3')).toBeInTheDocument()
    })
  })

  it('[KAN-5] seleccionar paciente no navega, solo resalta', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('García, Ana'))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('[KAN-5] muestra nombre del paciente seleccionado en la barra de acciones', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByText('Selecciona un paciente')).toBeInTheDocument()
    fireEvent.click(screen.getByText('García, Ana'))
    // After selection, name appears in both table and action bar
    expect(screen.queryByText('Selecciona un paciente')).not.toBeInTheDocument()
    // Action bar should show the selected patient's NHC
    const actionBar = document.querySelector('.fixed.bottom-0')
    expect(actionBar.textContent).toContain('García')
    expect(actionBar.textContent).toContain('NHC-001')
  })

  it('[KAN-5] botones de acción deshabilitados sin selección', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const buttons = screen.getAllByRole('button').filter(b => b.title === 'Registros' || b.title === 'Antecedentes' || b.title === 'Medicación')
    buttons.forEach(b => expect(b).toBeDisabled())
  })

  it('[KAN-5] botones de acción habilitados tras seleccionar paciente', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('García, Ana'))
    const buttons = screen.getAllByRole('button').filter(b => b.title === 'Registros' || b.title === 'Antecedentes' || b.title === 'Medicación')
    buttons.forEach(b => expect(b).not.toBeDisabled())
  })

  it('[KAN-5] clic en Registros navega a ficha del paciente seleccionado', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('García, Ana'))
    const regBtn = screen.getAllByRole('button').find(b => b.title === 'Registros')
    fireEvent.click(regBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/patient/1')
  })

  it('[KAN-5] clic en Antecedentes navega a history', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('García, Ana'))
    const btn = screen.getAllByRole('button').find(b => b.title === 'Antecedentes')
    fireEvent.click(btn)
    expect(mockNavigate).toHaveBeenCalledWith('/patient/1/history')
  })

  it('[KAN-5] clic en Medicación navega a medication', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('García, Ana'))
    const btn = screen.getAllByRole('button').find(b => b.title === 'Medicación')
    fireEvent.click(btn)
    expect(mockNavigate).toHaveBeenCalledWith('/patient/1/medication')
  })
})

describe('KAN-7: Búsqueda y filtrado', () => {
  it('[KAN-7] filtra pacientes por nombre', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const input = screen.getByPlaceholderText('Buscar paciente...')
    fireEvent.change(input, { target: { value: 'carlos' } })
    expect(screen.queryByText('García, Ana')).not.toBeInTheDocument()
    expect(screen.getByText('López, Carlos')).toBeInTheDocument()
  })

  it('[KAN-7] filtra pacientes por NHC', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const input = screen.getByPlaceholderText('Buscar paciente...')
    fireEvent.change(input, { target: { value: 'NHC-001' } })
    expect(screen.getByText('García, Ana')).toBeInTheDocument()
    expect(screen.queryByText('López, Carlos')).not.toBeInTheDocument()
  })
})
