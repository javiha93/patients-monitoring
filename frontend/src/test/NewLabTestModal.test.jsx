import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NewLabTestModal from '../components/NewLabTestModal'

describe('NewLabTestModal', () => {
  const onSubmit = vi.fn()
  const onClose = vi.fn()

  function renderModal() {
    return render(<NewLabTestModal onSubmit={onSubmit} onClose={onClose} />)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra las pestañas de tipo de muestra', () => {
    renderModal()
    expect(screen.getByText('Sangre')).toBeInTheDocument()
    expect(screen.getByText('Orina')).toBeInTheDocument()
    expect(screen.getByText('Esputo')).toBeInTheDocument()
    expect(screen.getByText('Heces')).toBeInTheDocument()
    expect(screen.getByText('Cultivos')).toBeInTheDocument()
  })

  it('muestra perfiles predefinidos en la pestaña sangre', () => {
    renderModal()
    expect(screen.getByText('Básico')).toBeInTheDocument()
    expect(screen.getByText('Protocolo dolor torácico')).toBeInTheDocument()
    // "Perfil hepático" appears as both preset and group header
    expect(screen.getAllByText('Perfil hepático').length).toBeGreaterThanOrEqual(1)
    // Panel respiratorio is in frotis tab, not sangre
    expect(screen.queryByText('Panel respiratorio')).not.toBeInTheDocument()
  })

  it('seleccionar parámetro individual actualiza el contador', () => {
    renderModal()
    fireEvent.click(screen.getByText('Hemograma completo'))
    expect(screen.getByText('Solicitar (1)')).toBeInTheDocument()
  })

  it('seleccionar grupo completo marca todos sus parámetros', () => {
    renderModal()
    // Click the "Coagulación" group header
    fireEvent.click(screen.getByText('Coagulación'))
    // Should select all 4 params in the group
    expect(screen.getByText('Solicitar (4)')).toBeInTheDocument()
  })

  it('aplicar preset selecciona los parámetros del preset', () => {
    renderModal()
    fireEvent.click(screen.getByText('Básico'))
    // Básico has 8 params
    expect(screen.getByText('Solicitar (8)')).toBeInTheDocument()
  })

  it('acumula selecciones entre pestañas', () => {
    renderModal()
    // Select something in sangre
    fireEvent.click(screen.getByText('Hemograma completo'))
    expect(screen.getByText('Solicitar (1)')).toBeInTheDocument()

    // Switch to orina and select something
    fireEvent.click(screen.getByText('Orina'))
    fireEvent.click(screen.getByText('Sistemático de orina'))
    expect(screen.getByText('Solicitar (2)')).toBeInTheDocument()

    // Switch back to sangre — hemograma should still be selected
    fireEvent.click(screen.getByText('Sangre'))
    // The total should still be 2
    expect(screen.getByText('Solicitar (2)')).toBeInTheDocument()
  })

  it('preset multi-muestra selecciona en varias pestañas', () => {
    renderModal()
    // "Sospecha ITU" spans sangre + orina + cultivo
    fireEvent.click(screen.getByText('Sospecha ITU'))
    // sangre: 4 (hemograma, pcr, creatinina, urea) + orina: 2 + cultivo: 1 = 7
    expect(screen.getByText('Solicitar (7)')).toBeInTheDocument()
  })

  it('muestra parámetros de serología en sangre', () => {
    renderModal()
    expect(screen.getByText('Serología')).toBeInTheDocument()
    expect(screen.getByText('VIH (Ag/Ac)')).toBeInTheDocument()
    expect(screen.getByText('HBsAg (Hepatitis B)')).toBeInTheDocument()
    expect(screen.getByText('Anti-VHC (Hepatitis C)')).toBeInTheDocument()
  })

  it('muestra parámetros de PCR molecular en pestaña Frotis/PCR', () => {
    renderModal()
    // PCR molecular is not in sangre tab
    expect(screen.queryByText('PCR molecular')).not.toBeInTheDocument()
    // Switch to frotis tab
    fireEvent.click(screen.getByText('Frotis / PCR'))
    expect(screen.getByText('PCR molecular')).toBeInTheDocument()
    expect(screen.getByText('PCR SARS-CoV-2 (COVID-19)')).toBeInTheDocument()
    expect(screen.getByText('PCR Gripe A')).toBeInTheDocument()
    expect(screen.getByText('PCR Gripe B')).toBeInTheDocument()
    expect(screen.getByText('Antígenos rápidos')).toBeInTheDocument()
    // Panel respiratorio preset should be visible here
    expect(screen.getByText('Panel respiratorio')).toBeInTheDocument()
  })

  it('muestra cultivos al cambiar de pestaña', () => {
    renderModal()
    fireEvent.click(screen.getByText('Cultivos'))
    expect(screen.getByText('Hemocultivos')).toBeInTheDocument()
    expect(screen.getByText('Hemocultivo aerobio')).toBeInTheDocument()
    expect(screen.getByText('Urocultivo')).toBeInTheDocument()
    expect(screen.getByText('Cultivo de herida')).toBeInTheDocument()
    expect(screen.getByText('Cultivo punta de catéter')).toBeInTheDocument()
  })

  it('clicar preset aplicado lo deselecciona', () => {
    renderModal()
    fireEvent.click(screen.getByText('Básico'))
    expect(screen.getByText('Solicitar (8)')).toBeInTheDocument()
    // Click again to toggle off
    fireEvent.click(screen.getByText('Básico'))
    expect(screen.getByText('Solicitar (0)')).toBeInTheDocument()
  })

  it('solo muestra presets relevantes para la pestaña activa', () => {
    renderModal()
    // In sangre tab, "Básico" should be visible
    expect(screen.getByText('Básico')).toBeInTheDocument()
    // Switch to heces — "Básico" should not be visible
    fireEvent.click(screen.getByText('Heces'))
    expect(screen.queryByText('Básico')).not.toBeInTheDocument()
  })

  it('muestra preset infección respiratoria en sangre, frotis, esputo y cultivos', () => {
    renderModal()
    expect(screen.getByText('Infección respiratoria')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Frotis / PCR'))
    expect(screen.getByText('Infección respiratoria')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Esputo'))
    expect(screen.getByText('Infección respiratoria')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cultivos'))
    expect(screen.getByText('Infección respiratoria')).toBeInTheDocument()
    // But not in heces
    fireEvent.click(screen.getByText('Heces'))
    expect(screen.queryByText('Infección respiratoria')).not.toBeInTheDocument()
  })

  it('preset multi-muestra ITU visible en sangre, orina y cultivos', () => {
    renderModal()
    expect(screen.getByText('Sospecha ITU')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Orina'))
    expect(screen.getByText('Sospecha ITU')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cultivos'))
    expect(screen.getByText('Sospecha ITU')).toBeInTheDocument()
  })

  it('limpiar todo resetea todas las selecciones', () => {
    renderModal()
    fireEvent.click(screen.getByText('Básico'))
    expect(screen.getByText('Solicitar (8)')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Limpiar todo'))
    expect(screen.getByText('Solicitar (0)')).toBeInTheDocument()
  })

  it('botón solicitar está deshabilitado sin selección', () => {
    renderModal()
    const btn = screen.getByText('Solicitar (0)').closest('button')
    expect(btn).toBeDisabled()
  })

  it('submit envía los datos correctos', () => {
    renderModal()
    fireEvent.click(screen.getByText('Hemograma completo'))
    fireEvent.click(screen.getByText('Orina'))
    fireEvent.click(screen.getByText('Sistemático de orina'))
    fireEvent.click(screen.getByText('Solicitar (2)'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const call = onSubmit.mock.calls[0][0]
    expect(call.category).toBe('analitica')
    expect(call.sampleType).toContain('sangre')
    expect(call.sampleType).toContain('orina')
    const params = JSON.parse(call.requestedParameters)
    expect(params).toContain('hemograma')
    expect(params).toContain('orina_sistematico')
  })
})
