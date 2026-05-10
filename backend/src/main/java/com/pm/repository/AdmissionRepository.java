package com.pm.repository;

import com.pm.entity.Admission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AdmissionRepository extends JpaRepository<Admission, Long> {
    List<Admission> findByPatientIdAndStatus(Long patientId, Admission.Status status);
    List<Admission> findByStatus(Admission.Status status);
    List<Admission> findByPatientIdOrderByAdmissionDateDesc(Long patientId);
}
