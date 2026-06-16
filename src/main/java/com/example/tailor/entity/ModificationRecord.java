package com.example.tailor.entity;

import com.example.tailor.enums.ModificationStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "modification_record")
public class ModificationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feedback_id", nullable = false)
    private FittingFeedback feedback;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "order_no", nullable = false, length = 50)
    private String orderNo;

    @Column(name = "modification_no", nullable = false, unique = true, length = 50)
    private String modificationNo;

    @Column(name = "modification_type", nullable = false, length = 100)
    private String modificationType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "affected_part", length = 200)
    private String affectedPart;

    @Column(name = "original_value", length = 200)
    private String originalValue;

    @Column(name = "target_value", length = 200)
    private String targetValue;

    @Column(name = "responsible_role", nullable = false, length = 50)
    private String responsibleRole;

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "assignee_name", length = 100)
    private String assigneeName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ModificationStatus status;

    @Column(name = "priority", length = 20)
    private String priority;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "complete_time")
    private LocalDateTime completeTime;

    @Column(name = "actual_value", length = 200)
    private String actualValue;

    @Column(name = "verifier_id")
    private Long verifierId;

    @Column(name = "verifier_name", length = 100)
    private String verifierName;

    @Column(name = "verify_time")
    private LocalDateTime verifyTime;

    @Column(name = "verify_note", length = 500)
    private String verifyNote;

    @Column(name = "related_measurement_fields", length = 500)
    private String relatedMeasurementFields;

    @Column(name = "related_fabric_info", length = 500)
    private String relatedFabricInfo;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public ModificationRecord() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public FittingFeedback getFeedback() { return feedback; }
    public void setFeedback(FittingFeedback feedback) { this.feedback = feedback; }
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
    public ModificationStatus getStatus() { return status; }
    public void setStatus(ModificationStatus status) { this.status = status; }
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

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ModificationStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}