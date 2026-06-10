package com.parking.dto;

import com.parking.entity.SupplementRecord;
import lombok.Data;

import java.time.format.DateTimeFormatter;

@Data
public class SupplementRecordVO {

    private Long id;
    private Long gateFaultId;
    private Long remoteReleaseId;
    private Long gateId;
    private String plateNumber;
    private String supplementType;
    private String content;
    private String operatorName;
    private String operatorRole;
    private String createdAt;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static SupplementRecordVO fromEntity(SupplementRecord entity) {
        SupplementRecordVO vo = new SupplementRecordVO();
        vo.setId(entity.getId());
        vo.setGateFaultId(entity.getGateFault() != null ? entity.getGateFault().getId() : null);
        vo.setRemoteReleaseId(entity.getRemoteRelease() != null ? entity.getRemoteRelease().getId() : null);
        vo.setGateId(entity.getGate() != null ? entity.getGate().getId() : null);
        vo.setPlateNumber(entity.getPlateNumber());
        vo.setSupplementType(entity.getSupplementType());
        vo.setContent(entity.getContent());
        vo.setOperatorName(entity.getOperatorName());
        vo.setOperatorRole(entity.getOperatorRole());
        vo.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(FMT) : null);
        return vo;
    }
}
