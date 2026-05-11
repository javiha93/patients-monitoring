package com.pm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pm.dto.CreatePatientRequest;
import com.pm.dto.DischargeRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class PatientApiTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper mapper;

    private CreatePatientRequest buildRequest(String nhc, String firstName, String lastName) {
        CreatePatientRequest req = new CreatePatientRequest();
        req.setNhc(nhc);
        req.setFirstName(firstName);
        req.setLastName(lastName);
        req.setBirthDate(LocalDate.of(1985, 3, 15));
        req.setSex("female");
        req.setTriageLevel(2);
        req.setMatCategory("Dolor torácico");
        req.setLocation("B1");
        return req;
    }

    @Test
    @DisplayName("[KAN-6] Crear paciente con ingreso activo")
    void createPatient() throws Exception {
        CreatePatientRequest req = buildRequest("NHC-001", "Ana", "García");

        mvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nhc").value("NHC-001"))
                .andExpect(jsonPath("$.firstName").value("Ana"))
                .andExpect(jsonPath("$.lastName").value("García"))
                .andExpect(jsonPath("$.activeAdmission").isNotEmpty())
                .andExpect(jsonPath("$.activeAdmission.triageLevel").value(2))
                .andExpect(jsonPath("$.activeAdmission.matCategory").value("Dolor torácico"))
                .andExpect(jsonPath("$.activeAdmission.location").value("B1"));
    }

    @Test
    @DisplayName("[KAN-5] Listar pacientes activos con ubicación")
    void listActivePatients() throws Exception {
        // Create two patients
        mvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRequest("NHC-001", "Ana", "García"))))
                .andExpect(status().isCreated());
        CreatePatientRequest req2 = buildRequest("NHC-002", "Carlos", "López");
        req2.setLocation("B3");
        req2.setTriageLevel(4);
        mvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req2)))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].location").exists())
                .andExpect(jsonPath("$[1].location").exists());
    }

    @Test
    @DisplayName("[KAN-34] Alta hospitalaria del paciente")
    void dischargePatient() throws Exception {
        // Create patient
        String response = mvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRequest("NHC-001", "Ana", "García"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long patientId = mapper.readTree(response).get("id").asLong();

        // Discharge
        DischargeRequest discharge = new DischargeRequest();
        mvc.perform(post("/api/patients/" + patientId + "/discharge")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(discharge)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeAdmission").isEmpty());

        // Active list should be empty
        mvc.perform(get("/api/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("[KAN-35] Reapertura de ficha de paciente dado de alta")
    void reopenPatient() throws Exception {
        // Create and discharge
        String response = mvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRequest("NHC-001", "Ana", "García"))))
                .andReturn().getResponse().getContentAsString();
        Long patientId = mapper.readTree(response).get("id").asLong();

        mvc.perform(post("/api/patients/" + patientId + "/discharge")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new DischargeRequest())));

        // Reopen
        mvc.perform(post("/api/patients/" + patientId + "/reopen")
                .param("triageLevel", "3")
                .param("matCategory", "Fiebre")
                .param("location", "B5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeAdmission").isNotEmpty())
                .andExpect(jsonPath("$.activeAdmission.location").value("B5"));
    }

    @Test
    @DisplayName("[KAN-5] Obtener detalle de paciente con ingreso activo")
    void getPatientDetail() throws Exception {
        String response = mvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRequest("NHC-001", "Ana", "García"))))
                .andReturn().getResponse().getContentAsString();
        Long patientId = mapper.readTree(response).get("id").asLong();

        mvc.perform(get("/api/patients/" + patientId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nhc").value("NHC-001"))
                .andExpect(jsonPath("$.activeAdmission.location").value("B1"));
    }
}
