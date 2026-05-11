package com.pm.service;

import com.pm.dto.*;
import com.pm.entity.*;
import com.pm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VitalSignService {

    private final VitalSignRepository vitalSignRepository;
    private final AdmissionRepository admissionRepository;

    public List<VitalSignDTO> getByAdmission(Long admissionId) {
        return vitalSignRepository.findByAdmissionIdOrderByRecordedAtAsc(admissionId)
                .stream()
                .map(VitalSignDTO::fromEntity)
                .collect(Collectors.toList());
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
                .notes(req.getNotes())
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
        return VitalSignDTO.fromEntity(vs);
    }

    @Transactional
    public void delete(Long id) {
        if (!vitalSignRepository.existsById(id)) {
            throw new RuntimeException("VitalSign not found: " + id);
        }
        vitalSignRepository.deleteById(id);
    }
}
