package com.pm.service;

import com.pm.dto.EcgDTO;
import com.pm.entity.Admission;
import com.pm.entity.Ecg;
import com.pm.repository.AdmissionRepository;
import com.pm.repository.EcgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EcgService {

    private final EcgRepository ecgRepo;
    private final AdmissionRepository admissionRepo;

    public List<EcgDTO> getByAdmission(Long admissionId) {
        return ecgRepo.findByAdmissionIdOrderByRequestedAtDesc(admissionId)
                .stream().map(EcgDTO::fromEntitySummary).collect(Collectors.toList());
    }

    public EcgDTO getById(Long id) {
        return EcgDTO.fromEntity(ecgRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("ECG not found")));
    }

    @Transactional
    public EcgDTO create(EcgDTO dto) {
        Admission admission = admissionRepo.findById(dto.getAdmissionId())
                .orElseThrow(() -> new RuntimeException("Admission not found"));
        Ecg ecg = Ecg.builder()
                .admission(admission)
                .status("pending")
                .requestedAt(dto.getRequestedAt() != null ? dto.getRequestedAt() : LocalDateTime.now())
                .requestedBy(dto.getRequestedBy())
                .notes(dto.getNotes())
                .build();
        return EcgDTO.fromEntitySummary(ecgRepo.save(ecg));
    }

    @Transactional
    public EcgDTO complete(Long id, String completedBy, String imageData, String imageType, String notes) {
        Ecg ecg = ecgRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("ECG not found"));
        ecg.setStatus("completed");
        ecg.setCompletedAt(LocalDateTime.now());
        ecg.setCompletedBy(completedBy);
        ecg.setImageData(imageData);
        ecg.setImageType(imageType != null ? imageType : "image/png");
        if (notes != null) ecg.setNotes(notes);
        return EcgDTO.fromEntity(ecgRepo.save(ecg));
    }

    @Transactional
    public void delete(Long id) {
        ecgRepo.deleteById(id);
    }
}
