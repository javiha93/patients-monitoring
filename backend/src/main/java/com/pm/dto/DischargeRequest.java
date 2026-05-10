package com.pm.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class DischargeRequest {
    private LocalDateTime dischargeDate;
    private String observations;
}
