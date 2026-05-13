package com.pm.controller;

import com.pm.dto.*;
import com.pm.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    public List<PatientListDTO> listActive() {
        return patientService.listActivePatients();
    }

    @GetMapping("/discharged")
    public List<PatientListDTO> listDischarged(@RequestParam(required = false) String query) {
        return patientService.listDischargedPatients(query);
    }

    @GetMapping("/{id}")
    public PatientDTO getPatient(@PathVariable Long id) {
        return patientService.getPatient(id);
    }

    @GetMapping("/{id}/admissions")
    public List<AdmissionSummaryDTO> getAdmissions(@PathVariable Long id) {
        return patientService.getPatientAdmissions(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PatientDTO create(@Valid @RequestBody CreatePatientRequest request) {
        return patientService.createPatientWithAdmission(request);
    }

    @PostMapping("/{id}/discharge")
    public PatientDTO discharge(@PathVariable Long id, @RequestBody DischargeRequest request) {
        return patientService.dischargePatient(id, request);
    }

    @PatchMapping("/admission/{admissionId}/location")
    public void updateLocation(@PathVariable Long admissionId, @RequestParam String location) {
        patientService.updateAdmissionLocation(admissionId, location);
    }

    @PatchMapping("/admission/{admissionId}/specialty")
    public void updateSpecialty(@PathVariable Long admissionId, @RequestParam String specialty) {
        patientService.updateAdmissionSpecialty(admissionId, specialty);
    }

    @PatchMapping("/admission/{admissionId}/observations")
    public void updateObservations(@PathVariable Long admissionId, @RequestBody Map<String, String> body) {
        patientService.updateAdmissionObservations(admissionId, body.get("observations"));
    }

    @PatchMapping("/admission/{admissionId}/assign-nurse")
    public void assignNurse(@PathVariable Long admissionId, @RequestBody Map<String, String> body) {
        patientService.assignNurse(admissionId, body.get("name"));
    }

    @PatchMapping("/admission/{admissionId}/assign-doctor")
    public void assignDoctor(@PathVariable Long admissionId, @RequestBody Map<String, String> body) {
        patientService.assignDoctor(admissionId, body.get("name"));
    }

    @PatchMapping("/admission/{admissionId}/unassign-nurse")
    public void unassignNurse(@PathVariable Long admissionId) {
        patientService.unassignNurse(admissionId);
    }

    @PatchMapping("/admission/{admissionId}/unassign-doctor")
    public void unassignDoctor(@PathVariable Long admissionId) {
        patientService.unassignDoctor(admissionId);
    }

    @GetMapping("/search-nhc")
    public ResponseEntity<?> searchByNhc(@RequestParam String nhc) {
        return patientService.searchByNhc(nhc);
    }

    @PostMapping("/{id}/reopen")
    public PatientDTO reopen(
            @PathVariable Long id,
            @RequestParam(required = false) Integer triageLevel,
            @RequestParam(required = false) String matCategory,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String specialty) {
        return patientService.reopenPatient(id, triageLevel, matCategory, location, specialty);
    }
}
