package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transfer_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TransferRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_id", nullable = false)
    private Admission admission;

    /** Transport method: silla, camilla, cama */
    @Column(name = "transport_type", nullable = false)
    private String transportType;

    @Column(name = "respiratory_support", columnDefinition = "boolean default false")
    @Builder.Default
    private boolean respiratorySupport = false;

    @Column(name = "monitoring_required", columnDefinition = "boolean default false")
    @Builder.Default
    private boolean monitoringRequired = false;

    @Column(name = "iv_pole_required", columnDefinition = "boolean default false")
    @Builder.Default
    private boolean ivPoleRequired = false;

    /** Global ordering number across all active transfer requests */
    @Column(name = "queue_position", nullable = false)
    private int queuePosition;

    @Column(name = "requested_by")
    private String requestedBy;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @PrePersist
    protected void onCreate() {
        if (requestedAt == null) requestedAt = LocalDateTime.now();
    }
}
