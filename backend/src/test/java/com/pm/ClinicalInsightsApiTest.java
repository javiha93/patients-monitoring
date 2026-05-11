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

        mvc.perform(get("/api/insights/patient/" + patient.getId() + "/admission/" + admission.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.analysisType=='allergy_conflict')]", hasSize(1)))
                .andExpect(jsonPath("$[?(@.analysisType=='allergy_conflict')][0].level").value("critical"));
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

        mvc.perform(get("/api/insights/patient/" + patient.getId() + "/admission/" + admission.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.analysisType=='nephrotoxicity')]", hasSize(1)))
                .andExpect(jsonPath("$[?(@.analysisType=='nephrotoxicity')][0].level").value("critical"));
    }

    @Test
    @DisplayName("[KAN-68] Alerta de deterioro progresivo multiparámetro")
    void multiParameterDeterioration() throws Exception {
        LocalDateTime base = LocalDateTime.now().minusHours(6);
        // Early vitals: stable
        for (int i = 0; i < 3; i++) {
            vitalSignRepo.save(VitalSign.builder()
                    .admission(admission).recordedAt(base.plusHours(i))
                    .heartRate(75).systolicBp(125).spo2(97).temperature(36.8).build());
        }
        // Recent vitals: deteriorating
        for (int i = 0; i < 3; i++) {
            vitalSignRepo.save(VitalSign.builder()
                    .admission(admission).recordedAt(base.plusHours(3 + i))
                    .heartRate(110).systolicBp(90).spo2(91).temperature(39.0).build());
        }

        mvc.perform(get("/api/insights/patient/" + patient.getId() + "/admission/" + admission.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.analysisType=='multi_parameter_deterioration')]", hasSize(1)))
                .andExpect(jsonPath("$[?(@.analysisType=='multi_parameter_deterioration')][0].level").value("critical"));
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

        mvc.perform(get("/api/insights/patient/" + patient.getId() + "/admission/" + admission.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.analysisType=='uncontrolled_pain')]", hasSize(1)));
    }

    @Test
    @DisplayName("[KAN-77] Hiperglucemia inducida por corticoides sin insulina")
    void corticosteroidHyperglycemia() throws Exception {
        prescriptionRepo.save(AdmissionPrescription.builder()
                .admission(admission).name("Dexametasona").amount("4").unit("mg")
                .route("IV").frequency("c/12h").category(AdmissionPrescription.Category.fixed)
                .active(true).build());

        mvc.perform(get("/api/insights/patient/" + patient.getId() + "/admission/" + admission.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.analysisType=='corticosteroid_hyperglycemia')]", hasSize(1)))
                .andExpect(jsonPath("$[?(@.analysisType=='corticosteroid_hyperglycemia')][0].level").value("info"));
    }

    @Test
    @DisplayName("[KAN-75] Correlación taquicardia-fiebre")
    void tachycardiaFever() throws Exception {
        vitalSignRepo.save(VitalSign.builder()
                .admission(admission).recordedAt(LocalDateTime.now().minusHours(1))
                .heartRate(120).temperature(39.5).build());

        mvc.perform(get("/api/insights/patient/" + patient.getId() + "/admission/" + admission.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.analysisType=='tachycardia_fever')]", hasSize(1)));
    }

    @Test
    @DisplayName("[KAN-61] Sin insights cuando no hay datos clínicos")
    void noInsightsWhenClean() throws Exception {
        mvc.perform(get("/api/insights/patient/" + patient.getId() + "/admission/" + admission.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
