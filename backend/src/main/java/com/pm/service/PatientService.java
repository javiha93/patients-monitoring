package com.pm.service;

import com.pm.dto.*;
import com.pm.entity.Admission;
import com.pm.entity.Device;
import com.pm.entity.LabTest;
import com.pm.entity.Patient;
import com.pm.repository.AdmissionRepository;
import com.pm.repository.EcgRepository;
import com.pm.repository.LabTestRepository;
import com.pm.repository.PatientRepository;
import com.pm.service.NursingAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final AdmissionRepository admissionRepository;
    private final LabTestRepository labTestRepository;
    private final EcgRepository ecgRepository;
    private final NursingAssessmentService nursingAssessmentService;
    private final DeviceService deviceService;

    /**
     * List all patients with active admissions.
     */
    public List<PatientListDTO> listActivePatients() {
        List<Admission> activeAdmissions = admissionRepository.findByStatus(Admission.Status.active);
        List<Long> admissionIds = activeAdmissions.stream().map(Admission::getId).collect(Collectors.toList());

        // Batch-fetch all pending_validation lab tests across active admissions
        Map<Long, List<LabTest>> pendingByAdmission = new HashMap<>();
        Set<Long> admissionsWithPendingEcg = new HashSet<>();
        Set<Long> admissionsWithCompletedLabs = new HashSet<>();
        Set<Long> admissionsWithCompletedEcg = new HashSet<>();
        Map<Long, List<com.pm.entity.Ecg>> recentEcgsByAdmission = new HashMap<>();
        if (!admissionIds.isEmpty()) {
            List<LabTest> pendingTests = labTestRepository.findByAdmissionIdInAndStatusAndParentIsNull(
                    admissionIds, "pending_validation");
            for (LabTest lt : pendingTests) {
                pendingByAdmission.computeIfAbsent(lt.getAdmission().getId(), k -> new ArrayList<>()).add(lt);
            }
            // Completed labs (any status other than pending_validation)
            labTestRepository.findByAdmissionIdInAndStatusNotAndParentIsNull(admissionIds, "pending_validation")
                    .forEach(lt -> admissionsWithCompletedLabs.add(lt.getAdmission().getId()));

            ecgRepository.findByAdmissionIdInAndStatus(admissionIds, "pending")
                    .forEach(ecg -> admissionsWithPendingEcg.add(ecg.getAdmission().getId()));
            // Completed ECGs in last 24h for tooltip
            LocalDateTime last24h = LocalDateTime.now().minusHours(24);
            ecgRepository.findByAdmissionIdInAndStatusAndCompletedAtAfter(admissionIds, "completed", last24h)
                    .forEach(ecg -> {
                        admissionsWithCompletedEcg.add(ecg.getAdmission().getId());
                        recentEcgsByAdmission.computeIfAbsent(ecg.getAdmission().getId(), k -> new ArrayList<>()).add(ecg);
                    });
            // Also check for completed ECGs older than 24h (for the grey icon, not tooltip)
            ecgRepository.findByAdmissionIdInAndStatus(admissionIds, "completed")
                    .forEach(ecg -> admissionsWithCompletedEcg.add(ecg.getAdmission().getId()));
        }

        return activeAdmissions.stream().map(a -> {
            Patient p = a.getPatient();
            PatientListDTO dto = PatientListDTO.builder()
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

            List<LabTest> pending = pendingByAdmission.get(a.getId());
            if (pending != null && !pending.isEmpty()) {
                dto.setPendingLabs(pending.stream().map(lt ->
                    PatientListDTO.PendingLabInfo.builder()
                            .requestedAt(lt.getRequestedAt())
                            .requestedParameters(lt.getRequestedParameters())
                            .validatedSamples(lt.getValidatedSamples())
                            .build()
                ).collect(Collectors.toList()));
            }

            dto.setHasPendingEcg(admissionsWithPendingEcg.contains(a.getId()));

            // Grey icons: completed but no pending
            boolean hasPending = pending != null && !pending.isEmpty();
            dto.setHasCompletedLabs(!hasPending && admissionsWithCompletedLabs.contains(a.getId()));
            dto.setHasCompletedEcg(!admissionsWithPendingEcg.contains(a.getId()) && admissionsWithCompletedEcg.contains(a.getId()));

            // Recent ECGs for tooltip
            List<com.pm.entity.Ecg> recent = recentEcgsByAdmission.get(a.getId());
            if (recent != null && !recent.isEmpty()) {
                dto.setRecentEcgs(recent.stream().map(ecg ->
                    PatientListDTO.RecentEcgInfo.builder()
                            .completedAt(ecg.getCompletedAt())
                            .completedBy(ecg.getCompletedBy())
                            .build()
                ).collect(Collectors.toList()));
            }

            return dto;
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

        // Find the most recent discharged admission to carry over active devices
        List<Admission> previous = admissionRepository.findByPatientIdOrderByAdmissionDateDesc(patientId);
        Admission lastAdmission = previous.isEmpty() ? null : previous.get(0);

        Admission newAdmission = openAdmission(patient, triageLevel, matCategory, location, specialty);

        // Copy active (non-removed) devices from previous admission
        if (lastAdmission != null) {
            List<Device> activeDevices = deviceService.getActiveDevices(lastAdmission.getId());
            for (Device d : activeDevices) {
                Device copy = Device.builder()
                        .admission(newAdmission)
                        .category(d.getCategory())
                        .type(d.getType())
                        .gauge(d.getGauge())
                        .location(d.getLocation())
                        .lumens(d.getLumens())
                        .material(d.getMaterial())
                        .drainNumber(d.getDrainNumber())
                        .region(d.getRegion())
                        .subRegion(d.getSubRegion())
                        .laterality(d.getLaterality())
                        .insertedAt(d.getInsertedAt())
                        .notes(d.getNotes())
                        .registeredBy(d.getRegisteredBy())
                        .build();
                deviceService.saveDevice(copy);
            }
        }

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

    private Admission openAdmission(Patient patient, Integer triageLevel, String matCategory, String location, String specialty) {
        Admission admission = Admission.builder()
                .patient(patient)
                .admissionDate(LocalDateTime.now())
                .triageLevel(triageLevel)
                .matCategory(matCategory)
                .location(location)
                .specialty(specialty)
                .status(Admission.Status.active)
                .build();
        return admissionRepository.save(admission);
    }
}
