package com.pm.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "location_status")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LocationStatus {

    @Id
    private String location;

    @Column(nullable = false)
    @Builder.Default
    private boolean clean = true;

    /** Cleaning priority 1-3, only relevant when dirty */
    private Integer priority;
}
