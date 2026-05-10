# Patients Monitoring

Sistema de monitorización clínica de pacientes en urgencias.

## Stack

- **Backend:** Java 21 + Spring Boot 3.3 + Spring Data JPA + PostgreSQL
- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide icons
- **Base de datos:** PostgreSQL (H2 en desarrollo)

## Estructura

```
patients-monitoring/
├── backend/                  # Spring Boot API
│   └── src/main/java/com/pm/
│       ├── entity/           # 14 entidades JPA
│       ├── repository/       # Spring Data repositories
│       ├── service/          # Lógica de negocio
│       ├── controller/       # REST controllers
│       └── dto/              # Data transfer objects
├── frontend/                 # React SPA
│   └── src/
│       ├── components/       # Componentes reutilizables
│       ├── pages/            # Vistas principales
│       ├── hooks/            # Custom hooks
│       └── services/         # API client
├── mockups/                  # Prototipos HTML interactivos
└── docs/                     # Documentación
```

## Modelo de datos

14 tablas organizadas en 5 bloques:

1. **Pacientes y admisiones** — `patients`, `admissions`
2. **Constantes vitales** — `vital_signs`, `respiratory_support`
3. **Antecedentes médicos** — `medical_history`, `immunosuppression_history`, `surgical_interventions`, `allergies`
4. **Medicación habitual** — `medications`
5. **Medicación del ingreso** — `admission_prescriptions`, `insulin_scales`, `medication_administrations`, `prescription_dose_history`, `glycemia_readings`

## Desarrollo

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

API disponible en `http://localhost:8081`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponible en `http://localhost:3000`

### Mockups

Los mockups son archivos HTML autocontenidos. Para verlos:

```bash
cd mockups
python3 -m http.server 8080
```

## Funcionalidades principales

- Gestión de pacientes (listado, alta, búsqueda)
- Registro de constantes vitales con soporte respiratorio
- Antecedentes médicos y alergias
- Medicación habitual y del ingreso
- Grid de administración de medicación por horas (72h)
- **Inteligencia clínica contextual** — sistema de alertas e insights que cruza historial, medicación y tendencias
