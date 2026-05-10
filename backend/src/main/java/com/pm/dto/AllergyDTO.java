package com.pm.dto;

import com.pm.entity.Allergy;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AllergyDTO {
    private Long id;
    private String type;
    private String substance;
    private String severity;
    private String reaction;
    private LocalDate diagnosedDate;
    private String notes;

    public static AllergyDTO fromEntity(Allergy a) {
        return AllergyDTO.builder()
                .id(a.getId())
                .type(a.getType().name())
                .substance(a.getSubstance())
                .severity(a.getSeverity() != null ? a.getSeverity().name() : null)
                .reaction(a.getReaction())
                .diagnosedDate(a.getDiagnosedDate())
                .notes(a.getNotes()).build();
    }
}
