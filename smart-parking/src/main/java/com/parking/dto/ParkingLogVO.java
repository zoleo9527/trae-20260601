package com.parking.dto;

import com.parking.entity.ParkingLog;
import lombok.Data;

import java.time.format.DateTimeFormatter;

@Data
public class ParkingLogVO {

    private Long id;
    private Long gateFaultId;
    private Long remoteReleaseId;
    private Long gateId;
    private String gateCode;
    private String plateNumber;
    private String eventType;
    private String operatorName;
    private String operatorRole;
    private String eventTime;
    private String detail;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static ParkingLogVO fromEntity(ParkingLog entity) {
        ParkingLogVO vo = new ParkingLogVO();
        vo.setId(entity.getId());
        vo.setGateFaultId(entity.getGateFaultId());
        vo.setRemoteReleaseId(entity.getRemoteReleaseId());
        vo.setGateId(entity.getGate() != null ? entity.getGate().getId() : null);
        vo.setGateCode(entity.getGate() != null ? entity.getGate().getGateCode() : null);
        vo.setPlateNumber(entity.getPlateNumber());
        vo.setEventType(entity.getEventType());
        vo.setOperatorName(entity.getOperatorName());
        vo.setOperatorRole(entity.getOperatorRole());
        vo.setEventTime(entity.getEventTime() != null ? entity.getEventTime().format(FMT) : null);
        vo.setDetail(entity.getDetail());
        return vo;
    }
}
