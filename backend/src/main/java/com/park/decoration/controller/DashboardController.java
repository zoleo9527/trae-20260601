package com.park.decoration.controller;

import com.park.decoration.dto.ApiResponse;
import com.park.decoration.dto.DashboardOverviewDTO;
import com.park.decoration.service.DecorationApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DecorationApplicationService applicationService;

    @GetMapping("/overview")
    public ApiResponse<DashboardOverviewDTO> getOverview() {
        return ApiResponse.success(applicationService.getDashboardOverview());
    }
}
