package com.pm.controller;

import com.pm.dto.*;
import com.pm.service.VitalSignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
