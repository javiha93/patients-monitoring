package com.pm.service;

import com.pm.dto.*;
import com.pm.entity.*;
import com.pm.repository.*;
import com.pm.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VitalSignService {

    private final VitalSignRepository vitalSignRepository;
    private final AdmissionRepository admissionRepository;
    private final DeviceRepository deviceRepository;

    public List<VitalSignDTO> getByAdmission(Long admissionId) {
        return vitalSignRepository.findByAdmissionIdOrderByRecordedAtAsc(admissionId)
                .stream()
                .map(VitalSignDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Paginated vitals from previous admissions (excluding excludeAdmissionId).
     */
    public Map<String, Object> getHistorical(Long patientId, Long excludeAdmissionId, int page, int size) {
        Page<VitalSign> result = vitalSignRepository.findHistoricalByPatient(patientId, excludeAdmissionId, PageRequest.of(page, size));
        Map<String, Object> response = new HashMap<>();
        response.put("content", result.getContent().stream().map(VitalSignDTO::fromEntity).collect(Collectors.toList()));
        response.put("hasMore", result.hasNext());
        return response;
    }

    /**
     * Get vitals from all admissions of a patient (for baseline calculation).
     */
    public List<VitalSignDTO> getAllByPatient(Long patientId) {
        List<Admission> admissions = admissionRepository.findByPatientIdOrderByAdmissionDateDesc(patientId);
        return admissions.stream()
                .flatMap(a -> vitalSignRepository.findByAdmissionIdOrderByRecordedAtAsc(a.getId()).stream())
                .map(VitalSignDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public VitalSignDTO create(CreateVitalSignRequest req) {
        Admission admission = admissionRepository.findById(req.getAdmissionId())
                .orElseThrow(() -> new RuntimeException("Admission not found: " + req.getAdmissionId()));

        VitalSign vs = VitalSign.builder()
                .admission(admission)
                .recordedAt(req.getRecordedAt())
                .systolicBp(req.getSystolicBp())
                .diastolicBp(req.getDiastolicBp())
                .heartRate(req.getHeartRate())
                .spo2(req.getSpo2())
                .respiratoryRate(req.getRespiratoryRate())
                .temperature(req.getTemperature())
                .painLevel(req.getPainLevel())
                .bloodGlucose(req.getBloodGlucose())
                .diuresis(req.getDiuresis())
                .urineSource(req.getUrineSource())
                .diaperAmount(req.getDiaperAmount())
                .notes(req.getNotes())
                .recordedBy(req.getRecordedBy())
                .build();

        if (req.getConsciousnessLevel() != null && !req.getConsciousnessLevel().isBlank()) {
            vs.setConsciousnessLevel(VitalSign.ConsciousnessLevel.valueOf(req.getConsciousnessLevel()));
        }

        vs = vitalSignRepository.save(vs);

        // Respiratory support
        if (req.getDeviceType() != null && !req.getDeviceType().isBlank() && !req.getDeviceType().equals("none")) {
            RespiratorySupport rs = RespiratorySupport.builder()
                    .vitalSign(vs)
                    .deviceType(RespiratorySupport.DeviceType.valueOf(req.getDeviceType()))
                    .flowRate(req.getFlowRate())
                    .fio2(req.getFio2())
                    .peep(req.getPeep())
                    .ipap(req.getIpap())
                    .epap(req.getEpap())
                    .tidalVolume(req.getTidalVolume())
                    .respiratoryRateSet(req.getRespiratoryRateSet())
                    .build();
            vs.setRespiratorySupport(rs);
            vitalSignRepository.save(vs);
        }

        // Drain outputs
        saveDrainOutputs(vs, req.getDrainOutputs());

        return VitalSignDTO.fromEntity(vs);
    }

    @Transactional
    public VitalSignDTO update(Long id, CreateVitalSignRequest req) {
        VitalSign vs = vitalSignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("VitalSign not found: " + id));

        vs.setRecordedAt(req.getRecordedAt());
        vs.setSystolicBp(req.getSystolicBp());
        vs.setDiastolicBp(req.getDiastolicBp());
        vs.setHeartRate(req.getHeartRate());
        vs.setSpo2(req.getSpo2());
        vs.setRespiratoryRate(req.getRespiratoryRate());
        vs.setTemperature(req.getTemperature());
        vs.setPainLevel(req.getPainLevel());
        vs.setBloodGlucose(req.getBloodGlucose());
        vs.setDiuresis(req.getDiuresis());
        vs.setUrineSource(req.getUrineSource());
        vs.setDiaperAmount(req.getDiaperAmount());
        vs.setNotes(req.getNotes());

        if (req.getConsciousnessLevel() != null && !req.getConsciousnessLevel().isBlank()) {
            vs.setConsciousnessLevel(VitalSign.ConsciousnessLevel.valueOf(req.getConsciousnessLevel()));
        } else {
            vs.setConsciousnessLevel(null);
        }

        // Update respiratory support
        if (req.getDeviceType() != null && !req.getDeviceType().isBlank() && !req.getDeviceType().equals("none")) {
            RespiratorySupport rs = vs.getRespiratorySupport();
            if (rs == null) {
                rs = RespiratorySupport.builder().vitalSign(vs).build();
            }
            rs.setDeviceType(RespiratorySupport.DeviceType.valueOf(req.getDeviceType()));
            rs.setFlowRate(req.getFlowRate());
            rs.setFio2(req.getFio2());
            rs.setPeep(req.getPeep());
            rs.setIpap(req.getIpap());
            rs.setEpap(req.getEpap());
            rs.setTidalVolume(req.getTidalVolume());
            rs.setRespiratoryRateSet(req.getRespiratoryRateSet());
            vs.setRespiratorySupport(rs);
        } else if (vs.getRespiratorySupport() != null) {
            vs.setRespiratorySupport(null);
        }

        vs = vitalSignRepository.save(vs);

        // Drain outputs
        saveDrainOutputs(vs, req.getDrainOutputs());

        return VitalSignDTO.fromEntity(vs);
    }

    private void saveDrainOutputs(VitalSign vs, java.util.List<DrainOutputDTO> dtos) {
        if (vs.getDrainOutputs() == null) {
            vs.setDrainOutputs(new java.util.ArrayList<>());
        }
        vs.getDrainOutputs().clear();
        if (dtos != null) {
            for (DrainOutputDTO dto : dtos) {
                Device device = deviceRepository.findById(dto.getDeviceId())
                    .orElseThrow(() -> new RuntimeException("Device not found: " + dto.getDeviceId()));
                DrainOutput output = DrainOutput.builder()
                    .vitalSign(vs)
                    .device(device)
                    .drainNumber(dto.getDrainNumber())
                    .outputMl(dto.getOutputMl())
                    .fluidType(dto.getFluidType())
                    .vacuumActive(dto.getVacuumActive() != null ? dto.getVacuumActive() : true)
                    .build();
                vs.getDrainOutputs().add(output);
            }
            vitalSignRepository.save(vs);
        }
    }

    @Transactional
    public void delete(Long id) {
        if (!vitalSignRepository.existsById(id)) {
            throw new RuntimeException("VitalSign not found: " + id);
        }
        vitalSignRepository.deleteById(id);
    }
}
