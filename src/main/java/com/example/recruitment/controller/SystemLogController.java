package com.example.recruitment.controller;

import com.example.recruitment.dto.response.ApiResponse;
import com.example.recruitment.dto.response.SystemLogResponse;
import com.example.recruitment.service.SystemLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class SystemLogController {

    private final SystemLogService systemLogService;

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<ApiResponse<List<SystemLogResponse>>> getLogsByApplicationId(
            @PathVariable Long applicationId) {
        List<SystemLogResponse> logs = systemLogService.getLogsByApplicationId(applicationId);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/interview/{interviewId}")
    public ResponseEntity<ApiResponse<List<SystemLogResponse>>> getLogsByInterviewId(
            @PathVariable Long interviewId) {
        List<SystemLogResponse> logs = systemLogService.getLogsByInterviewId(interviewId);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/module/{module}")
    public ResponseEntity<ApiResponse<List<SystemLogResponse>>> getLogsByModule(
            @PathVariable String module) {
        List<SystemLogResponse> logs = systemLogService.getLogsByModule(module);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/target/{targetType}/{targetId}")
    public ResponseEntity<ApiResponse<List<SystemLogResponse>>> getLogsByTargetTypeAndId(
            @PathVariable String targetType,
            @PathVariable Long targetId) {
        List<SystemLogResponse> logs = systemLogService.getLogsByTargetTypeAndId(targetType, targetId);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
