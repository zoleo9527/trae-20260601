package com.example.tailor.service;

import com.example.tailor.entity.NotificationRecord;
import com.example.tailor.repository.NotificationRecordRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

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
}