package com.security.survey.service;

import com.security.survey.dto.PlanConfirmDTO;
import com.security.survey.dto.RemarkDTO;
import com.security.survey.dto.StuckReportDTO;
import com.security.survey.entity.PlanConfirm;
import com.security.survey.entity.PointSurvey;
import com.security.survey.entity.Remark;
import com.security.survey.entity.User;
import com.security.survey.enums.ConfirmStatus;
import com.security.survey.enums.SurveyStatus;
import com.security.survey.repository.PlanConfirmRepository;
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
public class PlanConfirmService {

    @Autowired
    private PlanConfirmRepository planRepository;

    @Autowired
    private PointSurveyService surveyService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RemarkRepository remarkRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuthService authService;

    @Transactional
    public PlanConfirm createPlan(PlanConfirmDTO dto) {
        User currentUser = authService.getCurrentUser();

        PointSurvey survey = surveyService.getSurveyById(dto.getSurveyId());
        if (survey.getStatus() != SurveyStatus.APPROVED) {
            throw new RuntimeException("点位勘察单必须先通过审核才能创建方案确认");
        }

        PlanConfirm plan = new PlanConfirm();
        plan.setSurvey(survey);
        plan.setProjectName(dto.getProjectName());
        plan.setProjectCode(dto.getProjectCode());
        plan.setPlanContent(dto.getPlanContent());
        plan.setEquipmentList(dto.getEquipmentList());
        plan.setEstimatedCost(dto.getEstimatedCost());
        plan.setConstructionDays(dto.getConstructionDays());
        plan.setStatus(ConfirmStatus.PENDING);
        plan.setPlanDate(dto.getPlanDate());
        plan.setDeadline(dto.getDeadline());
        plan.setCreatedBy(currentUser);

        if (dto.getAssignedToId() != null) {
            User assignee = userRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("指定的处理人不存在"));
            plan.setAssignedTo(assignee);
        }

        plan = planRepository.save(plan);

        if (dto.getInheritRemarks() != null && dto.getInheritRemarks()) {
            inheritSurveyRemarks(survey.getId(), plan.getId());
        }

        if (dto.getRemarkContent() != null && !dto.getRemarkContent().trim().isEmpty()) {
            addRemark(plan.getId(), dto.getRemarkContent());
        }

        auditService.logCreate("PLAN", plan.getId(), plan.getProjectName(), "创建方案确认单");

        return plan;
    }

    @Transactional
    public void inheritSurveyRemarks(Long surveyId, Long planId) {
        List<Remark> surveyRemarks = surveyService.getRemarksEntity(surveyId);
        PlanConfirm plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("方案确认单不存在"));

        for (Remark surveyRemark : surveyRemarks) {
            Remark inheritedRemark = new Remark();
            inheritedRemark.setContent("[继承自勘察] " + surveyRemark.getContent());
            inheritedRemark.setSourceType("PLAN");
            inheritedRemark.setSourceId(planId);
            inheritedRemark.setCreatedBy(surveyRemark.getCreatedBy());
            inheritedRemark.setInherited(true);
            remarkRepository.save(inheritedRemark);
        }

        auditService.logUpdate("PLAN", planId, null, "已继承 " + surveyRemarks.size() + " 条勘察备注",
                "继承点位勘察备注");
    }

    @Transactional(readOnly = true)
    public List<PlanConfirm> getAllPlans() {
        return planRepository.findAll();
    }

    @Transactional(readOnly = true)
    public PlanConfirm getPlanById(Long id) {
        PlanConfirm plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("方案确认单不存在"));
        auditService.logView("PLAN", id);
        return plan;
    }

    @Transactional(readOnly = true)
    public PlanConfirm getPlanBySurveyId(Long surveyId) {
        return planRepository.findBySurveyId(surveyId)
                .orElseThrow(() -> new RuntimeException("该勘察单对应的方案确认单不存在"));
    }

    @Transactional
    public PlanConfirm updatePlan(Long id, PlanConfirmDTO dto) {
        PlanConfirm plan = getPlanById(id);
        String oldValue = plan.toString();

        plan.setProjectName(dto.getProjectName());
        plan.setProjectCode(dto.getProjectCode());
        plan.setPlanContent(dto.getPlanContent());
        plan.setEquipmentList(dto.getEquipmentList());
        plan.setEstimatedCost(dto.getEstimatedCost());
        plan.setConstructionDays(dto.getConstructionDays());
        plan.setPlanDate(dto.getPlanDate());
        plan.setDeadline(dto.getDeadline());

        if (dto.getAssignedToId() != null) {
            User oldAssignee = plan.getAssignedTo();
            User newAssignee = userRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("指定的处理人不存在"));
            plan.setAssignedTo(newAssignee);
            auditService.logAssign("PLAN", id,
                    oldAssignee != null ? oldAssignee.getRealName() : null,
                    newAssignee.getRealName());
        }

        if (dto.getRemarkContent() != null && !dto.getRemarkContent().trim().isEmpty()) {
            addRemark(id, dto.getRemarkContent());
        }

        plan = planRepository.save(plan);
        auditService.logUpdate("PLAN", id, oldValue, plan.toString(), "更新方案确认单信息");

        return plan;
    }

    @Transactional
    public PlanConfirm changeStatus(Long id, ConfirmStatus newStatus, String remark, String reason) {
        PlanConfirm plan = getPlanById(id);
        ConfirmStatus oldStatus = plan.getStatus();

        if (newStatus == ConfirmStatus.STUCK) {
            plan.setStuck(true);
            plan.setStuckReason(reason);
            plan.setStuckAt(LocalDateTime.now());
        } else if (oldStatus == ConfirmStatus.STUCK && newStatus != ConfirmStatus.STUCK) {
            plan.setStuck(false);
            plan.setStuckReason(null);
            plan.setStuckAt(null);
        }

        if (newStatus == ConfirmStatus.CONFIRMED) {
            plan.setConfirmedAt(LocalDateTime.now());
        }

        plan.setStatus(newStatus);
        plan = planRepository.save(plan);

        if (remark != null && !remark.trim().isEmpty()) {
            addRemark(id, remark);
        }

        String detail = "状态从 " + oldStatus + " 变更为 " + newStatus;
        if (reason != null) {
            detail += "，原因: " + reason;
        }
        auditService.logStatusChange("PLAN", id, oldStatus.name(), newStatus.name(), detail);

        return plan;
    }

    @Transactional
    public PlanConfirm submitPlan(Long id, String remark) {
        return changeStatus(id, ConfirmStatus.SUBMITTED, remark, "提交客户确认");
    }

    @Transactional
    public PlanConfirm confirmPlan(Long id, String remark) {
        PlanConfirm plan = changeStatus(id, ConfirmStatus.CONFIRMED, remark, "客户已确认");
        auditService.logApprove("PLAN", id, "客户确认方案");
        return plan;
    }

    @Transactional
    public PlanConfirm rejectPlan(Long id, String reason, String remark) {
        PlanConfirm plan = changeStatus(id, ConfirmStatus.REJECTED, remark, reason);
        auditService.logReject("PLAN", id, reason);
        return plan;
    }

    @Transactional
    public PlanConfirm revisePlan(Long id, String remark) {
        return changeStatus(id, ConfirmStatus.REVISED, remark, "修改后重新提交");
    }

    @Transactional
    public PlanConfirm markAsStuck(Long id, String reason) {
        return changeStatus(id, ConfirmStatus.STUCK, reason, "标记为卡住");
    }

    @Transactional
    public PlanConfirm unmarkStuck(Long id, String remark) {
        return changeStatus(id, ConfirmStatus.IN_PROGRESS, remark, "解除卡住状态");
    }

    @Transactional
    public Remark addRemark(Long planId, String content) {
        PlanConfirm plan = getPlanById(planId);
        User currentUser = authService.getCurrentUser();

        Remark remark = new Remark();
        remark.setContent(content);
        remark.setSourceType("PLAN");
        remark.setSourceId(planId);
        remark.setCreatedBy(currentUser);
        remark.setInherited(false);

        remark = remarkRepository.save(remark);
        auditService.logAddRemark("PLAN", planId, content);

        return remark;
    }

    @Transactional(readOnly = true)
    public List<RemarkDTO> getRemarks(Long planId) {
        List<Remark> remarks = remarkRepository.findBySourceTypeAndSourceIdOrderByCreatedAtDesc("PLAN", planId);
        return remarks.stream()
                .map(this::convertToRemarkDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RemarkDTO> getInheritedRemarks(Long planId) {
        List<Remark> remarks = remarkRepository.findBySourceTypeAndSourceIdAndInheritedTrueOrderByCreatedAtDesc("PLAN", planId);
        return remarks.stream()
                .map(this::convertToRemarkDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StuckReportDTO getStuckPlans() {
        StuckReportDTO report = new StuckReportDTO();

        List<PlanConfirm> stuckPlans = planRepository.findByStuckTrue();
        report.setTotalStuckPlans(stuckPlans.size());
        report.setStuckPlans(stuckPlans.stream()
                .map(this::convertToStuckItem)
                .collect(Collectors.toList()));

        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        List<PlanConfirm> potentialStuck = planRepository.findPotentiallyStuck(
                List.of(ConfirmStatus.IN_PROGRESS, ConfirmStatus.CUSTOMER_REVIEWING, ConfirmStatus.REVISED),
                threshold
        );
        report.setPotentialStuckPlans(potentialStuck.size());

        return report;
    }

    @Transactional(readOnly = true)
    public List<PlanConfirm> getMyPlans() {
        User currentUser = authService.getCurrentUser();
        return planRepository.findByAssignedTo(currentUser);
    }

    @Transactional(readOnly = true)
    public StuckReportDTO getCombinedStuckReport() {
        StuckReportDTO surveyReport = surveyService.getStuckSurveys();
        StuckReportDTO planReport = getStuckPlans();

        StuckReportDTO combined = new StuckReportDTO();
        combined.setTotalStuckSurveys(surveyReport.getTotalStuckSurveys());
        combined.setTotalStuckPlans(planReport.getTotalStuckPlans());
        combined.setStuckSurveys(surveyReport.getStuckSurveys());
        combined.setStuckPlans(planReport.getStuckPlans());
        combined.setPotentialStuckSurveys(surveyReport.getPotentialStuckSurveys());
        combined.setPotentialStuckPlans(planReport.getPotentialStuckPlans());

        return combined;
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

    private StuckReportDTO.StuckItemDTO convertToStuckItem(PlanConfirm plan) {
        StuckReportDTO.StuckItemDTO dto = new StuckReportDTO.StuckItemDTO();
        dto.setId(plan.getId());
        dto.setProjectName(plan.getProjectName());
        dto.setProjectCode(plan.getProjectCode());
        dto.setStatus(plan.getStatus().name());
        dto.setStuckReason(plan.getStuckReason());
        dto.setStuckAt(plan.getStuckAt());
        dto.setUpdatedAt(plan.getUpdatedAt());

        if (plan.getAssignedTo() != null) {
            dto.setAssignedTo(plan.getAssignedTo().getUsername());
            dto.setAssignedToName(plan.getAssignedTo().getRealName());
        }

        if (plan.getStuckAt() != null) {
            long hours = Duration.between(plan.getStuckAt(), LocalDateTime.now()).toHours();
            dto.setStuckHours(hours);
        }

        return dto;
    }
}
