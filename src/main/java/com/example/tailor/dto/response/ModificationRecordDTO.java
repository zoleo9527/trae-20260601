package com.example.tailor.dto.response;

import java.time.LocalDateTime;

public class ModificationRecordDTO {

    private Long id;
    private Long feedbackId;
    private String feedbackNo;
    private Long orderId;
    private String orderNo;
    private String modificationNo;
    private String modificationType;
    private String description;
    private String affectedPart;
    private String originalValue;
    private String targetValue;
    private String responsibleRole;
    private Long assigneeId;
    private String assigneeName;
    private String status;
    private String priority;
    private LocalDateTime startTime;
    private LocalDateTime completeTime;
    private String actualValue;
    private Long verifierId;
    private String verifierName;
    private LocalDateTime verifyTime;
    private String verifyNote;
    private String relatedMeasurementFields;
    private String relatedFabricInfo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ModificationRecordDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getFeedbackId() { return feedbackId; }
    public void setFeedbackId(Long feedbackId) { this.feedbackId = feedbackId; }
    public String getFeedbackNo() { return feedbackNo; }
    public void setFeedbackNo(String feedbackNo) { this.feedbackNo = feedbackNo; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public String getModificationNo() { return modificationNo; }
    public void setModificationNo(String modificationNo) { this.modificationNo = modificationNo; }
    public String getModificationType() { return modificationType; }
    public void setModificationType(String modificationType) { this.modificationType = modificationType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getAffectedPart() { return affectedPart; }
    public void setAffectedPart(String affectedPart) { this.affectedPart = affectedPart; }
    public String getOriginalValue() { return originalValue; }
    public void setOriginalValue(String originalValue) { this.originalValue = originalValue; }
    public String getTargetValue() { return targetValue; }
    public void setTargetValue(String targetValue) { this.targetValue = targetValue; }
    public String getResponsibleRole() { return responsibleRole; }
    public void setResponsibleRole(String responsibleRole) { this.responsibleRole = responsibleRole; }
    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
    public String getAssigneeName() { return assigneeName; }
    public void setAssigneeName(String assigneeName) { this.assigneeName = assigneeName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getCompleteTime() { return completeTime; }
    public void setCompleteTime(LocalDateTime completeTime) { this.completeTime = completeTime; }
    public String getActualValue() { return actualValue; }
    public void setActualValue(String actualValue) { this.actualValue = actualValue; }
    public Long getVerifierId() { return verifierId; }
    public void setVerifierId(Long verifierId) { this.verifierId = verifierId; }
    public String getVerifierName() { return verifierName; }
    public void setVerifierName(String verifierName) { this.verifierName = verifierName; }
    public LocalDateTime getVerifyTime() { return verifyTime; }
    public void setVerifyTime(LocalDateTime verifyTime) { this.verifyTime = verifyTime; }
    public String getVerifyNote() { return verifyNote; }
    public void setVerifyNote(String verifyNote) { this.verifyNote = verifyNote; }
    public String getRelatedMeasurementFields() { return relatedMeasurementFields; }
    public void setRelatedMeasurementFields(String relatedMeasurementFields) { this.relatedMeasurementFields = relatedMeasurementFields; }
    public String getRelatedFabricInfo() { return relatedFabricInfo; }
    public void setRelatedFabricInfo(String relatedFabricInfo) { this.relatedFabricInfo = relatedFabricInfo; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}