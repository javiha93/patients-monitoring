import { describe, it, expect } from 'vitest'
import { validateVitals } from '../components/VitalInput'

describe('KAN-59: validateVitals', () => {
  it('[KAN-59] returns empty for valid values', () => {
    const form = { systolicBp: '120', diastolicBp: '80', heartRate: '75', spo2: '98' }
    expect(Object.keys(validateVitals(form))).toHaveLength(0)
  })

  it('[KAN-59] returns empty for empty fields (all optional)', () => {
    const form = { systolicBp: '', diastolicBp: '', heartRate: '' }
    expect(Object.keys(validateVitals(form))).toHaveLength(0)
  })

  it('[KAN-59] flags systolicBp out of range', () => {
    expect(validateVitals({ systolicBp: '10' }).systolicBp).toBe('40–300')
    expect(validateVitals({ systolicBp: '400' }).systolicBp).toBe('40–300')
  })

  it('[KAN-59] flags diastolicBp out of range', () => {
    expect(validateVitals({ diastolicBp: '5' }).diastolicBp).toBe('20–200')
    expect(validateVitals({ diastolicBp: '250' }).diastolicBp).toBe('20–200')
  })

  it('[KAN-59] flags heartRate out of range', () => {
    expect(validateVitals({ heartRate: '10' }).heartRate).toBe('20–300')
    expect(validateVitals({ heartRate: '350' }).heartRate).toBe('20–300')
  })

  it('[KAN-59] flags spo2 out of range', () => {
    expect(validateVitals({ spo2: '20' }).spo2).toBe('30–100')
    expect(validateVitals({ spo2: '101' }).spo2).toBe('30–100')
  })

  it('[KAN-59] flags temperature out of range', () => {
    expect(validateVitals({ temperature: '25' }).temperature).toBe('30–43')
    expect(validateVitals({ temperature: '45' }).temperature).toBe('30–43')
  })

  it('[KAN-59] flags bloodGlucose out of range', () => {
    expect(validateVitals({ bloodGlucose: '5' }).bloodGlucose).toBe('10–700')
    expect(validateVitals({ bloodGlucose: '800' }).bloodGlucose).toBe('10–700')
  })

  it('[KAN-59] flags diuresis out of range', () => {
    expect(validateVitals({ diuresis: '-1' }).diuresis).toBe('0–5000')
    expect(validateVitals({ diuresis: '6000' }).diuresis).toBe('0–5000')
  })

  it('[KAN-59] accepts boundary values', () => {
    const form = {
      systolicBp: '40', diastolicBp: '200', heartRate: '300',
      spo2: '30', temperature: '43', bloodGlucose: '700', diuresis: '0',
    }
    expect(Object.keys(validateVitals(form))).toHaveLength(0)
  })

  it('[KAN-59] returns multiple errors at once', () => {
    const form = { systolicBp: '10', heartRate: '5', spo2: '200' }
    const errs = validateVitals(form)
    expect(Object.keys(errs)).toHaveLength(3)
  })
})
