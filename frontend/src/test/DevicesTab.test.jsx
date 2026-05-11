import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DevicesTab from '../components/DevicesTab'

const mockDevices = [
  { id: 1, admissionId: 10, category: 'vascular', type: 'via_periferica', gauge: '20G', location: 'mano_derecha', lumens: null, material: null, insertedAt: '2026-05-11T08:00:00', removedAt: null, notes: '' },
  { id: 2, admissionId: 10, category: 'elimination', type: 'sonda_vesical', gauge: '16Fr', location: null, lumens: 2, material: 'latex', insertedAt: '2026-05-11T09:00:00', removedAt: '2026-05-11T15:00:00', notes: 'Retirada por mejoría' },
]

vi.mock('../services/insightsApi', () => ({
  insightsApi: {
    getByPatientAdmission: vi.fn(() => Promise.resolve({ data: [] })),
  },
}))

vi.mock('../services/deviceApi', () => ({
  deviceApi: {
    getByAdmission: vi.fn(() => Promise.resolve({ data: mockDevices })),
    create: vi.fn(() => Promise.resolve({ data: { id: 3 } })),
    update: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve()),
    hasActiveByType: vi.fn(() => Promise.resolve({ data: false })),
  },
}))

const mockToast = { success: vi.fn(), error: vi.fn() }

function renderTab() {
  return render(<DevicesTab admissionId={10} patientId={1} toast={mockToast} />)
}

describe('DevicesTab', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('muestra las 3 secciones de dispositivos', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('Dispositivos de Acceso Vascular')).toBeInTheDocument()
      expect(screen.getByText('Dispositivos Gastrointestinales')).toBeInTheDocument()
      expect(screen.getByText('Dispositivos de Eliminación')).toBeInTheDocument()
    })
  })

  it('muestra dispositivo activo con sus detalles', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('Vía Periférica')).toBeInTheDocument()
      expect(screen.getByText('20G')).toBeInTheDocument()
      expect(screen.getByText('Mano dcha.')).toBeInTheDocument()
    })
  })

  it('muestra material del dispositivo', async () => {
    renderTab()
    await waitFor(() => screen.getByText('1 retirado'))
    fireEvent.click(screen.getByText('1 retirado'))
    expect(screen.getByText('Látex')).toBeInTheDocument()
  })

  it('muestra sección de retirados colapsable', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('1 retirado')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('1 retirado'))
    expect(screen.getByText('Sonda Vesical')).toBeInTheDocument()
    expect(screen.getByText('16Fr')).toBeInTheDocument()
    expect(screen.getByText('2 luces')).toBeInTheDocument()
  })

  it('abre modal al hacer clic en añadir', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Añadir dispositivo'))
    fireEvent.click(screen.getByText('Añadir dispositivo'))
    expect(screen.getByText('Nuevo dispositivo')).toBeInTheDocument()
    expect(screen.getByText('Registrar')).toBeInTheDocument()
  })

  it('crea dispositivo al enviar formulario del modal', async () => {
    const { deviceApi } = await import('../services/deviceApi')
    renderTab()
    await waitFor(() => screen.getByText('Añadir dispositivo'))
    fireEvent.click(screen.getByText('Añadir dispositivo'))
    fireEvent.click(screen.getByText('Registrar'))
    await waitFor(() => {
      expect(deviceApi.create).toHaveBeenCalled()
      expect(mockToast.success).toHaveBeenCalledWith('Dispositivo registrado')
    })
  })

  it('cierra modal con botón cancelar', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Añadir dispositivo'))
    fireEvent.click(screen.getByText('Añadir dispositivo'))
    expect(screen.getByText('Nuevo dispositivo')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancelar'))
    await waitFor(() => {
      expect(screen.queryByText('Nuevo dispositivo')).not.toBeInTheDocument()
    })
  })

  it('elimina dispositivo activo con confirmación', async () => {
    const { deviceApi } = await import('../services/deviceApi')
    renderTab()
    await waitFor(() => screen.getByText('Vía Periférica'))
    const deleteBtn = screen.getByTitle('Eliminar')
    fireEvent.click(deleteBtn)
    fireEvent.click(screen.getByText('Confirmar'))
    await waitFor(() => {
      expect(deviceApi.delete).toHaveBeenCalledWith(1)
      expect(mockToast.success).toHaveBeenCalledWith('Dispositivo eliminado')
    })
  })

  it('muestra campo material al añadir sonda vesical', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Añadir sonda vesical'))
    fireEvent.click(screen.getByText('Añadir sonda vesical'))
    expect(screen.getByText('Material')).toBeInTheDocument()
    expect(screen.getByText('Látex')).toBeInTheDocument()
    expect(screen.getByText('Silicona')).toBeInTheDocument()
  })

  it('permite eliminar dispositivo retirado', async () => {
    const { deviceApi } = await import('../services/deviceApi')
    renderTab()
    // Expand removed section
    await waitFor(() => screen.getByText('1 retirado'))
    fireEvent.click(screen.getByText('1 retirado'))
    // The removed device card should have a delete button
    const deleteBtns = screen.getAllByTitle('Eliminar')
    // Second delete button belongs to the removed device (id=2)
    fireEvent.click(deleteBtns[1])
    fireEvent.click(screen.getByText('Confirmar'))
    await waitFor(() => {
      expect(deviceApi.delete).toHaveBeenCalledWith(2)
      expect(mockToast.success).toHaveBeenCalledWith('Dispositivo eliminado')
    })
  })
})
