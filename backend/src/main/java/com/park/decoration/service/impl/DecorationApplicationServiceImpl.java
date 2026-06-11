package com.park.decoration.service.impl;

import com.park.decoration.dto.*;
import com.park.decoration.entity.*;
import com.park.decoration.enums.ApplicationStatus;
import com.park.decoration.enums.PermitStatus;
import com.park.decoration.enums.PriorityLevel;
import com.park.decoration.repository.*;
import com.park.decoration.service.DecorationApplicationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DecorationApplicationServiceImpl implements DecorationApplicationService {

    private final DecorationApplicationRepository applicationRepository;
    private final EntryPermitRepository permitRepository;
    private final ExceptionNoteRepository exceptionRepository;
    private final OperationLogRepository logRepository;

    @Override
    @Transactional
    public ApiResponse<DecorationApplicationDTO> submitApplication(DecorationApplicationRequest request) {
        Optional<DecorationApplication> existing = applicationRepository.findByIdempotentKey(request.getIdempotentKey());
        if (existing.isPresent()) {
            return ApiResponse.success(convertToDTO(existing.get()), true);
        }

        DecorationApplication app = new DecorationApplication();
        BeanUtils.copyProperties(request, app);
        app.setApplicationNo(generateApplicationNo());
        app.setStatus(ApplicationStatus.PENDING_REVIEW);
        if (request.getPriority() == null) {
            app.setPriority(PriorityLevel.MEDIUM);
        }
        app.setCreatedBy(request.getCreatedBy() != null ? request.getCreatedBy() : "system");
        app.setUpdatedBy(app.getCreatedBy());

        DecorationApplication saved;
        try {
            saved = applicationRepository.save(app);
        } catch (DataIntegrityViolationException e) {
            DecorationApplication dup = applicationRepository.findByIdempotentKey(request.getIdempotentKey())
                    .orElseThrow(() -> e);
            return ApiResponse.success(convertToDTO(dup), true);
        }

        addLog(saved, "SUBMIT", null, null, null,
               "提交装修申请，单号：" + saved.getApplicationNo(), saved.getCreatedBy());

        return ApiResponse.success(convertToDTO(saved), false);
    }

    @Override
    public DecorationApplicationDTO getApplicationById(Long id) {
        DecorationApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("申请不存在，ID：" + id));
        return convertToDTO(app);
    }

    @Override
    public DecorationApplicationDTO getApplicationByNo(String applicationNo) {
        DecorationApplication app = applicationRepository.findByApplicationNo(applicationNo)
                .orElseThrow(() -> new EntityNotFoundException("申请不存在，单号：" + applicationNo));
        return convertToDTO(app);
    }

    @Override
    public ApplicationDetailDTO getApplicationDetail(Long id) {
        DecorationApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("申请不存在，ID：" + id));

        ApplicationDetailDTO detail = new ApplicationDetailDTO();
        detail.setApplication(convertToDTO(app));
        detail.setPermits(permitRepository.findByApplicationIdOrderByCreatedAtDesc(id)
                .stream().map(this::convertPermitToDTO).collect(Collectors.toList()));
        detail.setExceptions(exceptionRepository.findByApplicationIdOrderByReportedAtDesc(id)
                .stream().map(this::convertExceptionToDTO).collect(Collectors.toList()));
        detail.setOperationLogs(logRepository.findByApplicationIdOrderByOperatedAtDesc(id)
                .stream().map(this::convertLogToDTO).collect(Collectors.toList()));

        return detail;
    }

    @Override
    public List<DecorationApplicationDTO> listApplications(String status) {
        List<DecorationApplication> apps;
        if (status != null && !status.isEmpty()) {
            apps = applicationRepository.findByStatusOrderByCreatedAtDesc(ApplicationStatus.valueOf(status));
        } else {
            apps = applicationRepository.findAllOrderByUpdatedAtDesc();
        }
        return apps.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DecorationApplicationDTO processApplication(Long id, ApplicationProcessRequest request) {
        DecorationApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("申请不存在，ID：" + id));

        String action = request.getAction();
        String operator = request.getOperator() != null ? request.getOperator() : "system";
        ApplicationStatus oldStatus = app.getStatus();

        switch (action.toUpperCase()) {
            case "ASSIGN":
                if (request.getAssignedHandler() != null) {
                    app.setAssignedHandler(request.getAssignedHandler());
                    app.setStatus(ApplicationStatus.UNDER_REVIEW);
                    addLog(app, "ASSIGN", "assignedHandler", null, request.getAssignedHandler(),
                           "分配处理人：" + request.getAssignedHandler(), operator);
                }
                break;

            case "REVIEW":
                app.setReviewOpinion(request.getReviewOpinion());
                app.setReviewedAt(LocalDateTime.now());
                app.setReviewedBy(operator);
                if (request.getTargetStatus() != null) {
                    app.setStatus(request.getTargetStatus());
                }
                addLog(app, "REVIEW", "status", oldStatus.name(),
                       app.getStatus().name(), "审核意见：" + request.getReviewOpinion(), operator);
                break;

            case "APPROVE":
                app.setStatus(ApplicationStatus.APPROVED);
                app.setReviewOpinion(request.getReviewOpinion() != null ? request.getReviewOpinion() : "审核通过");
                app.setReviewedAt(LocalDateTime.now());
                app.setReviewedBy(operator);
                addLog(app, "APPROVE", "status", oldStatus.name(),
                       ApplicationStatus.APPROVED.name(), "审核通过", operator);
                break;

            case "REJECT":
                app.setStatus(ApplicationStatus.REJECTED);
                app.setReviewOpinion(request.getReviewOpinion());
                app.setReviewedAt(LocalDateTime.now());
                app.setReviewedBy(operator);
                addLog(app, "REJECT", "status", oldStatus.name(),
                       ApplicationStatus.REJECTED.name(), "审核驳回：" + request.getReviewOpinion(), operator);
                break;

            case "START":
                app.setStatus(ApplicationStatus.IN_PROGRESS);
                addLog(app, "START", "status", oldStatus.name(),
                       ApplicationStatus.IN_PROGRESS.name(), "装修施工开始", operator);
                break;

            case "COMPLETE":
                app.setStatus(ApplicationStatus.COMPLETED);
                addLog(app, "COMPLETE", "status", oldStatus.name(),
                       ApplicationStatus.COMPLETED.name(), "装修施工完成", operator);
                break;

            case "CANCEL":
                app.setStatus(ApplicationStatus.CANCELLED);
                addLog(app, "CANCEL", "status", oldStatus.name(),
                       ApplicationStatus.CANCELLED.name(), "申请取消", operator);
                break;

            default:
                throw new IllegalArgumentException("不支持的操作类型：" + action);
        }

        app.setUpdatedBy(operator);
        DecorationApplication saved = applicationRepository.save(app);
        return convertToDTO(saved);
    }

    @Override
    public DashboardOverviewDTO getDashboardOverview() {
        DashboardOverviewDTO dto = new DashboardOverviewDTO();

        List<DecorationApplication> all = applicationRepository.findAll();
        dto.setTotalCount((long) all.size());

        dto.setPendingReviewCount(all.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.PENDING_REVIEW).count());
        dto.setUnderReviewCount(all.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.UNDER_REVIEW).count());

        List<DecorationApplicationDTO> allDTOs = all.stream().map(this::convertToDTO).collect(Collectors.toList());
        dto.setStuckCount(allDTOs.stream().filter(a -> a.getStuckHours() != null && a.getStuckHours() > 24).count());
        dto.setPermitIssuedCount(all.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.PERMIT_ISSUED
                          || a.getStatus() == ApplicationStatus.IN_PROGRESS).count());
        dto.setUnresolvedExceptionCount((long) exceptionRepository.findByResolvedFalseOrderByReportedAtDesc().size());

        List<ApplicationStatus> pendingStatuses = Arrays.asList(
                ApplicationStatus.PENDING_REVIEW, ApplicationStatus.UNDER_REVIEW);
        dto.setPendingList(applicationRepository.findPendingApplicationsOrdered(pendingStatuses)
                .stream().limit(10).map(this::convertToDTO).collect(Collectors.toList()));

        dto.setStuckList(allDTOs.stream()
                .filter(a -> a.getStuckHours() != null && a.getStuckHours() > 24)
                .sorted(Comparator.comparing(DecorationApplicationDTO::getStuckHours).reversed())
                .limit(10).collect(Collectors.toList()));

        dto.setRecentActivities(logRepository.findTop20ByOrderByOperatedAtDesc()
                .stream().map(this::convertLogToDTO).collect(Collectors.toList()));

        dto.setRecentUnresolvedExceptions(exceptionRepository.findByResolvedFalseOrderByReportedAtDesc()
                .stream().limit(10).map(this::convertExceptionToDTO).collect(Collectors.toList()));

        return dto;
    }

    private String generateApplicationNo() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "DEC-" + dateStr + "-" + uuid;
    }

    private void addLog(DecorationApplication app, String type, String field,
                        String oldVal, String newVal, String remark, String operator) {
        OperationLog log = OperationLog.builder()
                .application(app)
                .applicationNo(app.getApplicationNo())
                .operationType(type)
                .fieldName(field)
                .oldValue(oldVal)
                .newValue(newVal)
                .remark(remark)
                .operator(operator)
                .operatedAt(LocalDateTime.now())
                .build();
        logRepository.save(log);
    }

    private DecorationApplicationDTO convertToDTO(DecorationApplication app) {
        DecorationApplicationDTO dto = new DecorationApplicationDTO();
        BeanUtils.copyProperties(app, dto);

        Optional<EntryPermit> latestPermit = permitRepository.findTopByApplicationIdOrderByCreatedAtDesc(app.getId());
        dto.setHasActivePermit(latestPermit.isPresent()
                && latestPermit.get().getStatus() == PermitStatus.APPROVED
                && latestPermit.get().getValidTo().isAfter(LocalDateTime.now()));

        List<ExceptionNote> exceptions = exceptionRepository.findByApplicationIdOrderByReportedAtDesc(app.getId());
        dto.setUnresolvedExceptionCount((int) exceptions.stream().filter(e -> !e.getResolved()).count());

        if (app.getStatus() == ApplicationStatus.PENDING_REVIEW
            || app.getStatus() == ApplicationStatus.UNDER_REVIEW
            || app.getStatus() == ApplicationStatus.APPROVED) {
            long hours = Duration.between(app.getUpdatedAt(), LocalDateTime.now()).toHours();
            dto.setStuckHours(hours);
        }

        return dto;
    }

    private EntryPermitDTO convertPermitToDTO(EntryPermit p) {
        EntryPermitDTO dto = new EntryPermitDTO();
        BeanUtils.copyProperties(p, dto);
        dto.setApplicationId(p.getApplicationId());
        dto.setApplicationNo(p.getApplicationNo());
        return dto;
    }

    private ExceptionNoteDTO convertExceptionToDTO(ExceptionNote e) {
        ExceptionNoteDTO dto = new ExceptionNoteDTO();
        BeanUtils.copyProperties(e, dto);
        dto.setApplicationId(e.getApplicationId());
        dto.setApplicationNo(e.getApplicationNo());
        if (!Boolean.TRUE.equals(e.getResolved()) && e.getReportedAt() != null) {
            long hours = Duration.between(e.getReportedAt(), LocalDateTime.now()).toHours();
            dto.setStuckHours(hours);
        }
        return dto;
    }

    private OperationLogDTO convertLogToDTO(OperationLog l) {
        OperationLogDTO dto = new OperationLogDTO();
        BeanUtils.copyProperties(l, dto);
        dto.setApplicationId(l.getApplicationId());
        dto.setApplicationNo(l.getApplicationNo());
        return dto;
    }
}
