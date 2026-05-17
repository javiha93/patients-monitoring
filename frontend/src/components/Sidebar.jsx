import { useState } from 'react'
import { Users, LogOut, FileText, PanelLeftClose, PanelLeftOpen, Moon, Sun } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { dark, toggle: toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)

  const links = [
    { to: '/', icon: Users, label: 'Urgencias' },
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
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  title={dark ? 'Modo claro' : 'Modo oscuro'}
                  className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                  style={{ background: dark ? '#0ea5e9' : '#475569' }}
                >
                  <span
                    className="absolute top-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm"
                    style={{ left: dark ? '22px' : '2px' }}
                  >
                    {dark ? <Sun size={10} className="text-amber-500" /> : <Moon size={10} className="text-slate-600" />}
                  </span>
                </button>
                <button onClick={logout} className="text-slate-500 hover:text-white transition-colors" title="Cerrar sesión">
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={toggleTheme}
              title={dark ? 'Modo claro' : 'Modo oscuro'}
              className="text-slate-500 hover:text-white transition-colors"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={logout} className="text-slate-500 hover:text-white transition-colors" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
