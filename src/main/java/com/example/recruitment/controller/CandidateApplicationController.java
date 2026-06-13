
package com.example.recruitment.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.recruitment.dto.request.CandidateApplicationCreateRequest;
import com.example.recruitment.dto.request.CandidateApplicationQueryRequest;
import com.example.recruitment.dto.request.CandidateApplicationStatusRequest;
import com.example.recruitment.dto.request.CandidateApplicationUpdateRequest;
import com.example.recruitment.dto.response.ApiResponse;
import com.example.recruitment.dto.response.CandidateApplicationResponse;
import com.example.recruitment.dto.response.PageResponse;
import com.example.recruitment.service.CandidateApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class CandidateApplicationController {

    private final CandidateApplicationService candidateApplicationService;

    @PostMapping
    public ResponseEntity<ApiResponse<CandidateApplicationResponse>> create(
            @Valid @RequestBody CandidateApplicationCreateRequest request) {
        CandidateApplicationResponse response = candidateApplicationService.create(request);
        return ResponseEntity.ok(ApiResponse.success("报名成功", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CandidateApplicationResponse>> getById(@PathVariable Long id) {
        CandidateApplicationResponse response = candidateApplicationService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CandidateApplicationResponse>>> query(
            CandidateApplicationQueryRequest request) {
        IPage<CandidateApplicationResponse> page = candidateApplicationService.query(request);
        PageResponse<CandidateApplicationResponse> response = PageResponse.of(
                page.getRecords(),
                page.getTotal(),
                (int) page.getCurrent(),
                (int) page.getSize()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CandidateApplicationResponse>> update(
            @PathVariable Long id,
            @RequestBody CandidateApplicationUpdateRequest request) {
        CandidateApplicationResponse response = candidateApplicationService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("更新成功", response));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CandidateApplicationResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody CandidateApplicationStatusRequest request) {
        CandidateApplicationResponse response = candidateApplicationService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("状态更新成功", response));
    }

    @GetMapping("/today-pending")
    public ResponseEntity<ApiResponse<List<CandidateApplicationResponse>>> getTodayPending() {
        List<CandidateApplicationResponse> response = candidateApplicationService.getTodayPending();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/timeout")
    public ResponseEntity<ApiResponse<List<CandidateApplicationResponse>>> getTimeoutApplications() {
        List<CandidateApplicationResponse> response = candidateApplicationService.getTimeoutApplications();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/recently-rejected")
    public ResponseEntity<ApiResponse<List<CandidateApplicationResponse>>> getRecentlyRejected() {
        List<CandidateApplicationResponse> response = candidateApplicationService.getRecentlyRejected();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
