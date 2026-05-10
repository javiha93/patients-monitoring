package com.pm.dto;

import com.pm.entity.Admission;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdmissionSummaryDTO {
    private Long id;
    private LocalDateTime admissionDate;
    private LocalDateTime dischargeDate;
    private Integer triageLevel;
    private String matCategory;
    private String status;

    public static AdmissionSummaryDTO fromEntity(Admission a) {
        return AdmissionSummaryDTO.builder()
                .id(a.getId())
                .admissionDate(a.getAdmissionDate())
                .dischargeDate(a.getDischargeDate())
                .triageLevel(a.getTriageLevel())
                .matCategory(a.getMatCategory())
                .status(a.getStatus().name())
                .build();
    }
}
