package com.pm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pm.dto.CreatePatientRequest;
import com.pm.dto.LabResultDTO;
import com.pm.dto.LabTestDTO;
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
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class LabTestApiTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper mapper;

    private Long admissionId;

    @BeforeEach
    void setup() throws Exception {
        CreatePatientRequest req = new CreatePatientRequest();
        req.setNhc("NHC-LAB");
        req.setFirstName("Lab");
        req.setLastName("Test");
        req.setBirthDate(LocalDate.of(1985, 5, 10));
        req.setSex("female");
        req.setTriageLevel(3);
        req.setMatCategory("Fiebre");

        String res = mvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andReturn().getResponse().getContentAsString();

        admissionId = mapper.readTree(res).get("activeAdmission").get("id").asLong();
    }

    private Long createLabTest(String category, String label) throws Exception {
        LabTestDTO dto = LabTestDTO.builder()
                .admissionId(admissionId)
                .category(category)
                .label(label)
                .requestedBy("Dr. García")
                .build();

        String res = mvc.perform(post("/api/lab-tests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return mapper.readTree(res).get("id").asLong();
    }

    @Test
    @DisplayName("Crear prueba de laboratorio con estado pending_validation")
    void createLabTest() throws Exception {
        LabTestDTO dto = LabTestDTO.builder()
                .admissionId(admissionId)
                .category("analitica")
                .label("Hemograma + Bioquímica")
                .requestedBy("Dr. García")
                .build();

        mvc.perform(post("/api/lab-tests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("pending_validation"))
                .andExpect(jsonPath("$.label").value("Hemograma + Bioquímica"))
                .andExpect(jsonPath("$.category").value("analitica"));
    }

    @Test
    @DisplayName("Listar pruebas por admisión")
    void listByAdmission() throws Exception {
        createLabTest("analitica", "Hemograma");
        createLabTest("cultivo", "Hemocultivo x2");

        mvc.perform(get("/api/lab-tests/admission/" + admissionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("Validar prueba cambia estado a pending_receipt")
    void validateTest() throws Exception {
        Long id = createLabTest("analitica", "Hemograma");

        mvc.perform(patch("/api/lab-tests/" + id + "/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"externalId\":\"LAB-001\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("pending_receipt"))
                .andExpect(jsonPath("$.externalId").value("LAB-001"));
    }

    @Test
    @DisplayName("Validar con ID duplicado devuelve 409 Conflict")
    void validateDuplicateId() throws Exception {
        Long id1 = createLabTest("analitica", "Hemograma");
        Long id2 = createLabTest("analitica", "Bioquímica");

        // Validate first
        mvc.perform(patch("/api/lab-tests/" + id1 + "/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"externalId\":\"LAB-DUP\"}"))
                .andExpect(status().isOk());

        // Try same ID on second → conflict
        mvc.perform(patch("/api/lab-tests/" + id2 + "/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"externalId\":\"LAB-DUP\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", containsString("ya está asignado")));
    }

    @Test
    @DisplayName("Validar sin externalId devuelve 400")
    void validateEmptyId() throws Exception {
        Long id = createLabTest("analitica", "Hemograma");

        mvc.perform(patch("/api/lab-tests/" + id + "/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"externalId\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Añadir resultados cambia estado a partial_results")
    void addResults() throws Exception {
        Long id = createLabTest("analitica", "Hemograma");

        // Validate first
        mvc.perform(patch("/api/lab-tests/" + id + "/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"externalId\":\"LAB-RES\"}"));

        List<LabResultDTO> results = List.of(
                LabResultDTO.builder().category("Hemograma").name("Hemoglobina").value("14.2").unit("g/dL").refRange("12.0-16.0").flag("normal").build(),
                LabResultDTO.builder().category("Hemograma").name("Leucocitos").value("12.5").unit("x10³/µL").refRange("4.0-10.0").flag("high").build()
        );

        mvc.perform(post("/api/lab-tests/" + id + "/results")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(results)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("partial_results"))
                .andExpect(jsonPath("$.results", hasSize(2)))
                .andExpect(jsonPath("$.results[0].name").value("Hemoglobina"));
    }

    @Test
    @DisplayName("Obtener prueba por ID incluye resultados")
    void getById() throws Exception {
        Long id = createLabTest("analitica", "Hemograma");

        mvc.perform(patch("/api/lab-tests/" + id + "/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"externalId\":\"LAB-GET\"}"));

        List<LabResultDTO> results = List.of(
                LabResultDTO.builder().category("Hemograma").name("Plaquetas").value("250").unit("x10³/µL").refRange("150-400").flag("normal").build()
        );
        mvc.perform(post("/api/lab-tests/" + id + "/results")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(results)));

        mvc.perform(get("/api/lab-tests/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results", hasSize(1)))
                .andExpect(jsonPath("$.results[0].name").value("Plaquetas"));
    }

    @Test
    @DisplayName("Eliminar prueba de laboratorio")
    void deleteTest() throws Exception {
        Long id = createLabTest("cultivo", "Urocultivo");

        mvc.perform(delete("/api/lab-tests/" + id))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/lab-tests/admission/" + admissionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
