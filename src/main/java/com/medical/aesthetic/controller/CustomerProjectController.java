package com.medical.aesthetic.controller;

import com.medical.aesthetic.common.ApiResponse;
import com.medical.aesthetic.dto.ProjectDetailVO;
import com.medical.aesthetic.dto.ProjectScheduleDTO;
import com.medical.aesthetic.dto.StatusChangeDTO;
import com.medical.aesthetic.entity.CustomerProject;
import com.medical.aesthetic.enums.ProjectStatus;
import com.medical.aesthetic.service.CustomerProjectService;
import com.medical.aesthetic.service.HistoryNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CustomerProjectController {

    private final CustomerProjectService customerProjectService;
    private final HistoryNoteService historyNoteService;

    @GetMapping
    public ApiResponse<List<CustomerProject>> list() {
        return ApiResponse.success(customerProjectService.listByRole());
    }

    @GetMapping("/status/{status}")
    public ApiResponse<List<CustomerProject>> listByStatus(@PathVariable String status) {
        return ApiResponse.success(customerProjectService.listByStatus(ProjectStatus.valueOf(status)));
    }

    @GetMapping("/pending-scheduling")
    public ApiResponse<List<CustomerProject>> listPendingScheduling() {
        return ApiResponse.success(customerProjectService.listPendingScheduling());
    }

    @GetMapping("/without-assistant")
    public ApiResponse<List<CustomerProject>> listWithoutAssistant() {
        return ApiResponse.success(customerProjectService.getProjectsWithoutAssistant());
    }

    @GetMapping("/scheduled")
    public ApiResponse<List<CustomerProject>> listScheduled(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime start,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime end) {
        return ApiResponse.success(customerProjectService.getScheduledProjects(start, end));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProjectDetailVO> getDetail(@PathVariable Long id) {
        return ApiResponse.success(customerProjectService.getDetail(id));
    }

    @PostMapping("/schedule")
    public ApiResponse<CustomerProject> schedule(@RequestBody ProjectScheduleDTO dto) {
        return ApiResponse.success("排期成功", customerProjectService.scheduleProject(dto));
    }

    @PostMapping("/change-status")
    public ApiResponse<CustomerProject> changeStatus(@RequestBody StatusChangeDTO dto) {
        return ApiResponse.success("状态变更成功", customerProjectService.changeStatus(dto));
    }

    @PutMapping("/{id}/promise")
    public ApiResponse<CustomerProject> updatePromise(@PathVariable Long id, @RequestBody String promiseContent) {
        return ApiResponse.success("承诺内容已更新", customerProjectService.updatePromise(id, promiseContent));
    }

    @PutMapping("/{id}/treatment-plan")
    public ApiResponse<CustomerProject> updateTreatmentPlan(@PathVariable Long id, @RequestBody String treatmentPlan) {
        return ApiResponse.success("治疗方案已更新", customerProjectService.updateTreatmentPlan(id, treatmentPlan));
    }

    @PostMapping("/{id}/notes")
    public ApiResponse<Void> addInternalNote(@PathVariable Long id,
                                             @RequestParam String content,
                                             @RequestParam(required = false) String internalRemark) {
        historyNoteService.addInternalNote(id, content, internalRemark);
        return ApiResponse.success("备注已添加", null);
    }
}
