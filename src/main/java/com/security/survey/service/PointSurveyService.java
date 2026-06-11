package com.security.survey.service;

import com.security.survey.dto.PointSurveyDTO;
import com.security.survey.dto.RemarkDTO;
import com.security.survey.dto.StuckReportDTO;
import com.security.survey.entity.PointSurvey;
import com.security.survey.entity.Remark;
import com.security.survey.entity.User;
import com.security.survey.enums.SurveyStatus;
import com.security.survey.repository.PointSurveyRepository;
import com.security.survey.repository.RemarkRepository;
import com.security.survey.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PointSurveyService {

    @Autowired
    private PointSurveyRepository surveyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RemarkRepository remarkRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuthService authService;

    @Transactional
    public PointSurvey createSurvey(PointSurveyDTO dto) {
        User currentUser = authService.getCurrentUser();

        PointSurvey survey = new PointSurvey();
        survey.setProjectName(dto.getProjectName());
        survey.setProjectCode(dto.getProjectCode());
        survey.setCustomerName(dto.getCustomerName());
        survey.setAddress(dto.getAddress());
        survey.setPointDescription(dto.getPointDescription());
        survey.setPointCount(dto.getPointCount());
        survey.setStatus(SurveyStatus.PENDING);
        survey.setSurveyDate(dto.getSurveyDate());
        survey.setDeadline(dto.getDeadline());
        survey.setCreatedBy(currentUser);

        if (dto.getAssignedToId() != null) {
            User assignee = userRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("指定的处理人不存在"));
            survey.setAssignedTo(assignee);
        }

        survey = surveyRepository.save(survey);

        if (dto.getRemarkContent() != null && !dto.getRemarkContent().trim().isEmpty()) {
            addRemark(survey.getId(), dto.getRemarkContent());
        }

        auditService.logCreate("SURVEY", survey.getId(), survey.getProjectName(), "创建点位勘察单");

        return survey;
    }

    @Transactional(readOnly = true)
    public List<PointSurvey> getAllSurveys() {
        return surveyRepository.findAll();
    }

    @Transactional(readOnly = true)
    public PointSurvey getSurveyById(Long id) {
        PointSurvey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("勘察单不存在"));
        auditService.logView("SURVEY", id);
        return survey;
    }

    @Transactional
    public PointSurvey updateSurvey(Long id, PointSurveyDTO dto) {
        PointSurvey survey = getSurveyById(id);
        String oldValue = survey.toString();

        survey.setProjectName(dto.getProjectName());
        survey.setProjectCode(dto.getProjectCode());
        survey.setCustomerName(dto.getCustomerName());
        survey.setAddress(dto.getAddress());
        survey.setPointDescription(dto.getPointDescription());
        survey.setPointCount(dto.getPointCount());
        survey.setSurveyDate(dto.getSurveyDate());
        survey.setDeadline(dto.getDeadline());

        if (dto.getAssignedToId() != null) {
            User oldAssignee = survey.getAssignedTo();
            User newAssignee = userRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("指定的处理人不存在"));
            survey.setAssignedTo(newAssignee);
            auditService.logAssign("SURVEY", id,
                    oldAssignee != null ? oldAssignee.getRealName() : null,
                    newAssignee.getRealName());
        }

        if (dto.getRemarkContent() != null && !dto.getRemarkContent().trim().isEmpty()) {
            addRemark(id, dto.getRemarkContent());
        }

        survey = surveyRepository.save(survey);
        auditService.logUpdate("SURVEY", id, oldValue, survey.toString(), "更新勘察单信息");

        return survey;
    }

    @Transactional
    public PointSurvey changeStatus(Long id, SurveyStatus newStatus, String remark, String reason) {
        PointSurvey survey = getSurveyById(id);
        SurveyStatus oldStatus = survey.getStatus();

        if (newStatus == SurveyStatus.STUCK) {
            survey.setStuck(true);
            survey.setStuckReason(reason);
            survey.setStuckAt(LocalDateTime.now());
        } else if (oldStatus == SurveyStatus.STUCK && newStatus != SurveyStatus.STUCK) {
            survey.setStuck(false);
            survey.setStuckReason(null);
            survey.setStuckAt(null);
        }

        survey.setStatus(newStatus);
        survey = surveyRepository.save(survey);

        if (remark != null && !remark.trim().isEmpty()) {
            addRemark(id, remark);
        }

        String detail = "状态从 " + oldStatus + " 变更为 " + newStatus;
        if (reason != null) {
            detail += "，原因: " + reason;
        }
        auditService.logStatusChange("SURVEY", id, oldStatus.name(), newStatus.name(), detail);

        return survey;
    }

    @Transactional
    public PointSurvey submitSurvey(Long id, String remark) {
        return changeStatus(id, SurveyStatus.SUBMITTED, remark, "提交审核");
    }

    @Transactional
    public PointSurvey approveSurvey(Long id, String remark) {
        return changeStatus(id, SurveyStatus.APPROVED, remark, "审核通过");
    }

    @Transactional
    public PointSurvey rejectSurvey(Long id, String reason, String remark) {
        PointSurvey survey = changeStatus(id, SurveyStatus.REJECTED, remark, reason);
        auditService.logReject("SURVEY", id, reason);
        return survey;
    }

    @Transactional
    public PointSurvey markAsStuck(Long id, String reason) {
        return changeStatus(id, SurveyStatus.STUCK, reason, "标记为卡住");
    }

    @Transactional
    public PointSurvey unmarkStuck(Long id, String remark) {
        return changeStatus(id, SurveyStatus.IN_PROGRESS, remark, "解除卡住状态");
    }

    @Transactional
    public Remark addRemark(Long surveyId, String content) {
        PointSurvey survey = getSurveyById(surveyId);
        User currentUser = authService.getCurrentUser();

        Remark remark = new Remark();
        remark.setContent(content);
        remark.setSourceType("SURVEY");
        remark.setSourceId(surveyId);
        remark.setCreatedBy(currentUser);
        remark.setInherited(false);

        remark = remarkRepository.save(remark);
        auditService.logAddRemark("SURVEY", surveyId, content);

        return remark;
    }

    @Transactional(readOnly = true)
    public List<RemarkDTO> getRemarks(Long surveyId) {
        List<Remark> remarks = remarkRepository.findBySourceTypeAndSourceIdOrderByCreatedAtDesc("SURVEY", surveyId);
        return remarks.stream()
                .map(this::convertToRemarkDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StuckReportDTO getStuckSurveys() {
        StuckReportDTO report = new StuckReportDTO();

        List<PointSurvey> stuckSurveys = surveyRepository.findByStuckTrue();
        report.setTotalStuckSurveys(stuckSurveys.size());
        report.setStuckSurveys(stuckSurveys.stream()
                .map(this::convertToStuckItem)
                .collect(Collectors.toList()));

        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        List<PointSurvey> potentialStuck = surveyRepository.findPotentiallyStuck(
                List.of(SurveyStatus.IN_PROGRESS, SurveyStatus.REVIEWING),
                threshold
        );
        report.setPotentialStuckSurveys(potentialStuck.size());

        return report;
    }

    @Transactional(readOnly = true)
    public List<PointSurvey> getMySurveys() {
        User currentUser = authService.getCurrentUser();
        return surveyRepository.findByAssignedTo(currentUser);
    }

    private RemarkDTO convertToRemarkDTO(Remark remark) {
        RemarkDTO dto = new RemarkDTO();
        dto.setId(remark.getId());
        dto.setContent(remark.getContent());
        dto.setSourceType(remark.getSourceType());
        dto.setSourceId(remark.getSourceId());
        dto.setInherited(remark.getInherited());
        dto.setCreatedAt(remark.getCreatedAt());

        if (remark.getCreatedBy() != null) {
            dto.setCreatedBy(remark.getCreatedBy().getUsername());
            dto.setCreatedByName(remark.getCreatedBy().getRealName());
        }

        return dto;
    }

    private StuckReportDTO.StuckItemDTO convertToStuckItem(PointSurvey survey) {
        StuckReportDTO.StuckItemDTO dto = new StuckReportDTO.StuckItemDTO();
        dto.setId(survey.getId());
        dto.setProjectName(survey.getProjectName());
        dto.setProjectCode(survey.getProjectCode());
        dto.setStatus(survey.getStatus().name());
        dto.setStuckReason(survey.getStuckReason());
        dto.setStuckAt(survey.getStuckAt());
        dto.setUpdatedAt(survey.getUpdatedAt());

        if (survey.getAssignedTo() != null) {
            dto.setAssignedTo(survey.getAssignedTo().getUsername());
            dto.setAssignedToName(survey.getAssignedTo().getRealName());
        }

        if (survey.getStuckAt() != null) {
            long hours = Duration.between(survey.getStuckAt(), LocalDateTime.now()).toHours();
            dto.setStuckHours(hours);
        }

        return dto;
    }

    public List<Remark> getRemarksEntity(Long surveyId) {
        return remarkRepository.findBySourceTypeAndSourceIdOrderByCreatedAtDesc("SURVEY", surveyId);
    }
}
