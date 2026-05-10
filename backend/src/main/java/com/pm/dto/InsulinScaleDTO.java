package com.pm.dto;

import com.pm.entity.InsulinScale;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InsulinScaleDTO {
    private Long id;
    private Integer glycemiaMin;
    private Integer glycemiaMax;
    private Integer doseUi;
    private Integer sortOrder;

    public static InsulinScaleDTO fromEntity(InsulinScale is) {
        return InsulinScaleDTO.builder()
                .id(is.getId())
                .glycemiaMin(is.getGlycemiaMin())
                .glycemiaMax(is.getGlycemiaMax())
                .doseUi(is.getDoseUi())
                .sortOrder(is.getSortOrder())
                .build();
    }
}
