
package com.example.recruitment.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.recruitment.dto.request.InterviewInvitationCreateRequest;
import com.example.recruitment.dto.request.InterviewInvitationQueryRequest;
import com.example.recruitment.dto.request.InterviewInvitationStatusRequest;
import com.example.recruitment.dto.response.CandidateApplicationResponse;
import com.example.recruitment.dto.response.InterviewInvitationResponse;
import com.example.recruitment.entity.CandidateApplication;
import com.example.recruitment.entity.InterviewInvitation;
import com.example.recruitment.enums.ApplicationStatusEnum;
import com.example.recruitment.enums.InterviewStatusEnum;
import com.example.recruitment.exception.BusinessException;
import com.example.recruitment.mapper.CandidateApplicationMapper;
import com.example.recruitment.mapper.InterviewInvitationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewInvitationService {

    private final InterviewInvitationMapper interviewInvitationMapper;
    private final CandidateApplicationMapper candidateApplicationMapper;
    private final SystemLogService systemLogService;

    @Transactional
    public InterviewInvitationResponse create(InterviewInvitationCreateRequest request) {
        CandidateApplication application = candidateApplicationMapper.selectById(request.getApplicationId());
        if (application == null) {
            throw new BusinessException(404, "报名记录不存在");
        }

        if (application.getStatus() != ApplicationStatusEnum.CONFIRMED.getCode()) {
            throw new BusinessException(400, "仅已确认的报名可创建面试邀约");
        }

        LocalDateTime now = LocalDateTime.now();
        InterviewInvitation invitation = InterviewInvitation.builder()
                .applicationId(request.getApplicationId())
                .positionId(application.getPositionId())
                .positionName(application.getPositionName())
                .candidateName(application.getCandidateName())
                .candidatePhone(application.getCandidatePhone())
                .interviewTime(request.getInterviewTime())
                .interviewLocation(request.getInterviewLocation())
                .interviewerName(request.getInterviewerName())
                .interviewerPhone(request.getInterviewerPhone())
                .status(InterviewStatusEnum.PENDING.getCode())
                .invitedBy(request.getInvitedBy())
                .invitedByName(request.getInvitedByName())
                .invitedAt(now)
                .remark(request.getRemark())
                .createdAt(now)
                .updatedAt(now)
                .build();

        interviewInvitationMapper.insert(invitation);

        systemLogService.logInterview(invitation.getId(), request.getInvitedBy(),
                request.getInvitedByName(), "创建面试邀约: " + application.getCandidateName());

        return convertToResponseWithApplication(invitation);
    }

    public InterviewInvitationResponse getById(Long id) {
        InterviewInvitation invitation = interviewInvitationMapper.selectById(id);
        if (invitation == null) {
            throw new BusinessException(404, "面试邀约不存在");
        }
        return convertToResponseWithApplication(invitation);
    }

    public IPage<InterviewInvitationResponse> query(InterviewInvitationQueryRequest request) {
        Integer pageNum = request.getPageNum() != null ? request.getPageNum() : 1;
        Integer pageSize = request.getPageSize() != null ? request.getPageSize() : 10;

        Page<InterviewInvitation> page = new Page<>(pageNum, pageSize);
        IPage<InterviewInvitation> resultPage = interviewInvitationMapper.selectPageWithFilters(
                page,
                request.getPositionId(),
                request.getStatus(),
                request.getCandidateName(),
                request.getCandidatePhone(),
                request.getStartTime(),
                request.getEndTime()
        );

        return resultPage.convert(this::convertToResponse);
    }

    @Transactional
    public InterviewInvitationResponse updateStatus(Long id, InterviewInvitationStatusRequest request) {
        InterviewInvitation invitation = interviewInvitationMapper.selectById(id);
        if (invitation == null) {
            throw new BusinessException(404, "面试邀约不存在");
        }

        InterviewStatusEnum targetStatus = InterviewStatusEnum.fromCode(request.getStatus());
        if (targetStatus == null) {
            throw new BusinessException(400, "无效的状态值");
        }

        InterviewStatusEnum currentStatus = InterviewStatusEnum.fromCode(invitation.getStatus());
        validateStatusTransition(currentStatus, targetStatus);

        String logContent;
        invitation.setStatus(targetStatus.getCode());
        invitation.setUpdatedAt(LocalDateTime.now());

        if (targetStatus == InterviewStatusEnum.CONFIRMED) {
            invitation.setConfirmedAt(LocalDateTime.now());
            invitation.setCandidateConfirmed(1);
            logContent = "候选人确认参加面试";
        } else if (targetStatus == InterviewStatusEnum.NO_SHOW) {
            invitation.setNoShowReason(request.getNoShowReason());
            logContent = "面试爽约: " + (request.getNoShowReason() != null ? request.getNoShowReason() : "无");
        } else if (targetStatus == InterviewStatusEnum.COMPLETED) {
            logContent = "面试已完成";
        } else if (targetStatus == InterviewStatusEnum.REJECTED) {
            logContent = "拒绝面试邀约";
        } else if (targetStatus == InterviewStatusEnum.EXPIRED) {
            logContent = "面试邀约已过期";
        } else {
            logContent = "状态变更为: " + targetStatus.getDesc();
        }

        if (request.getRemark() != null) {
            invitation.setRemark(request.getRemark());
        }

        interviewInvitationMapper.updateById(invitation);

        systemLogService.logInterview(id, request.getOperatorId(),
                request.getOperatorName(), logContent);

        return convertToResponseWithApplication(invitation);
    }

    private void validateStatusTransition(InterviewStatusEnum current, InterviewStatusEnum target) {
        if (current == InterviewStatusEnum.COMPLETED || 
            current == InterviewStatusEnum.REJECTED || 
            current == InterviewStatusEnum.EXPIRED) {
            throw new BusinessException(400, "已完成、已拒绝或已过期的邀约无法修改状态");
        }
    }

    public List<InterviewInvitationResponse> getTodayPending() {
        List<InterviewInvitation> invitations = interviewInvitationMapper.selectTodayPending();
        return invitations.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<InterviewInvitationResponse> getTimeoutInvitations() {
        List<InterviewInvitation> invitations = interviewInvitationMapper.selectTimeoutInvitations();
        return invitations.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<InterviewInvitationResponse> getRecentlyRejected() {
        List<InterviewInvitation> invitations = interviewInvitationMapper.selectRecentlyRejected();
        return invitations.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<InterviewInvitationResponse> getByApplicationId(Long applicationId) {
        List<InterviewInvitation> invitations = interviewInvitationMapper.selectByApplicationId(applicationId);
        return invitations.stream().map(this::convertToResponseWithApplication).collect(Collectors.toList());
    }

    private InterviewInvitationResponse convertToResponse(InterviewInvitation invitation) {
        return InterviewInvitationResponse.builder()
                .id(invitation.getId())
                .applicationId(invitation.getApplicationId())
                .positionId(invitation.getPositionId())
                .positionName(invitation.getPositionName())
                .candidateName(invitation.getCandidateName())
                .candidatePhone(invitation.getCandidatePhone())
                .interviewTime(invitation.getInterviewTime())
                .interviewLocation(invitation.getInterviewLocation())
                .interviewerName(invitation.getInterviewerName())
                .interviewerPhone(invitation.getInterviewerPhone())
                .status(invitation.getStatus())
                .statusDesc(InterviewStatusEnum.fromCode(invitation.getStatus()) != null ?
                        InterviewStatusEnum.fromCode(invitation.getStatus()).getDesc() : null)
                .invitedBy(invitation.getInvitedBy())
                .invitedByName(invitation.getInvitedByName())
                .invitedAt(invitation.getInvitedAt())
                .confirmedAt(invitation.getConfirmedAt())
                .candidateConfirmed(invitation.getCandidateConfirmed())
                .candidateConfirmedDesc(invitation.getCandidateConfirmed() != null ?
                        (invitation.getCandidateConfirmed() == 1 ? "已确认" : "未确认") : null)
                .noShowReason(invitation.getNoShowReason())
                .remark(invitation.getRemark())
                .createdAt(invitation.getCreatedAt())
                .updatedAt(invitation.getUpdatedAt())
                .build();
    }

    private InterviewInvitationResponse convertToResponseWithApplication(InterviewInvitation invitation) {
        InterviewInvitationResponse response = convertToResponse(invitation);

        CandidateApplication application = candidateApplicationMapper.selectById(invitation.getApplicationId());
        if (application != null) {
            response.setApplication(CandidateApplicationResponse.builder()
                    .id(application.getId())
                    .positionId(application.getPositionId())
                    .positionName(application.getPositionName())
                    .candidateName(application.getCandidateName())
                    .candidatePhone(application.getCandidatePhone())
                    .candidateIdCard(application.getCandidateIdCard())
                    .age(application.getAge())
                    .gender(application.getGender())
                    .genderDesc(application.getGender() != null ? 
                            (application.getGender() == 1 ? "男" : "女") : null)
                    .education(application.getEducation())
                    .workExperience(application.getWorkExperience())
                    .skills(application.getSkills())
                    .sourceChannel(application.getSourceChannel())
                    .judgmentNote(application.getJudgmentNote())
                    .status(application.getStatus())
                    .statusDesc(ApplicationStatusEnum.fromCode(application.getStatus()) != null ?
                            ApplicationStatusEnum.fromCode(application.getStatus()).getDesc() : null)
                    .submittedBy(application.getSubmittedBy())
                    .submittedByName(application.getSubmittedByName())
                    .submittedAt(application.getSubmittedAt())
                    .confirmedBy(application.getConfirmedBy())
                    .confirmedAt(application.getConfirmedAt())
                    .rejectedReason(application.getRejectedReason())
                    .build());
        }

        return response;
    }
}
