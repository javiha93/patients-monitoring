package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lab_results")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LabResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lab_test_id", nullable = false)
    private LabTest labTest;

    /** Grouping category, e.g. "Hemograma", "Bioquímica", "Coagulación" */
    @Column(nullable = false)
    private String category;

    /** Parameter name, e.g. "Hemoglobina", "Leucocitos", "Glucosa" */
    @Column(nullable = false)
    private String name;

    /** Result value as string to support numeric and text results */
    private String value;

    /** Unit, e.g. "g/dL", "x10³/µL", "mg/dL" */
    private String unit;

    /** Reference range, e.g. "12.0-16.0" */
    @Column(name = "ref_range")
    private String refRange;

    /** "normal", "high", "low", "critical" — null if not yet evaluated */
    private String flag;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
