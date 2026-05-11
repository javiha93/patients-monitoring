package com.pm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pm.dto.CreatePatientRequest;
import com.pm.dto.CreateVitalSignRequest;
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
class VitalSignApiTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper mapper;

    private Long admissionId;
    private Long patientId;

    @BeforeEach
    void setup() throws Exception {
        CreatePatientRequest req = new CreatePatientRequest();
        req.setNhc("NHC-VS-001");
        req.setFirstName("Test");
        req.setLastName("Patient");
        req.setBirthDate(LocalDate.of(1980, 1, 1));
        req.setSex("male");
        req.setTriageLevel(3);
        req.setMatCategory("Fiebre");
        req.setLocation("B2");

        String response = mvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andReturn().getResponse().getContentAsString();

        patientId = mapper.readTree(response).get("id").asLong();
        admissionId = mapper.readTree(response).get("activeAdmission").get("id").asLong();
    }

    private CreateVitalSignRequest baseRequest() {
        CreateVitalSignRequest vs = new CreateVitalSignRequest();
        vs.setAdmissionId(admissionId);
        vs.setRecordedAt(LocalDateTime.now());
        vs.setHeartRate(75);
        vs.setSystolicBp(120);
        vs.setDiastolicBp(80);
        vs.setSpo2(97);
        return vs;
    }

    @Test
    @DisplayName("[KAN-8] Registrar tensión arterial")
    void recordBloodPressure() throws Exception {
        CreateVitalSignRequest vs = baseRequest();
        vs.setSystolicBp(130);
        vs.setDiastolicBp(85);

        mvc.perform(post("/api/vitals")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(vs)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.systolicBp").value(130))
                .andExpect(jsonPath("$.diastolicBp").value(85));
    }

    @Test
    @DisplayName("[KAN-9] Registrar frecuencia cardíaca")
    void recordHeartRate() throws Exception {
        CreateVitalSignRequest vs = baseRequest();
        vs.setHeartRate(72);

        mvc.perform(post("/api/vitals")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(vs)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.heartRate").value(72));
    }

    @Test
    @DisplayName("[KAN-10] Registrar saturación de oxígeno")
    void recordSpo2() throws Exception {
        CreateVitalSignRequest vs = baseRequest();
        vs.setSpo2(97);

        mvc.perform(post("/api/vitals")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(vs)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.spo2").value(97));
    }

    @Test
    @DisplayName("[KAN-12] Registrar temperatura")
    void recordTemperature() throws Exception {
        CreateVitalSignRequest vs = baseRequest();
        vs.setTemperature(38.5);

        mvc.perform(post("/api/vitals")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(vs)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.temperature").value(38.5));
    }

    @Test
    @DisplayName("[KAN-59] Registrar constantes vitales completas")
    void recordFullVitalSigns() throws Exception {
        CreateVitalSignRequest vs = baseRequest();
        vs.setHeartRate(80);
        vs.setSystolicBp(120);
        vs.setDiastolicBp(80);
        vs.setTemperature(36.8);
        vs.setSpo2(98);
        vs.setRespiratoryRate(16);
        vs.setPainLevel(3);

        mvc.perform(post("/api/vitals")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(vs)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.heartRate").value(80))
                .andExpect(jsonPath("$.systolicBp").value(120))
                .andExpect(jsonPath("$.temperature").value(36.8))
                .andExpect(jsonPath("$.spo2").value(98))
                .andExpect(jsonPath("$.respiratoryRate").value(16))
                .andExpect(jsonPath("$.painLevel").value(3));
    }

    @Test
    @DisplayName("[KAN-59] Listar constantes por ingreso")
    void listVitalsByAdmission() throws Exception {
        CreateVitalSignRequest vs1 = baseRequest();
        vs1.setRecordedAt(LocalDateTime.now().minusHours(2));
        vs1.setHeartRate(72);
        vs1.setTemperature(36.5);
        mvc.perform(post("/api/vitals").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(vs1)));

        CreateVitalSignRequest vs2 = baseRequest();
        vs2.setRecordedAt(LocalDateTime.now().minusHours(1));
        vs2.setHeartRate(88);
        vs2.setTemperature(38.2);
        mvc.perform(post("/api/vitals").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(vs2)));

        mvc.perform(get("/api/vitals/admission/" + admissionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("Historical vitals returns records from previous admissions only")
    void historicalVitals() throws Exception {
        // Create a vital in the first admission
        CreateVitalSignRequest vs1 = baseRequest();
        vs1.setHeartRate(60);
        mvc.perform(post("/api/vitals").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(vs1)));

        // Discharge and reopen to create a second admission
        mvc.perform(post("/api/patients/" + patientId + "/discharge")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"dischargeDate\":\"" + LocalDateTime.now().toString() + "\"}"));

        String reopenResp = mvc.perform(post("/api/patients/" + patientId + "/reopen")
                .param("triageLevel", "3"))
                .andReturn().getResponse().getContentAsString();
        Long newAdmissionId = mapper.readTree(reopenResp).get("activeAdmission").get("id").asLong();

        // Create a vital in the new admission
        CreateVitalSignRequest vs2 = new CreateVitalSignRequest();
        vs2.setAdmissionId(newAdmissionId);
        vs2.setRecordedAt(LocalDateTime.now());
        vs2.setHeartRate(90);
        mvc.perform(post("/api/vitals").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(vs2)));

        // Historical should return only the first admission's vital
        mvc.perform(get("/api/vitals/patient/" + patientId + "/historical")
                .param("excludeAdmissionId", newAdmissionId.toString())
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].heartRate").value(60))
                .andExpect(jsonPath("$.hasMore").value(false));

        // Current admission should still have only its own vital
        mvc.perform(get("/api/vitals/admission/" + newAdmissionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].heartRate").value(90));
    }
}
