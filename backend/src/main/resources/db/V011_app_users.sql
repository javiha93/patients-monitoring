CREATE TABLE IF NOT EXISTS app_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    nombre_profesional VARCHAR(100) NOT NULL,
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100)
);
