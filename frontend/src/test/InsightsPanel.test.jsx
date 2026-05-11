import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import InsightsPanel from '../components/InsightsPanel'

const mockInsights = [
  { level: 'critical', title: 'Alergia vs prescripción: Metamizol', detail: 'Paciente alérgico a Metamizol', reasoning: 'Cruce directo', analysisType: 'allergy_conflict' },
  { level: 'warning', title: 'Bradicardia + betabloqueante', detail: 'FC mínima: 48 lpm', reasoning: 'Valorar reducción', analysisType: 'bradycardia_beta_blockers' },
  { level: 'info', title: 'FR elevada: 24 rpm', detail: 'Media últimos registros', reasoning: 'Monitorizar', analysisType: 'elevated_respiratory_rate' },
]

vi.mock('../services/insightsApi', () => ({
  insightsApi: {
    getByPatientAdmission: vi.fn(() => Promise.resolve({ data: mockInsights })),
  },
}))

describe('KAN-69: Panel de insights clínicos', () => {
  it('[KAN-69] muestra el panel con contadores de severidad', async () => {
    render(<InsightsPanel patientId={1} admissionId={10} />)
    await waitFor(() => {
      expect(screen.getByText('Inteligencia Clínica')).toBeInTheDocument()
      expect(screen.getByText(/1 crítico/)).toBeInTheDocument()
      expect(screen.getByText(/1 alerta/)).toBeInTheDocument()
      expect(screen.getByText('3 insights')).toBeInTheDocument()
    })
  })

  it('[KAN-70] muestra alerta de alergia vs prescripción', async () => {
    render(<InsightsPanel patientId={1} admissionId={10} />)
    await waitFor(() => {
      expect(screen.getByText('Alergia vs prescripción: Metamizol')).toBeInTheDocument()
    })
  })

  it('[KAN-72] muestra alerta de bradicardia + betabloqueante', async () => {
    render(<InsightsPanel patientId={1} admissionId={10} />)
    await waitFor(() => {
      expect(screen.getByText('Bradicardia + betabloqueante')).toBeInTheDocument()
    })
  })

  it('[KAN-69] insights críticos se auto-expanden con detalle visible', async () => {
    render(<InsightsPanel patientId={1} admissionId={10} />)
    await waitFor(() => {
      expect(screen.getByText('Paciente alérgico a Metamizol')).toBeInTheDocument()
      expect(screen.getByText('Cruce directo')).toBeInTheDocument()
    })
  })

  it('[KAN-69] colapsar/expandir el panel completo', async () => {
    render(<InsightsPanel patientId={1} admissionId={10} />)
    await waitFor(() => screen.getByText('Inteligencia Clínica'))
    fireEvent.click(screen.getByText('Inteligencia Clínica'))
    expect(screen.queryByText('Alergia vs prescripción: Metamizol')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Inteligencia Clínica'))
    expect(screen.getByText('Alergia vs prescripción: Metamizol')).toBeInTheDocument()
  })

  it('excludeTypes filtra insights por analysisType', async () => {
    render(<InsightsPanel patientId={1} admissionId={10} excludeTypes={['allergy_conflict']} />)
    await waitFor(() => {
      expect(screen.getByText('Bradicardia + betabloqueante')).toBeInTheDocument()
      expect(screen.queryByText('Alergia vs prescripción: Metamizol')).not.toBeInTheDocument()
      expect(screen.getByText('2 insights')).toBeInTheDocument()
    })
  })

  it('includeTypes muestra solo los tipos indicados', async () => {
    render(<InsightsPanel patientId={1} admissionId={10} includeTypes={['allergy_conflict']} />)
    await waitFor(() => {
      expect(screen.getByText('Alergia vs prescripción: Metamizol')).toBeInTheDocument()
      expect(screen.queryByText('Bradicardia + betabloqueante')).not.toBeInTheDocument()
      expect(screen.getByText('1 insight')).toBeInTheDocument()
    })
  })
})
