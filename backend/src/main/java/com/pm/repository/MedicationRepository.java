package com.pm.repository;

import com.pm.entity.Medication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicationRepository extends JpaRepository<Medication, Long> {
    List<Medication> findByPatientIdOrderByNameAsc(Long patientId);
}
