package com.pm.repository;

import com.pm.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByNhc(String nhc);
    boolean existsByNhc(String nhc);
}
