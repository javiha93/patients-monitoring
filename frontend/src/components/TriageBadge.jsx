const colors = {
  1: 'bg-red-600',
  2: 'bg-orange-600',
  3: 'bg-yellow-500',
  4: 'bg-green-500',
  5: 'bg-blue-500',
}

export default function TriageBadge({ level }) {
  if (!level) return null
  return (
    <span className={`${colors[level]} text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold`}>
      {level}
    </span>
  )
}
