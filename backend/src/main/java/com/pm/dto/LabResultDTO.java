package com.pm.dto;

import com.pm.entity.LabResult;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LabResultDTO {
    private Long id;
    private String category;
    private String name;
    private String value;
    private String unit;
    private String refRange;
    private String flag;

    public static LabResultDTO fromEntity(LabResult r) {
        return LabResultDTO.builder()
                .id(r.getId())
                .category(r.getCategory())
                .name(r.getName())
                .value(r.getValue())
                .unit(r.getUnit())
                .refRange(r.getRefRange())
                .flag(r.getFlag())
                .build();
    }
}
