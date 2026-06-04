package com.medical.aesthetic.controller;

import com.medical.aesthetic.common.ApiResponse;
import com.medical.aesthetic.dto.ComplaintHandleDTO;
import com.medical.aesthetic.entity.Complaint;
import com.medical.aesthetic.enums.ComplaintStatus;
import com.medical.aesthetic.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ComplaintController {

    private final ComplaintService complaintService;

    @GetMapping
    public ApiResponse<List<Complaint>> list() {
        return ApiResponse.success(complaintService.getMyComplaints());
    }

    @GetMapping("/project/{projectId}")
    public ApiResponse<List<Complaint>> getByProjectId(@PathVariable Long projectId) {
        return ApiResponse.success(complaintService.getByProjectId(projectId));
    }

    @GetMapping("/status/{status}")
    public ApiResponse<List<Complaint>> getByStatus(@PathVariable String status) {
        return ApiResponse.success(complaintService.getByStatus(ComplaintStatus.valueOf(status)));
    }

    @PostMapping
    public ApiResponse<Complaint> create(@RequestParam Long projectId,
                                         @RequestParam String title,
                                         @RequestParam String content,
                                         @RequestParam(required = false) String complaintType) {
        return ApiResponse.success("投诉已提交",
                complaintService.create(projectId, title, content, complaintType));
    }

    @PostMapping("/{id}/assign")
    public ApiResponse<Complaint> assign(@PathVariable Long id, @RequestParam Long handlerId) {
        return ApiResponse.success("已指派处理人", complaintService.assignHandler(id, handlerId));
    }

    @PostMapping("/handle")
    public ApiResponse<Complaint> handle(@RequestBody ComplaintHandleDTO dto) {
        return ApiResponse.success("投诉处理完成", complaintService.handle(dto));
    }

    @PostMapping("/{id}/escalate")
    public ApiResponse<Complaint> escalate(@PathVariable Long id, @RequestParam String reason) {
        return ApiResponse.success("投诉已升级", complaintService.escalate(id, reason));
    }
}
