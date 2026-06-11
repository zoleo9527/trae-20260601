package com.park.decoration.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OperationLogDTO {

    private Long id;
    private Long applicationId;
    private String applicationNo;
    private String operationType;
    private String fieldName;
    private String oldValue;
    private String newValue;
    private String remark;
    private String operator;
    private LocalDateTime operatedAt;
}
