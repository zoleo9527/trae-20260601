package com.medical.aesthetic.service;

import com.medical.aesthetic.common.ResultCode;
import com.medical.aesthetic.context.UserContext;
import com.medical.aesthetic.entity.CustomerProject;
import com.medical.aesthetic.entity.FollowUpRecord;
import com.medical.aesthetic.enums.ProjectStatus;
import com.medical.aesthetic.enums.RoleType;
import com.medical.aesthetic.exception.BusinessException;
import com.medical.aesthetic.repository.CustomerProjectRepository;
import com.medical.aesthetic.repository.FollowUpRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FollowUpService {

    private final FollowUpRecordRepository followUpRecordRepository;
    private final CustomerProjectRepository customerProjectRepository;
    private final HistoryNoteService historyNoteService;

    @Transactional(readOnly = true)
    public List<FollowUpRecord> getByProjectId(Long projectId) {
        return followUpRecordRepository.findByCustomerProjectIdOrderByFollowUpTimeDesc(projectId);
    }

    @Transactional
    public FollowUpRecord create(Long projectId, String followUpType, String customerCondition,
                                 String guidance, String customerFeedback, Integer satisfactionScore,
                                 String nextStep, LocalDateTime nextFollowUpTime) {
        if (!UserContext.hasRole(RoleType.CUSTOMER_SERVICE)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有客服可以创建回访记录");
        }

        CustomerProject project = customerProjectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("项目不存在: " + projectId));

        if (project.getStatus() != ProjectStatus.COMPLETED && project.getStatus() != ProjectStatus.COMPLAINT) {
            throw new BusinessException(ResultCode.INVALID_STATUS_TRANSITION,
                    "当前状态不允许创建回访记录: " + project.getStatus().getDisplayName());
        }

        FollowUpRecord record = FollowUpRecord.builder()
                .customerProject(project)
                .followUpType(followUpType)
                .followUpTime(LocalDateTime.now())
                .followedBy(UserContext.getCurrentEmployee())
                .customerCondition(customerCondition)
                .guidance(guidance)
                .customerFeedback(customerFeedback)
                .satisfactionScore(satisfactionScore)
                .nextStep(nextStep)
                .nextFollowUpTime(nextFollowUpTime)
                .build();

        FollowUpRecord saved = followUpRecordRepository.save(record);

        String followUpContent = String.format("回访类型：%s，客户情况：%s，指导建议：%s，客户反馈：%s，满意度：%d",
                followUpType, customerCondition, guidance, customerFeedback,
                satisfactionScore != null ? satisfactionScore : 0);
        historyNoteService.addFollowUpNote(projectId, followUpContent);

        if (project.getStatus() == ProjectStatus.COMPLETED) {
            ProjectStatus oldStatus = project.getStatus();
            project.setStatus(ProjectStatus.FOLLOWED_UP);
            customerProjectRepository.save(project);
            historyNoteService.addStatusChangeNote(projectId,
                    oldStatus.getDisplayName(),
                    ProjectStatus.FOLLOWED_UP.getDisplayName(),
                    "术后回访完成");
        }

        log.info("回访记录创建成功 - 项目ID: {}, 类型: {}, 满意度: {}", projectId, followUpType, satisfactionScore);

        return saved;
    }
}
