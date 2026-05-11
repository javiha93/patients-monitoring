package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "devices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_id", nullable = false)
    private Admission admission;

    @Column(nullable = false)
    private String category; // vascular, gastrointestinal, elimination

    @Column(nullable = false)
    private String type; // via_periferica, via_central, picc, linea_arterial, sng, sonda_vesical

    private String gauge; // calibre

    private String location; // plexo_derecho, plexo_izquierdo, mano_derecha, mano_izquierda, brazo_derecho, brazo_izquierdo

    private Integer lumens; // luces (sonda vesical)

    private String material; // SNG: pvc, poliuretano, silicona | SV: latex, silicona

    // Drain-specific fields (redon, jackson_pratt)
    @Column(name = "drain_number")
    private Integer drainNumber; // auto-assigned sequential number

    private String region; // cabeza, cuello, torax, abdomen, pelvis, extremidades

    @Column(name = "sub_region")
    private String subRegion; // for abdomen: hipocondrio_dcho, epigastrio, etc.

    private String laterality; // izquierda, derecha, bilateral, medial

    @Column(name = "inserted_at", nullable = false)
    private LocalDateTime insertedAt;

    @Column(name = "removed_at")
    private LocalDateTime removedAt;

    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
