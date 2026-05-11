import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InsulinSignModal, EditAdminModal } from '../components/SignModal'

const insulinScales = [
  { id: 1, glycemiaMin: 0, glycemiaMax: 149, doseUi: 0, sortOrder: 1 },
  { id: 2, glycemiaMin: 150, glycemiaMax: 250, doseUi: 2, sortOrder: 2 },
  { id: 3, glycemiaMin: 251, glycemiaMax: 350, doseUi: 4, sortOrder: 3 },
  { id: 4, glycemiaMin: 351, glycemiaMax: 9999, doseUi: 6, sortOrder: 4 },
]

const insulinPrescription = {
  id: 2, name: 'Insulina Novorapid', amount: '0', unit: 'UI',
  route: 'SC', frequency: 'c/6h', category: 'insulin',
  insulinScales,
}

const fixedPrescription = {
  id: 1, name: 'Paracetamol', amount: '1000', unit: 'mg',
  route: 'VO', frequency: 'c/8h', category: 'fixed',
}

const slot = '2024-01-10T08:00:00'
const currentUser = 'Enf. María Torres'

const freshVitals = [{
  id: 1, recordedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  bloodGlucose: 220, heartRate: 80, systolicBp: 120, diastolicBp: 80, spo2: 98,
}]

const staleVitals = [{
  id: 2, recordedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  bloodGlucose: 180, heartRate: 75, systolicBp: 130, diastolicBp: 85, spo2: 97,
}]

const noGlucoseVitals = [{
  id: 3, recordedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  bloodGlucose: null, heartRate: 70, systolicBp: 110, diastolicBp: 70, spo2: 99,
}]

const defaultProps = {
  open: true,
  prescription: insulinPrescription,
  slot,
  vitals: freshVitals,
  currentUser,
  onConfirm: vi.fn(),
  onClose: vi.fn(),
}

describe('KAN-58: InsulinSignModal — Estructura básica', () => {
  it('[KAN-58] no renderiza cuando open=false', () => {
    render(<InsulinSignModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Firmar insulina')).not.toBeInTheDocument()
  })

  it('[KAN-58] muestra título y nombre del medicamento', () => {
    render(<InsulinSignModal {...defaultProps} />)
    expect(screen.getByText('Firmar insulina')).toBeInTheDocument()
    expect(screen.getByText('Insulina Novorapid')).toBeInTheDocument()
  })

  it('[KAN-58] llama onClose al cancelar', () => {
    const onClose = vi.fn()
    render(<InsulinSignModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('KAN-58: Glucemia auto-leída de vitals', () => {
  it('[KAN-58] pre-rellena glucemia desde la última lectura', () => {
    render(<InsulinSignModal {...defaultProps} vitals={freshVitals} />)
    expect(screen.getByPlaceholderText('250').value).toBe('220')
  })

  it('[KAN-58] muestra indicador "lectura reciente" si < 2h', () => {
    render(<InsulinSignModal {...defaultProps} vitals={freshVitals} />)
    expect(screen.getByTestId('glucose-fresh').textContent).toContain('Lectura de las')
  })

  it('[KAN-58] muestra aviso si glucemia > 2h', () => {
    render(<InsulinSignModal {...defaultProps} vitals={staleVitals} />)
    const warning = screen.getByTestId('glucose-stale')
    expect(warning.textContent).toContain('más de 2h')
    expect(warning.textContent).toContain('considere tomar nueva glucemia')
  })

  it('[KAN-58] muestra mensaje si no hay glucemia en vitals', () => {
    render(<InsulinSignModal {...defaultProps} vitals={noGlucoseVitals} />)
    expect(screen.getByTestId('glucose-none').textContent).toContain('Sin registro de glucemia')
  })

  it('[KAN-58] muestra mensaje si no hay vitals', () => {
    render(<InsulinSignModal {...defaultProps} vitals={[]} />)
    expect(screen.getByTestId('glucose-none')).toBeInTheDocument()
  })

  it('[KAN-58] permite editar glucemia manualmente', () => {
    render(<InsulinSignModal {...defaultProps} />)
    const input = screen.getByPlaceholderText('250')
    fireEvent.change(input, { target: { value: '300' } })
    expect(input.value).toBe('300')
  })
})

describe('KAN-58: Dosis auto-calculada según pauta', () => {
  it('[KAN-58] calcula dosis según escala (220 → 2UI)', () => {
    render(<InsulinSignModal {...defaultProps} vitals={freshVitals} />)
    expect(screen.getByPlaceholderText('4').value).toBe('2')
  })

  it('[KAN-58] recalcula al cambiar glucemia (300 → 4UI)', () => {
    render(<InsulinSignModal {...defaultProps} vitals={freshVitals} />)
    fireEvent.change(screen.getByPlaceholderText('250'), { target: { value: '300' } })
    expect(screen.getByPlaceholderText('4').value).toBe('4')
  })

  it('[KAN-58] recalcula para glucemia alta (400 → 6UI)', () => {
    render(<InsulinSignModal {...defaultProps} vitals={freshVitals} />)
    fireEvent.change(screen.getByPlaceholderText('250'), { target: { value: '400' } })
    expect(screen.getByPlaceholderText('4').value).toBe('6')
  })

  it('[KAN-58] recalcula para glucemia baja (100 → 0UI)', () => {
    render(<InsulinSignModal {...defaultProps} vitals={freshVitals} />)
    fireEvent.change(screen.getByPlaceholderText('250'), { target: { value: '100' } })
    expect(screen.getByPlaceholderText('4').value).toBe('0')
  })

  it('[KAN-58] muestra sugerencia de dosis según pauta', () => {
    render(<InsulinSignModal {...defaultProps} vitals={freshVitals} />)
    expect(screen.getByTestId('dose-suggestion').textContent).toContain('Según pauta: 2 UI')
  })

  it('[KAN-58] permite modificar dosis manualmente', () => {
    render(<InsulinSignModal {...defaultProps} vitals={freshVitals} />)
    const input = screen.getByPlaceholderText('4')
    fireEvent.change(input, { target: { value: '5' } })
    expect(input.value).toBe('5')
  })
})

describe('KAN-58: Firmado por automático', () => {
  it('[KAN-58] pre-rellena firmado por con el usuario actual', () => {
    render(<InsulinSignModal {...defaultProps} />)
    expect(screen.getByDisplayValue('Enf. María Torres')).toBeInTheDocument()
  })

  it('[KAN-58] campo firmado por es de solo lectura', () => {
    render(<InsulinSignModal {...defaultProps} />)
    expect(screen.getByDisplayValue('Enf. María Torres')).toHaveAttribute('readOnly')
  })
})

describe('KAN-58: Envío del formulario', () => {
  it('[KAN-58] llama onConfirm con todos los datos correctos', () => {
    const onConfirm = vi.fn()
    render(<InsulinSignModal {...defaultProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Firmar'))
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      prescriptionId: 2,
      doseGiven: '2',
      signedBy: 'Enf. María Torres',
      note: expect.stringContaining('Glucemia: 220'),
    }))
  })
})

describe('KAN-57: EditAdminModal', () => {
  const admin = {
    id: 100, administeredAt: '2024-01-10T08:30:00',
    doseGiven: '1000', signedBy: 'Enfermera Ana', note: 'Sin incidencias',
  }

  it('[KAN-57] no renderiza cuando open=false', () => {
    render(<EditAdminModal open={false} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByText('Editar administración')).not.toBeInTheDocument()
  })

  it('[KAN-57] muestra datos del medicamento y firmante', () => {
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Paracetamol')).toBeInTheDocument()
    expect(screen.getByText(/Enfermera Ana/)).toBeInTheDocument()
  })

  it('[KAN-57] llama onUpdate al guardar', () => {
    const onUpdate = vi.fn()
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={onUpdate} onUnsign={vi.fn()} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Guardar'))
    expect(onUpdate).toHaveBeenCalledWith(100, expect.objectContaining({ doseGiven: '1000', note: 'Sin incidencias' }))
  })

  it('[KAN-57] llama onUnsign al desfirmar', () => {
    window.confirm = vi.fn(() => true)
    const onUnsign = vi.fn()
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={onUnsign} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Desfirmar'))
    expect(onUnsign).toHaveBeenCalledWith(100)
    window.confirm = vi.fn()
  })
})
