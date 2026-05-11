package com.pm.controller;

import com.pm.dto.NursingAssessmentDTO;
import com.pm.service.NursingAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nursing-assessments")
@RequiredArgsConstructor
public class NursingAssessmentController {

    private final NursingAssessmentService service;

    @GetMapping("/admission/{admissionId}")
    public List<NursingAssessmentDTO> getByAdmission(@PathVariable Long admissionId) {
        return service.getByAdmission(admissionId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NursingAssessmentDTO create(@RequestBody NursingAssessmentDTO dto) {
        return service.create(dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
