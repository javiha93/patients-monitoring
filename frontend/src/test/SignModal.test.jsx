import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SignModal, EditAdminModal } from '../components/SignModal'

const fixedPrescription = {
  id: 1, name: 'Paracetamol', amount: '1000', unit: 'mg',
  route: 'VO', frequency: 'c/8h', category: 'fixed',
}

const insulinPrescription = {
  id: 2, name: 'Insulina Novorapid', amount: '0', unit: 'UI',
  route: 'SC', frequency: 'c/6h', category: 'insulin',
}

const insulinScale = {
  ranges: [
    { minGlycemia: 150, maxGlycemia: 200, dose: 2 },
    { minGlycemia: 201, maxGlycemia: 250, dose: 4 },
    { minGlycemia: 251, maxGlycemia: 300, dose: 6 },
  ],
}

const slot = '2024-01-10T08:00:00.000Z'

describe('KAN-57: SignModal — Firma de medicación fija', () => {
  it('[KAN-57] no renderiza cuando open=false', () => {
    render(<SignModal open={false} prescription={fixedPrescription} slot={slot} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByText('Firmar administración')).not.toBeInTheDocument()
  })

  it('[KAN-57] muestra título "Firmar administración" para medicación fija', () => {
    render(<SignModal open={true} prescription={fixedPrescription} slot={slot} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Firmar administración')).toBeInTheDocument()
  })

  it('[KAN-57] muestra nombre y detalle del medicamento', () => {
    render(<SignModal open={true} prescription={fixedPrescription} slot={slot} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Paracetamol')).toBeInTheDocument()
    expect(screen.getByText(/1000 mg · VO · c\/8h/)).toBeInTheDocument()
  })

  it('[KAN-57] muestra campo de dosis con valor por defecto', () => {
    render(<SignModal open={true} prescription={fixedPrescription} slot={slot} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument()
  })

  it('[KAN-57] requiere campo "Firmado por"', () => {
    render(<SignModal open={true} prescription={fixedPrescription} slot={slot} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText('Nombre del profesional')).toBeRequired()
  })

  it('[KAN-57] tiene campo de observaciones opcional', () => {
    render(<SignModal open={true} prescription={fixedPrescription} slot={slot} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText('Opcional')).toBeInTheDocument()
  })

  it('[KAN-57] llama onConfirm con datos al enviar', () => {
    const onConfirm = vi.fn()
    render(<SignModal open={true} prescription={fixedPrescription} slot={slot} onConfirm={onConfirm} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Nombre del profesional'), { target: { value: 'Enfermera Ana' } })
    fireEvent.click(screen.getByText('Firmar'))
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      prescriptionId: 1,
      signedBy: 'Enfermera Ana',
      doseGiven: '1000',
    }))
  })

  it('[KAN-57] llama onClose al hacer clic en Cancelar', () => {
    const onClose = vi.fn()
    render(<SignModal open={true} prescription={fixedPrescription} slot={slot} onConfirm={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('KAN-58: SignModal — Firma de insulina', () => {
  it('[KAN-58] muestra título "Firmar insulina"', () => {
    render(<SignModal open={true} prescription={insulinPrescription} slot={slot} insulinScale={insulinScale} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Firmar insulina')).toBeInTheDocument()
  })

  it('[KAN-58] muestra campo de glucemia capilar', () => {
    render(<SignModal open={true} prescription={insulinPrescription} slot={slot} insulinScale={insulinScale} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText('Ej: 250')).toBeInTheDocument()
  })

  it('[KAN-58] muestra dosis según escala al introducir glucemia', () => {
    render(<SignModal open={true} prescription={insulinPrescription} slot={slot} insulinScale={insulinScale} onConfirm={vi.fn()} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Ej: 250'), { target: { value: '220' } })
    expect(screen.getByText(/Dosis según escala: 4 UI/)).toBeInTheDocument()
  })

  it('[KAN-58] muestra aviso cuando glucemia fuera de rango', () => {
    render(<SignModal open={true} prescription={insulinPrescription} slot={slot} insulinScale={insulinScale} onConfirm={vi.fn()} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Ej: 250'), { target: { value: '400' } })
    expect(screen.getByText(/fuera de rango/)).toBeInTheDocument()
  })

  it('[KAN-58] no muestra campo de dosis manual para insulina', () => {
    render(<SignModal open={true} prescription={insulinPrescription} slot={slot} insulinScale={insulinScale} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByText('Dosis administrada')).not.toBeInTheDocument()
  })

  it('[KAN-58] incluye glucemia en la nota al confirmar', () => {
    const onConfirm = vi.fn()
    render(<SignModal open={true} prescription={insulinPrescription} slot={slot} insulinScale={insulinScale} onConfirm={onConfirm} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Ej: 250'), { target: { value: '220' } })
    fireEvent.change(screen.getByPlaceholderText('Nombre del profesional'), { target: { value: 'Enfermera Ana' } })
    fireEvent.click(screen.getByText('Firmar'))
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      note: expect.stringContaining('Glucemia: 220'),
      doseGiven: '4',
    }))
  })
})

describe('KAN-57: EditAdminModal — Edición de administración', () => {
  const admin = {
    id: 100, administeredAt: '2024-01-10T08:30:00',
    doseGiven: '1000', signedBy: 'Enfermera Ana', note: 'Sin incidencias',
  }

  it('[KAN-57] no renderiza cuando open=false', () => {
    render(<EditAdminModal open={false} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByText('Administración registrada')).not.toBeInTheDocument()
  })

  it('[KAN-57] muestra información de la administración', () => {
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Administración registrada')).toBeInTheDocument()
    expect(screen.getByText('Paracetamol')).toBeInTheDocument()
    expect(screen.getByText(/Enfermera Ana/)).toBeInTheDocument()
  })

  it('[KAN-57] muestra dosis actual editable', () => {
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument()
  })

  it('[KAN-57] muestra observaciones actuales editables', () => {
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('Sin incidencias')).toBeInTheDocument()
  })

  it('[KAN-57] tiene botón Desfirmar', () => {
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Desfirmar')).toBeInTheDocument()
  })

  it('[KAN-57] tiene botón Guardar', () => {
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={vi.fn()} onUnsign={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Guardar')).toBeInTheDocument()
  })

  it('[KAN-57] llama onUpdate al guardar cambios', () => {
    const onUpdate = vi.fn()
    render(<EditAdminModal open={true} admin={admin} prescription={fixedPrescription} onUpdate={onUpdate} onUnsign={vi.fn()} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Guardar'))
    expect(onUpdate).toHaveBeenCalledWith(100, expect.objectContaining({ doseGiven: '1000' }))
  })
})
