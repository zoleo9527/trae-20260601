package com.elevator.smartparking.dto;

import lombok.Data;
import java.util.List;

@Data
public class FaultTodoItemVO {

    private Long id;
    private String reportNo;
    private Long elevatorId;
    private String elevatorNo;
    private String faultType;
    private String faultDescription;
    private String status;
    private String statusText;
    private Long handlerId;
    private String handlerName;
    private Boolean hasEntrapment;
    private Integer entrapmentCount;
    private String remark;
    private java.time.LocalDateTime createTime;
    private java.time.LocalDateTime acceptTime;
    private List<ActionItemVO> nextActions;
}
