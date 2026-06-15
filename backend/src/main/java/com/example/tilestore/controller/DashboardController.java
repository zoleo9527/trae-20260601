package com.example.tilestore.controller;

import com.example.tilestore.common.ApiResponse;
import com.example.tilestore.dto.response.MeasurementRecordResponse;
import com.example.tilestore.dto.response.QuotationResponse;
import com.example.tilestore.dto.response.TodoStatsResponse;
import com.example.tilestore.service.DashboardService;
import com.example.tilestore.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserService userService;

    @GetMapping("/todo-stats")
    public ApiResponse<TodoStatsResponse> getTodoStats() {
        userService.getCurrentUser();
        TodoStatsResponse response = dashboardService.getTodoStats();
        return ApiResponse.success(response);
    }

    @GetMapping("/todo/assign-measurements")
    public ApiResponse<List<MeasurementRecordResponse>> getPendingAssignMeasurements() {
        userService.checkPermission("SALESMAN", "ADMIN");
        List<MeasurementRecordResponse> response = dashboardService.getPendingAssignMeasurements();
        return ApiResponse.success(response);
    }

    @GetMapping("/todo/complete-measurements")
    public ApiResponse<List<MeasurementRecordResponse>> getPendingCompleteMeasurements() {
        userService.checkPermission("DESIGNER", "ADMIN");
        List<MeasurementRecordResponse> response = dashboardService.getPendingCompleteMeasurements();
        return ApiResponse.success(response);
    }

    @GetMapping("/todo/submit-quotations")
    public ApiResponse<List<QuotationResponse>> getPendingSubmitQuotations() {
        userService.checkPermission("DESIGNER", "ADMIN");
        List<QuotationResponse> response = dashboardService.getPendingSubmitQuotations();
        return ApiResponse.success(response);
    }

    @GetMapping("/todo/approve-quotations")
    public ApiResponse<List<QuotationResponse>> getPendingApproveQuotations() {
        userService.checkPermission("ADMIN");
        List<QuotationResponse> response = dashboardService.getPendingApproveQuotations();
        return ApiResponse.success(response);
    }
}