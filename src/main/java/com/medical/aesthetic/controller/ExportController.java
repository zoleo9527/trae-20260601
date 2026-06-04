package com.medical.aesthetic.controller;

import com.medical.aesthetic.dto.ExportRequestDTO;
import com.medical.aesthetic.dto.ExportTaskVO;
import com.medical.aesthetic.enums.ExportTaskStatus;
import com.medical.aesthetic.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExportController {

    private final ExportService exportService;

    @PostMapping("/projects")
    public ResponseEntity<byte[]> exportProjects(@RequestBody ExportRequestDTO dto) throws IOException {
        byte[] data = exportService.exportProjects(dto);
        String fileName = URLEncoder.encode("项目排期表.xlsx", StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + fileName)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @PostMapping("/materials")
    public ResponseEntity<byte[]> exportMaterials(@RequestBody ExportRequestDTO dto) throws IOException {
        byte[] data = exportService.exportMaterialReservations(dto);
        String fileName = URLEncoder.encode("耗材预留记录.xlsx", StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + fileName)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @PostMapping("/orders")
    public ResponseEntity<byte[]> exportOrders(@RequestBody ExportRequestDTO dto) throws IOException {
        byte[] data = exportService.exportOrders(dto);
        String fileName = URLEncoder.encode("分期款项明细.xlsx", StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + fileName)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @PostMapping("/async/{type}")
    public ResponseEntity<ExportTaskVO> asyncExport(@PathVariable String type, @RequestBody ExportRequestDTO dto) {
        ExportTaskVO task = exportService.submitTask(dto, type);
        return ResponseEntity.ok(task);
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<ExportTaskVO>> getTaskList() {
        return ResponseEntity.ok(exportService.getTaskList());
    }

    @GetMapping("/tasks/recent")
    public ResponseEntity<List<ExportTaskVO>> getRecentTasks() {
        return ResponseEntity.ok(exportService.getRecentTasks());
    }

    @GetMapping("/tasks/status/{status}")
    public ResponseEntity<List<ExportTaskVO>> getTasksByStatus(@PathVariable String status) {
        return ResponseEntity.ok(exportService.getTasksByStatus(ExportTaskStatus.valueOf(status.toUpperCase())));
    }

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<ExportTaskVO> getTaskDetail(@PathVariable Long taskId) {
        ExportTaskVO task = exportService.getTaskDetail(taskId);
        if (task == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(task);
    }

    @GetMapping("/tasks/{taskId}/download")
    public ResponseEntity<byte[]> downloadTaskResult(@PathVariable Long taskId) {
        ExportTaskVO task = exportService.getTaskDetail(taskId);
        if (task == null) {
            return ResponseEntity.notFound().build();
        }
        if (task.getStatus() != ExportTaskStatus.COMPLETED) {
            return ResponseEntity.badRequest().body(null);
        }
        byte[] content = exportService.getTaskFileContent(taskId);
        String fileName = URLEncoder.encode(task.getFileName(), StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + fileName)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(content);
    }

    @PostMapping("/tasks/{taskId}/retry")
    public ResponseEntity<Map<String, Object>> retryTask(@PathVariable Long taskId) {
        try {
            exportService.retryTask(taskId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "任务已重新提交，将在后台执行"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}
