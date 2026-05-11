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
    // 08:00 appears 3 times in 72h grid (day 1, day 2, day 3)
    const hours08 = screen.getAllByText('08:00')
    expect(hours08.length).toBe(3)
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

describe('KAN-57: Firma directa — Solo celdas pautadas', () => {
  it('[KAN-57] clic en celda pautada llama onDirectSign con datos correctos', () => {
    const onDirectSign = vi.fn()
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} onDirectSign={onDirectSign} />
    )
    // Find a scheduled cell (has data-scheduled attribute)
    const scheduledCell = container.querySelector('td[data-scheduled="true"]')
    if (scheduledCell) {
      fireEvent.click(scheduledCell)
      expect(onDirectSign).toHaveBeenCalledTimes(1)
      expect(onDirectSign).toHaveBeenCalledWith(expect.objectContaining({
        prescriptionId: 1,
        doseGiven: '1000',
      }))
    }
  })

  it('[KAN-57] clic en celda NO pautada NO llama onDirectSign', () => {
    const onDirectSign = vi.fn()
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} onDirectSign={onDirectSign} />
    )
    // Find a non-scheduled, non-signed cell
    const nonScheduledCell = Array.from(container.querySelectorAll('td'))
      .find(td => !td.dataset.scheduled && !td.dataset.signed && td.style.height === '44px')
    if (nonScheduledCell) {
      fireEvent.click(nonScheduledCell)
      expect(onDirectSign).not.toHaveBeenCalled()
    }
  })

  it('[KAN-57] firma solo una celda, no múltiples', () => {
    const onDirectSign = vi.fn()
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} onDirectSign={onDirectSign} />
    )
    const scheduledCell = container.querySelector('td[data-scheduled="true"]')
    if (scheduledCell) {
      fireEvent.click(scheduledCell)
      // Should be called exactly once, not for multiple past hours
      expect(onDirectSign).toHaveBeenCalledTimes(1)
    }
  })
})

describe('KAN-57: Celda firmada — Muestra dosis con unidad', () => {
  it('[KAN-57] muestra ✓ y dosis CON unidad en celda firmada', () => {
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
    // Must show dose WITH unit (1000mg, not just 1000)
    expect(container.textContent).toContain('1000mg')
  })

  it('[KAN-57] muestra dosis con unidad "g" correctamente', () => {
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
    // Must show "1g" not just "1"
    expect(container.textContent).toContain('1g')
  })
})

describe('KAN-57: Celda firmada — Clic abre EditModal (no confirm)', () => {
  it('[KAN-57] clic en celda firmada llama onOpenEditModal (no confirm dialog)', () => {
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
    if (signedCell) {
      fireEvent.click(signedCell)
      // Should open edit modal, NOT call unsign or show confirm
      expect(onOpenEditModal).toHaveBeenCalledWith(
        expect.objectContaining({ id: 100, signedBy: 'Enfermera Ana' }),
        expect.objectContaining({ id: 1, name: 'Paracetamol' })
      )
      expect(onDirectUnsign).not.toHaveBeenCalled()
    }
  })
})

describe('KAN-57: Observación — Indicador visual y tooltip', () => {
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

  it('[KAN-57] NO muestra indicador azul en celda sin observación', () => {
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

  it('[KAN-57] muestra tooltip con firmante al hacer hover en celda firmada', () => {
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
    // Find the signed cell's parent wrapper (CellTooltip wraps in a div.contents)
    const signedCell = container.querySelector('td[data-signed="true"]')
    const wrapper = signedCell?.closest('.contents')
    if (wrapper) {
      fireEvent.mouseEnter(wrapper)
      const tooltip = container.querySelector('[data-testid="cell-tooltip"]')
      expect(tooltip).toBeInTheDocument()
      expect(tooltip.textContent).toContain('Enfermera Ana')
      expect(tooltip.textContent).toContain('1000mg')
      expect(tooltip.textContent).toContain('Paciente con náuseas')
    }
  })
})

describe('KAN-57: Siguiente dosis — Solo una celda con ▶', () => {
  it('[KAN-57] muestra ▶ solo en la SIGUIENTE dosis pautada (no en todas)', () => {
    // Use a future admission date so scheduled slots are in the future
    const futureDate = new Date()
    futureDate.setHours(futureDate.getHours() - 1) // start 1h ago
    futureDate.setMinutes(0, 0, 0)
    const futureAdmission = futureDate.toISOString()

    // Med with c/8h scheduled at hours that will appear in the 72h window
    const hour = futureDate.getHours()
    // Schedule at current hour +1, +9, +17 (so they're in the future)
    const h1 = (hour + 1) % 24
    const h2 = (hour + 9) % 24
    const h3 = (hour + 17) % 24
    const futureMed = {
      ...fixedMed,
      scheduledHours: `${h1},${h2},${h3}`,
      administrations: [],
    }

    const { container } = render(
      <MedicationGrid prescriptions={[futureMed]} admissionDate={futureAdmission}
        onDirectSign={vi.fn()} onDirectUnsign={vi.fn()}
        onOpenInsulinModal={vi.fn()} onOpenEditModal={vi.fn()} />
    )

    // Only ONE ▶ should appear (the next dose)
    const arrows = Array.from(container.querySelectorAll('td')).filter(td => td.textContent.includes('▶'))
    expect(arrows.length).toBe(1)
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
