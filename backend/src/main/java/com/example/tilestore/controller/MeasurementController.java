package com.example.tilestore.controller;

import com.example.tilestore.common.ApiResponse;
import com.example.tilestore.dto.request.MeasurementCreateRequest;
import com.example.tilestore.dto.request.MeasurementUpdateRequest;
import com.example.tilestore.dto.response.MeasurementHistoryResponse;
import com.example.tilestore.dto.response.MeasurementRecordResponse;
import com.example.tilestore.service.MeasurementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/measurements")
@RequiredArgsConstructor
public class MeasurementController {

    private final MeasurementService measurementService;

    @PostMapping
    public ApiResponse<MeasurementRecordResponse> create(@Valid @RequestBody MeasurementCreateRequest request) {
        MeasurementRecordResponse response = measurementService.createMeasurement(request);
        return ApiResponse.success("创建成功", response);
    }

    @GetMapping("/{id}")
    public ApiResponse<MeasurementRecordResponse> get(@PathVariable Long id) {
        MeasurementRecordResponse response = measurementService.getMeasurement(id);
        return ApiResponse.success(response);
    }

    @PutMapping("/{id}")
    public ApiResponse<MeasurementRecordResponse> update(@PathVariable Long id, @Valid @RequestBody MeasurementUpdateRequest request) {
        MeasurementRecordResponse response = measurementService.updateMeasurement(id, request);
        return ApiResponse.success("更新成功", response);
    }

    @PostMapping("/{id}/assign")
    public ApiResponse<MeasurementRecordResponse> assignDesigner(@PathVariable Long id, @RequestParam Long designerId) {
        MeasurementRecordResponse response = measurementService.assignDesigner(id, designerId);
        return ApiResponse.success("分配成功", response);
    }

    @PostMapping("/{id}/complete")
    public ApiResponse<MeasurementRecordResponse> complete(@PathVariable Long id) {
        MeasurementRecordResponse response = measurementService.completeMeasurement(id);
        return ApiResponse.success("完成量房", response);
    }

    @GetMapping
    public ApiResponse<List<MeasurementRecordResponse>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long customerId) {
        List<MeasurementRecordResponse> response = measurementService.listMeasurements(status, customerId);
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}/history")
    public ApiResponse<List<MeasurementHistoryResponse>> getHistory(@PathVariable Long id) {
        List<MeasurementHistoryResponse> response = measurementService.getMeasurementHistory(id);
        return ApiResponse.success(response);
    }
}