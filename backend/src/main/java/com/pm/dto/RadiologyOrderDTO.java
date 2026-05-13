package com.pm.dto;

import com.pm.entity.RadiologyOrder;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RadiologyOrderDTO {
    private Long id;
    private Long admissionId;
    private String type;
    private String bodyRegion;
    private String projection;
    private boolean contrast;
    private String priority;
    private String status;
    private LocalDateTime requestedAt;
    private LocalDateTime completedAt;
    private String requestedBy;
    private String completedBy;
    private String notes;
    private String imageData;
    private String imageType;

    public static RadiologyOrderDTO fromEntitySummary(RadiologyOrder r) {
        return RadiologyOrderDTO.builder()
                .id(r.getId())
                .admissionId(r.getAdmission().getId())
                .type(r.getType())
                .bodyRegion(r.getBodyRegion())
                .projection(r.getProjection())
                .contrast(r.isContrast())
                .priority(r.getPriority())
                .status(r.getStatus())
                .requestedAt(r.getRequestedAt())
                .completedAt(r.getCompletedAt())
                .requestedBy(r.getRequestedBy())
                .completedBy(r.getCompletedBy())
                .notes(r.getNotes())
                .imageType(r.getImageType())
                .build();
    }

    public static RadiologyOrderDTO fromEntity(RadiologyOrder r) {
        RadiologyOrderDTO dto = fromEntitySummary(r);
        dto.setImageData(r.getImageData());
        return dto;
    }
}
