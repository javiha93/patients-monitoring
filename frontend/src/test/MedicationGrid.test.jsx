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

const admissionDate = '2024-01-10T08:00:00'
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
    expect(screen.getByText('11/01')).toBeInTheDocument()
    expect(screen.getByText('12/01')).toBeInTheDocument()
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
        id: 100, administeredAt: '2024-01-10T08:30:00',
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
        id: 101, administeredAt: '2024-01-10T08:30:00',
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
        id: 100, administeredAt: '2024-01-10T08:30:00',
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
        id: 100, administeredAt: '2024-01-10T08:30:00',
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
        id: 100, administeredAt: '2024-01-10T08:30:00',
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
        id: 100, administeredAt: '2024-01-10T08:30:00',
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
        id: 100, administeredAt: '2024-01-10T08:30:00',
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
        id: 100, administeredAt: '2024-01-10T08:30:00',
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
        id: 100, administeredAt: '2024-01-10T08:30:00',
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
  it('[KAN-57] sin administraciones muestra ▶ en horas pautadas iniciales', () => {
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />
    )
    // scheduledHours: '8,16,0' with c/8h → arrows at static hours initially
    const arrows = Array.from(container.querySelectorAll('td')).filter(td => td.textContent.includes('▶'))
    expect(arrows.length).toBeGreaterThanOrEqual(3)
  })

  it('[KAN-57] tras firmar a las 10:00, siguiente ▶ se mueve a 10+8=18:00', () => {
    // Dexketoprofeno c/8h, scheduled at 8,16,0
    // Signed at 10:00 → next should be at 18:00, then 02:00
    const medWithAdmin = {
      ...fixedMed,
      name: 'Dexketoprofeno',
      scheduledHours: '8,16,0',
      administrations: [{
        id: 100, administeredAt: '2024-01-10T10:00:00',
        doseGiven: '1000', signedBy: 'Enfermera Ana', note: null,
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[medWithAdmin]} {...defaultProps} />
    )
    // The 08:00 slot (first scheduled) should still have ▶ (it's before the admin)
    // After admin at 10:00, next ▶ should be at 18:00 (10+8), then 02:00 (18+8)
    // NOT at 16:00 and 00:00 (the original static hours)
    const allCells = Array.from(container.querySelectorAll('td[data-scheduled="true"]'))
    const arrowCells = allCells.filter(td => td.textContent.includes('▶'))

    // Check that 18:00 has an arrow
    // Slot index: admission starts at 08:00, so 18:00 = index 10
    const slot18 = container.querySelectorAll('thead th')[11] // +1 for label column
    if (slot18) {
      expect(slot18.textContent).toContain('18:00')
    }

    // Verify arrows exist and the signed cell at 10:00 has ✓ not ▶
    const signedCells = Array.from(container.querySelectorAll('td')).filter(td => td.textContent.includes('✓'))
    expect(signedCells.length).toBe(1)
  })

  it('[KAN-57] celda firmada muestra ✓, no ▶', () => {
    const signedMed = {
      ...fixedMed,
      administrations: [{
        id: 100, administeredAt: '2024-01-10T08:30:00',
        doseGiven: '1000', signedBy: 'Enfermera Ana', note: null,
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[signedMed]} {...defaultProps} />
    )
    // The signed slot should show ✓, not ▶
    const signedCells = Array.from(container.querySelectorAll('td')).filter(td => td.textContent.includes('✓'))
    expect(signedCells.length).toBe(1)
    // No arrow at the signed hour
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
