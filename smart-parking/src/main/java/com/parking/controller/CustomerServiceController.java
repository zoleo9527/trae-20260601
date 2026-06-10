package com.parking.controller;

import com.parking.dto.*;
import com.parking.entity.RemoteRelease;
import com.parking.enums.ReleaseStatus;
import com.parking.service.MonthlyRentalService;
import com.parking.service.RemoteReleaseService;
import com.parking.service.SupplementRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer-service")
@RequiredArgsConstructor
public class CustomerServiceController {

    private final RemoteReleaseService remoteReleaseService;
    private final MonthlyRentalService monthlyRentalService;
    private final SupplementRecordService supplementRecordService;

    @GetMapping("/releases/pending")
    public ApiResponse<PageResult<RemoteRelease>> getPendingReleases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        RemoteReleaseQuery query = new RemoteReleaseQuery();
        query.setStatus(ReleaseStatus.PENDING.name());
        query.setPage(page);
        query.setSize(size);
        return ApiResponse.ok(remoteReleaseService.queryReleases(query));
    }

    @GetMapping("/releases")
    public ApiResponse<PageResult<RemoteRelease>> queryReleases(RemoteReleaseQuery query) {
        PageResult<RemoteRelease> result = remoteReleaseService.queryReleases(query);
        return ApiResponse.ok(result);
    }

    @GetMapping("/releases/{releaseId}/review")
    public ApiResponse<RemoteReleaseReviewVO> getReviewDetail(@PathVariable Long releaseId) {
        RemoteReleaseReviewVO detail = remoteReleaseService.getReviewDetail(releaseId);
        return ApiResponse.ok(detail);
    }

    @PostMapping("/releases/review")
    public ApiResponse<RemoteRelease> reviewRelease(@Valid @RequestBody RemoteReleaseReviewRequest request) {
        RemoteRelease release = remoteReleaseService.reviewRelease(request);
        return ApiResponse.ok("审核完成", release);
    }

    @PostMapping("/releases")
    public ApiResponse<RemoteRelease> createRelease(@Valid @RequestBody RemoteReleaseCreateRequest request) {
        RemoteRelease release = remoteReleaseService.createRelease(request);
        return ApiResponse.ok("远程放行申请已创建", release);
    }

    @GetMapping("/releases/by-fault/{faultId}")
    public ApiResponse<java.util.List<RemoteRelease>> getReleasesByFault(@PathVariable Long faultId) {
        return ApiResponse.ok(remoteReleaseService.getReleasesByFaultId(faultId));
    }

    @GetMapping("/monthly-rentals/check")
    public ApiResponse<Boolean> checkMonthlyRental(
            @RequestParam String plateNumber,
            @RequestParam Long parkingLotId) {
        return ApiResponse.ok(monthlyRentalService.isMonthlyRental(plateNumber, parkingLotId));
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
    public ApiResponse<java.util.List<SupplementRecordVO>> getSupplementsByRelease(@PathVariable Long releaseId) {
        return ApiResponse.ok(supplementRecordService.getByReleaseId(releaseId));
    }
}
