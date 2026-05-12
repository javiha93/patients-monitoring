package com.pm.dto;

import com.pm.entity.SurgicalIntervention;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SurgicalInterventionDTO {
    private Long id;
    private String description;
    private LocalDate interventionDate;
    private String notes;

    public static SurgicalInterventionDTO fromEntity(SurgicalIntervention e) {
        return SurgicalInterventionDTO.builder()
                .id(e.getId())
                .description(e.getDescription())
                .interventionDate(e.getInterventionDate())
                .notes(e.getNotes())
                .build();
    }
}
