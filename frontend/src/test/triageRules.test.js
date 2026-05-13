import { describe, it, expect } from 'vitest'
import { findTriageRules, TRIAGE_MOTIVOS, TRIAGE_RULES } from '../constants/triageRules'

describe('Triage rules engine', () => {
  it('TRIAGE_MOTIVOS contains expected motivos', () => {
    expect(TRIAGE_MOTIVOS).toContain('Dolor torácico')
    expect(TRIAGE_MOTIVOS).toContain('Traumatismo extremidad inferior')
    expect(TRIAGE_MOTIVOS).toContain('Fiebre')
    expect(TRIAGE_MOTIVOS).toContain('Otros')
    expect(TRIAGE_MOTIVOS.length).toBeGreaterThan(10)
  })

  it('all rules have pattern, label, and suggestions', () => {
    TRIAGE_RULES.forEach(rule => {
      expect(rule.pattern).toBeInstanceOf(RegExp)
      expect(rule.label).toBeTruthy()
      expect(rule.suggestions).toBeInstanceOf(Array)
      expect(rule.suggestions.length).toBeGreaterThan(0)
    })
  })

  it('all suggestions have valid type', () => {
    TRIAGE_RULES.forEach(rule => {
      rule.suggestions.forEach(s => {
        expect(['lab', 'ecg', 'radiology']).toContain(s.type)
        expect(s.label).toBeTruthy()
      })
    })
  })

  it('dolor torácico triggers ECG + lab + radiology', () => {
    const rules = findTriageRules('Dolor torácico')
    expect(rules.length).toBe(1)
    const types = rules[0].suggestions.map(s => s.type)
    expect(types).toContain('ecg')
    expect(types).toContain('lab')
    expect(types).toContain('radiology')
  })

  it('dolor torácico lab suggestion has preset dolor_toracico', () => {
    const rules = findTriageRules('Dolor torácico')
    const labSuggestion = rules[0].suggestions.find(s => s.type === 'lab')
    expect(labSuggestion.preset).toBe('dolor_toracico')
  })

  it('traumatismo extremidad inferior asks for side and location', () => {
    const rules = findTriageRules('Traumatismo extremidad inferior')
    expect(rules.length).toBe(1)
    expect(rules[0].askSide).toBe(true)
    expect(rules[0].askLocation).toBe(true)
    expect(rules[0].locationOptions.length).toBeGreaterThan(3)
  })

  it('traumatismo extremidad inferior suggests radiology', () => {
    const rules = findTriageRules('Traumatismo extremidad inferior')
    const types = rules[0].suggestions.map(s => s.type)
    expect(types).toEqual(['radiology', 'radiology'])
  })

  it('traumatismo craneal suggests TAC craneal', () => {
    const rules = findTriageRules('Traumatismo craneal')
    expect(rules.length).toBe(1)
    const ctSuggestion = rules[0].suggestions.find(s => s.radiology?.type === 'ct')
    expect(ctSuggestion).toBeTruthy()
    expect(ctSuggestion.radiology.bodyRegion).toBe('craneo')
  })

  it('fiebre triggers sepsis protocol', () => {
    const rules = findTriageRules('Fiebre')
    expect(rules.length).toBe(1)
    const labSuggestion = rules[0].suggestions.find(s => s.type === 'lab')
    expect(labSuggestion.preset).toBe('sepsis')
  })

  it('síncope triggers ECG + lab', () => {
    const rules = findTriageRules('Síncope')
    expect(rules.length).toBe(1)
    const types = rules[0].suggestions.map(s => s.type)
    expect(types).toContain('ecg')
    expect(types).toContain('lab')
  })

  it('ACV triggers TAC + ECG + lab', () => {
    const rules = findTriageRules('ACV / Ictus')
    expect(rules.length).toBe(1)
    const types = rules[0].suggestions.map(s => s.type)
    expect(types).toContain('radiology')
    expect(types).toContain('ecg')
    expect(types).toContain('lab')
  })

  it('returns empty array for unknown motivo', () => {
    expect(findTriageRules('Otros')).toEqual([])
    expect(findTriageRules('')).toEqual([])
    expect(findTriageRules(null)).toEqual([])
  })

  it('disnea triggers ECG + lab + chest xray', () => {
    const rules = findTriageRules('Disnea')
    expect(rules.length).toBe(1)
    const xray = rules[0].suggestions.find(s => s.radiology?.bodyRegion === 'torax')
    expect(xray).toBeTruthy()
  })

  it('lumbalgia triggers lumbar spine xrays', () => {
    const rules = findTriageRules('Lumbalgia')
    expect(rules.length).toBe(1)
    expect(rules[0].suggestions.length).toBe(2)
    rules[0].suggestions.forEach(s => {
      expect(s.radiology.bodyRegion).toBe('lumbar')
    })
  })
})
