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
/**
 * Renders sample/tube icons for a lab test based on its requested parameters.
 * Validated samples are shown in grey; pending ones keep their color.
 */
export default function SampleIconsRow({ requestedParameters, validatedSamples }) {
  if (!requestedParameters) return null

  let params
  try {
    params = JSON.parse(requestedParameters)
  } catch {
    return null
  }

  const samples = getSamplesNeeded(params)
  if (samples.length === 0) return null

  let validatedSet = new Set()
  if (validatedSamples) {
    try {
      validatedSet = new Set(JSON.parse(validatedSamples))
    } catch { /* ignore */ }
  }

  return (
    <div className={`grid gap-1 ${samples.length > 3 ? 'grid-cols-3' : `grid-cols-${samples.length}`}`} data-testid="sample-icons">
      {samples.map(s => {
        const mapping = ICON_MAP[s.key]
        if (!mapping) return null
        const { Icon, color } = mapping
        const isValidated = validatedSet.has(s.key)
        return (
          <span
            key={s.key}
            title={isValidated ? `${s.label} ✓` : s.label}
            className={`${isValidated ? 'text-slate-300' : color} cursor-default flex items-center justify-center`}
          >
            <Icon size={22} />
          </span>
        )
      })}
    </div>
  )
}



/**
 * Checkbox row for selecting which samples to validate.
 */
export function SampleCheckbox({ requestedParameters, validatedSamples, selected, onToggle }) {
  if (!requestedParameters) return null

  let params
  try {
    params = JSON.parse(requestedParameters)
  } catch {
    return null
  }

  const samples = getSamplesNeeded(params)
  if (samples.length === 0) return null

  let alreadyValidated = new Set()
  if (validatedSamples) {
    try {
      alreadyValidated = new Set(JSON.parse(validatedSamples))
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-1.5" data-testid="sample-checkboxes">
      {samples.map(s => {
        const mapping = ICON_MAP[s.key]
        if (!mapping) return null
        const { Icon, color } = mapping
        const wasValidated = alreadyValidated.has(s.key)
        const isSelected = selected.has(s.key)

        return (
          <label
            key={s.key}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
              wasValidated
                ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                : isSelected
                  ? 'bg-violet-50 border-violet-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="checkbox"
              checked={wasValidated || isSelected}
              disabled={wasValidated}
              onChange={() => !wasValidated && onToggle(s.key)}
              className="sr-only"
            />
            <span className={`flex-shrink-0 ${wasValidated ? 'text-slate-300' : color}`}>
              <Icon size={20} />
            </span>
            <span className={`text-sm flex-1 ${wasValidated ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
              {s.label}
            </span>
            {wasValidated && (
              <span className="text-[10px] text-slate-400 font-medium">Validado</span>
            )}
            {!wasValidated && (
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                isSelected ? 'bg-violet-500 border-violet-500' : 'border-slate-300'
              }`}>
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
                    <path d="M2 5l2 2 4-4" />
                  </svg>
                )}
              </div>
            )}
          </label>
        )
      })}
    </div>
  )
}
