package com.pm.service;

import com.pm.dto.*;
import com.pm.entity.*;
import com.pm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final AdmissionPrescriptionRepository prescriptionRepo;
    private final MedicationAdministrationRepository adminRepo;
    private final InsulinScaleRepository insulinScaleRepo;
    private final AdmissionRepository admissionRepo;
    private final PrescriptionDoseHistoryRepository doseHistoryRepo;

    public List<PrescriptionDTO> getByAdmission(Long admissionId) {
        return prescriptionRepo.findByAdmissionId(admissionId).stream()
                .map(PrescriptionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<PrescriptionDTO> getActiveByAdmission(Long admissionId) {
        return prescriptionRepo.findByAdmissionIdAndActiveTrue(admissionId).stream()
                .map(PrescriptionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public PrescriptionDTO createPrescription(CreatePrescriptionRequest req) {
        Admission admission = admissionRepo.findById(req.getAdmissionId())
                .orElseThrow(() -> new RuntimeException("Admission not found"));

        AdmissionPrescription p = AdmissionPrescription.builder()
                .admission(admission)
                .name(req.getName())
                .amount(req.getAmount())
                .unit(req.getUnit())
                .route(req.getRoute())
                .frequency(req.getFrequency())
                .category(AdmissionPrescription.Category.valueOf(req.getCategory()))
                .conditionText(req.getConditionText())
                .scheduledHours(req.getScheduledHours())
                .prescribedBy(req.getPrescribedBy())
                .active(true)
                .build();
        p = prescriptionRepo.save(p);

        // Insulin scales
        if (req.getInsulinScales() != null && !req.getInsulinScales().isEmpty()) {
            for (InsulinScaleDTO s : req.getInsulinScales()) {
                InsulinScale scale = InsulinScale.builder()
                        .prescription(p)
                        .glycemiaMin(s.getGlycemiaMin())
                        .glycemiaMax(s.getGlycemiaMax())
                        .doseUi(s.getDoseUi())
                        .sortOrder(s.getSortOrder())
                        .build();
                insulinScaleRepo.save(scale);
            }
        }

        return PrescriptionDTO.fromEntity(prescriptionRepo.findById(p.getId()).orElseThrow());
    }

    @Transactional
    public PrescriptionDTO deactivatePrescription(Long prescriptionId) {
        AdmissionPrescription p = prescriptionRepo.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        p.setActive(false);
        return PrescriptionDTO.fromEntity(prescriptionRepo.save(p));
    }

    @Transactional
    public AdministrationDTO signAdministration(SignAdministrationRequest req) {
        AdmissionPrescription p = prescriptionRepo.findById(req.getPrescriptionId())
                .orElseThrow(() -> new RuntimeException("Prescription not found"));

        MedicationAdministration ma = MedicationAdministration.builder()
                .prescription(p)
                .administeredAt(req.getAdministeredAt())
                .signedBy(req.getSignedBy() != null ? req.getSignedBy() : "Enfermería")
                .doseGiven(req.getDoseGiven())
                .note(req.getNote())
                .build();
        return AdministrationDTO.fromEntity(adminRepo.save(ma));
    }

    @Transactional
    public void unsignAdministration(Long administrationId) {
        adminRepo.deleteById(administrationId);
    }

    @Transactional
    public AdministrationDTO updateAdministration(Long administrationId, String doseGiven, String note) {
        MedicationAdministration ma = adminRepo.findById(administrationId)
                .orElseThrow(() -> new RuntimeException("Administration not found"));
        if (doseGiven != null) ma.setDoseGiven(doseGiven);
        if (note != null) ma.setNote(note);
        return AdministrationDTO.fromEntity(adminRepo.save(ma));
    }

    @Transactional
    public PrescriptionDTO updateDose(Long prescriptionId, String newAmount, String changedBy, String reason) {
        AdmissionPrescription p = prescriptionRepo.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));

        // Save history
        PrescriptionDoseHistory history = PrescriptionDoseHistory.builder()
                .prescription(p)
                .previousAmount(p.getAmount())
                .newAmount(newAmount)
                .changedBy(changedBy != null ? changedBy : "Enfermería")
                .changedAt(java.time.LocalDateTime.now())
                .reason(reason)
                .build();
        doseHistoryRepo.save(history);

        p.setAmount(newAmount);
        return PrescriptionDTO.fromEntity(prescriptionRepo.save(p));
    }
}
