
package com.example.recruitment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewInvitationResponse {

    private Long id;

    private Long applicationId;

    private Long positionId;

    private String positionName;

    private String candidateName;

    private String candidatePhone;

    private LocalDateTime interviewTime;

    private String interviewLocation;

    private String interviewerName;

    private String interviewerPhone;

    private Integer status;

    private String statusDesc;

    private Long invitedBy;

    private String invitedByName;

    private LocalDateTime invitedAt;

    private LocalDateTime confirmedAt;

    private Integer candidateConfirmed;

    private String candidateConfirmedDesc;

    private String noShowReason;

    private String remark;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private CandidateApplicationResponse application;

    private List<SystemLogResponse> operationLogs;
}
