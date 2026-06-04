package com.medical.aesthetic.controller;

import com.medical.aesthetic.common.ApiResponse;
import com.medical.aesthetic.dto.MaterialReservationDTO;
import com.medical.aesthetic.entity.MaterialReservation;
import com.medical.aesthetic.service.MaterialReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/material-reservations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MaterialReservationController {

    private final MaterialReservationService materialReservationService;

    @GetMapping("/project/{projectId}")
    public ApiResponse<List<MaterialReservation>> getByProjectId(@PathVariable Long projectId) {
        return ApiResponse.success(materialReservationService.getByProjectId(projectId));
    }

    @GetMapping("/project/{projectId}/active")
    public ApiResponse<List<MaterialReservation>> getActiveReservations(@PathVariable Long projectId) {
        return ApiResponse.success(materialReservationService.getActiveReservations(projectId));
    }

    @GetMapping("/history")
    public ApiResponse<List<MaterialReservation>> getHistory(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime start,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime end) {
        return ApiResponse.success(materialReservationService.getReservationHistory(start, end));
    }

    @PostMapping
    public ApiResponse<MaterialReservation> reserve(@RequestBody MaterialReservationDTO dto) {
        return ApiResponse.success("耗材预留成功", materialReservationService.reserve(dto));
    }

    @PostMapping("/{id}/confirm-used")
    public ApiResponse<MaterialReservation> confirmUsed(@PathVariable Long id) {
        return ApiResponse.success("耗材已确认使用", materialReservationService.confirmUsed(id));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<MaterialReservation> cancel(@PathVariable Long id, @RequestParam String reason) {
        return ApiResponse.success("预留已取消", materialReservationService.cancelReservation(id, reason));
    }

    @PostMapping("/auto-reserve/{projectId}")
    public ApiResponse<Void> autoReserve(@PathVariable Long projectId) {
        materialReservationService.autoReserveByProjectMaterials(projectId);
        return ApiResponse.success("自动预留处理完成", null);
    }
}
