package com.elevator.smartparking.controller;

import com.elevator.smartparking.common.Result;
import com.elevator.smartparking.entity.*;
import com.elevator.smartparking.repository.FaultReportRepository;
import com.elevator.smartparking.repository.EntrapmentRescueRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "轻量能力", description = "导出、附件、消息通知 - 轻量实现/状态占位，不做实际业务逻辑")
@RestController
@RequestMapping("/api/light-capability")
@RequiredArgsConstructor
public class LightCapabilityController {

    private final FaultReportRepository faultReportRepository;
    private final EntrapmentRescueRepository entrapmentRescueRepository;

    @Operation(summary = "申请导出", description = "申请导出工单，返回导出任务ID。轻量实现：仅更新状态字段，不生成实际文件")
    @PostMapping("/export/{recordType}/{id}")
    public Result<Map<String, Object>> requestExport(
            @Parameter(description = "类型: fault_report / entrapment_rescue")
            @PathVariable String recordType,
            @Parameter(description = "工单ID") @PathVariable Long id,
            @Parameter(description = "导出格式: excel / pdf")
            @RequestParam(defaultValue = "excel") String format) {

        String taskId = "EXP" + System.currentTimeMillis();
        LocalDateTime now = LocalDateTime.now();

        if ("fault_report".equals(recordType)) {
            FaultReport report = faultReportRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));
            report.setExportStatus(ExportStatus.EXPORTING);
            faultReportRepository.save(report);
        } else if ("entrapment_rescue".equals(recordType)) {
            EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));
            rescue.setExportStatus(ExportStatus.EXPORTING);
            entrapmentRescueRepository.save(rescue);
        } else {
            throw new IllegalArgumentException("不支持的类型");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("taskId", taskId);
        result.put("status", ExportStatus.EXPORTING.name());
        result.put("statusText", "导出中");
        result.put("format", format);
        result.put("requestTime", now);
        result.put("remark", "轻量实现：仅更新状态，实际导出功能待接入");
        return Result.success(result);
    }

    @Operation(summary = "查询导出状态", description = "查询导出任务状态")
    @GetMapping("/export/{recordType}/{id}/status")
    public Result<Map<String, Object>> getExportStatus(
            @Parameter(description = "类型: fault_report / entrapment_rescue")
            @PathVariable String recordType,
            @Parameter(description = "工单ID") @PathVariable Long id) {

        ExportStatus status = ExportStatus.NOT_EXPORTED;

        if ("fault_report".equals(recordType)) {
            FaultReport report = faultReportRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));
            if (report.getExportStatus() != null) {
                status = report.getExportStatus();
            }
        } else if ("entrapment_rescue".equals(recordType)) {
            EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));
            if (rescue.getExportStatus() != null) {
                status = rescue.getExportStatus();
            }
        } else {
            throw new IllegalArgumentException("不支持的类型");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", status.name());
        result.put("statusText", getExportStatusText(status));
        result.put("downloadUrl", status == ExportStatus.EXPORTED ? "/mock/download/" + id : null);
        result.put("remark", "轻量实现：仅返回状态，实际文件待接入");
        return Result.success(result);
    }

    @Operation(summary = "标记导出完成", description = "模拟导出完成，更新状态为已导出")
    @PostMapping("/export/{recordType}/{id}/complete")
    public Result<Void> markExportComplete(
            @Parameter(description = "类型: fault_report / entrapment_rescue")
            @PathVariable String recordType,
            @Parameter(description = "工单ID") @PathVariable Long id) {

        if ("fault_report".equals(recordType)) {
            FaultReport report = faultReportRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));
            report.setExportStatus(ExportStatus.EXPORTED);
            faultReportRepository.save(report);
        } else if ("entrapment_rescue".equals(recordType)) {
            EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));
            rescue.setExportStatus(ExportStatus.EXPORTED);
            entrapmentRescueRepository.save(rescue);
        } else {
            throw new IllegalArgumentException("不支持的类型");
        }

        return Result.success();
    }

    @Operation(summary = "获取附件列表", description = "获取工单附件列表。轻量实现：返回空列表或模拟数据")
    @GetMapping("/attachments/{recordType}/{id}")
    public Result<List<Map<String, Object>>> getAttachments(
            @Parameter(description = "类型: fault_report / entrapment_rescue")
            @PathVariable String recordType,
            @Parameter(description = "工单ID") @PathVariable Long id) {

        int count = 0;
        if ("fault_report".equals(recordType)) {
            FaultReport report = faultReportRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));
            count = report.getAttachmentCount() != null ? report.getAttachmentCount() : 0;
        } else if ("entrapment_rescue".equals(recordType)) {
            EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));
            count = rescue.getAttachmentCount() != null ? rescue.getAttachmentCount() : 0;
        } else {
            throw new IllegalArgumentException("不支持的类型");
        }

        List<Map<String, Object>> attachments = new java.util.ArrayList<>();
        for (int i = 0; i < count; i++) {
            Map<String, Object> att = new HashMap<>();
            att.put("id", id * 100 + i);
            att.put("name", "附件" + (i + 1) + ".jpg");
            att.put("size", 1024 * (i + 1) * 100);
            att.put("uploadTime", LocalDateTime.now().minusHours(i + 1));
            att.put("url", "/mock/attachment/" + id + "/" + i);
            attachments.add(att);
        }

        return Result.success(attachments);
    }

    @Operation(summary = "上传附件（占位）", description = "上传附件接口占位。轻量实现：仅增加计数，不保存实际文件")
    @PostMapping("/attachments/{recordType}/{id}")
    public Result<Map<String, Object>> uploadAttachment(
            @Parameter(description = "类型: fault_report / entrapment_rescue")
            @PathVariable String recordType,
            @Parameter(description = "工单ID") @PathVariable Long id,
            @Parameter(description = "文件名") @RequestParam String fileName) {

        int newCount = 0;
        if ("fault_report".equals(recordType)) {
            FaultReport report = faultReportRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));
            int current = report.getAttachmentCount() != null ? report.getAttachmentCount() : 0;
            newCount = current + 1;
            report.setAttachmentCount(newCount);
            faultReportRepository.save(report);
        } else if ("entrapment_rescue".equals(recordType)) {
            EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));
            int current = rescue.getAttachmentCount() != null ? rescue.getAttachmentCount() : 0;
            newCount = current + 1;
            rescue.setAttachmentCount(newCount);
            entrapmentRescueRepository.save(rescue);
        } else {
            throw new IllegalArgumentException("不支持的类型");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("attachmentId", id * 100 + newCount - 1);
        result.put("fileName", fileName);
        result.put("attachmentCount", newCount);
        result.put("remark", "轻量实现：仅更新计数，实际文件存储待接入");
        return Result.success(result);
    }

    @Operation(summary = "删除附件（占位）", description = "删除附件接口占位。轻量实现：仅减少计数")
    @DeleteMapping("/attachments/{recordType}/{id}/{attachmentId}")
    public Result<Map<String, Object>> deleteAttachment(
            @Parameter(description = "类型: fault_report / entrapment_rescue")
            @PathVariable String recordType,
            @Parameter(description = "工单ID") @PathVariable Long id,
            @Parameter(description = "附件ID") @PathVariable Long attachmentId) {

        int newCount = 0;
        if ("fault_report".equals(recordType)) {
            FaultReport report = faultReportRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));
            int current = report.getAttachmentCount() != null ? report.getAttachmentCount() : 0;
            newCount = Math.max(0, current - 1);
            report.setAttachmentCount(newCount);
            faultReportRepository.save(report);
        } else if ("entrapment_rescue".equals(recordType)) {
            EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));
            int current = rescue.getAttachmentCount() != null ? rescue.getAttachmentCount() : 0;
            newCount = Math.max(0, current - 1);
            rescue.setAttachmentCount(newCount);
            entrapmentRescueRepository.save(rescue);
        } else {
            throw new IllegalArgumentException("不支持的类型");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("attachmentCount", newCount);
        result.put("remark", "轻量实现：仅更新计数，实际文件删除待接入");
        return Result.success(result);
    }

    @Operation(summary = "发送通知", description = "发送消息通知。轻量实现：仅更新通知状态，不实际发送")
    @PostMapping("/notify/{recordType}/{id}")
    public Result<Map<String, Object>> sendNotification(
            @Parameter(description = "类型: fault_report / entrapment_rescue")
            @PathVariable String recordType,
            @Parameter(description = "工单ID") @PathVariable Long id,
            @Parameter(description = "通知类型: sms / app / email")
            @RequestParam(defaultValue = "app") String notifyType,
            @Parameter(description = "接收人ID，多个用逗号分隔") @RequestParam(required = false) String receiverIds,
            @Parameter(description = "通知内容") @RequestParam String content) {

        if ("fault_report".equals(recordType)) {
            FaultReport report = faultReportRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));
            report.setNotificationStatus(NotificationStatus.NOTIFIED);
            faultReportRepository.save(report);
        } else if ("entrapment_rescue".equals(recordType)) {
            EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));
            rescue.setNotificationStatus(NotificationStatus.NOTIFIED);
            entrapmentRescueRepository.save(rescue);
        } else {
            throw new IllegalArgumentException("不支持的类型");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", NotificationStatus.NOTIFIED.name());
        result.put("statusText", "已通知");
        result.put("notifyType", notifyType);
        result.put("receiverIds", receiverIds);
        result.put("sendTime", LocalDateTime.now());
        result.put("remark", "轻量实现：仅更新状态，实际通知发送待接入");
        return Result.success(result);
    }

    @Operation(summary = "查询通知状态", description = "查询工单通知发送状态")
    @GetMapping("/notify/{recordType}/{id}/status")
    public Result<Map<String, Object>> getNotificationStatus(
            @Parameter(description = "类型: fault_report / entrapment_rescue")
            @PathVariable String recordType,
            @Parameter(description = "工单ID") @PathVariable Long id) {

        NotificationStatus status = NotificationStatus.NOT_NOTIFIED;

        if ("fault_report".equals(recordType)) {
            FaultReport report = faultReportRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("故障报修不存在"));
            if (report.getNotificationStatus() != null) {
                status = report.getNotificationStatus();
            }
        } else if ("entrapment_rescue".equals(recordType)) {
            EntrapmentRescue rescue = entrapmentRescueRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("困人处置不存在"));
            if (rescue.getNotificationStatus() != null) {
                status = rescue.getNotificationStatus();
            }
        } else {
            throw new IllegalArgumentException("不支持的类型");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", status.name());
        result.put("statusText", getNotificationStatusText(status));
        result.put("remark", "轻量实现：仅返回状态，实际通知记录待接入");
        return Result.success(result);
    }

    private String getExportStatusText(ExportStatus status) {
        return switch (status) {
            case NOT_EXPORTED -> "未导出";
            case EXPORTING -> "导出中";
            case EXPORTED -> "已导出";
            case FAILED -> "导出失败";
        };
    }

    private String getNotificationStatusText(NotificationStatus status) {
        return switch (status) {
            case NOT_NOTIFIED -> "未通知";
            case NOTIFIED -> "已通知";
            case FAILED -> "通知失败";
        };
    }
}
