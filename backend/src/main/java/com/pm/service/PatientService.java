package com.pm.service;

import com.pm.dto.*;
import com.pm.entity.Admission;
import com.pm.entity.Patient;
import com.pm.repository.AdmissionRepository;
import com.pm.repository.PatientRepository;
import com.pm.service.NursingAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final AdmissionRepository admissionRepository;
    private final NursingAssessmentService nursingAssessmentService;
    private final DeviceService deviceService;

    /**
     * List all patients with active admissions.
     */
    public List<PatientListDTO> listActivePatients() {
        List<Admission> activeAdmissions = admissionRepository.findByStatus(Admission.Status.active);
        return activeAdmissions.stream().map(a -> {
            Patient p = a.getPatient();
            return PatientListDTO.builder()
                    .id(p.getId())
                    .nhc(p.getNhc())
                    .firstName(p.getFirstName())
                    .lastName(p.getLastName())
                    .birthDate(p.getBirthDate())
                    .sex(p.getSex() != null ? p.getSex().name() : null)
                    .admissionId(a.getId())
                    .triageLevel(a.getTriageLevel())
                    .matCategory(a.getMatCategory())
                    .admissionDate(a.getAdmissionDate())
                    .location(a.getLocation())
                    .specialty(a.getSpecialty())
                    .status(a.getStatus().name())
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * List discharged patients (for search/reopen).
     */
    public List<PatientListDTO> listDischargedPatients(String query) {
        List<Admission> discharged = admissionRepository.findByStatus(Admission.Status.discharged);
        return discharged.stream()
                .filter(a -> {
                    if (query == null || query.isBlank()) return true;
                    String q = query.toLowerCase();
                    Patient p = a.getPatient();
                    return p.getFirstName().toLowerCase().contains(q)
                            || p.getLastName().toLowerCase().contains(q)
                            || p.getNhc().toLowerCase().contains(q);
                })
                .map(a -> {
                    Patient p = a.getPatient();
                    return PatientListDTO.builder()
                            .id(p.getId())
                            .nhc(p.getNhc())
                            .firstName(p.getFirstName())
                            .lastName(p.getLastName())
                            .birthDate(p.getBirthDate())
                            .sex(p.getSex() != null ? p.getSex().name() : null)
                            .admissionId(a.getId())
                            .triageLevel(a.getTriageLevel())
                            .matCategory(a.getMatCategory())
                            .admissionDate(a.getAdmissionDate())
                            .location(a.getLocation())
                            .specialty(a.getSpecialty())
                            .status(a.getStatus().name())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Get full patient details with active admission.
     */
    public PatientDTO getPatient(Long id) {
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + id));
        PatientDTO dto = PatientDTO.fromEntity(p);

        admissionRepository.findByPatientIdAndStatus(id, Admission.Status.active)
                .stream().findFirst()
                .ifPresent(a -> dto.setActiveAdmission(AdmissionSummaryDTO.fromEntity(a)));

        return dto;
    }

    /**
     * Create patient and open admission.
     */
    @Transactional
    public PatientDTO createPatientWithAdmission(CreatePatientRequest req) {
        if (patientRepository.existsByNhc(req.getNhc())) {
            // Patient exists — just open new admission
            Patient existing = patientRepository.findByNhc(req.getNhc())
                    .orElseThrow();
            openAdmission(existing, req.getTriageLevel(), req.getMatCategory(), req.getLocation(), req.getSpecialty());
            return getPatient(existing.getId());
        }

        Patient patient = Patient.builder()
                .nhc(req.getNhc())
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .birthDate(req.getBirthDate())
                .sex(Patient.Sex.valueOf(req.getSex()))
                .build();
        patient = patientRepository.save(patient);

        openAdmission(patient, req.getTriageLevel(), req.getMatCategory(), req.getLocation(), req.getSpecialty());
        return getPatient(patient.getId());
    }

    @Transactional
    public void updateAdmissionSpecialty(Long admissionId, String specialty) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new RuntimeException("Admission not found"));
        admission.setSpecialty(specialty);
        admissionRepository.save(admission);
    }

    @Transactional
    public void updateAdmissionLocation(Long admissionId, String location) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new RuntimeException("Admission not found"));
        admission.setLocation(location);
        admissionRepository.save(admission);
    }

    /**
     * Discharge patient (close active admission).
     */
    @Transactional
    public PatientDTO dischargePatient(Long patientId, DischargeRequest req) {
        List<Admission> active = admissionRepository.findByPatientIdAndStatus(patientId, Admission.Status.active);
        if (active.isEmpty()) {
            throw new RuntimeException("No active admission for patient: " + patientId);
        }
        Admission admission = active.get(0);
        nursingAssessmentService.markLastAsSalidaIfRecent(admission.getId());
        deviceService.retireVascularDevices(admission.getId());
        admission.setStatus(Admission.Status.discharged);
        admission.setDischargeDate(req.getDischargeDate() != null ? req.getDischargeDate() : LocalDateTime.now());
        admissionRepository.save(admission);
        return getPatient(patientId);
    }

    /**
     * Reopen a discharged patient (create new admission).
     */
    @Transactional
    /**
     * Search patient by NHC. Returns status: not_found, active, inactive.
     */
    public ResponseEntity<?> searchByNhc(String nhc) {
        Optional<Patient> opt = patientRepository.findByNhc(nhc);
        if (opt.isEmpty()) {
            return ResponseEntity.ok(Map.of("status", "not_found", "nhc", nhc));
        }
        Patient p = opt.get();
        boolean hasActive = p.getAdmissions().stream()
                .anyMatch(a -> a.getStatus() == Admission.Status.active);
        if (hasActive) {
            return ResponseEntity.ok(Map.of(
                    "status", "active",
                    "patientId", p.getId(),
                    "firstName", p.getFirstName(),
                    "lastName", p.getLastName(),
                    "nhc", p.getNhc()
            ));
        }
        return ResponseEntity.ok(Map.of(
                "status", "inactive",
                "patientId", p.getId(),
                "firstName", p.getFirstName(),
                "lastName", p.getLastName(),
                "nhc", p.getNhc()
        ));
    }

    public PatientDTO reopenPatient(Long patientId, Integer triageLevel, String matCategory, String location, String specialty) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));

        // Check no active admission exists
        List<Admission> active = admissionRepository.findByPatientIdAndStatus(patientId, Admission.Status.active);
        if (!active.isEmpty()) {
            throw new RuntimeException("Patient already has an active admission");
        }

        openAdmission(patient, triageLevel, matCategory, location, specialty);
        return getPatient(patientId);
    }

    /**
     * Get all admissions for a patient (for historical analysis).
     */
    public List<AdmissionSummaryDTO> getPatientAdmissions(Long patientId) {
        return admissionRepository.findByPatientIdOrderByAdmissionDateDesc(patientId)
                .stream()
                .map(AdmissionSummaryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    private void openAdmission(Patient patient, Integer triageLevel, String matCategory, String location, String specialty) {
        Admission admission = Admission.builder()
                .patient(patient)
                .admissionDate(LocalDateTime.now())
                .triageLevel(triageLevel)
                .matCategory(matCategory)
                .location(location)
                .specialty(specialty)
                .status(Admission.Status.active)
                .build();
        admissionRepository.save(admission);
    }
}
