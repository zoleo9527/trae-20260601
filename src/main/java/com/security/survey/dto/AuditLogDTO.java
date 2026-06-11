package com.security.survey.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AuditLogDTO {
    private Long id;
    private String action;
    private String targetType;
    private Long targetId;
    private String oldValue;
    private String newValue;
    private String detail;
    private String performedBy;
    private String performedByName;
    private LocalDateTime performedAt;
    private String ipAddress;
}
