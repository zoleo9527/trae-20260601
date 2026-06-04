package com.medical.aesthetic.controller;

import com.medical.aesthetic.common.ApiResponse;
import com.medical.aesthetic.entity.FollowUpRecord;
import com.medical.aesthetic.service.FollowUpService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/follow-ups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FollowUpController {

    private final FollowUpService followUpService;

    @GetMapping("/project/{projectId}")
    public ApiResponse<List<FollowUpRecord>> getByProjectId(@PathVariable Long projectId) {
        return ApiResponse.success(followUpService.getByProjectId(projectId));
    }

    @PostMapping
    public ApiResponse<FollowUpRecord> create(
            @RequestParam Long projectId,
            @RequestParam String followUpType,
            @RequestParam String customerCondition,
            @RequestParam String guidance,
            @RequestParam String customerFeedback,
            @RequestParam(required = false) Integer satisfactionScore,
            @RequestParam(required = false) String nextStep,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime nextFollowUpTime) {
        return ApiResponse.success("回访记录已创建",
                followUpService.create(projectId, followUpType, customerCondition, guidance,
                        customerFeedback, satisfactionScore, nextStep, nextFollowUpTime));
    }
}
