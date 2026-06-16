package com.example.tailor.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public class FittingFeedbackDTO {

    private Long id;
    private Long orderId;
    private String orderNo;
    private String productName;
    private String productType;
    private String feedbackNo;
    private Long customerId;
    private String customerName;
    private LocalDateTime fittingDate;
    private String fittingType;
    private String overallFeedback;
    private String details;
    private String status;
    private Long processorId;
    private String processorName;
    private LocalDateTime processTime;
    private String processNote;
    private MeasurementDTO measurement;
    private FabricCardDTO fabricCard;
    private List<ModificationRecordDTO> modifications;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FittingFeedbackDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }
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
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getProcessorId() { return processorId; }
    public void setProcessorId(Long processorId) { this.processorId = processorId; }
    public String getProcessorName() { return processorName; }
    public void setProcessorName(String processorName) { this.processorName = processorName; }
    public LocalDateTime getProcessTime() { return processTime; }
    public void setProcessTime(LocalDateTime processTime) { this.processTime = processTime; }
    public String getProcessNote() { return processNote; }
    public void setProcessNote(String processNote) { this.processNote = processNote; }
    public MeasurementDTO getMeasurement() { return measurement; }
    public void setMeasurement(MeasurementDTO measurement) { this.measurement = measurement; }
    public FabricCardDTO getFabricCard() { return fabricCard; }
    public void setFabricCard(FabricCardDTO fabricCard) { this.fabricCard = fabricCard; }
    public List<ModificationRecordDTO> getModifications() { return modifications; }
    public void setModifications(List<ModificationRecordDTO> modifications) { this.modifications = modifications; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}