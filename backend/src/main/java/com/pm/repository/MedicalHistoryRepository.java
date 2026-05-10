package com.pm.repository;

import com.pm.entity.MedicalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicalHistoryRepository extends JpaRepository<MedicalHistory, Long> {
    List<MedicalHistory> findByPatientIdOrderByPriorityOrderAscRegisteredDateDesc(Long patientId);
}
