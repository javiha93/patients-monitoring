package com.pm.dto;

import com.pm.entity.Ecg;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EcgDTO {
    private Long id;
    private Long admissionId;
    private String status;
    private LocalDateTime requestedAt;
    private LocalDateTime completedAt;
    private String requestedBy;
    private String completedBy;
    private String notes;
    /** Only populated when fetching a single ECG (not in list) */
    private String imageData;
    private String imageType;

    /** List view — excludes imageData to keep payload small */
    public static EcgDTO fromEntitySummary(Ecg e) {
        return EcgDTO.builder()
                .id(e.getId())
                .admissionId(e.getAdmission().getId())
                .status(e.getStatus())
                .requestedAt(e.getRequestedAt())
                .completedAt(e.getCompletedAt())
                .requestedBy(e.getRequestedBy())
                .completedBy(e.getCompletedBy())
                .notes(e.getNotes())
                .imageType(e.getImageType())
                .build();
    }

    /** Detail view — includes imageData */
    public static EcgDTO fromEntity(Ecg e) {
        return EcgDTO.builder()
                .id(e.getId())
                .admissionId(e.getAdmission().getId())
                .status(e.getStatus())
                .requestedAt(e.getRequestedAt())
                .completedAt(e.getCompletedAt())
                .requestedBy(e.getRequestedBy())
                .completedBy(e.getCompletedBy())
                .notes(e.getNotes())
                .imageData(e.getImageData())
                .imageType(e.getImageType())
                .build();
    }
}
