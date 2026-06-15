package com.example.tilestore.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MeasurementHistoryResponse {

    private Long id;

    private String action;

    private String beforeData;

    private String afterData;

    private String remark;

    private MeasurementRecordResponse.UserResponse operator;

    private LocalDateTime createdAt;
}