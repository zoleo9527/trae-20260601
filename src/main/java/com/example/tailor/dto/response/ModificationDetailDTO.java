package com.example.tailor.dto.response;

import java.time.LocalDateTime;

public class ModificationDetailDTO {

    private Long id;
    private Long feedbackId;
    private String feedbackNo;
    private String feedbackDetails;
    private String feedbackStatus;
    private Long orderId;
    private String orderNo;
    private String productName;
    private String productType;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private MeasurementDTO measurement;
    private FabricCardDTO fabricCard;

    public ModificationDetailDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getFeedbackId() { return feedbackId; }
    public void setFeedbackId(Long feedbackId) { this.feedbackId = feedbackId; }
    public String getFeedbackNo() { return feedbackNo; }
    public void setFeedbackNo(String feedbackNo) { this.feedbackNo = feedbackNo; }
    public String getFeedbackDetails() { return feedbackDetails; }
    public void setFeedbackDetails(String feedbackDetails) { this.feedbackDetails = feedbackDetails; }
    public String getFeedbackStatus() { return feedbackStatus; }
    public void setFeedbackStatus(String feedbackStatus) { this.feedbackStatus = feedbackStatus; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }
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
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public MeasurementDTO getMeasurement() { return measurement; }
    public void setMeasurement(MeasurementDTO measurement) { this.measurement = measurement; }
    public FabricCardDTO getFabricCard() { return fabricCard; }
    public void setFabricCard(FabricCardDTO fabricCard) { this.fabricCard = fabricCard; }
}