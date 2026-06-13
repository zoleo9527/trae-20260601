
package com.example.recruitment.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.recruitment.dto.request.InterviewInvitationCreateRequest;
import com.example.recruitment.dto.request.InterviewInvitationQueryRequest;
import com.example.recruitment.dto.request.InterviewInvitationStatusRequest;
import com.example.recruitment.dto.response.ApiResponse;
import com.example.recruitment.dto.response.InterviewInvitationResponse;
import com.example.recruitment.dto.response.PageResponse;
import com.example.recruitment.service.InterviewInvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InterviewInvitationController {

    private final InterviewInvitationService interviewInvitationService;

    @PostMapping
    public ResponseEntity<ApiResponse<InterviewInvitationResponse>> create(
            @Valid @RequestBody InterviewInvitationCreateRequest request) {
        InterviewInvitationResponse response = interviewInvitationService.create(request);
        return ResponseEntity.ok(ApiResponse.success("面试邀约创建成功", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InterviewInvitationResponse>> getById(@PathVariable Long id) {
        InterviewInvitationResponse response = interviewInvitationService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<InterviewInvitationResponse>>> query(
            InterviewInvitationQueryRequest request) {
        IPage<InterviewInvitationResponse> page = interviewInvitationService.query(request);
        PageResponse<InterviewInvitationResponse> response = PageResponse.of(
                page.getRecords(),
                page.getTotal(),
                (int) page.getCurrent(),
                (int) page.getSize()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<InterviewInvitationResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody InterviewInvitationStatusRequest request) {
        InterviewInvitationResponse response = interviewInvitationService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("状态更新成功", response));
    }

    @GetMapping("/today-pending")
    public ResponseEntity<ApiResponse<List<InterviewInvitationResponse>>> getTodayPending() {
        List<InterviewInvitationResponse> response = interviewInvitationService.getTodayPending();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/timeout")
    public ResponseEntity<ApiResponse<List<InterviewInvitationResponse>>> getTimeoutInvitations() {
        List<InterviewInvitationResponse> response = interviewInvitationService.getTimeoutInvitations();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/recently-rejected")
    public ResponseEntity<ApiResponse<List<InterviewInvitationResponse>>> getRecentlyRejected() {
        List<InterviewInvitationResponse> response = interviewInvitationService.getRecentlyRejected();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/no-show")
    public ResponseEntity<ApiResponse<List<InterviewInvitationResponse>>> getNoShowInvitations() {
        List<InterviewInvitationResponse> response = interviewInvitationService.getNoShowInvitations();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<ApiResponse<List<InterviewInvitationResponse>>> getByApplicationId(
            @PathVariable Long applicationId) {
        List<InterviewInvitationResponse> response = interviewInvitationService.getByApplicationId(applicationId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
