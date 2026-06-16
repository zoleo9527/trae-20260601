package com.example.tailor.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_record")
public class NotificationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "notification_type", nullable = false, length = 50)
    private String notificationType;

    @Column(name = "target_role", nullable = false, length = 50)
    private String targetRole;

    @Column(name = "target_user_id")
    private Long targetUserId;

    @Column(name = "target_user_name", length = 100)
    private String targetUserName;

    @Column(name = "related_order_id")
    private Long relatedOrderId;

    @Column(name = "related_order_no", length = 50)
    private String relatedOrderNo;

    @Column(name = "related_feedback_id")
    private Long relatedFeedbackId;

    @Column(name = "related_feedback_no", length = 50)
    private String relatedFeedbackNo;

    @Column(name = "related_modification_id")
    private Long relatedModificationId;

    @Column(name = "related_modification_no", length = 50)
    private String relatedModificationNo;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "trigger_time", nullable = false)
    private LocalDateTime triggerTime;

    @Column(name = "read_time")
    private LocalDateTime readTime;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public NotificationRecord() {}

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
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getTriggerTime() { return triggerTime; }
    public void setTriggerTime(LocalDateTime triggerTime) { this.triggerTime = triggerTime; }
    public LocalDateTime getReadTime() { return readTime; }
    public void setReadTime(LocalDateTime readTime) { this.readTime = readTime; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (triggerTime == null) {
            triggerTime = LocalDateTime.now();
        }
        if (status == null) {
            status = "PENDING";
        }
    }
}