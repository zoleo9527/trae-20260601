package com.security.survey.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RemarkDTO {
    private Long id;
    private String content;
    private String sourceType;
    private Long sourceId;
    private Boolean inherited;
    private String createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
}
