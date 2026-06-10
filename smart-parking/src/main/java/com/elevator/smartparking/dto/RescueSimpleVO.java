package com.elevator.smartparking.dto;

import lombok.Data;

@Data
public class RescueSimpleVO {
    private Long id;
    private String rescueNo;
    private String status;
    private String statusText;
    private Integer trappedCount;
    private java.time.LocalDateTime createTime;
}
