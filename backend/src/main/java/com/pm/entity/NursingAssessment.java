package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "nursing_assessments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NursingAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_id", nullable = false)
    private Admission admission;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @Column(name = "assessment_type")
    private String assessmentType; // entrada, sucesiva, salida

    // ── Consciencia ──
    private String consciousness; // alerta, somnoliento, estuporoso, comatoso
    @Column(name = "glasgow_score")
    private Integer glasgowScore;

    // ── Dolor ──
    @Column(name = "has_pain")
    private Boolean hasPain;
    @Column(name = "pain_location")
    private String painLocation;
    @Column(name = "pain_irradiation")
    private String painIrradiation;
    @Column(name = "pain_type")
    private String painType; // agudo, crónico, neuropático, visceral

    // ── Alimentación ──
    private String nutrition; // sin_alteraciones, nauseas, disfagia, sng, ostomia
    @Column(name = "vomiting_type")
    private String vomitingType; // alimenticio, bilioso, hemático, fecaloideo
    @Column(name = "vomiting_amount")
    private String vomitingAmount; // escaso, moderado, abundante
    @Column(name = "aspiration_risk")
    private Boolean aspirationRisk;

    // ── Estado anímico ──
    private String mood; // tranquilo, ansioso, agitado, deprimido, agresivo

    // ── Estado físico y cognitivo ──
    @Column(name = "physical_cognitive")
    private String physicalCognitive; // orientado, desorientado, confuso, demencia
    @Column(name = "sensory_blindness")
    private Boolean sensoryBlindness;
    @Column(name = "sensory_deafness")
    private Boolean sensoryDeafness;
    @Column(name = "sensory_aphasia")
    private Boolean sensoryAphasia;
    @Column(name = "sensory_dysarthria")
    private Boolean sensoryDysarthria;
    @Column(name = "physical_disability")
    private Boolean physicalDisability;
    @Column(name = "cognitive_observations")
    private String cognitiveObservations;

    // ── Eliminación ──
    @Column(name = "urine_pattern")
    private String urinePattern; // normal, oliguria, anuria, poliuria, hematuria
    @Column(name = "stool_pattern")
    private String stoolPattern; // normal, diarrea, estreñimiento, melenas, rectorragia
    @Column(name = "urinary_incontinence")
    private Boolean urinaryIncontinence;
    @Column(name = "fecal_incontinence")
    private Boolean fecalIncontinence;
    // Dispositivos: bolquer(pañal), ostomia, sonda_vesical, colector
    @Column(name = "has_diaper")
    private Boolean hasDiaper;
    @Column(name = "has_ostomy")
    private Boolean hasOstomy;
    @Column(name = "has_urinary_catheter")
    private Boolean hasUrinaryCatheter;
    @Column(name = "has_collector")
    private Boolean hasCollector;

    // ── Respiración ──
    @Column(name = "breathing_pattern")
    private String breathingPattern; // normal, taquipnea, bradipnea, apnea
    @Column(name = "dyspnea_level")
    private String dyspneaLevel; // ninguna, reposo, esfuerzo
    @Column(name = "cough_type")
    private String coughType; // ninguna, seca, productiva
    @Column(name = "expectoration")
    private String expectoration; // ninguna, mucosa, purulenta, hemoptoica
    @Column(name = "home_oxygen")
    private Boolean homeOxygen;
    @Column(name = "home_cpap")
    private Boolean homeCpap;

    // ── Movilidad ──
    private String mobility; // sin_alteraciones, alteracion_aguda, alteracion_cronica
    @Column(name = "mobility_details")
    private String mobilityDetails;

    // ── Seguridad ──
    @Column(name = "bed_rails")
    private Boolean bedRails;
    @Column(name = "restraint_abdominal")
    private Boolean restraintAbdominal;
    @Column(name = "restraint_legs")
    private Boolean restraintLegs;
    @Column(name = "restraint_arms")
    private Boolean restraintArms;
    @Column(name = "family_informed")
    private Boolean familyInformed;
    @Column(name = "patient_informed")
    private Boolean patientInformed;
    @Column(name = "fall_risk")
    private Boolean fallRisk;
    @Column(name = "self_harm_risk")
    private Boolean selfHarmRisk;
    @Column(name = "elopement_risk")
    private Boolean elopementRisk;

    // ── Meta ──
    @Column(name = "notes", length = 2000)
    private String notes;

    @Column(name = "recorded_by")
    private String recordedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
