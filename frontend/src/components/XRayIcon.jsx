/**
 * Custom X-ray icon in Lucide style (24x24, stroke-based).
 * Shows a simplified chest X-ray: ribcage outline with spine.
 */
export default function XRayIcon({ size = 24, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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
      {/* Frame */}
      <rect x="3" y="3" width="18" height="18" rx="2" />
      {/* Spine */}
      <line x1="12" y1="6" x2="12" y2="18" />
      {/* Ribs left */}
      <line x1="12" y1="8" x2="7" y2="9.5" />
      <line x1="12" y1="11" x2="7" y2="12.5" />
      <line x1="12" y1="14" x2="7" y2="15.5" />
      {/* Ribs right */}
      <line x1="12" y1="8" x2="17" y2="9.5" />
      <line x1="12" y1="11" x2="17" y2="12.5" />
      <line x1="12" y1="14" x2="17" y2="15.5" />
    </svg>
  )
}
