package com.pm.dto;

import com.pm.entity.DrainOutput;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DrainOutputDTO {
    private Long id;
    private Long deviceId;
    private Integer drainNumber;
    private Integer outputMl;
    private String fluidType;
    private Boolean vacuumActive;

    public static DrainOutputDTO fromEntity(DrainOutput d) {
        return DrainOutputDTO.builder()
            .id(d.getId())
            .deviceId(d.getDevice().getId())
            .drainNumber(d.getDrainNumber())
            .outputMl(d.getOutputMl())
            .fluidType(d.getFluidType())
            .vacuumActive(d.getVacuumActive())
            .build();
    }
}
