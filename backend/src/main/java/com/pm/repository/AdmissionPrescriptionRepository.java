package com.pm.repository;

import com.pm.entity.AdmissionPrescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Set;

public interface AdmissionPrescriptionRepository extends JpaRepository<AdmissionPrescription, Long> {
    List<AdmissionPrescription> findByAdmissionIdAndActiveTrue(Long admissionId);
    List<AdmissionPrescription> findByAdmissionId(Long admissionId);

    @Query("SELECT DISTINCT p.admission.id FROM AdmissionPrescription p WHERE p.admission.id IN :admissionIds AND p.active = true")
    Set<Long> findAdmissionIdsWithActivePrescriptions(List<Long> admissionIds);
}
