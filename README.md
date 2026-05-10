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

## Despliegue en Railway

### Configuración inicial (una sola vez)

1. Crea una cuenta en [railway.app](https://railway.app) (login con GitHub)
2. Click **"New Project"** → **"Deploy from GitHub Repo"**
3. Selecciona `javiha93/patients-monitoring`
4. Railway detectará el `Dockerfile` automáticamente

### Añadir base de datos PostgreSQL

1. En el proyecto Railway, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway conecta automáticamente las variables `DATABASE_URL`, `PGHOST`, `PGPORT`, etc.
3. Añade estas variables de entorno en el servicio de la app (Settings → Variables):
   ```
   SPRING_DATASOURCE_URL=jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}
   SPRING_DATASOURCE_USERNAME=${PGUSER}
   SPRING_DATASOURCE_PASSWORD=${PGPASSWORD}
   SPRING_JPA_HIBERNATE_DDL_AUTO=update
   ```

### Despliegue automático

Cada push a `main` dispara:
- **GitHub Actions** — compila y testea backend + frontend
- **Railway** — rebuild y redeploy automático

La app queda accesible en una URL tipo `https://patients-monitoring-production.up.railway.app`

### CI/CD

El workflow `.github/workflows/ci.yml` ejecuta en cada push/PR:
- Backend: `mvn clean verify` (Java 21)
- Frontend: `npm ci && npm run build` (Node 20)

## Funcionalidades principales

- Gestión de pacientes (listado, alta, búsqueda)
- Registro de constantes vitales con soporte respiratorio
- Antecedentes médicos y alergias
- Medicación habitual y del ingreso
- Grid de administración de medicación por horas (72h)
- **Inteligencia clínica contextual** — sistema de alertas e insights que cruza historial, medicación y tendencias
