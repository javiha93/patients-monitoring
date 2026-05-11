package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "drain_outputs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DrainOutput {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vital_sign_id", nullable = false)
    private VitalSign vitalSign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(name = "drain_number", nullable = false)
    private Integer drainNumber;

    @Column(name = "output_ml")
    private Integer outputMl; // débito en mL

    @Column(name = "fluid_type")
    private String fluidType; // seroso, serohematico, hematico

    @Column(name = "vacuum_active")
    private Boolean vacuumActive; // mantiene el vacío (default true)
}
