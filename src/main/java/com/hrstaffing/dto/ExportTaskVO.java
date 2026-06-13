package com.hrstaffing.dto;

import com.hrstaffing.entity.ExportTask;
import com.hrstaffing.enums.ExportStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExportTaskVO {

    private Long id;

    private String taskName;

    private String exportType;

    private String exportTypeLabel;

    private ExportStatus status;

    private String statusLabel;

    private Boolean downloadable;

    private String failReason;

    private Long fileSize;

    private String createdByName;

    private LocalDateTime createdAt;

    private LocalDateTime startedAt;

    private LocalDateTime finishedAt;

    public static ExportTaskVO of(ExportTask task) {
        ExportTaskVO vo = new ExportTaskVO();
        vo.setId(task.getId());
        vo.setTaskName(task.getTaskName());
        vo.setExportType(task.getExportType());
        vo.setExportTypeLabel(typeLabel(task.getExportType()));
        vo.setStatus(task.getStatus());
        vo.setStatusLabel(task.getStatus() != null ? task.getStatus().getLabel() : "");
        vo.setDownloadable(task.getStatus() == ExportStatus.SUCCESS && task.getFilePath() != null);
        vo.setFailReason(task.getFailReason());
        vo.setFileSize(task.getFileSize());
        vo.setCreatedByName(task.getCreatedByName());
        vo.setCreatedAt(task.getCreatedAt());
        vo.setStartedAt(task.getStartedAt());
        vo.setFinishedAt(task.getFinishedAt());
        return vo;
    }

    private static String typeLabel(String type) {
        if (type == null) return "";
        return switch (type) {
            case "SCHEDULE" -> "考勤排班明细";
            case "EXCEPTION" -> "异常确认汇总";
            case "EXCEPTION_DETAIL" -> "异常确认明细回看";
            default -> type;
        };
    }
}
