
package com.example.recruitment.controller;

import com.example.recruitment.dto.response.ApiResponse;
import com.example.recruitment.dto.response.DashboardResponse;
import com.example.recruitment.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        DashboardResponse response = dashboardService.getDashboardData();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
