package com.parking.controller;

import com.parking.dto.*;
import com.parking.entity.GateFault;
import com.parking.entity.OperationRemark;
import com.parking.enums.FaultStatus;
import com.parking.service.GateFaultService;
import com.parking.service.ParkingLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final GateFaultService gateFaultService;
    private final ParkingLogService parkingLogService;

    @PostMapping("/faults")
    public ApiResponse<GateFault> reportFault(
            @RequestParam Long gateId,
            @RequestParam String faultType,
            @RequestParam String description,
            @RequestParam String reportedBy) {
        GateFault fault = gateFaultService.reportFault(gateId, faultType, description, reportedBy);
        return ApiResponse.ok("故障上报成功", fault);
    }

    @PostMapping("/faults/handle")
    public ApiResponse<GateFault> handleFault(@Valid @RequestBody GateFaultHandleRequest request) {
        GateFault fault = gateFaultService.handleFault(request);
        return ApiResponse.ok("故障处理完成", fault);
    }

    @GetMapping("/faults")
    public ApiResponse<PageResult<GateFault>> queryFaults(GateFaultQuery query) {
        PageResult<GateFault> result = gateFaultService.queryFaults(query);
        return ApiResponse.ok(result);
    }

    @GetMapping("/faults/{faultId}/remarks")
    public ApiResponse<List<OperationRemark>> getFaultRemarks(@PathVariable Long faultId) {
        List<OperationRemark> remarks = gateFaultService.getFaultRemarks(faultId);
        return ApiResponse.ok(remarks);
    }

    @GetMapping("/faults/pending")
    public ApiResponse<PageResult<GateFault>> getPendingFaults(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        GateFaultQuery query = new GateFaultQuery();
        query.setStatus(FaultStatus.PENDING.name());
        query.setPage(page);
        query.setSize(size);
        return ApiResponse.ok(gateFaultService.queryFaults(query));
    }

    @GetMapping("/logs")
    public ApiResponse<PageResult<ParkingLogVO>> queryLogs(
            @RequestParam(required = false) Long gateId,
            @RequestParam(required = false) String plateNumber,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResult<ParkingLogVO> result = parkingLogService.queryLogs(
                gateId, plateNumber, eventType, startTime, endTime, page, size);
        return ApiResponse.ok(result);
    }
}
