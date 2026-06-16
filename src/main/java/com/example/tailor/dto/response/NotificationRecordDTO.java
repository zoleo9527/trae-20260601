package com.example.tailor.dto.response;

import java.time.LocalDateTime;

public class NotificationRecordDTO {

    private Long id;
    private String notificationType;
    private String targetRole;
    private Long targetUserId;
    private String targetUserName;
    private String status;
    private Long relatedOrderId;
    private String relatedOrderNo;
    private Long relatedFeedbackId;
    private String relatedFeedbackNo;
    private Long relatedModificationId;
    private String relatedModificationNo;
    private String content;
    private LocalDateTime triggerTime;
    private LocalDateTime readTime;
    private LocalDateTime createdAt;

    public NotificationRecordDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNotificationType() { return notificationType; }
    public void setNotificationType(String notificationType) { this.notificationType = notificationType; }
    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    public Long getTargetUserId() { return targetUserId; }
    public void setTargetUserId(Long targetUserId) { this.targetUserId = targetUserId; }
    public String getTargetUserName() { return targetUserName; }
    public void setTargetUserName(String targetUserName) { this.targetUserName = targetUserName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getRelatedOrderId() { return relatedOrderId; }
    public void setRelatedOrderId(Long relatedOrderId) { this.relatedOrderId = relatedOrderId; }
    public String getRelatedOrderNo() { return relatedOrderNo; }
    public void setRelatedOrderNo(String relatedOrderNo) { this.relatedOrderNo = relatedOrderNo; }
    public Long getRelatedFeedbackId() { return relatedFeedbackId; }
    public void setRelatedFeedbackId(Long relatedFeedbackId) { this.relatedFeedbackId = relatedFeedbackId; }
    public String getRelatedFeedbackNo() { return relatedFeedbackNo; }
    public void setRelatedFeedbackNo(String relatedFeedbackNo) { this.relatedFeedbackNo = relatedFeedbackNo; }
    public Long getRelatedModificationId() { return relatedModificationId; }
    public void setRelatedModificationId(Long relatedModificationId) { this.relatedModificationId = relatedModificationId; }
    public String getRelatedModificationNo() { return relatedModificationNo; }
    public void setRelatedModificationNo(String relatedModificationNo) { this.relatedModificationNo = relatedModificationNo; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public LocalDateTime getTriggerTime() { return triggerTime; }
    public void setTriggerTime(LocalDateTime triggerTime) { this.triggerTime = triggerTime; }
    public LocalDateTime getReadTime() { return readTime; }
    public void setReadTime(LocalDateTime readTime) { this.readTime = readTime; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}