package com.pm.controller;

import com.pm.dto.*;
import com.pm.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PostMapping("/{id}/reopen")
    public PatientDTO reopen(
            @PathVariable Long id,
            @RequestParam(required = false) Integer triageLevel,
            @RequestParam(required = false) String matCategory) {
        return patientService.reopenPatient(id, triageLevel, matCategory);
    }
}
