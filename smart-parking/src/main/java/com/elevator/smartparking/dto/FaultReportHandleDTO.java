package com.elevator.smartparking.dto;

import lombok.Data;

@Data
public class FaultReportHandleDTO {

    private Long handlerId;

    private String content;

    private String remark;

    private String solution;
}
