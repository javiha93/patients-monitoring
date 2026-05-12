package com.pm.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InsightDismissalDTO {
    private Long id;
    private Long admissionId;
    private String analysisType;
    private String title;
    private String detail;
    private String level;
    private String reason;
    private String dismissedBy;
    private LocalDateTime dismissedAt;
}
