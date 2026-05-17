package com.pm.repository;

import com.pm.entity.MedNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MedNotificationRepository extends JpaRepository<MedNotification, Long> {

    List<MedNotification> findByUsernameAndSeenFalse(String username);

    @Modifying
    @Query("UPDATE MedNotification n SET n.seen = true WHERE n.username = :username AND n.seen = false")
    void markAllSeenForUser(String username);

    @Modifying
    @Query("UPDATE MedNotification n SET n.seen = true WHERE n.username = :username AND n.admissionId = :admissionId AND n.seen = false")
    void markSeenForUserAndAdmission(String username, Long admissionId);
}
