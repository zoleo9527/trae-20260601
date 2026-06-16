package com.example.tailor.service;

import com.example.tailor.dto.response.NotificationRecordDTO;
import com.example.tailor.entity.NotificationRecord;
import com.example.tailor.repository.NotificationRecordRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRecordRepository notificationRecordRepository;

    public NotificationService(NotificationRecordRepository notificationRecordRepository) {
        this.notificationRecordRepository = notificationRecordRepository;
    }

    public void triggerFeedbackCreated(Long feedbackId, String feedbackNo, Long orderId, String orderNo, String customerName) {
        NotificationRecord record = new NotificationRecord();
        record.setNotificationType("FEEDBACK_CREATED");
        record.setTargetRole("CUSTOMER_SERVICE");
        record.setRelatedOrderId(orderId);
        record.setRelatedOrderNo(orderNo);
        record.setRelatedFeedbackId(feedbackId);
        record.setRelatedFeedbackNo(feedbackNo);
        record.setContent(String.format("订单[%s]客户[%s]提交了试衣反馈，反馈单号：%s", orderNo, customerName, feedbackNo));
        record.setStatus("PENDING");
        record.setTriggerTime(LocalDateTime.now());

        notificationRecordRepository.save(record);
    }

    public void triggerFeedbackProcessed(Long feedbackId, String feedbackNo, Long orderId, String orderNo, String processorName) {
        NotificationRecord record = new NotificationRecord();
        record.setNotificationType("FEEDBACK_PROCESSED");
        record.setTargetRole("MEASURER");
        record.setRelatedOrderId(orderId);
        record.setRelatedOrderNo(orderNo);
        record.setRelatedFeedbackId(feedbackId);
        record.setRelatedFeedbackNo(feedbackNo);
        record.setContent(String.format("试衣反馈[%s]已由%s处理，请查看是否需要调整量体数据", feedbackNo, processorName));
        record.setStatus("PENDING");
        record.setTriggerTime(LocalDateTime.now());

        notificationRecordRepository.save(record);
    }

    public void triggerModificationCreated(Long modificationId, String modificationNo, Long feedbackId,
                                          String feedbackNo, String responsibleRole) {
        NotificationRecord record = new NotificationRecord();
        record.setNotificationType("MODIFICATION_CREATED");
        record.setTargetRole(responsibleRole);
        record.setRelatedFeedbackId(feedbackId);
        record.setRelatedFeedbackNo(feedbackNo);
        record.setRelatedModificationId(modificationId);
        record.setRelatedModificationNo(modificationNo);
        record.setContent(String.format("试衣反馈[%s]生成了修改任务[%s]，请及时处理", feedbackNo, modificationNo));
        record.setStatus("PENDING");
        record.setTriggerTime(LocalDateTime.now());

        notificationRecordRepository.save(record);
    }

    public void triggerModificationStatusChanged(Long modificationId, String modificationNo, String status,
                                                 Long assigneeId, String assigneeName) {
        String role = "CUSTOMER_SERVICE";
        if ("IN_PROGRESS".equals(status)) {
            role = "PATTERN_MAKER";
        } else if ("COMPLETED".equals(status)) {
            role = "MEASURER";
        } else if ("VERIFIED".equals(status)) {
            role = "CUSTOMER_SERVICE";
        }

        NotificationRecord record = new NotificationRecord();
        record.setNotificationType("MODIFICATION_STATUS_CHANGED");
        record.setTargetRole(role);
        record.setRelatedModificationId(modificationId);
        record.setRelatedModificationNo(modificationNo);
        record.setContent(String.format("修改任务[%s]状态变更为：%s，处理人：%s", modificationNo, status, assigneeName));
        record.setStatus("PENDING");
        record.setTriggerTime(LocalDateTime.now());

        notificationRecordRepository.save(record);
    }

    public Page<NotificationRecordDTO> queryNotifications(String targetRole, String status, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(
                page != null ? page : 0,
                size != null ? size : 10,
                Sort.by(Sort.Direction.DESC, "triggerTime")
        );

        Page<NotificationRecord> pageResult;
        if (targetRole != null && !targetRole.isEmpty() && status != null && !status.isEmpty()) {
            pageResult = notificationRecordRepository.findByTargetRoleAndStatus(targetRole, status, pageable);
        } else if (targetRole != null && !targetRole.isEmpty()) {
            pageResult = notificationRecordRepository.findByTargetRole(targetRole, pageable);
        } else if (status != null && !status.isEmpty()) {
            pageResult = notificationRecordRepository.findByStatus(status, pageable);
        } else {
            pageResult = notificationRecordRepository.findAll(pageable);
        }

        return pageResult.map(this::convertToDTO);
    }

    public NotificationRecordDTO getNotificationById(Long id) {
        NotificationRecord record = notificationRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("通知记录不存在：" + id));
        return convertToDTO(record);
    }

    @Transactional
    public NotificationRecordDTO markAsRead(Long id) {
        NotificationRecord record = notificationRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("通知记录不存在：" + id));
        record.setStatus("READ");
        record.setReadTime(LocalDateTime.now());
        NotificationRecord saved = notificationRecordRepository.save(record);
        return convertToDTO(saved);
    }

    @Transactional
    public void markAllAsRead(String targetRole) {
        List<NotificationRecord> records = notificationRecordRepository.findByTargetRoleAndStatus(targetRole, "PENDING");
        records.forEach(record -> {
            record.setStatus("READ");
            record.setReadTime(LocalDateTime.now());
        });
        notificationRecordRepository.saveAll(records);
    }

    public Long countUnread(String targetRole) {
        return notificationRecordRepository.countByTargetRoleAndStatus(targetRole, "PENDING");
    }

    private NotificationRecordDTO convertToDTO(NotificationRecord record) {
        NotificationRecordDTO dto = new NotificationRecordDTO();
        dto.setId(record.getId());
        dto.setNotificationType(record.getNotificationType());
        dto.setTargetRole(record.getTargetRole());
        dto.setTargetUserId(record.getTargetUserId());
        dto.setTargetUserName(record.getTargetUserName());
        dto.setStatus(record.getStatus());
        dto.setRelatedOrderId(record.getRelatedOrderId());
        dto.setRelatedOrderNo(record.getRelatedOrderNo());
        dto.setRelatedFeedbackId(record.getRelatedFeedbackId());
        dto.setRelatedFeedbackNo(record.getRelatedFeedbackNo());
        dto.setRelatedModificationId(record.getRelatedModificationId());
        dto.setRelatedModificationNo(record.getRelatedModificationNo());
        dto.setContent(record.getContent());
        dto.setTriggerTime(record.getTriggerTime());
        dto.setReadTime(record.getReadTime());
        dto.setCreatedAt(record.getCreatedAt());
        return dto;
    }
}