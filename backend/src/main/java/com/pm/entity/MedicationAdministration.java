package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medication_administrations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicationAdministration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private AdmissionPrescription prescription;

    @Column(name = "administered_at", nullable = false)
    private LocalDateTime administeredAt;

    @Column(name = "signed_by", nullable = false)
    private String signedBy;

    @Column(name = "dose_given")
    private String doseGiven;

    private String note;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
