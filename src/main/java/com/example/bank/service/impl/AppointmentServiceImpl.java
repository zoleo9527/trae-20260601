package com.example.bank.service.impl;

import com.example.bank.dto.request.AppointmentCreateRequest;
import com.example.bank.dto.response.AppointmentResponse;
import com.example.bank.entity.Appointment;
import com.example.bank.entity.HistoryRecord;
import com.example.bank.entity.User;
import com.example.bank.enums.AppointmentStatus;
import com.example.bank.repository.AppointmentRepository;
import com.example.bank.repository.HistoryRecordRepository;
import com.example.bank.repository.UserRepository;
import com.example.bank.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final HistoryRecordRepository historyRecordRepository;

    @Override
    @Transactional
    public AppointmentResponse createAppointment(AppointmentCreateRequest request) {
        Appointment appointment = Appointment.builder()
                .appointmentNo(generateAppointmentNo())
                .customerName(request.getCustomerName())
                .customerId(request.getCustomerId())
                .customerPhone(request.getCustomerPhone())
                .businessType(request.getBusinessType())
                .status(AppointmentStatus.PENDING)
                .appointmentTime(request.getAppointmentTime())
                .urgentLevel(request.getUrgentLevel() != null ? request.getUrgentLevel() : 1)
                .remarks(request.getRemarks())
                .build();

        appointment = appointmentRepository.save(appointment);
        
        createHistoryRecord(appointment.getId(), "CREATE", "创建预约", null);
        
        return convertToResponse(appointment);
    }

    @Override
    public AppointmentResponse getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        return convertToResponse(appointment);
    }

    @Override
    public AppointmentResponse getAppointmentByNo(String appointmentNo) {
        Appointment appointment = appointmentRepository.findByAppointmentNo(appointmentNo);
        if (appointment == null) {
            throw new RuntimeException("预约不存在");
        }
        return convertToResponse(appointment);
    }

    @Override
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> getAppointmentsByStatus(String status) {
        AppointmentStatus statusEnum = AppointmentStatus.valueOf(status.toUpperCase());
        return appointmentRepository.findByStatus(statusEnum).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> getPendingAppointments() {
        List<AppointmentStatus> statuses = Arrays.asList(
                AppointmentStatus.PENDING,
                AppointmentStatus.CHECKED_IN,
                AppointmentStatus.PROCESSING,
                AppointmentStatus.MATERIAL_INCOMPLETE,
                AppointmentStatus.DUE_DILIGENCE_PENDING,
                AppointmentStatus.COMPLAINT_RECORDED
        );
        return appointmentRepository.findByStatusInOrderByPriority(statuses).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentResponse checkIn(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new RuntimeException("预约状态不允许签到");
        }
        
        appointment.setStatus(AppointmentStatus.CHECKED_IN);
        appointment.setCheckInTime(LocalDateTime.now());
        appointment.setEstimatedWaitTime(calculateWaitTime());
        
        appointment = appointmentRepository.save(appointment);
        createHistoryRecord(id, "CHECK_IN", "客户签到", "预计等待时间: " + appointment.getEstimatedWaitTime() + "分钟");
        
        return convertToResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse assignToUser(Long appointmentId, Long userId, String windowNo) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        appointment.setAssignedUserId(userId);
        appointment.setWindowNo(windowNo);
        
        appointment = appointmentRepository.save(appointment);
        createHistoryRecord(appointmentId, "ASSIGN", "分配给" + user.getRealName(), "窗口: " + windowNo);
        
        return convertToResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse startProcessing(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        if (appointment.getStatus() == AppointmentStatus.MATERIAL_INCOMPLETE) {
            throw new RuntimeException("资料缺页状态，需先补齐资料后才能恢复办理");
        }
        if (appointment.getStatus() == AppointmentStatus.DUE_DILIGENCE_PENDING) {
            throw new RuntimeException("尽调待补状态，需先完成尽调后才能恢复办理");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLAINT_RECORDED) {
            throw new RuntimeException("投诉记录状态，需先处理投诉后才能恢复办理");
        }
        if (appointment.getStatus() != AppointmentStatus.CHECKED_IN) {
            throw new RuntimeException("预约状态不允许开始处理");
        }
        
        appointment.setStatus(AppointmentStatus.PROCESSING);
        appointment.setStartProcessTime(LocalDateTime.now());
        
        appointment = appointmentRepository.save(appointment);
        createHistoryRecord(id, "START_PROCESS", "开始处理", null);
        
        return convertToResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse markMaterialIncomplete(Long id, String missingDocs, String remarks) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        appointment.setStatus(AppointmentStatus.MATERIAL_INCOMPLETE);
        appointment.setMaterialStatus("资料缺页: " + missingDocs);
        
        String fullRemarks = remarks != null ? remarks : "";
        if (!fullRemarks.isEmpty()) {
            appointment.setRemarks((appointment.getRemarks() != null ? appointment.getRemarks() + "; " : "") + fullRemarks);
        }
        
        appointment = appointmentRepository.save(appointment);
        createHistoryRecord(id, "MATERIAL_INCOMPLETE", "资料缺页待补", "缺失资料: " + missingDocs);
        
        return convertToResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse markDueDiligencePending(Long id, String pendingItems, String remarks) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        appointment.setStatus(AppointmentStatus.DUE_DILIGENCE_PENDING);
        appointment.setDueDiligenceStatus("尽调待补: " + pendingItems);
        
        String fullRemarks = remarks != null ? remarks : "";
        if (!fullRemarks.isEmpty()) {
            appointment.setRemarks((appointment.getRemarks() != null ? appointment.getRemarks() + "; " : "") + fullRemarks);
        }
        
        appointment = appointmentRepository.save(appointment);
        createHistoryRecord(id, "DUE_DILIGENCE_PENDING", "尽调补件", "待补充: " + pendingItems);
        
        return convertToResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse recordComplaint(Long id, String complaintReason, String remarks) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        appointment.setStatus(AppointmentStatus.COMPLAINT_RECORDED);
        appointment.setComplaintStatus("投诉: " + complaintReason);
        appointment.setUrgentLevel(5);
        
        String fullRemarks = remarks != null ? remarks : "";
        if (!fullRemarks.isEmpty()) {
            appointment.setRemarks((appointment.getRemarks() != null ? appointment.getRemarks() + "; " : "") + fullRemarks);
        }
        
        appointment = appointmentRepository.save(appointment);
        createHistoryRecord(id, "COMPLAINT", "业务超时投诉", "原因: " + complaintReason);
        
        return convertToResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse resolveMaterialIssue(Long id, String resolvedDocs, String remarks) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        appointment.setStatus(AppointmentStatus.PROCESSING);
        appointment.setMaterialStatus("已补全: " + resolvedDocs);
        
        String fullRemarks = remarks != null ? remarks : "";
        if (!fullRemarks.isEmpty()) {
            appointment.setRemarks((appointment.getRemarks() != null ? appointment.getRemarks() + "; " : "") + fullRemarks);
        }
        
        appointment = appointmentRepository.save(appointment);
        createHistoryRecord(id, "RESOLVE_MATERIAL", "资料补齐", "补全资料: " + resolvedDocs);
        createHistoryRecord(id, "START_PROCESS", "恢复办理", "资料补齐后继续业务处理");
        
        return convertToResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse resolveDueDiligence(Long id, String completedItems, String remarks) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        appointment.setStatus(AppointmentStatus.PROCESSING);
        appointment.setDueDiligenceStatus("已完成: " + completedItems);
        
        String fullRemarks = remarks != null ? remarks : "";
        if (!fullRemarks.isEmpty()) {
            appointment.setRemarks((appointment.getRemarks() != null ? appointment.getRemarks() + "; " : "") + fullRemarks);
        }
        
        appointment = appointmentRepository.save(appointment);
        createHistoryRecord(id, "RESOLVE_DUE_DILIGENCE", "尽调完成", "完成项: " + completedItems);
        createHistoryRecord(id, "START_PROCESS", "恢复办理", "尽调完成后继续业务处理");
        
        return convertToResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse resolveComplaint(Long id, String resolution, String remarks) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        appointment.setStatus(AppointmentStatus.PROCESSING);
        appointment.setComplaintStatus("已处理: " + resolution);
        
        String fullRemarks = remarks != null ? remarks : "";
        if (!fullRemarks.isEmpty()) {
            appointment.setRemarks((appointment.getRemarks() != null ? appointment.getRemarks() + "; " : "") + fullRemarks);
        }
        
        appointment = appointmentRepository.save(appointment);
        createHistoryRecord(id, "RESOLVE_COMPLAINT", "投诉处理完成", "处理结果: " + resolution);
        createHistoryRecord(id, "START_PROCESS", "恢复办理", "投诉处理完成后继续业务处理");
        
        return convertToResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse complete(Long id, String remarks) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setCompleteTime(LocalDateTime.now());
        
        if (appointment.getStartProcessTime() != null) {
            appointment.setActualProcessTime((int) java.time.Duration.between(
                    appointment.getStartProcessTime(), LocalDateTime.now()).toMinutes());
        }
        
        String fullRemarks = remarks != null ? remarks : "";
        if (!fullRemarks.isEmpty()) {
            appointment.setRemarks((appointment.getRemarks() != null ? appointment.getRemarks() + "; " : "") + fullRemarks);
        }
        
        appointment = appointmentRepository.save(appointment);
        createHistoryRecord(id, "COMPLETE", "业务完成", remarks);
        
        return convertToResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse cancel(Long id, String reason) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        
        appointment.setStatus(AppointmentStatus.CANCELLED);
        
        if (reason != null) {
            appointment.setRemarks((appointment.getRemarks() != null ? appointment.getRemarks() + "; " : "") + "取消原因: " + reason);
        }
        
        appointment = appointmentRepository.save(appointment);
        createHistoryRecord(id, "CANCEL", "预约取消", reason);
        
        return convertToResponse(appointment);
    }

    @Override
    public List<AppointmentResponse> getAppointmentsForUser(Long userId) {
        return appointmentRepository.findByAssignedUserId(userId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> searchByKeyword(String keyword) {
        return appointmentRepository.findByIssueKeyword(keyword).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private String generateAppointmentNo() {
        return "APPT" + System.currentTimeMillis() % 100000000;
    }

    private Integer calculateWaitTime() {
        return 15 + (int) (Math.random() * 30);
    }

    private void createHistoryRecord(Long appointmentId, String action, String actionName, String detail) {
        HistoryRecord record = HistoryRecord.builder()
                .appointmentId(appointmentId)
                .action(action)
                .actionName(actionName)
                .detail(detail)
                .createdAt(LocalDateTime.now())
                .build();
        historyRecordRepository.save(record);
    }

    private AppointmentResponse convertToResponse(Appointment appointment) {
        String businessTypeName = switch (appointment.getBusinessType()) {
            case PERSONAL_ACCOUNT_OPENING -> "个人开户";
            case LOAN_APPLICATION -> "贷款申请";
            case CARD_REPLACEMENT -> "换卡";
            case ACCOUNT_CLOSURE -> "销户";
            case INVESTMENT_CONSULTATION -> "理财咨询";
            case FOREIGN_EXCHANGE -> "外汇业务";
            case OTHER -> "其他业务";
        };

        String statusName = switch (appointment.getStatus()) {
            case PENDING -> "待签到";
            case CHECKED_IN -> "已签到";
            case PROCESSING -> "处理中";
            case MATERIAL_INCOMPLETE -> "资料缺页";
            case DUE_DILIGENCE_PENDING -> "尽调待补";
            case COMPLAINT_RECORDED -> "投诉记录";
            case COMPLETED -> "已完成";
            case CANCELLED -> "已取消";
        };

        String assignedUserName = null;
        if (appointment.getAssignedUserId() != null) {
            assignedUserName = userRepository.findById(appointment.getAssignedUserId())
                    .map(User::getRealName)
                    .orElse(null);
        }

        List<com.example.bank.dto.response.HistoryRecordResponse> historyRecords = 
                historyRecordRepository.findByAppointmentIdOrderByCreatedAtDesc(appointment.getId())
                        .stream()
                        .map(r -> com.example.bank.dto.response.HistoryRecordResponse.builder()
                                .id(r.getId())
                                .action(r.getAction())
                                .actionName(r.getActionName())
                                .detail(r.getDetail())
                                .createdAt(r.getCreatedAt())
                                .build())
                        .collect(Collectors.toList());

        return AppointmentResponse.builder()
                .id(appointment.getId())
                .appointmentNo(appointment.getAppointmentNo())
                .customerName(appointment.getCustomerName())
                .customerId(appointment.getCustomerId())
                .customerPhone(appointment.getCustomerPhone())
                .businessType(appointment.getBusinessType())
                .businessTypeName(businessTypeName)
                .status(appointment.getStatus())
                .statusName(statusName)
                .appointmentTime(appointment.getAppointmentTime())
                .checkInTime(appointment.getCheckInTime())
                .startProcessTime(appointment.getStartProcessTime())
                .completeTime(appointment.getCompleteTime())
                .assignedUserId(appointment.getAssignedUserId())
                .assignedUserName(assignedUserName)
                .windowNo(appointment.getWindowNo())
                .estimatedWaitTime(appointment.getEstimatedWaitTime())
                .actualProcessTime(appointment.getActualProcessTime())
                .materialStatus(appointment.getMaterialStatus())
                .dueDiligenceStatus(appointment.getDueDiligenceStatus())
                .complaintStatus(appointment.getComplaintStatus())
                .urgentLevel(appointment.getUrgentLevel())
                .remarks(appointment.getRemarks())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .historyRecords(historyRecords)
                .build();
    }
}