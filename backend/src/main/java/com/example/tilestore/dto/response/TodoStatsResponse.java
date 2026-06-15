package com.example.tilestore.dto.response;

import lombok.Data;

@Data
public class TodoStatsResponse {

    private Long pendingAssignCount;

    private Long pendingCompleteCount;

    private Long pendingSubmitCount;

    private Long pendingApproveCount;
}