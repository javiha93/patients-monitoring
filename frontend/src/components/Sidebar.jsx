import { useState } from 'react'
import { Users, Search, LogOut, FileText, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const links = [
    { to: '/', icon: Users, label: 'Pacientes' },
    { to: '/discharged', icon: Search, label: 'Dados de alta' },
  ]

  return (
    <aside className={`bg-sidebar text-white flex flex-col flex-shrink-0 transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-lg font-bold">
            <span className="text-sky-400">P</span>atients{' '}
            <span className="text-sky-400">M</span>onitoring
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white transition-colors p-1"
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <nav className="flex-1 py-4">
        {links.map(l => {
          const Icon = l.icon
          const active = location.pathname === l.to
          return (
            <Link
              key={l.to}
              to={l.to}
              title={collapsed ? l.label : undefined}
              className={`flex items-center gap-3 ${collapsed ? 'justify-center px-2' : 'px-5'} py-2.5 text-sm transition-colors ${active ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Icon size={18} />
              {!collapsed && l.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-slate-800">
        <Link
          to="/reports"
          title={collapsed ? 'Reportes' : undefined}
          className={`flex items-center gap-3 ${collapsed ? 'justify-center px-2' : 'px-5'} py-3 text-sm transition-colors ${
            location.pathname === '/reports' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText size={18} />
          {!collapsed && 'Reportes'}
        </Link>
      </div>
      <div className={`${collapsed ? 'px-2' : 'px-5'} py-4 border-t border-slate-800 text-sm text-slate-400`}>
        {!collapsed ? (
          <>
            <div className="text-white font-medium">{user?.displayName || 'Usuario'}</div>
            <div className="flex items-center justify-between">
              <span>{user?.role || 'Sin rol'}</span>
              <button onClick={logout} className="text-slate-500 hover:text-white transition-colors" title="Cerrar sesión">
                <LogOut size={14} />
              </button>
            </div>
          </>
        ) : (
          <button onClick={logout} className="text-slate-500 hover:text-white transition-colors w-full flex justify-center" title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  )
}
