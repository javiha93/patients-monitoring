package com.pm.dto;

import com.pm.entity.Patient;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientDTO {
    private Long id;
    private String nhc;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private String sex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Active admission info (if any)
    private AdmissionSummaryDTO activeAdmission;

    public static PatientDTO fromEntity(Patient p) {
        return PatientDTO.builder()
                .id(p.getId())
                .nhc(p.getNhc())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .birthDate(p.getBirthDate())
                .sex(p.getSex() != null ? p.getSex().name() : null)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
