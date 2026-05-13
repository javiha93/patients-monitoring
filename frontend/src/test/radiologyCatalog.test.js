import { describe, it, expect } from 'vitest'
import { BODY_AREAS, XRAY_REGIONS, CT_REGIONS, MRI_REGIONS, TYPE_LABELS, getRegionLabel } from '../constants/radiologyCatalog'

describe('radiologyCatalog', () => {
  it('BODY_AREAS has 6 areas', () => {
    expect(BODY_AREAS).toHaveLength(6)
    expect(BODY_AREAS.map(a => a.key)).toContain('torax')
    expect(BODY_AREAS.map(a => a.key)).toContain('ext_sup')
  })

  it('XRAY_REGIONS covers all body areas', () => {
    for (const area of BODY_AREAS) {
      expect(XRAY_REGIONS[area.key]).toBeDefined()
      expect(XRAY_REGIONS[area.key].length).toBeGreaterThan(0)
    }
  })

  it('each xray region has projections', () => {
    for (const regions of Object.values(XRAY_REGIONS)) {
      for (const r of regions) {
        expect(r.projections.length).toBeGreaterThan(0)
        expect(r.label).toBeTruthy()
        expect(r.key).toBeTruthy()
      }
    }
  })

  it('CT_REGIONS has entries', () => {
    expect(CT_REGIONS.length).toBeGreaterThan(5)
    expect(CT_REGIONS.find(r => r.key === 'craneo')).toBeTruthy()
  })

  it('MRI_REGIONS has entries', () => {
    expect(MRI_REGIONS.length).toBeGreaterThan(5)
    expect(MRI_REGIONS.find(r => r.key === 'rodilla')).toBeTruthy()
  })

  it('TYPE_LABELS maps all types', () => {
    expect(TYPE_LABELS.xray).toBe('Radiografía')
    expect(TYPE_LABELS.ct).toBe('TAC')
    expect(TYPE_LABELS.mri).toBe('Resonancia')
  })

  it('getRegionLabel returns correct labels', () => {
    expect(getRegionLabel('xray', 'torax')).toBe('Tórax')
    expect(getRegionLabel('ct', 'craneo')).toBe('Cráneo')
    expect(getRegionLabel('mri', 'rodilla')).toBe('Rodilla')
  })

  it('getRegionLabel returns key for unknown region', () => {
    expect(getRegionLabel('xray', 'unknown')).toBe('unknown')
  })

  it('torax xray has PA, Lateral, AP projections', () => {
    const torax = XRAY_REGIONS.torax.find(r => r.key === 'torax')
    expect(torax.projections).toEqual(['PA', 'Lateral', 'AP'])
  })
})
