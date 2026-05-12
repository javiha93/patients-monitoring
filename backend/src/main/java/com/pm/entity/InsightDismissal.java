package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "insight_dismissals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InsightDismissal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_id", nullable = false)
    private Admission admission;

    /** Matches ClinicalInsightDTO.analysisType (e.g. "allergy_conflict") */
    @Column(name = "analysis_type", nullable = false)
    private String analysisType;

    /** Original insight title at time of dismissal */
    @Column(nullable = false)
    private String title;

    /** Original insight detail at time of dismissal */
    @Column(length = 2000)
    private String detail;

    /** Original insight level (critical / warning / info) */
    @Column(nullable = false)
    private String level;

    /** Free-text reason provided by the nurse */
    @Column(nullable = false, length = 2000)
    private String reason;

    @Column(name = "dismissed_by", nullable = false)
    private String dismissedBy;

    @Column(name = "dismissed_at", nullable = false)
    private LocalDateTime dismissedAt;

    @PrePersist
    protected void onCreate() {
        if (dismissedAt == null) dismissedAt = LocalDateTime.now();
    }
}
