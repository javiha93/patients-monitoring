package com.pm.controller;

import com.pm.dto.*;
import com.pm.service.PatientHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients/{patientId}/history")
@RequiredArgsConstructor
public class PatientHistoryController {

    private final PatientHistoryService service;

    @GetMapping
    public PatientHistoryDTO getFullHistory(@PathVariable Long patientId) {
        return service.getFullHistory(patientId);
    }

    // --- Medical History ---
    @PostMapping("/conditions")
    @ResponseStatus(HttpStatus.CREATED)
    public MedicalHistoryDTO addCondition(@PathVariable Long patientId, @RequestBody MedicalHistoryDTO dto) {
        return service.addMedicalHistory(patientId, dto);
    }

    @DeleteMapping("/conditions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCondition(@PathVariable Long patientId, @PathVariable Long id) {
        service.deleteMedicalHistory(id);
    }

    // --- Allergies ---
    @PostMapping("/allergies")
    @ResponseStatus(HttpStatus.CREATED)
    public AllergyDTO addAllergy(@PathVariable Long patientId, @RequestBody AllergyDTO dto) {
        return service.addAllergy(patientId, dto);
    }

    @DeleteMapping("/allergies/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAllergy(@PathVariable Long patientId, @PathVariable Long id) {
        service.deleteAllergy(id);
    }

    // --- Medications ---
    @PostMapping("/medications")
    @ResponseStatus(HttpStatus.CREATED)
    public MedicationDTO addMedication(@PathVariable Long patientId, @RequestBody MedicationDTO dto) {
        return service.addMedication(patientId, dto);
    }

    @PatchMapping("/medications/{id}/toggle-suspended")
    public MedicationDTO toggleSuspended(@PathVariable Long patientId, @PathVariable Long id) {
        return service.toggleSuspended(id);
    }

    @DeleteMapping("/medications/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMedication(@PathVariable Long patientId, @PathVariable Long id) {
        service.deleteMedication(id);
    }
}
