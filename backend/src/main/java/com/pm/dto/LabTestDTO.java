package com.pm.dto;

import com.pm.entity.LabTest;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LabTestDTO {
    private Long id;
    private Long admissionId;
    private String category;
    private String label;
    private String status;
    private String externalId;
    private LocalDateTime requestedAt;
    private LocalDateTime validatedAt;
    private LocalDateTime receivedAt;
    private String requestedBy;
    private String validatedBy;
    private String notes;
    private String requestedParameters;
    private String sampleType;
    private String validatedSamples;
    private Long parentId;
    private List<LabResultDTO> results;

    /** Child tests created by partial validation splits */
    @Builder.Default
    private List<LabTestDTO> children = new ArrayList<>();

    /** Aggregated validation events across this test and its children */
    @Builder.Default
    private List<ValidationRecord> validations = new ArrayList<>();

    public static LabTestDTO fromEntity(LabTest t) {
        LabTestDTO dto = LabTestDTO.builder()
                .id(t.getId())
                .admissionId(t.getAdmission().getId())
                .category(t.getCategory())
                .label(t.getLabel())
                .status(t.getStatus())
                .externalId(t.getExternalId())
                .requestedAt(t.getRequestedAt())
                .validatedAt(t.getValidatedAt())
                .receivedAt(t.getReceivedAt())
                .requestedBy(t.getRequestedBy())
                .validatedBy(t.getValidatedBy())
                .notes(t.getNotes())
                .requestedParameters(t.getRequestedParameters())
                .sampleType(t.getSampleType())
                .validatedSamples(t.getValidatedSamples())
                .parentId(t.getParent() != null ? t.getParent().getId() : null)
                .results(t.getResults() != null
                        ? t.getResults().stream().map(LabResultDTO::fromEntity).collect(Collectors.toList())
                        : List.of())
                .children(new ArrayList<>())
                .validations(new ArrayList<>())
                .build();

        // Build children DTOs and aggregate validation records
        if (t.getChildren() != null && !t.getChildren().isEmpty()) {
            for (LabTest child : t.getChildren()) {
                dto.getChildren().add(fromEntity(child));
                if (child.getExternalId() != null) {
                    dto.getValidations().add(new ValidationRecord(
                            child.getExternalId(),
                            child.getValidatedBy(),
                            child.getValidatedAt(),
                            child.getValidatedSamples(),
                            child.getRequestedParameters(),
                            child.getStatus()
                    ));
                }
            }
        }
        // Add own validation if this is a parent that was fully validated later
        if (t.getParent() == null && t.getExternalId() != null) {
            dto.getValidations().add(0, new ValidationRecord(
                    t.getExternalId(),
                    t.getValidatedBy(),
                    t.getValidatedAt(),
                    t.getValidatedSamples(),
                    t.getRequestedParameters(),
                    t.getStatus()
            ));
        }

        return dto;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ValidationRecord {
        private String externalId;
        private String validatedBy;
        private LocalDateTime validatedAt;
        private String validatedSamples;
        private String requestedParameters;
        private String status;
    }
}
