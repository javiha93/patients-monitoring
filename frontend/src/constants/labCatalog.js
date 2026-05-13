/**
 * Lab test parameter catalog.
 * Organized by sample type → parameter groups.
 * Each parameter has a code (stored in DB) and label (displayed).
 * Presets are predefined combinations that ADD to the current selection.
 */

export const SAMPLE_TYPES = [
  { value: 'sangre', label: 'Sangre', icon: '🩸' },
  { value: 'frotis', label: 'Frotis / PCR', icon: '🧬' },
  { value: 'orina', label: 'Orina', icon: '🧪' },
  { value: 'esputo', label: 'Esputo', icon: '🫁' },
  { value: 'heces', label: 'Heces', icon: '🔬' },
  { value: 'cultivo', label: 'Cultivos', icon: '🧫' },
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
      group: 'Serología',
      params: [
        { code: 'vih', label: 'VIH (Ag/Ac)' },
        { code: 'hepatitis_b_hbsag', label: 'HBsAg (Hepatitis B)' },
        { code: 'hepatitis_b_anticore', label: 'Anti-HBc (Hepatitis B)' },
        { code: 'hepatitis_b_antis', label: 'Anti-HBs (Hepatitis B)' },
        { code: 'hepatitis_c', label: 'Anti-VHC (Hepatitis C)' },
        { code: 'sifilis', label: 'Serología sífilis (RPR/VDRL)' },
        { code: 'cmv_igg_igm', label: 'CMV IgG/IgM' },
        { code: 'ebv_igg_igm', label: 'EBV IgG/IgM' },
        { code: 'toxoplasma', label: 'Toxoplasma IgG/IgM' },
        { code: 'brucella', label: 'Serología Brucella' },
        { code: 'lyme', label: 'Serología Lyme' },
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
        { code: 'beta_hcg', label: 'Beta-HCG (embarazo)' },
        { code: 'cortisol', label: 'Cortisol' },
        { code: 'pth', label: 'PTH (Parathormona)' },
      ],
    },
  ],

  frotis: [
    {
      group: 'PCR molecular',
      params: [
        { code: 'pcr_covid', label: 'PCR SARS-CoV-2 (COVID-19)' },
        { code: 'pcr_gripe_a', label: 'PCR Gripe A' },
        { code: 'pcr_gripe_b', label: 'PCR Gripe B' },
        { code: 'pcr_vrs', label: 'PCR VRS (Virus Respiratorio Sincitial)' },
        { code: 'pcr_panel_respiratorio', label: 'Panel respiratorio múltiple' },
      ],
    },
    {
      group: 'Antígenos rápidos',
      params: [
        { code: 'ag_rapido_covid', label: 'Antígeno rápido COVID-19' },
        { code: 'ag_rapido_gripe', label: 'Antígeno rápido Gripe A/B' },
        { code: 'ag_rapido_estreptococo', label: 'Antígeno rápido Estreptococo A' },
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

  cultivo: [
    {
      group: 'Hemocultivos',
      params: [
        { code: 'hemocultivo_aerobio', label: 'Hemocultivo aerobio' },
        { code: 'hemocultivo_anaerobio', label: 'Hemocultivo anaerobio' },
        { code: 'hemocultivo_x2', label: 'Hemocultivo x2 (2 sets)' },
        { code: 'hemocultivo_x3', label: 'Hemocultivo x3 (3 sets)' },
        { code: 'hemocultivo_hongos', label: 'Hemocultivo para hongos' },
        { code: 'hemocultivo_micobacterias', label: 'Hemocultivo para micobacterias' },
      ],
    },
    {
      group: 'Cultivos de orina',
      params: [
        { code: 'urocultivo', label: 'Urocultivo' },
        { code: 'urocultivo_hongos', label: 'Urocultivo para hongos' },
      ],
    },
    {
      group: 'Cultivos respiratorios',
      params: [
        { code: 'cultivo_esputo', label: 'Cultivo de esputo' },
        { code: 'cultivo_broncoaspirado', label: 'Cultivo de broncoaspirado (BAS)' },
        { code: 'cultivo_lavado_broncoalveolar', label: 'Cultivo de LBA' },
        { code: 'cultivo_esputo_hongos', label: 'Cultivo esputo para hongos' },
        { code: 'cultivo_esputo_micobacterias', label: 'Cultivo esputo para micobacterias' },
      ],
    },
    {
      group: 'Cultivos de herida / piel',
      params: [
        { code: 'cultivo_herida', label: 'Cultivo de herida' },
        { code: 'cultivo_absceso', label: 'Cultivo de absceso' },
        { code: 'cultivo_piel', label: 'Cultivo de piel' },
      ],
    },
    {
      group: 'Cultivos de catéter / dispositivo',
      params: [
        { code: 'cultivo_punta_cateter', label: 'Cultivo punta de catéter' },
        { code: 'cultivo_liquido_drenaje', label: 'Cultivo de líquido de drenaje' },
      ],
    },
    {
      group: 'Cultivos de líquidos estériles',
      params: [
        { code: 'cultivo_lcr', label: 'Cultivo de LCR' },
        { code: 'cultivo_liquido_pleural', label: 'Cultivo de líquido pleural' },
        { code: 'cultivo_liquido_ascitico', label: 'Cultivo de líquido ascítico' },
        { code: 'cultivo_liquido_articular', label: 'Cultivo de líquido articular' },
      ],
    },
    {
      group: 'Cultivos de heces',
      params: [
        { code: 'coprocultivo', label: 'Coprocultivo' },
        { code: 'cultivo_cdiff', label: 'Cultivo C. difficile' },
      ],
    },
  ],
}

/** Presets: predefined parameter combinations (can span multiple sample types) */
export const PRESETS = [
  {
    code: 'basico',
    label: 'Básico',
    description: 'Hemograma + Bioquímica básica + Coagulación',
    params: { sangre: ['hemograma', 'glucosa', 'urea', 'creatinina', 'sodio', 'potasio', 'pcr', 'tp_inr'] },
  },
  {
    code: 'perfil_hepatico',
    label: 'Perfil hepático',
    description: 'Transaminasas + Bilirrubina + GGT + FA + Albúmina',
    params: { sangre: ['got', 'gpt', 'ggt', 'fosfatasa_alcalina', 'bilirrubina_total', 'bilirrubina_directa', 'albumina', 'proteinas_totales', 'ldh'] },
  },
  {
    code: 'dolor_toracico',
    label: 'Protocolo dolor torácico',
    description: 'Troponina + CK-MB + Coagulación + Gasometría',
    params: { sangre: ['hemograma', 'troponina', 'ck', 'ck_mb', 'bnp', 'dimero_d', 'tp_inr', 'ttpa', 'gasometria_arterial', 'lactato', 'pcr', 'glucosa', 'creatinina', 'sodio', 'potasio'] },
  },
  {
    code: 'sepsis',
    label: 'Protocolo sepsis',
    description: 'Hemograma + PCR + PCT + Lactato + Hemocultivos',
    params: {
      sangre: ['hemograma', 'pcr', 'procalcitonina', 'lactato', 'gasometria_venosa', 'tp_inr', 'ttpa', 'fibrinogeno', 'creatinina', 'urea', 'bilirrubina_total', 'got', 'gpt'],
      cultivo: ['hemocultivo_x2'],
    },
  },
  {
    code: 'preoperatorio',
    label: 'Preoperatorio',
    description: 'Hemograma + Coagulación + Bioquímica + Iones',
    params: { sangre: ['hemograma', 'glucosa', 'urea', 'creatinina', 'sodio', 'potasio', 'tp_inr', 'ttpa', 'fibrinogeno', 'got', 'gpt', 'proteinas_totales'] },
  },
  {
    code: 'control_anticoagulacion',
    label: 'Control anticoagulación',
    description: 'INR + TTPa + Hemograma',
    params: { sangre: ['hemograma', 'tp_inr', 'ttpa', 'fibrinogeno'] },
  },
  {
    code: 'perfil_renal',
    label: 'Perfil renal',
    description: 'Creatinina + Urea + Iones + Orina',
    params: {
      sangre: ['creatinina', 'urea', 'sodio', 'potasio', 'cloro', 'calcio', 'fosforo', 'acido_urico', 'proteinas_totales', 'albumina'],
      orina: ['orina_sistematico', 'orina_sedimento', 'orina_creatinina'],
    },
  },
  {
    code: 'perfil_tiroideo',
    label: 'Perfil tiroideo',
    description: 'TSH + T4 libre',
    params: { sangre: ['tsh', 't4_libre'] },
  },
  {
    code: 'serologia_completa',
    label: 'Serología completa',
    description: 'VIH + Hepatitis B/C + Sífilis',
    params: { sangre: ['vih', 'hepatitis_b_hbsag', 'hepatitis_b_anticore', 'hepatitis_b_antis', 'hepatitis_c', 'sifilis'] },
  },
  {
    code: 'respiratorio_viral',
    label: 'Panel respiratorio',
    description: 'COVID + Gripe A/B + VRS',
    params: { frotis: ['pcr_covid', 'pcr_gripe_a', 'pcr_gripe_b', 'pcr_vrs'] },
  },
  {
    code: 'infeccion_respiratoria',
    label: 'Infección respiratoria',
    description: 'Hemograma + PCR + PCT + COVID + Gripe + VRS + Gasometría',
    params: {
      sangre: ['hemograma', 'pcr', 'procalcitonina', 'gasometria_arterial', 'lactato', 'creatinina', 'urea', 'sodio', 'potasio'],
      frotis: ['pcr_covid', 'pcr_gripe_a', 'pcr_gripe_b', 'pcr_vrs'],
      esputo: ['esputo_gram'],
      cultivo: ['hemocultivo_x2'],
    },
  },
  {
    code: 'orina_completo',
    label: 'Orina completo',
    description: 'Sistemático + Sedimento + Bioquímica + Urocultivo',
    params: {
      orina: ['orina_sistematico', 'orina_sedimento', 'orina_bioquimica', 'orina_iones'],
      cultivo: ['urocultivo'],
    },
  },
  {
    code: 'itu',
    label: 'Sospecha ITU',
    description: 'Orina + Urocultivo + Hemograma + PCR',
    params: {
      sangre: ['hemograma', 'pcr', 'creatinina', 'urea'],
      orina: ['orina_sistematico', 'orina_sedimento'],
      cultivo: ['urocultivo'],
    },
  },
]

/** Build a human-readable label from selected parameters across all sample types */
export function buildLabel(selected) {
  // selected is Map<sampleType, Set<code>>
  const parts = []

  for (const [sampleType, codes] of selected.entries()) {
    if (codes.size === 0) continue
    const groups = PARAMETERS[sampleType] || []
    const sampleLabel = SAMPLE_TYPES.find(s => s.value === sampleType)?.label || sampleType
    const matchedGroups = []

    for (const g of groups) {
      const groupCodes = g.params.map(p => p.code)
      const count = groupCodes.filter(c => codes.has(c)).length
      if (count === groupCodes.length) {
        matchedGroups.push(g.group)
      } else if (count > 0) {
        matchedGroups.push(`${g.group} (parcial)`)
      }
    }

    if (matchedGroups.length <= 2) {
      parts.push(matchedGroups.join(' + '))
    } else {
      parts.push(`${sampleLabel}: ${matchedGroups.length} grupos`)
    }
  }

  return parts.join(' · ') || 'Sin parámetros'
}

/** Count total selected params across all sample types */
export function countSelected(selected) {
  let total = 0
  for (const codes of selected.values()) total += codes.size
  return total
}

/** Count selected params for a specific sample type */
export function countForType(selected, sampleType) {
  return selected.get(sampleType)?.size || 0
}

/**
 * Physical samples/tubes needed for a set of parameter codes.
 * Returns an array of { key, label, color, icon } objects.
 */
const TUBE_HEMOGRAMA = new Set([
  'hemograma', 'reticulocitos', 'frotis_sangre', 'vsg', 'hba1c',
])
const TUBE_COAGULACION = new Set([
  'tp_inr', 'ttpa', 'fibrinogeno', 'dimero_d',
])
const HISOPO_CODES = new Set([
  'pcr_covid', 'pcr_gripe_a', 'pcr_gripe_b', 'pcr_vrs', 'pcr_panel_respiratorio',
  'ag_rapido_covid', 'ag_rapido_gripe', 'ag_rapido_estreptococo',
])
const GASOMETRIA_CODES = new Set([
  'gasometria_arterial', 'gasometria_venosa', 'lactato',
])

// All sangre codes that go in the bioquímica tube (everything not hemograma/coag/gaso)
function isBioquimiaTube(code) {
  return !TUBE_HEMOGRAMA.has(code) && !TUBE_COAGULACION.has(code) &&
         !GASOMETRIA_CODES.has(code)
}

export const SAMPLE_ICONS = {
  tubo_bioquimica:  { key: 'tubo_bioquimica',  label: 'Tubo bioquímica',  color: '#D4A017', icon: '🟡' },
  tubo_hemograma:   { key: 'tubo_hemograma',   label: 'Tubo hemograma',   color: '#7C3AED', icon: '🟣' },
  tubo_coagulacion: { key: 'tubo_coagulacion', label: 'Tubo coagulación', color: '#3B82F6', icon: '🔵' },
  gasometria:       { key: 'gasometria',       label: 'Gasometría',       color: '#EF4444', icon: '🔴' },
  hisopo:           { key: 'hisopo',           label: 'Hisopo / bastoncillo', color: '#F59E0B', icon: '🧹' },
  orina:            { key: 'orina',            label: 'Muestra de orina', color: '#F59E0B', icon: '🧪' },
  heces:            { key: 'heces',            label: 'Muestra de heces', color: '#92400E', icon: '🔬' },
  esputo:           { key: 'esputo',           label: 'Muestra de esputo', color: '#059669', icon: '🫁' },
  hemocultivo:      { key: 'hemocultivo',      label: 'Botellas hemocultivo', color: '#DC2626', icon: '🧫' },
  cultivo_otro:     { key: 'cultivo_otro',     label: 'Muestra para cultivo', color: '#7C3AED', icon: '🧫' },
}

export function getSamplesNeeded(paramCodes) {
  if (!paramCodes || paramCodes.length === 0) return []

  const codes = new Set(paramCodes)
  const result = []

  // Blood tubes
  const hasBioq = [...codes].some(c => {
    // Exclude non-sangre codes
    if (c.startsWith('orina_') || c.startsWith('heces_') || c.startsWith('esputo_') ||
        c.startsWith('cultivo_') || c.startsWith('hemocultivo_') || c === 'urocultivo' ||
        c === 'urocultivo_hongos' || c === 'coprocultivo' || c === 'cultivo_cdiff' ||
        HISOPO_CODES.has(c)) return false
    return isBioquimiaTube(c)
  })
  if (hasBioq) result.push(SAMPLE_ICONS.tubo_bioquimica)

  if ([...codes].some(c => TUBE_HEMOGRAMA.has(c))) result.push(SAMPLE_ICONS.tubo_hemograma)
  if ([...codes].some(c => TUBE_COAGULACION.has(c))) result.push(SAMPLE_ICONS.tubo_coagulacion)
  if ([...codes].some(c => GASOMETRIA_CODES.has(c))) result.push(SAMPLE_ICONS.gasometria)
  if ([...codes].some(c => HISOPO_CODES.has(c))) result.push(SAMPLE_ICONS.hisopo)

  // Non-blood samples
  if ([...codes].some(c => c.startsWith('orina_') || c === 'urocultivo' || c === 'urocultivo_hongos'))
    result.push(SAMPLE_ICONS.orina)
  if ([...codes].some(c => c.startsWith('heces_') || c === 'coprocultivo' || c === 'cultivo_cdiff'))
    result.push(SAMPLE_ICONS.heces)
  if ([...codes].some(c => c.startsWith('esputo_') || c === 'cultivo_esputo' ||
      c === 'cultivo_esputo_hongos' || c === 'cultivo_esputo_micobacterias' ||
      c === 'cultivo_broncoaspirado' || c === 'cultivo_lavado_broncoalveolar'))
    result.push(SAMPLE_ICONS.esputo)

  // Hemocultivos (bottles)
  if ([...codes].some(c => c.startsWith('hemocultivo_')))
    result.push(SAMPLE_ICONS.hemocultivo)

  // Other cultivos (catéter, herida, líquidos estériles)
  if ([...codes].some(c =>
    (c.startsWith('cultivo_') && !c.startsWith('cultivo_esputo') &&
     c !== 'cultivo_broncoaspirado' && c !== 'cultivo_lavado_broncoalveolar' &&
     c !== 'cultivo_cdiff') ||
    c === 'cultivo_herida' || c === 'cultivo_absceso' || c === 'cultivo_piel'
  )) result.push(SAMPLE_ICONS.cultivo_otro)

  return result
}
