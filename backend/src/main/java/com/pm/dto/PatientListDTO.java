package com.pm.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Lightweight DTO for the patient list view.
 * Includes active admission info inline.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientListDTO {
    private Long id;
    private String nhc;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private String sex;

    // From active admission
    private Long admissionId;
    private Integer triageLevel;
    private String matCategory;
    private LocalDateTime admissionDate;
    private String location;
    private String specialty;
    private String status;

    /** Pending lab validation info — null if no pending tests */
    private List<PendingLabInfo> pendingLabs;

    /** True if the patient has at least one pending ECG */
    private boolean hasPendingEcg;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PendingLabInfo {
        private LocalDateTime requestedAt;
        /** JSON array of requested parameter codes */
        private String requestedParameters;
        /** JSON array of already-validated sample keys (null if none) */
        private String validatedSamples;
    }
}
