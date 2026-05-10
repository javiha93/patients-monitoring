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
}
