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
public class PatientHistoryService {

    private final PatientRepository patientRepository;
    private final MedicalHistoryRepository medicalHistoryRepository;
    private final AllergyRepository allergyRepository;
    private final MedicationRepository medicationRepository;
    private final ImmunosuppressionRepository immunosuppressionRepository;
    private final SurgicalInterventionRepository surgicalInterventionRepository;

    public PatientHistoryDTO getFullHistory(Long patientId) {
        return PatientHistoryDTO.builder()
                .medicalHistory(medicalHistoryRepository.findByPatientIdOrderByPriorityOrderAscRegisteredDateDesc(patientId)
                        .stream().map(MedicalHistoryDTO::fromEntity).collect(Collectors.toList()))
                .allergies(allergyRepository.findByPatientId(patientId)
                        .stream().map(AllergyDTO::fromEntity).collect(Collectors.toList()))
                .medications(medicationRepository.findByPatientIdOrderByNameAsc(patientId)
                        .stream().map(MedicationDTO::fromEntity).collect(Collectors.toList()))
                .immunosuppressions(immunosuppressionRepository.findByPatientIdOrderByEventDateDesc(patientId)
                        .stream().map(ImmunosuppressionDTO::fromEntity).collect(Collectors.toList()))
                .surgicalInterventions(surgicalInterventionRepository.findByPatientIdOrderByInterventionDateDesc(patientId)
                        .stream().map(SurgicalInterventionDTO::fromEntity).collect(Collectors.toList()))
                .build();
    }

    // --- Medical History CRUD ---
    @Transactional
    public MedicalHistoryDTO addMedicalHistory(Long patientId, MedicalHistoryDTO dto) {
        Patient p = patientRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        MedicalHistory mh = MedicalHistory.builder()
                .patient(p).label(dto.getLabel())
                .priorityOrder(dto.getPriorityOrder())
                .registeredDate(dto.getRegisteredDate())
                .notes(dto.getNotes()).build();
        return MedicalHistoryDTO.fromEntity(medicalHistoryRepository.save(mh));
    }

    @Transactional
    public void deleteMedicalHistory(Long id) {
        medicalHistoryRepository.deleteById(id);
    }

    // --- Allergy CRUD ---
    @Transactional
    public AllergyDTO addAllergy(Long patientId, AllergyDTO dto) {
        Patient p = patientRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        Allergy a = Allergy.builder()
                .patient(p)
                .type(Allergy.AllergyType.valueOf(dto.getType()))
                .substance(dto.getSubstance())
                .severity(dto.getSeverity() != null ? Allergy.Severity.valueOf(dto.getSeverity()) : null)
                .reaction(dto.getReaction())
                .diagnosedDate(dto.getDiagnosedDate())
                .notes(dto.getNotes()).build();
        return AllergyDTO.fromEntity(allergyRepository.save(a));
    }

    @Transactional
    public void deleteAllergy(Long id) {
        allergyRepository.deleteById(id);
    }

    // --- Medication CRUD ---
    @Transactional
    public MedicationDTO addMedication(Long patientId, MedicationDTO dto) {
        Patient p = patientRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        Medication m = Medication.builder()
                .patient(p).name(dto.getName())
                .dose(dto.getDose()).frequency(dto.getFrequency())
                .prescribedSince(dto.getPrescribedSince())
                .suspendedDuringAdmission(dto.getSuspendedDuringAdmission() != null ? dto.getSuspendedDuringAdmission() : false)
                .build();
        return MedicationDTO.fromEntity(medicationRepository.save(m));
    }

    @Transactional
    public MedicationDTO toggleSuspended(Long medicationId) {
        Medication m = medicationRepository.findById(medicationId).orElseThrow(() -> new RuntimeException("Medication not found"));
        m.setSuspendedDuringAdmission(!m.getSuspendedDuringAdmission());
        return MedicationDTO.fromEntity(medicationRepository.save(m));
    }

    @Transactional
    public void deleteMedication(Long id) {
        medicationRepository.deleteById(id);
    }

    // --- Immunosuppression CRUD ---
    @Transactional
    public ImmunosuppressionDTO addImmunosuppression(Long patientId, ImmunosuppressionDTO dto) {
        Patient p = patientRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        ImmunosuppressionHistory e = ImmunosuppressionHistory.builder()
                .patient(p)
                .description(dto.getDescription())
                .eventDate(dto.getEventDate())
                .endDate(dto.getEndDate())
                .notes(dto.getNotes())
                .build();
        return ImmunosuppressionDTO.fromEntity(immunosuppressionRepository.save(e));
    }

    @Transactional
    public void deleteImmunosuppression(Long id) {
        immunosuppressionRepository.deleteById(id);
    }

    // --- Surgical Intervention CRUD ---
    @Transactional
    public SurgicalInterventionDTO addSurgicalIntervention(Long patientId, SurgicalInterventionDTO dto) {
        Patient p = patientRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        SurgicalIntervention e = SurgicalIntervention.builder()
                .patient(p)
                .description(dto.getDescription())
                .interventionDate(dto.getInterventionDate())
                .notes(dto.getNotes())
                .build();
        return SurgicalInterventionDTO.fromEntity(surgicalInterventionRepository.save(e));
    }

    @Transactional
    public void deleteSurgicalIntervention(Long id) {
        surgicalInterventionRepository.deleteById(id);
    }
}
