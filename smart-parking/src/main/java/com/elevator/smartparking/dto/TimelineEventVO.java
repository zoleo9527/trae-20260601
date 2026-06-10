package com.elevator.smartparking.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TimelineEventVO {

    private String eventType;
    private String eventTypeText;
    private String source;
    private LocalDateTime eventTime;
    private Long operatorId;
    private String operatorName;
    private String fromStatus;
    private String fromStatusText;
    private String toStatus;
    private String toStatusText;
    private String title;
    private String content;
    private String remark;
    private Long relatedRecordId;
    private String relatedRecordNo;
}
