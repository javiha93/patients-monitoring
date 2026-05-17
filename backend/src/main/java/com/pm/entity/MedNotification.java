package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "med_notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedNotification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "prescription_id", nullable = false)
    private Long prescriptionId;

    @Column(name = "admission_id", nullable = false)
    private Long admissionId;

    /** Username of the user this notification is for */
    @Column(nullable = false)
    private String username;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean seen;
}
