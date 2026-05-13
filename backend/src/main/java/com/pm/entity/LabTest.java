package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lab_tests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LabTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_id", nullable = false)
    private Admission admission;

    /** "analitica" or "cultivo" */
    @Column(nullable = false)
    private String category;

    /** Human-readable label, e.g. "Hemograma + Bioquímica", "Hemocultivo x2" */
    @Column(nullable = false)
    private String label;

    /** Status: pending_validation, pending_receipt, in_progress, partial_results, results */
    @Column(nullable = false)
    private String status;

    /** Unique identifier assigned during validation (e.g. lab barcode) */
    @Column(name = "external_id", unique = true)
    private String externalId;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Column(name = "requested_by")
    private String requestedBy;

    @Column(name = "validated_by")
    private String validatedBy;

    private String notes;

    /** JSON array of requested parameter codes, e.g. ["hemograma","bioquimica_basica"] */
    @Column(name = "requested_parameters", length = 2000)
    private String requestedParameters;

    /** Sample type: sangre, orina, esputo, heces */
    @Column(name = "sample_type")
    private String sampleType;

    /** JSON array of sample keys already validated, e.g. ["tubo_bioquimica","orina"] */
    @Column(name = "validated_samples", length = 2000)
    private String validatedSamples;

    /** Parent test ID — set on child tests created by partial validation splits */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private LabTest parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @OrderBy("validatedAt ASC")
    @Builder.Default
    private List<LabTest> children = new ArrayList<>();

    @OneToMany(mappedBy = "labTest", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("category, name")
    @Builder.Default
    private List<LabResult> results = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
