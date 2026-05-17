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
    private String observations;
    private String assignedNurse;
    private String assignedDoctor;
    private String previousNurse;
    private String previousDoctor;
    private String status;

    /** Pending lab validation info — null if no pending tests */
    private List<PendingLabInfo> pendingLabs;

    /** True if the patient has at least one pending ECG */
    private boolean hasPendingEcg;

    /** True if the patient has completed labs in this admission (and no pending) */
    private boolean hasCompletedLabs;

    /** True if the patient has completed ECGs in this admission (and no pending) */
    private boolean hasCompletedEcg;

    /** Recent completed ECGs (last 24h) for tooltip — only when hasCompletedEcg */
    private List<RecentEcgInfo> recentEcgs;

    private boolean hasPendingXray;
    private boolean hasInProgressXray;
    private boolean hasCompletedXray;
    private boolean hasPendingCt;
    private boolean hasInProgressCt;
    private boolean hasCompletedCt;
    private boolean hasPendingMri;
    private boolean hasInProgressMri;
    private boolean hasCompletedMri;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RecentEcgInfo {
        private LocalDateTime completedAt;
        private String completedBy;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PendingLabInfo {
        private LocalDateTime requestedAt;
        /** JSON array of requested parameter codes */
        private String requestedParameters;
        /** JSON array of already-validated sample keys (null if none) */
        private String validatedSamples;
    }
}
