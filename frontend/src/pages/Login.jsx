import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../services/authApi'

const ROLES = ['Enfermería', 'Medicina']

export default function Login() {
  const { loginUser } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username || !password || !role) {
      setError('Completa todos los campos')
      return
    }

    setLoading(true)
    try {
      const user = await loginApi(username, password, role)
      loginUser(user)
    } catch (err) {
      const msg = err.response?.data?.error || 'Error de autenticación'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-slate-800">
            <span className="text-sky-500">P</span>atients{' '}
            <span className="text-sky-500">M</span>onitoring
          </h1>
          <p className="text-sm text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="nombre.apellido"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="••••••"
              autoComplete="current-password"
            />
          </div>

          <div>
            <label htmlFor="login-role" className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
            <select
              id="login-role"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
            >
              <option value="">Selecciona un rol</option>
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
