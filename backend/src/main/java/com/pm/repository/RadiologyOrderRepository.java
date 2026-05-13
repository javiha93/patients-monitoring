package com.pm.repository;

import com.pm.entity.RadiologyOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface RadiologyOrderRepository extends JpaRepository<RadiologyOrder, Long> {
    List<RadiologyOrder> findByAdmissionIdOrderByRequestedAtDesc(Long admissionId);
    List<RadiologyOrder> findByAdmissionIdInAndStatus(List<Long> admissionIds, String status);
    List<RadiologyOrder> findByAdmissionIdInAndStatusAndCompletedAtAfter(List<Long> admissionIds, String status, LocalDateTime after);
    List<RadiologyOrder> findByAdmissionPatientIdAndAdmissionIdNotOrderByRequestedAtDesc(Long patientId, Long excludeAdmissionId);
}
