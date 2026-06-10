package com.elevator.smartparking.controller;

import com.elevator.smartparking.common.Result;
import com.elevator.smartparking.dto.RescueCreateDTO;
import com.elevator.smartparking.dto.RescueDetailVO;
import com.elevator.smartparking.dto.RescueHandleDTO;
import com.elevator.smartparking.entity.EntrapmentRescue;
import com.elevator.smartparking.entity.RescueStatus;
import com.elevator.smartparking.service.EntrapmentRescueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "困人处置", description = "困人处置的创建、救援、解救、完成、取消和详情回看")
@RestController
@RequestMapping("/api/entrapment-rescues")
@RequiredArgsConstructor
public class EntrapmentRescueController {

    private final EntrapmentRescueService entrapmentRescueService;

    @Operation(summary = "创建困人处置", description = "创建困人处置工单，初始状态为待救援。可关联故障报修，初始备注可承接故障报修的备注")
    @PostMapping
    public Result<EntrapmentRescue> create(
            @Valid @RequestBody RescueCreateDTO dto,
            @Parameter(description = "操作人ID") @RequestHeader(value = "X-User-Id", required = false) Long operatorId,
            @Parameter(description = "操作人姓名") @RequestHeader(value = "X-User-Name", required = false) String operatorName) {
        if (operatorName == null) {
            operatorName = "系统用户";
        }
        return Result.success(entrapmentRescueService.createRescue(dto, operatorId, operatorName));
    }

    @Operation(summary = "开始救援", description = "救援人员到场，状态从待救援变为救援中，记录到场时间")
    @PostMapping("/{id}/start")
    public Result<EntrapmentRescue> startRescue(
            @Parameter(description = "困人处置ID") @PathVariable Long id,
            @Parameter(description = "救援人员ID") @RequestParam Long rescuerId) {
        return Result.success(entrapmentRescueService.startRescue(id, rescuerId));
    }

    @Operation(summary = "更新救援进度", description = "救援过程中更新救援记录和备注，状态保持救援中或已解救")
    @PostMapping("/{id}/progress")
    public Result<EntrapmentRescue> updateProgress(
            @Parameter(description = "困人处置ID") @PathVariable Long id,
            @RequestBody RescueHandleDTO dto) {
        return Result.success(entrapmentRescueService.updateProgress(id, dto));
    }

    @Operation(summary = "人员已解救", description = "被困人员成功救出，状态从救援中变为已解救，记录解救时间")
    @PostMapping("/{id}/rescue-success")
    public Result<EntrapmentRescue> rescueSuccess(
            @Parameter(description = "困人处置ID") @PathVariable Long id,
            @RequestBody RescueHandleDTO dto) {
        return Result.success(entrapmentRescueService.rescueSuccess(id, dto));
    }

    @Operation(summary = "完成处置", description = "后续处理完成，状态从已解救变为已完成，记录困人原因和解决方案")
    @PostMapping("/{id}/complete")
    public Result<EntrapmentRescue> complete(
            @Parameter(description = "困人处置ID") @PathVariable Long id,
            @RequestBody RescueHandleDTO dto) {
        return Result.success(entrapmentRescueService.completeRescue(id, dto));
    }

    @Operation(summary = "取消困人处置", description = "取消困人处置工单，状态变为已取消")
    @PostMapping("/{id}/cancel")
    public Result<EntrapmentRescue> cancel(
            @Parameter(description = "困人处置ID") @PathVariable Long id,
            @Parameter(description = "取消原因") @RequestParam String reason,
            @Parameter(description = "操作人ID") @RequestHeader(value = "X-User-Id", required = false) Long operatorId) {
        return Result.success(entrapmentRescueService.cancelRescue(id, reason, operatorId));
    }

    @Operation(summary = "困人处置详情", description = "查看困人处置详情，包含完整的处理记录（历史回看），以及关联的故障报修信息")
    @GetMapping("/{id}")
    public Result<RescueDetailVO> getDetail(
            @Parameter(description = "困人处置ID") @PathVariable Long id) {
        return Result.success(entrapmentRescueService.getDetail(id));
    }

    @Operation(summary = "查询所有困人处置", description = "获取所有困人处置工单列表")
    @GetMapping
    public Result<List<EntrapmentRescue>> listAll() {
        return Result.success(entrapmentRescueService.listAll());
    }

    @Operation(summary = "按状态查询困人处置", description = "根据状态筛选困人处置工单列表")
    @GetMapping("/status/{status}")
    public Result<List<EntrapmentRescue>> listByStatus(
            @Parameter(description = "状态：PENDING_RESCUE待救援, RESCUING救援中, RESCUED已解救, COMPLETED已完成, CANCELLED已取消")
            @PathVariable RescueStatus status) {
        return Result.success(entrapmentRescueService.listByStatus(status));
    }

    @Operation(summary = "按电梯查询困人处置", description = "查询某部电梯的所有困人处置记录")
    @GetMapping("/elevator/{elevatorId}")
    public Result<List<EntrapmentRescue>> listByElevator(
            @Parameter(description = "电梯ID") @PathVariable Long elevatorId) {
        return Result.success(entrapmentRescueService.listByElevator(elevatorId));
    }

    @Operation(summary = "获取状态列表", description = "获取困人处置所有状态枚举")
    @GetMapping("/statuses")
    public Result<RescueStatus[]> getStatuses() {
        return Result.success(RescueStatus.values());
    }
}
