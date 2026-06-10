package com.parking.dto;

import lombok.Data;

@Data
public class GateFaultQuery {

    private String status;
    private Long gateId;
    private String faultType;
    private String reportedBy;
    private String startTime;
    private String endTime;
    private Integer page = 0;
    private Integer size = 20;
}
