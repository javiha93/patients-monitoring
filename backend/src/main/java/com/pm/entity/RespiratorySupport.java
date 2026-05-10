package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "respiratory_support")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RespiratorySupport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vital_sign_id", nullable = false, unique = true)
    private VitalSign vitalSign;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false)
    private DeviceType deviceType;

    @Column(name = "flow_rate")
    private Double flowRate;

    private Double fio2;
    private Double peep;
    private Double ipap;
    private Double epap;

    @Column(name = "tidal_volume")
    private Double tidalVolume;

    @Column(name = "respiratory_rate_set")
    private Integer respiratoryRateSet;

    public enum DeviceType {
        none, nasal_cannula, ventimax, reservoir_mask,
        cpap, bipap, high_flow_cannula, mechanical_ventilation
    }
}
