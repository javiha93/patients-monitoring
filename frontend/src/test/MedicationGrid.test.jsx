import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MedicationGrid from '../components/MedicationGrid'

const mockPrescriptions = [
  {
    id: 1, name: 'Paracetamol', amount: '1000', unit: 'mg', route: 'VO',
    frequency: 'c/8h', category: 'fixed', scheduledHours: '8,16,0',
    conditionText: null, administrations: [],
  },
  {
    id: 2, name: 'Metamizol', amount: '575', unit: 'mg', route: 'IV',
    frequency: 'Si precisa', category: 'conditional', scheduledHours: '',
    conditionText: 'Si Tª > 38°C', administrations: [],
  },
]

describe('KAN-52: Grid de medicación 72h', () => {
  it('[KAN-52] muestra las prescripciones en el grid', () => {
    render(
      <MedicationGrid
        prescriptions={mockPrescriptions}
        admissionDate="2024-01-10T08:00:00"
        onSign={vi.fn()}
        onUnsign={vi.fn()}
      />
    )
    expect(screen.getByText('Paracetamol')).toBeInTheDocument()
    expect(screen.getByText('Metamizol')).toBeInTheDocument()
  })

  it('[KAN-56] muestra dosis, vía y frecuencia de cada prescripción', () => {
    render(
      <MedicationGrid
        prescriptions={mockPrescriptions}
        admissionDate="2024-01-10T08:00:00"
        onSign={vi.fn()}
        onUnsign={vi.fn()}
      />
    )
    expect(screen.getByText(/1000 mg · VO · c\/8h/)).toBeInTheDocument()
    expect(screen.getByText(/575 mg · IV · Si precisa/)).toBeInTheDocument()
  })

  it('[KAN-56] muestra categoría de cada prescripción', () => {
    render(
      <MedicationGrid
        prescriptions={mockPrescriptions}
        admissionDate="2024-01-10T08:00:00"
        onSign={vi.fn()}
        onUnsign={vi.fn()}
      />
    )
    expect(screen.getByText('Fija')).toBeInTheDocument()
    expect(screen.getByText('Condicional')).toBeInTheDocument()
  })

  it('[KAN-56] muestra condición para medicación condicional', () => {
    render(
      <MedicationGrid
        prescriptions={mockPrescriptions}
        admissionDate="2024-01-10T08:00:00"
        onSign={vi.fn()}
        onUnsign={vi.fn()}
      />
    )
    expect(screen.getByText('Si Tª > 38°C')).toBeInTheDocument()
  })

  it('[KAN-52] muestra mensaje cuando no hay prescripciones', () => {
    render(
      <MedicationGrid
        prescriptions={[]}
        admissionDate="2024-01-10T08:00:00"
        onSign={vi.fn()}
        onUnsign={vi.fn()}
      />
    )
    expect(screen.getByText('No hay medicación pautada')).toBeInTheDocument()
  })
})
