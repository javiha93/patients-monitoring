package com.pm.repository;

import com.pm.entity.SurgicalIntervention;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SurgicalInterventionRepository extends JpaRepository<SurgicalIntervention, Long> {
    List<SurgicalIntervention> findByPatientIdOrderByInterventionDateDesc(Long patientId);
}
