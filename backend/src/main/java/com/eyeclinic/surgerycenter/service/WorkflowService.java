package com.eyeclinic.surgerycenter.service;

import com.eyeclinic.surgerycenter.dto.WorkflowDTO;
import com.eyeclinic.surgerycenter.dto.WorkflowVO;
import com.eyeclinic.surgerycenter.entity.*;
import com.eyeclinic.surgerycenter.enums.ErrorCode;
import com.eyeclinic.surgerycenter.enums.RoleType;
import com.eyeclinic.surgerycenter.enums.WorkflowStatus;
import com.eyeclinic.surgerycenter.exception.BusinessException;
import com.eyeclinic.surgerycenter.repository.PatientRepository;
import com.eyeclinic.surgerycenter.repository.UserRepository;
import com.eyeclinic.surgerycenter.repository.WorkflowInstanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowInstanceRepository workflowRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final WorkflowStateMachine stateMachine;
    private final PreoperativeCheckService checkService;
    private final SurgeryScheduleService scheduleService;
    private final OperationLogService logService;

    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public WorkflowInstance createWorkflow(WorkflowDTO.CreateRequest request, User creator) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PATIENT_NOT_FOUND));

        if (workflowRepository.existsByPatientAndStatusNotIn(patient, stateMachine.getCompletedStatuses())) {
            throw new BusinessException(ErrorCode.ALREADY_IN_PROGRESS, "该患者已有正在处理中的流程");
        }

        List<User> receptionists = userRepository.findByRole(RoleType.RECEPTIONIST);
        User defaultHandler = receptionists.isEmpty() ? null : receptionists.get(0);

        WorkflowInstance workflow = new WorkflowInstance();
        workflow.setWorkflowNo("WF" + System.currentTimeMillis());
        workflow.setPatient(patient);
        workflow.setSurgeryType(request.getSurgeryType());
        workflow.setStatus(WorkflowStatus.PENDING_REGISTRATION);
        workflow.setCurrentHandler(defaultHandler);
        workflow.setCurrentNodeName(WorkflowStatus.PENDING_REGISTRATION.getDescription());
        workflow.setBlockReason(stateMachine.getBlockReason(WorkflowStatus.PENDING_REGISTRATION));
        workflow.setRemarks(request.getRemarks());
        workflow.setCreatedBy(creator);
        workflow.setStatusUpdatedAt(LocalDateTime.now());

        workflow = workflowRepository.save(workflow);
        checkService.initializeCheckItems(workflow);

        logService.createStatusTransitionLog(workflow, null, WorkflowStatus.PENDING_REGISTRATION, creator, "创建流程");

        return workflow;
    }

    @Transactional
    public WorkflowInstance startPreoperativeCheck(Long workflowId, WorkflowDTO.StartCheckRequest request) {
        WorkflowInstance workflow = getWorkflow(workflowId);
        User handler = userRepository.findById(request.getHandlerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "处理人不存在"));

        User checker = userRepository.findById(request.getCheckerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "检查负责人不存在"));

        if (checker.getRole() != RoleType.SPECIALIST) {
            throw new BusinessException(ErrorCode.PERMISSION_DENIED, "检查负责人必须是专业人员");
        }

        stateMachine.validateTransition(workflow.getStatus(), WorkflowStatus.PREOP_IN_PROGRESS, handler.getRole());

        WorkflowStatus prevStatus = workflow.getStatus();
        workflow.setStatus(WorkflowStatus.PREOP_IN_PROGRESS);
        workflow.setCurrentHandler(checker);
        workflow.setCurrentNodeName(WorkflowStatus.PREOP_IN_PROGRESS.getDescription());
        workflow.setBlockReason(stateMachine.getBlockReason(WorkflowStatus.PREOP_IN_PROGRESS));
        workflow.setStatusUpdatedAt(LocalDateTime.now());

        logService.createStatusTransitionLog(workflow, prevStatus, WorkflowStatus.PREOP_IN_PROGRESS, handler,
                "启动术前检查，检查负责人：" + checker.getRealName());

        return workflowRepository.save(workflow);
    }

    @Transactional
    public WorkflowInstance submitCheckForReview(Long workflowId, WorkflowDTO.SubmitForReviewRequest request) {
        WorkflowInstance workflow = getWorkflow(workflowId);
        User operator = userRepository.findById(request.getOperatorId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "操作人不存在"));

        checkService.validateChecksCompleted(workflow);
        stateMachine.validateTransition(workflow.getStatus(), WorkflowStatus.PREOP_REVIEW, operator.getRole());

        List<User> supervisors = userRepository.findByRole(RoleType.SUPERVISOR);
        User supervisor = supervisors.isEmpty() ? null : supervisors.get(0);

        WorkflowStatus prevStatus = workflow.getStatus();
        workflow.setStatus(WorkflowStatus.PREOP_REVIEW);
        workflow.setCurrentHandler(supervisor);
        workflow.setCurrentNodeName(WorkflowStatus.PREOP_REVIEW.getDescription());
        workflow.setBlockReason(stateMachine.getBlockReason(WorkflowStatus.PREOP_REVIEW));
        workflow.setStatusUpdatedAt(LocalDateTime.now());

        logService.createStatusTransitionLog(workflow, prevStatus, WorkflowStatus.PREOP_REVIEW, operator, request.getRemarks());

        return workflowRepository.save(workflow);
    }

    @Transactional
    public WorkflowInstance reviewPreoperativeCheck(Long workflowId, WorkflowDTO.ReviewRequest request) {
        WorkflowInstance workflow = getWorkflow(workflowId);
        User reviewer = userRepository.findById(request.getReviewerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "审核人不存在"));

        WorkflowStatus targetStatus = Boolean.TRUE.equals(request.getApproved())
                ? WorkflowStatus.PREOP_APPROVED
                : WorkflowStatus.PREOP_REJECTED;

        stateMachine.validateTransition(workflow.getStatus(), targetStatus, reviewer.getRole());

        WorkflowStatus prevStatus = workflow.getStatus();
        workflow.setStatus(targetStatus);
        workflow.setCurrentNodeName(targetStatus.getDescription());
        workflow.setBlockReason(stateMachine.getBlockReason(targetStatus));
        workflow.setStatusUpdatedAt(LocalDateTime.now());

        if (targetStatus == WorkflowStatus.PREOP_REJECTED) {
            List<User> specialists = userRepository.findByRole(RoleType.SPECIALIST);
            workflow.setCurrentHandler(specialists.isEmpty() ? null : specialists.get(0));
        } else {
            List<User> receptionists = userRepository.findByRole(RoleType.RECEPTIONIST);
            workflow.setCurrentHandler(receptionists.isEmpty() ? null : receptionists.get(0));
        }

        String remarks = Boolean.TRUE.equals(request.getApproved())
                ? "审核通过"
                : "审核驳回: " + request.getRejectionReason();
        logService.createStatusTransitionLog(workflow, prevStatus, targetStatus, reviewer, remarks);

        return workflowRepository.save(workflow);
    }

    @Transactional
    public WorkflowInstance startScheduling(Long workflowId, WorkflowDTO.StartCheckRequest request) {
        WorkflowInstance workflow = getWorkflow(workflowId);
        User handler = userRepository.findById(request.getHandlerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "处理人不存在"));

        stateMachine.validateTransition(workflow.getStatus(), WorkflowStatus.SCHEDULING, handler.getRole());

        WorkflowStatus prevStatus = workflow.getStatus();
        workflow.setStatus(WorkflowStatus.SCHEDULING);
        workflow.setCurrentHandler(handler);
        workflow.setCurrentNodeName(WorkflowStatus.SCHEDULING.getDescription());
        workflow.setBlockReason(stateMachine.getBlockReason(WorkflowStatus.SCHEDULING));
        workflow.setStatusUpdatedAt(LocalDateTime.now());

        logService.createStatusTransitionLog(workflow, prevStatus, WorkflowStatus.SCHEDULING, handler, "开始手术排期");

        return workflowRepository.save(workflow);
    }

    @Transactional
    public WorkflowInstance submitScheduleForReview(Long workflowId, WorkflowDTO.ScheduleRequest request) {
        WorkflowInstance workflow = getWorkflow(workflowId);

        scheduleService.createSchedule(workflow, request);

        User operator = userRepository.findById(request.getHandlerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "操作人不存在"));

        stateMachine.validateTransition(workflow.getStatus(), WorkflowStatus.SCHEDULE_REVIEW, operator.getRole());

        List<User> supervisors = userRepository.findByRole(RoleType.SUPERVISOR);
        User supervisor = supervisors.isEmpty() ? null : supervisors.get(0);

        WorkflowStatus prevStatus = workflow.getStatus();
        workflow.setStatus(WorkflowStatus.SCHEDULE_REVIEW);
        workflow.setCurrentHandler(supervisor);
        workflow.setCurrentNodeName(WorkflowStatus.SCHEDULE_REVIEW.getDescription());
        workflow.setBlockReason(stateMachine.getBlockReason(WorkflowStatus.SCHEDULE_REVIEW));
        workflow.setStatusUpdatedAt(LocalDateTime.now());

        logService.createStatusTransitionLog(workflow, prevStatus, WorkflowStatus.SCHEDULE_REVIEW, operator, "提交排期审核");

        return workflowRepository.save(workflow);
    }

    @Transactional
    public WorkflowInstance reviewSchedule(Long workflowId, WorkflowDTO.ReviewRequest request) {
        WorkflowInstance workflow = getWorkflow(workflowId);
        User reviewer = userRepository.findById(request.getReviewerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "审核人不存在"));

        WorkflowStatus targetStatus = Boolean.TRUE.equals(request.getApproved())
                ? WorkflowStatus.SCHEDULE_CONFIRMED
                : WorkflowStatus.SCHEDULE_REJECTED;

        stateMachine.validateTransition(workflow.getStatus(), targetStatus, reviewer.getRole());

        SurgerySchedule schedule = scheduleService.getSchedule(workflow)
                .orElseThrow(() -> new BusinessException(ErrorCode.DATA_NOT_FOUND, "排期不存在"));
        scheduleService.confirmSchedule(schedule, reviewer, Boolean.TRUE.equals(request.getApproved()), request.getRejectionReason());

        WorkflowStatus prevStatus = workflow.getStatus();
        workflow.setStatus(targetStatus);
        workflow.setCurrentNodeName(targetStatus.getDescription());
        workflow.setBlockReason(stateMachine.getBlockReason(targetStatus));
        workflow.setStatusUpdatedAt(LocalDateTime.now());

        if (targetStatus == WorkflowStatus.SCHEDULE_REJECTED) {
            List<User> receptionists = userRepository.findByRole(RoleType.RECEPTIONIST);
            workflow.setCurrentHandler(receptionists.isEmpty() ? null : receptionists.get(0));
        } else {
            workflow.setCurrentHandler(null);
        }

        String remarks = Boolean.TRUE.equals(request.getApproved())
                ? "排期审核通过"
                : "排期审核驳回: " + request.getRejectionReason();
        logService.createStatusTransitionLog(workflow, prevStatus, targetStatus, reviewer, remarks);

        return workflowRepository.save(workflow);
    }

    @Transactional
    public WorkflowInstance completeWorkflow(Long workflowId) {
        WorkflowInstance workflow = getWorkflow(workflowId);

        if (workflow.getStatus() != WorkflowStatus.SCHEDULE_CONFIRMED) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION, "只有已确认排期的流程可以完成");
        }

        WorkflowStatus prevStatus = workflow.getStatus();
        workflow.setStatus(WorkflowStatus.COMPLETED);
        workflow.setCurrentNodeName(WorkflowStatus.COMPLETED.getDescription());
        workflow.setBlockReason(stateMachine.getBlockReason(WorkflowStatus.COMPLETED));
        workflow.setCurrentHandler(null);
        workflow.setStatusUpdatedAt(LocalDateTime.now());

        logService.createStatusTransitionLog(workflow, prevStatus, WorkflowStatus.COMPLETED, null, "流程完成");

        return workflowRepository.save(workflow);
    }

    public WorkflowInstance getWorkflow(Long workflowId) {
        return workflowRepository.findById(workflowId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WORKFLOW_NOT_FOUND));
    }

    public WorkflowInstance getWorkflowByNo(String workflowNo) {
        return workflowRepository.findByWorkflowNo(workflowNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.WORKFLOW_NOT_FOUND));
    }

    public List<WorkflowInstance> getAllActiveWorkflows() {
        return workflowRepository.findAllActive(stateMachine.getCompletedStatuses());
    }

    public List<WorkflowInstance> getWorkflowsByHandler(Long handlerId) {
        return workflowRepository.findActiveByHandlerId(handlerId, stateMachine.getCompletedStatuses());
    }

    public WorkflowVO convertToDetailVO(WorkflowInstance workflow) {
        WorkflowVO vo = new WorkflowVO();
        vo.setId(workflow.getId());
        vo.setWorkflowNo(workflow.getWorkflowNo());
        vo.setPatientId(workflow.getPatient().getId());
        vo.setPatientName(workflow.getPatient().getName());
        vo.setPatientNo(workflow.getPatient().getPatientNo());
        vo.setSurgeryType(workflow.getSurgeryType());
        vo.setSurgeryTypeName(workflow.getSurgeryType().getDescription());
        vo.setStatus(workflow.getStatus());
        vo.setStatusName(workflow.getStatus().getDescription());
        vo.setStatusDescription(workflow.getStatus().getDescription());
        vo.setCurrentHandler(workflow.getCurrentHandler() != null ? workflow.getCurrentHandler().getRealName() : null);
        vo.setCurrentHandlerRole(workflow.getCurrentHandler() != null ? workflow.getCurrentHandler().getRole().getDescription() : workflow.getStatus().getResponsibleRole());
        vo.setBlockReason(workflow.getBlockReason());
        vo.setRemarks(workflow.getRemarks());
        vo.setCreatedAt(workflow.getCreatedAt() != null ? workflow.getCreatedAt().format(formatter) : null);
        vo.setUpdatedAt(workflow.getUpdatedAt() != null ? workflow.getUpdatedAt().format(formatter) : null);
        vo.setStatusUpdatedAt(workflow.getStatusUpdatedAt() != null ? workflow.getStatusUpdatedAt().format(formatter) : null);

        List<PreoperativeCheck> checks = checkService.getCheckItems(workflow);
        vo.setCheckItems(checkService.convertToVO(checks));

        scheduleService.getSchedule(workflow).ifPresent(schedule ->
                vo.setScheduleInfo(scheduleService.convertToVO(schedule)));

        List<OperationLog> logs = logService.getLogsByWorkflow(workflow);
        vo.setOperationLogs(logs.stream().map(log -> {
            WorkflowVO.OperationLogVO logVO = new WorkflowVO.OperationLogVO();
            logVO.setId(log.getId());
            logVO.setOperationType(log.getOperationType());
            logVO.setOperationDesc(log.getOperationDesc());
            logVO.setPreviousStatus(log.getPreviousStatus() != null ? log.getPreviousStatus().getDescription() : null);
            logVO.setNewStatus(log.getNewStatus() != null ? log.getNewStatus().getDescription() : null);
            logVO.setOperatorName(log.getOperatorName());
            logVO.setRemarks(log.getRemarks());
            logVO.setCreatedAt(log.getCreatedAt() != null ? log.getCreatedAt().format(formatter) : null);
            return logVO;
        }).toList());

        return vo;
    }

    public List<WorkflowVO.SimpleVO> convertToSimpleVO(List<WorkflowInstance> workflows) {
        return workflows.stream().map(w -> {
            WorkflowVO.SimpleVO vo = new WorkflowVO.SimpleVO();
            vo.setId(w.getId());
            vo.setWorkflowNo(w.getWorkflowNo());
            vo.setPatientName(w.getPatient().getName());
            vo.setSurgeryType(w.getSurgeryType());
            vo.setSurgeryTypeName(w.getSurgeryType().getDescription());
            vo.setStatus(w.getStatus());
            vo.setStatusName(w.getStatus().getDescription());
            vo.setCurrentHandler(w.getCurrentHandler() != null ? w.getCurrentHandler().getRealName() : null);
            vo.setCurrentHandlerRole(w.getCurrentHandler() != null ? w.getCurrentHandler().getRole().getDescription() : w.getStatus().getResponsibleRole());
            vo.setBlockReason(w.getBlockReason());
            vo.setCreatedAt(w.getCreatedAt() != null ? w.getCreatedAt().format(formatter) : null);
            return vo;
        }).toList();
    }
}
