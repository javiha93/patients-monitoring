package com.pm.controller;

import com.pm.dto.*;
import com.pm.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService service;

    @GetMapping("/admission/{admissionId}")
    public List<PrescriptionDTO> getByAdmission(@PathVariable Long admissionId) {
        return service.getByAdmission(admissionId);
    }

    @GetMapping("/admission/{admissionId}/active")
    public List<PrescriptionDTO> getActiveByAdmission(@PathVariable Long admissionId) {
        return service.getActiveByAdmission(admissionId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PrescriptionDTO create(@Valid @RequestBody CreatePrescriptionRequest request) {
        return service.createPrescription(request);
    }

    @PatchMapping("/{id}/deactivate")
    public PrescriptionDTO deactivate(@PathVariable Long id) {
        return service.deactivatePrescription(id);
    }

    @PatchMapping("/{id}/dose")
    public PrescriptionDTO updateDose(
            @PathVariable Long id,
            @RequestParam String newAmount,
            @RequestParam(required = false) String changedBy,
            @RequestParam(required = false) String reason) {
        return service.updateDose(id, newAmount, changedBy, reason);
    }

    // --- Administrations ---
    @PostMapping("/sign")
    @ResponseStatus(HttpStatus.CREATED)
    public AdministrationDTO sign(@Valid @RequestBody SignAdministrationRequest request) {
        return service.signAdministration(request);
    }

    @PatchMapping("/administration/{administrationId}")
    public AdministrationDTO updateAdministration(
            @PathVariable Long administrationId,
            @RequestParam(required = false) String doseGiven,
            @RequestParam(required = false) String note) {
        return service.updateAdministration(administrationId, doseGiven, note);
    }

    @DeleteMapping("/unsign/{administrationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsign(@PathVariable Long administrationId) {
        service.unsignAdministration(administrationId);
    }
}
