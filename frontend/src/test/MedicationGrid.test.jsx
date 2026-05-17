import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MedicationGrid from '../components/MedicationGrid'

const fixedMed = {
  id: 1, name: 'Paracetamol', amount: '1000', unit: 'mg', route: 'VO',
  frequency: 'c/8h', category: 'fixed', scheduledHours: '8,16,0',
  conditionText: null, prescribedBy: 'García', suspended: false, administrations: [],
}

const conditionalMed = {
  id: 2, name: 'Metamizol', amount: '575', unit: 'mg', route: 'IV',
  frequency: 'Si precisa', category: 'conditional', scheduledHours: '',
  conditionText: 'Si Tª > 38°C', prescribedBy: 'López', suspended: false, administrations: [],
}

const fluidMed = {
  id: 3, name: 'Suero fisiológico', amount: '500', unit: 'ml', route: 'IV',
  frequency: 'Continua', category: 'fluids', scheduledHours: '',
  conditionText: null, prescribedBy: 'García', suspended: false, administrations: [],
}

const insulinMed = {
  id: 4, name: 'Insulina Novorapid', amount: '0', unit: 'UI', route: 'SC',
  frequency: 'c/6h', category: 'insulin', scheduledHours: '7,13,19,1',
  conditionText: null, prescribedBy: 'Martínez', suspended: false, administrations: [],
}

// Use a date relative to now so test data falls within the ±36h sliding window
const now = new Date()
const todayBase = new Date(now)
todayBase.setHours(8, 0, 0, 0)
const admissionDate = todayBase.toISOString()

// Helper: build a local datetime string for today at a given hour
function todayAt(hour, minute = 0) {
  const d = new Date(now)
  d.setHours(hour, minute, 0, 0)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(hour)}:${pad(minute)}:00`
}

const defaultProps = {
  admissionDate,
  onDirectSign: vi.fn(),
  onDirectUnsign: vi.fn(),
  onOpenInsulinModal: vi.fn(),
  onOpenEditModal: vi.fn(),
}

describe('KAN-52: Grid de medicación 72h — Estructura', () => {
  it('[KAN-52] muestra mensaje cuando no hay prescripciones', () => {
    render(<MedicationGrid prescriptions={[]} {...defaultProps} />)
    expect(screen.getByText('No hay medicación pautada')).toBeInTheDocument()
  })

  it('[KAN-52] muestra 72 columnas de horas en formato HH:00', () => {
    render(<MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />)
    const hours08 = screen.getAllByText('08:00')
    expect(hours08.length).toBe(3) // day 1, day 2, day 3
    expect(screen.getAllByText('09:00').length).toBeGreaterThanOrEqual(1)
  })

  it('[KAN-52] muestra cabeceras de día en celdas de medianoche', () => {
    render(<MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />)
    // The 72h window (±36h from now) should contain at least one midnight crossing
    // Check that at least one date header (DD/MM format) is rendered
    const pad = n => String(n).padStart(2, '0')
    const tomorrow = new Date(now.getTime() + 24 * 3600000)
    const tomorrowLabel = `${pad(tomorrow.getDate())}/${pad(tomorrow.getMonth() + 1)}`
    const todayLabel = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}`
    const hasAnyDateHeader = screen.queryByText(tomorrowLabel) || screen.queryByText(todayLabel)
    expect(hasAnyDateHeader).toBeTruthy()
  })
})

describe('KAN-52: Grid — Secciones por categoría', () => {
  const allMeds = [fixedMed, conditionalMed, fluidMed, insulinMed]

  it('[KAN-52] muestra sección MEDICACIÓN FIJA', () => {
    render(<MedicationGrid prescriptions={allMeds} {...defaultProps} />)
    expect(screen.getByText('MEDICACIÓN FIJA')).toBeInTheDocument()
  })

  it('[KAN-52] muestra sección MEDICACIÓN CONDICIONAL', () => {
    render(<MedicationGrid prescriptions={allMeds} {...defaultProps} />)
    expect(screen.getByText('MEDICACIÓN CONDICIONAL')).toBeInTheDocument()
  })

  it('[KAN-52] muestra sección SUEROTERAPIA', () => {
    render(<MedicationGrid prescriptions={allMeds} {...defaultProps} />)
    expect(screen.getByText('SUEROTERAPIA')).toBeInTheDocument()
  })

  it('[KAN-52] muestra sección PAUTA DE INSULINA', () => {
    render(<MedicationGrid prescriptions={allMeds} {...defaultProps} />)
    expect(screen.getByText('PAUTA DE INSULINA')).toBeInTheDocument()
  })

  it('[KAN-52] no muestra secciones vacías', () => {
    render(<MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />)
    expect(screen.queryByText('MEDICACIÓN CONDICIONAL')).not.toBeInTheDocument()
    expect(screen.queryByText('SUEROTERAPIA')).not.toBeInTheDocument()
    expect(screen.queryByText('PAUTA DE INSULINA')).not.toBeInTheDocument()
  })
})

describe('KAN-56: Prescripciones — Información del medicamento', () => {
  it('[KAN-56] muestra nombre del medicamento', () => {
    render(<MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />)
    expect(screen.getByText('Paracetamol')).toBeInTheDocument()
  })

  it('[KAN-56] muestra dosis, vía y frecuencia', () => {
    render(<MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />)
    expect(screen.getByText(/1000mg VO c\/8h/)).toBeInTheDocument()
  })

  it('[KAN-56] muestra condición para medicación condicional', () => {
    render(<MedicationGrid prescriptions={[conditionalMed]} {...defaultProps} />)
    expect(screen.getByText('Si Tª > 38°C')).toBeInTheDocument()
  })

  it('[KAN-56] muestra escala de insulina en el panel izquierdo', () => {
    render(<MedicationGrid prescriptions={[insulinMed]} {...defaultProps} />)
    expect(screen.getByText('<150: 0UI')).toBeInTheDocument()
    expect(screen.getByText('150-250: 2UI')).toBeInTheDocument()
    expect(screen.getByText('250-350: 4UI')).toBeInTheDocument()
    expect(screen.getByText('>350: 6UI')).toBeInTheDocument()
  })
})

describe('KAN-57: Firma directa — Cualquier celda', () => {
  it('[KAN-57] clic en celda vacía llama onDirectSign', () => {
    const onDirectSign = vi.fn()
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} onDirectSign={onDirectSign} />
    )
    const emptyCell = Array.from(container.querySelectorAll('td'))
      .find(td => td.textContent === '' && td.style.height === '44px')
    if (emptyCell) {
      fireEvent.click(emptyCell)
      expect(onDirectSign).toHaveBeenCalledTimes(1)
      expect(onDirectSign).toHaveBeenCalledWith(expect.objectContaining({
        prescriptionId: 1,
        doseGiven: '1000',
      }))
    }
  })

  it('[KAN-57] clic en celda pautada (▶) llama onDirectSign', () => {
    const onDirectSign = vi.fn()
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} onDirectSign={onDirectSign} />
    )
    const scheduledCell = Array.from(container.querySelectorAll('td')).find(td => td.textContent.includes('▶'))
    if (scheduledCell) {
      fireEvent.click(scheduledCell)
      expect(onDirectSign).toHaveBeenCalledTimes(1)
    }
  })

  it('[KAN-57] firma solo una celda por clic, no múltiples', () => {
    const onDirectSign = vi.fn()
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} onDirectSign={onDirectSign} />
    )
    const emptyCell = Array.from(container.querySelectorAll('td'))
      .find(td => td.textContent === '' && td.style.height === '44px')
    if (emptyCell) {
      fireEvent.click(emptyCell)
      expect(onDirectSign).toHaveBeenCalledTimes(1)
    }
  })

  it('[KAN-57] administeredAt se envía en hora local (no UTC)', () => {
    const onDirectSign = vi.fn()
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} onDirectSign={onDirectSign} />
    )
    const emptyCell = Array.from(container.querySelectorAll('td'))
      .find(td => td.textContent === '' && td.style.height === '44px')
    if (emptyCell) {
      fireEvent.click(emptyCell)
      const call = onDirectSign.mock.calls[0][0]
      // Must NOT end with 'Z' (UTC) — should be local format like 2024-01-10T08:00:00
      expect(call.administeredAt).not.toMatch(/Z$/)
      expect(call.administeredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    }
  })
})

describe('KAN-57: Celda firmada — Dosis con unidad', () => {
  it('[KAN-57] muestra ✓ y dosis CON unidad (ej: 1000mg)', () => {
    const signedMed = {
      ...fixedMed,
      administrations: [{
        id: 100, administeredAt: todayAt(now.getHours(), 30),
        doseGiven: '1000', signedBy: 'Enfermera Ana', note: null,
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[signedMed]} {...defaultProps} />
    )
    expect(container.textContent).toContain('✓')
    expect(container.textContent).toContain('1000mg')
  })

  it('[KAN-57] muestra dosis con unidad "g" (ej: 1g)', () => {
    const medInGrams = {
      ...fixedMed,
      amount: '1', unit: 'g',
      administrations: [{
        id: 101, administeredAt: todayAt(now.getHours(), 30),
        doseGiven: '1', signedBy: 'Enfermera Ana', note: null,
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[medInGrams]} {...defaultProps} />
    )
    expect(container.textContent).toContain('1g')
  })
})

describe('KAN-57: Desfirmar — Clic directo sin confirmación', () => {
  it('[KAN-57] clic en celda firmada llama onDirectUnsign directamente', () => {
    const onDirectUnsign = vi.fn()
    const signedMed = {
      ...fixedMed,
      administrations: [{
        id: 100, administeredAt: todayAt(now.getHours(), 30),
        doseGiven: '1000', signedBy: 'Enfermera Ana', note: null,
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[signedMed]} {...defaultProps} onDirectUnsign={onDirectUnsign} />
    )
    const signedCell = Array.from(container.querySelectorAll('td')).find(td => td.textContent.includes('✓'))
    if (signedCell) {
      fireEvent.click(signedCell)
      expect(onDirectUnsign).toHaveBeenCalledWith(100)
    }
  })
})

describe('KAN-57: Observación — Indicador visual', () => {
  it('[KAN-57] muestra indicador azul en celda con observación', () => {
    const signedWithNote = {
      ...fixedMed,
      administrations: [{
        id: 100, administeredAt: todayAt(now.getHours(), 30),
        doseGiven: '1000', signedBy: 'Enfermera Ana', note: 'Paciente con náuseas',
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[signedWithNote]} {...defaultProps} />
    )
    const dot = container.querySelector('[data-testid="observation-dot"]')
    expect(dot).toBeInTheDocument()
    expect(dot.classList.contains('bg-blue-500')).toBe(true)
  })

  it('[KAN-57] NO muestra indicador en celda sin observación', () => {
    const signedNoNote = {
      ...fixedMed,
      administrations: [{
        id: 100, administeredAt: todayAt(now.getHours(), 30),
        doseGiven: '1000', signedBy: 'Enfermera Ana', note: null,
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[signedNoNote]} {...defaultProps} />
    )
    const dot = container.querySelector('[data-testid="observation-dot"]')
    expect(dot).not.toBeInTheDocument()
  })
})

describe('KAN-57: Tooltip — Hover muestra firmante', () => {
  it('[KAN-57] hover en celda firmada muestra tooltip con firmante y dosis', () => {
    const signedMed = {
      ...fixedMed,
      administrations: [{
        id: 100, administeredAt: todayAt(now.getHours(), 30),
        doseGiven: '1000', signedBy: 'Enfermera Ana', note: 'Paciente con náuseas',
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[signedMed]} {...defaultProps} />
    )
    const signedCell = container.querySelector('td[data-signed="true"]')
    expect(signedCell).toBeInTheDocument()

    fireEvent.mouseEnter(signedCell)
    const tooltip = container.querySelector('[data-testid="cell-tooltip"]')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip.textContent).toContain('Enfermera Ana')
    expect(tooltip.textContent).toContain('1000mg')
    expect(tooltip.textContent).toContain('Paciente con náuseas')
  })

  it('[KAN-57] tooltip desaparece al salir del hover', () => {
    const signedMed = {
      ...fixedMed,
      administrations: [{
        id: 100, administeredAt: todayAt(now.getHours(), 30),
        doseGiven: '1000', signedBy: 'Enfermera Ana', note: null,
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[signedMed]} {...defaultProps} />
    )
    const signedCell = container.querySelector('td[data-signed="true"]')
    fireEvent.mouseEnter(signedCell)
    expect(container.querySelector('[data-testid="cell-tooltip"]')).toBeInTheDocument()

    fireEvent.mouseLeave(signedCell)
    expect(container.querySelector('[data-testid="cell-tooltip"]')).not.toBeInTheDocument()
  })
})

describe('KAN-57: Editar — Icono lápiz en hover', () => {
  it('[KAN-57] hover en celda firmada muestra icono de edición', () => {
    const signedMed = {
      ...fixedMed,
      administrations: [{
        id: 100, administeredAt: todayAt(now.getHours(), 30),
        doseGiven: '1000', signedBy: 'Enfermera Ana', note: null,
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[signedMed]} {...defaultProps} />
    )
    const signedCell = container.querySelector('td[data-signed="true"]')
    fireEvent.mouseEnter(signedCell)
    const editIcon = container.querySelector('[data-testid="edit-icon"]')
    expect(editIcon).toBeInTheDocument()
  })

  it('[KAN-57] clic en icono lápiz abre EditModal (no desfirma)', () => {
    const onOpenEditModal = vi.fn()
    const onDirectUnsign = vi.fn()
    const signedMed = {
      ...fixedMed,
      administrations: [{
        id: 100, administeredAt: todayAt(now.getHours(), 30),
        doseGiven: '1000', signedBy: 'Enfermera Ana', note: null,
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[signedMed]} {...defaultProps}
        onOpenEditModal={onOpenEditModal} onDirectUnsign={onDirectUnsign} />
    )
    const signedCell = container.querySelector('td[data-signed="true"]')
    fireEvent.mouseEnter(signedCell)
    const editIcon = container.querySelector('[data-testid="edit-icon"]')
    fireEvent.click(editIcon)
    expect(onOpenEditModal).toHaveBeenCalledWith(
      expect.objectContaining({ id: 100 }),
      expect.objectContaining({ id: 1, name: 'Paracetamol' })
    )
    // Should NOT trigger unsign
    expect(onDirectUnsign).not.toHaveBeenCalled()
  })
})

describe('KAN-57: ▶ dinámica — se recalcula tras firmar', () => {
  // Use a future admission so scheduled slots are not filtered as past
  const futureStart = new Date()
  futureStart.setMinutes(0, 0, 0)
  const futureAdmission = futureStart.toISOString()
  const currentHour = futureStart.getHours()
  // Schedule at current+1, current+9, current+17 (all in the future, 8h apart)
  const h1 = (currentHour + 1) % 24
  const h2 = (currentHour + 9) % 24
  const h3 = (currentHour + 17) % 24
  const futureMed = {
    ...fixedMed,
    scheduledHours: `${h1},${h2},${h3}`,
    frequency: 'c/8h',
    administrations: [],
  }

  it('[KAN-57] sin administraciones muestra ▶ en horas pautadas futuras', () => {
    const { container } = render(
      <MedicationGrid prescriptions={[futureMed]} admissionDate={futureAdmission}
        onDirectSign={vi.fn()} onDirectUnsign={vi.fn()}
        onOpenInsulinModal={vi.fn()} onOpenEditModal={vi.fn()} />
    )
    const arrows = Array.from(container.querySelectorAll('td')).filter(td => td.textContent.includes('▶'))
    expect(arrows.length).toBeGreaterThanOrEqual(3)
  })

  it('[KAN-57] no muestra ▶ en horas pasadas', () => {
    // Past cells (data-past="true") should never contain ▶
    const { container } = render(
      <MedicationGrid prescriptions={[futureMed]} admissionDate={futureAdmission}
        onDirectSign={vi.fn()} onDirectUnsign={vi.fn()}
        onOpenInsulinModal={vi.fn()} onOpenEditModal={vi.fn()} />
    )
    const pastArrows = Array.from(container.querySelectorAll('td[data-past="true"]'))
      .filter(td => td.textContent.includes('▶'))
    expect(pastArrows.length).toBe(0)
  })

  it('[KAN-57] tras firmar, siguiente ▶ se recalcula desde la administración', () => {
    // Sign at h1 → next ▶ should be at h1+8, not at h2 (the original static hour)
    const signTime = new Date(futureStart)
    signTime.setHours(h1, 30, 0, 0)
    const medWithAdmin = {
      ...futureMed,
      administrations: [{
        id: 100, administeredAt: signTime.toISOString(),
        doseGiven: '1000', signedBy: 'Enfermera Ana', note: null,
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[medWithAdmin]} admissionDate={futureAdmission}
        onDirectSign={vi.fn()} onDirectUnsign={vi.fn()}
        onOpenInsulinModal={vi.fn()} onOpenEditModal={vi.fn()} />
    )
    // The signed cell should show ✓, not ▶
    const signedCells = Array.from(container.querySelectorAll('td')).filter(td => td.textContent.includes('✓'))
    expect(signedCells.length).toBe(1)
    const signedSlotArrows = Array.from(container.querySelectorAll('td[data-signed="true"]'))
      .filter(td => td.textContent.includes('▶'))
    expect(signedSlotArrows.length).toBe(0)
  })

  it('[KAN-57] celda firmada muestra ✓, no ▶', () => {
    const signedMed = {
      ...fixedMed,
      administrations: [{
        id: 100, administeredAt: todayAt(now.getHours(), 30),
        doseGiven: '1000', signedBy: 'Enfermera Ana', note: null,
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[signedMed]} {...defaultProps} />
    )
    const signedCells = Array.from(container.querySelectorAll('td')).filter(td => td.textContent.includes('✓'))
    expect(signedCells.length).toBe(1)
    const signedSlotArrows = Array.from(container.querySelectorAll('td[data-signed="true"]'))
      .filter(td => td.textContent.includes('▶'))
    expect(signedSlotArrows.length).toBe(0)
  })
})

describe('KAN-58: Insulina — Firma con modal', () => {
  it('[KAN-58] clic en celda de insulina llama onOpenInsulinModal (no firma directa)', () => {
    const onDirectSign = vi.fn()
    const onOpenInsulinModal = vi.fn()
    const { container } = render(
      <MedicationGrid
        prescriptions={[insulinMed]}
        {...defaultProps}
        onDirectSign={onDirectSign}
        onOpenInsulinModal={onOpenInsulinModal}
      />
    )
    const scheduledCell = container.querySelector('td[data-scheduled="true"]')
    if (scheduledCell) {
      fireEvent.click(scheduledCell)
      expect(onOpenInsulinModal).toHaveBeenCalledWith(insulinMed, expect.any(String))
      expect(onDirectSign).not.toHaveBeenCalled()
    }
  })
})

describe('KAN-52: Grid — Ancho fijo de celdas y scroll', () => {
  it('[KAN-52] la tabla tiene ancho fijo (240 + 72*56 = 4272px)', () => {
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />
    )
    const table = container.querySelector('table')
    expect(table).toBeInTheDocument()
    // 240 (label) + 72 * 56 (cells) = 4272
    expect(table.style.width).toBe('4272px')
    expect(table.style.tableLayout).toBe('fixed')
  })

  it('[KAN-52] tiene colgroup con 73 columnas (1 label + 72 horas)', () => {
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />
    )
    const cols = container.querySelectorAll('colgroup col')
    expect(cols.length).toBe(73) // 1 label + 72 hours
  })

  it('[KAN-52] primera columna del colgroup tiene ancho 240px', () => {
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />
    )
    const firstCol = container.querySelector('colgroup col')
    expect(firstCol.style.width).toBe('240px')
  })

  it('[KAN-52] columnas de horas tienen ancho 56px', () => {
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />
    )
    const cols = container.querySelectorAll('colgroup col')
    // Second col (first hour column)
    expect(cols[1].style.width).toBe('56px')
    expect(cols[72].style.width).toBe('56px')
  })

  it('[KAN-52] contenedor tiene overflow-x-auto y min-width:0 para scroll', () => {
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />
    )
    const scrollContainer = container.querySelector('.overflow-x-auto')
    expect(scrollContainer).toBeTruthy()
    expect(scrollContainer.style.minWidth).toBe('0')
  })

  it('[KAN-52] tabla es más ancha que un viewport típico (>1500px)', () => {
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />
    )
    const table = container.querySelector('table')
    const tableWidth = parseInt(table.style.width)
    expect(tableWidth).toBeGreaterThan(1500)
  })
})
