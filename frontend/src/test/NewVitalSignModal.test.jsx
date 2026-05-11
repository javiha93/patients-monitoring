import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NewVitalSignModal from '../components/NewVitalSignModal'

vi.mock('../services/deviceApi', () => ({
  deviceApi: {
    hasActiveByType: vi.fn(),
    create: vi.fn(() => Promise.resolve({ data: { id: 99 } })),
  },
}))

const mockSubmit = vi.fn()
const mockClose = vi.fn()

function renderModal(props = {}) {
  return render(
    <NewVitalSignModal
      open={true}
      onClose={mockClose}
      onSubmit={mockSubmit}
      patientName="García, Ana · 40 años"
      admissionId={10}
      {...props}
    />
  )
}

describe('NewVitalSignModal — sonda vesical validation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('muestra alerta cuando se selecciona sonda vesical sin dispositivo registrado', async () => {
    const { deviceApi } = await import('../services/deviceApi')
    deviceApi.hasActiveByType.mockResolvedValue({ data: false })

    renderModal()

    // Select sonda vesical as urine source
    const urineSelect = screen.getByDisplayValue('— Sin registro —')
    fireEvent.change(urineSelect, { target: { value: 'sonda_vesical' } })

    await waitFor(() => {
      expect(screen.getByTestId('sonda-vesical-alert')).toBeInTheDocument()
      expect(screen.getByText('No hay sonda vesical registrada')).toBeInTheDocument()
    })
  })

  it('bloquea el envío del formulario cuando falta sonda vesical', async () => {
    const { deviceApi } = await import('../services/deviceApi')
    deviceApi.hasActiveByType.mockResolvedValue({ data: false })

    renderModal()

    const urineSelect = screen.getByDisplayValue('— Sin registro —')
    fireEvent.change(urineSelect, { target: { value: 'sonda_vesical' } })

    await waitFor(() => {
      expect(screen.getByTestId('sonda-vesical-alert')).toBeInTheDocument()
    })

    // Submit button should be disabled
    const submitBtn = screen.getByText('Guardar registro')
    expect(submitBtn).toBeDisabled()

    // Try to submit — should not call onSubmit
    fireEvent.click(submitBtn)
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('no muestra alerta cuando hay sonda vesical activa', async () => {
    const { deviceApi } = await import('../services/deviceApi')
    deviceApi.hasActiveByType.mockResolvedValue({ data: true })

    renderModal()

    const urineSelect = screen.getByDisplayValue('— Sin registro —')
    fireEvent.change(urineSelect, { target: { value: 'sonda_vesical' } })

    await waitFor(() => {
      expect(deviceApi.hasActiveByType).toHaveBeenCalledWith(10, 'sonda_vesical')
    })

    // Alert should NOT appear
    expect(screen.queryByTestId('sonda-vesical-alert')).not.toBeInTheDocument()

    // Submit button should be enabled
    const submitBtn = screen.getByText('Guardar registro')
    expect(submitBtn).not.toBeDisabled()
  })

  it('muestra botón para añadir sonda vesical y abre modal de dispositivo', async () => {
    const { deviceApi } = await import('../services/deviceApi')
    deviceApi.hasActiveByType.mockResolvedValue({ data: false })

    renderModal()

    const urineSelect = screen.getByDisplayValue('— Sin registro —')
    fireEvent.change(urineSelect, { target: { value: 'sonda_vesical' } })

    await waitFor(() => {
      expect(screen.getByText('Añadir sonda vesical ahora')).toBeInTheDocument()
    })

    // Click the add button — should open device form modal
    fireEvent.click(screen.getByText('Añadir sonda vesical ahora'))

    await waitFor(() => {
      expect(screen.getByText('Nuevo dispositivo')).toBeInTheDocument()
      expect(screen.getByText('Registrar')).toBeInTheDocument()
    })
  })

  it('desbloquea el formulario tras registrar sonda vesical desde el modal', async () => {
    const { deviceApi } = await import('../services/deviceApi')
    deviceApi.hasActiveByType.mockResolvedValue({ data: false })

    renderModal()

    const urineSelect = screen.getByDisplayValue('— Sin registro —')
    fireEvent.change(urineSelect, { target: { value: 'sonda_vesical' } })

    await waitFor(() => {
      expect(screen.getByText('Añadir sonda vesical ahora')).toBeInTheDocument()
    })

    // Open device modal and submit
    fireEvent.click(screen.getByText('Añadir sonda vesical ahora'))
    await waitFor(() => screen.getByText('Nuevo dispositivo'))

    fireEvent.click(screen.getByText('Registrar'))

    await waitFor(() => {
      // After creating device, alert should disappear and submit should be enabled
      expect(screen.queryByTestId('sonda-vesical-alert')).not.toBeInTheDocument()
      expect(screen.getByText('Guardar registro')).not.toBeDisabled()
    })
  })

  it('no muestra alerta para otros orígenes de orina', async () => {
    const { deviceApi } = await import('../services/deviceApi')

    renderModal()

    const urineSelect = screen.getByDisplayValue('— Sin registro —')

    // Test colector
    fireEvent.change(urineSelect, { target: { value: 'colector' } })
    expect(screen.queryByTestId('sonda-vesical-alert')).not.toBeInTheDocument()
    expect(deviceApi.hasActiveByType).not.toHaveBeenCalled()

    // Test pañal
    fireEvent.change(urineSelect, { target: { value: 'panal' } })
    expect(screen.queryByTestId('sonda-vesical-alert')).not.toBeInTheDocument()
  })
})
