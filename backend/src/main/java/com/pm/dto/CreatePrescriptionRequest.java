package com.pm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreatePrescriptionRequest {
    @NotNull
    private Long admissionId;

    @NotBlank
    private String name;

    private String amount;
    private String unit;
    private String route;
    private String frequency;

    @NotBlank
    private String category;

    private String conditionText;
    private String scheduledHours;
    private String prescribedBy;

    // For insulin prescriptions
    private List<InsulinScaleDTO> insulinScales;
}
