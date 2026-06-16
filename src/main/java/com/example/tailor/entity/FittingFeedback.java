package com.example.tailor.entity;

import com.example.tailor.enums.FeedbackStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "fitting_feedback")
public class FittingFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "feedback_no", nullable = false, unique = true, length = 50)
    private String feedbackNo;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(name = "fitting_date", nullable = false)
    private LocalDateTime fittingDate;

    @Column(name = "fitting_type", length = 50)
    private String fittingType;

    @Column(name = "overall_feedback", length = 500)
    private String overallFeedback;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private FeedbackStatus status;

    @Column(name = "processor_id")
    private Long processorId;

    @Column(name = "processor_name", length = 100)
    private String processorName;

    @Column(name = "process_time")
    private LocalDateTime processTime;

    @Column(name = "process_note", length = 500)
    private String processNote;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "feedback", cascade = CascadeType.ALL)
    private List<ModificationRecord> modifications;

    public FittingFeedback() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
    public String getFeedbackNo() { return feedbackNo; }
    public void setFeedbackNo(String feedbackNo) { this.feedbackNo = feedbackNo; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public LocalDateTime getFittingDate() { return fittingDate; }
    public void setFittingDate(LocalDateTime fittingDate) { this.fittingDate = fittingDate; }
    public String getFittingType() { return fittingType; }
    public void setFittingType(String fittingType) { this.fittingType = fittingType; }
    public String getOverallFeedback() { return overallFeedback; }
    public void setOverallFeedback(String overallFeedback) { this.overallFeedback = overallFeedback; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public FeedbackStatus getStatus() { return status; }
    public void setStatus(FeedbackStatus status) { this.status = status; }
    public Long getProcessorId() { return processorId; }
    public void setProcessorId(Long processorId) { this.processorId = processorId; }
    public String getProcessorName() { return processorName; }
    public void setProcessorName(String processorName) { this.processorName = processorName; }
    public LocalDateTime getProcessTime() { return processTime; }
    public void setProcessTime(LocalDateTime processTime) { this.processTime = processTime; }
    public String getProcessNote() { return processNote; }
    public void setProcessNote(String processNote) { this.processNote = processNote; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<ModificationRecord> getModifications() { return modifications; }
    public void setModifications(List<ModificationRecord> modifications) { this.modifications = modifications; }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = FeedbackStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}