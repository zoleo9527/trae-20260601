package com.park.decoration.controller;

import com.park.decoration.dto.*;
import com.park.decoration.service.DecorationApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
public class DecorationApplicationController {

    private final DecorationApplicationService applicationService;

    @PostMapping
    public ApiResponse<DecorationApplicationDTO> submitApplication(
            @Valid @RequestBody DecorationApplicationRequest request) {
        return applicationService.submitApplication(request);
    }

    @GetMapping("/{id}")
    public ApiResponse<DecorationApplicationDTO> getById(@PathVariable Long id) {
        return ApiResponse.success(applicationService.getApplicationById(id));
    }

    @GetMapping("/no/{applicationNo}")
    public ApiResponse<DecorationApplicationDTO> getByNo(@PathVariable String applicationNo) {
        return ApiResponse.success(applicationService.getApplicationByNo(applicationNo));
    }

    @GetMapping("/{id}/detail")
    public ApiResponse<ApplicationDetailDTO> getDetail(@PathVariable Long id) {
        return ApiResponse.success(applicationService.getApplicationDetail(id));
    }

    @GetMapping
    public ApiResponse<List<DecorationApplicationDTO>> listApplications(
            @RequestParam(required = false) String status) {
        return ApiResponse.success(applicationService.listApplications(status));
    }

    @PostMapping("/{id}/process")
    public ApiResponse<DecorationApplicationDTO> processApplication(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationProcessRequest request) {
        return ApiResponse.success(applicationService.processApplication(id, request));
    }
}
