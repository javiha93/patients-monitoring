# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Build backend ----
FROM maven:3.9-eclipse-temurin-21-alpine AS backend-build
WORKDIR /app/backend
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B
COPY backend/src ./src
# Copy frontend build into Spring Boot static resources
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static
RUN mvn clean package -DskipTests -B

# ---- Stage 3: Runtime ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/backend/target/*.jar app.jar

EXPOSE ${PORT:-8081}

ENV SPRING_PROFILES_ACTIVE=postgres

# Railway sets $PORT dynamically; Spring Boot reads SERVER_PORT
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT:-8081}"]
