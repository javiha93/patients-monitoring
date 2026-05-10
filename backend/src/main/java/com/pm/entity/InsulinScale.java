package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "insulin_scales")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InsulinScale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private AdmissionPrescription prescription;

    @Column(name = "glycemia_min", nullable = false)
    private Integer glycemiaMin;

    @Column(name = "glycemia_max", nullable = false)
    private Integer glycemiaMax;

    @Column(name = "dose_ui", nullable = false)
    private Integer doseUi;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
