package com.medical.aesthetic.service;

import com.medical.aesthetic.common.ResultCode;
import com.medical.aesthetic.context.UserContext;
import com.medical.aesthetic.dto.ComplaintHandleDTO;
import com.medical.aesthetic.entity.Complaint;
import com.medical.aesthetic.entity.CustomerProject;
import com.medical.aesthetic.entity.Employee;
import com.medical.aesthetic.enums.ComplaintStatus;
import com.medical.aesthetic.enums.ProjectStatus;
import com.medical.aesthetic.enums.RoleType;
import com.medical.aesthetic.exception.BusinessException;
import com.medical.aesthetic.repository.ComplaintRepository;
import com.medical.aesthetic.repository.CustomerProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final CustomerProjectRepository customerProjectRepository;
    private final HistoryNoteService historyNoteService;

    @Transactional(readOnly = true)
    public List<Complaint> getByProjectId(Long projectId) {
        return complaintRepository.findByCustomerProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public List<Complaint> getByStatus(ComplaintStatus status) {
        return complaintRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<Complaint> getMyComplaints() {
        Employee current = UserContext.getCurrentEmployee();
        if (UserContext.hasRole(RoleType.CUSTOMER_SERVICE)) {
            return complaintRepository.findByHandledById(current.getId());
        }
        return complaintRepository.findAll();
    }

    @Transactional
    public Complaint create(Long projectId, String title, String content, String complaintType) {
        CustomerProject project = customerProjectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("项目不存在: " + projectId));

        Complaint complaint = Complaint.builder()
                .customerProject(project)
                .title(title)
                .content(content)
                .complaintType(complaintType)
                .status(ComplaintStatus.PENDING)
                .build();

        Complaint saved = complaintRepository.save(complaint);

        if (project.getStatus() != ProjectStatus.COMPLAINT) {
            ProjectStatus oldStatus = project.getStatus();
            project.setStatus(ProjectStatus.COMPLAINT);
            customerProjectRepository.save(project);
            historyNoteService.addStatusChangeNote(projectId,
                    oldStatus.getDisplayName(),
                    ProjectStatus.COMPLAINT.getDisplayName(),
                    "客户发起投诉: " + title);
        }

        historyNoteService.addComplaintNote(projectId, title, "投诉已提交，等待处理");

        log.info("投诉已创建 - 项目ID: {}, 标题: {}, 类型: {}", projectId, title, complaintType);

        return saved;
    }

    @Transactional
    public Complaint assignHandler(Long complaintId, Long handlerId) {
        if (!UserContext.hasRole(RoleType.CUSTOMER_SERVICE)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有客服可以指派处理人");
        }

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("投诉不存在: " + complaintId));

        if (complaint.getStatus() != ComplaintStatus.PENDING) {
            throw new BusinessException(ResultCode.INVALID_OPERATION,
                    "当前状态不允许指派处理人: " + complaint.getStatus().getDisplayName());
        }

        Employee handler = new Employee();
        handler.setId(handlerId);
        complaint.setHandledBy(handler);
        complaint.setStatus(ComplaintStatus.PROCESSING);

        Complaint saved = complaintRepository.save(complaint);

        historyNoteService.addComplaintNote(complaint.getCustomerProject().getId(),
                complaint.getTitle(), "已指派处理人，处理中");

        return saved;
    }

    @Transactional
    public Complaint handle(ComplaintHandleDTO dto) {
        if (!UserContext.hasRole(RoleType.CUSTOMER_SERVICE)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有客服可以处理投诉");
        }

        Complaint complaint = complaintRepository.findById(dto.getComplaintId())
                .orElseThrow(() -> new IllegalArgumentException("投诉不存在: " + dto.getComplaintId()));

        if (complaint.getStatus() == ComplaintStatus.CLOSED || complaint.getStatus() == ComplaintStatus.RESOLVED) {
            throw new BusinessException(ResultCode.INVALID_OPERATION,
                    "投诉已完成处理，不可重复操作");
        }

        complaint.setHandlingResult(dto.getHandlingResult());
        complaint.setCustomerFeedback(dto.getCustomerFeedback());
        complaint.setSatisfactionScore(dto.getSatisfactionScore());
        complaint.setHandledAt(LocalDateTime.now());
        complaint.setHandledBy(UserContext.getCurrentEmployee());

        if (dto.getNewStatus() != null) {
            complaint.setStatus(ComplaintStatus.valueOf(dto.getNewStatus()));
        } else {
            complaint.setStatus(ComplaintStatus.RESOLVED);
        }

        Complaint saved = complaintRepository.save(complaint);

        historyNoteService.addComplaintNote(complaint.getCustomerProject().getId(),
                complaint.getTitle(), dto.getHandlingResult());

        CustomerProject project = complaint.getCustomerProject();
        if (complaint.getStatus() == ComplaintStatus.RESOLVED || complaint.getStatus() == ComplaintStatus.CLOSED) {
            if (project.getStatus() == ProjectStatus.COMPLAINT) {
                project.setStatus(ProjectStatus.FOLLOWED_UP);
                customerProjectRepository.save(project);
                historyNoteService.addStatusChangeNote(project.getId(),
                        ProjectStatus.COMPLAINT.getDisplayName(),
                        ProjectStatus.FOLLOWED_UP.getDisplayName(),
                        "投诉处理完成");
            }
        }

        log.info("投诉处理完成 - 投诉ID: {}, 结果: {}, 满意度: {}",
                dto.getComplaintId(), dto.getHandlingResult(), dto.getSatisfactionScore());

        return saved;
    }

    @Transactional
    public Complaint escalate(Long complaintId, String reason) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("投诉不存在: " + complaintId));

        complaint.setStatus(ComplaintStatus.ESCALATED);
        Complaint saved = complaintRepository.save(complaint);

        historyNoteService.addComplaintNote(complaint.getCustomerProject().getId(),
                complaint.getTitle(), "投诉已升级，原因：" + reason);

        return saved;
    }
}
