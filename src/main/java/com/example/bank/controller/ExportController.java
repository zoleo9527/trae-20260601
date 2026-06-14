package com.example.bank.controller;

import com.example.bank.dto.request.ExportCreateRequest;
import com.example.bank.dto.response.ExportTaskResponse;
import com.example.bank.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @PostMapping("/tasks")
    public ResponseEntity<ExportTaskResponse> createExportTask(@RequestBody ExportCreateRequest request) {
        return ResponseEntity.ok(exportService.createExportTask(request.getExportType(), request.getAppointmentId()));
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<ExportTaskResponse>> getAllExportTasks() {
        return ResponseEntity.ok(exportService.getAllExportTasks());
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<ExportTaskResponse> getExportTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(exportService.getExportTaskById(id));
    }

    @GetMapping("/tasks/status/{status}")
    public ResponseEntity<List<ExportTaskResponse>> getExportTasksByStatus(@PathVariable String status) {
        return ResponseEntity.ok(exportService.getExportTasksByStatus(status));
    }

    @PostMapping("/tasks/{id}/execute")
    public ResponseEntity<ExportTaskResponse> executeExport(@PathVariable Long id) {
        return ResponseEntity.ok(exportService.executeExport(id));
    }
}