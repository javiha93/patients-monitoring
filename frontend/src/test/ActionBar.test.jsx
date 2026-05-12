import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ActionBar from '../components/ActionBar'

function renderBar(path = '/patient/1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ActionBar patient={{ id: 1, firstName: 'Ana', lastName: 'García', nhc: 'NHC-001' }} admissionId={10} />
    </MemoryRouter>
  )
}

describe('KAN-5: ActionBar', () => {
  it('[KAN-5] muestra los 4 botones de acción', () => {
    renderBar()
    expect(screen.getByTitle('Registros')).toBeInTheDocument()
    expect(screen.getByTitle('Antecedentes')).toBeInTheDocument()
    expect(screen.getByTitle('Medicación')).toBeInTheDocument()
    expect(screen.getByTitle('Pruebas')).toBeInTheDocument()
  })

  it('[KAN-5] muestra nombre y NHC del paciente', () => {
    renderBar()
    expect(screen.getByText(/García, Ana/)).toBeInTheDocument()
    expect(screen.getByText(/NHC-001/)).toBeInTheDocument()
  })

  it('[KAN-5] enlace Registros apunta a /patient/1', () => {
    renderBar()
    const link = screen.getByTitle('Registros')
    expect(link.closest('a')).toHaveAttribute('href', '/patient/1')
  })

  it('[KAN-5] enlace Antecedentes apunta a /patient/1/history', () => {
    renderBar()
    const link = screen.getByTitle('Antecedentes')
    expect(link.closest('a')).toHaveAttribute('href', '/patient/1/history')
  })

  it('[KAN-5] enlace Medicación apunta a /patient/1/medication', () => {
    renderBar()
    const link = screen.getByTitle('Medicación')
    expect(link.closest('a')).toHaveAttribute('href', '/patient/1/medication')
  })
})
