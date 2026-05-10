package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "admission_prescriptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdmissionPrescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_id", nullable = false)
    private Admission admission;

    @Column(nullable = false)
    private String name;

    private String amount;
    private String unit;
    private String route;
    private String frequency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Column(name = "condition_text")
    private String conditionText;

    @Column(name = "scheduled_hours")
    private String scheduledHours; // stored as comma-separated ints

    @Builder.Default
    private Boolean active = true;

    @Column(name = "prescribed_by")
    private String prescribedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL)
    @Builder.Default
    private List<MedicationAdministration> administrations = new ArrayList<>();

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL)
    @Builder.Default
    private List<InsulinScale> insulinScales = new ArrayList<>();

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL)
    @Builder.Default
    private List<PrescriptionDoseHistory> doseHistory = new ArrayList<>();

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Category { fixed, conditional, fluids, insulin }
}
