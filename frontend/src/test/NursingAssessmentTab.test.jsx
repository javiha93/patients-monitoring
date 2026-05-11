import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NursingAssessmentTab from '../components/NursingAssessmentTab'

// Mock API
const mockAssessments = [
  {
    id: 1, admissionId: 10, recordedAt: '2024-01-10T08:30:00',
    assessmentType: 'entrada', consciousness: 'alerta', glasgowScore: 15,
    arrivalMode: 'ambulancia', accompanied: true, languageBarrier: 'ninguna',
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
    getHistorical: vi.fn(() => Promise.resolve({ data: { content: [], hasMore: false } })),
    create: vi.fn(() => Promise.resolve({ data: { id: 2 } })),
    update: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
    delete: vi.fn(() => Promise.resolve()),
  },
}))

const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }

function renderTab(props = {}) {
  return render(<NursingAssessmentTab admissionId={10} patientId={1} toast={mockToast} {...props} />)
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
    expect(screen.getByText('Consciencia *')).toBeInTheDocument()
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
    const { nursingApi } = await import('../services/nursingApi')
    nursingApi.getByAdmission.mockResolvedValueOnce({ data: [] })
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    // Entrada form starts with hasPain=false → pain fields hidden
    expect(screen.queryByText('Localización')).not.toBeInTheDocument()
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

  it('botón guardar deshabilitado sin campos obligatorios (entrada)', async () => {
    const { nursingApi } = await import('../services/nursingApi')
    nursingApi.getByAdmission.mockResolvedValueOnce({ data: [] })
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    // Entrada form starts empty → required fields missing (consciousness, glasgow, arrivalMode)
    const saveBtn = screen.getByText('Guardar valoración')
    expect(saveBtn.disabled).toBe(true)
    expect(screen.getByText('* Campos obligatorios sin rellenar')).toBeInTheDocument()
  })

  it('guardar habilitado tras rellenar todos los campos obligatorios', async () => {
    const { nursingApi } = await import('../services/nursingApi')
    nursingApi.getByAdmission.mockResolvedValueOnce({ data: [] })
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    // Fill arrivalMode (required for entrada)
    const arrivalSelect = screen.getAllByRole('combobox').find(s =>
      Array.from(s.options).some(o => o.value === 'ambulancia')
    )
    fireEvent.change(arrivalSelect, { target: { value: 'ambulancia' } })
    // Fill consciousness
    const consciousnessSelect = screen.getAllByRole('combobox').find(s =>
      Array.from(s.options).some(o => o.value === 'alerta')
    )
    fireEvent.change(consciousnessSelect, { target: { value: 'alerta' } })
    // Fill glasgow
    const glasgowInput = screen.getByPlaceholderText('Ej: 15')
    fireEvent.change(glasgowInput, { target: { value: '15' } })
    const saveBtn = screen.getByText('Guardar valoración')
    expect(saveBtn.disabled).toBe(false)
    fireEvent.click(saveBtn)
    await waitFor(() => {
      expect(nursingApi.create).toHaveBeenCalledTimes(1)
      expect(mockToast.success).toHaveBeenCalledWith('Valoración guardada')
    })
  })

  it('muestra botón helper de Glasgow que abre modal', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    // Click the helper button (HelpCircle icon button with title)
    const helperBtn = screen.getByTitle('Calculadora Glasgow')
    expect(helperBtn).toBeInTheDocument()
    fireEvent.click(helperBtn)
    // Glasgow modal should open
    await waitFor(() => {
      expect(screen.getByText('Escala de Coma de Glasgow')).toBeInTheDocument()
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
    const { nursingApi } = await import('../services/nursingApi')
    nursingApi.getByAdmission.mockResolvedValueOnce({ data: [] })
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    // Entrada form starts with empty defaults → bedRails off
    const railsBtn = screen.getByText('Barandillas')
    expect(railsBtn.className).toContain('bg-white')
    fireEvent.click(railsBtn)
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

  it('sección Llegada visible solo en valoración de entrada', async () => {
    const { nursingApi } = await import('../services/nursingApi')
    nursingApi.getByAdmission.mockResolvedValueOnce({ data: [] })
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    // Entrada → Llegada visible
    expect(screen.getByText('Llegada *')).toBeInTheDocument()
    expect(screen.getByText('Modo de llegada *')).toBeInTheDocument()
  })

  it('sección Llegada oculta en valoración sucesiva', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    // Sucesiva → Llegada no visible
    expect(screen.queryByText('Llegada *')).not.toBeInTheDocument()
    expect(screen.queryByText('Modo de llegada *')).not.toBeInTheDocument()
  })

  it('barrera comunicación está en sección Estado físico y cognitivo', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    expect(screen.getByText('Barrera comunicación')).toBeInTheDocument()
    // Should be near the cognitive section, not in Llegada
    expect(screen.getByText('Estado físico y cognitivo')).toBeInTheDocument()
  })

  it('sucesiva se pre-rellena con datos de la última valoración', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Nueva valoración'))
    fireEvent.click(screen.getByText('Nueva valoración'))
    // Glasgow should be pre-filled with 15 from mockAssessments[0]
    const glasgowInput = screen.getByPlaceholderText('Ej: 15')
    expect(glasgowInput.value).toBe('15')
    // Consciousness should be pre-filled with 'alerta'
    const consciousnessSelect = screen.getAllByRole('combobox').find(s =>
      Array.from(s.options).some(o => o.value === 'alerta')
    )
    expect(consciousnessSelect.value).toBe('alerta')
  })

  it('clic en editar abre el formulario con datos pre-rellenados', async () => {
    renderTab()
    await waitFor(() => screen.getByText('Entrada'))
    // Expand the card first to find the edit button
    const editBtns = document.querySelectorAll('button')
    const editBtn = Array.from(editBtns).find(b => b.querySelector('svg') && b.className.includes('hover:text-blue-500'))
    fireEvent.click(editBtn)
    // Form should open in edit mode
    await waitFor(() => {
      expect(screen.getByText('Editar valoración')).toBeInTheDocument()
      expect(screen.getByText('Actualizar valoración')).toBeInTheDocument()
    })
  })

  it('editar llama a update API en vez de create', async () => {
    const { nursingApi } = await import('../services/nursingApi')
    renderTab()
    await waitFor(() => screen.getByText('Entrada'))
    // Click edit button
    const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.className.includes('hover:text-blue-500'))
    fireEvent.click(editBtn)
    await waitFor(() => screen.getByText('Editar valoración'))
    // Submit
    fireEvent.click(screen.getByText('Actualizar valoración'))
    await waitFor(() => {
      expect(nursingApi.update).toHaveBeenCalledWith(1, expect.objectContaining({ admissionId: 10 }))
      expect(nursingApi.create).not.toHaveBeenCalled()
    })
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

  it('muestra botón "Ver anteriores" cuando hay patientId', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('Ver anteriores')).toBeInTheDocument()
    })
  })

  it('clic en "Ver anteriores" carga valoraciones históricas', async () => {
    const { nursingApi } = await import('../services/nursingApi')
    const historicalAssessment = {
      id: 99, admissionId: 5, recordedAt: '2023-06-01T10:00:00',
      assessmentType: 'entrada', consciousness: 'somnoliento', glasgowScore: 12,
      hasPain: false, mood: 'tranquilo', breathingPattern: 'normal', mobility: 'sin_alteraciones',
    }
    nursingApi.getHistorical.mockResolvedValueOnce({ data: { content: [historicalAssessment], hasMore: false } })
    renderTab()
    await waitFor(() => screen.getByText('Ver anteriores'))
    fireEvent.click(screen.getByText('Ver anteriores'))
    await waitFor(() => {
      expect(nursingApi.getHistorical).toHaveBeenCalledWith(1, 10, 0, 5)
      expect(screen.getByText('Valoraciones de ingresos anteriores')).toBeInTheDocument()
    })
  })

  it('no muestra botón "Ver anteriores" sin patientId', async () => {
    renderTab({ patientId: undefined })
    await waitFor(() => screen.getByText('Nueva valoración'))
    expect(screen.queryByText('Ver anteriores')).not.toBeInTheDocument()
  })
})
