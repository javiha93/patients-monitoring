package com.pm.repository;

import com.pm.entity.VitalSign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface VitalSignRepository extends JpaRepository<VitalSign, Long> {
    List<VitalSign> findByAdmissionIdOrderByRecordedAtAsc(Long admissionId);

    @Query("SELECT v FROM VitalSign v WHERE v.admission.patient.id = :patientId AND v.admission.id <> :excludeAdmissionId ORDER BY v.recordedAt DESC")
    Page<VitalSign> findHistoricalByPatient(Long patientId, Long excludeAdmissionId, Pageable pageable);
}
