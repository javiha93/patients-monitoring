import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InsulinSignModal, EditAdminModal, calcDoseFromScale, getLatestGlucose } from '../components/SignModal'

/* ── Test data ── */

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

const mkVitals = (glucose, minutesAgo) => [{
  id: 1,
  recordedAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
  bloodGlucose: glucose,
  heartRate: 80, systolicBp: 120, diastolicBp: 80, spo2: 98,
}]

const freshVitals = mkVitals(220, 30)       // 220 mg/dL, 30 min ago
const staleVitals = mkVitals(180, 180)      // 180 mg/dL, 3h ago
const glucose158 = mkVitals(158, 20)        // 158 mg/dL, 20 min ago
const glucose100 = mkVitals(100, 10)        // 100 mg/dL, 10 min ago
const glucose300 = mkVitals(300, 15)        // 300 mg/dL, 15 min ago
const glucose400 = mkVitals(400, 5)         // 400 mg/dL, 5 min ago
const noGlucoseVitals = mkVitals(null, 60)  // no glucose

const defaultProps = {
  open: true,
  prescription: insulinPrescription,
  slot,
  vitals: freshVitals,
  currentUser,
  onConfirm: vi.fn(),
  onClose: vi.fn(),
}

/* ── Unit tests: calcDoseFromScale ── */

describe('calcDoseFromScale — unit tests', () => {
  it('returns "0" for glycemia 1-149', () => {
    expect(calcDoseFromScale(insulinScales, 1)).toBe('0')
    expect(calcDoseFromScale(insulinScales, 100)).toBe('0')
    expect(calcDoseFromScale(insulinScales, 149)).toBe('0')
  })

  it('returns "2" for glycemia 150-250', () => {
    expect(calcDoseFromScale(insulinScales, 150)).toBe('2')
    expect(calcDoseFromScale(insulinScales, 158)).toBe('2')
    expect(calcDoseFromScale(insulinScales, 200)).toBe('2')
    expect(calcDoseFromScale(insulinScales, 250)).toBe('2')
  })

  it('returns "4" for glycemia 251-350', () => {
    expect(calcDoseFromScale(insulinScales, 251)).toBe('4')
    expect(calcDoseFromScale(insulinScales, 300)).toBe('4')
    expect(calcDoseFromScale(insulinScales, 350)).toBe('4')
  })

  it('returns "6" for glycemia > 350', () => {
    expect(calcDoseFromScale(insulinScales, 351)).toBe('6')
    expect(calcDoseFromScale(insulinScales, 400)).toBe('6')
    expect(calcDoseFromScale(insulinScales, 500)).toBe('6')
  })

  it('handles string glycemia values', () => {
    expect(calcDoseFromScale(insulinScales, '158')).toBe('2')
    expect(calcDoseFromScale(insulinScales, '300')).toBe('4')
  })

  it('returns null for null/undefined/empty/zero glycemia', () => {
    expect(calcDoseFromScale(insulinScales, null)).toBeNull()
    expect(calcDoseFromScale(insulinScales, undefined)).toBeNull()
    expect(calcDoseFromScale(insulinScales, '')).toBeNull()
    expect(calcDoseFromScale(insulinScales, 0)).toBeNull()  // 0 is not a valid glucose
  })

  it('returns null for null/empty scales', () => {
    expect(calcDoseFromScale(null, 200)).toBeNull()
    expect(calcDoseFromScale([], 200)).toBeNull()
  })

  it('works with unsorted scales', () => {
    const shuffled = [insulinScales[3], insulinScales[0], insulinScales[2], insulinScales[1]]
    expect(calcDoseFromScale(shuffled, 158)).toBe('2')
    expect(calcDoseFromScale(shuffled, 300)).toBe('4')
  })
})

/* ── Unit tests: getLatestGlucose ── */

describe('getLatestGlucose — unit tests', () => {
  it('returns null for empty vitals', () => {
    expect(getLatestGlucose([])).toBeNull()
    expect(getLatestGlucose(null)).toBeNull()
  })

  it('returns null when no vitals have glucose', () => {
    expect(getLatestGlucose(noGlucoseVitals)).toBeNull()
  })

  it('returns value and isStale=false for recent reading', () => {
    const result = getLatestGlucose(freshVitals)
    expect(result.value).toBe(220)
    expect(result.isStale).toBe(false)
  })

  it('returns value and isStale=true for old reading', () => {
    const result = getLatestGlucose(staleVitals)
    expect(result.value).toBe(180)
    expect(result.isStale).toBe(true)
  })

  it('picks the most recent glucose when multiple vitals exist', () => {
    const multi = [
      { id: 1, recordedAt: new Date(Date.now() - 120 * 60000).toISOString(), bloodGlucose: 100 },
      { id: 2, recordedAt: new Date(Date.now() - 30 * 60000).toISOString(), bloodGlucose: 220 },
      { id: 3, recordedAt: new Date(Date.now() - 60 * 60000).toISOString(), bloodGlucose: 180 },
    ]
    expect(getLatestGlucose(multi).value).toBe(220)
  })
})

/* ── Modal: structure ── */

describe('InsulinSignModal — structure', () => {
  it('does not render when open=false', () => {
    render(<InsulinSignModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Firmar insulina')).not.toBeInTheDocument()
  })

  it('shows title and prescription name', () => {
    render(<InsulinSignModal {...defaultProps} />)
    expect(screen.getByText('Firmar insulina')).toBeInTheDocument()
    expect(screen.getByText('Insulina Novorapid')).toBeInTheDocument()
  })

  it('calls onClose on cancel', () => {
    const onClose = vi.fn()
    render(<InsulinSignModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalled()
  })
})

/* ── Modal: glucose display ── */

describe('InsulinSignModal — glucose display', () => {
  it('shows glucose as read-only value', () => {
    render(<InsulinSignModal {...defaultProps} vitals={freshVitals} />)
    expect(screen.getByTestId('glucose-value').textContent).toBe('220')
  })

  it('shows fresh indicator for recent reading', () => {
    render(<InsulinSignModal {...defaultProps} vitals={freshVitals} />)
    expect(screen.getByTestId('glucose-fresh')).toBeInTheDocument()
  })

  it('shows stale warning for >2h reading but allows signing', () => {
    render(<InsulinSignModal {...defaultProps} vitals={staleVitals} />)
    expect(screen.getByTestId('glucose-stale')).toBeInTheDocument()
    expect(screen.getByText('Firmar')).not.toBeDisabled()
  })

  it('shows blocking alert when no glucose exists', () => {
    render(<InsulinSignModal {...defaultProps} vitals={[]} />)
    expect(screen.getByTestId('glucose-alert')).toBeInTheDocument()
    expect(screen.getByTestId('glucose-missing')).toBeInTheDocument()
    expect(screen.getByText('Firmar')).toBeDisabled()
  })

  it('does not call onConfirm when no glucose', () => {
    const onConfirm = vi.fn()
    render(<InsulinSignModal {...defaultProps} vitals={[]} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Firmar'))
    expect(onConfirm).not.toHaveBeenCalled()
  })
})

/* ── Modal: dose auto-calculation ── */

describe('InsulinSignModal — dose pre-filled from scale', () => {
  it('pre-fills dose 2 for glucose 158 (range 150-250)', () => {
    render(<InsulinSignModal {...defaultProps} vitals={glucose158} />)
    const input = screen.getByPlaceholderText('4')
    expect(input.value).toBe('2')
  })

  it('pre-fills dose 0 for glucose 100 (range <150)', () => {
    render(<InsulinSignModal {...defaultProps} vitals={glucose100} />)
    const input = screen.getByPlaceholderText('4')
    expect(input.value).toBe('0')
  })

  it('pre-fills dose 2 for glucose 220 (range 150-250)', () => {
    render(<InsulinSignModal {...defaultProps} vitals={freshVitals} />)
    const input = screen.getByPlaceholderText('4')
    expect(input.value).toBe('2')
  })

  it('pre-fills dose 4 for glucose 300 (range 251-350)', () => {
    render(<InsulinSignModal {...defaultProps} vitals={glucose300} />)
    const input = screen.getByPlaceholderText('4')
    expect(input.value).toBe('4')
  })

  it('pre-fills dose 6 for glucose 400 (range >350)', () => {
    render(<InsulinSignModal {...defaultProps} vitals={glucose400} />)
    const input = screen.getByPlaceholderText('4')
    expect(input.value).toBe('6')
  })

  it('shows dose suggestion text', () => {
    render(<InsulinSignModal {...defaultProps} vitals={glucose158} />)
    expect(screen.getByTestId('dose-suggestion').textContent).toContain('Según pauta: 2 UI')
  })

  it('shows dose suggestion for stale glucose too', () => {
    render(<InsulinSignModal {...defaultProps} vitals={staleVitals} />)
    const input = screen.getByPlaceholderText('4')
    expect(input.value).toBe('2')
    expect(screen.getByTestId('dose-suggestion').textContent).toContain('Según pauta: 2 UI')
  })

  it('allows manual dose override', () => {
    render(<InsulinSignModal {...defaultProps} vitals={freshVitals} />)
    const input = screen.getByPlaceholderText('4')
    fireEvent.change(input, { target: { value: '5' } })
    expect(input.value).toBe('5')
  })

  it('leaves dose empty when no glucose', () => {
    render(<InsulinSignModal {...defaultProps} vitals={[]} />)
    expect(screen.getByPlaceholderText('4').value).toBe('')
  })
})

/* ── Modal: auto-filled user ── */

describe('InsulinSignModal — auto-filled user', () => {
  it('pre-fills signedBy with currentUser', () => {
    render(<InsulinSignModal {...defaultProps} />)
    expect(screen.getByDisplayValue('Enf. María Torres')).toBeInTheDocument()
  })

  it('signedBy field is readOnly', () => {
    render(<InsulinSignModal {...defaultProps} />)
    expect(screen.getByDisplayValue('Enf. María Torres')).toHaveAttribute('readOnly')
  })
})

/* ── Modal: form submission ── */

describe('InsulinSignModal — form submission', () => {
  it('calls onConfirm with correct data for glucose 158', () => {
    const onConfirm = vi.fn()
    render(<InsulinSignModal {...defaultProps} vitals={glucose158} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Firmar'))
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      prescriptionId: 2,
      doseGiven: '2',
      signedBy: 'Enf. María Torres',
      note: expect.stringContaining('Glucemia: 158'),
    }))
  })

  it('calls onConfirm with dose 0 for glucose 100', () => {
    const onConfirm = vi.fn()
    render(<InsulinSignModal {...defaultProps} vitals={glucose100} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Firmar'))
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      doseGiven: '0',
      note: expect.stringContaining('Glucemia: 100'),
    }))
  })

  it('submits with stale glucose (allowed)', () => {
    const onConfirm = vi.fn()
    render(<InsulinSignModal {...defaultProps} vitals={staleVitals} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Firmar'))
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      doseGiven: '2',
      note: expect.stringContaining('Glucemia: 180'),
    }))
  })
})

/* ── EditAdminModal ── */

describe('EditAdminModal', () => {
  const admin = {
    id: 100, administeredAt: '2024-01-10T08:30:00',
    doseGiven: '1000', signedBy: 'Enfermera Ana', note: 'Sin incidencias',
  }

  it('does not render when open=false', () => {
    render(<EditAdminModal open={false} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByText('Editar administración')).not.toBeInTheDocument()
  })

  it('shows prescription and signer', () => {
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Paracetamol')).toBeInTheDocument()
    expect(screen.getByText(/Enfermera Ana/)).toBeInTheDocument()
  })

  it('calls onUpdate on save', () => {
    const onUpdate = vi.fn()
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={onUpdate} onUnsign={vi.fn()} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Guardar'))
    expect(onUpdate).toHaveBeenCalledWith(100, expect.objectContaining({ doseGiven: '1000', note: 'Sin incidencias' }))
  })

  it('calls onUnsign on unsign', () => {
    window.confirm = vi.fn(() => true)
    const onUnsign = vi.fn()
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={onUnsign} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Desfirmar'))
    expect(onUnsign).toHaveBeenCalledWith(100)
    window.confirm = vi.fn()
  })
})
