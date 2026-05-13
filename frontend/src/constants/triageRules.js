/**
 * Triage rules engine.
 * Each rule matches a motivo (reason) pattern and suggests clinical actions.
 * Actions can be: lab protocols, ECG, radiology orders.
 *
 * Rule structure:
 *   pattern: regex or string to match against motivo (case-insensitive)
 *   label: human-readable rule name
 *   askSide: if true, prompt user for laterality (izquierda/derecha)
 *   askLocation: if true, prompt user for specific body location
 *   suggestions: array of suggested actions
 *     - type: 'lab' | 'ecg' | 'radiology'
 *     - label: display name
 *     - preset: lab preset code (for type=lab)
 *     - radiology: { type, bodyRegion, projection } (for type=radiology)
 */

export const TRIAGE_MOTIVOS = [
  'Dolor torácico',
  'Disnea',
  'Dolor abdominal',
  'Traumatismo extremidad inferior',
  'Traumatismo extremidad superior',
  'Traumatismo craneal',
  'Cefalea',
  'Síncope',
  'Fiebre',
  'Intoxicación',
  'Herida',
  'Lumbalgia',
  'Dolor cervical',
  'Crisis hipertensiva',
  'Arritmia',
  'ACV / Ictus',
  'Convulsiones',
  'Reacción alérgica',
  'Quemadura',
  'Retención urinaria',
  'Hematuria',
  'Embarazo / Parto',
  'Otros',
]

export const TRIAGE_RULES = [
  {
    pattern: /dolor tor[aá]cico/i,
    label: 'Protocolo dolor torácico',
    suggestions: [
      { type: 'ecg', label: 'Electrocardiograma' },
      { type: 'lab', label: 'Analítica: protocolo dolor torácico', preset: 'dolor_toracico' },
      { type: 'radiology', label: 'Radiografía de tórax PA', radiology: { type: 'xray', bodyRegion: 'torax', projection: 'PA' } },
    ],
  },
  {
    pattern: /disnea/i,
    label: 'Protocolo disnea',
    suggestions: [
      { type: 'ecg', label: 'Electrocardiograma' },
      { type: 'lab', label: 'Analítica: básica + gasometría', preset: 'dolor_toracico' },
      { type: 'radiology', label: 'Radiografía de tórax PA', radiology: { type: 'xray', bodyRegion: 'torax', projection: 'PA' } },
    ],
  },
  {
    pattern: /dolor abdominal/i,
    label: 'Protocolo dolor abdominal',
    suggestions: [
      { type: 'lab', label: 'Analítica: básica + perfil hepático + amilasa/lipasa', preset: 'basico' },
      { type: 'radiology', label: 'Radiografía de abdomen', radiology: { type: 'xray', bodyRegion: 'abdomen', projection: 'AP' } },
    ],
  },
  {
    pattern: /traumatismo extremidad inferior/i,
    label: 'Protocolo traumatismo EEII',
    askSide: true,
    askLocation: true,
    locationOptions: [
      { key: 'cadera', label: 'Cadera' },
      { key: 'femur', label: 'Fémur' },
      { key: 'rodilla', label: 'Rodilla' },
      { key: 'tibia', label: 'Tibia-peroné' },
      { key: 'tobillo', label: 'Tobillo' },
      { key: 'pie', label: 'Pie' },
    ],
    suggestions: [
      { type: 'radiology', label: 'Radiografía de la zona', radiology: { type: 'xray', bodyRegion: null, projection: 'AP' } },
      { type: 'radiology', label: 'Radiografía lateral', radiology: { type: 'xray', bodyRegion: null, projection: 'Lateral' } },
    ],
  },
  {
    pattern: /traumatismo extremidad superior/i,
    label: 'Protocolo traumatismo EESS',
    askSide: true,
    askLocation: true,
    locationOptions: [
      { key: 'hombro', label: 'Hombro' },
      { key: 'humero', label: 'Húmero' },
      { key: 'codo', label: 'Codo' },
      { key: 'antebrazo', label: 'Antebrazo' },
      { key: 'muneca', label: 'Muñeca' },
      { key: 'mano', label: 'Mano' },
    ],
    suggestions: [
      { type: 'radiology', label: 'Radiografía de la zona', radiology: { type: 'xray', bodyRegion: null, projection: 'AP' } },
      { type: 'radiology', label: 'Radiografía lateral', radiology: { type: 'xray', bodyRegion: null, projection: 'Lateral' } },
    ],
  },
  {
    pattern: /traumatismo craneal/i,
    label: 'Protocolo TCE',
    suggestions: [
      { type: 'radiology', label: 'TAC craneal', radiology: { type: 'ct', bodyRegion: 'craneo', projection: null } },
      { type: 'lab', label: 'Analítica: básica + coagulación', preset: 'basico' },
    ],
  },
  {
    pattern: /cefalea/i,
    label: 'Protocolo cefalea',
    suggestions: [
      { type: 'lab', label: 'Analítica básica', preset: 'basico' },
      { type: 'radiology', label: 'TAC craneal (si signos de alarma)', radiology: { type: 'ct', bodyRegion: 'craneo', projection: null } },
    ],
  },
  {
    pattern: /s[ií]ncope/i,
    label: 'Protocolo síncope',
    suggestions: [
      { type: 'ecg', label: 'Electrocardiograma' },
      { type: 'lab', label: 'Analítica: básica + troponina', preset: 'dolor_toracico' },
    ],
  },
  {
    pattern: /fiebre/i,
    label: 'Protocolo fiebre / sepsis',
    suggestions: [
      { type: 'lab', label: 'Analítica: protocolo sepsis', preset: 'sepsis' },
      { type: 'radiology', label: 'Radiografía de tórax', radiology: { type: 'xray', bodyRegion: 'torax', projection: 'PA' } },
    ],
  },
  {
    pattern: /intoxicaci[oó]n/i,
    label: 'Protocolo intoxicación',
    suggestions: [
      { type: 'ecg', label: 'Electrocardiograma' },
      { type: 'lab', label: 'Analítica: básica + tóxicos', preset: 'basico' },
    ],
  },
  {
    pattern: /lumbalgia/i,
    label: 'Protocolo lumbalgia',
    suggestions: [
      { type: 'radiology', label: 'Radiografía columna lumbar AP', radiology: { type: 'xray', bodyRegion: 'lumbar', projection: 'AP' } },
      { type: 'radiology', label: 'Radiografía columna lumbar lateral', radiology: { type: 'xray', bodyRegion: 'lumbar', projection: 'Lateral' } },
    ],
  },
  {
    pattern: /dolor cervical/i,
    label: 'Protocolo cervicalgia',
    suggestions: [
      { type: 'radiology', label: 'Radiografía cervical AP', radiology: { type: 'xray', bodyRegion: 'cervical', projection: 'AP' } },
      { type: 'radiology', label: 'Radiografía cervical lateral', radiology: { type: 'xray', bodyRegion: 'cervical', projection: 'Lateral' } },
    ],
  },
  {
    pattern: /crisis hipertensiva/i,
    label: 'Protocolo crisis HTA',
    suggestions: [
      { type: 'ecg', label: 'Electrocardiograma' },
      { type: 'lab', label: 'Analítica: perfil renal', preset: 'perfil_renal' },
    ],
  },
  {
    pattern: /arritmia/i,
    label: 'Protocolo arritmia',
    suggestions: [
      { type: 'ecg', label: 'Electrocardiograma' },
      { type: 'lab', label: 'Analítica: básica + iones + troponina', preset: 'dolor_toracico' },
    ],
  },
  {
    pattern: /acv|ictus/i,
    label: 'Protocolo código ictus',
    suggestions: [
      { type: 'radiology', label: 'TAC craneal urgente', radiology: { type: 'ct', bodyRegion: 'craneo', projection: null } },
      { type: 'ecg', label: 'Electrocardiograma' },
      { type: 'lab', label: 'Analítica: básica + coagulación', preset: 'basico' },
    ],
  },
  {
    pattern: /convulsiones/i,
    label: 'Protocolo convulsiones',
    suggestions: [
      { type: 'lab', label: 'Analítica: básica + tóxicos', preset: 'basico' },
      { type: 'radiology', label: 'TAC craneal', radiology: { type: 'ct', bodyRegion: 'craneo', projection: null } },
    ],
  },
  {
    pattern: /retenci[oó]n urinaria|hematuria/i,
    label: 'Protocolo urológico',
    suggestions: [
      { type: 'lab', label: 'Analítica: perfil renal + orina', preset: 'perfil_renal' },
      { type: 'radiology', label: 'Radiografía de abdomen', radiology: { type: 'xray', bodyRegion: 'abdomen', projection: 'AP' } },
    ],
  },
]

/**
 * Find matching triage rules for a given motivo.
 * Returns array of matching rules (can be multiple).
 */
export function findTriageRules(motivo) {
  if (!motivo) return []
  return TRIAGE_RULES.filter(r => r.pattern.test(motivo))
}
