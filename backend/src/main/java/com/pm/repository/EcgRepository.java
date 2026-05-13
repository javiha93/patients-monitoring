package com.pm.repository;

import com.pm.entity.Ecg;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EcgRepository extends JpaRepository<Ecg, Long> {
    List<Ecg> findByAdmissionIdOrderByRequestedAtDesc(Long admissionId);
    List<Ecg> findByAdmissionIdInAndStatus(List<Long> admissionIds, String status);
    List<Ecg> findByAdmissionIdInAndStatusAndCompletedAtAfter(List<Long> admissionIds, String status, java.time.LocalDateTime after);
    /** Historical: ECGs from other admissions of the same patient */
    List<Ecg> findByAdmissionPatientIdAndAdmissionIdNotOrderByRequestedAtDesc(Long patientId, Long excludeAdmissionId);
}
