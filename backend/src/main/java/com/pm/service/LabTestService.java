package com.pm.service;

import com.pm.dto.LabResultDTO;
import com.pm.dto.LabTestDTO;
import com.pm.entity.Admission;
import com.pm.entity.LabResult;
import com.pm.entity.LabTest;
import com.pm.repository.AdmissionRepository;
import com.pm.repository.LabResultRepository;
import com.pm.repository.LabTestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LabTestService {

    private final LabTestRepository labTestRepo;
    private final LabResultRepository labResultRepo;
    private final AdmissionRepository admissionRepo;

    public List<LabTestDTO> getByAdmission(Long admissionId) {
        return labTestRepo.findByAdmissionIdOrderByRequestedAtDesc(admissionId)
                .stream().map(LabTestDTO::fromEntity).collect(Collectors.toList());
    }

    public LabTestDTO getById(Long id) {
        return LabTestDTO.fromEntity(labTestRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Lab test not found")));
    }

    @Transactional
    public LabTestDTO create(LabTestDTO dto) {
        Admission admission = admissionRepo.findById(dto.getAdmissionId())
                .orElseThrow(() -> new RuntimeException("Admission not found"));
        LabTest t = LabTest.builder()
                .admission(admission)
                .category(dto.getCategory())
                .label(dto.getLabel())
                .status("pending_validation")
                .requestedAt(dto.getRequestedAt() != null ? dto.getRequestedAt() : LocalDateTime.now())
                .requestedBy(dto.getRequestedBy())
                .notes(dto.getNotes())
                .requestedParameters(dto.getRequestedParameters())
                .sampleType(dto.getSampleType())
                .build();
        return LabTestDTO.fromEntity(labTestRepo.save(t));
    }

    /** Update a pending_validation test's parameters. */
    @Transactional
    public LabTestDTO update(Long id, LabTestDTO dto) {
        LabTest t = labTestRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Lab test not found"));
        if (!"pending_validation".equals(t.getStatus())) {
            throw new IllegalStateException("Solo se pueden editar pruebas pendientes de validar");
        }
        t.setLabel(dto.getLabel());
        t.setNotes(dto.getNotes());
        t.setRequestedParameters(dto.getRequestedParameters());
        t.setSampleType(dto.getSampleType());
        return LabTestDTO.fromEntity(labTestRepo.save(t));
    }

    /**
     * Validate a lab test by assigning an external ID.
     * Rejects if the externalId is already used by another test.
     */
    @Transactional
    public LabTestDTO validate(Long id, String externalId, String validatedBy, String validatedSamples, boolean partial) {
        LabTest t = labTestRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Lab test not found"));

        if (!"pending_validation".equals(t.getStatus())) {
            throw new IllegalStateException("Solo se pueden validar pruebas en estado 'pendiente de validar'");
        }

        // Check uniqueness
        labTestRepo.findByExternalId(externalId).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException(
                        "El identificador '" + externalId + "' ya está asignado a otra prueba: "
                                + existing.getLabel() + " (ID " + existing.getId() + ")");
            }
        });

        t.setExternalId(externalId);
        t.setValidatedAt(LocalDateTime.now());
        t.setValidatedBy(validatedBy);

        if (validatedSamples != null) {
            t.setValidatedSamples(validatedSamples);
        }

        // partial=true means not all samples are validated yet — keep pending
        t.setStatus(partial ? "pending_validation" : "pending_receipt");
        return LabTestDTO.fromEntity(labTestRepo.save(t));
    }

    @Transactional
    public LabTestDTO updateStatus(Long id, String newStatus) {
        LabTest t = labTestRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Lab test not found"));
        t.setStatus(newStatus);
        if ("pending_receipt".equals(newStatus) && t.getReceivedAt() == null) {
            // no-op
        }
        if ("in_progress".equals(newStatus) && t.getReceivedAt() == null) {
            t.setReceivedAt(LocalDateTime.now());
        }
        return LabTestDTO.fromEntity(labTestRepo.save(t));
    }

    @Transactional
    public LabTestDTO addResults(Long id, List<LabResultDTO> resultDTOs) {
        LabTest t = labTestRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Lab test not found"));

        for (LabResultDTO dto : resultDTOs) {
            LabResult r = LabResult.builder()
                    .labTest(t)
                    .category(dto.getCategory())
                    .name(dto.getName())
                    .value(dto.getValue())
                    .unit(dto.getUnit())
                    .refRange(dto.getRefRange())
                    .flag(dto.getFlag())
                    .build();
            t.getResults().add(r);
        }

        // Auto-update status based on whether all expected results are in
        if ("pending_receipt".equals(t.getStatus()) || "in_progress".equals(t.getStatus())) {
            t.setStatus("partial_results");
            if (t.getReceivedAt() == null) t.setReceivedAt(LocalDateTime.now());
        }

        return LabTestDTO.fromEntity(labTestRepo.save(t));
    }

    @Transactional
    public void delete(Long id) {
        labTestRepo.deleteById(id);
    }
}
