package com.pm.repository;

import com.pm.entity.NursingAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NursingAssessmentRepository extends JpaRepository<NursingAssessment, Long> {
    List<NursingAssessment> findByAdmissionIdOrderByRecordedAtDesc(Long admissionId);
}
