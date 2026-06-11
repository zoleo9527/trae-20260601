package com.security.survey.controller;

import com.security.survey.dto.ApiResponse;
import com.security.survey.dto.AuditLogDTO;
import com.security.survey.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/audit")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('PROJECT_MANAGER')")
public class AuditController {

    @Autowired
    private AuditService auditService;

    @GetMapping("/{targetType}/{targetId}")
    public ApiResponse<List<AuditLogDTO>> getAuditLogs(@PathVariable String targetType, @PathVariable Long targetId) {
        return ApiResponse.success(auditService.getAuditLogsForTarget(targetType.toUpperCase(), targetId));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<AuditLogDTO>> getUserAuditLogs(@PathVariable Long userId) {
        return ApiResponse.success(auditService.getAuditLogsForUser(userId));
    }
}
