package com.elevator.smartparking.controller;

import com.elevator.smartparking.common.Result;
import com.elevator.smartparking.dto.FaultReportCreateDTO;
import com.elevator.smartparking.dto.FaultReportDetailVO;
import com.elevator.smartparking.dto.FaultReportHandleDTO;
import com.elevator.smartparking.entity.FaultReport;
import com.elevator.smartparking.entity.FaultStatus;
import com.elevator.smartparking.service.FaultReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "故障报修", description = "故障报修的创建、受理、处理、转困人、完成、取消和详情查询")
@RestController
@RequestMapping("/api/fault-reports")
@RequiredArgsConstructor
public class FaultReportController {

    private final FaultReportService faultReportService;

    @Operation(summary = "创建故障报修", description = "客服或报修人创建故障报修工单，初始状态为待受理")
    @PostMapping
    public Result<FaultReport> create(
            @Valid @RequestBody FaultReportCreateDTO dto,
            @Parameter(description = "操作人ID") @RequestHeader(value = "X-User-Id", required = false) Long operatorId,
            @Parameter(description = "操作人姓名") @RequestHeader(value = "X-User-Name", required = false) String operatorName) {
        if (operatorName == null) {
            operatorName = "系统用户";
        }
        return Result.success(faultReportService.createReport(dto, operatorId, operatorName));
    }

    @Operation(summary = "受理故障报修", description = "客服或项目主管受理故障报修，状态从待受理变为处理中")
    @PostMapping("/{id}/accept")
    public Result<FaultReport> accept(
            @Parameter(description = "故障报修ID") @PathVariable Long id,
            @Parameter(description = "处理人ID") @RequestParam Long handlerId) {
        return Result.success(faultReportService.acceptReport(id, handlerId));
    }

    @Operation(summary = "处理故障报修", description = "维保技师处理故障，可更新备注和解决方案，状态保持处理中")
    @PostMapping("/{id}/process")
    public Result<FaultReport> process(
            @Parameter(description = "故障报修ID") @PathVariable Long id,
            @RequestBody FaultReportHandleDTO dto) {
        return Result.success(faultReportService.processReport(id, dto));
    }

    @Operation(summary = "完成故障报修", description = "故障处理完毕，状态从处理中变为已完成")
    @PostMapping("/{id}/complete")
    public Result<FaultReport> complete(
            @Parameter(description = "故障报修ID") @PathVariable Long id,
            @RequestBody FaultReportHandleDTO dto) {
        return Result.success(faultReportService.completeReport(id, dto));
    }

    @Operation(summary = "取消故障报修", description = "取消故障报修，状态变为已取消")
    @PostMapping("/{id}/cancel")
    public Result<FaultReport> cancel(
            @Parameter(description = "故障报修ID") @PathVariable Long id,
            @Parameter(description = "取消原因") @RequestParam String reason,
            @Parameter(description = "操作人ID") @RequestHeader(value = "X-User-Id", required = false) Long operatorId) {
        return Result.success(faultReportService.cancelReport(id, reason, operatorId));
    }

    @Operation(summary = "转困人处置", description = "发现有人员被困，将故障报修转为困人处置工单，返回困人处置ID")
    @PostMapping("/{id}/transfer-rescue")
    public Result<Long> transferToRescue(
            @Parameter(description = "故障报修ID") @PathVariable Long id,
            @Parameter(description = "操作人ID") @RequestHeader(value = "X-User-Id", required = false) Long operatorId) {
        return Result.success(faultReportService.transferToRescue(id, operatorId));
    }

    @Operation(summary = "查询故障报修详情", description = "查看故障报修详情，包含完整的处理记录和关联的困人处置工单")
    @GetMapping("/{id}")
    public Result<FaultReportDetailVO> getDetail(
            @Parameter(description = "故障报修ID") @PathVariable Long id) {
        return Result.success(faultReportService.getDetail(id));
    }

    @Operation(summary = "查询所有故障报修", description = "获取所有故障报修列表")
    @GetMapping
    public Result<List<FaultReport>> listAll() {
        return Result.success(faultReportService.listAll());
    }

    @Operation(summary = "按状态查询故障报修", description = "根据状态筛选故障报修列表")
    @GetMapping("/status/{status}")
    public Result<List<FaultReport>> listByStatus(
            @Parameter(description = "状态：PENDING待受理, PROCESSING处理中, TRANSFERRED_TO_RESCUE已转困人, COMPLETED已完成, CANCELLED已取消")
            @PathVariable FaultStatus status) {
        return Result.success(faultReportService.listByStatus(status));
    }

    @Operation(summary = "按电梯查询故障报修", description = "查询某部电梯的所有故障报修记录")
    @GetMapping("/elevator/{elevatorId}")
    public Result<List<FaultReport>> listByElevator(
            @Parameter(description = "电梯ID") @PathVariable Long elevatorId) {
        return Result.success(faultReportService.listByElevator(elevatorId));
    }

    @Operation(summary = "获取状态列表", description = "获取故障报修所有状态枚举")
    @GetMapping("/statuses")
    public Result<FaultStatus[]> getStatuses() {
        return Result.success(FaultStatus.values());
    }
}
