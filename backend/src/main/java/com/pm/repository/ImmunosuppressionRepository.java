package com.pm.repository;

import com.pm.entity.ImmunosuppressionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ImmunosuppressionRepository extends JpaRepository<ImmunosuppressionHistory, Long> {
    List<ImmunosuppressionHistory> findByPatientIdOrderByEventDateDesc(Long patientId);
}
