package com.example.bank.controller;

import com.example.bank.dto.response.ExportTaskResponse;
import com.example.bank.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exports")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @PostMapping
    public ResponseEntity<ExportTaskResponse> createExportTask(@RequestParam String exportType) {
        return ResponseEntity.ok(exportService.createExportTask(exportType));
    }

    @GetMapping
    public ResponseEntity<List<ExportTaskResponse>> getAllExportTasks() {
        return ResponseEntity.ok(exportService.getAllExportTasks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExportTaskResponse> getExportTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(exportService.getExportTaskById(id));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ExportTaskResponse>> getExportTasksByStatus(@PathVariable String status) {
        return ResponseEntity.ok(exportService.getExportTasksByStatus(status));
    }

    @PostMapping("/{id}/execute")
    public ResponseEntity<ExportTaskResponse> executeExport(@PathVariable Long id) {
        return ResponseEntity.ok(exportService.executeExport(id));
    }
}