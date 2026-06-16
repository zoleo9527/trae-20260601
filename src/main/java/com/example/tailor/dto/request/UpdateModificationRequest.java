package com.example.tailor.dto.request;

public class UpdateModificationRequest {

    private String status;
    private String description;
    private String affectedPart;
    private String targetValue;
    private Long assigneeId;
    private String assigneeName;
    private String priority;
    private String actualValue;
    private Long verifierId;
    private String verifierName;
    private String verifyNote;

    public UpdateModificationRequest() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getAffectedPart() { return affectedPart; }
    public void setAffectedPart(String affectedPart) { this.affectedPart = affectedPart; }
    public String getTargetValue() { return targetValue; }
    public void setTargetValue(String targetValue) { this.targetValue = targetValue; }
    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
    public String getAssigneeName() { return assigneeName; }
    public void setAssigneeName(String assigneeName) { this.assigneeName = assigneeName; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getActualValue() { return actualValue; }
    public void setActualValue(String actualValue) { this.actualValue = actualValue; }
    public Long getVerifierId() { return verifierId; }
    public void setVerifierId(Long verifierId) { this.verifierId = verifierId; }
    public String getVerifierName() { return verifierName; }
    public void setVerifierName(String verifierName) { this.verifierName = verifierName; }
    public String getVerifyNote() { return verifyNote; }
    public void setVerifyNote(String verifyNote) { this.verifyNote = verifyNote; }
}