package com.pm.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClinicalInsightDTO {
    private String level;         // critical, warning, info
    private String title;
    private String detail;
    private String reasoning;
    private String analysisType;  // allergy_conflict, nephrotoxicity, baseline_deviation, etc.
}
