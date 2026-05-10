package com.pm.repository;

import com.pm.entity.PrescriptionDoseHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrescriptionDoseHistoryRepository extends JpaRepository<PrescriptionDoseHistory, Long> {
}
