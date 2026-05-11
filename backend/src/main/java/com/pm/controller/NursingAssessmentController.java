package com.pm.controller;

import com.pm.dto.NursingAssessmentDTO;
import com.pm.service.NursingAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/nursing-assessments")
@RequiredArgsConstructor
public class NursingAssessmentController {

    private final NursingAssessmentService service;

    @GetMapping("/admission/{admissionId}")
    public List<NursingAssessmentDTO> getByAdmission(@PathVariable Long admissionId) {
        return service.getByAdmission(admissionId);
    }

    @GetMapping("/patient/{patientId}/historical")
    public Map<String, Object> getHistorical(
            @PathVariable Long patientId,
            @RequestParam Long excludeAdmissionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return service.getHistorical(patientId, excludeAdmissionId, page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NursingAssessmentDTO create(@RequestBody NursingAssessmentDTO dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public NursingAssessmentDTO update(@PathVariable Long id, @RequestBody NursingAssessmentDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
