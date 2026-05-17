package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "admissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Admission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "admission_date", nullable = false)
    private LocalDateTime admissionDate;

    @Column(name = "discharge_date")
    private LocalDateTime dischargeDate;

    @Column(name = "triage_level")
    private Integer triageLevel;

    @Column(name = "mat_category")
    private String matCategory;

    private String location;

    private String specialty;

    @Column(length = 500)
    private String observations;

    @Column(name = "assigned_nurse")
    private String assignedNurse;

    @Column(name = "assigned_doctor")
    private String assignedDoctor;

    @Column(name = "previous_nurse")
    private String previousNurse;

    @Column(name = "previous_doctor")
    private String previousDoctor;

    /** Marked as admitted (pending hospital bed assignment) */
    @Column(columnDefinition = "boolean default false")
    @Builder.Default
    private boolean admitted = false;

    @Column(name = "bed_number")
    private String bedNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "admission", cascade = CascadeType.ALL)
    @Builder.Default
    private List<VitalSign> vitalSigns = new ArrayList<>();

    @OneToMany(mappedBy = "admission", cascade = CascadeType.ALL)
    @Builder.Default
    private List<AdmissionPrescription> prescriptions = new ArrayList<>();

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status { active, discharged }
}
