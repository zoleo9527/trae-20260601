package com.security.survey.controller;

import com.security.survey.dto.ApiResponse;
import com.security.survey.dto.PointSurveyDTO;
import com.security.survey.dto.RemarkDTO;
import com.security.survey.dto.StatusChangeDTO;
import com.security.survey.dto.StuckReportDTO;
import com.security.survey.entity.PointSurvey;
import com.security.survey.enums.SurveyStatus;
import com.security.survey.service.PointSurveyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/surveys")
@CrossOrigin(origins = "*")
public class PointSurveyController {

    @Autowired
    private PointSurveyService surveyService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'CONSTRUCTION_LEADER')")
    public ApiResponse<PointSurvey> createSurvey(@Valid @RequestBody PointSurveyDTO dto) {
        PointSurvey survey = surveyService.createSurvey(dto);
        return ApiResponse.success("勘察单创建成功", survey);
    }

    @GetMapping
    public ApiResponse<List<PointSurvey>> getAllSurveys() {
        return ApiResponse.success(surveyService.getAllSurveys());
    }

    @GetMapping("/my")
    public ApiResponse<List<PointSurvey>> getMySurveys() {
        return ApiResponse.success(surveyService.getMySurveys());
    }

    @GetMapping("/stuck")
    public ApiResponse<StuckReportDTO> getStuckSurveys() {
        return ApiResponse.success(surveyService.getStuckSurveys());
    }

    @GetMapping("/{id}")
    public ApiResponse<PointSurvey> getSurveyById(@PathVariable Long id) {
        return ApiResponse.success(surveyService.getSurveyById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'CONSTRUCTION_LEADER')")
    public ApiResponse<PointSurvey> updateSurvey(@PathVariable Long id, @Valid @RequestBody PointSurveyDTO dto) {
        PointSurvey survey = surveyService.updateSurvey(id, dto);
        return ApiResponse.success("勘察单更新成功", survey);
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<PointSurvey> changeStatus(@PathVariable Long id, @Valid @RequestBody StatusChangeDTO dto) {
        SurveyStatus newStatus = SurveyStatus.valueOf(dto.getStatus());
        PointSurvey survey = surveyService.changeStatus(id, newStatus, dto.getRemark(), dto.getReason());
        return ApiResponse.success("状态更新成功", survey);
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'CONSTRUCTION_LEADER')")
    public ApiResponse<PointSurvey> submitSurvey(@PathVariable Long id, @RequestBody(required = false) StatusChangeDTO dto) {
        String remark = dto != null ? dto.getRemark() : null;
        PointSurvey survey = surveyService.submitSurvey(id, remark);
        return ApiResponse.success("提交成功", survey);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ApiResponse<PointSurvey> approveSurvey(@PathVariable Long id, @RequestBody(required = false) StatusChangeDTO dto) {
        String remark = dto != null ? dto.getRemark() : null;
        PointSurvey survey = surveyService.approveSurvey(id, remark);
        return ApiResponse.success("审核通过", survey);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ApiResponse<PointSurvey> rejectSurvey(@PathVariable Long id, @Valid @RequestBody StatusChangeDTO dto) {
        PointSurvey survey = surveyService.rejectSurvey(id, dto.getReason(), dto.getRemark());
        return ApiResponse.success("已拒绝", survey);
    }

    @PostMapping("/{id}/stuck")
    public ApiResponse<PointSurvey> markAsStuck(@PathVariable Long id, @Valid @RequestBody StatusChangeDTO dto) {
        PointSurvey survey = surveyService.markAsStuck(id, dto.getReason());
        return ApiResponse.success("已标记为卡住", survey);
    }

    @PostMapping("/{id}/unstick")
    public ApiResponse<PointSurvey> unmarkStuck(@PathVariable Long id, @RequestBody(required = false) StatusChangeDTO dto) {
        String remark = dto != null ? dto.getRemark() : null;
        PointSurvey survey = surveyService.unmarkStuck(id, remark);
        return ApiResponse.success("已解除卡住状态", survey);
    }

    @PostMapping("/{id}/remarks")
    public ApiResponse<RemarkDTO> addRemark(@PathVariable Long id, @RequestBody StatusChangeDTO dto) {
        surveyService.addRemark(id, dto.getRemark());
        return ApiResponse.success("备注添加成功", null);
    }

    @GetMapping("/{id}/remarks")
    public ApiResponse<List<RemarkDTO>> getRemarks(@PathVariable Long id) {
        return ApiResponse.success(surveyService.getRemarks(id));
    }
}
