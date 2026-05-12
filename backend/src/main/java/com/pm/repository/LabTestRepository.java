package com.pm.repository;

import com.pm.entity.LabTest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LabTestRepository extends JpaRepository<LabTest, Long> {
    List<LabTest> findByAdmissionIdOrderByRequestedAtDesc(Long admissionId);
    Optional<LabTest> findByExternalId(String externalId);
    boolean existsByExternalId(String externalId);
}
