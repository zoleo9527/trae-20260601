package com.parking.dto;

import lombok.Data;

@Data
public class RemoteReleaseQuery {

    private String status;
    private Long gateId;
    private String plateNumber;
    private String requestedBy;
    private String startTime;
    private String endTime;
    private Integer page = 0;
    private Integer size = 20;
}
