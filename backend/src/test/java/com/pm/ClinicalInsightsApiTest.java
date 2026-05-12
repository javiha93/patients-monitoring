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
    @Autowired private MedicationRepository medicationRepo;
    @Autowired private DeviceRepository deviceRepo;
    @Autowired private DrainOutputRepository drainOutputRepo;
    @Autowired private LabTestRepository labTestRepo;
    @Autowired private LabResultRepository labResultRepo;
    @Autowired private ImmunosuppressionRepository immunoRepo;

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
    @DisplayName("Antecedente de agitación en ingresos previos")
    void priorAgitationHistory() throws Exception {
        Admission prior = admissionRepo.save(Admission.builder()
                .patient(patient).admissionDate(LocalDateTime.now().minusMonths(2))
                .dischargeDate(LocalDateTime.now().minusMonths(1))
                .triageLevel(3).status(Admission.Status.discharged).build());
        nursingRepo.save(NursingAssessment.builder()
                .admission(prior).recordedAt(LocalDateTime.now().minusMonths(2))
                .assessmentType("sucesiva").mood("agitado").consciousness("alerta").glasgowScore(15)
                .build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var insights = mapper.readTree(body);
        boolean found = false;
        for (var node : insights) {
            if ("prior_agitation_history".equals(node.get("analysisType").asText())) {
                assertEquals("info", node.get("level").asText());
                found = true;
            }
        }
        assertTrue(found, "Expected prior_agitation_history insight");
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

    // ── Cross-domain alert tests ──

    @Test
    @DisplayName("Somnolencia + medicación sedante habitual reciente")
    void sedativeSomnolence() throws Exception {
        medicationRepo.save(Medication.builder()
                .patient(patient).name("Lorazepam 1mg").dose("1mg").frequency("noche")
                .prescribedSince(LocalDate.now().minusWeeks(2)).build());
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1))
                .assessmentType("entrada").consciousness("somnoliento").glasgowScore(13).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "sedative_somnolence", "warning"));
    }

    @Test
    @DisplayName("Depresión respiratoria por opioides: FR ≤10 + opioide activo")
    void opioidRespiratoryDepression() throws Exception {
        prescriptionRepo.save(AdmissionPrescription.builder()
                .admission(admission).name("Morfina 5mg").amount("5").unit("mg").route("iv")
                .frequency("c/6h").category(AdmissionPrescription.Category.fixed).active(true).build());
        vitalSignRepo.save(VitalSign.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusMinutes(30))
                .respiratoryRate(8).spo2(91).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "opioid_respiratory_depression", "critical"));
    }

    @Test
    @DisplayName("Anticoagulante habitual + riesgo de caída")
    void anticoagulantFallRisk() throws Exception {
        medicationRepo.save(Medication.builder()
                .patient(patient).name("Sintrom 4mg").dose("4mg").frequency("diario").build());
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1))
                .assessmentType("entrada").consciousness("alerta").glasgowScore(15)
                .fallRisk(true).mobility("alteracion_aguda").build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "anticoagulant_fall_risk", "warning"));
    }

    @Test
    @DisplayName("Analgesia habitual sin equivalencia en el ingreso")
    void habitualAnalgesicNotPrescribed() throws Exception {
        medicationRepo.save(Medication.builder()
                .patient(patient).name("Fentanilo parche 25mcg").dose("25mcg/h").frequency("c/72h").build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "habitual_analgesic_not_prescribed", "warning"));
    }

    @Test
    @DisplayName("Analgesia habitual cubierta no genera alerta")
    void habitualAnalgesicCovered() throws Exception {
        medicationRepo.save(Medication.builder()
                .patient(patient).name("Fentanilo parche 25mcg").dose("25mcg/h").frequency("c/72h").build());
        prescriptionRepo.save(AdmissionPrescription.builder()
                .admission(admission).name("Fentanilo IV 50mcg").amount("50").unit("mcg").route("iv")
                .frequency("c/8h").category(AdmissionPrescription.Category.fixed).active(true).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertFalse(hasInsight(body, "habitual_analgesic_not_prescribed", null));
    }

    @Test
    @DisplayName("Disfagia con prescripciones orales activas")
    void dysphagiaOralMeds() throws Exception {
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1))
                .assessmentType("entrada").consciousness("alerta").glasgowScore(15)
                .nutrition("disfagia").build());
        prescriptionRepo.save(AdmissionPrescription.builder()
                .admission(admission).name("Paracetamol 1g").amount("1").unit("g").route("oral")
                .frequency("c/8h").category(AdmissionPrescription.Category.fixed).active(true).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "dysphagia_oral_meds", "warning"));
    }

    @Test
    @DisplayName("Paciente agitado sin sedante pautado")
    void agitationNoSedative() throws Exception {
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1))
                .assessmentType("entrada").consciousness("alerta").glasgowScore(15)
                .mood("agitado").bedRails(false).restraintAbdominal(false)
                .restraintLegs(false).restraintArms(false).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "agitation_no_sedative", "info"));
    }

    @Test
    @DisplayName("Riesgo caída con barandillas activas NO genera alerta")
    void fallRiskWithBedRailsNoAlert() throws Exception {
        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1))
                .assessmentType("entrada").consciousness("alerta").glasgowScore(15)
                .fallRisk(true).mobility("alteracion_aguda").bedRails(true).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertFalse(hasInsight(body, "fall_risk_mobility", null));
    }

    // ── Device alert tests ──

    @Test
    @DisplayName("VVP prolongada >96h genera alerta warning")
    void vvpProlonged() throws Exception {
        deviceRepo.save(Device.builder()
                .admission(admission).category("vascular").type("via_periferica")
                .insertedAt(LocalDateTime.now().minusHours(120)).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "vvp_prolonged", "warning"));
    }

    @Test
    @DisplayName("VVP de emergencia >48h genera alerta critical")
    void vvpEmergencyChange() throws Exception {
        deviceRepo.save(Device.builder()
                .admission(admission).category("vascular").type("via_periferica")
                .insertedAt(LocalDateTime.now().minusHours(72))
                .notes("Insertada en urgencia").build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "vvp_emergency_change", "critical"));
    }

    @Test
    @DisplayName("SNG PVC >10 días genera alerta warning")
    void sngPvcChangeDue() throws Exception {
        deviceRepo.save(Device.builder()
                .admission(admission).category("gastrointestinal").type("sng")
                .material("pvc").insertedAt(LocalDateTime.now().minusDays(12)).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "sng_pvc_change_due", "warning"));
    }

    @Test
    @DisplayName("SNG silicona >42 días genera alerta warning")
    void sngSiliconeChangeDue() throws Exception {
        deviceRepo.save(Device.builder()
                .admission(admission).category("gastrointestinal").type("sng")
                .material("silicona").insertedAt(LocalDateTime.now().minusDays(50)).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "sng_silicone_change_due", "warning"));
    }

    @Test
    @DisplayName("SV látex >21 días genera alerta warning")
    void svLatexChangeDue() throws Exception {
        deviceRepo.save(Device.builder()
                .admission(admission).category("elimination").type("sonda_vesical")
                .material("latex").insertedAt(LocalDateTime.now().minusDays(25)).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "sv_latex_change_due", "warning"));
    }

    @Test
    @DisplayName("SV silicona >90 días genera alerta warning")
    void svSiliconeChangeDue() throws Exception {
        deviceRepo.save(Device.builder()
                .admission(admission).category("elimination").type("sonda_vesical")
                .material("silicona").insertedAt(LocalDateTime.now().minusDays(95)).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "sv_silicone_change_due", "warning"));
    }

    @Test
    @DisplayName("SV activa >5 días genera alerta ITU risk")
    void svItuRisk() throws Exception {
        deviceRepo.save(Device.builder()
                .admission(admission).category("elimination").type("sonda_vesical")
                .material("latex").insertedAt(LocalDateTime.now().minusDays(7)).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "sv_itu_risk", "warning"));
    }

    @Test
    @DisplayName("VVC >7 días genera alerta de revisión de apósito")
    void vvcReviewDressing() throws Exception {
        deviceRepo.save(Device.builder()
                .admission(admission).category("vascular").type("via_central")
                .insertedAt(LocalDateTime.now().minusDays(8)).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "vvc_review_dressing", "info"));
    }

    @Test
    @DisplayName("VVC >96h genera alerta de revisión de sistemas")
    void vvcReviewLines() throws Exception {
        deviceRepo.save(Device.builder()
                .admission(admission).category("vascular").type("via_central")
                .insertedAt(LocalDateTime.now().minusDays(5)).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "vvc_review_lines", "info"));
    }

    @Test
    @DisplayName("SNG + consciencia alterada genera alerta de aspiración")
    void sngAspirationRisk() throws Exception {
        deviceRepo.save(Device.builder()
                .admission(admission).category("gastrointestinal").type("sng")
                .material("pvc").insertedAt(LocalDateTime.now().minusDays(1)).build());

        nursingRepo.save(NursingAssessment.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(2))
                .consciousness("somnoliento").build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "sng_aspiration_risk", "warning"));
    }

    @Test
    @DisplayName("Dispositivo retirado no genera alertas")
    void retiredDeviceNoAlerts() throws Exception {
        deviceRepo.save(Device.builder()
                .admission(admission).category("vascular").type("via_periferica")
                .insertedAt(LocalDateTime.now().minusDays(10))
                .removedAt(LocalDateTime.now().minusDays(1)).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertFalse(hasInsight(body, "vvp_prolonged", null));
    }

    // ── Drain alert tests ──

    @Test
    @DisplayName("Drenaje activo >7 días genera alerta info")
    void drainProlonged() throws Exception {
        deviceRepo.save(Device.builder()
                .admission(admission).category("elimination").type("redon")
                .drainNumber(1).region("abdomen").subRegion("hipocondrio_dcho").laterality("derecha")
                .insertedAt(LocalDateTime.now().minusDays(10)).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "drain_prolonged", "info"));
    }

    @Test
    @DisplayName("Drenaje hemático <36h NO genera alerta (normal post-quirúrgico)")
    void drainHemorrhagicEarly_noAlert() throws Exception {
        Device drain = deviceRepo.save(Device.builder()
                .admission(admission).category("elimination").type("jackson_pratt")
                .drainNumber(1).region("pelvis").laterality("medial")
                .insertedAt(LocalDateTime.now().minusHours(12)).build());

        VitalSign vs = vitalSignRepo.save(VitalSign.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1)).build());

        drainOutputRepo.save(DrainOutput.builder()
                .vitalSign(vs).device(drain).drainNumber(1)
                .outputMl(50).fluidType("hematico").vacuumActive(true).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertFalse(hasInsight(body, "drain_hemorrhagic", null));
    }

    @Test
    @DisplayName("Drenaje hemático >36h genera alerta critical")
    void drainHemorrhagicLate() throws Exception {
        Device drain = deviceRepo.save(Device.builder()
                .admission(admission).category("elimination").type("jackson_pratt")
                .drainNumber(1).region("pelvis").laterality("medial")
                .insertedAt(LocalDateTime.now().minusDays(3)).build());

        VitalSign vs = vitalSignRepo.save(VitalSign.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1)).build());

        drainOutputRepo.save(DrainOutput.builder()
                .vitalSign(vs).device(drain).drainNumber(1)
                .outputMl(50).fluidType("hematico").vacuumActive(true).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "drain_hemorrhagic", "critical"));
    }

    @Test
    @DisplayName("Drenaje purulento genera alerta critical inmediata")
    void drainPurulent() throws Exception {
        Device drain = deviceRepo.save(Device.builder()
                .admission(admission).category("elimination").type("redon")
                .drainNumber(1).region("abdomen").laterality("derecha")
                .insertedAt(LocalDateTime.now().minusDays(2)).build());

        VitalSign vs = vitalSignRepo.save(VitalSign.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1)).build());

        drainOutputRepo.save(DrainOutput.builder()
                .vitalSign(vs).device(drain).drainNumber(1)
                .outputMl(40).fluidType("purulento").vacuumActive(true).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "drain_purulent", "critical"));
    }

    @Test
    @DisplayName("Drenaje sin vacío genera alerta warning")
    void drainVacuumLost() throws Exception {
        Device drain = deviceRepo.save(Device.builder()
                .admission(admission).category("elimination").type("redon")
                .drainNumber(1).region("torax").laterality("izquierda")
                .insertedAt(LocalDateTime.now().minusDays(2)).build());

        VitalSign vs = vitalSignRepo.save(VitalSign.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1)).build());

        drainOutputRepo.save(DrainOutput.builder()
                .vitalSign(vs).device(drain).drainNumber(1)
                .outputMl(30).fluidType("seroso").vacuumActive(false).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "drain_vacuum_lost", "warning"));
    }

    @Test
    @DisplayName("Drenaje con auto-numeración secuencial")
    void drainAutoNumber() throws Exception {
        // Create via API to test auto-numbering
        com.pm.dto.DeviceDTO dto1 = com.pm.dto.DeviceDTO.builder()
                .admissionId(admission.getId()).category("elimination").type("redon")
                .region("abdomen").laterality("derecha")
                .insertedAt(LocalDateTime.now()).build();

        mvc.perform(post("/api/devices")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(dto1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.drainNumber").value(1));

        com.pm.dto.DeviceDTO dto2 = com.pm.dto.DeviceDTO.builder()
                .admissionId(admission.getId()).category("elimination").type("jackson_pratt")
                .region("pelvis").laterality("medial")
                .insertedAt(LocalDateTime.now()).build();

        mvc.perform(post("/api/devices")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(dto2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.drainNumber").value(2));
    }

    // Helper to check for an insight by analysisType and optionally level
    // ── Lab-cross alert helpers ──

    private LabTest createLabTestWithResults(String[][] results) {
        LabTest lt = labTestRepo.save(LabTest.builder()
                .admission(admission).category("analitica").label("Test analítica")
                .status("results").requestedAt(LocalDateTime.now().minusHours(2))
                .externalId("LAB-TEST-" + System.nanoTime()).build());
        for (String[] r : results) {
            labResultRepo.save(LabResult.builder()
                    .labTest(lt).category(r[0]).name(r[1]).value(r[2]).unit(r[3])
                    .refRange(r[4]).flag(r[5]).build());
        }
        return lt;
    }

    // ── Lab-cross alert tests ──

    @Test
    @DisplayName("L1: Creatinina elevada + nefrotóxico genera alerta critical")
    void labCreatinineNephrotoxic() throws Exception {
        createLabTestWithResults(new String[][]{
            {"Bioquímica", "Creatinina", "2.1", "mg/dL", "0.6-1.2", "high"}
        });
        prescriptionRepo.save(AdmissionPrescription.builder()
                .admission(admission).name("Ibuprofeno").amount("600").unit("mg")
                .route("VO").frequency("c/8h").category(AdmissionPrescription.Category.fixed).active(true).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "lab_creatinine_nephrotoxic", "critical"));
    }

    @Test
    @DisplayName("L2: Hiperpotasemia + IECA genera alerta warning")
    void labHyperkaliemiaRAAS() throws Exception {
        createLabTestWithResults(new String[][]{
            {"Bioquímica", "Potasio", "5.4", "mEq/L", "3.5-5.0", "high"}
        });
        medicationRepo.save(Medication.builder()
                .patient(patient).name("Enalapril 10mg").dose("10mg").frequency("c/24h")
                .prescribedSince(LocalDate.now().minusMonths(6)).suspendedDuringAdmission(false).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "lab_hyperkaliemia_raas", "warning"));
    }

    @Test
    @DisplayName("L3: Creatinina en ascenso genera alerta warning")
    void labCreatinineRising() throws Exception {
        // Old lab (>36h ago)
        LabTest old = labTestRepo.save(LabTest.builder()
                .admission(admission).category("analitica").label("Analítica previa")
                .status("results").requestedAt(LocalDateTime.now().minusHours(48))
                .externalId("LAB-OLD-" + System.nanoTime()).build());
        labResultRepo.save(LabResult.builder()
                .labTest(old).category("Bioquímica").name("Creatinina").value("0.9").unit("mg/dL")
                .refRange("0.6-1.2").flag("normal").build());
        // Recent lab
        createLabTestWithResults(new String[][]{
            {"Bioquímica", "Creatinina", "1.5", "mg/dL", "0.6-1.2", "high"}
        });

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "lab_creatinine_rising", "warning"));
    }

    @Test
    @DisplayName("L4: PCR + leucocitosis + fiebre genera alerta critical")
    void labSepsisTriad() throws Exception {
        createLabTestWithResults(new String[][]{
            {"Bioquímica", "PCR", "15.2", "mg/L", "0-5", "high"},
            {"Hemograma", "Leucocitos", "18.5", "x10³/µL", "4.0-10.0", "high"}
        });
        vitalSignRepo.save(VitalSign.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(4))
                .temperature(38.5).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "lab_sepsis_triad", "critical"));
    }

    @Test
    @DisplayName("L5: Procalcitonina >2 genera alerta critical")
    void labProca() throws Exception {
        createLabTestWithResults(new String[][]{
            {"Bioquímica", "Procalcitonina", "3.5", "ng/mL", "0-0.5", "high"}
        });

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "lab_procalcitonin", "critical"));
    }

    @Test
    @DisplayName("L6: Leucopenia + fiebre + inmunodeprimido genera alerta critical")
    void labNeutropeniaFever() throws Exception {
        createLabTestWithResults(new String[][]{
            {"Hemograma", "Leucocitos", "0.8", "x10³/µL", "4.0-10.0", "low"}
        });
        vitalSignRepo.save(VitalSign.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(6))
                .temperature(38.3).build());
        immunoRepo.save(ImmunosuppressionHistory.builder()
                .patient(patient).description("Metotrexato")
                .eventDate(LocalDate.now().minusMonths(3)).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "lab_neutropenia_fever", "critical"));
    }

    @Test
    @DisplayName("L7: INR >3 + acenocumarol genera alerta warning")
    void labINRAnticoagulant() throws Exception {
        createLabTestWithResults(new String[][]{
            {"Coagulación", "INR", "4.2", "", "0.8-1.2", "high"}
        });
        medicationRepo.save(Medication.builder()
                .patient(patient).name("Sintrom 4mg").dose("4mg").frequency("según pauta")
                .prescribedSince(LocalDate.now().minusYears(1)).suspendedDuringAdmission(false).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "lab_inr_anticoagulant", "warning"));
    }

    @Test
    @DisplayName("L8: Plaquetas <50 genera alerta critical")
    void labThrombocytopenia() throws Exception {
        createLabTestWithResults(new String[][]{
            {"Hemograma", "Plaquetas", "35", "x10³/µL", "150-400", "low"}
        });

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "lab_thrombocytopenia", "critical"));
    }

    @Test
    @DisplayName("L9: Anemia + taquicardia genera alerta warning")
    void labAnemiaTachycardia() throws Exception {
        createLabTestWithResults(new String[][]{
            {"Hemograma", "Hemoglobina", "8.5", "g/dL", "12.0-16.0", "low"}
        });
        vitalSignRepo.save(VitalSign.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(3))
                .heartRate(115).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "lab_anemia_tachycardia", "warning"));
    }

    @Test
    @DisplayName("L10: Transaminasas elevadas + paracetamol genera alerta warning")
    void labTransaminasesHepatotoxic() throws Exception {
        createLabTestWithResults(new String[][]{
            {"Bioquímica", "GPT", "120", "U/L", "5-40", "high"},
            {"Bioquímica", "GOT", "95", "U/L", "5-40", "high"}
        });
        prescriptionRepo.save(AdmissionPrescription.builder()
                .admission(admission).name("Paracetamol").amount("1000").unit("mg")
                .route("VO").frequency("c/8h").category(AdmissionPrescription.Category.fixed).active(true).build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(hasInsight(body, "lab_transaminases_hepatotoxic", "warning"));
    }

    @Test
    @DisplayName("Analítica >36h no genera alertas de laboratorio")
    void labOldResultsNoAlert() throws Exception {
        LabTest old = labTestRepo.save(LabTest.builder()
                .admission(admission).category("analitica").label("Analítica antigua")
                .status("results").requestedAt(LocalDateTime.now().minusHours(48))
                .externalId("LAB-OLD2-" + System.nanoTime()).build());
        labResultRepo.save(LabResult.builder()
                .labTest(old).category("Hemograma").name("Plaquetas").value("30").unit("x10³/µL")
                .refRange("150-400").flag("low").build());

        String body = mvc.perform(get(insightsUrl())).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertFalse(hasInsight(body, "lab_thrombocytopenia", null));
    }

    private boolean hasInsight(String json, String analysisType, String expectedLevel) throws Exception {
        var insights = mapper.readTree(json);
        for (var node : insights) {
            if (analysisType.equals(node.get("analysisType").asText())) {
                if (expectedLevel != null) {
                    assertEquals(expectedLevel, node.get("level").asText());
                }
                return true;
            }
        }
        return false;
    }
}
