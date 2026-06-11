package com.park.decoration.dto;

import lombok.Data;

import java.util.List;

@Data
public class DashboardOverviewDTO {

    private Long totalCount;
    private Long pendingReviewCount;
    private Long underReviewCount;
    private Long stuckCount;
    private Long permitIssuedCount;
    private Long unresolvedExceptionCount;

    private List<DecorationApplicationDTO> pendingList;
    private List<DecorationApplicationDTO> stuckList;
    private List<OperationLogDTO> recentActivities;
    private List<ExceptionNoteDTO> recentUnresolvedExceptions;
}
