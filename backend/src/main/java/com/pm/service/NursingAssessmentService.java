package com.pm.service;

import com.pm.dto.NursingAssessmentDTO;
import com.pm.entity.Admission;
import com.pm.entity.NursingAssessment;
import com.pm.repository.AdmissionRepository;
import com.pm.repository.NursingAssessmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
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

        // Auto-assign type: first assessment for this admission = "entrada", rest = "sucesiva"
        List<NursingAssessment> existing = repository.findByAdmissionIdOrderByRecordedAtDesc(dto.getAdmissionId());
        String autoType = existing.isEmpty() ? "entrada" : "sucesiva";

        NursingAssessment entity = NursingAssessment.builder()
                .admission(admission)
                .recordedAt(dto.getRecordedAt())
                .assessmentType(autoType)
                .arrivalMode(dto.getArrivalMode())
                .accompanied(dto.getAccompanied())
                .languageBarrier(dto.getLanguageBarrier())
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
    public NursingAssessmentDTO update(Long id, NursingAssessmentDTO dto) {
        NursingAssessment entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assessment not found"));

        entity.setArrivalMode(dto.getArrivalMode());
        entity.setAccompanied(dto.getAccompanied());
        entity.setLanguageBarrier(dto.getLanguageBarrier());
        entity.setConsciousness(dto.getConsciousness());
        entity.setGlasgowScore(dto.getGlasgowScore());
        entity.setHasPain(dto.getHasPain());
        entity.setPainLocation(dto.getPainLocation());
        entity.setPainIrradiation(dto.getPainIrradiation());
        entity.setPainType(dto.getPainType());
        entity.setNutrition(dto.getNutrition());
        entity.setVomitingType(dto.getVomitingType());
        entity.setVomitingAmount(dto.getVomitingAmount());
        entity.setAspirationRisk(dto.getAspirationRisk());
        entity.setMood(dto.getMood());
        entity.setPhysicalCognitive(dto.getPhysicalCognitive());
        entity.setSensoryBlindness(dto.getSensoryBlindness());
        entity.setSensoryDeafness(dto.getSensoryDeafness());
        entity.setSensoryAphasia(dto.getSensoryAphasia());
        entity.setSensoryDysarthria(dto.getSensoryDysarthria());
        entity.setPhysicalDisability(dto.getPhysicalDisability());
        entity.setCognitiveObservations(dto.getCognitiveObservations());
        entity.setUrinePattern(dto.getUrinePattern());
        entity.setStoolPattern(dto.getStoolPattern());
        entity.setUrinaryIncontinence(dto.getUrinaryIncontinence());
        entity.setFecalIncontinence(dto.getFecalIncontinence());
        entity.setHasDiaper(dto.getHasDiaper());
        entity.setHasOstomy(dto.getHasOstomy());
        entity.setHasUrinaryCatheter(dto.getHasUrinaryCatheter());
        entity.setHasCollector(dto.getHasCollector());
        entity.setBreathingPattern(dto.getBreathingPattern());
        entity.setDyspneaLevel(dto.getDyspneaLevel());
        entity.setCoughType(dto.getCoughType());
        entity.setExpectoration(dto.getExpectoration());
        entity.setHomeOxygen(dto.getHomeOxygen());
        entity.setHomeCpap(dto.getHomeCpap());
        entity.setMobility(dto.getMobility());
        entity.setMobilityDetails(dto.getMobilityDetails());
        entity.setBedRails(dto.getBedRails());
        entity.setRestraintAbdominal(dto.getRestraintAbdominal());
        entity.setRestraintLegs(dto.getRestraintLegs());
        entity.setRestraintArms(dto.getRestraintArms());
        entity.setFamilyInformed(dto.getFamilyInformed());
        entity.setPatientInformed(dto.getPatientInformed());
        entity.setFallRisk(dto.getFallRisk());
        entity.setSelfHarmRisk(dto.getSelfHarmRisk());
        entity.setElopementRisk(dto.getElopementRisk());
        entity.setNotes(dto.getNotes());

        return NursingAssessmentDTO.fromEntity(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    /**
     * On discharge: if the most recent assessment was recorded within 2 hours,
     * update its type to "salida".
     */
    @Transactional
    public void markLastAsSalidaIfRecent(Long admissionId) {
        List<NursingAssessment> assessments = repository.findByAdmissionIdOrderByRecordedAtDesc(admissionId);
        if (assessments.isEmpty()) return;

        NursingAssessment last = assessments.get(0);
        Duration elapsed = Duration.between(last.getRecordedAt(), LocalDateTime.now());
        if (elapsed.toHours() < 2) {
            last.setAssessmentType("salida");
            repository.save(last);
        }
    }
}
