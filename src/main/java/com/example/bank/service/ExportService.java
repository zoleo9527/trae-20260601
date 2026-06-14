package com.example.bank.service;

import com.example.bank.dto.response.ExportTaskResponse;

import java.util.List;

public interface ExportService {

    ExportTaskResponse createExportTask(String exportType);

    ExportTaskResponse getExportTaskById(Long id);

    ExportTaskResponse getExportTaskByNo(String taskNo);

    List<ExportTaskResponse> getAllExportTasks();

    List<ExportTaskResponse> getExportTasksByStatus(String status);

    ExportTaskResponse executeExport(Long taskId);
}