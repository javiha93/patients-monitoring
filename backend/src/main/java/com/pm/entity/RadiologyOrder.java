package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "radiology_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RadiologyOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_id", nullable = false)
    private Admission admission;

    /** "xray", "ct", or "mri" */
    @Column(nullable = false)
    private String type;

    /** Body region, e.g. "torax", "abdomen", "rodilla_izq" */
    @Column(name = "body_region", nullable = false)
    private String bodyRegion;

    /** Projection for X-ray (e.g. "PA", "Lateral"), null for CT/MRI */
    private String projection;

    /** Whether contrast is requested (CT/MRI) */
    @Column(nullable = false)
    private boolean contrast;

    /** "normal" or "urgente" */
    @Column(nullable = false)
    private String priority;

    /** "pending" or "completed" */
    @Column(nullable = false)
    private String status;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "requested_by")
    private String requestedBy;

    @Column(name = "completed_by")
    private String completedBy;

    @Column(length = 500)
    private String notes;

    /** Base64-encoded image/report data */
    @Column(name = "image_data", columnDefinition = "TEXT")
    private String imageData;

    @Column(name = "image_type")
    private String imageType;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
