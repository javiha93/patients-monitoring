import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PatientTests from '../pages/PatientTests'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { displayName: 'Javier Herrada', role: 'Enfermería' }, loginUser: vi.fn(), logout: vi.fn() }),
}))

const mockPatient = {
  id: 1, nhc: 'NHC-001', firstName: 'Ana', lastName: 'García',
  birthDate: '1985-03-15', sex: 'female',
  activeAdmission: { id: 10, admissionDate: '2024-01-10T08:00:00' },
}

const mockTests = [
  { id: 1, category: 'analitica', label: 'Hemograma + Bioquímica', status: 'pending_validation', requestedAt: '2024-01-10T09:00:00', requestedBy: 'Dr. García', externalId: null, results: [], requestedParameters: '["hemograma","glucosa","creatinina"]', sampleType: 'sangre' },
  { id: 2, category: 'cultivo', label: 'Hemocultivo x2', status: 'pending_receipt', requestedAt: '2024-01-10T10:00:00', requestedBy: 'Dr. López', externalId: 'LAB-001', results: [], requestedParameters: '["hemocultivo_x2"]', sampleType: 'cultivo' },
  { id: 3, category: 'analitica', label: 'Coagulación', status: 'results', requestedAt: '2024-01-10T08:00:00', requestedBy: 'Dr. García', externalId: 'LAB-002', requestedParameters: '["tp_inr","ttpa"]', sampleType: 'sangre', results: [
    { id: 1, category: 'Coagulación', name: 'INR', value: '1.1', unit: '', refRange: '0.8-1.2', flag: 'normal' },
    { id: 2, category: 'Coagulación', name: 'Fibrinógeno', value: '450', unit: 'mg/dL', refRange: '200-400', flag: 'high' },
  ]},
]

vi.mock('../services/patientApi', () => ({
  patientApi: {
    getPatient: vi.fn(() => Promise.resolve({ data: mockPatient })),
  },
}))

vi.mock('../services/labTestApi', () => ({
  labTestApi: {
    getByAdmission: vi.fn(() => Promise.resolve({ data: [] })),
    getHistorical: vi.fn(() => Promise.resolve({ data: [] })),
    getById: vi.fn(() => Promise.resolve({ data: {} })),
    create: vi.fn(() => Promise.resolve({ data: { id: 4 } })),
    update: vi.fn(() => Promise.resolve({ data: {} })),
    validate: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('../services/deviceApi', () => ({
  deviceApi: {
    hasActiveByType: vi.fn(() => Promise.resolve({ data: true })),
    create: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
    getByAdmission: vi.fn(() => Promise.resolve({ data: [] })),
    getActiveDrains: vi.fn(() => Promise.resolve({ data: [] })),
  },
}))

vi.mock('../services/ecgApi', () => ({
  ecgApi: {
    getByAdmission: vi.fn(() => Promise.resolve({ data: [] })),
    getHistorical: vi.fn(() => Promise.resolve({ data: [] })),
    getById: vi.fn(() => Promise.resolve({ data: {} })),
    create: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
    complete: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('../services/radiologyApi', () => ({
  radiologyApi: {
    getByAdmission: vi.fn(() => Promise.resolve({ data: [] })),
    getHistorical: vi.fn(() => Promise.resolve({ data: [] })),
    getById: vi.fn(() => Promise.resolve({ data: {} })),
    create: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
    complete: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve()),
  },
}))

import { labTestApi as mockLabTestApi } from '../services/labTestApi'
import { deviceApi as mockDeviceApi } from '../services/deviceApi'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/patient/1/tests']}>
      <Routes>
        <Route path="/patient/:id/tests" element={<PatientTests />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PatientTests: Pruebas de laboratorio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: mockTests })
  })

  it('muestra la lista de pruebas con sus estados', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Hemograma + Bioquímica'))
    expect(screen.getByText('Hemocultivo x2')).toBeInTheDocument()
    expect(screen.getByText('Coagulación')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de validar')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de recibir')).toBeInTheDocument()
    expect(screen.getByText('Resultados')).toBeInTheDocument()
  })

  it('muestra el nombre del paciente en header y action bar', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Hemograma + Bioquímica'))
    expect(screen.getAllByText('García, Ana').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/NHC-001/).length).toBeGreaterThanOrEqual(1)
  })

  it('abre modal de nueva prueba al clicar Solicitar', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Solicitar prueba'))
    fireEvent.click(screen.getByText('Solicitar prueba'))
    expect(screen.getByText('Solicitar prueba de laboratorio')).toBeInTheDocument()
  })

  it('clicar prueba pending_validation abre modal de validación', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Hemograma + Bioquímica'))
    fireEvent.click(screen.getByText('Hemograma + Bioquímica'))
    expect(screen.getByText('Validar prueba')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/LAB-2024/)).toBeInTheDocument()
  })

  it('clicar prueba con resultados abre visor de resultados', async () => {
    mockLabTestApi.getById.mockResolvedValue({ data: mockTests[2] })
    renderPage()
    await waitFor(() => screen.getByText('Coagulación'))
    fireEvent.click(screen.getByText('Coagulación'))
    await waitFor(() => screen.getByText('INR'))
    expect(screen.getByText('Fibrinógeno')).toBeInTheDocument()
    expect(screen.getByText('450')).toBeInTheDocument()
  })

  it('muestra mensaje vacío cuando no hay pruebas', async () => {
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: [] })
    renderPage()
    await waitFor(() => screen.getByText('No hay pruebas de laboratorio solicitadas'))
  })

  it('muestra externalId en pruebas validadas', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Hemocultivo x2'))
    expect(screen.getByText(/LAB-001/)).toBeInTheDocument()
  })
})

describe('PatientTests: VVP prompt on first validation', () => {
  const onlyPendingTests = [
    { id: 1, category: 'analitica', label: 'Hemograma', status: 'pending_validation', requestedAt: '2024-01-10T09:00:00', requestedBy: 'Dr. García', externalId: null, results: [], requestedParameters: '["hemograma","glucosa","creatinina"]', sampleType: 'sangre' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: onlyPendingTests })
  })

  it('muestra alerta VVP cuando no hay vía periférica activa en primera validación', async () => {
    mockDeviceApi.hasActiveByType.mockResolvedValue({ data: false })
    renderPage()
    await waitFor(() => screen.getByText('Hemograma'))
    fireEvent.click(screen.getByText('Hemograma'))
    await waitFor(() => screen.getByTestId('vvp-alert'))
    expect(screen.getByText('No hay vía periférica registrada')).toBeInTheDocument()
    expect(screen.getByText('Registrar vía periférica')).toBeInTheDocument()
  })

  it('no muestra alerta VVP cuando ya existe vía periférica activa', async () => {
    mockDeviceApi.hasActiveByType.mockResolvedValue({ data: true })
    renderPage()
    await waitFor(() => screen.getByText('Hemograma'))
    fireEvent.click(screen.getByText('Hemograma'))
    await waitFor(() => screen.getByText('Validar prueba'))
    expect(screen.queryByTestId('vvp-alert')).not.toBeInTheDocument()
  })

  it('no muestra alerta VVP cuando ya hay pruebas validadas previamente', async () => {
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: mockTests })
    mockDeviceApi.hasActiveByType.mockResolvedValue({ data: false })
    renderPage()
    await waitFor(() => screen.getByText('Hemograma + Bioquímica'))
    fireEvent.click(screen.getByText('Hemograma + Bioquímica'))
    await waitFor(() => screen.getByText('Validar prueba'))
    expect(screen.queryByTestId('vvp-alert')).not.toBeInTheDocument()
  })

  it('abre modal de registro de dispositivo al clicar "Registrar vía periférica"', async () => {
    mockDeviceApi.hasActiveByType.mockResolvedValue({ data: false })
    renderPage()
    await waitFor(() => screen.getByText('Hemograma'))
    fireEvent.click(screen.getByText('Hemograma'))
    await waitFor(() => screen.getByTestId('vvp-alert'))
    fireEvent.click(screen.getByText('Registrar vía periférica'))
    await waitFor(() => screen.getByText('Nuevo dispositivo'))
    expect(screen.getByText('Nuevo dispositivo')).toBeInTheDocument()
  })
})


describe('PatientTests: VVP only for blood tests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('no muestra alerta VVP para prueba sin parámetros de sangre (solo orina)', async () => {
    const urineOnly = [
      { id: 10, category: 'analitica', label: 'Orina', status: 'pending_validation', requestedAt: '2024-01-10T09:00:00', requestedBy: 'Dr. García', externalId: null, results: [], requestedParameters: '["orina_sistematico","orina_sedimento"]', sampleType: 'orina' },
    ]
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: urineOnly })
    mockDeviceApi.hasActiveByType.mockResolvedValue({ data: false })
    renderPage()
    await waitFor(() => screen.getByText('Orina'))
    fireEvent.click(screen.getByText('Orina'))
    await waitFor(() => screen.getByText('Validar prueba'))
    expect(screen.queryByTestId('vvp-alert')).not.toBeInTheDocument()
  })
})

describe('PatientTests: partial validation', () => {
  const multiSampleTest = [
    { id: 20, category: 'analitica', label: 'Hemograma + Orina', status: 'pending_validation', requestedAt: '2024-01-10T09:00:00', requestedBy: 'Dr. García', externalId: null, results: [], requestedParameters: '["hemograma","glucosa","orina_sistematico"]', sampleType: 'sangre,orina' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: multiSampleTest })
    mockDeviceApi.hasActiveByType.mockResolvedValue({ data: true })
  })

  it('muestra checkboxes de muestras en el modal de validación', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Hemograma + Orina'))
    fireEvent.click(screen.getByText('Hemograma + Orina'))
    await waitFor(() => screen.getByTestId('sample-checkboxes'))
    expect(screen.getByText('Tubo bioquímica')).toBeInTheDocument()
    expect(screen.getByText('Tubo hemograma')).toBeInTheDocument()
    expect(screen.getByText('Muestra de orina')).toBeInTheDocument()
  })

  it('muestra iconos grises para muestras ya validadas', async () => {
    const partiallyValidated = [
      { ...multiSampleTest[0], validatedSamples: '["tubo_bioquimica","tubo_hemograma"]' },
    ]
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: partiallyValidated })
    renderPage()
    await waitFor(() => screen.getByText('Hemograma + Orina'))
    const icons = screen.getByTestId('sample-icons')
    expect(icons).toBeInTheDocument()
  })
})

describe('PatientTests: split test card', () => {
  const splitTest = [
    {
      id: 30, category: 'analitica', label: 'Hemograma + Orina', status: 'pending_validation',
      requestedAt: '2024-01-10T09:00:00', requestedBy: 'Dr. García', externalId: null, results: [],
      requestedParameters: '["hemograma","glucosa","orina_sistematico"]', sampleType: 'sangre,orina',
      validatedSamples: '["tubo_bioquimica","tubo_hemograma"]',
      children: [
        {
          id: 31, category: 'analitica', label: 'Hemograma + Orina', status: 'pending_receipt',
          requestedAt: '2024-01-10T09:00:00', requestedBy: 'Dr. García', externalId: 'LAB-100',
          validatedBy: 'Javier Herrada', validatedAt: '2024-01-10T10:00:00',
          results: [], requestedParameters: '["hemograma","glucosa","orina_sistematico"]',
          sampleType: 'sangre,orina', validatedSamples: '["tubo_bioquimica","tubo_hemograma"]',
          children: [], validations: [],
        },
      ],
      validations: [
        { externalId: 'LAB-100', validatedBy: 'Javier Herrada', validatedAt: '2024-01-10T10:00:00',
          validatedSamples: '["tubo_bioquimica","tubo_hemograma"]', status: 'pending_receipt' },
      ],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: splitTest })
    mockDeviceApi.hasActiveByType.mockResolvedValue({ data: true })
  })

  it('muestra tarjeta dividida con fila de hijo validado y fila pendiente', async () => {
    renderPage()
    await waitFor(() => screen.getByTestId('split-test-card'))
    expect(screen.getByText('ID: LAB-100')).toBeInTheDocument()
    expect(screen.getByText('Val: Javier Herrada')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de recibir')).toBeInTheDocument()
    expect(screen.getByText('Muestras pendientes de validar')).toBeInTheDocument()
  })

  it('al clicar fila pendiente abre modal con códigos existentes', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Muestras pendientes de validar'))
    fireEvent.click(screen.getByText('Muestras pendientes de validar'))
    await waitFor(() => screen.getByText('Validar prueba'))
    expect(screen.getByText(/Usar código existente/)).toBeInTheDocument()
    expect(screen.getByText('LAB-100')).toBeInTheDocument()
    expect(screen.getByText('Nuevo código')).toBeInTheDocument()
  })
})

import { ecgApi as mockEcgApi } from '../services/ecgApi'
import { radiologyApi as mockRadiologyApi } from '../services/radiologyApi'

describe('PatientTests: ECG section', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra sección de electrocardiogramas vacía', async () => {
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: [] })
    mockEcgApi.getByAdmission.mockResolvedValue({ data: [] })
    renderPage()
    await waitFor(() => screen.getByText('Electrocardiogramas'))
    expect(screen.getByText('No hay electrocardiogramas solicitados')).toBeInTheDocument()
    expect(screen.getByText('Solicitar ECG')).toBeInTheDocument()
  })

  it('muestra ECG pendiente con estado Pendiente', async () => {
    const ecgs = [
      { id: 1, status: 'pending', requestedAt: '2024-01-10T09:00:00', requestedBy: 'Dr. García', completedAt: null, completedBy: null },
    ]
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: [] })
    mockEcgApi.getByAdmission.mockResolvedValue({ data: ecgs })
    renderPage()
    await waitFor(() => screen.getByText('Electrocardiograma'))
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('muestra ECG realizado y abre visor al clicar', async () => {
    const ecgs = [
      { id: 2, status: 'completed', requestedAt: '2024-01-10T09:00:00', requestedBy: 'Dr. García', completedAt: '2024-01-10T10:00:00', completedBy: 'Javier Herrada' },
    ]
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: [] })
    mockEcgApi.getByAdmission.mockResolvedValue({ data: ecgs })
    mockEcgApi.getById.mockResolvedValue({ data: { ...ecgs[0], imageData: 'abc123', imageType: 'image/png' } })
    renderPage()
    await waitFor(() => screen.getByText('Realizado'))
    fireEvent.click(screen.getByText('Electrocardiograma'))
    await waitFor(() => screen.getByAltText('ECG'))
    expect(screen.getByAltText('ECG')).toBeInTheDocument()
  })

  it('solicitar ECG llama a ecgApi.create', async () => {
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: [] })
    mockEcgApi.getByAdmission.mockResolvedValue({ data: [] })
    renderPage()
    await waitFor(() => screen.getByText('Solicitar ECG'))
    fireEvent.click(screen.getByText('Solicitar ECG'))
    await waitFor(() => expect(mockEcgApi.create).toHaveBeenCalled())
  })
})

describe('PatientTests: historical data buttons', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra botón de analíticas de ingresos anteriores', async () => {
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: [] })
    mockEcgApi.getByAdmission.mockResolvedValue({ data: [] })
    renderPage()
    await waitFor(() => screen.getByText('Analíticas de ingresos anteriores'))
    expect(screen.getByText('Analíticas de ingresos anteriores')).toBeInTheDocument()
    expect(screen.getByText('ECGs de ingresos anteriores')).toBeInTheDocument()
  })

  it('carga analíticas históricas al clicar el botón', async () => {
    const historical = [
      { id: 99, category: 'analitica', label: 'Hemograma antiguo', status: 'results', requestedAt: '2023-06-01T09:00:00', externalId: 'OLD-001', results: [], requestedParameters: '["hemograma"]', sampleType: 'sangre' },
    ]
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: [] })
    mockLabTestApi.getHistorical.mockResolvedValue({ data: historical })
    mockEcgApi.getByAdmission.mockResolvedValue({ data: [] })
    renderPage()
    await waitFor(() => screen.getByText('Analíticas de ingresos anteriores'))
    fireEvent.click(screen.getByText('Analíticas de ingresos anteriores'))
    await waitFor(() => screen.getByText('Hemograma antiguo'))
    expect(screen.getByText('Hemograma antiguo')).toBeInTheDocument()
    expect(screen.getByText('ID: OLD-001')).toBeInTheDocument()
  })

  it('carga ECGs históricos al clicar el botón', async () => {
    const historical = [
      { id: 88, status: 'completed', requestedAt: '2023-06-01T09:00:00', completedAt: '2023-06-01T10:00:00', completedBy: 'Dr. López' },
    ]
    mockLabTestApi.getByAdmission.mockResolvedValue({ data: [] })
    mockEcgApi.getByAdmission.mockResolvedValue({ data: [] })
    mockEcgApi.getHistorical.mockResolvedValue({ data: historical })
    renderPage()
    await waitFor(() => screen.getByText('ECGs de ingresos anteriores'))
    fireEvent.click(screen.getByText('ECGs de ingresos anteriores'))
    await waitFor(() => screen.getByText('ECGs de ingresos anteriores', { selector: 'h3' }))
    expect(screen.getByText('· Dr. López')).toBeInTheDocument()
  })
})

describe('Radiología', () => {
  it('muestra sección de radiología vacía', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Radiología'))
    expect(screen.getByText('No hay pruebas de imagen solicitadas')).toBeInTheDocument()
  })

  it('muestra botón de solicitar imagen', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Solicitar imagen'))
    expect(screen.getByText('Solicitar imagen')).toBeInTheDocument()
  })

  it('muestra órdenes de radiología con tipo y región', async () => {
    const orders = [
      { id: 1, type: 'xray', bodyRegion: 'torax', projection: 'PA', contrast: false, priority: 'normal', status: 'pending', requestedAt: '2024-01-10T09:00:00', requestedBy: 'Dr. García' },
      { id: 2, type: 'ct', bodyRegion: 'craneo', projection: null, contrast: true, priority: 'urgente', status: 'completed', requestedAt: '2024-01-09T10:00:00', completedAt: '2024-01-09T11:00:00', requestedBy: 'Dr. García', completedBy: 'Téc. López' },
    ]
    mockRadiologyApi.getByAdmission.mockResolvedValue({ data: orders })
    renderPage()
    await waitFor(() => screen.getByText(/Radiografía: Tórax/))
    expect(screen.getByText('(PA)')).toBeInTheDocument()
    expect(screen.getByText(/TAC: Cráneo/)).toBeInTheDocument()
    expect(screen.getByText('CIV')).toBeInTheDocument()
    expect(screen.getByText('URGENTE')).toBeInTheDocument()
  })

  it('muestra estados pendiente y realizado', async () => {
    const orders = [
      { id: 1, type: 'xray', bodyRegion: 'torax', projection: 'PA', contrast: false, priority: 'normal', status: 'pending', requestedAt: '2024-01-10T09:00:00' },
      { id: 2, type: 'mri', bodyRegion: 'rodilla', projection: null, contrast: false, priority: 'normal', status: 'completed', requestedAt: '2024-01-09T10:00:00', completedAt: '2024-01-09T11:00:00' },
    ]
    mockRadiologyApi.getByAdmission.mockResolvedValue({ data: orders })
    renderPage()
    await waitFor(() => screen.getByText(/Radiografía: Tórax/))
    const badges = screen.getAllByText(/Pendiente|Realizado/)
    expect(badges.length).toBeGreaterThanOrEqual(2)
  })

  it('abre modal de solicitar imagen', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Solicitar imagen'))
    fireEvent.click(screen.getByText('Solicitar imagen'))
    await waitFor(() => screen.getByText('Solicitar prueba de imagen'))
    expect(screen.getByText('Radiografía')).toBeInTheDocument()
    expect(screen.getByText('TAC')).toBeInTheDocument()
    expect(screen.getByText('Resonancia')).toBeInTheDocument()
  })

  it('modal de radiografía muestra mapa corporal al seleccionar tipo', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Solicitar imagen'))
    fireEvent.click(screen.getByText('Solicitar imagen'))
    await waitFor(() => screen.getByText('Radiografía'))
    fireEvent.click(screen.getByText('Radiografía'))
    expect(screen.getByText(/Selecciona la zona/)).toBeInTheDocument()
    expect(screen.getByText(/Pasa el ratón por el cuerpo/)).toBeInTheDocument()
  })

  it('carga radiología histórica', async () => {
    const historical = [
      { id: 10, type: 'xray', bodyRegion: 'torax', projection: 'PA', contrast: false, priority: 'normal', status: 'completed', requestedAt: '2023-06-01T09:00:00', completedAt: '2023-06-01T10:00:00', completedBy: 'Téc. Ruiz' },
    ]
    mockRadiologyApi.getByAdmission.mockResolvedValue({ data: [] })
    mockRadiologyApi.getHistorical.mockResolvedValue({ data: historical })
    renderPage()
    await waitFor(() => screen.getByText('Radiología de ingresos anteriores'))
    fireEvent.click(screen.getByText('Radiología de ingresos anteriores'))
    await waitFor(() => screen.getByText('Radiología de ingresos anteriores', { selector: 'h3' }))
    expect(screen.getByText(/· Téc. Ruiz/)).toBeInTheDocument()
  })
})
