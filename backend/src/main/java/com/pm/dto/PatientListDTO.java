package com.pm.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Lightweight DTO for the patient list view.
 * Includes active admission info inline.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientListDTO {
    private Long id;
    private String nhc;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private String sex;

    // From active admission
    private Long admissionId;
    private Integer triageLevel;
    private String matCategory;
    private LocalDateTime admissionDate;
    private String location;
    private String specialty;
    private String status;
}
