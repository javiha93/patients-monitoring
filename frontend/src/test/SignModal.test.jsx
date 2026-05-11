import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InsulinSignModal, EditAdminModal } from '../components/SignModal'

const insulinPrescription = {
  id: 2, name: 'Insulina Novorapid', amount: '0', unit: 'UI',
  route: 'SC', frequency: 'c/6h', category: 'insulin',
}

const fixedPrescription = {
  id: 1, name: 'Paracetamol', amount: '1000', unit: 'mg',
  route: 'VO', frequency: 'c/8h', category: 'fixed',
}

const slot = '2024-01-10T08:00:00.000Z'

describe('KAN-58: InsulinSignModal — Firma de insulina', () => {
  it('[KAN-58] no renderiza cuando open=false', () => {
    render(<InsulinSignModal open={false} prescription={insulinPrescription} slot={slot} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByText('Firmar insulina')).not.toBeInTheDocument()
  })

  it('[KAN-58] muestra título "Firmar insulina"', () => {
    render(<InsulinSignModal open={true} prescription={insulinPrescription} slot={slot} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Firmar insulina')).toBeInTheDocument()
  })

  it('[KAN-58] muestra nombre del medicamento', () => {
    render(<InsulinSignModal open={true} prescription={insulinPrescription} slot={slot} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Insulina Novorapid')).toBeInTheDocument()
  })

  it('[KAN-58] tiene campo de glucemia capilar', () => {
    render(<InsulinSignModal open={true} prescription={insulinPrescription} slot={slot} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText('250')).toBeInTheDocument()
  })

  it('[KAN-58] tiene campo de dosis en UI', () => {
    render(<InsulinSignModal open={true} prescription={insulinPrescription} slot={slot} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText('4')).toBeInTheDocument()
  })

  it('[KAN-58] tiene campo firmado por (requerido)', () => {
    render(<InsulinSignModal open={true} prescription={insulinPrescription} slot={slot} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText('Nombre')).toBeRequired()
  })

  it('[KAN-58] llama onConfirm con glucemia en nota', () => {
    const onConfirm = vi.fn()
    render(<InsulinSignModal open={true} prescription={insulinPrescription} slot={slot} onConfirm={onConfirm} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('250'), { target: { value: '220' } })
    fireEvent.change(screen.getByPlaceholderText('4'), { target: { value: '4' } })
    fireEvent.change(screen.getByPlaceholderText('Nombre'), { target: { value: 'Enfermera Ana' } })
    fireEvent.click(screen.getByText('Firmar'))
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      prescriptionId: 2,
      doseGiven: '4',
      signedBy: 'Enfermera Ana',
      note: expect.stringContaining('Glucemia: 220'),
    }))
  })

  it('[KAN-58] llama onClose al cancelar', () => {
    const onClose = vi.fn()
    render(<InsulinSignModal open={true} prescription={insulinPrescription} slot={slot} onConfirm={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('KAN-57: EditAdminModal — Edición desde icono lápiz', () => {
  const admin = {
    id: 100, administeredAt: '2024-01-10T08:30:00',
    doseGiven: '1000', signedBy: 'Enfermera Ana', note: 'Sin incidencias',
  }

  it('[KAN-57] no renderiza cuando open=false', () => {
    render(<EditAdminModal open={false} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByText('Editar administración')).not.toBeInTheDocument()
  })

  it('[KAN-57] muestra título "Editar administración"', () => {
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Editar administración')).toBeInTheDocument()
  })

  it('[KAN-57] muestra nombre del medicamento y firmante', () => {
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Paracetamol')).toBeInTheDocument()
    expect(screen.getByText(/Enfermera Ana/)).toBeInTheDocument()
  })

  it('[KAN-57] muestra dosis actual editable', () => {
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument()
  })

  it('[KAN-57] muestra observaciones editables', () => {
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('Sin incidencias')).toBeInTheDocument()
  })

  it('[KAN-57] tiene botón Desfirmar', () => {
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Desfirmar')).toBeInTheDocument()
  })

  it('[KAN-57] llama onUpdate al guardar', () => {
    const onUpdate = vi.fn()
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={onUpdate} onUnsign={vi.fn()} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Guardar'))
    expect(onUpdate).toHaveBeenCalledWith(100, expect.objectContaining({ doseGiven: '1000', note: 'Sin incidencias' }))
  })

  it('[KAN-57] llama onUnsign al desfirmar (con confirm)', () => {
    const originalConfirm = window.confirm
    window.confirm = vi.fn(() => true)
    const onUnsign = vi.fn()
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={onUnsign} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Desfirmar'))
    expect(onUnsign).toHaveBeenCalledWith(100)
    window.confirm = originalConfirm
  })
})
