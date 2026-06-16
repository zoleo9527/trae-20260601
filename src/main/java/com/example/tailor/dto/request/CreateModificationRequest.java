package com.example.tailor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateModificationRequest {

    @NotNull(message = "反馈ID不能为空")
    private Long feedbackId;

    @NotBlank(message = "修改类型不能为空")
    private String modificationType;

    private String description;

    private String affectedPart;

    private String originalValue;

    private String targetValue;

    @NotBlank(message = "责任角色不能为空")
    private String responsibleRole;

    private Long assigneeId;

    private String assigneeName;

    private String priority;

    private String relatedMeasurementFields;

    private String relatedFabricInfo;

    public CreateModificationRequest() {}

    public Long getFeedbackId() { return feedbackId; }
    public void setFeedbackId(Long feedbackId) { this.feedbackId = feedbackId; }
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
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getRelatedMeasurementFields() { return relatedMeasurementFields; }
    public void setRelatedMeasurementFields(String relatedMeasurementFields) { this.relatedMeasurementFields = relatedMeasurementFields; }
    public String getRelatedFabricInfo() { return relatedFabricInfo; }
    public void setRelatedFabricInfo(String relatedFabricInfo) { this.relatedFabricInfo = relatedFabricInfo; }
}