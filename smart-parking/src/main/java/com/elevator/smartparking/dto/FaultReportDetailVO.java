package com.elevator.smartparking.dto;

import com.elevator.smartparking.entity.HandleRecord;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class FaultReportDetailVO {

    private Long id;
    private String reportNo;
    private Long elevatorId;
    private String elevatorNo;
    private String faultType;
    private String faultDescription;
    private String reporterName;
    private String reporterPhone;
    private String reportSource;
    private String status;
    private String statusText;
    private Long handlerId;
    private String handlerName;
    private java.time.LocalDateTime acceptTime;
    private java.time.LocalDateTime completeTime;
    private String faultResult;
    private String solution;
    private Boolean hasEntrapment;
    private Integer entrapmentCount;
    private Long transferRescueId;
    private String transferRescueNo;
    private String transferRemark;
    private String transferOperatorName;
    private java.time.LocalDateTime transferTime;
    private String rescueInitialRemark;
    private String rescueLatestProgress;
    private String remark;
    private String exportStatus;
    private String exportStatusText;
    private Integer attachmentCount;
    private String notificationStatus;
    private String notificationStatusText;
    private java.time.LocalDateTime createTime;
    private java.time.LocalDateTime updateTime;
    private List<HandleRecord> records;
    private List<RescueSimpleVO> relatedRescues;

    private List<TimelineEventVO> timeline;
    private List<Map<String, Object>> remarkChain;
    private List<HandleRecord> rescueRecords;
}
