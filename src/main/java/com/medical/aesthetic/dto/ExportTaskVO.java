package com.medical.aesthetic.dto;

import com.medical.aesthetic.entity.ExportTask;
import com.medical.aesthetic.enums.ExportTaskStatus;
import com.medical.aesthetic.enums.ExportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportTaskVO {

    private Long id;

    private ExportType exportType;

    private ExportTaskStatus status;

    private String filterCriteria;

    private String fileName;

    private Long fileSize;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private String errorMessage;

    private Integer recordCount;

    private String remark;

    private String createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public static ExportTaskVO fromEntity(ExportTask task) {
        if (task == null) {
            return null;
        }
        return ExportTaskVO.builder()
                .id(task.getId())
                .exportType(task.getExportType())
                .status(task.getStatus())
                .filterCriteria(task.getFilterCriteria())
                .fileName(task.getFileName())
                .fileSize(task.getFileSize())
                .startedAt(task.getStartedAt())
                .completedAt(task.getCompletedAt())
                .errorMessage(task.getErrorMessage())
                .recordCount(task.getRecordCount())
                .remark(task.getRemark())
                .createdBy(task.getCreatedBy())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
