import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NewVitalSignModal from '../components/NewVitalSignModal'
import { selectOption, getSelectByDisplayText } from './selectHelper'

vi.mock('../services/deviceApi', () => ({
  deviceApi: {
    hasActiveByType: vi.fn(),
    create: vi.fn(() => Promise.resolve({ data: { id: 99 } })),
    getActiveDrains: vi.fn(() => Promise.resolve({ data: [] })),
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
    const urineSelect = getSelectByDisplayText('— Sin registro —')
    selectOption(urineSelect, 'Sonda vesical')

    await waitFor(() => {
      expect(screen.getByTestId('sonda-vesical-alert')).toBeInTheDocument()
      expect(screen.getByText('No hay sonda vesical registrada')).toBeInTheDocument()
    })
  })

  it('bloquea el envío del formulario cuando falta sonda vesical', async () => {
    const { deviceApi } = await import('../services/deviceApi')
    deviceApi.hasActiveByType.mockResolvedValue({ data: false })

    renderModal()

    const urineSelect = getSelectByDisplayText('— Sin registro —')
    selectOption(urineSelect, 'Sonda vesical')

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

    const urineSelect = getSelectByDisplayText('— Sin registro —')
    selectOption(urineSelect, 'Sonda vesical')

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

    const urineSelect = getSelectByDisplayText('— Sin registro —')
    selectOption(urineSelect, 'Sonda vesical')

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

    const urineSelect = getSelectByDisplayText('— Sin registro —')
    selectOption(urineSelect, 'Sonda vesical')

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

    // Test colector
    const urineSelect = getSelectByDisplayText('— Sin registro —')
    selectOption(urineSelect, 'Colector')
    expect(screen.queryByTestId('sonda-vesical-alert')).not.toBeInTheDocument()
    expect(deviceApi.hasActiveByType).not.toHaveBeenCalled()

    // Test pañal — need to find the select again (now shows 'Colector')
    const urineSelect2 = getSelectByDisplayText('Colector')
    selectOption(urineSelect2, 'Pañal')
    expect(screen.queryByTestId('sonda-vesical-alert')).not.toBeInTheDocument()
  })

  it('muestra campos de drenaje cuando hay drenajes activos', async () => {
    const { deviceApi } = await import('../services/deviceApi')
    deviceApi.getActiveDrains.mockResolvedValue({ data: [
      { id: 10, type: 'redon', drainNumber: 1, region: 'abdomen', subRegion: 'hipocondrio_dcho', laterality: 'derecha' },
      { id: 11, type: 'jackson_pratt', drainNumber: 2, region: 'pelvis', laterality: 'medial' },
    ] })

    renderModal()

    await waitFor(() => {
      expect(screen.getByText('Drenajes (2)')).toBeInTheDocument()
      expect(screen.getByText('Redon #1')).toBeInTheDocument()
      expect(screen.getByText('Jackson-Pratt #2')).toBeInTheDocument()
    })

    // Check drain output fields exist
    const debitoLabels = screen.getAllByText('Débito (mL)')
    expect(debitoLabels).toHaveLength(2)
  })

  it('bloquea si sonda vesical está retirada (backend devuelve false)', async () => {
    const { deviceApi } = await import('../services/deviceApi')
    // Backend returns false because the only sonda vesical is retired (removedAt != null)
    deviceApi.hasActiveByType.mockResolvedValue({ data: false })

    renderModal()

    const urineSelect = getSelectByDisplayText('— Sin registro —')
    selectOption(urineSelect, 'Sonda vesical')

    await waitFor(() => {
      expect(screen.getByTestId('sonda-vesical-alert')).toBeInTheDocument()
      expect(screen.getByText('Guardar registro')).toBeDisabled()
    })
  })
})
