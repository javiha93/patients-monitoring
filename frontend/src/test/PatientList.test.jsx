import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PatientList, { naturalCompare, matchesDateFilter } from '../pages/PatientList'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'javier.herrada', displayName: 'Javier Herrada', role: 'Enfermería' }, loginUser: vi.fn(), logout: vi.fn() }),
}))

vi.mock('../services/authApi', () => ({
  getUsersByRole: vi.fn(() => Promise.resolve([])),
}))

afterEach(() => { sessionStorage.clear() })

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
  { id: 4, admissionId: 13, nhc: 'NHC-004', firstName: 'Pedro', lastName: 'Sánchez', birthDate: '1988-05-10', sex: 'male', triageLevel: null, matCategory: null, admissionDate: '2024-01-12T10:00:00', location: '', specialty: '', status: 'active' },
]

vi.mock('../services/patientApi', () => ({
  patientApi: {
    listActive: vi.fn(() => Promise.resolve({ data: mockPatients })),
    create: vi.fn((data) => Promise.resolve({ data: { id: 4, ...data } })),
    updateLocation: vi.fn(() => Promise.resolve({ data: {} })),
    updateSpecialty: vi.fn(() => Promise.resolve({ data: {} })),
    assignNurse: vi.fn(() => Promise.resolve({ data: {} })),
    assignDoctor: vi.fn(() => Promise.resolve({ data: {} })),
    unassignNurse: vi.fn(() => Promise.resolve({ data: {} })),
    unassignDoctor: vi.fn(() => Promise.resolve({ data: {} })),
    updateTriage: vi.fn(() => Promise.resolve({ data: {} })),
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

describe('KAN-5: Listado de pacientes', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    sessionStorage.clear()
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
      expect(screen.getByText(/^Ubic/)).toBeInTheDocument()
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
    const actionBar = document.querySelector('.sticky.bottom-0')
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
    // Column order: Nivel(0), Ubic(1), Esp(2), Paciente(3), Motivo(4), Icons(5), Ingreso(6)
    return Array.from(rows).map(r => r.querySelectorAll('td')[3]?.textContent)
  }

  it('[KAN-5] ordena por nivel ascendente al hacer clic en cabecera Nivel', async () => {
    const { container } = renderList()
    await waitFor(() => screen.getByText('García, Ana'))

    const nivelHeader = screen.getByText(/^Nivel/)
    fireEvent.click(nivelHeader)

    const names = getRowNames(container)
    // triageLevel: Sánchez=null(0), Ruiz=1, García=2, López=4
    expect(names[0]).toContain('Sánchez, Pedro')
    expect(names[1]).toContain('Ruiz, María')
    expect(names[2]).toContain('García, Ana')
    expect(names[3]).toContain('López, Carlos')
  })

  it('[KAN-5] segundo clic en Nivel ordena descendente', async () => {
    const { container } = renderList()
    await waitFor(() => screen.getByText('García, Ana'))

    const nivelHeader = screen.getByText(/^Nivel/)
    fireEvent.click(nivelHeader) // asc
    fireEvent.click(nivelHeader) // desc

    const names = getRowNames(container)
    // desc: López=4, García=2, Ruiz=1, Sánchez=null(0)
    expect(names[0]).toContain('López, Carlos')
    expect(names[1]).toContain('García, Ana')
    expect(names[2]).toContain('Ruiz, María')
    expect(names[3]).toContain('Sánchez, Pedro')
  })

  it('[KAN-5] ordena por ubicación ascendente (natural sort: B2 antes de B10)', async () => {
    const { container } = renderList()
    await waitFor(() => screen.getByText('García, Ana'))

    const ubicacionHeader = screen.getByText(/^Ubic/)
    fireEvent.click(ubicacionHeader)

    const names = getRowNames(container)
    // natural sort: Sánchez='', García=B1, Ruiz=B2, López=B10
    expect(names[0]).toContain('Sánchez, Pedro')
    expect(names[1]).toContain('García, Ana')
    expect(names[2]).toContain('Ruiz, María')
    expect(names[3]).toContain('López, Carlos')
  })

  it('[KAN-5] ordena por ingreso ascendente', async () => {
    const { container } = renderList()
    await waitFor(() => screen.getByText('García, Ana'))

    const ingresoHeader = screen.getByText(/^Ingreso/)
    fireEvent.click(ingresoHeader)

    const names = getRowNames(container)
    // admissionDate: Ruiz=09, García=10, López=11, Sánchez=12
    expect(names[0]).toContain('Ruiz, María')
    expect(names[1]).toContain('García, Ana')
    expect(names[2]).toContain('López, Carlos')
    expect(names[3]).toContain('Sánchez, Pedro')
  })

  it('[KAN-5] ordena por ingreso descendente', async () => {
    const { container } = renderList()
    await waitFor(() => screen.getByText('García, Ana'))

    const ingresoHeader = screen.getByText(/^Ingreso/)
    fireEvent.click(ingresoHeader) // asc
    fireEvent.click(ingresoHeader) // desc

    const names = getRowNames(container)
    // desc: Sánchez=12, López=11, García=10, Ruiz=09
    expect(names[0]).toContain('Sánchez, Pedro')
    expect(names[1]).toContain('López, Carlos')
    expect(names[2]).toContain('García, Ana')
    expect(names[3]).toContain('Ruiz, María')
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
      expect(screen.getByText(/^Esp/)).toBeInTheDocument()
    })
  })

  it('[KAN-5] muestra la especialidad actual del paciente (abreviada)', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    // García has specialty Medicina → shown as "Med"
    const btns = screen.getAllByRole('button').filter(b => b.textContent.includes('Med'))
    expect(btns.length).toBeGreaterThanOrEqual(1)
    // Full name in tooltip
    const medBtn = btns.find(b => b.getAttribute('title') === 'Medicina')
    expect(medBtn).toBeTruthy()
  })

  it('[KAN-5] ordena por especialidad ascendente', async () => {
    const { container } = renderList()
    await waitFor(() => screen.getByText('García, Ana'))

    const espHeader = screen.getByText(/^Esp/)
    fireEvent.click(espHeader)

    const rows = container.querySelectorAll('tbody tr')
    // Column order: Nivel(0), Ubic(1), Esp(2), Paciente(3), Motivo(4), Icons(5), Ingreso(6)
    const names = Array.from(rows).map(r => r.querySelectorAll('td')[3]?.textContent)
    // '' < Cirugía < Medicina < Traumatología → Sánchez, López, García, Ruiz
    expect(names[0]).toContain('Sánchez, Pedro')
    expect(names[1]).toContain('López, Carlos')
    expect(names[2]).toContain('García, Ana')
    expect(names[3]).toContain('Ruiz, María')
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

describe('matchesDateFilter', () => {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  function daysAgo(n) {
    const d = new Date(startOfToday)
    d.setDate(d.getDate() - n)
    d.setHours(12, 0, 0)
    return d.toISOString()
  }

  it('returns true when no filter is set', () => {
    expect(matchesDateFilter('2024-01-01T10:00:00', null)).toBe(true)
  })

  it('"hoy" matches today', () => {
    const todayNoon = new Date(startOfToday)
    todayNoon.setHours(12, 0, 0)
    expect(matchesDateFilter(todayNoon.toISOString(), 'hoy')).toBe(true)
  })

  it('"hoy" rejects yesterday', () => {
    expect(matchesDateFilter(daysAgo(1), 'hoy')).toBe(false)
  })

  it('"ayer" matches yesterday only', () => {
    expect(matchesDateFilter(daysAgo(1), 'ayer')).toBe(true)
  })

  it('"ayer" rejects today', () => {
    const todayNoon = new Date(startOfToday)
    todayNoon.setHours(12, 0, 0)
    expect(matchesDateFilter(todayNoon.toISOString(), 'ayer')).toBe(false)
  })

  it('"hoy_ayer" matches both today and yesterday', () => {
    const todayNoon = new Date(startOfToday)
    todayNoon.setHours(12, 0, 0)
    expect(matchesDateFilter(todayNoon.toISOString(), 'hoy_ayer')).toBe(true)
    expect(matchesDateFilter(daysAgo(1), 'hoy_ayer')).toBe(true)
  })

  it('"hoy_ayer" rejects 2 days ago', () => {
    expect(matchesDateFilter(daysAgo(2), 'hoy_ayer')).toBe(false)
  })

  it('"3d" matches 2 days ago', () => {
    expect(matchesDateFilter(daysAgo(2), '3d')).toBe(true)
  })

  it('"3d" rejects 4 days ago', () => {
    expect(matchesDateFilter(daysAgo(4), '3d')).toBe(false)
  })

  it('"1w" matches 6 days ago', () => {
    expect(matchesDateFilter(daysAgo(6), '1w')).toBe(true)
  })

  it('"1m" matches 25 days ago', () => {
    expect(matchesDateFilter(daysAgo(25), '1m')).toBe(true)
  })

  it('"1m" rejects 35 days ago', () => {
    expect(matchesDateFilter(daysAgo(35), '1m')).toBe(false)
  })
})

describe('KAN-78: Filtros colapsables', () => {
  it('muestra el botón de filtros', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByText('Filtros')).toBeInTheDocument()
  })

  it('los filtros están ocultos por defecto', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    // Specialty filter labels should not be visible
    expect(screen.queryByText('Pediatría')).not.toBeInTheDocument()
  })

  it('clic en Filtros muestra las opciones', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    // Now specialty options should be visible
    expect(screen.getByText('Pediatría')).toBeInTheDocument()
    expect(screen.getByText('Oftalmología')).toBeInTheDocument()
    // Date options
    expect(screen.getByText('Hoy')).toBeInTheDocument()
    expect(screen.getByText('1 semana')).toBeInTheDocument()
  })

  function getFilterButton(label) {
    // Filter buttons are inside the filter panel (not the table InlineDropdowns)
    // They are rounded-full pill buttons
    return screen.getAllByRole('button').find(
      b => b.textContent === label && b.className.includes('rounded-full') && !b.className.includes('w-7')
    )
  }

  it('filtrar por especialidad oculta pacientes que no coinciden', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    // Click "Medicina" filter pill — only García (Medicina) should remain
    fireEvent.click(getFilterButton('Medicina'))
    await waitFor(() => {
      expect(screen.getByText('García, Ana')).toBeInTheDocument()
      expect(screen.queryByText('López, Carlos')).not.toBeInTheDocument()
      expect(screen.queryByText('Ruiz, María')).not.toBeInTheDocument()
    })
  })

  it('filtrar por nivel oculta pacientes que no coinciden', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    // Click level 1 — only Ruiz (triageLevel=1) should remain
    // Level buttons are w-8 h-8 rounded-full
    const levelButtons = screen.getAllByRole('button').filter(b => b.textContent === '1' && b.className.includes('w-7'))
    fireEvent.click(levelButtons[0])
    await waitFor(() => {
      expect(screen.getByText('Ruiz, María')).toBeInTheDocument()
      expect(screen.queryByText('García, Ana')).not.toBeInTheDocument()
      expect(screen.queryByText('López, Carlos')).not.toBeInTheDocument()
    })
  })

  it('muestra badge con número de filtros activos', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    // Select one specialty
    fireEvent.click(getFilterButton('Medicina'))
    // Badge is a span with bg-blue-500 inside the Filtros button area
    const badges = screen.getAllByText('1').filter(el => el.className.includes('bg-blue-500'))
    expect(badges.length).toBe(1)
  })

  it('limpiar filtros restaura todos los pacientes', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    // Filter by Medicina
    fireEvent.click(getFilterButton('Medicina'))
    await waitFor(() => expect(screen.queryByText('López, Carlos')).not.toBeInTheDocument())
    // Clear filters
    fireEvent.click(screen.getByText('Limpiar'))
    await waitFor(() => {
      expect(screen.getByText('García, Ana')).toBeInTheDocument()
      expect(screen.getByText('López, Carlos')).toBeInTheDocument()
      expect(screen.getByText('Ruiz, María')).toBeInTheDocument()
    })
  })
})

import { patientApi } from '../services/patientApi'

describe('Filtro "Sin nivel" y filtro por zona', () => {
  beforeEach(() => { sessionStorage.clear() })

  function getFilterButton(label) {
    return screen.getAllByRole('button').find(
      b => b.textContent === label && b.className.includes('rounded-full') && !b.className.includes('w-7')
    )
  }

  it('"Sin nivel" filtra pacientes sin triageLevel', async () => {
    const patients = [
      { ...mockPatients[0], triageLevel: 2 },
      { ...mockPatients[1], triageLevel: null },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    const sinNivelBtn = screen.getAllByRole('button').find(b => b.textContent === '∅'); fireEvent.click(sinNivelBtn)
    await waitFor(() => {
      expect(screen.getByText('López, Carlos')).toBeInTheDocument()
      expect(screen.queryByText('García, Ana')).not.toBeInTheDocument()
    })
  })

  it('"Sin nivel" combinado con nivel numérico', async () => {
    const patients = [
      { ...mockPatients[0], triageLevel: 2 },
      { ...mockPatients[1], triageLevel: null },
      { ...mockPatients[2], triageLevel: 1 },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    // Select "Sin nivel" + level 1
    const sinNivelBtn = screen.getAllByRole('button').find(b => b.textContent === '∅'); fireEvent.click(sinNivelBtn)
    const level1Btns = screen.getAllByRole('button').filter(b => b.textContent === '1' && b.className.includes('w-7'))
    fireEvent.click(level1Btns[0])
    await waitFor(() => {
      expect(screen.getByText('López, Carlos')).toBeInTheDocument()
      expect(screen.getByText('Ruiz, María')).toBeInTheDocument()
      expect(screen.queryByText('García, Ana')).not.toBeInTheDocument()
    })
  })

  it('filtro por zona muestra solo pacientes de esa zona', async () => {
    const patients = [
      { ...mockPatients[0], location: 'A5' },
      { ...mockPatients[1], location: 'B10' },
      { ...mockPatients[2], location: 'C3' },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(getFilterButton('B'))
    await waitFor(() => {
      expect(screen.getByText('López, Carlos')).toBeInTheDocument()
      expect(screen.queryByText('García, Ana')).not.toBeInTheDocument()
      expect(screen.queryByText('Ruiz, María')).not.toBeInTheDocument()
    })
  })

  it('filtro multi-zona muestra pacientes de varias zonas', async () => {
    const patients = [
      { ...mockPatients[0], location: 'A5' },
      { ...mockPatients[1], location: 'B10' },
      { ...mockPatients[2], location: 'C3' },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(getFilterButton('A'))
    fireEvent.click(getFilterButton('C'))
    await waitFor(() => {
      expect(screen.getByText('García, Ana')).toBeInTheDocument()
      expect(screen.getByText('Ruiz, María')).toBeInTheDocument()
      expect(screen.queryByText('López, Carlos')).not.toBeInTheDocument()
    })
  })

  it('zona aparece en el panel de filtros', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    expect(screen.getByText('Zona')).toBeInTheDocument()
    expect(getFilterButton('A')).toBeTruthy()
    expect(getFilterButton('B')).toBeTruthy()
    expect(getFilterButton('C')).toBeTruthy()
  })

  it('limpiar filtros limpia zona y sin nivel', async () => {
    const patients = [
      { ...mockPatients[0], location: 'A5', triageLevel: null },
      { ...mockPatients[1], location: 'B10' },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(getFilterButton('A'))
    const sinNivelBtn = screen.getAllByRole('button').find(b => b.textContent === '∅'); fireEvent.click(sinNivelBtn)
    await waitFor(() => expect(screen.queryByText('López, Carlos')).not.toBeInTheDocument())
    fireEvent.click(screen.getByText('Limpiar'))
    await waitFor(() => {
      expect(screen.getByText('García, Ana')).toBeInTheDocument()
      expect(screen.getByText('López, Carlos')).toBeInTheDocument()
    })
  })
})

describe('Pending lab indicator in patient list', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('muestra icono Syringe rojo cuando el paciente tiene pruebas pendientes', async () => {
    const patientsWithPending = [
      {
        ...mockPatients[0],
        pendingLabs: [
          { requestedAt: '2024-01-10T09:00:00', requestedParameters: '["hemograma","glucosa"]', validatedSamples: null },
        ],
      },
      { ...mockPatients[1], pendingLabs: null },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patientsWithPending })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const icons = screen.getAllByTestId('pending-lab-icon')
    expect(icons).toHaveLength(1)
  })

  it('no muestra icono cuando no hay pruebas pendientes', async () => {
    const patientsNoPending = mockPatients.map(p => ({ ...p, pendingLabs: null }))
    patientApi.listActive.mockResolvedValueOnce({ data: patientsNoPending })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.queryByTestId('pending-lab-icon')).not.toBeInTheDocument()
  })

  it('tooltip muestra hora y muestras pendientes', async () => {
    const patientsWithPending = [
      {
        ...mockPatients[0],
        pendingLabs: [
          { requestedAt: '2024-01-10T09:00:00', requestedParameters: '["hemograma","glucosa"]', validatedSamples: null },
        ],
      },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patientsWithPending })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const icon = screen.getByTestId('pending-lab-icon')
    expect(icon.getAttribute('title')).toContain('09:00')
    expect(icon.getAttribute('title')).toContain('Tubo hemograma')
    expect(icon.getAttribute('title')).toContain('Tubo bioquímica')
  })

  it('tooltip muestra solo muestras pendientes en validación parcial', async () => {
    const patientsWithPartial = [
      {
        ...mockPatients[0],
        pendingLabs: [
          {
            requestedAt: '2024-01-10T09:00:00',
            requestedParameters: '["hemograma","glucosa","orina_sistematico"]',
            validatedSamples: '["tubo_hemograma","tubo_bioquimica"]',
          },
        ],
      },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patientsWithPartial })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const icon = screen.getByTestId('pending-lab-icon')
    const tooltip = icon.getAttribute('title')
    expect(tooltip).toContain('Muestra de orina')
    expect(tooltip).not.toContain('Tubo hemograma')
    expect(tooltip).not.toContain('Tubo bioquímica')
  })
})

describe('Pending ECG indicator in patient list', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('muestra icono Activity rojo cuando el paciente tiene ECG pendiente', async () => {
    const patientsWithEcg = [
      { ...mockPatients[0], hasPendingEcg: true, pendingLabs: null },
      { ...mockPatients[1], hasPendingEcg: false, pendingLabs: null },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patientsWithEcg })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const icons = screen.getAllByTestId('pending-ecg-icon')
    expect(icons).toHaveLength(1)
  })

  it('no muestra icono ECG cuando no hay ECGs pendientes', async () => {
    const patientsNoEcg = mockPatients.map(p => ({ ...p, hasPendingEcg: false, pendingLabs: null }))
    patientApi.listActive.mockResolvedValueOnce({ data: patientsNoEcg })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.queryByTestId('pending-ecg-icon')).not.toBeInTheDocument()
  })

  it('muestra ambos iconos cuando hay lab y ECG pendientes', async () => {
    const patientsBoth = [
      {
        ...mockPatients[0],
        hasPendingEcg: true,
        pendingLabs: [{ requestedAt: '2024-01-10T09:00:00', requestedParameters: '["hemograma"]', validatedSamples: null }],
      },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patientsBoth })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getAllByTestId('pending-lab-icon')).toHaveLength(1)
    expect(screen.getAllByTestId('pending-ecg-icon')).toHaveLength(1)
  })
})

describe('Grey icons for completed labs/ECGs', () => {
  beforeEach(() => sessionStorage.clear())

  it('muestra jeringuilla gris cuando hay labs completadas sin pendientes', async () => {
    const patients = [{ ...mockPatients[0], hasCompletedLabs: true, pendingLabs: null, hasPendingEcg: false, hasCompletedEcg: false }]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByTestId('completed-lab-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('pending-lab-icon')).not.toBeInTheDocument()
  })

  it('muestra Activity gris cuando hay ECGs completados sin pendientes', async () => {
    const patients = [{
      ...mockPatients[0], hasCompletedEcg: true, hasPendingEcg: false, pendingLabs: null, hasCompletedLabs: false,
      recentEcgs: [{ completedAt: '2024-01-10T10:00:00', completedBy: 'Javier Herrada' }],
    }]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const icon = screen.getByTestId('completed-ecg-icon')
    expect(icon).toBeInTheDocument()
    expect(icon.getAttribute('title')).toContain('Javier Herrada')
    expect(screen.queryByTestId('pending-ecg-icon')).not.toBeInTheDocument()
  })

  it('no muestra gris si hay pendientes (rojo tiene prioridad)', async () => {
    const patients = [{
      ...mockPatients[0], hasCompletedLabs: true, hasPendingEcg: true, hasCompletedEcg: true,
      pendingLabs: [{ requestedAt: '2024-01-10T09:00:00', requestedParameters: '["hemograma"]', validatedSamples: null }],
    }]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByTestId('pending-lab-icon')).toBeInTheDocument()
    expect(screen.getByTestId('pending-ecg-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('completed-lab-icon')).not.toBeInTheDocument()
    expect(screen.queryByTestId('completed-ecg-icon')).not.toBeInTheDocument()
  })
})

describe('Columna Asignado', () => {
  beforeEach(() => { sessionStorage.clear() })

  it('muestra cabecera Asignado en la tabla', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByText('Asignado')).toBeInTheDocument()
  })

  it('muestra iniciales del enfermero asignado', async () => {
    const patients = [{ ...mockPatients[0], assignedNurse: 'Javier Herrada' }]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByText('JH')).toBeInTheDocument()
    expect(screen.getByTitle('Enf: Javier Herrada')).toBeInTheDocument()
  })

  it('muestra iniciales del médico asignado', async () => {
    const patients = [{ ...mockPatients[0], assignedDoctor: 'María López' }]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByText('ML')).toBeInTheDocument()
    expect(screen.getByTitle('Med: María López')).toBeInTheDocument()
  })

  it('muestra ambos enfermero y médico', async () => {
    const patients = [{ ...mockPatients[0], assignedNurse: 'Javier Herrada', assignedDoctor: 'Ana Ruiz' }]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByText('JH')).toBeInTheDocument()
    expect(screen.getByText('AR')).toBeInTheDocument()
  })

  it('muestra botón de asignar para enfermero sin asignar', async () => {
    const patients = [{ ...mockPatients[0], assignedNurse: null }]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByTitle('Asignarme')).toBeInTheDocument()
  })

  it('clic en asignar asigna al enfermero actual', async () => {
    const patients = [{ ...mockPatients[0], assignedNurse: null }]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByTitle('Asignarme'))
    await waitFor(() => {
      expect(patientApi.assignNurse).toHaveBeenCalledWith(10, 'Javier Herrada')
    })
  })

  it('muestra indicador visual de enfermero anterior (desasignado)', async () => {
    const patients = [{ ...mockPatients[0], assignedNurse: null, previousNurse: 'Pedro Gómez' }]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByTitle('Enf. anterior: Pedro Gómez')).toBeInTheDocument()
  })

  it('muestra indicador visual de médico anterior (desasignado)', async () => {
    const patients = [{ ...mockPatients[0], assignedDoctor: null, previousDoctor: 'Laura Sánchez' }]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByTitle('Med. anterior: Laura Sánchez')).toBeInTheDocument()
  })
})

describe('Filtros de asignación', () => {
  beforeEach(() => { sessionStorage.clear() })

  function getFilterButton(label) {
    return screen.getAllByRole('button').find(
      b => b.textContent === label && b.className.includes('rounded-full') && !b.className.includes('w-7')
    )
  }

  it('muestra secciones de filtro Enfermero/a y Médico', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    expect(screen.getByText('Enfermero/a')).toBeInTheDocument()
    expect(screen.getByText('Médico')).toBeInTheDocument()
  })

  it('filtro "Sin enfermero" muestra solo pacientes sin enfermero', async () => {
    const patients = [
      { ...mockPatients[0], assignedNurse: 'Javier Herrada' },
      { ...mockPatients[1], assignedNurse: null },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(getFilterButton('Sin enf.'))
    await waitFor(() => {
      expect(screen.getByText('López, Carlos')).toBeInTheDocument()
      expect(screen.queryByText('García, Ana')).not.toBeInTheDocument()
    })
  })

  it('filtro "Sin médico" muestra solo pacientes sin médico', async () => {
    const patients = [
      { ...mockPatients[0], assignedDoctor: 'Ana Ruiz' },
      { ...mockPatients[1], assignedDoctor: null },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(getFilterButton('Sin méd.'))
    await waitFor(() => {
      expect(screen.getByText('López, Carlos')).toBeInTheDocument()
      expect(screen.queryByText('García, Ana')).not.toBeInTheDocument()
    })
  })

  it('filtro por nombre de enfermero filtra correctamente', async () => {
    const patients = [
      { ...mockPatients[0], assignedNurse: 'Javier Herrada' },
      { ...mockPatients[1], assignedNurse: 'Pedro Gómez' },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    // The "Yo" button should appear since user is Enfermería
    const yoBtn = getFilterButton('Yo')
    expect(yoBtn).toBeTruthy()
    fireEvent.click(yoBtn)
    await waitFor(() => {
      expect(screen.getByText('García, Ana')).toBeInTheDocument()
      expect(screen.queryByText('López, Carlos')).not.toBeInTheDocument()
    })
  })

  it('limpiar filtros limpia enfermero y médico', async () => {
    const patients = [
      { ...mockPatients[0], assignedNurse: 'Javier Herrada' },
      { ...mockPatients[1], assignedNurse: null },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patients })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    fireEvent.click(screen.getByText('Filtros'))
    fireEvent.click(getFilterButton('Sin enf.'))
    await waitFor(() => expect(screen.queryByText('García, Ana')).not.toBeInTheDocument())
    fireEvent.click(screen.getByText('Limpiar'))
    await waitFor(() => {
      expect(screen.getByText('García, Ana')).toBeInTheDocument()
      expect(screen.getByText('López, Carlos')).toBeInTheDocument()
    })
  })
})



describe('Auto-refresh immediate fetch', () => {
  it('triggers fetchPatients immediately when auto-refresh is toggled on', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const callsBefore = patientApi.listActive.mock.calls.length
    const refreshBtn = screen.getByTitle(/auto-refresco/i)
    fireEvent.click(refreshBtn)
    await waitFor(() => {
      expect(patientApi.listActive.mock.calls.length).toBeGreaterThan(callsBefore)
    })
  })
})

describe('Triage badge alignment and click', () => {
  it('shows centered triage badge for triaged patients', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const badges = screen.getAllByText('2')
    const triageBadge = badges.find(b => b.closest('[title="Editar triaje"]'))
    expect(triageBadge).toBeTruthy()
  })

  it('shows plus button for untriaged patients', async () => {
    renderList()
    await waitFor(() => screen.getByText('Sánchez, Pedro'))
    const triageBtn = screen.getByTitle('Triar paciente')
    expect(triageBtn).toBeTruthy()
  })

  it('clicking triage badge opens triage modal for already-triaged patient', async () => {
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const editBtn = screen.getAllByTitle('Editar triaje')[0]
    fireEvent.click(editBtn)
    await waitFor(() => {
      expect(screen.getByText('Triaje')).toBeInTheDocument()
    })
  })
})

describe('Triage modal vitals and nursing note', () => {
  it('shows vitals inputs in triage modal', async () => {
    renderList()
    await waitFor(() => screen.getByText('Sánchez, Pedro'))
    const triageBtn = screen.getByTitle('Triar paciente')
    fireEvent.click(triageBtn)
    await waitFor(() => screen.getByText('Triaje'))
    expect(screen.getByText('Constantes')).toBeInTheDocument()
    expect(screen.getByText('FC (lpm)')).toBeInTheDocument()
    expect(screen.getByText('TAS (mmHg)')).toBeInTheDocument()
    expect(screen.getByText('TAD (mmHg)')).toBeInTheDocument()
    expect(screen.getByText('FR (rpm)')).toBeInTheDocument()
  })

  it('shows nursing assessment button in triage modal', async () => {
    renderList()
    await waitFor(() => screen.getByText('Sánchez, Pedro'))
    const triageBtn = screen.getByTitle('Triar paciente')
    fireEvent.click(triageBtn)
    await waitFor(() => screen.getByText('Triaje'))
    expect(screen.getByText('Valoración de enfermería')).toBeInTheDocument()
    expect(screen.getByText('Registrar valoración de enfermería')).toBeInTheDocument()
  })
})

describe('Lab notification badges filtered by assignment', () => {
  it('shows lab badge only for patients assigned to current user', async () => {
    const patientsWithAssignment = [
      { ...mockPatients[0], assignedNurse: 'Javier Herrada', hasCompletedLabs: true },
      { ...mockPatients[1], assignedNurse: 'Otro Enfermero', hasCompletedLabs: true },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patientsWithAssignment })
    const { notificationApi } = await import('../services/notificationApi')
    notificationApi.getUnseenLab.mockResolvedValueOnce({
      data: [
        { admissionId: 10, labTestId: 1, changeType: 'partial_results' },
        { admissionId: 11, labTestId: 2, changeType: 'partial_results' },
      ],
    })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    const badges = screen.queryAllByTestId('lab-notif-badge')
    expect(badges.length).toBeLessThanOrEqual(1)
  })

  // ── Medication badge tests ──

  it('shows blue Pill icon when patient has prescriptions and unseen med notification', async () => {
    const patientsWithRx = [
      { ...mockPatients[0], hasPrescriptions: true, assignedNurse: 'Javier Herrada' },
      { ...mockPatients[1], hasPrescriptions: false },
    ]
    const { notificationApi } = await import('../services/notificationApi')
    notificationApi.getUnseenMed.mockResolvedValueOnce({
      data: [{ admissionId: 10, prescriptionId: 1 }],
    })
    patientApi.listActive.mockResolvedValueOnce({ data: patientsWithRx })
    renderList()
    await waitFor(() => {
      expect(screen.getByTestId('med-notif-icon')).toBeInTheDocument()
    })
  })

  it('shows grey Pill icon when patient has prescriptions but no unseen notification', async () => {
    const patientsWithRx = [
      { ...mockPatients[0], hasPrescriptions: true, assignedNurse: 'Javier Herrada' },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patientsWithRx })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.getByTestId('med-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('med-notif-badge')).not.toBeInTheDocument()
  })

  it('does not show Pill icon when patient has no prescriptions', async () => {
    const patientsNoRx = [
      { ...mockPatients[0], hasPrescriptions: false },
    ]
    patientApi.listActive.mockResolvedValueOnce({ data: patientsNoRx })
    renderList()
    await waitFor(() => screen.getByText('García, Ana'))
    expect(screen.queryByTestId('med-icon')).not.toBeInTheDocument()
    expect(screen.queryByTestId('med-notif-icon')).not.toBeInTheDocument()
  })

  it('shows blue med icon only for patients assigned to current user', async () => {
    const patientsWithRx = [
      { ...mockPatients[0], hasPrescriptions: true, assignedNurse: 'Javier Herrada' },
      { ...mockPatients[1], hasPrescriptions: true, assignedNurse: 'Otro Enfermero' },
    ]
    const { notificationApi } = await import('../services/notificationApi')
    notificationApi.getUnseenMed.mockResolvedValueOnce({
      data: [
        { admissionId: 10, prescriptionId: 1 },
        { admissionId: 11, prescriptionId: 2 },
      ],
    })
    patientApi.listActive.mockResolvedValueOnce({ data: patientsWithRx })
    renderList()
    await waitFor(() => {
      // Only the assigned patient should have the blue icon
      const blueIcons = screen.queryAllByTestId('med-notif-icon')
      expect(blueIcons.length).toBeLessThanOrEqual(1)
    })
  })
})
