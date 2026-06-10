package com.elevator.smartparking.dto;

import lombok.Data;
import java.util.List;

@Data
public class RescueTodoItemVO {

    private Long id;
    private String rescueNo;
    private Long elevatorId;
    private String elevatorNo;
    private Long faultReportId;
    private String faultReportNo;
    private Integer trappedCount;
    private String trappedFloor;
    private String status;
    private String statusText;
    private Long rescuerId;
    private String rescuerName;
    private String initialRemark;
    private java.time.LocalDateTime reportTime;
    private java.time.LocalDateTime arrivalTime;
    private List<ActionItemVO> nextActions;
}
