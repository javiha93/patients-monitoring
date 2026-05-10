package com.pm.dto;

import com.pm.entity.Medication;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicationDTO {
    private Long id;
    private String name;
    private String dose;
    private String frequency;
    private LocalDate prescribedSince;
    private Boolean suspendedDuringAdmission;

    public static MedicationDTO fromEntity(Medication m) {
        return MedicationDTO.builder()
                .id(m.getId()).name(m.getName())
                .dose(m.getDose()).frequency(m.getFrequency())
                .prescribedSince(m.getPrescribedSince())
                .suspendedDuringAdmission(m.getSuspendedDuringAdmission())
                .build();
    }
}
