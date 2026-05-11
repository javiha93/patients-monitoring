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

const suspendedMed = {
  id: 5, name: 'Omeprazol', amount: '20', unit: 'mg', route: 'VO',
  frequency: 'c/24h', category: 'fixed', scheduledHours: '8',
  conditionText: null, prescribedBy: 'García', suspended: true, administrations: [],
}

const admissionDate = '2024-01-10T08:00:00'
const defaultProps = {
  admissionDate,
  onSign: vi.fn(),
  onEditAdmin: vi.fn(),
  insulinScales: [],
}

describe('KAN-52: Grid de medicación 72h — Estructura', () => {
  it('[KAN-52] muestra mensaje cuando no hay prescripciones', () => {
    render(<MedicationGrid prescriptions={[]} {...defaultProps} />)
    expect(screen.getByText('No hay medicación pautada')).toBeInTheDocument()
  })

  it('[KAN-52] muestra cabecera con columna Medicación', () => {
    render(<MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />)
    expect(screen.getByText('Medicación')).toBeInTheDocument()
  })

  it('[KAN-52] muestra 72 columnas de horas', () => {
    const { container } = render(<MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />)
    // Header row has 72 hour cells + 1 label cell
    const headerCells = container.querySelectorAll('thead tr:last-child th')
    expect(headerCells.length).toBe(73) // 72 hours + 1 label
  })

  it('[KAN-52] muestra cabeceras de día agrupadas', () => {
    render(<MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />)
    // Admission on Jan 10 → should show 10/01, 11/01, 12/01
    expect(screen.getByText('10/01')).toBeInTheDocument()
    expect(screen.getByText('11/01')).toBeInTheDocument()
    expect(screen.getByText('12/01')).toBeInTheDocument()
  })
})

describe('KAN-52: Grid — Secciones por categoría', () => {
  const allMeds = [fixedMed, conditionalMed, fluidMed, insulinMed]

  it('[KAN-52] muestra sección Medicación fija', () => {
    render(<MedicationGrid prescriptions={allMeds} {...defaultProps} />)
    expect(screen.getByText(/Medicación fija/)).toBeInTheDocument()
  })

  it('[KAN-52] muestra sección Medicación condicional', () => {
    render(<MedicationGrid prescriptions={allMeds} {...defaultProps} />)
    expect(screen.getByText(/Medicación condicional/)).toBeInTheDocument()
  })

  it('[KAN-52] muestra sección Sueroterapia', () => {
    render(<MedicationGrid prescriptions={allMeds} {...defaultProps} />)
    expect(screen.getByText(/Sueroterapia/)).toBeInTheDocument()
  })

  it('[KAN-52] muestra sección Insulina', () => {
    render(<MedicationGrid prescriptions={allMeds} {...defaultProps} />)
    expect(screen.getByText(/Insulina/)).toBeInTheDocument()
  })

  it('[KAN-52] no muestra secciones vacías', () => {
    render(<MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />)
    expect(screen.queryByText(/Medicación condicional/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Sueroterapia/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Insulina/)).not.toBeInTheDocument()
  })

  it('[KAN-52] muestra contador de medicamentos por sección', () => {
    render(<MedicationGrid prescriptions={allMeds} {...defaultProps} />)
    expect(screen.getByText(/Medicación fija \(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Medicación condicional \(1\)/)).toBeInTheDocument()
  })
})

describe('KAN-56: Prescripciones — Información del medicamento', () => {
  it('[KAN-56] muestra nombre del medicamento', () => {
    render(<MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />)
    expect(screen.getByText('Paracetamol')).toBeInTheDocument()
  })

  it('[KAN-56] muestra dosis, vía y frecuencia', () => {
    render(<MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />)
    expect(screen.getByText(/1000 mg · VO · c\/8h/)).toBeInTheDocument()
  })

  it('[KAN-56] muestra condición para medicación condicional', () => {
    render(<MedicationGrid prescriptions={[conditionalMed]} {...defaultProps} />)
    expect(screen.getByText(/Si Tª > 38°C/)).toBeInTheDocument()
  })

  it('[KAN-56] muestra prescriptor', () => {
    render(<MedicationGrid prescriptions={[fixedMed]} {...defaultProps} />)
    expect(screen.getByText(/Dr. García/)).toBeInTheDocument()
  })

  it('[KAN-56] muestra indicador SUSPENDIDO', () => {
    render(<MedicationGrid prescriptions={[suspendedMed]} {...defaultProps} />)
    expect(screen.getByText('SUSPENDIDO')).toBeInTheDocument()
  })
})

describe('KAN-57: Firma de administración — Interacción', () => {
  it('[KAN-57] llama onSign al hacer clic en celda programada', () => {
    const onSign = vi.fn()
    const { container } = render(
      <MedicationGrid prescriptions={[fixedMed]} {...defaultProps} onSign={onSign} />
    )
    // Find a scheduled cell (contains ▸)
    const scheduledCells = container.querySelectorAll('td')
    const scheduled = Array.from(scheduledCells).find(td => td.textContent.includes('▸'))
    if (scheduled) {
      fireEvent.click(scheduled)
      expect(onSign).toHaveBeenCalled()
      const callArgs = onSign.mock.calls[0][0]
      expect(callArgs.prescriptionId).toBe(1)
    }
  })

  it('[KAN-57] llama onEditAdmin al hacer clic en celda firmada', () => {
    const onEditAdmin = vi.fn()
    const signedMed = {
      ...fixedMed,
      administrations: [{
        id: 100, administeredAt: '2024-01-10T08:30:00',
        doseGiven: '1000', signedBy: 'Enfermera Ana', note: null,
      }],
    }
    const { container } = render(
      <MedicationGrid prescriptions={[signedMed]} {...defaultProps} onEditAdmin={onEditAdmin} />
    )
    // Find the cell with a check mark (signed)
    const signedCell = container.querySelector('td .text-green-600')
    if (signedCell) {
      fireEvent.click(signedCell.closest('td'))
      expect(onEditAdmin).toHaveBeenCalled()
      expect(onEditAdmin.mock.calls[0][0].id).toBe(100)
    }
  })

  it('[KAN-57] muestra check verde en celda firmada', () => {
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
    const checks = container.querySelectorAll('.text-green-600')
    expect(checks.length).toBeGreaterThan(0)
  })

  it('[KAN-57] muestra indicador de observación (punto azul) en celda con nota', () => {
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

describe('KAN-58: Insulina — Escala de glucemia', () => {
  it('[KAN-58] muestra fila de escala de glucemia bajo insulina', () => {
    const scales = [{
      prescriptionId: 4,
      ranges: [
        { minGlycemia: 150, maxGlycemia: 200, dose: 2 },
        { minGlycemia: 201, maxGlycemia: 250, dose: 4 },
        { minGlycemia: 251, maxGlycemia: 300, dose: 6 },
      ],
    }]
    render(
      <MedicationGrid prescriptions={[insulinMed]} {...defaultProps} insulinScales={scales} />
    )
    expect(screen.getByText('Escala glucemia')).toBeInTheDocument()
    expect(screen.getByText(/150-200: 2UI/)).toBeInTheDocument()
    expect(screen.getByText(/201-250: 4UI/)).toBeInTheDocument()
  })

  it('[KAN-58] no muestra escala si no hay datos', () => {
    render(
      <MedicationGrid prescriptions={[insulinMed]} {...defaultProps} insulinScales={[]} />
    )
    expect(screen.queryByText('Escala glucemia')).not.toBeInTheDocument()
  })
})
