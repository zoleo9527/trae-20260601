package com.example.tilestore.controller;

import com.example.tilestore.common.ApiResponse;
import com.example.tilestore.dto.request.QuotationCreateRequest;
import com.example.tilestore.dto.request.QuotationUpdateRequest;
import com.example.tilestore.dto.response.QuotationHistoryResponse;
import com.example.tilestore.dto.response.QuotationResponse;
import com.example.tilestore.service.QuotationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quotations")
@RequiredArgsConstructor
public class QuotationController {

    private final QuotationService quotationService;

    @PostMapping
    public ApiResponse<QuotationResponse> create(@Valid @RequestBody QuotationCreateRequest request) {
        QuotationResponse response = quotationService.createQuotation(request);
        return ApiResponse.success("创建成功", response);
    }

    @GetMapping("/{id}")
    public ApiResponse<QuotationResponse> get(@PathVariable Long id) {
        QuotationResponse response = quotationService.getQuotation(id);
        return ApiResponse.success(response);
    }

    @PutMapping("/{id}")
    public ApiResponse<QuotationResponse> update(@PathVariable Long id, @Valid @RequestBody QuotationUpdateRequest request) {
        QuotationResponse response = quotationService.updateQuotation(id, request);
        return ApiResponse.success("更新成功", response);
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<QuotationResponse> submit(@PathVariable Long id) {
        QuotationResponse response = quotationService.submitQuotation(id);
        return ApiResponse.success("提交成功", response);
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<QuotationResponse> approve(@PathVariable Long id) {
        QuotationResponse response = quotationService.approveQuotation(id);
        return ApiResponse.success("审核通过", response);
    }

    @PostMapping("/{id}/reject")
    public ApiResponse<QuotationResponse> reject(@PathVariable Long id, @RequestParam String remark) {
        QuotationResponse response = quotationService.rejectQuotation(id, remark);
        return ApiResponse.success("已拒绝", response);
    }

    @PostMapping("/{id}/sign")
    public ApiResponse<QuotationResponse> sign(@PathVariable Long id) {
        QuotationResponse response = quotationService.signQuotation(id);
        return ApiResponse.success("签署成功", response);
    }

    @GetMapping
    public ApiResponse<List<QuotationResponse>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long measurementId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long designerId) {
        List<QuotationResponse> response = quotationService.listQuotations(status, measurementId, customerId, designerId);
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}/history")
    public ApiResponse<List<QuotationHistoryResponse>> getHistory(@PathVariable Long id) {
        List<QuotationHistoryResponse> response = quotationService.getQuotationHistory(id);
        return ApiResponse.success(response);
    }
}