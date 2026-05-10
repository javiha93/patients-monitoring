package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vital_signs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VitalSign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_id", nullable = false)
    private Admission admission;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @Column(name = "heart_rate")
    private Integer heartRate;

    @Column(name = "systolic_bp")
    private Integer systolicBp;

    @Column(name = "diastolic_bp")
    private Integer diastolicBp;

    private Double temperature;

    private Integer spo2;

    @Column(name = "respiratory_rate")
    private Integer respiratoryRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "consciousness_level")
    private ConsciousnessLevel consciousnessLevel;

    @Column(name = "pain_level")
    private Integer painLevel;

    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "vitalSign", cascade = CascadeType.ALL)
    private RespiratorySupport respiratorySupport;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum ConsciousnessLevel { alerta, verbal, dolor, no_responde }
}
