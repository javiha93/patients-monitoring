import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-sidebar text-white flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-lg font-bold">
          <span className="text-sky-400">P</span>atients{' '}
          <span className="text-sky-400">M</span>onitoring
        </h1>
      </div>
      <nav className="flex-1 py-4">
        <Link
          to="/"
          className="flex items-center gap-3 px-5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 text-sm"
        >
          <Users size={18} />
          Pacientes
        </Link>
      </nav>
      <div className="px-5 py-4 border-t border-slate-800 text-sm text-slate-400">
        <div className="text-white font-medium">Usuario</div>
        <div>Enfermería</div>
      </div>
    </aside>
  )
}
