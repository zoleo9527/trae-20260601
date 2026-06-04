package com.medical.aesthetic.controller;

import com.medical.aesthetic.dto.ExportRequestDTO;
import com.medical.aesthetic.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

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
    public ResponseEntity<String> asyncExport(@PathVariable String type, @RequestBody ExportRequestDTO dto) {
        exportService.asyncExport(dto, type);
        return ResponseEntity.ok("异步导出任务已提交，将在后台处理");
    }
}
