import { describe, it, expect } from 'vitest'
import { getSamplesNeeded, buildLabel, SAMPLE_ICONS } from '../constants/labCatalog'

describe('getSamplesNeeded', () => {
  it('returns empty for no params', () => {
    expect(getSamplesNeeded([])).toEqual([])
    expect(getSamplesNeeded(null)).toEqual([])
  })

  it('returns tubo hemograma for hemograma', () => {
    const result = getSamplesNeeded(['hemograma'])
    expect(result).toContainEqual(SAMPLE_ICONS.tubo_hemograma)
    expect(result).not.toContainEqual(SAMPLE_ICONS.tubo_bioquimica)
  })

  it('returns tubo bioquímica for glucosa/creatinina', () => {
    const result = getSamplesNeeded(['glucosa', 'creatinina'])
    expect(result).toContainEqual(SAMPLE_ICONS.tubo_bioquimica)
    expect(result).not.toContainEqual(SAMPLE_ICONS.tubo_hemograma)
  })

  it('returns tubo coagulación for tp_inr', () => {
    const result = getSamplesNeeded(['tp_inr', 'ttpa'])
    expect(result).toContainEqual(SAMPLE_ICONS.tubo_coagulacion)
  })

  it('returns 3 tubes for básico preset', () => {
    const result = getSamplesNeeded(['hemograma', 'glucosa', 'creatinina', 'sodio', 'potasio', 'pcr', 'tp_inr'])
    const keys = result.map(r => r.key)
    expect(keys).toContain('tubo_bioquimica')
    expect(keys).toContain('tubo_hemograma')
    expect(keys).toContain('tubo_coagulacion')
  })

  it('returns gasometría arterial (roja) for gasometria_arterial', () => {
    const result = getSamplesNeeded(['gasometria_arterial'])
    expect(result).toContainEqual(SAMPLE_ICONS.gasometria_arterial)
  })

  it('returns gasometría venosa (azul) for gasometria_venosa', () => {
    const result = getSamplesNeeded(['gasometria_venosa'])
    expect(result).toContainEqual(SAMPLE_ICONS.gasometria_venosa)
  })

  it('returns gasometría venosa for lactato', () => {
    const result = getSamplesNeeded(['lactato'])
    expect(result).toContainEqual(SAMPLE_ICONS.gasometria_venosa)
  })

  it('returns both gasometrías when both types requested', () => {
    const result = getSamplesNeeded(['gasometria_arterial', 'gasometria_venosa'])
    expect(result).toContainEqual(SAMPLE_ICONS.gasometria_arterial)
    expect(result).toContainEqual(SAMPLE_ICONS.gasometria_venosa)
  })

  it('returns hisopo for PCR COVID', () => {
    const result = getSamplesNeeded(['pcr_covid'])
    expect(result).toContainEqual(SAMPLE_ICONS.hisopo)
  })

  it('returns hisopo for antígeno rápido gripe', () => {
    const result = getSamplesNeeded(['ag_rapido_gripe'])
    expect(result).toContainEqual(SAMPLE_ICONS.hisopo)
  })

  it('returns muestra orina for orina params', () => {
    const result = getSamplesNeeded(['orina_sistematico', 'orina_sedimento'])
    expect(result).toContainEqual(SAMPLE_ICONS.orina)
  })

  it('returns muestra orina for urocultivo', () => {
    const result = getSamplesNeeded(['urocultivo'])
    expect(result).toContainEqual(SAMPLE_ICONS.orina)
  })

  it('returns muestra heces for heces params', () => {
    const result = getSamplesNeeded(['heces_sangre_oculta'])
    expect(result).toContainEqual(SAMPLE_ICONS.heces)
  })

  it('returns muestra heces for coprocultivo', () => {
    const result = getSamplesNeeded(['coprocultivo'])
    expect(result).toContainEqual(SAMPLE_ICONS.heces)
  })

  it('returns muestra esputo for esputo params', () => {
    const result = getSamplesNeeded(['esputo_gram', 'esputo_baar'])
    expect(result).toContainEqual(SAMPLE_ICONS.esputo)
  })

  it('returns hemocultivo bottles for hemocultivo', () => {
    const result = getSamplesNeeded(['hemocultivo_x2'])
    expect(result).toContainEqual(SAMPLE_ICONS.hemocultivo)
  })

  it('returns cultivo_otro for cultivo punta catéter', () => {
    const result = getSamplesNeeded(['cultivo_punta_cateter'])
    expect(result).toContainEqual(SAMPLE_ICONS.cultivo_otro)
  })

  it('returns multiple sample types for multi-sample request', () => {
    // Simulates ITU preset: sangre + orina + urocultivo
    const result = getSamplesNeeded(['hemograma', 'pcr', 'creatinina', 'urea', 'orina_sistematico', 'orina_sedimento', 'urocultivo'])
    const keys = result.map(r => r.key)
    expect(keys).toContain('tubo_bioquimica')
    expect(keys).toContain('tubo_hemograma')
    expect(keys).toContain('orina')
    expect(keys.length).toBe(3) // bioq + hemograma + orina (urocultivo merges with orina)
  })
})

describe('buildLabel', () => {
  it('builds label from single sample type', () => {
    const selected = new Map([
      ['sangre', new Set(['hemograma', 'reticulocitos', 'frotis_sangre', 'vsg'])],
      ['orina', new Set()],
    ])
    const label = buildLabel(selected)
    expect(label).toContain('Hemograma')
  })

  it('builds label from multiple sample types', () => {
    const selected = new Map([
      ['sangre', new Set(['hemograma'])],
      ['orina', new Set(['orina_sistematico'])],
    ])
    const label = buildLabel(selected)
    expect(label).toContain('Hemograma')
    expect(label).toContain('orina')
  })
})
