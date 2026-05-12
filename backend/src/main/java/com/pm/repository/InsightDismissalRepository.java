package com.pm.repository;

import com.pm.entity.InsightDismissal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface InsightDismissalRepository extends JpaRepository<InsightDismissal, Long> {

    List<InsightDismissal> findByAdmissionId(Long admissionId);

    boolean existsByAdmissionIdAndAnalysisType(Long admissionId, String analysisType);

    @Query("SELECT DISTINCT d.admission.id FROM InsightDismissal d")
    List<Long> findDistinctAdmissionIds();
}
