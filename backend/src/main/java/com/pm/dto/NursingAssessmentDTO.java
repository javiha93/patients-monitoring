package com.pm.dto;

import com.pm.entity.NursingAssessment;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NursingAssessmentDTO {
    private Long id;
    private Long admissionId;
    private LocalDateTime recordedAt;
    private String assessmentType;

    // Consciencia
    private String consciousness;
    private Integer glasgowScore;

    // Dolor
    private Boolean hasPain;
    private String painLocation;
    private String painIrradiation;
    private String painType;

    // Alimentación
    private String nutrition;
    private String vomitingType;
    private String vomitingAmount;
    private Boolean aspirationRisk;

    // Estado anímico
    private String mood;

    // Estado físico y cognitivo
    private String physicalCognitive;
    private Boolean sensoryBlindness;
    private Boolean sensoryDeafness;
    private Boolean sensoryAphasia;
    private Boolean sensoryDysarthria;
    private Boolean physicalDisability;
    private String cognitiveObservations;

    // Eliminación
    private String urinePattern;
    private String stoolPattern;
    private Boolean urinaryIncontinence;
    private Boolean fecalIncontinence;
    private Boolean hasDiaper;
    private Boolean hasOstomy;
    private Boolean hasUrinaryCatheter;
    private Boolean hasCollector;

    // Respiración
    private String breathingPattern;
    private String dyspneaLevel;
    private String coughType;
    private String expectoration;
    private Boolean homeOxygen;
    private Boolean homeCpap;

    // Movilidad
    private String mobility;
    private String mobilityDetails;

    // Seguridad
    private Boolean bedRails;
    private Boolean restraintAbdominal;
    private Boolean restraintLegs;
    private Boolean restraintArms;
    private Boolean familyInformed;
    private Boolean patientInformed;
    private Boolean fallRisk;
    private Boolean selfHarmRisk;
    private Boolean elopementRisk;

    // Meta
    private String notes;
    private String recordedBy;
    private LocalDateTime createdAt;

    public static NursingAssessmentDTO fromEntity(NursingAssessment e) {
        return NursingAssessmentDTO.builder()
                .id(e.getId())
                .admissionId(e.getAdmission().getId())
                .recordedAt(e.getRecordedAt())
                .assessmentType(e.getAssessmentType())
                .consciousness(e.getConsciousness())
                .glasgowScore(e.getGlasgowScore())
                .hasPain(e.getHasPain())
                .painLocation(e.getPainLocation())
                .painIrradiation(e.getPainIrradiation())
                .painType(e.getPainType())
                .nutrition(e.getNutrition())
                .vomitingType(e.getVomitingType())
                .vomitingAmount(e.getVomitingAmount())
                .aspirationRisk(e.getAspirationRisk())
                .mood(e.getMood())
                .physicalCognitive(e.getPhysicalCognitive())
                .sensoryBlindness(e.getSensoryBlindness())
                .sensoryDeafness(e.getSensoryDeafness())
                .sensoryAphasia(e.getSensoryAphasia())
                .sensoryDysarthria(e.getSensoryDysarthria())
                .physicalDisability(e.getPhysicalDisability())
                .cognitiveObservations(e.getCognitiveObservations())
                .urinePattern(e.getUrinePattern())
                .stoolPattern(e.getStoolPattern())
                .urinaryIncontinence(e.getUrinaryIncontinence())
                .fecalIncontinence(e.getFecalIncontinence())
                .hasDiaper(e.getHasDiaper())
                .hasOstomy(e.getHasOstomy())
                .hasUrinaryCatheter(e.getHasUrinaryCatheter())
                .hasCollector(e.getHasCollector())
                .breathingPattern(e.getBreathingPattern())
                .dyspneaLevel(e.getDyspneaLevel())
                .coughType(e.getCoughType())
                .expectoration(e.getExpectoration())
                .homeOxygen(e.getHomeOxygen())
                .homeCpap(e.getHomeCpap())
                .mobility(e.getMobility())
                .mobilityDetails(e.getMobilityDetails())
                .bedRails(e.getBedRails())
                .restraintAbdominal(e.getRestraintAbdominal())
                .restraintLegs(e.getRestraintLegs())
                .restraintArms(e.getRestraintArms())
                .familyInformed(e.getFamilyInformed())
                .patientInformed(e.getPatientInformed())
                .fallRisk(e.getFallRisk())
                .selfHarmRisk(e.getSelfHarmRisk())
                .elopementRisk(e.getElopementRisk())
                .notes(e.getNotes())
                .recordedBy(e.getRecordedBy())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
