package com.pm.controller;

import com.pm.dto.ClinicalInsightDTO;
import com.pm.service.ClinicalInsightsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class ClinicalInsightsController {

    private final ClinicalInsightsService service;

    @GetMapping("/patient/{patientId}/admission/{admissionId}")
    public List<ClinicalInsightDTO> getInsights(
            @PathVariable Long patientId,
            @PathVariable Long admissionId) {
        return service.analyze(patientId, admissionId);
    }
}
