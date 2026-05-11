package com.pm.repository;

import com.pm.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeviceRepository extends JpaRepository<Device, Long> {
    List<Device> findByAdmissionIdOrderByInsertedAtDesc(Long admissionId);

    boolean existsByAdmissionIdAndTypeAndRemovedAtIsNull(Long admissionId, String type);
}
