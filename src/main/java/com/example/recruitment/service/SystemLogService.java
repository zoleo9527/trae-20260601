
package com.example.recruitment.service;

import com.example.recruitment.dto.response.SystemLogResponse;
import com.example.recruitment.entity.SystemLog;
import com.example.recruitment.mapper.SystemLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SystemLogService {

    private final SystemLogMapper systemLogMapper;

    public void log(String module, String operationType, String targetType,
                    Long targetId, Long operatorId, String operatorName, String content) {
        SystemLog log = SystemLog.builder()
                .module(module)
                .operationType(operationType)
                .targetType(targetType)
                .targetId(targetId)
                .operatorId(operatorId)
                .operatorName(operatorName)
                .content(content)
                .createdAt(LocalDateTime.now())
                .build();
        systemLogMapper.insert(log);
    }

    public void logApplication(Long applicationId, Long operatorId, String operatorName, String content) {
        log("candidate_application", "UPDATE", "application", applicationId, operatorId, operatorName, content);
    }

    public void logInterview(Long interviewId, Long operatorId, String operatorName, String content) {
        log("interview_invitation", "UPDATE", "interview", interviewId, operatorId, operatorName, content);
    }

    public List<SystemLogResponse> getLogsByApplicationId(Long applicationId) {
        List<SystemLog> logs = systemLogMapper.selectByApplicationId(applicationId);
        return logs.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<SystemLogResponse> getLogsByInterviewId(Long interviewId) {
        List<SystemLog> logs = systemLogMapper.selectByInterviewId(interviewId);
        return logs.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<SystemLogResponse> getLogsByModule(String module) {
        List<SystemLog> logs = systemLogMapper.selectByModule(module);
        return logs.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<SystemLogResponse> getLogsByTargetTypeAndId(String targetType, Long targetId) {
        List<SystemLog> logs = systemLogMapper.selectByTargetTypeAndId(targetType, targetId);
        return logs.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    private SystemLogResponse convertToResponse(SystemLog log) {
        return SystemLogResponse.builder()
                .id(log.getId())
                .module(log.getModule())
                .moduleDesc(getModuleDesc(log.getModule()))
                .operationType(log.getOperationType())
                .operationTypeDesc(getOperationTypeDesc(log.getOperationType()))
                .targetType(log.getTargetType())
                .targetId(log.getTargetId())
                .operatorId(log.getOperatorId())
                .operatorName(log.getOperatorName())
                .content(log.getContent())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private String getModuleDesc(String module) {
        if (module == null) return null;
        switch (module) {
            case "candidate_application":
                return "候选报名";
            case "interview_invitation":
                return "面试邀约";
            default:
                return module;
        }
    }

    private String getOperationTypeDesc(String operationType) {
        if (operationType == null) return null;
        switch (operationType) {
            case "CREATE":
                return "创建";
            case "UPDATE":
                return "更新";
            case "DELETE":
                return "删除";
            default:
                return operationType;
        }
    }
}
