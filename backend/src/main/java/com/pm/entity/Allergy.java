package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "allergies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Allergy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AllergyType type;

    @Column(nullable = false)
    private String substance;

    @Enumerated(EnumType.STRING)
    private Severity severity;

    private String reaction;

    @Column(name = "diagnosed_date")
    private LocalDate diagnosedDate;

    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum AllergyType { drug, food, environmental, other }
    public enum Severity { mild, moderate, severe, unknown }
}
