package com.example.tailor.controller;

import com.example.tailor.dto.request.CreateFeedbackRequest;
import com.example.tailor.dto.request.FeedbackQueryRequest;
import com.example.tailor.dto.request.ProcessFeedbackRequest;
import com.example.tailor.dto.response.ApiResponse;
import com.example.tailor.dto.response.FittingFeedbackDTO;
import com.example.tailor.dto.response.PageResponse;
import com.example.tailor.service.FittingFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback")
@Tag(name = "试衣反馈管理", description = "试衣反馈的创建、查询、处理等操作")
public class FittingFeedbackController {

    private final FittingFeedbackService fittingFeedbackService;

    public FittingFeedbackController(FittingFeedbackService fittingFeedbackService) {
        this.fittingFeedbackService = fittingFeedbackService;
    }

    @PostMapping
    @Operation(summary = "创建试衣反馈", description = "提交客户试衣后的反馈信息")
    public ResponseEntity<ApiResponse<FittingFeedbackDTO>> createFeedback(
            @Valid @RequestBody CreateFeedbackRequest request) {
        FittingFeedbackDTO result = fittingFeedbackService.createFeedback(request);
        return ResponseEntity.ok(ApiResponse.success("创建成功", result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "查询单个试衣反馈", description = "根据ID查询试衣反馈详情，包含关联的量体单、面料卡和修改记录")
    public ResponseEntity<ApiResponse<FittingFeedbackDTO>> getFeedbackById(
            @Parameter(description = "反馈ID") @PathVariable Long id) {
        FittingFeedbackDTO result = fittingFeedbackService.getFeedbackById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/no/{feedbackNo}")
    @Operation(summary = "根据反馈单号查询", description = "根据反馈单号查询试衣反馈详情")
    public ResponseEntity<ApiResponse<FittingFeedbackDTO>> getFeedbackByNo(
            @Parameter(description = "反馈单号") @PathVariable String feedbackNo) {
        FittingFeedbackDTO result = fittingFeedbackService.getFeedbackByNo(feedbackNo);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}/process")
    @Operation(summary = "处理试衣反馈", description = "客服处理试衣反馈，确认反馈内容并分配处理人")
    public ResponseEntity<ApiResponse<FittingFeedbackDTO>> processFeedback(
            @Parameter(description = "反馈ID") @PathVariable Long id,
            @Valid @RequestBody ProcessFeedbackRequest request) {
        FittingFeedbackDTO result = fittingFeedbackService.processFeedback(id, request);
        return ResponseEntity.ok(ApiResponse.success("处理成功", result));
    }

    @PutMapping("/{id}/resolve")
    @Operation(summary = "完成试衣反馈", description = "标记试衣反馈已完成处理")
    public ResponseEntity<ApiResponse<FittingFeedbackDTO>> resolveFeedback(
            @Parameter(description = "反馈ID") @PathVariable Long id) {
        FittingFeedbackDTO result = fittingFeedbackService.resolveFeedback(id);
        return ResponseEntity.ok(ApiResponse.success("已完成", result));
    }

    @GetMapping("/query")
    @Operation(summary = "分页查询试衣反馈", description = "支持按订单、客户、状态、日期等条件筛选")
    public ResponseEntity<ApiResponse<PageResponse<FittingFeedbackDTO>>> queryFeedbacks(
            @Parameter(description = "订单ID") @RequestParam(required = false) Long orderId,
            @Parameter(description = "订单号") @RequestParam(required = false) String orderNo,
            @Parameter(description = "客户ID") @RequestParam(required = false) Long customerId,
            @Parameter(description = "状态") @RequestParam(required = false) String status,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") Integer page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") Integer size) {
        FeedbackQueryRequest request = new FeedbackQueryRequest();
        request.setOrderId(orderId);
        request.setOrderNo(orderNo);
        request.setCustomerId(customerId);
        request.setStatus(status);
        request.setPage(page);
        request.setSize(size);
        PageResponse<FittingFeedbackDTO> result = fittingFeedbackService.queryFeedbacks(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}