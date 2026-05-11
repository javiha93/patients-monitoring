package com.pm.service;

import com.pm.dto.DeviceDTO;
import com.pm.entity.Admission;
import com.pm.entity.Device;
import com.pm.repository.AdmissionRepository;
import com.pm.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepo;
    private final AdmissionRepository admissionRepo;

    public List<DeviceDTO> getByAdmission(Long admissionId) {
        return deviceRepo.findByAdmissionIdOrderByInsertedAtDesc(admissionId)
            .stream().map(DeviceDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public DeviceDTO create(DeviceDTO dto) {
        Admission admission = admissionRepo.findById(dto.getAdmissionId())
            .orElseThrow(() -> new RuntimeException("Admission not found"));
        Device device = Device.builder()
            .admission(admission)
            .category(dto.getCategory())
            .type(dto.getType())
            .gauge(dto.getGauge())
            .location(dto.getLocation())
            .lumens(dto.getLumens())
            .material(dto.getMaterial())
            .region(dto.getRegion())
            .subRegion(dto.getSubRegion())
            .laterality(dto.getLaterality())
            .insertedAt(dto.getInsertedAt())
            .removedAt(dto.getRemovedAt())
            .notes(dto.getNotes())
            .build();

        // Auto-assign drain number for drain types
        if (isDrainType(dto.getType())) {
            int nextNumber = getNextDrainNumber(dto.getAdmissionId());
            device.setDrainNumber(nextNumber);
        }

        return DeviceDTO.fromEntity(deviceRepo.save(device));
    }

    @Transactional
    public DeviceDTO update(Long id, DeviceDTO dto) {
        Device device = deviceRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Device not found"));
        device.setGauge(dto.getGauge());
        device.setLocation(dto.getLocation());
        device.setLumens(dto.getLumens());
        device.setMaterial(dto.getMaterial());
        device.setRegion(dto.getRegion());
        device.setSubRegion(dto.getSubRegion());
        device.setLaterality(dto.getLaterality());
        device.setInsertedAt(dto.getInsertedAt());
        device.setRemovedAt(dto.getRemovedAt());
        device.setNotes(dto.getNotes());
        return DeviceDTO.fromEntity(deviceRepo.save(device));
    }

    @Transactional
    public void delete(Long id) {
        deviceRepo.deleteById(id);
    }

    private boolean isDrainType(String type) {
        return "redon".equals(type) || "jackson_pratt".equals(type);
    }

    private int getNextDrainNumber(Long admissionId) {
        List<Device> allDevices = deviceRepo.findByAdmissionIdOrderByInsertedAtDesc(admissionId);
        return allDevices.stream()
            .filter(d -> isDrainType(d.getType()) && d.getDrainNumber() != null)
            .mapToInt(Device::getDrainNumber)
            .max()
            .orElse(0) + 1;
    }

    public List<DeviceDTO> getActiveDrains(Long admissionId) {
        return deviceRepo.findByAdmissionIdAndRemovedAtIsNull(admissionId).stream()
            .filter(d -> isDrainType(d.getType()))
            .sorted((a, b) -> Integer.compare(
                a.getDrainNumber() != null ? a.getDrainNumber() : 0,
                b.getDrainNumber() != null ? b.getDrainNumber() : 0))
            .map(DeviceDTO::fromEntity)
            .collect(Collectors.toList());
    }

    public boolean hasActiveByType(Long admissionId, String type) {
        return deviceRepo.existsByAdmissionIdAndTypeAndRemovedAtIsNull(admissionId, type);
    }

    /**
     * Retire all active vascular devices for an admission (called on discharge).
     */
    @Transactional
    public void retireVascularDevices(Long admissionId) {
        List<Device> active = deviceRepo.findByAdmissionIdAndCategoryAndRemovedAtIsNull(admissionId, "vascular");
        LocalDateTime now = LocalDateTime.now();
        for (Device d : active) {
            d.setRemovedAt(now);
        }
        deviceRepo.saveAll(active);
    }
}
