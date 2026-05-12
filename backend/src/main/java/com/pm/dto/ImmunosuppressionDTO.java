package com.pm.dto;

import com.pm.entity.ImmunosuppressionHistory;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ImmunosuppressionDTO {
    private Long id;
    private String description;
    private LocalDate eventDate;
    private LocalDate endDate;
    private String notes;

    public static ImmunosuppressionDTO fromEntity(ImmunosuppressionHistory e) {
        return ImmunosuppressionDTO.builder()
                .id(e.getId())
                .description(e.getDescription())
                .eventDate(e.getEventDate())
                .endDate(e.getEndDate())
                .notes(e.getNotes())
                .build();
    }
}
