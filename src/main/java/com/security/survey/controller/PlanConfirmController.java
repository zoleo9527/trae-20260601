package com.security.survey.controller;

import com.security.survey.dto.ApiResponse;
import com.security.survey.dto.PlanConfirmDTO;
import com.security.survey.dto.RemarkDTO;
import com.security.survey.dto.StatusChangeDTO;
import com.security.survey.dto.StuckReportDTO;
import com.security.survey.entity.PlanConfirm;
import com.security.survey.enums.ConfirmStatus;
import com.security.survey.service.PlanConfirmService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/plans")
@CrossOrigin(origins = "*")
public class PlanConfirmController {

    @Autowired
    private PlanConfirmService planService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'CONSTRUCTION_LEADER')")
    public ApiResponse<PlanConfirm> createPlan(@Valid @RequestBody PlanConfirmDTO dto) {
        PlanConfirm plan = planService.createPlan(dto);
        return ApiResponse.success("方案确认单创建成功", plan);
    }

    @GetMapping
    public ApiResponse<List<PlanConfirm>> getAllPlans() {
        return ApiResponse.success(planService.getAllPlans());
    }

    @GetMapping("/my")
    public ApiResponse<List<PlanConfirm>> getMyPlans() {
        return ApiResponse.success(planService.getMyPlans());
    }

    @GetMapping("/stuck")
    public ApiResponse<StuckReportDTO> getStuckPlans() {
        return ApiResponse.success(planService.getCombinedStuckReport());
    }

    @GetMapping("/{id}")
    public ApiResponse<PlanConfirm> getPlanById(@PathVariable Long id) {
        return ApiResponse.success(planService.getPlanById(id));
    }

    @GetMapping("/survey/{surveyId}")
    public ApiResponse<PlanConfirm> getPlanBySurveyId(@PathVariable Long surveyId) {
        return ApiResponse.success(planService.getPlanBySurveyId(surveyId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'CONSTRUCTION_LEADER')")
    public ApiResponse<PlanConfirm> updatePlan(@PathVariable Long id, @Valid @RequestBody PlanConfirmDTO dto) {
        PlanConfirm plan = planService.updatePlan(id, dto);
        return ApiResponse.success("方案确认单更新成功", plan);
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<PlanConfirm> changeStatus(@PathVariable Long id, @Valid @RequestBody StatusChangeDTO dto) {
        ConfirmStatus newStatus = ConfirmStatus.valueOf(dto.getStatus());
        PlanConfirm plan = planService.changeStatus(id, newStatus, dto.getRemark(), dto.getReason());
        return ApiResponse.success("状态更新成功", plan);
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'CONSTRUCTION_LEADER')")
    public ApiResponse<PlanConfirm> submitPlan(@PathVariable Long id, @RequestBody(required = false) StatusChangeDTO dto) {
        String remark = dto != null ? dto.getRemark() : null;
        PlanConfirm plan = planService.submitPlan(id, remark);
        return ApiResponse.success("已提交客户确认", plan);
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ApiResponse<PlanConfirm> confirmPlan(@PathVariable Long id, @RequestBody(required = false) StatusChangeDTO dto) {
        String remark = dto != null ? dto.getRemark() : null;
        PlanConfirm plan = planService.confirmPlan(id, remark);
        return ApiResponse.success("客户已确认方案", plan);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ApiResponse<PlanConfirm> rejectPlan(@PathVariable Long id, @Valid @RequestBody StatusChangeDTO dto) {
        PlanConfirm plan = planService.rejectPlan(id, dto.getReason(), dto.getRemark());
        return ApiResponse.success("客户已拒绝方案", plan);
    }

    @PostMapping("/{id}/revise")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'CONSTRUCTION_LEADER')")
    public ApiResponse<PlanConfirm> revisePlan(@PathVariable Long id, @RequestBody(required = false) StatusChangeDTO dto) {
        String remark = dto != null ? dto.getRemark() : null;
        PlanConfirm plan = planService.revisePlan(id, remark);
        return ApiResponse.success("已修改并重新提交", plan);
    }

    @PostMapping("/{id}/stuck")
    public ApiResponse<PlanConfirm> markAsStuck(@PathVariable Long id, @Valid @RequestBody StatusChangeDTO dto) {
        PlanConfirm plan = planService.markAsStuck(id, dto.getReason());
        return ApiResponse.success("已标记为卡住", plan);
    }

    @PostMapping("/{id}/unstick")
    public ApiResponse<PlanConfirm> unmarkStuck(@PathVariable Long id, @RequestBody(required = false) StatusChangeDTO dto) {
        String remark = dto != null ? dto.getRemark() : null;
        PlanConfirm plan = planService.unmarkStuck(id, remark);
        return ApiResponse.success("已解除卡住状态", plan);
    }

    @PostMapping("/{id}/remarks")
    public ApiResponse<RemarkDTO> addRemark(@PathVariable Long id, @RequestBody StatusChangeDTO dto) {
        planService.addRemark(id, dto.getRemark());
        return ApiResponse.success("备注添加成功", null);
    }

    @GetMapping("/{id}/remarks")
    public ApiResponse<List<RemarkDTO>> getRemarks(@PathVariable Long id) {
        return ApiResponse.success(planService.getRemarks(id));
    }

    @GetMapping("/{id}/remarks/inherited")
    public ApiResponse<List<RemarkDTO>> getInheritedRemarks(@PathVariable Long id) {
        return ApiResponse.success(planService.getInheritedRemarks(id));
    }
}
