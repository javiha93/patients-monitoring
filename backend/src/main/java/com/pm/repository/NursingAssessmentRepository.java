package com.pm.repository;

import com.pm.entity.NursingAssessment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface NursingAssessmentRepository extends JpaRepository<NursingAssessment, Long> {
    List<NursingAssessment> findByAdmissionIdOrderByRecordedAtDesc(Long admissionId);

    @Query("SELECT n FROM NursingAssessment n WHERE n.admission.patient.id = :patientId AND n.admission.id <> :excludeAdmissionId ORDER BY n.recordedAt DESC")
    Page<NursingAssessment> findHistoricalByPatient(Long patientId, Long excludeAdmissionId, Pageable pageable);

    @Query("SELECT n FROM NursingAssessment n WHERE n.admission.patient.id = :patientId AND n.admission.id <> :excludeAdmissionId ORDER BY n.recordedAt DESC")
    List<NursingAssessment> findAllHistoricalByPatient(Long patientId, Long excludeAdmissionId);
}
