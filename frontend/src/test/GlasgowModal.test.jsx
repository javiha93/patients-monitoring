import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GlasgowModal, { GLASGOW_AXES } from '../components/GlasgowModal'

const onClose = vi.fn()
const onConfirm = vi.fn()

function renderModal() {
  return render(<GlasgowModal open={true} onClose={onClose} onConfirm={onConfirm} />)
}

describe('KAN-79: GlasgowModal', () => {
  it('muestra las tres columnas de puntuación', () => {
    renderModal()
    expect(screen.getByText('Apertura ocular')).toBeInTheDocument()
    expect(screen.getByText('Respuesta verbal')).toBeInTheDocument()
    expect(screen.getByText('Respuesta motora')).toBeInTheDocument()
  })

  it('muestra todas las opciones oculares', () => {
    renderModal()
    GLASGOW_AXES.OCULAR.forEach(o => {
      expect(screen.getByText(o.label)).toBeInTheDocument()
    })
  })

  it('muestra todas las opciones verbales', () => {
    renderModal()
    GLASGOW_AXES.VERBAL.forEach(v => {
      expect(screen.getByText(v.label)).toBeInTheDocument()
    })
  })

  it('muestra todas las opciones motoras', () => {
    renderModal()
    GLASGOW_AXES.MOTOR.forEach(m => {
      expect(screen.getByText(m.label)).toBeInTheDocument()
    })
  })

  it('botón Aplicar deshabilitado hasta seleccionar las 3 respuestas', () => {
    renderModal()
    const applyBtn = screen.getByText('Aplicar')
    expect(applyBtn.disabled).toBe(true)
  })

  it('calcula total correctamente (4+5+6=15)', () => {
    renderModal()
    fireEvent.click(screen.getByText('Espontánea'))
    fireEvent.click(screen.getByText('Orientado'))
    fireEvent.click(screen.getByText('Obedece'))
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('O:4 + V:5 + M:6')).toBeInTheDocument()
    expect(screen.getByText('Leve (13-15)')).toBeInTheDocument()
  })

  it('calcula total grave (1+1+1=3)', () => {
    renderModal()
    // Click all "Ausente" options — there are 3 of them
    const ausenteButtons = screen.getAllByText('Ausente')
    ausenteButtons.forEach(b => fireEvent.click(b))
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Grave (≤8)')).toBeInTheDocument()
  })

  it('calcula total moderado (3+3+4=10)', () => {
    renderModal()
    fireEvent.click(screen.getByText('Al llamado'))
    fireEvent.click(screen.getByText('Palabras'))
    fireEvent.click(screen.getByText('Flexión normal'))
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('Moderado (9-12)')).toBeInTheDocument()
  })

  it('Aplicar llama onConfirm con el total y cierra', () => {
    renderModal()
    fireEvent.click(screen.getByText('Espontánea'))
    fireEvent.click(screen.getByText('Orientado'))
    fireEvent.click(screen.getByText('Obedece'))
    fireEvent.click(screen.getByText('Aplicar'))
    expect(onConfirm).toHaveBeenCalledWith(15)
    expect(onClose).toHaveBeenCalled()
  })

  it('no renderiza nada cuando open=false', () => {
    const { container } = render(<GlasgowModal open={false} onClose={onClose} onConfirm={onConfirm} />)
    expect(container.innerHTML).toBe('')
  })
})
