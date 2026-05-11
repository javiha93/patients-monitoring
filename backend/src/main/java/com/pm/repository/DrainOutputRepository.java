package com.pm.repository;

import com.pm.entity.DrainOutput;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface DrainOutputRepository extends JpaRepository<DrainOutput, Long> {

    /**
     * Get the most recent drain output for each device in an admission,
     * ordered by vital sign recordedAt desc.
     */
    @Query("SELECT do FROM DrainOutput do " +
           "WHERE do.vitalSign.admission.id = :admissionId " +
           "ORDER BY do.vitalSign.recordedAt DESC")
    List<DrainOutput> findLatestByAdmission(Long admissionId);
}
