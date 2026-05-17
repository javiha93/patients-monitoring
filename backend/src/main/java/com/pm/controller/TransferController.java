package com.pm.controller;

import com.pm.entity.Admission;
import com.pm.entity.TransferRequest;
import com.pm.repository.AdmissionRepository;
import com.pm.repository.TransferRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferRequestRepository transferRepo;
    private final AdmissionRepository admissionRepo;

    /** List all active transfer requests ordered by queue position */
    @GetMapping
    public List<Map<String, Object>> list() {
        return transferRepo.findAllOrderByQueuePosition().stream().map(t -> Map.<String, Object>of(
                "id", t.getId(),
                "admissionId", t.getAdmission().getId(),
                "transportType", t.getTransportType(),
                "respiratorySupport", t.isRespiratorySupport(),
                "monitoringRequired", t.isMonitoringRequired(),
                "ivPoleRequired", t.isIvPoleRequired(),
                "queuePosition", t.getQueuePosition(),
                "requestedBy", t.getRequestedBy() != null ? t.getRequestedBy() : "",
                "requestedAt", t.getRequestedAt().toString()
        )).toList();
    }

    /** Create a transfer request for an admission */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestBody Map<String, Object> body) {
        Long admissionId = ((Number) body.get("admissionId")).longValue();
        Admission admission = admissionRepo.findById(admissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admission not found"));

        // Check if transfer already exists for this admission
        if (transferRepo.findByAdmissionId(admissionId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Transfer already requested");
        }

        int nextPosition = transferRepo.findMaxQueuePosition() + 1;

        TransferRequest tr = TransferRequest.builder()
                .admission(admission)
                .transportType((String) body.get("transportType"))
                .respiratorySupport(Boolean.TRUE.equals(body.get("respiratorySupport")))
                .monitoringRequired(Boolean.TRUE.equals(body.get("monitoringRequired")))
                .ivPoleRequired(Boolean.TRUE.equals(body.get("ivPoleRequired")))
                .queuePosition(nextPosition)
                .requestedBy((String) body.get("requestedBy"))
                .build();

        tr = transferRepo.save(tr);

        return Map.of(
                "id", tr.getId(),
                "admissionId", admissionId,
                "queuePosition", tr.getQueuePosition()
        );
    }

    /** Delete a transfer request */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        transferRepo.deleteById(id);
    }
}
