package com.elevator.maintenance.controller;

import com.elevator.maintenance.common.Result;
import com.elevator.maintenance.dto.BatchReviewRequest;
import com.elevator.maintenance.dto.NoteRequest;
import com.elevator.maintenance.dto.PlanDispatchRequest;
import com.elevator.maintenance.dto.PlanReviewRequest;
import com.elevator.maintenance.entity.MaintenanceNote;
import com.elevator.maintenance.entity.MaintenancePlan;
import com.elevator.maintenance.service.MaintenancePlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plans")
public class MaintenancePlanController {
    @Autowired
    private MaintenancePlanService planService;

    @GetMapping
    public Result<List<MaintenancePlan>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long technicianId) {
        List<MaintenancePlan> plans;
        if (technicianId != null && status != null) {
            plans = planService.findByTechnicianIdAndStatus(technicianId, status);
        } else if (technicianId != null) {
            plans = planService.findByTechnicianId(technicianId);
        } else if (status != null) {
            plans = planService.findByStatus(status);
        } else {
            plans = planService.findAll();
        }
        return Result.success(plans);
    }

    @GetMapping("/{id}")
    public Result<MaintenancePlan> getById(@PathVariable Long id) {
        MaintenancePlan plan = planService.findById(id);
        if (plan != null) {
            return Result.success(plan);
        }
        return Result.error("计划不存在");
    }

    @PostMapping
    public Result<MaintenancePlan> create(@RequestBody MaintenancePlan plan) {
        return Result.success(planService.create(plan));
    }

    @PostMapping("/dispatch")
    public Result<MaintenancePlan> dispatch(@RequestBody PlanDispatchRequest request) {
        MaintenancePlan plan = planService.dispatch(request);
        if (plan != null) {
            return Result.success(plan);
        }
        return Result.error("派单失败");
    }

    @PostMapping("/review")
    public Result<MaintenancePlan> review(@RequestBody PlanReviewRequest request) {
        MaintenancePlan plan = planService.review(request);
        if (plan != null) {
            return Result.success(plan);
        }
        return Result.error("审核失败");
    }

    @PostMapping("/batch-review")
    public Result<List<MaintenancePlan>> batchReview(@RequestBody BatchReviewRequest request) {
        return Result.success(planService.batchReview(request));
    }

    @PostMapping("/notes")
    public Result<MaintenanceNote> addNote(@RequestBody NoteRequest request) {
        return Result.success(planService.addNote(request));
    }

    @GetMapping("/{id}/notes")
    public Result<List<MaintenanceNote>> getNotes(@PathVariable Long id) {
        return Result.success(planService.getNotes(id));
    }

    @PutMapping("/{id}")
    public Result<MaintenancePlan> update(@PathVariable Long id, @RequestBody MaintenancePlan plan) {
        plan.setId(id);
        return Result.success(planService.save(plan));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        planService.deleteById(id);
        return Result.success();
    }
}
