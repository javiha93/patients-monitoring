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
        return labTestRepo.findByAdmissionIdAndParentIsNullOrderByRequestedAtDesc(admissionId)
                .stream().map(LabTestDTO::fromEntity).collect(Collectors.toList());
    }

    public List<LabTestDTO> getHistorical(Long patientId, Long excludeAdmissionId) {
        return labTestRepo.findByAdmissionPatientIdAndAdmissionIdNotAndParentIsNullOrderByRequestedAtDesc(patientId, excludeAdmissionId)
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
     * Validate a lab test. If partial, splits into a validated child (pending_receipt)
     * and keeps the parent with remaining samples (pending_validation).
     * If full, validates the test directly.
     *
     * externalId uniqueness is checked globally, but sibling children of the same
     * parent may share an externalId (same barcode for multiple validations).
     */
    @Transactional
    public LabTestDTO validate(Long id, String externalId, String validatedBy, String validatedSamples, String batchSamples, boolean partial) {
        LabTest t = labTestRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Lab test not found"));

        if (!"pending_validation".equals(t.getStatus())) {
            throw new IllegalStateException("Solo se pueden validar pruebas en estado 'pendiente de validar'");
        }

        // Check externalId uniqueness — allow reuse within siblings of the same parent
        labTestRepo.findByExternalId(externalId).ifPresent(existing -> {
            boolean isSibling = (t.getParent() != null && existing.getParent() != null
                    && existing.getParent().getId().equals(t.getParent().getId()));
            boolean isSelf = existing.getId().equals(id);
            boolean isOwnChild = existing.getParent() != null && existing.getParent().getId().equals(id);
            if (!isSelf && !isSibling && !isOwnChild) {
                throw new IllegalArgumentException(
                        "El identificador '" + externalId + "' ya está asignado a otra prueba: "
                                + existing.getLabel() + " (ID " + existing.getId() + ")");
            }
        });

        boolean hasExistingChildren = t.getChildren() != null && !t.getChildren().isEmpty();

        if (!partial && !hasExistingChildren) {
            // Full validation with no prior splits — validate the test directly
            t.setExternalId(externalId);
            t.setValidatedAt(LocalDateTime.now());
            t.setValidatedBy(validatedBy);
            if (validatedSamples != null) {
                t.setValidatedSamples(validatedSamples);
            }
            t.setStatus("pending_receipt");
            return LabTestDTO.fromEntity(labTestRepo.save(t));
        }

        // Create a child for this validation batch (partial or final batch of a split test)
        // Child stores only its own batch samples, not the cumulative set
        String childSamples = (batchSamples != null) ? batchSamples : validatedSamples;
        LabTest child = LabTest.builder()
                .admission(t.getAdmission())
                .parent(t)
                .category(t.getCategory())
                .label(t.getLabel())
                .status("pending_receipt")
                .externalId(externalId)
                .requestedAt(t.getRequestedAt())
                .validatedAt(LocalDateTime.now())
                .validatedBy(validatedBy)
                .requestedBy(t.getRequestedBy())
                .notes(t.getNotes())
                .validatedSamples(childSamples)
                .requestedParameters(t.getRequestedParameters())
                .sampleType(t.getSampleType())
                .build();
        t.getChildren().add(child);

        // Update parent's cumulative validated samples
        t.setValidatedSamples(validatedSamples);

        if (partial) {
            t.setStatus("pending_validation");
        } else {
            // All samples now validated — parent becomes a grouping shell
            t.setStatus("pending_receipt");
            t.setValidatedAt(LocalDateTime.now());
            t.setValidatedBy(validatedBy);
        }

        labTestRepo.save(t);
        LabTest saved = labTestRepo.findById(t.getId())
                .orElseThrow(() -> new RuntimeException("Lab test not found after save"));
        return LabTestDTO.fromEntity(saved);
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
