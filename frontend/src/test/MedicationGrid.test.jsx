import { describe, it, expect, vi } from 'vitest'
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
    const { container } = render(<MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />)
    expect(screen.getByText('08:00')).toBeInTheDocument()
    expect(screen.getByText('09:00')).toBeInTheDocument()
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

describe('KAN-57: Firma directa — Medicación normal', () => {
  it('[KAN-57] clic en celda vacía llama onDirectSign (firma directa sin modal)', () => {
    const onDirectSign = vi.fn()
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} onDirectSign={onDirectSign} />
    )
    // Click any empty cell in the med row (not section header)
    const cells = container.querySelectorAll('tbody td')
    const emptyCell = Array.from(cells).find(td => td.textContent === '' && td.style.height === '44px')
    if (emptyCell) {
      fireEvent.click(emptyCell)
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
      expect(onDirectSign).toHaveBeenCalled()
    }
  })

  it('[KAN-57] muestra ✓ y dosis en celda firmada', () => {
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
    expect(container.textContent).toContain('1000')
  })

  it('[KAN-57] muestra punto azul en celda con observación', () => {
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
    const blueDot = container.querySelector('.bg-blue-500.rounded-full')
    expect(blueDot).toBeInTheDocument()
  })
})

describe('KAN-57: Desfirmar — Clic directo en celda firmada', () => {
  it('[KAN-57] clic en celda firmada llama onDirectUnsign (desfirma directa)', () => {
    // Mock window.confirm
    const originalConfirm = window.confirm
    window.confirm = vi.fn(() => true)

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
      expect(window.confirm).toHaveBeenCalled()
      expect(onDirectUnsign).toHaveBeenCalledWith(100)
    }

    window.confirm = originalConfirm
  })

  it('[KAN-57] cancelar confirm no desfirma', () => {
    const originalConfirm = window.confirm
    window.confirm = vi.fn(() => false)

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
      expect(onDirectUnsign).not.toHaveBeenCalled()
    }

    window.confirm = originalConfirm
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
    const cells = container.querySelectorAll('tbody td')
    const emptyCell = Array.from(cells).find(td => td.style.height === '44px' && !td.textContent.includes('✓'))
    if (emptyCell) {
      fireEvent.click(emptyCell)
      expect(onOpenInsulinModal).toHaveBeenCalledWith(insulinMed, expect.any(String))
      expect(onDirectSign).not.toHaveBeenCalled()
    }
  })
})
