package com.pm.repository;

import com.pm.entity.Ecg;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EcgRepository extends JpaRepository<Ecg, Long> {
    List<Ecg> findByAdmissionIdOrderByRequestedAtDesc(Long admissionId);
}
