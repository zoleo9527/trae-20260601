package com.security.survey.service;

import com.security.survey.dto.AuditLogDTO;
import com.security.survey.entity.AuditLog;
import com.security.survey.entity.User;
import com.security.survey.enums.AuditAction;
import com.security.survey.repository.AuditLogRepository;
import com.security.survey.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void logAction(AuditAction action, String targetType, Long targetId,
                          String oldValue, String newValue, String detail) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = null;
        if (auth != null && auth.getPrincipal() instanceof User) {
            currentUser = (User) auth.getPrincipal();
        }

        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setDetail(detail);
        log.setPerformedBy(currentUser);

        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getAuditLogsForTarget(String targetType, Long targetId) {
        List<AuditLog> logs = auditLogRepository.findByTargetTypeAndTargetIdOrderByPerformedAtDesc(targetType, targetId);
        return logs.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getAuditLogsForUser(Long userId) {
        List<AuditLog> logs = auditLogRepository.findByPerformedByIdOrderByPerformedAtDesc(userId);
        return logs.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private AuditLogDTO convertToDTO(AuditLog log) {
        AuditLogDTO dto = new AuditLogDTO();
        dto.setId(log.getId());
        dto.setAction(log.getAction().name());
        dto.setTargetType(log.getTargetType());
        dto.setTargetId(log.getTargetId());
        dto.setOldValue(log.getOldValue());
        dto.setNewValue(log.getNewValue());
        dto.setDetail(log.getDetail());
        dto.setPerformedAt(log.getPerformedAt());
        dto.setIpAddress(log.getIpAddress());

        if (log.getPerformedBy() != null) {
            dto.setPerformedBy(log.getPerformedBy().getUsername());
            dto.setPerformedByName(log.getPerformedBy().getRealName());
        }

        return dto;
    }

    public void logCreate(String targetType, Long targetId, String newValue, String detail) {
        logAction(AuditAction.CREATE, targetType, targetId, null, newValue, detail);
    }

    public void logUpdate(String targetType, Long targetId, String oldValue, String newValue, String detail) {
        logAction(AuditAction.UPDATE, targetType, targetId, oldValue, newValue, detail);
    }

    public void logStatusChange(String targetType, Long targetId, String oldStatus, String newStatus, String detail) {
        logAction(AuditAction.STATUS_CHANGE, targetType, targetId, oldStatus, newStatus, detail);
    }

    public void logAddRemark(String targetType, Long targetId, String remarkContent) {
        logAction(AuditAction.ADD_REMARK, targetType, targetId, null, remarkContent, "添加备注");
    }

    public void logAssign(String targetType, Long targetId, String oldAssignee, String newAssignee) {
        logAction(AuditAction.ASSIGN, targetType, targetId, oldAssignee, newAssignee, "分配处理人");
    }

    public void logApprove(String targetType, Long targetId, String detail) {
        logAction(AuditAction.APPROVE, targetType, targetId, null, null, detail);
    }

    public void logReject(String targetType, Long targetId, String reason) {
        logAction(AuditAction.REJECT, targetType, targetId, null, reason, "拒绝: " + reason);
    }

    public void logSubmit(String targetType, Long targetId, String detail) {
        logAction(AuditAction.SUBMIT, targetType, targetId, null, null, detail);
    }

    public void logView(String targetType, Long targetId) {
        logAction(AuditAction.VIEW, targetType, targetId, null, null, "查看详情");
    }
}
