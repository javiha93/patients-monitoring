import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('pm_user')
    return stored ? JSON.parse(stored) : null
  })

  const loginUser = useCallback((userData) => {
    setUser(userData)
    sessionStorage.setItem('pm_user', JSON.stringify(userData))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem('pm_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
