package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "glycemia_readings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GlycemiaReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_id", nullable = false)
    private Admission admission;

    @Column(name = "value_mgdl", nullable = false)
    private Integer valueMgdl;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @Column(name = "recorded_by")
    private String recordedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "administration_id")
    private MedicationAdministration administration;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
