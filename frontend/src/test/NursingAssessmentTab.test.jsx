import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NursingAssessmentTab from '../components/NursingAssessmentTab'

// Mock API
const mockAssessments = [
  {
    id: 1, admissionId: 10, recordedAt: '2024-01-10T08:30:00',
    assessmentType: 'entrada', consciousness: 'alerta', glasgowScore: 15,
    hasPain: true, painLocation: 'Torácico', painType: 'agudo',
    mood: 'ansioso', breathingPattern: 'taquipnea', mobility: 'sin_alteraciones',
    nutrition: 'sin_alteraciones', physicalCognitive: 'orientado',
    urinePattern: 'sin_alteraciones', stoolPattern: 'sin_alteraciones',
    bedRails: true, fallRisk: true, notes: 'Paciente estable',
  },
]

vi.mock('../services/nursingApi', () => ({
  nursingApi: {
    getByAdmission: vi.fn(() => Promise.resolve({ data: mockAssessments })),
    create: vi.fn(() => Promise.resolve({ data: { id: 2 } })),
    delete: vi.fn(() => Promise.resolve()),
  },
}))

const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }

function renderTab() {
  return render(<NursingAssessmentTab admissionId={10} toast={mockToast} />)
}

describe('KAN-79: Valoración de enfermería', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra botón "Nueva valoración"', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('Nueva valoración')).toBeInTheDocument()
    })
  })

  it('muestra valoraciones anteriores', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('Valoraciones anteriores')).toBeInTheDocument()
      expect(screen.getByText('Entrada')).toBeInTheDocument()
    })
  })

  it('clic en "Nueva valoración" abre el formulario', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    expect(screen.getByText('Nueva valoración de enfermería')).toBeInTheDocument()
  })

  it('formulario muestra todas las secciones', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    expect(screen.getByText('Consciencia')).toBeInTheDocument()
    expect(screen.getByText('Dolor')).toBeInTheDocument()
    expect(screen.getByText('Alimentación')).toBeInTheDocument()
    expect(screen.getByText('Estado anímico')).toBeInTheDocument()
    expect(screen.getByText('Estado físico y cognitivo')).toBeInTheDocument()
    expect(screen.getByText('Eliminación')).toBeInTheDocument()
    expect(screen.getByText('Respiración')).toBeInTheDocument()
    expect(screen.getByText('Movilidad')).toBeInTheDocument()
    expect(screen.getByText('Seguridad')).toBeInTheDocument()
  })

  it('campos de dolor ocultos por defecto, visibles al activar toggle', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    // Pain fields hidden by default
    expect(screen.queryByText('Localización')).not.toBeInTheDocument()
    // Click "Presenta dolor" toggle
    fireEvent.click(screen.getByText('Presenta dolor'))
    expect(screen.getByText('Localización')).toBeInTheDocument()
    expect(screen.getByText('Irradiación')).toBeInTheDocument()
  })

  it('cancelar cierra el formulario', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    expect(screen.getByText('Nueva valoración de enfermería')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancelar'))
    expect(screen.queryByText('Nueva valoración de enfermería')).not.toBeInTheDocument()
  })

  it('guardar llama a la API y muestra toast de éxito', async () => {
    const { nursingApi } = await import('../services/nursingApi')
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Guardar valoración'))
    await waitFor(() => {
      expect(nursingApi.create).toHaveBeenCalledTimes(1)
      expect(mockToast.success).toHaveBeenCalledWith('Valoración guardada')
    })
  })

  it('expandir tarjeta de valoración muestra detalles', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Entrada'))
    // Click the card to expand
    fireEvent.click(screen.getByText('Entrada').closest('div'))
    await waitFor(() => {
      expect(screen.getByText(/Consc: alerta/)).toBeInTheDocument()
    })
  })

  it('toggle de seguridad funciona correctamente', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    const railsBtn = screen.getByText('Barandillas')
    // Initially not active (bg-white)
    expect(railsBtn.className).toContain('bg-white')
    fireEvent.click(railsBtn)
    // Now active (bg-blue-500)
    expect(railsBtn.className).toContain('bg-blue-500')
  })

  it('muestra mensaje vacío cuando no hay valoraciones', async () => {
    const { nursingApi } = await import('../services/nursingApi')
    nursingApi.getByAdmission.mockResolvedValueOnce({ data: [] })
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('No hay valoraciones registradas')).toBeInTheDocument()
    })
  })

  it('auto-marca como "Sucesiva" cuando ya existen valoraciones', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    // Should show "Sucesiva" badge (assessments array has 1 item)
    expect(screen.getByText('Sucesiva')).toBeInTheDocument()
  })

  it('auto-marca como "Entrada" cuando no hay valoraciones previas', async () => {
    const { nursingApi } = await import('../services/nursingApi')
    nursingApi.getByAdmission.mockResolvedValueOnce({ data: [] })
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    // Should show "Entrada" badge
    expect(screen.getByText('Entrada')).toBeInTheDocument()
  })

  it('no muestra selector de tipo, solo badge de solo lectura', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    // No <select> for type should exist in the form header
    const selects = document.querySelectorAll('select')
    const typeSelect = Array.from(selects).find(s =>
      Array.from(s.options).some(o => o.value === 'entrada')
    )
    expect(typeSelect).toBeUndefined()
  })
})
