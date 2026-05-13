/**
 * Radiology catalog — body regions, projections, and visual layout.
 *
 * XRAY_REGIONS: grouped by body area with available projections.
 * CT_REGIONS / MRI_REGIONS: simpler lists (no projections, but contrast option).
 */

export const BODY_AREAS = [
  { key: 'cabeza', label: 'Cabeza y cuello' },
  { key: 'torax', label: 'Tórax' },
  { key: 'abdomen', label: 'Abdomen y pelvis' },
  { key: 'columna', label: 'Columna' },
  { key: 'ext_sup', label: 'Extremidad superior' },
  { key: 'ext_inf', label: 'Extremidad inferior' },
]

export const XRAY_REGIONS = {
  cabeza: [
    { key: 'craneo', label: 'Cráneo', icon: '🦴', projections: ['AP', 'Lateral'] },
    { key: 'senos', label: 'Senos paranasales', icon: '👃', projections: ['Waters', 'Caldwell'] },
    { key: 'mandibula', label: 'Mandíbula', icon: '🦷', projections: ['PA', 'Lateral'] },
    { key: 'cervical', label: 'Columna cervical', icon: '🦴', projections: ['AP', 'Lateral', 'Odontoides'] },
  ],
  torax: [
    { key: 'torax', label: 'Tórax', icon: '🫁', projections: ['PA', 'Lateral', 'AP'] },
    { key: 'costillas', label: 'Costillas', icon: '🦴', projections: ['AP', 'Oblicua'] },
    { key: 'esternon', label: 'Esternón', icon: '🦴', projections: ['Lateral', 'Oblicua'] },
  ],
  abdomen: [
    { key: 'abdomen', label: 'Abdomen', icon: '🫄', projections: ['AP', 'Decúbito'] },
    { key: 'pelvis', label: 'Pelvis', icon: '🦴', projections: ['AP'] },
    { key: 'cadera_der', label: 'Cadera derecha', icon: '🦴', projections: ['AP', 'Axial'] },
    { key: 'cadera_izq', label: 'Cadera izquierda', icon: '🦴', projections: ['AP', 'Axial'] },
  ],
  columna: [
    { key: 'dorsal', label: 'Columna dorsal', icon: '🦴', projections: ['AP', 'Lateral'] },
    { key: 'lumbar', label: 'Columna lumbar', icon: '🦴', projections: ['AP', 'Lateral', 'Oblicua'] },
    { key: 'sacro', label: 'Sacro-coxis', icon: '🦴', projections: ['AP', 'Lateral'] },
  ],
  ext_sup: [
    { key: 'hombro_der', label: 'Hombro derecho', icon: '💪', projections: ['AP', 'Axial', 'Y de escápula'] },
    { key: 'hombro_izq', label: 'Hombro izquierdo', icon: '💪', projections: ['AP', 'Axial', 'Y de escápula'] },
    { key: 'codo_der', label: 'Codo derecho', icon: '🦴', projections: ['AP', 'Lateral'] },
    { key: 'codo_izq', label: 'Codo izquierdo', icon: '🦴', projections: ['AP', 'Lateral'] },
    { key: 'muneca_der', label: 'Muñeca derecha', icon: '🤚', projections: ['PA', 'Lateral'] },
    { key: 'muneca_izq', label: 'Muñeca izquierda', icon: '🤚', projections: ['PA', 'Lateral'] },
    { key: 'mano_der', label: 'Mano derecha', icon: '✋', projections: ['PA', 'Oblicua'] },
    { key: 'mano_izq', label: 'Mano izquierda', icon: '✋', projections: ['PA', 'Oblicua'] },
  ],
  ext_inf: [
    { key: 'rodilla_der', label: 'Rodilla derecha', icon: '🦵', projections: ['AP', 'Lateral'] },
    { key: 'rodilla_izq', label: 'Rodilla izquierda', icon: '🦵', projections: ['AP', 'Lateral'] },
    { key: 'tobillo_der', label: 'Tobillo derecho', icon: '🦶', projections: ['AP', 'Lateral'] },
    { key: 'tobillo_izq', label: 'Tobillo izquierdo', icon: '🦶', projections: ['AP', 'Lateral'] },
    { key: 'pie_der', label: 'Pie derecho', icon: '🦶', projections: ['AP', 'Lateral', 'Oblicua'] },
    { key: 'pie_izq', label: 'Pie izquierdo', icon: '🦶', projections: ['AP', 'Lateral', 'Oblicua'] },
    { key: 'femur_der', label: 'Fémur derecho', icon: '🦴', projections: ['AP', 'Lateral'] },
    { key: 'femur_izq', label: 'Fémur izquierdo', icon: '🦴', projections: ['AP', 'Lateral'] },
    { key: 'tibia_der', label: 'Tibia-peroné derecho', icon: '🦴', projections: ['AP', 'Lateral'] },
    { key: 'tibia_izq', label: 'Tibia-peroné izquierdo', icon: '🦴', projections: ['AP', 'Lateral'] },
  ],
}

export const CT_REGIONS = [
  { key: 'craneo', label: 'Cráneo' },
  { key: 'cuello', label: 'Cuello' },
  { key: 'torax', label: 'Tórax' },
  { key: 'abdomen', label: 'Abdomen' },
  { key: 'abdomen_pelvis', label: 'Abdomen-pelvis' },
  { key: 'columna_cervical', label: 'Columna cervical' },
  { key: 'columna_dorsal', label: 'Columna dorsal' },
  { key: 'columna_lumbar', label: 'Columna lumbar' },
  { key: 'angio_torax', label: 'Angio-TC tórax' },
  { key: 'angio_abdomen', label: 'Angio-TC abdomen' },
  { key: 'ext_superior', label: 'Extremidad superior' },
  { key: 'ext_inferior', label: 'Extremidad inferior' },
]

export const MRI_REGIONS = [
  { key: 'craneo', label: 'Cráneo' },
  { key: 'cuello', label: 'Cuello' },
  { key: 'torax', label: 'Tórax' },
  { key: 'abdomen', label: 'Abdomen' },
  { key: 'pelvis', label: 'Pelvis' },
  { key: 'columna_cervical', label: 'Columna cervical' },
  { key: 'columna_dorsal', label: 'Columna dorsal' },
  { key: 'columna_lumbar', label: 'Columna lumbar' },
  { key: 'hombro', label: 'Hombro' },
  { key: 'codo', label: 'Codo' },
  { key: 'muneca', label: 'Muñeca' },
  { key: 'rodilla', label: 'Rodilla' },
  { key: 'tobillo', label: 'Tobillo' },
  { key: 'cadera', label: 'Cadera' },
  { key: 'cardiaca', label: 'Cardíaca' },
]

/** Human-readable labels for type codes */
export const TYPE_LABELS = {
  xray: 'Radiografía',
  ct: 'TAC',
  mri: 'Resonancia',
}

/** Get region label from key across all catalogs */
export function getRegionLabel(type, regionKey) {
  if (type === 'xray') {
    for (const area of Object.values(XRAY_REGIONS)) {
      const found = area.find(r => r.key === regionKey)
      if (found) return found.label
    }
  }
  if (type === 'ct') {
    const found = CT_REGIONS.find(r => r.key === regionKey)
    if (found) return found.label
  }
  if (type === 'mri') {
    const found = MRI_REGIONS.find(r => r.key === regionKey)
    if (found) return found.label
  }
  return regionKey
}
