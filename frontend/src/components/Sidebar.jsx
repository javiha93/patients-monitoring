import { Users, Search, LogOut, FileText } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()

  const links = [
    { to: '/', icon: Users, label: 'Pacientes' },
    { to: '/discharged', icon: Search, label: 'Dados de alta' },
  ]

  return (
    <aside className="w-64 bg-sidebar text-white flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-lg font-bold">
          <span className="text-sky-400">P</span>atients{' '}
          <span className="text-sky-400">M</span>onitoring
        </h1>
      </div>
      <nav className="flex-1 py-4">
        {links.map(l => {
          const Icon = l.icon
          const active = location.pathname === l.to
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${active ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Icon size={18} />
              {l.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-slate-800">
        <Link
          to="/reports"
          className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
            location.pathname === '/reports' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText size={18} />
          Reportes
        </Link>
      </div>
      <div className="px-5 py-4 border-t border-slate-800 text-sm text-slate-400">
        <div className="text-white font-medium">{user?.displayName || 'Usuario'}</div>
        <div className="flex items-center justify-between">
          <span>{user?.role || 'Sin rol'}</span>
          <button
            onClick={logout}
            className="text-slate-500 hover:text-white transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
