package com.example.tailor.controller;

import com.example.tailor.dto.response.ApiResponse;
import com.example.tailor.dto.response.NotificationRecordDTO;
import com.example.tailor.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notification")
@Tag(name = "通知记录管理", description = "通知记录的查询、标记已读等操作")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "分页查询通知记录", description = "支持按角色、状态筛选通知记录")
    public ResponseEntity<ApiResponse<Page<NotificationRecordDTO>>> queryNotifications(
            @Parameter(description = "目标角色") @RequestParam(required = false) String targetRole,
            @Parameter(description = "状态：PENDING(待处理)、READ(已读)") @RequestParam(required = false) String status,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") Integer page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") Integer size) {
        Page<NotificationRecordDTO> result = notificationService.queryNotifications(targetRole, status, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "查询单个通知", description = "根据ID查询通知记录详情")
    public ResponseEntity<ApiResponse<NotificationRecordDTO>> getNotificationById(
            @Parameter(description = "通知ID") @PathVariable Long id) {
        NotificationRecordDTO result = notificationService.getNotificationById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "标记通知为已读", description = "将指定通知标记为已读状态")
    public ResponseEntity<ApiResponse<NotificationRecordDTO>> markAsRead(
            @Parameter(description = "通知ID") @PathVariable Long id) {
        NotificationRecordDTO result = notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("已标记为已读", result));
    }

    @PutMapping("/read-all")
    @Operation(summary = "批量标记已读", description = "将指定角色的所有待处理通知标记为已读")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @Parameter(description = "目标角色") @RequestParam String targetRole) {
        notificationService.markAllAsRead(targetRole);
        return ResponseEntity.ok(ApiResponse.success("已全部标记为已读", null));
    }

    @GetMapping("/count-unread")
    @Operation(summary = "统计未读数量", description = "统计指定角色的未读通知数量")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countUnread(
            @Parameter(description = "目标角色") @RequestParam(required = false) String targetRole) {
        Long count = notificationService.countUnread(targetRole != null ? targetRole : "");
        Map<String, Long> result = new HashMap<>();
        result.put("unreadCount", count);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/role/{role}")
    @Operation(summary = "查询角色通知", description = "查询指定角色的通知记录")
    public ResponseEntity<ApiResponse<Page<NotificationRecordDTO>>> getNotificationsByRole(
            @Parameter(description = "角色类型") @PathVariable String role,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") Integer page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") Integer size) {
        Page<NotificationRecordDTO> result = notificationService.queryNotifications(role, null, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}