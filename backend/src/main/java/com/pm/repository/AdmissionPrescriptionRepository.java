package com.pm.repository;

import com.pm.entity.AdmissionPrescription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AdmissionPrescriptionRepository extends JpaRepository<AdmissionPrescription, Long> {
    List<AdmissionPrescription> findByAdmissionIdAndActiveTrue(Long admissionId);
    List<AdmissionPrescription> findByAdmissionId(Long admissionId);
}
