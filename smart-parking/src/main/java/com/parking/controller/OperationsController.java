package com.parking.controller;

import com.parking.dto.*;
import com.parking.entity.AlertNotification;
import com.parking.entity.GateFault;
import com.parking.entity.MonthlyRental;
import com.parking.entity.RemoteRelease;
import com.parking.enums.FaultStatus;
import com.parking.enums.ReleaseStatus;
import com.parking.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/operations")
@RequiredArgsConstructor
public class OperationsController {

    private final AlertNotificationService alertNotificationService;
    private final GateFaultService gateFaultService;
    private final RemoteReleaseService remoteReleaseService;
    private final MonthlyRentalService monthlyRentalService;
    private final ParkingLogService parkingLogService;
    private final SupplementRecordService supplementRecordService;

    @GetMapping("/dashboard")
    public ApiResponse<DashboardVO> getDashboard() {
        DashboardVO dashboard = new DashboardVO();

        GateFaultQuery pendingFaults = new GateFaultQuery();
        pendingFaults.setStatus(FaultStatus.PENDING.name());
        pendingFaults.setPage(0);
        pendingFaults.setSize(5);
        dashboard.setRecentPendingFaults(gateFaultService.queryFaults(pendingFaults));

        RemoteReleaseQuery pendingReleases = new RemoteReleaseQuery();
        pendingReleases.setStatus(ReleaseStatus.PENDING.name());
        pendingReleases.setPage(0);
        pendingReleases.setSize(5);
        dashboard.setRecentPendingReleases(remoteReleaseService.queryReleases(pendingReleases));

        dashboard.setUnacknowledgedAlerts(alertNotificationService.getUnacknowledgedAlerts(0, 10));

        return ApiResponse.ok(dashboard);
    }

    @GetMapping("/alerts")
    public ApiResponse<PageResult<AlertNotification>> queryAlerts(
            @RequestParam(required = false) Boolean acknowledged,
            @RequestParam(required = false) String alertType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResult<AlertNotification> result = alertNotificationService.queryAlerts(acknowledged, alertType, page, size);
        return ApiResponse.ok(result);
    }

    @PostMapping("/alerts/{alertId}/acknowledge")
    public ApiResponse<AlertNotification> acknowledgeAlert(
            @PathVariable Long alertId,
            @RequestParam String operator) {
        AlertNotification alert = alertNotificationService.acknowledgeAlert(alertId, operator);
        return ApiResponse.ok("已确认告警", alert);
    }

    @PostMapping("/alerts/trigger-timeout-check")
    public ApiResponse<List<AlertNotification>> triggerTimeoutCheck() {
        List<AlertNotification> alerts = alertNotificationService.triggerTimeoutCheck();
        return ApiResponse.ok("超时检查完成，产生" + alerts.size() + "条告警", alerts);
    }

    @GetMapping("/faults")
    public ApiResponse<PageResult<GateFault>> queryFaults(GateFaultQuery query) {
        return ApiResponse.ok(gateFaultService.queryFaults(query));
    }

    @GetMapping("/releases")
    public ApiResponse<PageResult<RemoteRelease>> queryReleases(RemoteReleaseQuery query) {
        return ApiResponse.ok(remoteReleaseService.queryReleases(query));
    }

    @GetMapping("/monthly-rentals")
    public ApiResponse<PageResult<MonthlyRental>> queryMonthlyRentals(
            @RequestParam(required = false) String plateNumber,
            @RequestParam(required = false) Long parkingLotId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(monthlyRentalService.queryRentals(plateNumber, parkingLotId, active, page, size));
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
        return ApiResponse.ok(parkingLogService.queryLogs(gateId, plateNumber, eventType, startTime, endTime, page, size));
    }

    @GetMapping("/supplements")
    public ApiResponse<PageResult<SupplementRecordVO>> querySupplementRecords(
            @RequestParam(required = false) String plateNumber,
            @RequestParam(required = false) Long gateId,
            @RequestParam(required = false) String supplementType,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(supplementRecordService.querySupplementRecords(
                plateNumber, gateId, supplementType, startTime, endTime, page, size));
    }

    @GetMapping("/supplements/by-release/{releaseId}")
    public ApiResponse<List<SupplementRecordVO>> getSupplementsByRelease(@PathVariable Long releaseId) {
        return ApiResponse.ok(supplementRecordService.getByReleaseId(releaseId));
    }

    @GetMapping("/supplements/by-fault/{faultId}")
    public ApiResponse<List<SupplementRecordVO>> getSupplementsByFault(@PathVariable Long faultId) {
        return ApiResponse.ok(supplementRecordService.getByFaultId(faultId));
    }

    @lombok.Data
    public static class DashboardVO {
        private PageResult<GateFault> recentPendingFaults;
        private PageResult<RemoteRelease> recentPendingReleases;
        private PageResult<AlertNotification> unacknowledgedAlerts;
    }
}
