package com.pm.repository;

import com.pm.entity.MedicationAdministration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicationAdministrationRepository extends JpaRepository<MedicationAdministration, Long> {
    List<MedicationAdministration> findByPrescriptionIdOrderByAdministeredAtAsc(Long prescriptionId);
}
