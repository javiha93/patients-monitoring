package com.pm.repository;

import com.pm.entity.LabTest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LabTestRepository extends JpaRepository<LabTest, Long> {
    List<LabTest> findByAdmissionIdOrderByRequestedAtDesc(Long admissionId);
    /** Only return top-level tests (not children from partial validation splits) */
    List<LabTest> findByAdmissionIdAndParentIsNullOrderByRequestedAtDesc(Long admissionId);
    /** Pending validation tests across multiple admissions (for patient list indicator) */
    List<LabTest> findByAdmissionIdInAndStatusAndParentIsNull(List<Long> admissionIds, String status);
    /** Check if any non-pending tests exist for these admissions */
    List<LabTest> findByAdmissionIdInAndStatusNotAndParentIsNull(List<Long> admissionIds, String status);
    Optional<LabTest> findByExternalId(String externalId);
    boolean existsByExternalId(String externalId);
    /** Historical: labs from other admissions of the same patient */
    List<LabTest> findByAdmissionPatientIdAndAdmissionIdNotAndParentIsNullOrderByRequestedAtDesc(Long patientId, Long excludeAdmissionId);
}
