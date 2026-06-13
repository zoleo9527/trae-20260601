
package com.example.recruitment.service;

import com.example.recruitment.entity.SystemLog;
import com.example.recruitment.mapper.SystemLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

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
}
