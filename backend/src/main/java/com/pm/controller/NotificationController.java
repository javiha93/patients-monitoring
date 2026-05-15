package com.pm.controller;

import com.pm.entity.LabNotification;
import com.pm.repository.LabNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final LabNotificationRepository repo;

    /** Get unseen lab notifications for a user. Returns list of {labTestId, admissionId, changeType}. */
    @GetMapping("/lab/unseen")
    public List<Map<String, Object>> getUnseen(@RequestParam String username) {
        return repo.findByUsernameAndSeenFalse(username).stream()
                .map(n -> Map.<String, Object>of(
                        "id", n.getId(),
                        "labTestId", n.getLabTestId(),
                        "admissionId", n.getAdmissionId(),
                        "changeType", n.getChangeType()
                ))
                .collect(Collectors.toList());
    }

    /** Mark all notifications as seen for a user. Called when returning to patient list. */
    @PostMapping("/lab/mark-seen")
    @Transactional
    public void markAllSeen(@RequestParam String username) {
        repo.markAllSeenForUser(username);
    }

    /** Mark notifications as seen for a specific admission. */
    @PostMapping("/lab/mark-seen/{admissionId}")
    @Transactional
    public void markSeenForAdmission(@PathVariable Long admissionId, @RequestParam String username) {
        repo.markSeenForUserAndAdmission(username, admissionId);
    }
}
