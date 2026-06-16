package com.example.tailor.controller;

import com.example.tailor.dto.request.CreateModificationRequest;
import com.example.tailor.dto.request.ModificationQueryRequest;
import com.example.tailor.dto.request.UpdateModificationRequest;
import com.example.tailor.dto.response.ApiResponse;
import com.example.tailor.dto.response.ModificationRecordDTO;
import com.example.tailor.dto.response.PageResponse;
import com.example.tailor.service.ModificationRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/modification")
@Tag(name = "修改记录管理", description = "修改记录的创建、查询、更新等操作")
public class ModificationRecordController {

    private final ModificationRecordService modificationRecordService;

    public ModificationRecordController(ModificationRecordService modificationRecordService) {
        this.modificationRecordService = modificationRecordService;
    }

    @PostMapping
    @Operation(summary = "创建修改记录", description = "根据试衣反馈创建修改任务，自动关联订单、量体单、面料卡等上下文")
    public ResponseEntity<ApiResponse<ModificationRecordDTO>> createModification(
            @Valid @RequestBody CreateModificationRequest request) {
        ModificationRecordDTO result = modificationRecordService.createModification(request);
        return ResponseEntity.ok(ApiResponse.success("创建成功", result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "查询单个修改记录", description = "根据ID查询修改记录详情")
    public ResponseEntity<ApiResponse<ModificationRecordDTO>> getModificationById(
            @Parameter(description = "修改记录ID") @PathVariable Long id) {
        ModificationRecordDTO result = modificationRecordService.getModificationById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/no/{modificationNo}")
    @Operation(summary = "根据修改单号查询", description = "根据修改单号查询修改记录详情")
    public ResponseEntity<ApiResponse<ModificationRecordDTO>> getModificationByNo(
            @Parameter(description = "修改单号") @PathVariable String modificationNo) {
        ModificationRecordDTO result = modificationRecordService.getModificationByNo(modificationNo);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新修改记录", description = "更新修改记录状态、处理人、完成情况等信息")
    public ResponseEntity<ApiResponse<ModificationRecordDTO>> updateModification(
            @Parameter(description = "修改记录ID") @PathVariable Long id,
            @RequestBody UpdateModificationRequest request) {
        ModificationRecordDTO result = modificationRecordService.updateModification(id, request);
        return ResponseEntity.ok(ApiResponse.success("更新成功", result));
    }

    @GetMapping("/query")
    @Operation(summary = "分页查询修改记录", description = "支持按反馈ID、订单ID、状态、责任角色、处理人等条件筛选")
    public ResponseEntity<ApiResponse<PageResponse<ModificationRecordDTO>>> queryModifications(
            @Parameter(description = "反馈ID") @RequestParam(required = false) Long feedbackId,
            @Parameter(description = "订单ID") @RequestParam(required = false) Long orderId,
            @Parameter(description = "状态") @RequestParam(required = false) String status,
            @Parameter(description = "责任角色") @RequestParam(required = false) String responsibleRole,
            @Parameter(description = "处理人ID") @RequestParam(required = false) Long assigneeId,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") Integer page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") Integer size) {
        ModificationQueryRequest request = new ModificationQueryRequest();
        request.setFeedbackId(feedbackId);
        request.setOrderId(orderId);
        request.setStatus(status);
        request.setResponsibleRole(responsibleRole);
        request.setAssigneeId(assigneeId);
        request.setPage(page);
        request.setSize(size);
        PageResponse<ModificationRecordDTO> result = modificationRecordService.queryModifications(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}