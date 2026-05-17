import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '../pages/Login'
import { selectOption } from './selectHelper'

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
    const roleSelect = screen.getByLabelText('Rol')
    // Custom Select shows placeholder text when value is empty
    expect(roleSelect.textContent).toContain('Selecciona un rol')
    // Open dropdown and check Enfermería option exists
    fireEvent.click(roleSelect)
    expect(screen.getByText('Enfermería', { selector: '[data-select-dropdown] button span' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
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
    selectOption(screen.getByLabelText('Rol'), 'Enfermería')
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
    selectOption(screen.getByLabelText('Rol'), 'Enfermería')
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
    selectOption(screen.getByLabelText('Rol'), 'Enfermería')
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(screen.getByText('Error de autenticación')).toBeInTheDocument()
    })
  })
})
