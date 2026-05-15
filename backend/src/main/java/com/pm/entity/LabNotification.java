package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lab_notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LabNotification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lab_test_id", nullable = false)
    private Long labTestId;

    @Column(name = "admission_id", nullable = false)
    private Long admissionId;

    /** Username of the user this notification is for */
    @Column(nullable = false)
    private String username;

    /** Type of status change: "partial_results" or "completed" */
    @Column(name = "change_type", nullable = false)
    private String changeType;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean seen;
}
