package com.pm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pm.entity.AppUser;
import com.pm.repository.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AuthApiTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired AppUserRepository userRepo;

    @BeforeEach
    void seed() {
        userRepo.save(AppUser.builder()
                .username("javier.herrada")
                .password("jahe93")
                .role("Enfermería")
                .nombreProfesional("Javier")
                .primerApellido("Herrada")
                .segundoApellido("Alvarez")
                .build());
    }

    @Test
    @DisplayName("POST /api/auth/login — successful login returns user DTO with displayName")
    void loginSuccess() throws Exception {
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                        "username", "javier.herrada",
                        "password", "jahe93",
                        "role", "Enfermería"
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("javier.herrada"))
                .andExpect(jsonPath("$.displayName").value("Javier Herrada"))
                .andExpect(jsonPath("$.role").value("Enfermería"))
                .andExpect(jsonPath("$.nombreProfesional").value("Javier"))
                .andExpect(jsonPath("$.primerApellido").value("Herrada"))
                .andExpect(jsonPath("$.segundoApellido").value("Alvarez"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/auth/login — wrong password returns 401")
    void loginWrongPassword() throws Exception {
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                        "username", "javier.herrada",
                        "password", "wrong",
                        "role", "Enfermería"
                ))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Contraseña incorrecta"));
    }

    @Test
    @DisplayName("POST /api/auth/login — wrong role returns 401")
    void loginWrongRole() throws Exception {
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                        "username", "javier.herrada",
                        "password", "jahe93",
                        "role", "Médico"
                ))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Rol incorrecto para este usuario"));
    }

    @Test
    @DisplayName("POST /api/auth/login — unknown user returns 401")
    void loginUnknownUser() throws Exception {
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                        "username", "nobody",
                        "password", "pass",
                        "role", "Enfermería"
                ))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Usuario no encontrado"));
    }

    @Test
    @DisplayName("GET /api/auth/user/{id} — returns user by ID")
    void getUserById() throws Exception {
        AppUser u = userRepo.findByUsername("javier.herrada").orElseThrow();
        mvc.perform(get("/api/auth/user/" + u.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Javier Herrada"));
    }

    @Test
    @DisplayName("POST /api/auth/seed — creates new user")
    void seedUser() throws Exception {
        mvc.perform(post("/api/auth/seed")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                        "username", "maria.lopez",
                        "password", "ml123",
                        "role", "Enfermería",
                        "nombreProfesional", "María",
                        "primerApellido", "López"
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("maria.lopez"))
                .andExpect(jsonPath("$.displayName").value("María López"));
    }

    @Test
    @DisplayName("POST /api/auth/seed — duplicate username returns 409")
    void seedDuplicate() throws Exception {
        mvc.perform(post("/api/auth/seed")
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(Map.of(
                        "username", "javier.herrada",
                        "password", "x",
                        "role", "Enfermería",
                        "nombreProfesional", "X",
                        "primerApellido", "X"
                ))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("El usuario ya existe"));
    }
}
