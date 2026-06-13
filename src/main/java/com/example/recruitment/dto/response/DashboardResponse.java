
package com.example.recruitment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private List<CandidateApplicationResponse> todayPendingApplications;

    private List<CandidateApplicationResponse> timeoutApplications;

    private List<CandidateApplicationResponse> recentlyRejectedApplications;

    private List<InterviewInvitationResponse> todayPendingInvitations;

    private List<InterviewInvitationResponse> timeoutInvitations;

    private List<InterviewInvitationResponse> noShowInvitations;
}
