package com.pm.dto;

import com.pm.entity.AdmissionPrescription;
import lombok.*;
import java.util.List;
import java.util.stream.Collectors;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrescriptionDTO {
    private Long id;
    private Long admissionId;
    private String name;
    private String amount;
    private String unit;
    private String route;
    private String frequency;
    private String category;
    private String conditionText;
    private String scheduledHours;
    private Boolean active;
    private String prescribedBy;
    private List<AdministrationDTO> administrations;
    private List<InsulinScaleDTO> insulinScales;

    public static PrescriptionDTO fromEntity(AdmissionPrescription p) {
        return PrescriptionDTO.builder()
                .id(p.getId())
                .admissionId(p.getAdmission().getId())
                .name(p.getName())
                .amount(p.getAmount())
                .unit(p.getUnit())
                .route(p.getRoute())
                .frequency(p.getFrequency())
                .category(p.getCategory().name())
                .conditionText(p.getConditionText())
                .scheduledHours(p.getScheduledHours())
                .active(p.getActive())
                .prescribedBy(p.getPrescribedBy())
                .administrations(p.getAdministrations() != null
                        ? p.getAdministrations().stream().map(AdministrationDTO::fromEntity).collect(Collectors.toList())
                        : List.of())
                .insulinScales(p.getInsulinScales() != null
                        ? p.getInsulinScales().stream().map(InsulinScaleDTO::fromEntity).collect(Collectors.toList())
                        : List.of())
                .build();
    }
}
