package com.pm.dto;

import com.pm.entity.MedicationAdministration;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdministrationDTO {
    private Long id;
    private Long prescriptionId;
    private LocalDateTime administeredAt;
    private String signedBy;
    private String doseGiven;
    private String note;

    public static AdministrationDTO fromEntity(MedicationAdministration ma) {
        return AdministrationDTO.builder()
                .id(ma.getId())
                .prescriptionId(ma.getPrescription().getId())
                .administeredAt(ma.getAdministeredAt())
                .signedBy(ma.getSignedBy())
                .doseGiven(ma.getDoseGiven())
                .note(ma.getNote())
                .build();
    }
}
