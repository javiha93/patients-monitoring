import { TestTube, TestTubes, Syringe, PillBottle } from 'lucide-react'
import { getSamplesNeeded } from '../constants/labCatalog'

/** Custom swab/hisopo icon — stick with oval loop at top */
function SwabIcon({ size = 22, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Stick */}
      <line x1="8" y1="22" x2="15" y2="10" />
      {/* Oval loop at top */}
      <ellipse cx="16.5" cy="7" rx="3" ry="4" />
    </svg>
  )
}

const ICON_MAP = {
  tubo_bioquimica:  { Icon: TestTube,  color: 'text-red-500' },
  tubo_hemograma:   { Icon: TestTube,  color: 'text-violet-500' },
  tubo_coagulacion: { Icon: TestTube,  color: 'text-blue-500' },
  gasometria:       { Icon: Syringe,   color: 'text-blue-500' },
  hisopo:           { Icon: SwabIcon,  color: 'text-amber-600' },
  orina:            { Icon: PillBottle, color: 'text-yellow-500' },
  heces:            { Icon: PillBottle, color: 'text-amber-800' },
  esputo:           { Icon: PillBottle, color: 'text-blue-400' },
  hemocultivo:      { Icon: TestTubes, color: 'text-red-500' },
  cultivo_otro:     { Icon: PillBottle, color: 'text-red-500' },
}

/**
 * Renders sample/tube icons for a lab test based on its requested parameters.
 * Icons are displayed inline with tooltips.
 */
export default function SampleIconsRow({ requestedParameters }) {
  if (!requestedParameters) return null

  let params
  try {
    params = JSON.parse(requestedParameters)
  } catch {
    return null
  }

  const samples = getSamplesNeeded(params)
  if (samples.length === 0) return null

  return (
    <div className={`grid gap-1 ${samples.length > 3 ? 'grid-cols-3' : `grid-cols-${samples.length}`}`} data-testid="sample-icons">
      {samples.map(s => {
        const mapping = ICON_MAP[s.key]
        if (!mapping) return null
        const { Icon, color } = mapping
        return (
          <span
            key={s.key}
            title={s.label}
            className={`${color} cursor-default flex items-center justify-center`}
          >
            <Icon size={22} />
          </span>
        )
      })}
    </div>
  )
}
