package com.pm.controller;

import com.pm.dto.ClinicalInsightDTO;
import com.pm.dto.InsightDismissalDTO;
import com.pm.service.ClinicalInsightsService;
import com.pm.service.InsightDismissalService;
import com.pm.service.InsightReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class ClinicalInsightsController {

    private final ClinicalInsightsService service;
    private final InsightDismissalService dismissalService;
    private final InsightReportService reportService;

    @GetMapping("/patient/{patientId}/admission/{admissionId}")
    public List<ClinicalInsightDTO> getInsights(
            @PathVariable Long patientId,
            @PathVariable Long admissionId) {
        return service.analyze(patientId, admissionId);
    }

    /* ── Dismissals ── */

    @PostMapping("/admission/{admissionId}/dismiss")
    public InsightDismissalDTO dismiss(
            @PathVariable Long admissionId,
            @RequestBody InsightDismissalDTO dto) {
        dto.setAdmissionId(admissionId);
        return dismissalService.dismiss(dto);
    }

    @GetMapping("/admission/{admissionId}/dismissals")
    public List<InsightDismissalDTO> getDismissals(@PathVariable Long admissionId) {
        return dismissalService.getByAdmission(admissionId);
    }

    /* ── Report ── */

    @GetMapping("/dismissals/summary")
    public List<Map<String, Object>> getDismissalSummaries() {
        return dismissalService.getSummaries();
    }

    @GetMapping("/admission/{admissionId}/report")
    public ResponseEntity<Map<String, Object>> getReport(@PathVariable Long admissionId) {
        return ResponseEntity.ok(reportService.generate(admissionId));
    }
}
