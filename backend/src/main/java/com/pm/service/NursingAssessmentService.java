package com.pm.service;

import com.pm.dto.NursingAssessmentDTO;
import com.pm.entity.Admission;
import com.pm.entity.NursingAssessment;
import com.pm.repository.AdmissionRepository;
import com.pm.repository.NursingAssessmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NursingAssessmentService {

    private final NursingAssessmentRepository repository;
    private final AdmissionRepository admissionRepository;

    public List<NursingAssessmentDTO> getByAdmission(Long admissionId) {
        return repository.findByAdmissionIdOrderByRecordedAtDesc(admissionId)
                .stream().map(NursingAssessmentDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public NursingAssessmentDTO create(NursingAssessmentDTO dto) {
        Admission admission = admissionRepository.findById(dto.getAdmissionId())
                .orElseThrow(() -> new RuntimeException("Admission not found"));

        NursingAssessment entity = NursingAssessment.builder()
                .admission(admission)
                .recordedAt(dto.getRecordedAt())
                .assessmentType(dto.getAssessmentType())
                .consciousness(dto.getConsciousness())
                .glasgowScore(dto.getGlasgowScore())
                .hasPain(dto.getHasPain())
                .painLocation(dto.getPainLocation())
                .painIrradiation(dto.getPainIrradiation())
                .painType(dto.getPainType())
                .nutrition(dto.getNutrition())
                .vomitingType(dto.getVomitingType())
                .vomitingAmount(dto.getVomitingAmount())
                .aspirationRisk(dto.getAspirationRisk())
                .mood(dto.getMood())
                .physicalCognitive(dto.getPhysicalCognitive())
                .sensoryBlindness(dto.getSensoryBlindness())
                .sensoryDeafness(dto.getSensoryDeafness())
                .sensoryAphasia(dto.getSensoryAphasia())
                .sensoryDysarthria(dto.getSensoryDysarthria())
                .physicalDisability(dto.getPhysicalDisability())
                .cognitiveObservations(dto.getCognitiveObservations())
                .urinePattern(dto.getUrinePattern())
                .stoolPattern(dto.getStoolPattern())
                .urinaryIncontinence(dto.getUrinaryIncontinence())
                .fecalIncontinence(dto.getFecalIncontinence())
                .hasDiaper(dto.getHasDiaper())
                .hasOstomy(dto.getHasOstomy())
                .hasUrinaryCatheter(dto.getHasUrinaryCatheter())
                .hasCollector(dto.getHasCollector())
                .breathingPattern(dto.getBreathingPattern())
                .dyspneaLevel(dto.getDyspneaLevel())
                .coughType(dto.getCoughType())
                .expectoration(dto.getExpectoration())
                .homeOxygen(dto.getHomeOxygen())
                .homeCpap(dto.getHomeCpap())
                .mobility(dto.getMobility())
                .mobilityDetails(dto.getMobilityDetails())
                .bedRails(dto.getBedRails())
                .restraintAbdominal(dto.getRestraintAbdominal())
                .restraintLegs(dto.getRestraintLegs())
                .restraintArms(dto.getRestraintArms())
                .familyInformed(dto.getFamilyInformed())
                .patientInformed(dto.getPatientInformed())
                .fallRisk(dto.getFallRisk())
                .selfHarmRisk(dto.getSelfHarmRisk())
                .elopementRisk(dto.getElopementRisk())
                .notes(dto.getNotes())
                .recordedBy(dto.getRecordedBy())
                .build();

        return NursingAssessmentDTO.fromEntity(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
