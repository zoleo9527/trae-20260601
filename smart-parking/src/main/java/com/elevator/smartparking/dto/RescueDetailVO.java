package com.elevator.smartparking.dto;

import com.elevator.smartparking.entity.HandleRecord;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class RescueDetailVO {

    private Long id;
    private String rescueNo;
    private Long elevatorId;
    private String elevatorNo;
    private Long faultReportId;
    private String faultReportNo;
    private String faultType;
    private String faultDescription;
    private String faultHandlerName;
    private String faultRemark;
    private String faultSolution;
    private String faultTransferRemark;
    private String faultTransferOperatorName;
    private java.time.LocalDateTime faultTransferTime;
    private Integer trappedCount;
    private String trappedFloor;
    private String reporterName;
    private String reporterPhone;
    private String status;
    private String statusText;
    private java.time.LocalDateTime reportTime;
    private java.time.LocalDateTime arrivalTime;
    private java.time.LocalDateTime rescuedTime;
    private java.time.LocalDateTime completeTime;
    private Long rescuerId;
    private String rescuerName;
    private String rescueProcess;
    private String entrapmentReason;
    private Boolean hasInjury;
    private String injuryDescription;
    private String solution;
    private String remark;
    private String initialRemark;
    private String exportStatus;
    private String exportStatusText;
    private Integer attachmentCount;
    private String notificationStatus;
    private String notificationStatusText;
    private java.time.LocalDateTime createTime;
    private java.time.LocalDateTime updateTime;
    private List<HandleRecord> records;

    private List<TimelineEventVO> timeline;
    private List<Map<String, Object>> remarkChain;
    private List<HandleRecord> faultRecords;
}
