package com.pm.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreatePatientRequest {
    @NotBlank
    private String nhc;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    private LocalDate birthDate;

    @NotNull
    private String sex;

    // Admission fields (created together with patient)
    @Min(1) @Max(5)
    private Integer triageLevel;

    private String matCategory;

    private String location;
}
