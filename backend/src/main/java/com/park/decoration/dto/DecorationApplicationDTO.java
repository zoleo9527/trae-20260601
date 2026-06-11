package com.park.decoration.dto;

import com.park.decoration.enums.ApplicationStatus;
import com.park.decoration.enums.PriorityLevel;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DecorationApplicationDTO {

    private Long id;
    private String applicationNo;
    private String idempotentKey;
    private String companyName;
    private String contactPerson;
    private String contactPhone;
    private String parkName;
    private String buildingNo;
    private String roomNo;
    private Double decorationArea;
    private String decorationScope;
    private LocalDateTime plannedStartDate;
    private LocalDateTime plannedEndDate;
    private String constructionCompany;
    private String constructionContact;
    private String constructionPhone;
    private ApplicationStatus status;
    private PriorityLevel priority;
    private String remark;
    private String assignedHandler;
    private String reviewOpinion;
    private LocalDateTime reviewedAt;
    private String reviewedBy;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
    private Integer version;
    private Boolean hasActivePermit;
    private Integer unresolvedExceptionCount;
    private Long stuckHours;
}
