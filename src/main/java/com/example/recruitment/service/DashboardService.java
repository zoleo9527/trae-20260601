
package com.example.recruitment.service;

import com.example.recruitment.dto.response.CandidateApplicationResponse;
import com.example.recruitment.dto.response.DashboardResponse;
import com.example.recruitment.dto.response.InterviewInvitationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CandidateApplicationService candidateApplicationService;
    private final InterviewInvitationService interviewInvitationService;

    public DashboardResponse getDashboardData() {
        List<CandidateApplicationResponse> todayPendingApplications = candidateApplicationService.getTodayPending();
        List<CandidateApplicationResponse> timeoutApplications = candidateApplicationService.getTimeoutApplications();
        List<CandidateApplicationResponse> recentlyRejectedApplications = candidateApplicationService.getRecentlyRejected();

        List<InterviewInvitationResponse> todayPendingInvitations = interviewInvitationService.getTodayPending();
        List<InterviewInvitationResponse> timeoutInvitations = interviewInvitationService.getTimeoutInvitations();

        return DashboardResponse.builder()
                .todayPendingApplications(todayPendingApplications)
                .timeoutApplications(timeoutApplications)
                .recentlyRejectedApplications(recentlyRejectedApplications)
                .todayPendingInvitations(todayPendingInvitations)
                .timeoutInvitations(timeoutInvitations)
                .build();
    }
}
