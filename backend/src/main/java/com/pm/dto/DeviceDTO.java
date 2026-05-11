package com.pm.dto;

import com.pm.entity.Device;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeviceDTO {
    private Long id;
    private Long admissionId;
    private String category;
    private String type;
    private String gauge;
    private String location;
    private Integer lumens;
    private String material;
    private Integer drainNumber;
    private String region;
    private String subRegion;
    private String laterality;
    private LocalDateTime insertedAt;
    private LocalDateTime removedAt;
    private String notes;

    public static DeviceDTO fromEntity(Device d) {
        return DeviceDTO.builder()
            .id(d.getId())
            .admissionId(d.getAdmission().getId())
            .category(d.getCategory())
            .type(d.getType())
            .gauge(d.getGauge())
            .location(d.getLocation())
            .lumens(d.getLumens())
            .material(d.getMaterial())
            .drainNumber(d.getDrainNumber())
            .region(d.getRegion())
            .subRegion(d.getSubRegion())
            .laterality(d.getLaterality())
            .insertedAt(d.getInsertedAt())
            .removedAt(d.getRemovedAt())
            .notes(d.getNotes())
            .build();
    }
}
