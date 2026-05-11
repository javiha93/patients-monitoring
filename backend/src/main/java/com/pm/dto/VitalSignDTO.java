package com.pm.dto;

import com.pm.entity.VitalSign;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VitalSignDTO {
    private Long id;
    private Long admissionId;
    private LocalDateTime recordedAt;
    private Integer heartRate;
    private Integer systolicBp;
    private Integer diastolicBp;
    private Double temperature;
    private Integer spo2;
    private Integer respiratoryRate;
    private String consciousnessLevel;
    private Integer painLevel;
    private Integer bloodGlucose;
    private String notes;
    private RespiratorySupportDTO respiratorySupport;

    public static VitalSignDTO fromEntity(VitalSign v) {
        VitalSignDTO dto = VitalSignDTO.builder()
                .id(v.getId())
                .admissionId(v.getAdmission().getId())
                .recordedAt(v.getRecordedAt())
                .heartRate(v.getHeartRate())
                .systolicBp(v.getSystolicBp())
                .diastolicBp(v.getDiastolicBp())
                .temperature(v.getTemperature())
                .spo2(v.getSpo2())
                .respiratoryRate(v.getRespiratoryRate())
                .consciousnessLevel(v.getConsciousnessLevel() != null ? v.getConsciousnessLevel().name() : null)
                .painLevel(v.getPainLevel())
                .bloodGlucose(v.getBloodGlucose())
                .notes(v.getNotes())
                .build();
        if (v.getRespiratorySupport() != null) {
            dto.setRespiratorySupport(RespiratorySupportDTO.fromEntity(v.getRespiratorySupport()));
        }
        return dto;
    }
}
