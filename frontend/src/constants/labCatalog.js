/**
 * Lab test parameter catalog.
 * Organized by sample type → parameter groups.
 * Each parameter has a code (stored in DB) and label (displayed).
 * Presets are predefined combinations of parameters.
 */

export const SAMPLE_TYPES = [
  { value: 'sangre', label: 'Sangre', icon: '🩸' },
  { value: 'orina', label: 'Orina', icon: '🧪' },
  { value: 'esputo', label: 'Esputo', icon: '🫁' },
  { value: 'heces', label: 'Heces', icon: '🔬' },
]

export const PARAMETERS = {
  sangre: [
    {
      group: 'Hemograma',
      params: [
        { code: 'hemograma', label: 'Hemograma completo' },
        { code: 'reticulocitos', label: 'Reticulocitos' },
        { code: 'frotis_sangre', label: 'Frotis de sangre periférica' },
        { code: 'vsg', label: 'VSG' },
      ],
    },
    {
      group: 'Bioquímica',
      params: [
        { code: 'glucosa', label: 'Glucosa' },
        { code: 'urea', label: 'Urea' },
        { code: 'creatinina', label: 'Creatinina' },
        { code: 'acido_urico', label: 'Ácido úrico' },
        { code: 'sodio', label: 'Sodio (Na)' },
        { code: 'potasio', label: 'Potasio (K)' },
        { code: 'cloro', label: 'Cloro (Cl)' },
        { code: 'calcio', label: 'Calcio (Ca)' },
        { code: 'fosforo', label: 'Fósforo (P)' },
        { code: 'magnesio', label: 'Magnesio (Mg)' },
        { code: 'proteinas_totales', label: 'Proteínas totales' },
        { code: 'albumina', label: 'Albúmina' },
        { code: 'bilirrubina_total', label: 'Bilirrubina total' },
        { code: 'bilirrubina_directa', label: 'Bilirrubina directa' },
        { code: 'ldh', label: 'LDH' },
        { code: 'ck', label: 'CK (CPK)' },
        { code: 'ck_mb', label: 'CK-MB' },
        { code: 'amilasa', label: 'Amilasa' },
        { code: 'lipasa', label: 'Lipasa' },
        { code: 'hierro', label: 'Hierro' },
        { code: 'ferritina', label: 'Ferritina' },
        { code: 'transferrina', label: 'Transferrina' },
      ],
    },
    {
      group: 'Perfil hepático',
      params: [
        { code: 'got', label: 'GOT (AST)' },
        { code: 'gpt', label: 'GPT (ALT)' },
        { code: 'ggt', label: 'GGT' },
        { code: 'fosfatasa_alcalina', label: 'Fosfatasa alcalina' },
      ],
    },
    {
      group: 'Coagulación',
      params: [
        { code: 'tp_inr', label: 'TP / INR' },
        { code: 'ttpa', label: 'TTPa' },
        { code: 'fibrinogeno', label: 'Fibrinógeno' },
        { code: 'dimero_d', label: 'Dímero D' },
      ],
    },
    {
      group: 'Marcadores cardíacos',
      params: [
        { code: 'troponina', label: 'Troponina T/I' },
        { code: 'bnp', label: 'BNP / NT-proBNP' },
        { code: 'mioglobina', label: 'Mioglobina' },
      ],
    },
    {
      group: 'Gasometría',
      params: [
        { code: 'gasometria_arterial', label: 'Gasometría arterial' },
        { code: 'gasometria_venosa', label: 'Gasometría venosa' },
        { code: 'lactato', label: 'Lactato' },
      ],
    },
    {
      group: 'Inflamación / Infección',
      params: [
        { code: 'pcr', label: 'PCR (Proteína C reactiva)' },
        { code: 'procalcitonina', label: 'Procalcitonina' },
      ],
    },
    {
      group: 'Hormonas / Otros',
      params: [
        { code: 'tsh', label: 'TSH' },
        { code: 't4_libre', label: 'T4 libre' },
        { code: 'hba1c', label: 'HbA1c' },
        { code: 'vitamina_d', label: 'Vitamina D' },
        { code: 'vitamina_b12', label: 'Vitamina B12' },
        { code: 'acido_folico', label: 'Ácido fólico' },
        { code: 'psa', label: 'PSA' },
      ],
    },
  ],

  orina: [
    {
      group: 'Análisis de orina',
      params: [
        { code: 'orina_sistematico', label: 'Sistemático de orina' },
        { code: 'orina_sedimento', label: 'Sedimento urinario' },
        { code: 'orina_bioquimica', label: 'Bioquímica de orina' },
        { code: 'orina_iones', label: 'Iones en orina (Na, K, Cl)' },
        { code: 'orina_proteinas_24h', label: 'Proteinuria 24h' },
        { code: 'orina_microalbuminuria', label: 'Microalbuminuria' },
        { code: 'orina_creatinina', label: 'Creatinina en orina' },
        { code: 'orina_aclaramiento_cr', label: 'Aclaramiento de creatinina' },
        { code: 'orina_drogas', label: 'Tóxicos en orina' },
        { code: 'orina_embarazo', label: 'Test de embarazo (orina)' },
      ],
    },
  ],

  esputo: [
    {
      group: 'Análisis de esputo',
      params: [
        { code: 'esputo_citologia', label: 'Citología de esputo' },
        { code: 'esputo_gram', label: 'Tinción de Gram' },
        { code: 'esputo_baar', label: 'BAAR (Baciloscopia)' },
        { code: 'esputo_antigeno_neumococo', label: 'Antígeno neumococo' },
        { code: 'esputo_antigeno_legionella', label: 'Antígeno Legionella' },
      ],
    },
  ],

  heces: [
    {
      group: 'Análisis de heces',
      params: [
        { code: 'heces_sangre_oculta', label: 'Sangre oculta en heces' },
        { code: 'heces_parasitos', label: 'Parásitos en heces' },
        { code: 'heces_coprocultivo', label: 'Coprocultivo' },
        { code: 'heces_calprotectina', label: 'Calprotectina fecal' },
        { code: 'heces_elastasa', label: 'Elastasa fecal' },
        { code: 'heces_toxina_cdiff', label: 'Toxina C. difficile' },
      ],
    },
  ],
}

/** Presets: predefined parameter combinations */
export const PRESETS = [
  {
    code: 'basico',
    label: 'Básico',
    description: 'Hemograma + Bioquímica básica + Coagulación',
    sampleType: 'sangre',
    params: ['hemograma', 'glucosa', 'urea', 'creatinina', 'sodio', 'potasio', 'pcr', 'tp_inr'],
  },
  {
    code: 'perfil_hepatico',
    label: 'Perfil hepático',
    description: 'Transaminasas + Bilirrubina + GGT + FA + Albúmina',
    sampleType: 'sangre',
    params: ['got', 'gpt', 'ggt', 'fosfatasa_alcalina', 'bilirrubina_total', 'bilirrubina_directa', 'albumina', 'proteinas_totales', 'ldh'],
  },
  {
    code: 'dolor_toracico',
    label: 'Protocolo dolor torácico',
    description: 'Troponina + CK-MB + Coagulación + Gasometría',
    sampleType: 'sangre',
    params: ['hemograma', 'troponina', 'ck', 'ck_mb', 'bnp', 'dimero_d', 'tp_inr', 'ttpa', 'gasometria_arterial', 'lactato', 'pcr', 'glucosa', 'creatinina', 'sodio', 'potasio'],
  },
  {
    code: 'sepsis',
    label: 'Protocolo sepsis',
    description: 'Hemograma + PCR + PCT + Lactato + Coagulación',
    sampleType: 'sangre',
    params: ['hemograma', 'pcr', 'procalcitonina', 'lactato', 'gasometria_venosa', 'tp_inr', 'ttpa', 'fibrinogeno', 'creatinina', 'urea', 'bilirrubina_total', 'got', 'gpt'],
  },
  {
    code: 'preoperatorio',
    label: 'Preoperatorio',
    description: 'Hemograma + Coagulación + Bioquímica + Iones',
    sampleType: 'sangre',
    params: ['hemograma', 'glucosa', 'urea', 'creatinina', 'sodio', 'potasio', 'tp_inr', 'ttpa', 'fibrinogeno', 'got', 'gpt', 'proteinas_totales'],
  },
  {
    code: 'control_anticoagulacion',
    label: 'Control anticoagulación',
    description: 'INR + TTPa + Hemograma',
    sampleType: 'sangre',
    params: ['hemograma', 'tp_inr', 'ttpa', 'fibrinogeno'],
  },
  {
    code: 'perfil_renal',
    label: 'Perfil renal',
    description: 'Creatinina + Urea + Iones + Orina',
    sampleType: 'sangre',
    params: ['creatinina', 'urea', 'sodio', 'potasio', 'cloro', 'calcio', 'fosforo', 'acido_urico', 'proteinas_totales', 'albumina'],
  },
  {
    code: 'perfil_tiroideo',
    label: 'Perfil tiroideo',
    description: 'TSH + T4 libre',
    sampleType: 'sangre',
    params: ['tsh', 't4_libre'],
  },
  {
    code: 'orina_completo',
    label: 'Orina completo',
    description: 'Sistemático + Sedimento + Bioquímica',
    sampleType: 'orina',
    params: ['orina_sistematico', 'orina_sedimento', 'orina_bioquimica', 'orina_iones'],
  },
]

/** Get all parameter codes for a sample type (flat list) */
export function getAllParamCodes(sampleType) {
  return (PARAMETERS[sampleType] || []).flatMap(g => g.params.map(p => p.code))
}

/** Get label for a parameter code */
export function getParamLabel(code) {
  for (const groups of Object.values(PARAMETERS)) {
    for (const g of groups) {
      const found = g.params.find(p => p.code === code)
      if (found) return found.label
    }
  }
  return code
}

/** Build a human-readable label from selected parameters */
export function buildLabel(sampleType, selectedParams) {
  const sampleLabel = SAMPLE_TYPES.find(s => s.value === sampleType)?.label || sampleType
  const groups = PARAMETERS[sampleType] || []
  const selectedGroups = []

  for (const g of groups) {
    const groupCodes = g.params.map(p => p.code)
    const selected = groupCodes.filter(c => selectedParams.includes(c))
    if (selected.length === groupCodes.length) {
      selectedGroups.push(g.group)
    } else if (selected.length > 0) {
      selectedGroups.push(`${g.group} (parcial)`)
    }
  }

  if (selectedGroups.length === 0) return `${sampleLabel} — ${selectedParams.length} parámetros`
  if (selectedGroups.length <= 3) return selectedGroups.join(' + ')
  return `${selectedGroups.slice(0, 2).join(' + ')} + ${selectedGroups.length - 2} más`
}
