
package com.example.recruitment.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.recruitment.dto.request.CandidateApplicationCreateRequest;
import com.example.recruitment.dto.request.CandidateApplicationQueryRequest;
import com.example.recruitment.dto.request.CandidateApplicationStatusRequest;
import com.example.recruitment.dto.request.CandidateApplicationUpdateRequest;
import com.example.recruitment.dto.response.CandidateApplicationResponse;
import com.example.recruitment.entity.CandidateApplication;
import com.example.recruitment.entity.Position;
import com.example.recruitment.enums.ApplicationStatusEnum;
import com.example.recruitment.enums.PositionStatusEnum;
import com.example.recruitment.exception.BusinessException;
import com.example.recruitment.mapper.CandidateApplicationMapper;
import com.example.recruitment.mapper.PositionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CandidateApplicationService {

    private final CandidateApplicationMapper candidateApplicationMapper;
    private final PositionMapper positionMapper;
    private final SystemLogService systemLogService;

    @Transactional
    public CandidateApplicationResponse create(CandidateApplicationCreateRequest request) {
        Position position = positionMapper.selectById(request.getPositionId());
        if (position == null) {
            throw new BusinessException(404, "岗位不存在");
        }
        
        if (position.getStatus() != PositionStatusEnum.PUBLISHED.getCode()) {
            throw new BusinessException(400, "岗位状态不允许报名");
        }

        LocalDateTime now = LocalDateTime.now();
        CandidateApplication application = CandidateApplication.builder()
                .positionId(request.getPositionId())
                .positionName(position.getPositionName())
                .candidateName(request.getCandidateName())
                .candidatePhone(request.getCandidatePhone())
                .candidateIdCard(request.getCandidateIdCard())
                .age(request.getAge())
                .gender(request.getGender())
                .education(request.getEducation())
                .workExperience(request.getWorkExperience())
                .skills(request.getSkills())
                .sourceChannel(request.getSourceChannel())
                .judgmentNote(request.getJudgmentNote())
                .status(ApplicationStatusEnum.PENDING.getCode())
                .submittedBy(request.getSubmittedBy())
                .submittedByName(request.getSubmittedByName())
                .submittedAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build();

        candidateApplicationMapper.insert(application);

        systemLogService.logApplication(application.getId(), request.getSubmittedBy(), 
                request.getSubmittedByName(), "提交候选报名: " + request.getCandidateName());

        return convertToResponse(application);
    }

    public CandidateApplicationResponse getById(Long id) {
        CandidateApplication application = candidateApplicationMapper.selectById(id);
        if (application == null) {
            throw new BusinessException(404, "报名记录不存在");
        }
        return convertToResponse(application);
    }

    public IPage<CandidateApplicationResponse> query(CandidateApplicationQueryRequest request) {
        Integer pageNum = request.getPageNum() != null ? request.getPageNum() : 1;
        Integer pageSize = request.getPageSize() != null ? request.getPageSize() : 10;
        
        Page<CandidateApplication> page = new Page<>(pageNum, pageSize);
        IPage<CandidateApplication> resultPage = candidateApplicationMapper.selectPageWithFilters(
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
    public CandidateApplicationResponse update(Long id, CandidateApplicationUpdateRequest request) {
        CandidateApplication application = candidateApplicationMapper.selectById(id);
        if (application == null) {
            throw new BusinessException(404, "报名记录不存在");
        }

        if (application.getStatus() != ApplicationStatusEnum.PENDING.getCode()) {
            throw new BusinessException(400, "仅待审核状态可修改");
        }

        if (request.getCandidateName() != null) {
            application.setCandidateName(request.getCandidateName());
        }
        if (request.getCandidatePhone() != null) {
            application.setCandidatePhone(request.getCandidatePhone());
        }
        if (request.getCandidateIdCard() != null) {
            application.setCandidateIdCard(request.getCandidateIdCard());
        }
        if (request.getAge() != null) {
            application.setAge(request.getAge());
        }
        if (request.getGender() != null) {
            application.setGender(request.getGender());
        }
        if (request.getEducation() != null) {
            application.setEducation(request.getEducation());
        }
        if (request.getWorkExperience() != null) {
            application.setWorkExperience(request.getWorkExperience());
        }
        if (request.getSkills() != null) {
            application.setSkills(request.getSkills());
        }
        if (request.getSourceChannel() != null) {
            application.setSourceChannel(request.getSourceChannel());
        }
        if (request.getJudgmentNote() != null) {
            application.setJudgmentNote(request.getJudgmentNote());
        }
        application.setUpdatedAt(LocalDateTime.now());

        candidateApplicationMapper.updateById(application);

        return convertToResponse(application);
    }

    @Transactional
    public CandidateApplicationResponse updateStatus(Long id, CandidateApplicationStatusRequest request) {
        CandidateApplication application = candidateApplicationMapper.selectById(id);
        if (application == null) {
            throw new BusinessException(404, "报名记录不存在");
        }

        ApplicationStatusEnum targetStatus = ApplicationStatusEnum.fromCode(request.getStatus());
        if (targetStatus == null) {
            throw new BusinessException(400, "无效的状态值");
        }

        ApplicationStatusEnum currentStatus = ApplicationStatusEnum.fromCode(application.getStatus());
        validateStatusTransition(currentStatus, targetStatus);

        String logContent;
        application.setStatus(targetStatus.getCode());
        application.setUpdatedAt(LocalDateTime.now());

        if (targetStatus == ApplicationStatusEnum.CONFIRMED) {
            application.setConfirmedBy(request.getOperatorId());
            application.setConfirmedAt(LocalDateTime.now());
            logContent = "确认报名审核通过";
        } else if (targetStatus == ApplicationStatusEnum.REJECTED) {
            application.setRejectedReason(request.getRejectedReason());
            logContent = "拒绝报名: " + (request.getRejectedReason() != null ? request.getRejectedReason() : "无");
        } else {
            logContent = "状态变更为: " + targetStatus.getDesc();
        }

        candidateApplicationMapper.updateById(application);

        systemLogService.logApplication(id, request.getOperatorId(), 
                request.getOperatorName(), logContent);

        return convertToResponse(application);
    }

    private void validateStatusTransition(ApplicationStatusEnum current, ApplicationStatusEnum target) {
        if (current == ApplicationStatusEnum.HIRED || current == ApplicationStatusEnum.ABANDONED) {
            throw new BusinessException(400, "已入职或已放弃的记录无法修改状态");
        }

        if (current == ApplicationStatusEnum.REJECTED && target != ApplicationStatusEnum.PENDING) {
            throw new BusinessException(400, "已拒绝的记录只能重新改为待审核");
        }
    }

    public List<CandidateApplicationResponse> getTodayPending() {
        List<CandidateApplication> applications = candidateApplicationMapper.selectTodayPending();
        return applications.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<CandidateApplicationResponse> getTimeoutApplications() {
        List<CandidateApplication> applications = candidateApplicationMapper.selectTimeoutApplications();
        return applications.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    public List<CandidateApplicationResponse> getRecentlyRejected() {
        List<CandidateApplication> applications = candidateApplicationMapper.selectRecentlyRejected();
        return applications.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    private CandidateApplicationResponse convertToResponse(CandidateApplication application) {
        return CandidateApplicationResponse.builder()
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
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }
}
