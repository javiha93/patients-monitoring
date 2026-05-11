package com.pm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pm.entity.*;
import com.pm.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ClinicalInsightsApiTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper mapper;
    @Autowired private PatientRepository patientRepo;
    @Autowired private AdmissionRepository admissionRepo;
    @Autowired private AllergyRepository allergyRepo;
    @Autowired private MedicalHistoryRepository historyRepo;
    @Autowired private AdmissionPrescriptionRepository prescriptionRepo;
    @Autowired private VitalSignRepository vitalSignRepo;
    @Autowired private NursingAssessmentRepository nursingRepo;

    private Patient patient;
    private Admission admission;

    @BeforeEach
    void setup() {
        patient = patientRepo.save(Patient.builder()
                .nhc("NHC-INS-001").firstName("Test").lastName("Insights")
                .birthDate(LocalDate.of(1960, 5, 10)).sex(Patient.Sex.male).build());

        admission = admissionRepo.save(Admission.builder()
                .patient(patient).admissionDate(LocalDateTime.now().minusDays(1))
                .triageLevel(3).matCategory("Fiebre").location("B4")
                .status(Admission.Status.active).build());
    }

    private String insightsUrl() {
        return "/api/insights/patient/" + patient.getId() + "/admission/" + admission.getId();
    }

    @Test
    @DisplayName("[KAN-70] Alerta de alergia vs prescripción activa")
    void allergyConflict() throws Exception {
        allergyRepo.save(Allergy.builder()
                .patient(patient).type(Allergy.AllergyType.drug)
                .substance("Metamizol").severity(Allergy.Severity.severe)
                .reaction("Anafilaxia").build());

        prescriptionRepo.save(AdmissionPrescription.builder()
                .admission(admission).name("Metamizol").amount("575").unit("mg")
                .route("IV").frequency("c/8h").category(AdmissionPrescription.Category.fixed)
                .active(true).build());

        String body = mvc.perform(get(insightsUrl()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var insights = mapper.readTree(body);
        boolean found = false;
        for (var node : insights) {
            if ("allergy_conflict".equals(node.get("analysisType").asText())) {
                assertEquals("critical", node.get("level").asText());
                found = true;
            }
        }
        assertTrue(found, "Expected allergy_conflict insight");
    }

    @Test
    @DisplayName("[KAN-71] Alerta de nefrotoxicidad en paciente con IRC")
    void nephrotoxicity() throws Exception {
        historyRepo.save(MedicalHistory.builder()
                .patient(patient).label("Insuficiencia renal crónica (IRC)")
                .priorityOrder(1).build());

        prescriptionRepo.save(AdmissionPrescription.builder()
                .admission(admission).name("Ibuprofeno").amount("600").unit("mg")
                .route("VO").frequency("c/8h").category(AdmissionPrescription.Category.fixed)
                .active(true).build());

        String body = mvc.perform(get(insightsUrl()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var insights = mapper.readTree(body);
        boolean found = false;
        for (var node : insights) {
            if ("nephrotoxicity".equals(node.get("analysisType").asText())) {
                assertEquals("critical", node.get("level").asText());
                found = true;
            }
        }
        assertTrue(found, "Expected nephrotoxicity insight");
    }

    @Test
    @DisplayName("[KAN-68] Alerta de deterioro progresivo multiparámetro")
    void multiParameterDeterioration() throws Exception {
        LocalDateTime base = LocalDateTime.now().minusHours(6);
        for (int i = 0; i < 3; i++) {
            vitalSignRepo.save(VitalSign.builder()
                    .admission(admission).recordedAt(base.plusHours(i))
                    .heartRate(75).systolicBp(125).spo2(97).temperature(36.8).build());
        }
        for (int i = 0; i < 3; i++) {
            vitalSignRepo.save(VitalSign.builder()
                    .admission(admission).recordedAt(base.plusHours(3 + i))
                    .heartRate(110).systolicBp(90).spo2(91).temperature(39.0).build());
        }

        String body = mvc.perform(get(insightsUrl()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var insights = mapper.readTree(body);
        boolean found = false;
        for (var node : insights) {
            if ("multi_parameter_deterioration".equals(node.get("analysisType").asText())) {
                assertEquals("critical", node.get("level").asText());
                found = true;
            }
        }
        assertTrue(found, "Expected multi_parameter_deterioration insight");
    }

    @Test
    @DisplayName("[KAN-76] Detección de dolor no controlado")
    void uncontrolledPain() throws Exception {
        LocalDateTime base = LocalDateTime.now().minusHours(4);
        int[] painScores = {6, 7, 8, 9};
        for (int i = 0; i < painScores.length; i++) {
            vitalSignRepo.save(VitalSign.builder()
                    .admission(admission).recordedAt(base.plusHours(i))
                    .painLevel(painScores[i]).heartRate(80).build());
        }

        String body = mvc.perform(get(insightsUrl()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var insights = mapper.readTree(body);
        boolean found = false;
        for (var node : insights) {
            if ("uncontrolled_pain".equals(node.get("analysisType").asText())) {
                found = true;
            }
        }
        assertTrue(found, "Expected uncontrolled_pain insight");
    }

    @Test
    @DisplayName("[KAN-77] Hiperglucemia inducida por corticoides sin insulina")
    void corticosteroidHyperglycemia() throws Exception {
        prescriptionRepo.save(AdmissionPrescription.builder()
                .admission(admission).name("Dexametasona").amount("4").unit("mg")
                .route("IV").frequency("c/12h").category(AdmissionPrescription.Category.fixed)
                .active(true).build());

        String body = mvc.perform(get(insightsUrl()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var insights = mapper.readTree(body);
        boolean found = false;
        for (var node : insights) {
            if ("corticosteroid_hyperglycemia".equals(node.get("analysisType").asText())) {
                assertEquals("info", node.get("level").asText());
                found = true;
            }
        }
        assertTrue(found, "Expected corticosteroid_hyperglycemia insight");
    }

    @Test
    @DisplayName("[KAN-75] Correlación taquicardia-fiebre")
    void tachycardiaFever() throws Exception {
        vitalSignRepo.save(VitalSign.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1))
                .heartRate(120).temperature(39.5).build());

        String body = mvc.perform(get(insightsUrl()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var insights = mapper.readTree(body);
        boolean found = false;
        for (var node : insights) {
            if ("tachycardia_fever".equals(node.get("analysisType").asText())) {
                found = true;
            }
        }
        assertTrue(found, "Expected tachycardia_fever insight");
    }

    @Test
    @DisplayName("[KAN-61] Sin insights cuando no hay datos clínicos")
    void noInsightsWhenClean() throws Exception {
        mvc.perform(get(insightsUrl()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ── Nursing assessment alerts ──

    @Test
    @DisplayName("Deterioro cognitivo nuevo respecto a ingresos previos")
    void newCognitiveDecline() throws Exception {
        // Prior admission with oriented assessments
        Admission prior = admissionRepo.save(Admission.builder()
                .patient(patient).admissionDate(LocalDateTime.now().minusMonths(3))
                .dischargeDate(LocalDateTime.now().minusMonths(2))
                .triageLevel(3).status(Admission.Status.discharged).build());
        nursingRepo.save(NursingAssessment.builder()
                .admission(prior).recordedAt(LocalDateTime.now().minusMonths(3))
                .assessmentType("entrada").physicalCognitive("orientado").glasgowScore(15)
                .consciousness("alerta").build());

        // Current admission: patient arrives disoriented
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(2))
                .assessmentType("entrada").physicalCognitive("desorientado").glasgowScore(14)
                .consciousness("alerta").build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var insights = mapper.readTree(body);
        boolean found = false;
        for (var node : insights) {
            if ("new_cognitive_decline".equals(node.get("analysisType").asText())) {
                assertEquals("warning", node.get("level").asText());
                found = true;
            }
        }
        assertTrue(found, "Expected new_cognitive_decline insight");
    }

    @Test
    @DisplayName("Deterioro cognitivo progresivo durante el ingreso")
    void progressiveCognitiveDecline() throws Exception {
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(6))
                .assessmentType("entrada").physicalCognitive("orientado").glasgowScore(15)
                .consciousness("alerta").build());
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1))
                .assessmentType("sucesiva").physicalCognitive("confuso").glasgowScore(13)
                .consciousness("somnoliento").build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var insights = mapper.readTree(body);
        boolean found = false;
        for (var node : insights) {
            if ("progressive_cognitive_decline".equals(node.get("analysisType").asText())) {
                assertEquals("warning", node.get("level").asText());
                found = true;
            }
        }
        assertTrue(found, "Expected progressive_cognitive_decline insight");
    }

    @Test
    @DisplayName("Caída de Glasgow ≥2 puntos durante el ingreso")
    void glasgowDrop() throws Exception {
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(6))
                .assessmentType("entrada").glasgowScore(15).consciousness("alerta").build());
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1))
                .assessmentType("sucesiva").glasgowScore(12).consciousness("somnoliento").build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var insights = mapper.readTree(body);
        boolean found = false;
        for (var node : insights) {
            if ("glasgow_drop".equals(node.get("analysisType").asText())) {
                found = true;
            }
        }
        assertTrue(found, "Expected glasgow_drop insight");
    }

    @Test
    @DisplayName("Paciente agitado sin medidas de contención")
    void agitationNoRestraint() throws Exception {
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1))
                .assessmentType("entrada").mood("agitado").consciousness("alerta").glasgowScore(15)
                .bedRails(false).restraintAbdominal(false).restraintLegs(false).restraintArms(false)
                .build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var insights = mapper.readTree(body);
        boolean found = false;
        for (var node : insights) {
            if ("agitation_no_restraint".equals(node.get("analysisType").asText())) {
                assertEquals("warning", node.get("level").asText());
                found = true;
            }
        }
        assertTrue(found, "Expected agitation_no_restraint insight");
    }

    @Test
    @DisplayName("Riesgo de caída con alteración aguda de movilidad")
    void fallRiskMobility() throws Exception {
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1))
                .assessmentType("entrada").consciousness("alerta").glasgowScore(15)
                .fallRisk(true).mobility("alteracion_aguda").bedRails(false)
                .build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var insights = mapper.readTree(body);
        boolean found = false;
        for (var node : insights) {
            if ("fall_risk_mobility".equals(node.get("analysisType").asText())) {
                assertEquals("warning", node.get("level").asText());
                found = true;
            }
        }
        assertTrue(found, "Expected fall_risk_mobility insight");
    }

    @Test
    @DisplayName("Deterioro del patrón respiratorio en valoraciones")
    void respiratoryPatternDeterioration() throws Exception {
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(6))
                .assessmentType("entrada").breathingPattern("normal").consciousness("alerta").glasgowScore(15)
                .build());
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1))
                .assessmentType("sucesiva").breathingPattern("taquipnea").dyspneaLevel("reposo")
                .consciousness("alerta").glasgowScore(15)
                .build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var insights = mapper.readTree(body);
        boolean found = false;
        for (var node : insights) {
            if ("respiratory_pattern_deterioration".equals(node.get("analysisType").asText())) {
                assertEquals("warning", node.get("level").asText());
                found = true;
            }
        }
        assertTrue(found, "Expected respiratory_pattern_deterioration insight");
    }
}
