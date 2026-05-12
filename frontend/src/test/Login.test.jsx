import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '../pages/Login'

const mockLoginUser = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loginUser: mockLoginUser, logout: vi.fn() }),
}))

const mockLogin = vi.fn()
vi.mock('../services/authApi', () => ({
  login: (...args) => mockLogin(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Login', () => {
  it('renders login form with username, password, and role fields', () => {
    render(<Login />)
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText('Rol')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('shows app title', () => {
    render(<Login />)
    expect(screen.getByText(/atients/)).toBeInTheDocument()
    expect(screen.getByText(/onitoring/)).toBeInTheDocument()
  })

  it('role dropdown starts empty with Enfermería as option', () => {
    render(<Login />)
    const select = screen.getByLabelText('Rol')
    expect(select.value).toBe('')
    expect(screen.getByText('Enfermería')).toBeInTheDocument()
  })

  it('shows validation error when fields are empty', async () => {
    render(<Login />)
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Completa todos los campos')).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('calls login API and loginUser on successful login', async () => {
    const userData = { id: 1, username: 'javier.herrada', displayName: 'Javier Herrada', role: 'Enfermería' }
    mockLogin.mockResolvedValueOnce(userData)

    render(<Login />)
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'javier.herrada' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'jahe93' } })
    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'Enfermería' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('javier.herrada', 'jahe93', 'Enfermería')
      expect(mockLoginUser).toHaveBeenCalledWith(userData)
    })
  })

  it('shows error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce({ response: { data: { error: 'Contraseña incorrecta' } } })

    render(<Login />)
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'javier.herrada' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'wrong' } })
    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'Enfermería' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(screen.getByText('Contraseña incorrecta')).toBeInTheDocument()
    })
  })

  it('shows generic error when no response body', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network error'))

    render(<Login />)
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'test' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'test' } })
    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'Enfermería' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(screen.getByText('Error de autenticación')).toBeInTheDocument()
    })
  })
})
