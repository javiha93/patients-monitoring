package com.pm.service;

import com.pm.dto.ClinicalInsightDTO;
import com.pm.entity.*;
import com.pm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClinicalInsightsService {

    private final VitalSignRepository vitalSignRepo;
    private final AdmissionRepository admissionRepo;
    private final AllergyRepository allergyRepo;
    private final MedicationRepository medicationRepo;
    private final MedicalHistoryRepository historyRepo;
    private final AdmissionPrescriptionRepository prescriptionRepo;
    private final MedicationAdministrationRepository adminRepo;
    private final NursingAssessmentRepository nursingRepo;
    private final DeviceRepository deviceRepo;
    private final DrainOutputRepository drainOutputRepo;

    public List<ClinicalInsightDTO> analyze(Long patientId, Long admissionId) {
        List<ClinicalInsightDTO> insights = new ArrayList<>();

        List<VitalSign> vitals = vitalSignRepo.findByAdmissionIdOrderByRecordedAtAsc(admissionId);
        List<Allergy> allergies = allergyRepo.findByPatientId(patientId);
        List<Medication> habitual = medicationRepo.findByPatientIdOrderByNameAsc(patientId);
        List<MedicalHistory> history = historyRepo.findByPatientIdOrderByPriorityOrderAscRegisteredDateDesc(patientId);
        List<AdmissionPrescription> prescriptions = prescriptionRepo.findByAdmissionIdAndActiveTrue(admissionId);
        List<Admission> allAdmissions = admissionRepo.findByPatientIdOrderByAdmissionDateDesc(patientId);

        // Collect prior vitals for baseline calculation
        List<VitalSign> priorVitals = new ArrayList<>();
        for (Admission a : allAdmissions) {
            if (!a.getId().equals(admissionId) && a.getStatus() == Admission.Status.discharged) {
                priorVitals.addAll(vitalSignRepo.findByAdmissionIdOrderByRecordedAtAsc(a.getId()));
            }
        }

        Set<String> historyLabels = history.stream().map(h -> h.getLabel().toLowerCase()).collect(Collectors.toSet());

        // Nursing assessments
        List<NursingAssessment> currentAssessments = nursingRepo.findByAdmissionIdOrderByRecordedAtDesc(admissionId);
        List<NursingAssessment> priorAssessments = nursingRepo.findAllHistoricalByPatient(patientId, admissionId);

        // Run all 20 analyses
        checkAllergyConflicts(insights, allergies, prescriptions);
        checkNephrotoxicity(insights, historyLabels, prescriptions);
        checkBaselineDeviation(insights, vitals, priorVitals, habitual);
        checkBradycardiaBetaBlockers(insights, vitals, habitual, prescriptions);
        checkHypotensionAntihypertensives(insights, vitals, habitual, prescriptions);
        checkSpo2Context(insights, vitals, priorVitals, admissionId);
        checkDesaturationAfterSupportWithdrawal(insights, vitals);
        checkGlycemiaTrend(insights, vitals, prescriptions);
        checkCyclicThermalPattern(insights, vitals, prescriptions);
        checkTachycardiaFever(insights, vitals);
        checkUncontrolledPain(insights, vitals);
        checkMultiParameterDeterioration(insights, vitals);
        checkElevatedRespiratoryRate(insights, vitals, admissionId);
        checkCorticosteroidHyperglycemia(insights, vitals, prescriptions);
        checkNewCognitiveDecline(insights, currentAssessments, priorAssessments);
        checkProgressiveCognitiveDecline(insights, currentAssessments);
        checkGlasgowDrop(insights, currentAssessments, priorAssessments);
        checkFallRiskWithMobilityImpairment(insights, currentAssessments);
        checkAgitationWithoutRestraint(insights, currentAssessments);
        checkRespiratoryPatternDeterioration(insights, currentAssessments);
        checkPriorAgitationHistory(insights, priorAssessments);

        // Cross-domain analyses
        checkSedativeSomnolence(insights, currentAssessments, habitual);
        checkDysphagiaOralMeds(insights, currentAssessments, prescriptions);
        checkAspirationRiskOralMeds(insights, currentAssessments, prescriptions);
        checkAgitationNoSedative(insights, currentAssessments, prescriptions);
        checkDesaturationWithRespiratoryPattern(insights, vitals, currentAssessments);
        checkTachycardiaAgitation(insights, vitals, currentAssessments);
        checkOpioidRespiratoryDepression(insights, vitals, prescriptions);
        checkAnticoagulantFallRisk(insights, currentAssessments, habitual, prescriptions);
        checkHabitualAnalgesicNotPrescribed(insights, habitual, prescriptions);

        // Device alerts
        List<Device> activeDevices = deviceRepo.findByAdmissionIdAndRemovedAtIsNull(admissionId);

        checkVvpProlonged(insights, activeDevices);
        checkVvpEmergencyChange(insights, activeDevices);
        checkSngPvcChangeDue(insights, activeDevices);
        checkSngSiliconeChangeDue(insights, activeDevices);
        checkSvLatexChangeDue(insights, activeDevices);
        checkSvSiliconeChangeDue(insights, activeDevices);
        checkSvItuRisk(insights, activeDevices);
        checkVvcReviewDressing(insights, activeDevices);
        checkVvcReviewLines(insights, activeDevices);
        checkPiccReviewDressing(insights, activeDevices);
        checkSngAspirationRisk(insights, activeDevices, currentAssessments);

        // Drain-specific alerts
        checkDrainProlonged(insights, activeDevices);
        List<DrainOutput> latestDrainOutputs = drainOutputRepo.findLatestByAdmission(admissionId);
        checkDrainHighOutput(insights, latestDrainOutputs, activeDevices);
        checkDrainHemorrhagic(insights, latestDrainOutputs, activeDevices);
        checkDrainVacuumLost(insights, latestDrainOutputs, activeDevices);

        // Sort: critical first, then warning, then info
        insights.sort(Comparator.comparingInt(i -> levelOrder(i.getLevel())));
        return insights;
    }

    private int levelOrder(String level) {
        return switch (level) { case "critical" -> 0; case "warning" -> 1; default -> 2; };
    }

    private List<VitalSign> lastN(List<VitalSign> vitals, int n) {
        return vitals.subList(Math.max(0, vitals.size() - n), vitals.size());
    }

    // ── PLACEHOLDER METHODS (will be filled incrementally) ──

    private void checkAllergyConflicts(List<ClinicalInsightDTO> insights, List<Allergy> allergies, List<AdmissionPrescription> rx) {
        for (Allergy a : allergies) {
            if (a.getType() != Allergy.AllergyType.drug) continue;
            String substance = a.getSubstance().toLowerCase();
            for (AdmissionPrescription p : rx) {
                if (p.getName().toLowerCase().contains(substance)) {
                    insights.add(ClinicalInsightDTO.builder()
                        .level("critical")
                        .title("Alergia vs prescripción: " + p.getName())
                        .detail("Paciente alérgico a " + a.getSubstance() + " (severidad: " + a.getSeverity() + "). Prescripción activa: " + p.getName() + " " + p.getAmount() + p.getUnit())
                        .reasoning("Cruce directo entre alergia medicamentosa registrada y prescripción activa del ingreso")
                        .analysisType("allergy_conflict")
                        .build());
                }
            }
        }
    }
    private void checkNephrotoxicity(List<ClinicalInsightDTO> insights, Set<String> history, List<AdmissionPrescription> rx) {
        boolean hasIRC = history.stream().anyMatch(h -> h.contains("irc") || h.contains("insuficiencia renal") || h.contains("enfermedad renal"));
        if (!hasIRC) return;
        List<String> nephrotoxic = List.of("ibuprofeno", "diclofenaco", "ketorolaco", "naproxeno", "gentamicina", "amikacina", "vancomicina", "anfotericina", "aine");
        for (AdmissionPrescription p : rx) {
            String name = p.getName().toLowerCase();
            for (String drug : nephrotoxic) {
                if (name.contains(drug)) {
                    insights.add(ClinicalInsightDTO.builder()
                        .level("critical")
                        .title("Nefrotóxico en paciente con IRC: " + p.getName())
                        .detail("Paciente con IRC tiene prescrito " + p.getName() + " " + p.getAmount() + p.getUnit() + " — fármaco potencialmente nefrotóxico")
                        .reasoning("Los AINEs y aminoglucósidos pueden agravar la insuficiencia renal. Considerar alternativas o ajuste de dosis")
                        .analysisType("nephrotoxicity")
                        .build());
                    break;
                }
            }
        }
    }
    private void checkBaselineDeviation(List<ClinicalInsightDTO> insights, List<VitalSign> vitals, List<VitalSign> prior, List<Medication> habitual) {
        if (prior.isEmpty() || vitals.isEmpty()) return;
        // Calculate baseline systolic BP from prior admissions
        OptionalDouble baselineSys = prior.stream().filter(v -> v.getSystolicBp() != null).mapToInt(VitalSign::getSystolicBp).average();
        if (baselineSys.isEmpty()) return;
        double bSys = baselineSys.getAsDouble();
        // Last 3 readings of current admission
        List<VitalSign> recent = vitals.subList(Math.max(0, vitals.size() - 3), vitals.size());
        OptionalDouble currentSys = recent.stream().filter(v -> v.getSystolicBp() != null).mapToInt(VitalSign::getSystolicBp).average();
        if (currentSys.isEmpty()) return;
        double cSys = currentSys.getAsDouble();
        double diff = cSys - bSys;
        // Check if patient takes antihypertensives
        boolean takesAntihypertensive = habitual.stream().anyMatch(m -> {
            String n = m.getName().toLowerCase();
            return n.contains("enalapril") || n.contains("losartan") || n.contains("amlodipino") || n.contains("ramipril") || n.contains("valsartan");
        });
        if (Math.abs(diff) > 20) {
            String direction = diff > 0 ? "por encima" : "por debajo";
            String medContext = takesAntihypertensive ? " Paciente con antihipertensivo habitual." : "";
            insights.add(ClinicalInsightDTO.builder()
                .level(Math.abs(diff) > 40 ? "warning" : "info")
                .title("TA sistólica " + String.format("%.0f", Math.abs(diff)) + " mmHg " + direction + " del baseline")
                .detail("Baseline previo: " + String.format("%.0f", bSys) + " mmHg. Media actual: " + String.format("%.0f", cSys) + " mmHg." + medContext)
                .reasoning("Desviación significativa respecto al baseline calculado de ingresos previos. Valorar contexto clínico y medicación")
                .analysisType("baseline_deviation")
                .build());
        }
    }
    private void checkBradycardiaBetaBlockers(List<ClinicalInsightDTO> insights, List<VitalSign> vitals, List<Medication> habitual, List<AdmissionPrescription> rx) {
        List<VitalSign> recent = lastN(vitals, 3);
        boolean bradycardia = recent.stream().filter(v -> v.getHeartRate() != null).anyMatch(v -> v.getHeartRate() < 55);
        if (!bradycardia) return;
        List<String> betaBlockers = List.of("atenolol", "bisoprolol", "carvedilol", "metoprolol", "propranolol", "nebivolol");
        List<String> found = new ArrayList<>();
        for (Medication m : habitual) {
            if (betaBlockers.stream().anyMatch(b -> m.getName().toLowerCase().contains(b))) found.add(m.getName());
        }
        for (AdmissionPrescription p : rx) {
            if (betaBlockers.stream().anyMatch(b -> p.getName().toLowerCase().contains(b))) found.add(p.getName());
        }
        if (!found.isEmpty()) {
            int minHR = recent.stream().filter(v -> v.getHeartRate() != null).mapToInt(VitalSign::getHeartRate).min().orElse(0);
            insights.add(ClinicalInsightDTO.builder()
                .level("warning")
                .title("Bradicardia + betabloqueante")
                .detail("FC mínima reciente: " + minHR + " lpm. Betabloqueantes: " + String.join(", ", found))
                .reasoning("La bradicardia puede estar inducida o agravada por betabloqueantes. Valorar reducción de dosis o suspensión")
                .analysisType("bradycardia_beta_blockers")
                .build());
        }
    }
    private void checkHypotensionAntihypertensives(List<ClinicalInsightDTO> insights, List<VitalSign> vitals, List<Medication> habitual, List<AdmissionPrescription> rx) {
        List<VitalSign> recent = lastN(vitals, 3);
        boolean hypotension = recent.stream().filter(v -> v.getSystolicBp() != null).anyMatch(v -> v.getSystolicBp() < 95);
        if (!hypotension) return;
        List<String> antihyp = List.of("enalapril", "losartan", "amlodipino", "ramipril", "valsartan", "hidroclorotiazida", "furosemida", "doxazosina", "nifedipino");
        List<String> found = new ArrayList<>();
        for (Medication m : habitual) {
            if (antihyp.stream().anyMatch(a -> m.getName().toLowerCase().contains(a))) found.add(m.getName() + " (habitual)");
        }
        for (AdmissionPrescription p : rx) {
            if (antihyp.stream().anyMatch(a -> p.getName().toLowerCase().contains(a))) found.add(p.getName() + " (ingreso)");
        }
        if (found.size() >= 2) {
            int minSys = recent.stream().filter(v -> v.getSystolicBp() != null).mapToInt(VitalSign::getSystolicBp).min().orElse(0);
            insights.add(ClinicalInsightDTO.builder()
                .level("warning")
                .title("Hipotensión con " + found.size() + " antihipertensivos")
                .detail("TAS mínima: " + minSys + " mmHg. Fármacos: " + String.join(", ", found))
                .reasoning("Múltiples antihipertensivos pueden causar hipotensión sumativa. Considerar suspender alguno durante el ingreso")
                .analysisType("hypotension_antihypertensives")
                .build());
        }
    }
    private void checkSpo2Context(List<ClinicalInsightDTO> insights, List<VitalSign> vitals, List<VitalSign> prior, Long admissionId) {
        List<VitalSign> recent = lastN(vitals, 3);
        OptionalDouble avgSpo2 = recent.stream().filter(v -> v.getSpo2() != null).mapToInt(VitalSign::getSpo2).average();
        if (avgSpo2.isEmpty()) return;
        double spo2 = avgSpo2.getAsDouble();
        // Baseline from prior admissions
        OptionalDouble baselineSpo2 = prior.stream().filter(v -> v.getSpo2() != null).mapToInt(VitalSign::getSpo2).average();
        double baseline = baselineSpo2.isPresent() ? baselineSpo2.getAsDouble() : 97.0;
        if (spo2 < 93 || (spo2 < baseline - 3)) {
            String level = spo2 < 90 ? "critical" : "warning";
            String baselineStr = baselineSpo2.isPresent() ? String.format("%.0f", baseline) : "97 (estimado)";
            insights.add(ClinicalInsightDTO.builder()
                .level(level)
                .title("SpO2 baja: " + String.format("%.0f", spo2) + "%")
                .detail("SpO2 media reciente: " + String.format("%.1f", spo2) + "%. Baseline: " + baselineStr + "%")
                .reasoning("Desaturación respecto al baseline. Valorar soporte respiratorio y causa subyacente")
                .analysisType("spo2_context")
                .build());
        }
    }
    private void checkDesaturationAfterSupportWithdrawal(List<ClinicalInsightDTO> insights, List<VitalSign> vitals) {
        if (vitals.size() < 2) return;
        for (int i = 1; i < vitals.size(); i++) {
            VitalSign prev = vitals.get(i - 1);
            VitalSign curr = vitals.get(i);
            boolean hadSupport = prev.getRespiratorySupport() != null && prev.getRespiratorySupport().getDeviceType() != RespiratorySupport.DeviceType.none;
            boolean noSupport = curr.getRespiratorySupport() == null || curr.getRespiratorySupport().getDeviceType() == RespiratorySupport.DeviceType.none;
            if (hadSupport && noSupport && curr.getSpo2() != null && curr.getSpo2() < 93) {
                insights.add(ClinicalInsightDTO.builder()
                    .level("warning")
                    .title("Desaturación tras retirada de soporte respiratorio")
                    .detail("SpO2 " + curr.getSpo2() + "% tras retirar " + prev.getRespiratorySupport().getDeviceType().name().replace('_', ' '))
                    .reasoning("La retirada del soporte respiratorio ha provocado desaturación. Considerar reinstaurar o weaning más gradual")
                    .analysisType("desaturation_withdrawal")
                    .build());
                break; // Only report the most recent occurrence
            }
        }
    }
    private void checkGlycemiaTrend(List<ClinicalInsightDTO> insights, List<VitalSign> vitals, List<AdmissionPrescription> rx) {
        // Use temperature field > 200 as proxy for glycemia if no dedicated readings (simplified)
        // In production this would query GlycemiaReading table
        boolean hasInsulin = rx.stream().anyMatch(p -> p.getCategory() == AdmissionPrescription.Category.insulin);
        boolean hasCorticosteroids = rx.stream().anyMatch(p -> {
            String n = p.getName().toLowerCase();
            return n.contains("dexametasona") || n.contains("metilprednisolona") || n.contains("prednisona") || n.contains("hidrocortisona");
        });
        if (hasInsulin && hasCorticosteroids) {
            insights.add(ClinicalInsightDTO.builder()
                .level("info")
                .title("Insulina + corticoides: monitorizar glucemia")
                .detail("Paciente con pauta de insulina y corticoides simultáneos")
                .reasoning("Los corticoides elevan la glucemia, lo que puede requerir ajuste de la pauta de insulina. Vigilar tendencia glucémica")
                .analysisType("glycemia_trend")
                .build());
        }
    }
    private void checkCyclicThermalPattern(List<ClinicalInsightDTO> insights, List<VitalSign> vitals, List<AdmissionPrescription> rx) {
        List<VitalSign> withTemp = vitals.stream().filter(v -> v.getTemperature() != null).toList();
        if (withTemp.size() < 4) return;
        // Count fever peaks (>38) followed by drops (<37.5)
        int peaks = 0;
        for (int i = 1; i < withTemp.size(); i++) {
            if (withTemp.get(i - 1).getTemperature() >= 38.0 && withTemp.get(i).getTemperature() < 37.5) peaks++;
        }
        if (peaks >= 2) {
            boolean hasAntipyretic = rx.stream().anyMatch(p -> {
                String n = p.getName().toLowerCase();
                return n.contains("paracetamol") || n.contains("metamizol") || n.contains("ibuprofeno");
            });
            double maxTemp = withTemp.stream().mapToDouble(VitalSign::getTemperature).max().orElse(0);
            insights.add(ClinicalInsightDTO.builder()
                .level("warning")
                .title("Patrón térmico cíclico: " + peaks + " picos febriles")
                .detail("Tª máxima: " + String.format("%.1f", maxTemp) + "°C. " + (hasAntipyretic ? "Antipirético pautado." : "Sin antipirético pautado."))
                .reasoning("Patrón de fiebre recurrente sugiere proceso infeccioso no controlado. " + (hasAntipyretic ? "El antipirético enmascara pero no resuelve la causa" : "Considerar pautar antipirético y buscar foco"))
                .analysisType("cyclic_thermal")
                .build());
        }
    }
    private void checkTachycardiaFever(List<ClinicalInsightDTO> insights, List<VitalSign> vitals) {
        List<VitalSign> recent = lastN(vitals, 3);
        for (VitalSign v : recent) {
            if (v.getHeartRate() != null && v.getTemperature() != null && v.getHeartRate() > 100 && v.getTemperature() >= 38.0) {
                // ~10 bpm per degree above 37
                double expectedIncrease = (v.getTemperature() - 37.0) * 10;
                boolean proportional = v.getHeartRate() <= 80 + expectedIncrease + 15;
                insights.add(ClinicalInsightDTO.builder()
                    .level(proportional ? "info" : "warning")
                    .title("Taquicardia " + (proportional ? "proporcional" : "desproporcionada") + " a fiebre")
                    .detail("FC: " + v.getHeartRate() + " lpm, Tª: " + String.format("%.1f", v.getTemperature()) + "°C. Esperado: ~" + String.format("%.0f", 80 + expectedIncrease) + " lpm")
                    .reasoning(proportional ? "Taquicardia reactiva a fiebre, esperable" : "FC superior a la esperada por fiebre. Descartar otras causas: dolor, hipovolemia, sepsis")
                    .analysisType("tachycardia_fever")
                    .build());
                break;
            }
        }
    }
    private void checkUncontrolledPain(List<ClinicalInsightDTO> insights, List<VitalSign> vitals) {
        List<VitalSign> recent = lastN(vitals, 4);
        List<Integer> painScores = recent.stream().filter(v -> v.getPainLevel() != null).map(VitalSign::getPainLevel).toList();
        if (painScores.size() < 2) return;
        boolean allHigh = painScores.stream().allMatch(p -> p >= 6);
        boolean increasing = true;
        for (int i = 1; i < painScores.size(); i++) {
            if (painScores.get(i) < painScores.get(i - 1)) { increasing = false; break; }
        }
        if (allHigh || (increasing && painScores.getLast() >= 7)) {
            int maxPain = painScores.stream().mapToInt(Integer::intValue).max().orElse(0);
            insights.add(ClinicalInsightDTO.builder()
                .level(maxPain >= 8 ? "warning" : "info")
                .title("Dolor no controlado (EVA " + maxPain + "/10)")
                .detail("Últimas " + painScores.size() + " lecturas: " + painScores.stream().map(String::valueOf).collect(Collectors.joining(", ")))
                .reasoning(allHigh ? "Dolor persistentemente elevado. Revisar pauta analgésica" : "Tendencia ascendente del dolor. Considerar rescate o ajuste")
                .analysisType("uncontrolled_pain")
                .build());
        }
    }
    private void checkMultiParameterDeterioration(List<ClinicalInsightDTO> insights, List<VitalSign> vitals) {
        if (vitals.size() < 4) return;
        List<VitalSign> early = vitals.subList(0, Math.min(3, vitals.size()));
        List<VitalSign> recent = lastN(vitals, 3);
        int deteriorating = 0;
        List<String> params = new ArrayList<>();
        // HR increasing
        OptionalDouble earlyHR = early.stream().filter(v -> v.getHeartRate() != null).mapToInt(VitalSign::getHeartRate).average();
        OptionalDouble recentHR = recent.stream().filter(v -> v.getHeartRate() != null).mapToInt(VitalSign::getHeartRate).average();
        if (earlyHR.isPresent() && recentHR.isPresent() && recentHR.getAsDouble() > earlyHR.getAsDouble() + 15) { deteriorating++; params.add("FC↑"); }
        // BP decreasing
        OptionalDouble earlySys = early.stream().filter(v -> v.getSystolicBp() != null).mapToInt(VitalSign::getSystolicBp).average();
        OptionalDouble recentSys = recent.stream().filter(v -> v.getSystolicBp() != null).mapToInt(VitalSign::getSystolicBp).average();
        if (earlySys.isPresent() && recentSys.isPresent() && recentSys.getAsDouble() < earlySys.getAsDouble() - 20) { deteriorating++; params.add("TAS↓"); }
        // SpO2 decreasing
        OptionalDouble earlySpo2 = early.stream().filter(v -> v.getSpo2() != null).mapToInt(VitalSign::getSpo2).average();
        OptionalDouble recentSpo2 = recent.stream().filter(v -> v.getSpo2() != null).mapToInt(VitalSign::getSpo2).average();
        if (earlySpo2.isPresent() && recentSpo2.isPresent() && recentSpo2.getAsDouble() < earlySpo2.getAsDouble() - 3) { deteriorating++; params.add("SpO2↓"); }
        // Temperature increasing
        OptionalDouble earlyTemp = early.stream().filter(v -> v.getTemperature() != null).mapToDouble(VitalSign::getTemperature).average();
        OptionalDouble recentTemp = recent.stream().filter(v -> v.getTemperature() != null).mapToDouble(VitalSign::getTemperature).average();
        if (earlyTemp.isPresent() && recentTemp.isPresent() && recentTemp.getAsDouble() > earlyTemp.getAsDouble() + 0.8) { deteriorating++; params.add("Tª↑"); }
        if (deteriorating >= 3) {
            insights.add(ClinicalInsightDTO.builder()
                .level("critical")
                .title("Deterioro progresivo multiparámetro")
                .detail("Parámetros en deterioro: " + String.join(", ", params))
                .reasoning("Empeoramiento simultáneo de " + deteriorating + " constantes vitales. Patrón compatible con deterioro clínico significativo. Valoración médica urgente")
                .analysisType("multi_parameter_deterioration")
                .build());
        }
    }
    private void checkElevatedRespiratoryRate(List<ClinicalInsightDTO> insights, List<VitalSign> vitals, Long admissionId) {
        List<VitalSign> recent = lastN(vitals, 3);
        OptionalDouble avgFR = recent.stream().filter(v -> v.getRespiratoryRate() != null).mapToInt(VitalSign::getRespiratoryRate).average();
        if (avgFR.isEmpty()) return;
        double fr = avgFR.getAsDouble();
        if (fr > 22) {
            boolean hasLowSpo2 = recent.stream().filter(v -> v.getSpo2() != null).anyMatch(v -> v.getSpo2() < 94);
            insights.add(ClinicalInsightDTO.builder()
                .level(fr > 28 ? "warning" : "info")
                .title("FR elevada: " + String.format("%.0f", fr) + " rpm")
                .detail("Media últimos registros: " + String.format("%.1f", fr) + " rpm." + (hasLowSpo2 ? " Asociada a SpO2 baja." : ""))
                .reasoning("Frecuencia respiratoria elevada" + (hasLowSpo2 ? " con desaturación asociada — posible insuficiencia respiratoria" : " — monitorizar evolución y descartar causa"))
                .analysisType("elevated_respiratory_rate")
                .build());
        }
    }
    private void checkCorticosteroidHyperglycemia(List<ClinicalInsightDTO> insights, List<VitalSign> vitals, List<AdmissionPrescription> rx) {
        boolean hasCorticosteroid = rx.stream().anyMatch(p -> {
            String n = p.getName().toLowerCase();
            return n.contains("dexametasona") || n.contains("metilprednisolona") || n.contains("prednisona") || n.contains("hidrocortisona") || n.contains("prednisolona");
        });
        if (!hasCorticosteroid) return;
        boolean hasInsulin = rx.stream().anyMatch(p -> p.getCategory() == AdmissionPrescription.Category.insulin);
        if (!hasInsulin) {
            insights.add(ClinicalInsightDTO.builder()
                .level("info")
                .title("Corticoides sin pauta de insulina")
                .detail("Paciente con corticoides activos sin pauta de insulina asociada")
                .reasoning("Los corticoides inducen hiperglucemia. Monitorizar glucemia capilar y valorar pauta de insulina correctora")
                .analysisType("corticosteroid_hyperglycemia")
                .build());
        }
    }

    // ── NURSING ASSESSMENT ANALYSES ──

    private static final Map<String, Integer> COGNITIVE_ORDER = Map.of(
        "orientado", 0, "desorientado", 1, "confuso", 2, "demencia", 3
    );

    /**
     * Patient was oriented in prior admissions but arrives disoriented/confused now.
     */
    private void checkNewCognitiveDecline(List<ClinicalInsightDTO> insights, List<NursingAssessment> current, List<NursingAssessment> prior) {
        if (current.isEmpty() || prior.isEmpty()) return;
        // Most recent current assessment
        NursingAssessment latest = current.get(0);
        String currentCog = latest.getPhysicalCognitive();
        if (currentCog == null || "orientado".equals(currentCog)) return;

        // Check if patient was consistently oriented in prior admissions
        boolean wasOriented = prior.stream()
            .filter(a -> a.getPhysicalCognitive() != null)
            .allMatch(a -> "orientado".equals(a.getPhysicalCognitive()));
        if (!wasOriented) return;

        long priorCount = prior.stream().filter(a -> a.getPhysicalCognitive() != null).count();
        if (priorCount == 0) return;

        insights.add(ClinicalInsightDTO.builder()
            .level("warning")
            .title("Deterioro cognitivo nuevo: " + currentCog)
            .detail("Paciente orientado en " + priorCount + " valoraciones de ingresos previos. Estado actual: " + currentCog)
            .reasoning("Cambio respecto al baseline cognitivo del paciente. Descartar causas orgánicas: infección, fármacos, alteraciones metabólicas, ACV")
            .analysisType("new_cognitive_decline")
            .build());
    }

    /**
     * Patient entered oriented in this admission but has deteriorated in subsequent assessments.
     */
    private void checkProgressiveCognitiveDecline(List<ClinicalInsightDTO> insights, List<NursingAssessment> current) {
        if (current.size() < 2) return;
        // Assessments are ordered desc, so last element is the earliest
        NursingAssessment first = current.get(current.size() - 1);
        NursingAssessment latest = current.get(0);
        String firstCog = first.getPhysicalCognitive();
        String latestCog = latest.getPhysicalCognitive();
        if (firstCog == null || latestCog == null) return;

        int firstOrder = COGNITIVE_ORDER.getOrDefault(firstCog, -1);
        int latestOrder = COGNITIVE_ORDER.getOrDefault(latestCog, -1);
        if (firstOrder < 0 || latestOrder < 0) return;
        if (latestOrder <= firstOrder) return; // No deterioration

        insights.add(ClinicalInsightDTO.builder()
            .level("warning")
            .title("Deterioro cognitivo progresivo durante el ingreso")
            .detail("Entrada: " + firstCog + " → Actual: " + latestCog + " (en " + current.size() + " valoraciones)")
            .reasoning("Empeoramiento del estado cognitivo durante la estancia. Valorar causas reversibles: fármacos sedantes, infección, hipoxia, alteraciones electrolíticas")
            .analysisType("progressive_cognitive_decline")
            .build());
    }

    /**
     * Glasgow score dropped ≥2 points from entry or from prior admission baseline.
     */
    private void checkGlasgowDrop(List<ClinicalInsightDTO> insights, List<NursingAssessment> current, List<NursingAssessment> prior) {
        if (current.isEmpty()) return;
        NursingAssessment latest = current.get(0);
        if (latest.getGlasgowScore() == null) return;
        int currentGlasgow = latest.getGlasgowScore();

        // Compare with entry assessment of this admission
        NursingAssessment entry = current.get(current.size() - 1);
        if (entry.getGlasgowScore() != null && current.size() >= 2) {
            int entryGlasgow = entry.getGlasgowScore();
            int drop = entryGlasgow - currentGlasgow;
            if (drop >= 2) {
                String level = drop >= 4 || currentGlasgow <= 8 ? "critical" : "warning";
                insights.add(ClinicalInsightDTO.builder()
                    .level(level)
                    .title("Caída de Glasgow: " + entryGlasgow + " → " + currentGlasgow)
                    .detail("Descenso de " + drop + " puntos desde la valoración de entrada")
                    .reasoning("Descenso significativo del nivel de consciencia. Valoración neurológica urgente y descartar causas tratables")
                    .analysisType("glasgow_drop")
                    .build());
                return; // Don't also report baseline comparison
            }
        }

        // Compare with prior admissions baseline
        OptionalDouble baselineGlasgow = prior.stream()
            .filter(a -> a.getGlasgowScore() != null)
            .mapToInt(NursingAssessment::getGlasgowScore)
            .average();
        if (baselineGlasgow.isPresent()) {
            double baseline = baselineGlasgow.getAsDouble();
            double drop = baseline - currentGlasgow;
            if (drop >= 2) {
                String level = currentGlasgow <= 8 ? "critical" : "warning";
                insights.add(ClinicalInsightDTO.builder()
                    .level(level)
                    .title("Glasgow " + currentGlasgow + " — inferior al baseline (" + String.format("%.0f", baseline) + ")")
                    .detail("Glasgow actual: " + currentGlasgow + ". Media en ingresos previos: " + String.format("%.1f", baseline))
                    .reasoning("Nivel de consciencia inferior al habitual del paciente. Investigar causa del deterioro neurológico")
                    .analysisType("glasgow_drop")
                    .build());
            }
        }
    }

    /**
     * Fall risk flagged with acute mobility impairment.
     */
    private void checkFallRiskWithMobilityImpairment(List<ClinicalInsightDTO> insights, List<NursingAssessment> current) {
        if (current.isEmpty()) return;
        NursingAssessment latest = current.get(0);
        boolean fallRisk = Boolean.TRUE.equals(latest.getFallRisk());
        boolean acuteMobility = "alteracion_aguda".equals(latest.getMobility());
        boolean hasBedRails = Boolean.TRUE.equals(latest.getBedRails());
        if (!fallRisk || !acuteMobility || hasBedRails) return;

        insights.add(ClinicalInsightDTO.builder()
            .level("warning")
            .title("Riesgo de caída con alteración aguda de movilidad")
            .detail("Paciente con riesgo de caída y alteración aguda de movilidad. Sin barandillas activas.")
            .reasoning("Combinación de alto riesgo. Activar barandillas, asegurar timbre accesible, calzado adecuado, acompañamiento en deambulación")
            .analysisType("fall_risk_mobility")
            .build());
    }

    /**
     * Patient agitated or aggressive without any restraint measures active.
     */
    private void checkAgitationWithoutRestraint(List<ClinicalInsightDTO> insights, List<NursingAssessment> current) {
        if (current.isEmpty()) return;
        NursingAssessment latest = current.get(0);
        String mood = latest.getMood();
        if (!"agitado".equals(mood) && !"agresivo".equals(mood)) return;

        boolean hasRestraint = Boolean.TRUE.equals(latest.getBedRails())
            || Boolean.TRUE.equals(latest.getRestraintAbdominal())
            || Boolean.TRUE.equals(latest.getRestraintLegs())
            || Boolean.TRUE.equals(latest.getRestraintArms());
        if (hasRestraint) return;

        insights.add(ClinicalInsightDTO.builder()
            .level("warning")
            .title("Paciente " + mood + " sin medidas de contención")
            .detail("Estado anímico: " + mood + ". No hay contención mecánica ni barandillas activas")
            .reasoning("Valorar necesidad de contención mecánica, tratamiento farmacológico y vigilancia estrecha. Informar a familia si procede")
            .analysisType("agitation_no_restraint")
            .build());
    }

    /**
     * Breathing pattern deteriorated between assessments (normal → taquipnea/bradipnea/apnea).
     */
    private void checkRespiratoryPatternDeterioration(List<ClinicalInsightDTO> insights, List<NursingAssessment> current) {
        if (current.size() < 2) return;
        NursingAssessment latest = current.get(0);
        String latestPattern = latest.getBreathingPattern();
        if (latestPattern == null || "normal".equals(latestPattern)) return;

        // Check if any earlier assessment had normal breathing
        boolean wasNormal = current.subList(1, current.size()).stream()
            .anyMatch(a -> "normal".equals(a.getBreathingPattern()));
        if (!wasNormal) return;

        String dyspnea = latest.getDyspneaLevel();
        String detail = "Patrón respiratorio: " + latestPattern;
        if (dyspnea != null && !"ninguna".equals(dyspnea)) {
            detail += ". Disnea: " + ("reposo".equals(dyspnea) ? "en reposo" : "de esfuerzo");
        }

        insights.add(ClinicalInsightDTO.builder()
            .level("reposo".equals(dyspnea) ? "warning" : "info")
            .title("Deterioro del patrón respiratorio: " + latestPattern)
            .detail(detail)
            .reasoning("El patrón respiratorio ha empeorado respecto a valoraciones previas. Correlacionar con constantes vitales (SpO2, FR) y valorar soporte")
            .analysisType("respiratory_pattern_deterioration")
            .build());
    }

    // ── DRUG KEYWORD LISTS ──

    private static final List<String> SEDATIVES = List.of(
        "lorazepam", "diazepam", "midazolam", "alprazolam", "clonazepam", "bromazepam",
        "lormetazepam", "zolpidem", "zopiclona",
        "haloperidol", "quetiapina", "olanzapina", "risperidona", "clorpromazina",
        "gabapentina", "pregabalina",
        "difenhidramina", "hidroxizina", "dexclorfeniramina",
        "tramadol", "morfina", "fentanilo", "oxicodona", "tapentadol", "buprenorfina", "codeina", "metadona"
    );

    private static final List<String> OPIOIDS = List.of(
        "tramadol", "morfina", "fentanilo", "oxicodona", "tapentadol", "buprenorfina",
        "codeina", "metadona", "petidina", "hidromorfona"
    );

    private static final List<String> STRONG_ANALGESICS = List.of(
        "tramadol", "morfina", "fentanilo", "oxicodona", "tapentadol", "buprenorfina",
        "codeina", "metadona", "petidina", "hidromorfona",
        "pregabalina", "gabapentina", "amitriptilina", "duloxetina"
    );

    private static final List<String> ANTICOAGULANTS = List.of(
        "sintrom", "acenocumarol", "warfarina", "heparina", "enoxaparina", "bemiparina",
        "rivaroxaban", "apixaban", "edoxaban", "dabigatran"
    );

    private static final List<String> ANXIOLYTICS_SEDATIVES = List.of(
        "lorazepam", "diazepam", "midazolam", "alprazolam", "clonazepam",
        "haloperidol", "quetiapina", "olanzapina", "risperidona",
        "hidroxizina"
    );

    private boolean matchesDrugList(String name, List<String> drugs) {
        String lower = name.toLowerCase();
        return drugs.stream().anyMatch(lower::contains);
    }

    // ── CROSS-DOMAIN ANALYSES ──

    /**
     * Patient somnolent/stuporous + habitual sedative medication prescribed recently.
     */
    private void checkSedativeSomnolence(List<ClinicalInsightDTO> insights, List<NursingAssessment> current, List<Medication> habitual) {
        if (current.isEmpty()) return;
        NursingAssessment latest = current.get(0);
        String consciousness = latest.getConsciousness();
        if (!"somnoliento".equals(consciousness) && !"estuporoso".equals(consciousness)) return;

        List<String> suspects = habitual.stream()
            .filter(m -> !Boolean.TRUE.equals(m.getSuspendedDuringAdmission()))
            .filter(m -> matchesDrugList(m.getName(), SEDATIVES))
            .filter(m -> m.getPrescribedSince() == null || m.getPrescribedSince().isAfter(java.time.LocalDate.now().minusMonths(3)))
            .map(Medication::getName)
            .toList();
        if (suspects.isEmpty()) return;

        insights.add(ClinicalInsightDTO.builder()
            .level("warning")
            .title("Somnolencia posiblemente asociada a medicación habitual")
            .detail("Paciente " + consciousness + ". Medicación sedante reciente: " + String.join(", ", suspects))
            .reasoning("Valorar si la somnolencia es efecto adverso de la medicación. Considerar ajuste de dosis o suspensión temporal")
            .analysisType("sedative_somnolence")
            .build());
    }

    /**
     * Dysphagia detected + active oral prescriptions.
     */
    private void checkDysphagiaOralMeds(List<ClinicalInsightDTO> insights, List<NursingAssessment> current, List<AdmissionPrescription> rx) {
        if (current.isEmpty()) return;
        NursingAssessment latest = current.get(0);
        if (!"disfagia".equals(latest.getNutrition())) return;

        long oralCount = rx.stream()
            .filter(p -> "oral".equalsIgnoreCase(p.getRoute()))
            .count();
        if (oralCount == 0) return;

        insights.add(ClinicalInsightDTO.builder()
            .level("warning")
            .title("Disfagia con " + oralCount + " prescripciones orales activas")
            .detail("Paciente con disfagia y medicación oral pautada. Riesgo de aspiración o falta de absorción")
            .reasoning("Valorar cambio de vía de administración (IV, SL, rectal, SNG) o formulación (triturado, jarabe) para las prescripciones orales")
            .analysisType("dysphagia_oral_meds")
            .build());
    }

    /**
     * Aspiration risk or SNG + active oral prescriptions.
     */
    private void checkAspirationRiskOralMeds(List<ClinicalInsightDTO> insights, List<NursingAssessment> current, List<AdmissionPrescription> rx) {
        if (current.isEmpty()) return;
        NursingAssessment latest = current.get(0);
        boolean aspirationRisk = Boolean.TRUE.equals(latest.getAspirationRisk());
        boolean hasSng = "sng".equals(latest.getNutrition());
        if (!aspirationRisk && !hasSng) return;

        long oralCount = rx.stream()
            .filter(p -> "oral".equalsIgnoreCase(p.getRoute()))
            .count();
        if (oralCount == 0) return;

        String reason = aspirationRisk ? "riesgo de aspiración" : "portador de SNG";
        insights.add(ClinicalInsightDTO.builder()
            .level("warning")
            .title("Prescripciones orales con " + reason)
            .detail(oralCount + " prescripciones orales activas en paciente con " + reason)
            .reasoning("Revisar vía de administración. Valorar administración por SNG o cambio a vía alternativa")
            .analysisType("aspiration_risk_oral_meds")
            .build());
    }

    /**
     * Patient agitated/aggressive without any sedative/anxiolytic prescribed in the admission.
     */
    private void checkAgitationNoSedative(List<ClinicalInsightDTO> insights, List<NursingAssessment> current, List<AdmissionPrescription> rx) {
        if (current.isEmpty()) return;
        NursingAssessment latest = current.get(0);
        String mood = latest.getMood();
        if (!"agitado".equals(mood) && !"agresivo".equals(mood)) return;

        boolean hasSedative = rx.stream().anyMatch(p -> matchesDrugList(p.getName(), ANXIOLYTICS_SEDATIVES));
        if (hasSedative) return;

        insights.add(ClinicalInsightDTO.builder()
            .level("info")
            .title("Paciente " + mood + " sin ansiolítico/sedante pautado")
            .detail("No hay prescripción activa de ansiolítico o sedante en el ingreso actual")
            .reasoning("Valorar necesidad de pauta farmacológica para control de agitación. Considerar haloperidol, lorazepam o quetiapina según perfil del paciente")
            .analysisType("agitation_no_sedative")
            .build());
    }

    /**
     * SpO2 <93% in vitals + abnormal breathing pattern in nursing assessment.
     */
    private void checkDesaturationWithRespiratoryPattern(List<ClinicalInsightDTO> insights, List<VitalSign> vitals, List<NursingAssessment> current) {
        if (vitals.isEmpty() || current.isEmpty()) return;
        NursingAssessment latest = current.get(0);
        String pattern = latest.getBreathingPattern();
        if (pattern == null || "normal".equals(pattern)) return;

        // Check last 3 vitals for SpO2 < 93
        List<VitalSign> recent = vitals.subList(Math.max(0, vitals.size() - 3), vitals.size());
        boolean hasLowSpo2 = recent.stream()
            .anyMatch(v -> v.getSpo2() != null && v.getSpo2() < 93);
        if (!hasLowSpo2) return;

        int minSpo2 = recent.stream().filter(v -> v.getSpo2() != null).mapToInt(VitalSign::getSpo2).min().orElse(0);
        String dyspnea = latest.getDyspneaLevel();
        String level = minSpo2 < 90 || "reposo".equals(dyspnea) ? "critical" : "warning";

        insights.add(ClinicalInsightDTO.builder()
            .level(level)
            .title("Desaturación + " + pattern + " en valoración")
            .detail("SpO2 mínima: " + minSpo2 + "%. Patrón respiratorio: " + pattern + (dyspnea != null && !"ninguna".equals(dyspnea) ? ". Disnea: " + dyspnea : ""))
            .reasoning("Correlación entre desaturación en constantes y deterioro respiratorio en valoración de enfermería. Valoración médica urgente y soporte respiratorio")
            .analysisType("desaturation_respiratory_pattern")
            .build());
    }

    /**
     * HR >110 + agitated/aggressive mood — distinguish organic vs reactive tachycardia.
     */
    private void checkTachycardiaAgitation(List<ClinicalInsightDTO> insights, List<VitalSign> vitals, List<NursingAssessment> current) {
        if (vitals.isEmpty() || current.isEmpty()) return;
        NursingAssessment latest = current.get(0);
        String mood = latest.getMood();
        if (!"agitado".equals(mood) && !"agresivo".equals(mood)) return;

        List<VitalSign> recent = vitals.subList(Math.max(0, vitals.size() - 3), vitals.size());
        boolean hasTachycardia = recent.stream()
            .anyMatch(v -> v.getHeartRate() != null && v.getHeartRate() > 110);
        if (!hasTachycardia) return;

        int maxHr = recent.stream().filter(v -> v.getHeartRate() != null).mapToInt(VitalSign::getHeartRate).max().orElse(0);
        insights.add(ClinicalInsightDTO.builder()
            .level("info")
            .title("Taquicardia (FC " + maxHr + ") + paciente " + mood)
            .detail("FC máxima reciente: " + maxHr + " lpm. Estado anímico: " + mood)
            .reasoning("La taquicardia puede ser reactiva a la agitación. Reevaluar FC tras control de agitación para descartar causa orgánica")
            .analysisType("tachycardia_agitation")
            .build());
    }

    /**
     * Active opioid prescription + respiratory rate ≤10.
     */
    private void checkOpioidRespiratoryDepression(List<ClinicalInsightDTO> insights, List<VitalSign> vitals, List<AdmissionPrescription> rx) {
        if (vitals.isEmpty()) return;
        boolean hasOpioid = rx.stream().anyMatch(p -> matchesDrugList(p.getName(), OPIOIDS));
        if (!hasOpioid) return;

        List<VitalSign> recent = vitals.subList(Math.max(0, vitals.size() - 3), vitals.size());
        boolean hasLowRR = recent.stream()
            .anyMatch(v -> v.getRespiratoryRate() != null && v.getRespiratoryRate() <= 10);
        if (!hasLowRR) return;

        int minRR = recent.stream().filter(v -> v.getRespiratoryRate() != null).mapToInt(VitalSign::getRespiratoryRate).min().orElse(0);
        List<String> opioidNames = rx.stream().filter(p -> matchesDrugList(p.getName(), OPIOIDS)).map(AdmissionPrescription::getName).toList();

        insights.add(ClinicalInsightDTO.builder()
            .level("critical")
            .title("Depresión respiratoria por opioides: FR " + minRR + " rpm")
            .detail("FR mínima: " + minRR + " rpm. Opioides activos: " + String.join(", ", opioidNames))
            .reasoning("FR ≤10 con opioides activos sugiere depresión respiratoria. Valorar naloxona, reducción de dosis y monitorización continua")
            .analysisType("opioid_respiratory_depression")
            .build());
    }

    /**
     * Anticoagulant (habitual or prescribed) + fall risk with acute mobility impairment.
     */
    private void checkAnticoagulantFallRisk(List<ClinicalInsightDTO> insights, List<NursingAssessment> current, List<Medication> habitual, List<AdmissionPrescription> rx) {
        if (current.isEmpty()) return;
        NursingAssessment latest = current.get(0);
        if (!Boolean.TRUE.equals(latest.getFallRisk())) return;

        List<String> anticoagNames = new ArrayList<>();
        habitual.stream()
            .filter(m -> !Boolean.TRUE.equals(m.getSuspendedDuringAdmission()))
            .filter(m -> matchesDrugList(m.getName(), ANTICOAGULANTS))
            .forEach(m -> anticoagNames.add(m.getName() + " (habitual)"));
        rx.stream()
            .filter(p -> matchesDrugList(p.getName(), ANTICOAGULANTS))
            .forEach(p -> anticoagNames.add(p.getName() + " (ingreso)"));
        if (anticoagNames.isEmpty()) return;

        insights.add(ClinicalInsightDTO.builder()
            .level("warning")
            .title("Anticoagulante + riesgo de caída")
            .detail("Anticoagulantes: " + String.join(", ", anticoagNames) + ". Riesgo de caída activo")
            .reasoning("Riesgo hemorrágico elevado ante caídas en paciente anticoagulado. Extremar medidas de prevención de caídas y valorar INR/anti-Xa si procede")
            .analysisType("anticoagulant_fall_risk")
            .build());
    }

    /**
     * Habitual strong analgesic/opioid not covered by equivalent prescription in current admission.
     */
    private void checkHabitualAnalgesicNotPrescribed(List<ClinicalInsightDTO> insights, List<Medication> habitual, List<AdmissionPrescription> rx) {
        List<Medication> habitualAnalgesics = habitual.stream()
            .filter(m -> !Boolean.TRUE.equals(m.getSuspendedDuringAdmission()))
            .filter(m -> matchesDrugList(m.getName(), STRONG_ANALGESICS))
            .toList();
        if (habitualAnalgesics.isEmpty()) return;

        // Check if any equivalent is prescribed in the admission
        List<String> uncovered = new ArrayList<>();
        for (Medication hab : habitualAnalgesics) {
            String habLower = hab.getName().toLowerCase();
            boolean covered = rx.stream().anyMatch(p -> {
                String pLower = p.getName().toLowerCase();
                // Same drug or same family match
                return STRONG_ANALGESICS.stream().anyMatch(drug -> habLower.contains(drug) && pLower.contains(drug));
            });
            if (!covered) uncovered.add(hab.getName() + (hab.getDose() != null ? " " + hab.getDose() : ""));
        }
        if (uncovered.isEmpty()) return;

        insights.add(ClinicalInsightDTO.builder()
            .level("warning")
            .title("Analgesia habitual sin equivalencia en el ingreso")
            .detail("Medicación habitual no cubierta: " + String.join(", ", uncovered))
            .reasoning("Paciente con analgesia potente habitual sin prescripción equivalente en el ingreso. Riesgo de dolor no controlado o síndrome de abstinencia. Valorar pautar equivalencia")
            .analysisType("habitual_analgesic_not_prescribed")
            .build());
    }

    /**
     * Patient had agitation or aggression episodes in prior admissions.
     */
    private void checkPriorAgitationHistory(List<ClinicalInsightDTO> insights, List<NursingAssessment> prior) {
        if (prior.isEmpty()) return;
        List<String> episodes = prior.stream()
            .filter(a -> "agitado".equals(a.getMood()) || "agresivo".equals(a.getMood()))
            .map(a -> a.getMood())
            .toList();
        if (episodes.isEmpty()) return;

        long agitado = episodes.stream().filter("agitado"::equals).count();
        long agresivo = episodes.stream().filter("agresivo"::equals).count();
        List<String> parts = new ArrayList<>();
        if (agitado > 0) parts.add(agitado + " agitación");
        if (agresivo > 0) parts.add(agresivo + " agresividad");

        insights.add(ClinicalInsightDTO.builder()
            .level("info")
            .title("Antecedente de " + (agresivo > 0 ? "agresividad" : "agitación") + " en ingresos previos")
            .detail("Episodios registrados en ingresos anteriores: " + String.join(", ", parts))
            .reasoning("Paciente con historial de alteración conductual. Anticipar medidas preventivas y plan de contención si precisa")
            .analysisType("prior_agitation_history")
            .build());
    }

    // ── DEVICE ALERTS ──

    private long hoursActive(Device d) {
        return java.time.Duration.between(d.getInsertedAt(), LocalDateTime.now()).toHours();
    }

    private long daysActive(Device d) {
        return java.time.Duration.between(d.getInsertedAt(), LocalDateTime.now()).toDays();
    }

    /** 1. VVP activa >96h — revisar punto de inserción */
    private void checkVvpProlonged(List<ClinicalInsightDTO> insights, List<Device> devices) {
        for (Device d : devices) {
            if (!"via_periferica".equals(d.getType())) continue;
            long hours = hoursActive(d);
            if (hours <= 96) continue;
            long days = hours / 24;
            insights.add(ClinicalInsightDTO.builder()
                .level("warning")
                .title("VVP con más de " + days + " días")
                .detail("Vía periférica insertada hace " + days + " días (" + hours + "h). Revisar punto de inserción: signos de flebitis, dolor o extravasación.")
                .reasoning("Protocolo actual: no se cambia por tiempo sino por signos clínicos, pero se recomienda revisión tras 96h de permanencia")
                .analysisType("vvp_prolonged")
                .build());
        }
    }

    /** 2. VVP de emergencia activa >48h — debe cambiarse */
    private void checkVvpEmergencyChange(List<ClinicalInsightDTO> insights, List<Device> devices) {
        for (Device d : devices) {
            if (!"via_periferica".equals(d.getType())) continue;
            if (d.getNotes() == null) continue;
            String notes = d.getNotes().toLowerCase();
            if (!notes.contains("urgencia") && !notes.contains("emergencia")) continue;
            long hours = hoursActive(d);
            if (hours <= 48) continue;
            insights.add(ClinicalInsightDTO.builder()
                .level("critical")
                .title("VVP de emergencia debe cambiarse")
                .detail("VVP insertada en contexto de emergencia hace " + (hours / 24) + " días (" + hours + "h). Supera el límite de 48h para vías sin técnica estéril garantizada.")
                .reasoning("Las vías insertadas en emergencia (fuera del hospital o sin asepsia) deben cambiarse en un máximo de 24-48h por alto riesgo de infección")
                .analysisType("vvp_emergency_change")
                .build());
        }
    }

    /** 3. SNG PVC activa >10 días */
    private void checkSngPvcChangeDue(List<ClinicalInsightDTO> insights, List<Device> devices) {
        for (Device d : devices) {
            if (!"sng".equals(d.getType())) continue;
            if (!"pvc".equals(d.getMaterial())) continue;
            long days = daysActive(d);
            if (days <= 10) continue;
            insights.add(ClinicalInsightDTO.builder()
                .level("warning")
                .title("SNG de PVC: cambio recomendado")
                .detail("Sonda nasogástrica de PVC insertada hace " + days + " días. El PVC se endurece con los jugos gástricos y puede causar lesiones.")
                .reasoning("Las SNG de PVC deben cambiarse cada 7-10 días. Considerar cambio a poliuretano o silicona si se prevé uso prolongado")
                .analysisType("sng_pvc_change_due")
                .build());
        }
    }

    /** 4. SNG silicona/poliuretano activa >42 días (6 semanas) */
    private void checkSngSiliconeChangeDue(List<ClinicalInsightDTO> insights, List<Device> devices) {
        for (Device d : devices) {
            if (!"sng".equals(d.getType())) continue;
            String mat = d.getMaterial();
            if (!"silicona".equals(mat) && !"poliuretano".equals(mat)) continue;
            long days = daysActive(d);
            if (days <= 42) continue;
            insights.add(ClinicalInsightDTO.builder()
                .level("warning")
                .title("SNG de " + mat + ": cambio recomendado")
                .detail("Sonda nasogástrica de " + mat + " insertada hace " + days + " días (>6 semanas). Verificar permeabilidad y estado.")
                .reasoning("Las SNG de poliuretano/silicona pueden mantenerse 4-6 semanas. Tras este periodo, valorar cambio o retirada si no hay obstrucción")
                .analysisType("sng_silicone_change_due")
                .build());
        }
    }

    /** 5. SV látex activa >21 días */
    private void checkSvLatexChangeDue(List<ClinicalInsightDTO> insights, List<Device> devices) {
        for (Device d : devices) {
            if (!"sonda_vesical".equals(d.getType())) continue;
            if (!"latex".equals(d.getMaterial())) continue;
            long days = daysActive(d);
            if (days <= 21) continue;
            insights.add(ClinicalInsightDTO.builder()
                .level("warning")
                .title("Sonda vesical de látex: cambio recomendado")
                .detail("Sonda vesical de látex insertada hace " + days + " días. Supera el límite de 14-21 días para este material.")
                .reasoning("Las sondas de látex deben cambiarse cada 14-21 días por riesgo de ITU-CA. Considerar cambio a silicona 100% si se prevé uso prolongado")
                .analysisType("sv_latex_change_due")
                .build());
        }
    }

    /** 6. SV silicona activa >90 días */
    private void checkSvSiliconeChangeDue(List<ClinicalInsightDTO> insights, List<Device> devices) {
        for (Device d : devices) {
            if (!"sonda_vesical".equals(d.getType())) continue;
            if (!"silicona".equals(d.getMaterial())) continue;
            long days = daysActive(d);
            if (days <= 90) continue;
            insights.add(ClinicalInsightDTO.builder()
                .level("warning")
                .title("Sonda vesical de silicona: cambio recomendado")
                .detail("Sonda vesical de silicona insertada hace " + days + " días (>90 días / 3 meses).")
                .reasoning("Las sondas de silicona 100% pueden durar hasta 90 días. Tras este periodo, valorar cambio por riesgo acumulado de ITU-CA")
                .analysisType("sv_silicone_change_due")
                .build());
        }
    }

    /** 7. SV activa >5 días — riesgo ITU-CA creciente */
    private void checkSvItuRisk(List<ClinicalInsightDTO> insights, List<Device> devices) {
        for (Device d : devices) {
            if (!"sonda_vesical".equals(d.getType())) continue;
            long days = daysActive(d);
            if (days <= 5) continue;
            insights.add(ClinicalInsightDTO.builder()
                .level("warning")
                .title("Sonda vesical >5 días: reevaluar necesidad")
                .detail("Sonda vesical activa desde hace " + days + " días. El riesgo de ITU-CA aumenta un 3-7% por cada día de sondaje.")
                .reasoning("La principal medida de prevención de ITU-CA es la retirada precoz. Reevaluar diariamente si el sondaje sigue siendo necesario")
                .analysisType("sv_itu_risk")
                .build());
        }
    }

    /** 8. VVC activa >7 días — revisar apósito */
    private void checkVvcReviewDressing(List<ClinicalInsightDTO> insights, List<Device> devices) {
        for (Device d : devices) {
            if (!"via_central".equals(d.getType())) continue;
            long days = daysActive(d);
            if (days <= 7) continue;
            insights.add(ClinicalInsightDTO.builder()
                .level("info")
                .title("VVC: revisar apósito")
                .detail("Vía venosa central activa desde hace " + days + " días. Verificar estado del apósito transparente.")
                .reasoning("El apósito de VVC debe cambiarse cada 7 días si es transparente, o antes si está sucio, húmedo o despegado")
                .analysisType("vvc_review_dressing")
                .build());
        }
    }

    /** 9. VVC activa — revisar sistemas/bioconectores cada 72-96h */
    private void checkVvcReviewLines(List<ClinicalInsightDTO> insights, List<Device> devices) {
        for (Device d : devices) {
            if (!"via_central".equals(d.getType())) continue;
            long hours = hoursActive(d);
            if (hours <= 96) continue;
            // Fire once when past 96h threshold
            long daysSinceInsert = hours / 24;
            if (daysSinceInsert < 4) continue;
            insights.add(ClinicalInsightDTO.builder()
                .level("info")
                .title("VVC: revisar sistemas y bioconectores")
                .detail("Vía venosa central activa desde hace " + daysSinceInsert + " días. Verificar fecha de último cambio de sistemas/bioconectores.")
                .reasoning("Los sistemas y bioconectores de VVC deben cambiarse cada 72-96h. No se cambia la vía de forma rutinaria, solo los accesorios")
                .analysisType("vvc_review_lines")
                .build());
        }
    }

    /** 10. PICC activa >7 días — revisar apósito (mismo protocolo que VVC) */
    private void checkPiccReviewDressing(List<ClinicalInsightDTO> insights, List<Device> devices) {
        for (Device d : devices) {
            if (!"picc".equals(d.getType())) continue;
            long days = daysActive(d);
            if (days <= 7) continue;
            insights.add(ClinicalInsightDTO.builder()
                .level("info")
                .title("PICC: revisar apósito")
                .detail("PICC activo desde hace " + days + " días. Verificar estado del apósito.")
                .reasoning("El apósito de PICC sigue el mismo protocolo que VVC: cambio cada 7 días si transparente, o antes si está comprometido")
                .analysisType("picc_review_dressing")
                .build());
        }
    }

    /** 11. SNG + nivel de consciencia alterado — riesgo de aspiración */
    private void checkSngAspirationRisk(List<ClinicalInsightDTO> insights, List<Device> devices, List<NursingAssessment> assessments) {
        boolean hasSng = devices.stream().anyMatch(d -> "sng".equals(d.getType()));
        if (!hasSng) return;
        if (assessments.isEmpty()) return;
        NursingAssessment latest = assessments.get(0); // already sorted desc
        String consciousness = latest.getConsciousness();
        if (consciousness == null || "alerta".equalsIgnoreCase(consciousness)) return;
        insights.add(ClinicalInsightDTO.builder()
            .level("warning")
            .title("SNG con nivel de consciencia alterado")
            .detail("Paciente con SNG activa y nivel de consciencia: " + consciousness + ". Riesgo aumentado de aspiración.")
            .reasoning("La combinación de SNG con nivel de consciencia alterado incrementa el riesgo de broncoaspiración. Elevar cabecero 30-45°, verificar residuo gástrico antes de alimentar")
            .analysisType("sng_aspiration_risk")
            .build());
    }

    // ── DRAIN ALERTS ──

    private boolean isDrainType(String type) {
        return "redon".equals(type) || "jackson_pratt".equals(type);
    }

    private String drainLabel(Device d) {
        String name = "redon".equals(d.getType()) ? "Redon" : "Jackson-Pratt";
        return name + (d.getDrainNumber() != null ? " #" + d.getDrainNumber() : "");
    }

    /** 12. Drain active >7 days — evaluate if still needed */
    private void checkDrainProlonged(List<ClinicalInsightDTO> insights, List<Device> devices) {
        for (Device d : devices) {
            if (!isDrainType(d.getType())) continue;
            long days = daysActive(d);
            if (days <= 7) continue;
            insights.add(ClinicalInsightDTO.builder()
                .level("info")
                .title(drainLabel(d) + ": " + days + " días activo")
                .detail("Drenaje activo desde hace " + days + " días. Reevaluar necesidad de mantenerlo.")
                .reasoning("Los drenajes quirúrgicos deben retirarse lo antes posible cuando el débito disminuye. Mantenerlos más de 7 días aumenta el riesgo de infección")
                .analysisType("drain_prolonged")
                .build());
        }
    }

    /** 13. Drain output >200mL in last reading */
    private void checkDrainHighOutput(List<ClinicalInsightDTO> insights, List<DrainOutput> outputs, List<Device> devices) {
        // Get only the most recent output per device
        java.util.Set<Long> seen = new java.util.HashSet<>();
        for (DrainOutput o : outputs) {
            if (!seen.add(o.getDevice().getId())) continue; // skip older readings
            if (o.getOutputMl() == null || o.getOutputMl() <= 200) continue;
            Device d = o.getDevice();
            insights.add(ClinicalInsightDTO.builder()
                .level("warning")
                .title(drainLabel(d) + ": débito elevado (" + o.getOutputMl() + " mL)")
                .detail("Último débito registrado: " + o.getOutputMl() + " mL. Supera los 200 mL esperados.")
                .reasoning("Un débito elevado puede indicar sangrado activo o complicación postquirúrgica. Valorar estado hemodinámico y comunicar al equipo quirúrgico")
                .analysisType("drain_high_output")
                .build());
        }
    }

    /** 14. Drain with hemorrhagic fluid */
    private void checkDrainHemorrhagic(List<ClinicalInsightDTO> insights, List<DrainOutput> outputs, List<Device> devices) {
        java.util.Set<Long> seen = new java.util.HashSet<>();
        for (DrainOutput o : outputs) {
            if (!seen.add(o.getDevice().getId())) continue;
            if (!"hematico".equals(o.getFluidType())) continue;
            Device d = o.getDevice();
            insights.add(ClinicalInsightDTO.builder()
                .level("critical")
                .title(drainLabel(d) + ": contenido hemático")
                .detail("Último registro del drenaje muestra contenido hemático.")
                .reasoning("Contenido hemático en drenaje quirúrgico puede indicar sangrado activo. Valorar urgentemente: constantes vitales, hemoglobina, y comunicar al cirujano")
                .analysisType("drain_hemorrhagic")
                .build());
        }
    }

    /** 15. Drain without vacuum */
    private void checkDrainVacuumLost(List<ClinicalInsightDTO> insights, List<DrainOutput> outputs, List<Device> devices) {
        java.util.Set<Long> seen = new java.util.HashSet<>();
        for (DrainOutput o : outputs) {
            if (!seen.add(o.getDevice().getId())) continue;
            if (o.getVacuumActive() == null || o.getVacuumActive()) continue;
            Device d = o.getDevice();
            insights.add(ClinicalInsightDTO.builder()
                .level("warning")
                .title(drainLabel(d) + ": sin vacío")
                .detail("El drenaje no mantiene el vacío en el último registro.")
                .reasoning("La pérdida de vacío reduce la eficacia del drenaje. Verificar conexiones, posibles fugas o acodamientos. Reestablecer vacío si procede")
                .analysisType("drain_vacuum_lost")
                .build());
        }
    }
}
