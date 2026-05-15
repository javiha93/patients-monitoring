package com.pm.repository;

import com.pm.entity.LabNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LabNotificationRepository extends JpaRepository<LabNotification, Long> {

    List<LabNotification> findByUsernameAndSeenFalse(String username);

    List<LabNotification> findByUsernameAndAdmissionIdAndSeenFalse(String username, Long admissionId);

    @Modifying
    @Query("UPDATE LabNotification n SET n.seen = true WHERE n.username = :username AND n.seen = false")
    void markAllSeenForUser(String username);

    @Modifying
    @Query("UPDATE LabNotification n SET n.seen = true WHERE n.username = :username AND n.admissionId = :admissionId AND n.seen = false")
    void markSeenForUserAndAdmission(String username, Long admissionId);
}
