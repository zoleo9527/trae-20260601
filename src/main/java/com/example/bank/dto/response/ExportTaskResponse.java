package com.example.bank.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportTaskResponse {

    private Long id;
    private String taskNo;
    private String exportType;
    private String status;
    private String filePath;
    private Integer recordCount;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}