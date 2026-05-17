package com.pm.service;

import com.pm.dto.RadiologyOrderDTO;
import com.pm.entity.Admission;
import com.pm.entity.RadiologyOrder;
import com.pm.repository.AdmissionRepository;
import com.pm.repository.RadiologyOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RadiologyService {

    private final RadiologyOrderRepository repo;
    private final AdmissionRepository admissionRepo;

    public List<RadiologyOrderDTO> getByAdmission(Long admissionId) {
        return repo.findByAdmissionIdOrderByRequestedAtDesc(admissionId)
                .stream().map(RadiologyOrderDTO::fromEntitySummary).collect(Collectors.toList());
    }

    public List<RadiologyOrderDTO> getHistorical(Long patientId, Long excludeAdmissionId) {
        return repo.findByAdmissionPatientIdAndAdmissionIdNotOrderByRequestedAtDesc(patientId, excludeAdmissionId)
                .stream().map(RadiologyOrderDTO::fromEntitySummary).collect(Collectors.toList());
    }

    public RadiologyOrderDTO getById(Long id) {
        return RadiologyOrderDTO.fromEntity(repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Radiology order not found")));
    }

    @Transactional
    public RadiologyOrderDTO create(RadiologyOrderDTO dto) {
        Admission admission = admissionRepo.findById(dto.getAdmissionId())
                .orElseThrow(() -> new RuntimeException("Admission not found"));
        RadiologyOrder order = RadiologyOrder.builder()
                .admission(admission)
                .type(dto.getType())
                .bodyRegion(dto.getBodyRegion())
                .projection(dto.getProjection())
                .contrast(dto.isContrast())
                .priority(dto.getPriority() != null ? dto.getPriority() : "normal")
                .status("pending")
                .requestedAt(dto.getRequestedAt() != null ? dto.getRequestedAt() : LocalDateTime.now())
                .requestedBy(dto.getRequestedBy())
                .notes(dto.getNotes())
                .build();
        return RadiologyOrderDTO.fromEntitySummary(repo.save(order));
    }

    @Transactional
    public RadiologyOrderDTO markInProgress(Long id) {
        RadiologyOrder order = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Radiology order not found"));
        order.setStatus("in_progress");
        return RadiologyOrderDTO.fromEntitySummary(repo.save(order));
    }

    @Transactional
    public RadiologyOrderDTO complete(Long id, String completedBy, String imageData, String imageType, String notes) {
        RadiologyOrder order = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Radiology order not found"));
        order.setStatus("completed");
        order.setCompletedAt(LocalDateTime.now());
        order.setCompletedBy(completedBy);
        order.setImageData(imageData);
        order.setImageType(imageType != null ? imageType : "image/png");
        if (notes != null) order.setNotes(notes);
        return RadiologyOrderDTO.fromEntity(repo.save(order));
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }
}
