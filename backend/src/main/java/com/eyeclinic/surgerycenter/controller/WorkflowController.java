package com.eyeclinic.surgerycenter.controller;

import com.eyeclinic.surgerycenter.common.Result;
import com.eyeclinic.surgerycenter.dto.PreoperativeCheckDTO;
import com.eyeclinic.surgerycenter.dto.WorkflowDTO;
import com.eyeclinic.surgerycenter.dto.WorkflowVO;
import com.eyeclinic.surgerycenter.entity.User;
import com.eyeclinic.surgerycenter.entity.WorkflowInstance;
import com.eyeclinic.surgerycenter.enums.RoleType;
import com.eyeclinic.surgerycenter.repository.UserRepository;
import com.eyeclinic.surgerycenter.service.PreoperativeCheckService;
import com.eyeclinic.surgerycenter.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflow")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkflowController {

    private final WorkflowService workflowService;
    private final PreoperativeCheckService checkService;
    private final UserRepository userRepository;

    @PostMapping
    public Result<WorkflowVO> createWorkflow(@Valid @RequestBody WorkflowDTO.CreateRequest request) {
        User creator = userRepository.findByRole(RoleType.RECEPTIONIST).stream().findFirst()
                .orElseThrow(() -> new RuntimeException("默认用户不存在"));
        WorkflowInstance workflow = workflowService.createWorkflow(request, creator);
        return Result.success(workflowService.convertToDetailVO(workflow));
    }

    @GetMapping
    public Result<List<WorkflowVO.SimpleVO>> getWorkflows(
            @RequestParam(required = false) Long handlerId) {
        List<WorkflowInstance> workflows;
        if (handlerId != null) {
            workflows = workflowService.getWorkflowsByHandler(handlerId);
        } else {
            workflows = workflowService.getAllActiveWorkflows();
        }
        return Result.success(workflowService.convertToSimpleVO(workflows));
    }

    @GetMapping("/{id}")
    public Result<WorkflowVO> getWorkflowDetail(@PathVariable Long id) {
        WorkflowInstance workflow = workflowService.getWorkflow(id);
        return Result.success(workflowService.convertToDetailVO(workflow));
    }

    @PostMapping("/{id}/start-check")
    public Result<WorkflowVO> startPreoperativeCheck(
            @PathVariable Long id,
            @Valid @RequestBody WorkflowDTO.StartCheckRequest request) {
        WorkflowInstance workflow = workflowService.startPreoperativeCheck(id, request);
        return Result.success(workflowService.convertToDetailVO(workflow));
    }

    @PostMapping("/check-item")
    public Result<Void> updateCheckItem(@Valid @RequestBody PreoperativeCheckDTO.UpdateRequest request) {
        checkService.updateCheckItem(request);
        return Result.success();
    }

    @PostMapping("/{id}/submit-check")
    public Result<WorkflowVO> submitCheckForReview(
            @PathVariable Long id,
            @Valid @RequestBody WorkflowDTO.SubmitForReviewRequest request) {
        WorkflowInstance workflow = workflowService.submitCheckForReview(id, request);
        return Result.success(workflowService.convertToDetailVO(workflow));
    }

    @PostMapping("/{id}/review-check")
    public Result<WorkflowVO> reviewPreoperativeCheck(
            @PathVariable Long id,
            @Valid @RequestBody WorkflowDTO.ReviewRequest request) {
        WorkflowInstance workflow = workflowService.reviewPreoperativeCheck(id, request);
        return Result.success(workflowService.convertToDetailVO(workflow));
    }

    @PostMapping("/{id}/start-scheduling")
    public Result<WorkflowVO> startScheduling(
            @PathVariable Long id,
            @Valid @RequestBody WorkflowDTO.StartSchedulingRequest request) {
        WorkflowInstance workflow = workflowService.startScheduling(id, request);
        return Result.success(workflowService.convertToDetailVO(workflow));
    }

    @PostMapping("/{id}/submit-schedule")
    public Result<WorkflowVO> submitScheduleForReview(
            @PathVariable Long id,
            @Valid @RequestBody WorkflowDTO.ScheduleRequest request) {
        WorkflowInstance workflow = workflowService.submitScheduleForReview(id, request);
        return Result.success(workflowService.convertToDetailVO(workflow));
    }

    @PostMapping("/{id}/review-schedule")
    public Result<WorkflowVO> reviewSchedule(
            @PathVariable Long id,
            @Valid @RequestBody WorkflowDTO.ReviewRequest request) {
        WorkflowInstance workflow = workflowService.reviewSchedule(id, request);
        return Result.success(workflowService.convertToDetailVO(workflow));
    }

    @PostMapping("/{id}/complete")
    public Result<WorkflowVO> completeWorkflow(@PathVariable Long id) {
        WorkflowInstance workflow = workflowService.completeWorkflow(id);
        return Result.success(workflowService.convertToDetailVO(workflow));
    }
}
