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
