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

    @Min(40) @Max(300)
    private Integer systolicBp;

    @Min(20) @Max(200)
    private Integer diastolicBp;

    @Min(20) @Max(300)
    private Integer heartRate;

    @Min(30) @Max(100)
    private Integer spo2;

    @Min(4) @Max(60)
    private Integer respiratoryRate;

    @DecimalMin("30.0") @DecimalMax("43.0")
    private Double temperature;

    @Min(0) @Max(10)
    private Integer painLevel;

    private String consciousnessLevel;

    @Min(10) @Max(700)
    private Integer bloodGlucose;

    @Min(0) @Max(5000)
    private Integer diuresis;
    private String urineSource;
    private String diaperAmount;
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
