import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PatientList, { naturalCompare } from '../pages/PatientList'

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock API
const mockPatients = [
  { id: 1, admissionId: 10, nhc: 'NHC-001', firstName: 'Ana', lastName: 'García', birthDate: '1985-03-15', sex: 'female', triageLevel: 2, matCategory: 'Dolor torácico', admissionDate: '2024-01-10T08:30:00', location: 'B1', specialty: 'Medicina', status: 'active' },
  { id: 2, admissionId: 11, nhc: 'NHC-002', firstName: 'Carlos', lastName: 'López', birthDate: '1970-07-22', sex: 'male', triageLevel: 4, matCategory: 'Fiebre', admissionDate: '2024-01-11T14:00:00', location: 'B10', specialty: 'Cirugía', status: 'active' },
  { id: 3, admissionId: 12, nhc: 'NHC-003', firstName: 'María', lastName: 'Ruiz', birthDate: '1990-01-01', sex: 'female', triageLevel: 1, matCategory: 'Politraumatismo', admissionDate: '2024-01-09T06:00:00', location: 'B2', specialty: 'Traumatología', status: 'active' },
]

vi.mock('../services/patientApi', () => ({
  patientApi: {
    listActive: vi.fn(() => Promise.resolve({ data: mockPatients })),
    create: vi.fn((data) => Promise.resolve({ data: { id: 4, ...data } })),
    updateLocation: vi.fn(() => Promise.resolve({ data: {} })),
    updateSpecialty: vi.fn(() => Promise.resolve({ data: {} })),
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
      expect(screen.getByText(/^Ubicación/)).toBeInTheDocument()
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

describe('KAN-5: Ordenación en modo tabla', () => {
  function getRowNames(container) {
    const rows = container.querySelectorAll('tbody tr')
    return Array.from(rows).map(r => r.querySelectorAll('td')[2]?.textContent)
  }

  it('[KAN-5] ordena por nivel ascendente al hacer clic en cabecera Nivel', async () => {
    const { container } = renderList()
    await waitFor(() => screen.getByText('García, Ana'))

    // Click Nivel header
    const nivelHeader = screen.getByText(/^Nivel/)
    fireEvent.click(nivelHeader)

    const names = getRowNames(container)
    // triageLevel: Ruiz=1, García=2, López=4
    expect(names[0]).toBe('Ruiz, María')
    expect(names[1]).toBe('García, Ana')
    expect(names[2]).toBe('López, Carlos')
  })

  it('[KAN-5] segundo clic en Nivel ordena descendente', async () => {
    const { container } = renderList()
    await waitFor(() => screen.getByText('García, Ana'))

    const nivelHeader = screen.getByText(/^Nivel/)
    fireEvent.click(nivelHeader) // asc
    fireEvent.click(nivelHeader) // desc

    const names = getRowNames(container)
    // desc: López=4, García=2, Ruiz=1
    expect(names[0]).toBe('López, Carlos')
    expect(names[1]).toBe('García, Ana')
    expect(names[2]).toBe('Ruiz, María')
  })

  it('[KAN-5] ordena por ubicación ascendente (natural sort: B2 antes de B10)', async () => {
    const { container } = renderList()
    await waitFor(() => screen.getByText('García, Ana'))

    const ubicacionHeader = screen.getByText(/^Ubicación/)
    fireEvent.click(ubicacionHeader)

    const names = getRowNames(container)
    // natural sort: García=B1, Ruiz=B2, López=B10
    expect(names[0]).toBe('García, Ana')
    expect(names[1]).toBe('Ruiz, María')
    expect(names[2]).toBe('López, Carlos')
  })

  it('[KAN-5] ordena por ingreso ascendente', async () => {
    const { container } = renderList()
    await waitFor(() => screen.getByText('García, Ana'))

    const ingresoHeader = screen.getByText(/^Ingreso/)
    fireEvent.click(ingresoHeader)

    const names = getRowNames(container)
    // admissionDate: Ruiz=09, García=10, López=11
    expect(names[0]).toBe('Ruiz, María')
    expect(names[1]).toBe('García, Ana')
    expect(names[2]).toBe('López, Carlos')
  })

  it('[KAN-5] ordena por ingreso descendente', async () => {
    const { container } = renderList()
    await waitFor(() => screen.getByText('García, Ana'))

    const ingresoHeader = screen.getByText(/^Ingreso/)
    fireEvent.click(ingresoHeader) // asc
    fireEvent.click(ingresoHeader) // desc

    const names = getRowNames(container)
    // desc: López=11, García=10, Ruiz=09
    expect(names[0]).toBe('López, Carlos')
    expect(names[1]).toBe('García, Ana')
    expect(names[2]).toBe('Ruiz, María')
  })

  it('[KAN-5] muestra indicador de dirección en cabecera activa', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))

    const nivelHeader = screen.getByText(/^Nivel/)
    // Before sorting: shows ↕
    expect(nivelHeader.textContent).toContain('↕')

    fireEvent.click(nivelHeader)
    expect(nivelHeader.textContent).toContain('↑')

    fireEvent.click(nivelHeader)
    expect(nivelHeader.textContent).toContain('↓')
  })
})

describe('KAN-5: Cambiar ubicación desde la lista', () => {
  it('[KAN-5] muestra el dropdown de ubicación con el valor actual', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    // García has location B1 — shown as button text
    const buttons = screen.getAllByRole('button').filter(b => b.textContent.includes('B1'))
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('[KAN-5] abrir dropdown muestra opciones B1-B25', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    // Click the B1 dropdown button to open it
    const locBtn = screen.getAllByRole('button').find(b => b.textContent.trim() === 'B1')
    fireEvent.mouseDown(locBtn)
    fireEvent.click(locBtn)
    // Should show B25 as last option
    await waitFor(() => {
      expect(screen.getByText('B25')).toBeInTheDocument()
    })
  })

  it('[KAN-5] cambiar ubicación no navega a la ficha del paciente', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    mockNavigate.mockClear()
    // Click the location dropdown
    const locBtn = screen.getAllByRole('button').find(b => b.textContent.trim() === 'B1')
    fireEvent.click(locBtn)
    // Select B5
    await waitFor(() => screen.getByText('B5'))
    fireEvent.click(screen.getByText('B5'))
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

describe('KAN-5: Columna Especialidad', () => {
  it('[KAN-5] muestra la columna Especialidad en la tabla', async () => {
    renderList()
    await waitFor(() => {
      expect(screen.getByText(/^Especialidad/)).toBeInTheDocument()
    })
  })

  it('[KAN-5] muestra la especialidad actual del paciente', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    // García has specialty Medicina
    const btns = screen.getAllByRole('button').filter(b => b.textContent.includes('Medicina'))
    expect(btns.length).toBeGreaterThanOrEqual(1)
  })

  it('[KAN-5] ordena por especialidad ascendente', async () => {
    const { container } = renderList()
    await waitFor(() => screen.getByText('García, Ana'))

    const espHeader = screen.getByText(/^Especialidad/)
    fireEvent.click(espHeader)

    const rows = container.querySelectorAll('tbody tr')
    const names = Array.from(rows).map(r => r.querySelectorAll('td')[2]?.textContent)
    // Cirugía < Medicina < Traumatología → López, García, Ruiz
    expect(names[0]).toBe('López, Carlos')
    expect(names[1]).toBe('García, Ana')
    expect(names[2]).toBe('Ruiz, María')
  })
})

describe('naturalCompare', () => {
  it('sorts B2 before B10', () => {
    expect(naturalCompare('B2', 'B10')).toBeLessThan(0)
  })

  it('sorts B1 before B2', () => {
    expect(naturalCompare('B1', 'B2')).toBeLessThan(0)
  })

  it('sorts A1 before B1', () => {
    expect(naturalCompare('A1', 'B1')).toBeLessThan(0)
  })

  it('treats equal values as 0', () => {
    expect(naturalCompare('B5', 'B5')).toBe(0)
  })

  it('handles empty strings', () => {
    expect(naturalCompare('', 'B1')).toBeLessThan(0)
  })

  it('handles null values', () => {
    expect(naturalCompare(null, 'B1')).toBeLessThan(0)
  })
})
