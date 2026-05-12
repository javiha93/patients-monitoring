import { describe, it, expect } from 'vitest'
import { formatDeviceDetail, formatDeviceTooltip } from '../components/VitalsTable'

describe('KAN-60: formatDeviceDetail — parámetros inline por dispositivo', () => {
  it('[KAN-60] gafas nasales: solo flujo', () => {
    const rs = { deviceType: 'nasal_cannula', flowRate: 2, fio2: null, peep: null }
    expect(formatDeviceDetail(rs)).toBe(' 2L')
  })

  it('[KAN-60] gafas nasales sin flujo: nada', () => {
    const rs = { deviceType: 'nasal_cannula', flowRate: null, fio2: null }
    expect(formatDeviceDetail(rs)).toBe('')
  })

  it('[KAN-60] gafas nasales: NO muestra FiO2 aunque tenga valor', () => {
    const rs = { deviceType: 'nasal_cannula', flowRate: 3, fio2: 28 }
    expect(formatDeviceDetail(rs)).toBe(' 3L')
    expect(formatDeviceDetail(rs)).not.toContain('FiO')
  })

  it('[KAN-60] mascarilla reservorio: solo flujo', () => {
    const rs = { deviceType: 'reservoir_mask', flowRate: 10, fio2: 60 }
    expect(formatDeviceDetail(rs)).toBe(' 10L')
    expect(formatDeviceDetail(rs)).not.toContain('FiO')
  })

  it('[KAN-60] ventimax: flujo + FiO2', () => {
    const rs = { deviceType: 'ventimax', flowRate: 8, fio2: 35 }
    expect(formatDeviceDetail(rs)).toBe(' 8L FiO₂35%')
  })

  it('[KAN-60] ventimax solo flujo sin FiO2', () => {
    const rs = { deviceType: 'ventimax', flowRate: 8, fio2: null }
    expect(formatDeviceDetail(rs)).toBe(' 8L')
  })

  it('[KAN-60] OAF: flujo + FiO2', () => {
    const rs = { deviceType: 'high_flow_cannula', flowRate: 50, fio2: 60 }
    expect(formatDeviceDetail(rs)).toBe(' 50L FiO₂60%')
  })

  it('[KAN-60] BiPAP: nada inline (ni flujo ni FiO2)', () => {
    const rs = { deviceType: 'bipap', flowRate: 5, fio2: 40, ipap: 14, epap: 6 }
    expect(formatDeviceDetail(rs)).toBe('')
  })

  it('[KAN-60] CPAP: nada inline', () => {
    const rs = { deviceType: 'cpap', flowRate: null, fio2: null }
    expect(formatDeviceDetail(rs)).toBe('')
  })

  it('[KAN-60] VM: FiO2 + PEEP', () => {
    const rs = { deviceType: 'mechanical_ventilation', fio2: 40, peep: 8, flowRate: null }
    expect(formatDeviceDetail(rs)).toBe(' FiO₂40% PEEP 8')
  })

  it('[KAN-60] VM: NO muestra flujo', () => {
    const rs = { deviceType: 'mechanical_ventilation', flowRate: 10, fio2: 40, peep: 8 }
    expect(formatDeviceDetail(rs)).not.toContain('10L')
  })

  it('[KAN-60] null input: empty string', () => {
    expect(formatDeviceDetail(null)).toBe('')
  })
})

describe('KAN-60: formatDeviceTooltip — tooltips por dispositivo', () => {
  it('[KAN-60] BiPAP: tooltip con IPAP/EPAP', () => {
    const rs = { deviceType: 'bipap', ipap: 14, epap: 6 }
    expect(formatDeviceTooltip(rs)).toBe('IPAP: 14 / EPAP: 6 cmH₂O')
  })

  it('[KAN-60] BiPAP sin valores: muestra —', () => {
    const rs = { deviceType: 'bipap', ipap: null, epap: null }
    expect(formatDeviceTooltip(rs)).toBe('IPAP: — / EPAP: — cmH₂O')
  })

  it('[KAN-60] VM: tooltip con Vt y FR prog', () => {
    const rs = { deviceType: 'mechanical_ventilation', tidalVolume: 450, respiratoryRateSet: 14 }
    expect(formatDeviceTooltip(rs)).toBe('Vt: 450 mL · FR prog: 14 rpm')
  })

  it('[KAN-60] VM sin Vt/FR: no tooltip', () => {
    const rs = { deviceType: 'mechanical_ventilation', tidalVolume: null, respiratoryRateSet: null }
    expect(formatDeviceTooltip(rs)).toBeUndefined()
  })

  it('[KAN-60] gafas nasales: no tooltip', () => {
    const rs = { deviceType: 'nasal_cannula', flowRate: 2 }
    expect(formatDeviceTooltip(rs)).toBeUndefined()
  })

  it('[KAN-60] ventimax: no tooltip', () => {
    const rs = { deviceType: 'ventimax', flowRate: 8, fio2: 35 }
    expect(formatDeviceTooltip(rs)).toBeUndefined()
  })

  it('[KAN-60] CPAP: no tooltip', () => {
    const rs = { deviceType: 'cpap' }
    expect(formatDeviceTooltip(rs)).toBeUndefined()
  })

  it('[KAN-60] null input: undefined', () => {
    expect(formatDeviceTooltip(null)).toBeUndefined()
  })
})

import { render, screen } from '@testing-library/react'
import VitalsTable from '../components/VitalsTable'

const mkVital = (overrides) => ({
  id: 1, recordedAt: '2024-01-10T08:00:00',
  systolicBp: null, diastolicBp: null, heartRate: null, spo2: null,
  respiratoryRate: null, temperature: null, painLevel: null,
  bloodGlucose: null, diuresis: null, urineSource: null, diaperAmount: null,
  respiratorySupport: null,
  ...overrides,
})

describe('KAN-59: Diuresis display in VitalsTable', () => {
  it('[KAN-59] shows — when no diuresis and no urineSource', () => {
    render(<VitalsTable vitals={[mkVital({})]} />)
    const cells = screen.getAllByText('—')
    expect(cells.length).toBeGreaterThan(0)
  })

  it('[KAN-59] shows mL with source tag for sonda vesical', () => {
    render(<VitalsTable vitals={[mkVital({ diuresis: 350, urineSource: 'sonda_vesical' })]} />)
    expect(screen.getByText('350mL')).toBeInTheDocument()
    expect(screen.getByText('(SV)')).toBeInTheDocument()
  })

  it('[KAN-59] shows mL with source tag for colector', () => {
    render(<VitalsTable vitals={[mkVital({ diuresis: 200, urineSource: 'colector' })]} />)
    expect(screen.getByText('200mL')).toBeInTheDocument()
    expect(screen.getByText('(Col)')).toBeInTheDocument()
  })

  it('[KAN-59] shows mL with source tag for urostomia', () => {
    render(<VitalsTable vitals={[mkVital({ diuresis: 500, urineSource: 'urostomia' })]} />)
    expect(screen.getByText('500mL')).toBeInTheDocument()
    expect(screen.getByText('(Uro)')).toBeInTheDocument()
  })

  it('[KAN-59] shows diaper amount label for pañal', () => {
    render(<VitalsTable vitals={[mkVital({ urineSource: 'panal', diaperAmount: 'abundante' })]} />)
    expect(screen.getByText('Abundante')).toBeInTheDocument()
  })

  it('[KAN-59] shows "Pañal" when panal without amount', () => {
    render(<VitalsTable vitals={[mkVital({ urineSource: 'panal', diaperAmount: null })]} />)
    expect(screen.getByText('Pañal')).toBeInTheDocument()
  })

  it('[KAN-59] shows diuresis mL without source tag when no urineSource', () => {
    render(<VitalsTable vitals={[mkVital({ diuresis: 400 })]} />)
    expect(screen.getByText('400mL')).toBeInTheDocument()
  })
})

describe('Drain output rows in VitalsTable', () => {
  const drains = [
    { id: 10, type: 'redon', drainNumber: 1, region: 'abdomen', laterality: 'derecha' },
    { id: 11, type: 'jackson_pratt', drainNumber: 2, region: 'pelvis', laterality: 'medial' },
  ]

  it('muestra filas de drenaje cuando hay drenajes activos', () => {
    const vital = mkVital({
      drainOutputs: [
        { deviceId: 10, drainNumber: 1, outputMl: 120, fluidType: 'seroso', vacuumActive: true },
        { deviceId: 11, drainNumber: 2, outputMl: 45, fluidType: 'serohematico', vacuumActive: true },
      ],
    })
    render(<VitalsTable vitals={[vital]} activeDrains={drains} />)
    expect(screen.getByText('Redon #1')).toBeInTheDocument()
    expect(screen.getByText('J-P #2')).toBeInTheDocument()
    expect(screen.getByText('120mL')).toBeInTheDocument()
    expect(screen.getByText('45mL')).toBeInTheDocument()
  })

  it('muestra — cuando no hay datos de drenaje en una constante', () => {
    const vital = mkVital({ drainOutputs: [] })
    render(<VitalsTable vitals={[vital]} activeDrains={drains} />)
    expect(screen.getByText('Redon #1')).toBeInTheDocument()
    // The drain cells should show dashes
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('resalta débito hemático en rojo', () => {
    const vital = mkVital({
      drainOutputs: [
        { deviceId: 10, drainNumber: 1, outputMl: 80, fluidType: 'hematico', vacuumActive: true },
      ],
    })
    render(<VitalsTable vitals={[vital]} activeDrains={drains} />)
    const cell = screen.getByText('80mL').closest('td')
    expect(cell.className).toContain('bg-red-50')
  })
})
