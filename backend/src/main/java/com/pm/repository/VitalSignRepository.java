package com.pm.repository;

import com.pm.entity.VitalSign;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VitalSignRepository extends JpaRepository<VitalSign, Long> {
    List<VitalSign> findByAdmissionIdOrderByRecordedAtAsc(Long admissionId);
}
