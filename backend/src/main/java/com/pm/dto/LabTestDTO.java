package com.pm.dto;

import com.pm.entity.LabTest;
import lombok.*;
import java.time.LocalDateTime;
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
    private List<LabResultDTO> results;

    public static LabTestDTO fromEntity(LabTest t) {
        return LabTestDTO.builder()
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
                .results(t.getResults() != null
                        ? t.getResults().stream().map(LabResultDTO::fromEntity).collect(Collectors.toList())
                        : List.of())
                .build();
    }
}
