package com.pm.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreateVitalSignRequest {
    @NotNull
    private Long admissionId;

    @NotNull
    private LocalDateTime recordedAt;

    private Integer systolicBp;

    private Integer diastolicBp;

    private Integer heartRate;

    private Integer spo2;

    private Integer respiratoryRate;
    private Double temperature;
    private Integer painLevel;
    private String consciousnessLevel;
    private Integer bloodGlucose;
    private Integer diuresis;
    private String notes;

    // Respiratory support (optional)
    private String deviceType;
    private Double flowRate;
    private Double fio2;
    private Double peep;
    private Double ipap;
    private Double epap;
    private Double tidalVolume;
    private Integer respiratoryRateSet;
}
