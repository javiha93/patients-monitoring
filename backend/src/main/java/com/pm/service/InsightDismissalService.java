package com.pm.service;

import com.pm.dto.InsightDismissalDTO;
import com.pm.entity.Admission;
import com.pm.entity.InsightDismissal;
import com.pm.entity.Patient;
import com.pm.repository.AdmissionRepository;
import com.pm.repository.InsightDismissalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InsightDismissalService {

    private final InsightDismissalRepository repo;
    private final AdmissionRepository admissionRepo;

    public InsightDismissalDTO dismiss(InsightDismissalDTO dto) {
        Admission admission = admissionRepo.findById(dto.getAdmissionId())
                .orElseThrow(() -> new RuntimeException("Admission not found"));

        InsightDismissal entity = InsightDismissal.builder()
                .admission(admission)
                .analysisType(dto.getAnalysisType())
                .title(dto.getTitle())
                .detail(dto.getDetail())
                .level(dto.getLevel())
                .reason(dto.getReason())
                .dismissedBy(dto.getDismissedBy())
                .dismissedAt(LocalDateTime.now())
                .build();

        entity = repo.save(entity);
        return toDTO(entity);
    }

    public List<InsightDismissalDTO> getByAdmission(Long admissionId) {
        return repo.findByAdmissionId(admissionId).stream()
                .map(this::toDTO)
                .toList();
    }

    /** Returns a summary per admission that has at least one dismissal. */
    public List<Map<String, Object>> getSummaries() {
        List<Long> admissionIds = repo.findDistinctAdmissionIds();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Long admId : admissionIds) {
            Admission adm = admissionRepo.findById(admId).orElse(null);
            if (adm == null) continue;
            Patient p = adm.getPatient();
            List<InsightDismissal> dismissals = repo.findByAdmissionId(admId);

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("admissionId", admId);
            entry.put("patientId", p.getId());
            entry.put("patientName", p.getLastName() + ", " + p.getFirstName());
            entry.put("nhc", p.getNhc());
            entry.put("admissionDate", adm.getAdmissionDate());
            entry.put("status", adm.getStatus().name());
            entry.put("dismissalCount", dismissals.size());
            entry.put("lastDismissedAt", dismissals.stream()
                    .map(InsightDismissal::getDismissedAt)
                    .max(Comparator.naturalOrder()).orElse(null));
            result.add(entry);
        }
        return result;
    }

    private InsightDismissalDTO toDTO(InsightDismissal e) {
        return InsightDismissalDTO.builder()
                .id(e.getId())
                .admissionId(e.getAdmission().getId())
                .analysisType(e.getAnalysisType())
                .title(e.getTitle())
                .detail(e.getDetail())
                .level(e.getLevel())
                .reason(e.getReason())
                .dismissedBy(e.getDismissedBy())
                .dismissedAt(e.getDismissedAt())
                .build();
    }
}
