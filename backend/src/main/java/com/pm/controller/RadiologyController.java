package com.pm.controller;

import com.pm.dto.RadiologyOrderDTO;
import com.pm.service.RadiologyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/radiology")
@RequiredArgsConstructor
public class RadiologyController {

    private final RadiologyService service;

    @GetMapping("/admission/{admissionId}")
    public List<RadiologyOrderDTO> getByAdmission(@PathVariable Long admissionId) {
        return service.getByAdmission(admissionId);
    }

    @GetMapping("/patient/{patientId}/historical")
    public List<RadiologyOrderDTO> getHistorical(@PathVariable Long patientId, @RequestParam Long excludeAdmissionId) {
        return service.getHistorical(patientId, excludeAdmissionId);
    }

    @GetMapping("/{id}")
    public RadiologyOrderDTO getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RadiologyOrderDTO create(@RequestBody RadiologyOrderDTO dto) {
        return service.create(dto);
    }

    @PatchMapping("/{id}/in-progress")
    public RadiologyOrderDTO markInProgress(@PathVariable Long id) {
        return service.markInProgress(id);
    }

    @PatchMapping("/{id}/complete")
    public RadiologyOrderDTO complete(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return service.complete(
                id,
                body.get("completedBy"),
                body.get("imageData"),
                body.get("imageType"),
                body.get("notes")
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
