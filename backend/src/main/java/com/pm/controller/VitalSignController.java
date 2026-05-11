package com.pm.controller;

import com.pm.dto.*;
import com.pm.service.VitalSignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vitals")
@RequiredArgsConstructor
public class VitalSignController {

    private final VitalSignService vitalSignService;

    @GetMapping("/admission/{admissionId}")
    public List<VitalSignDTO> getByAdmission(@PathVariable Long admissionId) {
        return vitalSignService.getByAdmission(admissionId);
    }

    @GetMapping("/patient/{patientId}")
    public List<VitalSignDTO> getAllByPatient(@PathVariable Long patientId) {
        return vitalSignService.getAllByPatient(patientId);
    }

    @GetMapping("/patient/{patientId}/historical")
    public Map<String, Object> getHistorical(
            @PathVariable Long patientId,
            @RequestParam Long excludeAdmissionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return vitalSignService.getHistorical(patientId, excludeAdmissionId, page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VitalSignDTO create(@Valid @RequestBody CreateVitalSignRequest request) {
        return vitalSignService.create(request);
    }

    @PutMapping("/{id}")
    public VitalSignDTO update(@PathVariable Long id, @Valid @RequestBody CreateVitalSignRequest request) {
        return vitalSignService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        vitalSignService.delete(id);
    }
}
