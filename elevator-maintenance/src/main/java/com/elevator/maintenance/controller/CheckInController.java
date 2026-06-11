package com.elevator.maintenance.controller;

import com.elevator.maintenance.common.Result;
import com.elevator.maintenance.dto.CheckInRequest;
import com.elevator.maintenance.dto.CheckOutRequest;
import com.elevator.maintenance.entity.CheckInRecord;
import com.elevator.maintenance.service.CheckInService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/check-in")
public class CheckInController {
    @Autowired
    private CheckInService checkInService;

    @GetMapping
    public Result<List<CheckInRecord>> list(
            @RequestParam(required = false) Long planId,
            @RequestParam(required = false) Long technicianId) {
        List<CheckInRecord> records;
        if (planId != null) {
            records = checkInService.findByPlanId(planId);
        } else if (technicianId != null) {
            records = checkInService.findByTechnicianId(technicianId);
        } else {
            records = checkInService.findAll();
        }
        return Result.success(records);
    }

    @GetMapping("/{id}")
    public Result<CheckInRecord> getById(@PathVariable Long id) {
        CheckInRecord record = checkInService.findById(id);
        if (record != null) {
            return Result.success(record);
        }
        return Result.error("记录不存在");
    }

    @PostMapping
    public Result<CheckInRecord> checkIn(@RequestBody CheckInRequest request) {
        CheckInRecord record = checkInService.checkIn(request);
        if (record != null) {
            return Result.success(record);
        }
        return Result.error("签到失败，可能存在未签退的记录");
    }

    @PostMapping("/check-out")
    public Result<CheckInRecord> checkOut(@RequestBody CheckOutRequest request) {
        CheckInRecord record = checkInService.checkOut(request);
        if (record != null) {
            return Result.success(record);
        }
        return Result.error("签退失败");
    }

    @GetMapping("/current/{planId}")
    public Result<CheckInRecord> getCurrentCheckIn(@PathVariable Long planId) {
        CheckInRecord record = checkInService.getCurrentCheckIn(planId);
        if (record != null) {
            return Result.success(record);
        }
        return Result.error("当前没有进行中的签到");
    }
}
