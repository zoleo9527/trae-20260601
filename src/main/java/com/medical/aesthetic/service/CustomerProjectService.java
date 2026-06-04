package com.medical.aesthetic.service;

import com.medical.aesthetic.common.ResultCode;
import com.medical.aesthetic.context.UserContext;
import com.medical.aesthetic.dto.ProjectDetailVO;
import com.medical.aesthetic.dto.ProjectScheduleDTO;
import com.medical.aesthetic.dto.StatusChangeDTO;
import com.medical.aesthetic.entity.*;
import com.medical.aesthetic.enums.ProjectStatus;
import com.medical.aesthetic.enums.RoleType;
import com.medical.aesthetic.exception.BusinessException;
import com.medical.aesthetic.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerProjectService {

    private final CustomerProjectRepository customerProjectRepository;
    private final EmployeeRepository employeeRepository;
    private final HistoryNoteService historyNoteService;
    private final MaterialReservationRepository materialReservationRepository;
    private final OrderRepository orderRepository;
    private final InstallmentPlanRepository installmentPlanRepository;
    private final ComplaintRepository complaintRepository;
    private final FollowUpRecordRepository followUpRecordRepository;

    @Transactional(readOnly = true)
    public List<CustomerProject> listByRole() {
        RoleType role = UserContext.getCurrentRole();
        Employee currentEmployee = UserContext.getCurrentEmployee();

        if (role == RoleType.CONSULTANT) {
            return customerProjectRepository.findByConsultantId(currentEmployee.getId());
        } else if (role == RoleType.DOCTOR_ASSISTANT) {
            return customerProjectRepository.findByDoctorAssistantId(currentEmployee.getId());
        } else if (role == RoleType.CUSTOMER_SERVICE) {
            return customerProjectRepository.findAll();
        }
        return customerProjectRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<CustomerProject> listByStatus(ProjectStatus status) {
        return customerProjectRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<CustomerProject> listPendingScheduling() {
        return customerProjectRepository.findScheduledWithoutMaterialReservation();
    }

    @Transactional(readOnly = true)
    public ProjectDetailVO getDetail(Long id) {
        CustomerProject project = customerProjectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("项目不存在: " + id));

        return ProjectDetailVO.builder()
                .customerProject(project)
                .customer(project.getCustomer())
                .project(project.getProject())
                .consultant(project.getConsultant())
                .doctor(project.getDoctor())
                .doctorAssistant(project.getDoctorAssistant())
                .materialReservations(materialReservationRepository.findByCustomerProjectId(id))
                .order(orderRepository.findByCustomerProjectId(id).stream().findFirst().orElse(null))
                .installmentPlans(orderRepository.findByCustomerProjectId(id).stream()
                        .flatMap(o -> installmentPlanRepository.findByOrderIdOrdered(o.getId()).stream())
                        .toList())
                .complaints(complaintRepository.findByCustomerProjectId(id))
                .followUpRecords(followUpRecordRepository.findByCustomerProjectIdOrderByFollowUpTimeDesc(id))
                .historyNotes(historyNoteService.getProjectHistory(id))
                .build();
    }

    @Transactional
    public CustomerProject scheduleProject(ProjectScheduleDTO dto) {
        CustomerProject project = customerProjectRepository.findById(dto.getCustomerProjectId())
                .orElseThrow(() -> new IllegalArgumentException("项目不存在: " + dto.getCustomerProjectId()));

        if (project.getStatus() != ProjectStatus.CONFIRMED && project.getStatus() != ProjectStatus.QUOTED) {
            throw new BusinessException(ResultCode.INVALID_STATUS_TRANSITION,
                    "当前状态不允许排期: " + project.getStatus().getDisplayName());
        }

        if (!UserContext.hasRole(RoleType.DOCTOR_ASSISTANT) && !UserContext.hasRole(RoleType.CONSULTANT)) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }

        ProjectStatus oldStatus = project.getStatus();

        if (dto.getScheduledTime() != null) {
            project.setScheduledTime(dto.getScheduledTime());
        }
        if (dto.getOperatingRoom() != null) {
            project.setOperatingRoom(dto.getOperatingRoom());
        }
        if (dto.getDoctorId() != null) {
            Employee doctor = employeeRepository.findById(dto.getDoctorId()).orElse(null);
            project.setDoctor(doctor);
        }
        if (dto.getDoctorAssistantId() != null) {
            Employee assistant = employeeRepository.findById(dto.getDoctorAssistantId()).orElse(null);
            project.setDoctorAssistant(assistant);
        }
        if (dto.getPreOperationNote() != null) {
            project.setPreOperationNote(dto.getPreOperationNote());
        }

        project.setStatus(ProjectStatus.SCHEDULED);

        CustomerProject saved = customerProjectRepository.save(project);

        String scheduleInfo = String.format("排期时间：%s，手术室：%s，医生：%s，助理：%s，术前注意：%s",
                dto.getScheduledTime(), dto.getOperatingRoom(),
                project.getDoctor() != null ? project.getDoctor().getName() : "未指定",
                project.getDoctorAssistant() != null ? project.getDoctorAssistant().getName() : "未指定",
                dto.getPreOperationNote());
        historyNoteService.addScheduleNote(dto.getCustomerProjectId(), scheduleInfo);
        historyNoteService.addStatusChangeNote(dto.getCustomerProjectId(),
                oldStatus.getDisplayName(), ProjectStatus.SCHEDULED.getDisplayName(),
                dto.getOperatorRemark() != null ? dto.getOperatorRemark() : "项目已排期");

        return saved;
    }

    @Transactional
    public CustomerProject changeStatus(StatusChangeDTO dto) {
        CustomerProject project = customerProjectRepository.findById(dto.getCustomerProjectId())
                .orElseThrow(() -> new IllegalArgumentException("项目不存在: " + dto.getCustomerProjectId()));

        ProjectStatus oldStatus = project.getStatus();
        ProjectStatus newStatus = ProjectStatus.valueOf(dto.getNewStatus());

        validateStatusTransition(oldStatus, newStatus);

        project.setStatus(newStatus);
        CustomerProject saved = customerProjectRepository.save(project);

        historyNoteService.addStatusChangeNote(dto.getCustomerProjectId(),
                oldStatus.getDisplayName(), newStatus.getDisplayName(), dto.getChangeReason());

        if (dto.getInternalRemark() != null && !dto.getInternalRemark().isEmpty()) {
            historyNoteService.addInternalNote(dto.getCustomerProjectId(), dto.getChangeReason(), dto.getInternalRemark());
        }

        log.info("项目状态变更 - 项目ID: {}, 状态: {} -> {}, 操作人: {}",
                dto.getCustomerProjectId(), oldStatus, newStatus, UserContext.getCurrentUsername());

        return saved;
    }

    @Transactional
    public CustomerProject updatePromise(Long projectId, String promiseContent) {
        CustomerProject project = customerProjectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("项目不存在: " + projectId));

        if (!UserContext.hasRole(RoleType.CONSULTANT)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有咨询师可以更新承诺内容");
        }

        String oldPromise = project.getPromiseContent();
        project.setPromiseContent(promiseContent);
        CustomerProject saved = customerProjectRepository.save(project);

        historyNoteService.addPromiseNote(projectId, oldPromise, promiseContent);

        return saved;
    }

    @Transactional
    public CustomerProject updateTreatmentPlan(Long projectId, String treatmentPlan) {
        CustomerProject project = customerProjectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("项目不存在: " + projectId));

        if (!UserContext.hasRole(RoleType.CONSULTANT)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只有咨询师可以更新治疗方案");
        }

        String oldPlan = project.getTreatmentPlan();
        project.setTreatmentPlan(treatmentPlan);
        CustomerProject saved = customerProjectRepository.save(project);

        historyNoteService.addNote(projectId, "TREATMENT_PLAN", "治疗方案更新",
                "治疗方案已更新", "treatmentPlan", oldPlan, treatmentPlan, null);

        return saved;
    }

    private void validateStatusTransition(ProjectStatus oldStatus, ProjectStatus newStatus) {
        boolean valid = switch (oldStatus) {
            case CONSULTING -> newStatus == ProjectStatus.QUOTED || newStatus == ProjectStatus.CANCELLED;
            case QUOTED -> newStatus == ProjectStatus.CONFIRMED || newStatus == ProjectStatus.CANCELLED;
            case CONFIRMED -> newStatus == ProjectStatus.SCHEDULED || newStatus == ProjectStatus.CANCELLED;
            case SCHEDULED -> newStatus == ProjectStatus.MATERIAL_RESERVED
                    || newStatus == ProjectStatus.CANCELLED || newStatus == ProjectStatus.COMPLAINT;
            case MATERIAL_RESERVED -> newStatus == ProjectStatus.IN_PROGRESS
                    || newStatus == ProjectStatus.SCHEDULED || newStatus == ProjectStatus.CANCELLED;
            case IN_PROGRESS -> newStatus == ProjectStatus.COMPLETED || newStatus == ProjectStatus.COMPLAINT;
            case COMPLETED -> newStatus == ProjectStatus.FOLLOWED_UP || newStatus == ProjectStatus.COMPLAINT;
            case FOLLOWED_UP -> newStatus == ProjectStatus.COMPLAINT;
            case COMPLAINT -> newStatus == ProjectStatus.FOLLOWED_UP
                    || newStatus == ProjectStatus.COMPLETED || newStatus == ProjectStatus.CANCELLED;
            case CANCELLED -> false;
        };

        if (!valid) {
            throw new BusinessException(ResultCode.INVALID_STATUS_TRANSITION,
                    String.format("不允许从 %s 变更为 %s", oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }
    }

    @Transactional(readOnly = true)
    public List<CustomerProject> getProjectsWithoutAssistant() {
        return customerProjectRepository.findProjectsWithoutAssistant();
    }

    @Transactional(readOnly = true)
    public List<CustomerProject> getScheduledProjects(LocalDateTime start, LocalDateTime end) {
        return customerProjectRepository.findScheduledProjects(ProjectStatus.SCHEDULED, start, end);
    }
}
