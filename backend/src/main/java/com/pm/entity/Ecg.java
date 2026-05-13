package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ecgs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ecg {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_id", nullable = false)
    private Admission admission;

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

    private String notes;

    /** Base64-encoded image data (stored as TEXT/LOB) */
    @Column(name = "image_data", columnDefinition = "TEXT")
    @Lob
    private String imageData;

    /** MIME type of the image, e.g. "image/png" */
    @Column(name = "image_type")
    private String imageType;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
