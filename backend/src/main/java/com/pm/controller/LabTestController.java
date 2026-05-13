package com.pm.controller;

import com.pm.dto.LabResultDTO;
import com.pm.dto.LabTestDTO;
import com.pm.service.LabTestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lab-tests")
@RequiredArgsConstructor
public class LabTestController {

    private final LabTestService service;

    @GetMapping("/admission/{admissionId}")
    public List<LabTestDTO> getByAdmission(@PathVariable Long admissionId) {
        return service.getByAdmission(admissionId);
    }

    @GetMapping("/{id}")
    public LabTestDTO getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LabTestDTO create(@RequestBody LabTestDTO dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody LabTestDTO dto) {
        try {
            return ResponseEntity.ok(service.update(id, dto));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/validate")
    public ResponseEntity<?> validate(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String externalId = body.get("externalId");
        if (externalId == null || externalId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El identificador es obligatorio"));
        }
        try {
            String validatedBy = body.get("validatedBy");
            return ResponseEntity.ok(service.validate(id, externalId.trim(), validatedBy));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public LabTestDTO updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return service.updateStatus(id, body.get("status"));
    }

    @PostMapping("/{id}/results")
    @ResponseStatus(HttpStatus.CREATED)
    public LabTestDTO addResults(@PathVariable Long id, @RequestBody List<LabResultDTO> results) {
        return service.addResults(id, results);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
