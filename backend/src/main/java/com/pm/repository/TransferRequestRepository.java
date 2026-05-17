package com.pm.repository;

import com.pm.entity.TransferRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TransferRequestRepository extends JpaRepository<TransferRequest, Long> {

    List<TransferRequest> findByAdmissionIdOrderByRequestedAtDesc(Long admissionId);

    Optional<TransferRequest> findByAdmissionId(Long admissionId);

    @Query("SELECT COALESCE(MAX(t.queuePosition), 0) FROM TransferRequest t")
    int findMaxQueuePosition();

    @Query("SELECT t FROM TransferRequest t JOIN FETCH t.admission ORDER BY t.queuePosition")
    List<TransferRequest> findAllOrderByQueuePosition();
}
