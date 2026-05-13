import { TestTube, TestTubes, Syringe, PillBottle, Minus } from 'lucide-react'
import { getSamplesNeeded } from '../constants/labCatalog'

/** Custom swab/bastoncillo icon */
function SwabIcon({ size = 16, className = '' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <Minus className="rotate-90 text-current" style={{ width: size, height: size }} strokeWidth={2.5} />
      <div className="absolute rounded-full bg-current opacity-30"
        style={{ width: size * 0.35, height: size * 0.35, top: size * 0.05 }} />
    </div>
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
    <div className="flex items-center gap-1" data-testid="sample-icons">
      {samples.map(s => {
        const mapping = ICON_MAP[s.key]
        if (!mapping) return null
        const { Icon, color } = mapping
        return (
          <span
            key={s.key}
            title={s.label}
            className={`${color} cursor-default`}
          >
            <Icon size={16} />
          </span>
        )
      })}
    </div>
  )
}
