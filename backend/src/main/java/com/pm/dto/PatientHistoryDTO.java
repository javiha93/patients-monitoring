package com.pm.dto;

import lombok.*;
import java.util.List;

/**
 * Aggregated DTO for the patient history screen (antecedentes + alergias + medicación habitual).
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientHistoryDTO {
    private List<MedicalHistoryDTO> medicalHistory;
    private List<AllergyDTO> allergies;
    private List<MedicationDTO> medications;
    private List<ImmunosuppressionDTO> immunosuppressions;
    private List<SurgicalInterventionDTO> surgicalInterventions;
}
