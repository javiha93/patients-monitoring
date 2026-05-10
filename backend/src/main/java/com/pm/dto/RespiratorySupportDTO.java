package com.pm.dto;

import com.pm.entity.RespiratorySupport;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RespiratorySupportDTO {
    private Long id;
    private String deviceType;
    private Double flowRate;
    private Double fio2;
    private Double peep;
    private Double ipap;
    private Double epap;
    private Double tidalVolume;
    private Integer respiratoryRateSet;

    public static RespiratorySupportDTO fromEntity(RespiratorySupport rs) {
        return RespiratorySupportDTO.builder()
                .id(rs.getId())
                .deviceType(rs.getDeviceType().name())
                .flowRate(rs.getFlowRate())
                .fio2(rs.getFio2())
                .peep(rs.getPeep())
                .ipap(rs.getIpap())
                .epap(rs.getEpap())
                .tidalVolume(rs.getTidalVolume())
                .respiratoryRateSet(rs.getRespiratoryRateSet())
                .build();
    }
}
