package com.pm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pm.dto.CreatePatientRequest;
import com.pm.dto.CreatePrescriptionRequest;
import com.pm.dto.SignAdministrationRequest;
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

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class PrescriptionApiTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper mapper;

    private Long admissionId;

    @BeforeEach
    void setup() throws Exception {
        CreatePatientRequest req = new CreatePatientRequest();
        req.setNhc("NHC-RX-001");
        req.setFirstName("Test");
        req.setLastName("Prescription");
        req.setBirthDate(LocalDate.of(1975, 6, 20));
        req.setSex("female");
        req.setTriageLevel(3);
        req.setMatCategory("Dolor abdominal");
        req.setLocation("B5");

        String response = mvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        admissionId = mapper.readTree(response).get("activeAdmission").get("id").asLong();
    }

    private CreatePrescriptionRequest buildRx(String name, String amount, String unit, String category) {
        CreatePrescriptionRequest rx = new CreatePrescriptionRequest();
        rx.setAdmissionId(admissionId);
        rx.setName(name);
        rx.setAmount(amount);
        rx.setUnit(unit);
        rx.setRoute("VO");
        rx.setFrequency("c/8h");
        rx.setCategory(category);
        rx.setScheduledHours("8,16,0");
        rx.setPrescribedBy("Dr. Test");
        return rx;
    }

    // ── KAN-56: Prescripciones del ingreso ──

    @Test
    @DisplayName("[KAN-56] Crear prescripción de medicación fija")
    void createFixedPrescription() throws Exception {
        CreatePrescriptionRequest rx = buildRx("Paracetamol", "1000", "mg", "fixed");

        mvc.perform(post("/api/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(rx)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Paracetamol"))
                .andExpect(jsonPath("$.amount").value("1000"))
                .andExpect(jsonPath("$.unit").value("mg"))
                .andExpect(jsonPath("$.category").value("fixed"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    @DisplayName("[KAN-56] Crear prescripción condicional con condición")
    void createConditionalPrescription() throws Exception {
        CreatePrescriptionRequest rx = buildRx("Metamizol", "575", "mg", "conditional");
        rx.setFrequency("Si precisa");
        rx.setConditionText("Si Tª > 38°C");

        mvc.perform(post("/api/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(rx)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("conditional"))
                .andExpect(jsonPath("$.conditionText").value("Si Tª > 38°C"));
    }

    @Test
    @DisplayName("[KAN-56] Listar prescripciones por ingreso")
    void listByAdmission() throws Exception {
        // Create two prescriptions
        mvc.perform(post("/api/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRx("Paracetamol", "1000", "mg", "fixed"))))
                .andExpect(status().isCreated());

        mvc.perform(post("/api/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRx("Omeprazol", "20", "mg", "fixed"))))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/prescriptions/admission/" + admissionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("[KAN-56] Listar solo prescripciones activas")
    void listActiveOnly() throws Exception {
        // Create and deactivate one
        String resp = mvc.perform(post("/api/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRx("Paracetamol", "1000", "mg", "fixed"))))
                .andReturn().getResponse().getContentAsString();
        Long rxId = mapper.readTree(resp).get("id").asLong();

        mvc.perform(post("/api/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRx("Omeprazol", "20", "mg", "fixed"))));

        mvc.perform(patch("/api/prescriptions/" + rxId + "/deactivate"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/prescriptions/admission/" + admissionId + "/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Omeprazol"));
    }

    @Test
    @DisplayName("[KAN-56] Desactivar prescripción")
    void deactivatePrescription() throws Exception {
        String resp = mvc.perform(post("/api/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRx("Paracetamol", "1000", "mg", "fixed"))))
                .andReturn().getResponse().getContentAsString();
        Long rxId = mapper.readTree(resp).get("id").asLong();

        mvc.perform(patch("/api/prescriptions/" + rxId + "/deactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    @DisplayName("[KAN-56] Modificar dosis de prescripción")
    void updateDose() throws Exception {
        String resp = mvc.perform(post("/api/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRx("Paracetamol", "1000", "mg", "fixed"))))
                .andReturn().getResponse().getContentAsString();
        Long rxId = mapper.readTree(resp).get("id").asLong();

        mvc.perform(patch("/api/prescriptions/" + rxId + "/dose")
                .param("newAmount", "500")
                .param("changedBy", "Dr. López")
                .param("reason", "Ajuste por peso"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value("500"));
    }

    // ── KAN-57: Firma y desfirma de administración ──

    @Test
    @DisplayName("[KAN-57] Firmar administración de medicamento")
    void signAdministration() throws Exception {
        String resp = mvc.perform(post("/api/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRx("Paracetamol", "1000", "mg", "fixed"))))
                .andReturn().getResponse().getContentAsString();
        Long rxId = mapper.readTree(resp).get("id").asLong();

        SignAdministrationRequest sign = new SignAdministrationRequest();
        sign.setPrescriptionId(rxId);
        sign.setAdministeredAt(LocalDateTime.now());
        sign.setSignedBy("Enfermera Ana");
        sign.setDoseGiven("1000");

        mvc.perform(post("/api/prescriptions/sign")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(sign)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.signedBy").value("Enfermera Ana"))
                .andExpect(jsonPath("$.doseGiven").value("1000"));
    }

    @Test
    @DisplayName("[KAN-57] Firmar con observaciones")
    void signWithNote() throws Exception {
        String resp = mvc.perform(post("/api/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRx("Paracetamol", "1000", "mg", "fixed"))))
                .andReturn().getResponse().getContentAsString();
        Long rxId = mapper.readTree(resp).get("id").asLong();

        SignAdministrationRequest sign = new SignAdministrationRequest();
        sign.setPrescriptionId(rxId);
        sign.setAdministeredAt(LocalDateTime.now());
        sign.setSignedBy("Enfermera Ana");
        sign.setDoseGiven("1000");
        sign.setNote("Paciente con náuseas leves");

        mvc.perform(post("/api/prescriptions/sign")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(sign)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.note").value("Paciente con náuseas leves"));
    }

    @Test
    @DisplayName("[KAN-57] Desfirmar administración")
    void unsignAdministration() throws Exception {
        String resp = mvc.perform(post("/api/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRx("Paracetamol", "1000", "mg", "fixed"))))
                .andReturn().getResponse().getContentAsString();
        Long rxId = mapper.readTree(resp).get("id").asLong();

        SignAdministrationRequest sign = new SignAdministrationRequest();
        sign.setPrescriptionId(rxId);
        sign.setAdministeredAt(LocalDateTime.now());
        sign.setSignedBy("Enfermera Ana");
        sign.setDoseGiven("1000");

        String adminResp = mvc.perform(post("/api/prescriptions/sign")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(sign)))
                .andReturn().getResponse().getContentAsString();
        Long adminId = mapper.readTree(adminResp).get("id").asLong();

        mvc.perform(delete("/api/prescriptions/unsign/" + adminId))
                .andExpect(status().isNoContent());

        // Verify prescription has no administrations
        mvc.perform(get("/api/prescriptions/admission/" + admissionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].administrations", hasSize(0)));
    }

    @Test
    @DisplayName("[KAN-57] Administraciones aparecen en la prescripción")
    void administrationsInPrescription() throws Exception {
        String resp = mvc.perform(post("/api/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(buildRx("Paracetamol", "1000", "mg", "fixed"))))
                .andReturn().getResponse().getContentAsString();
        Long rxId = mapper.readTree(resp).get("id").asLong();

        // Sign twice
        for (int i = 0; i < 2; i++) {
            SignAdministrationRequest sign = new SignAdministrationRequest();
            sign.setPrescriptionId(rxId);
            sign.setAdministeredAt(LocalDateTime.now().plusHours(i * 8));
            sign.setSignedBy("Enfermera " + i);
            sign.setDoseGiven("1000");
            mvc.perform(post("/api/prescriptions/sign")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(sign)));
        }

        mvc.perform(get("/api/prescriptions/admission/" + admissionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].administrations", hasSize(2)));
    }

    // ── KAN-58: Insulina ──

    @Test
    @DisplayName("[KAN-58] Crear prescripción de insulina")
    void createInsulinPrescription() throws Exception {
        CreatePrescriptionRequest rx = buildRx("Insulina Novorapid", "0", "UI", "insulin");
        rx.setRoute("SC");
        rx.setFrequency("c/6h");
        rx.setScheduledHours("7,13,19,1");

        mvc.perform(post("/api/prescriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(rx)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("insulin"))
                .andExpect(jsonPath("$.name").value("Insulina Novorapid"));
    }
}
