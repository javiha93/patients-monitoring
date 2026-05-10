package com.pm.dto;

import com.pm.entity.MedicalHistory;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicalHistoryDTO {
    private Long id;
    private String label;
    private Integer priorityOrder;
    private LocalDate registeredDate;
    private String notes;

    public static MedicalHistoryDTO fromEntity(MedicalHistory mh) {
        return MedicalHistoryDTO.builder()
                .id(mh.getId()).label(mh.getLabel())
                .priorityOrder(mh.getPriorityOrder())
                .registeredDate(mh.getRegisteredDate())
                .notes(mh.getNotes()).build();
    }
}
