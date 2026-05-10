package com.pm.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SignAdministrationRequest {
    @NotNull
    private Long prescriptionId;

    @NotNull
    private LocalDateTime administeredAt;

    private String signedBy;
    private String doseGiven;
    private String note;
}
