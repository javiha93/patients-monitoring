package com.pm.repository;

import com.pm.entity.InsulinScale;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InsulinScaleRepository extends JpaRepository<InsulinScale, Long> {
    List<InsulinScale> findByPrescriptionIdOrderBySortOrderAsc(Long prescriptionId);
}
