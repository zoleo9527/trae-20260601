package com.example.tailor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class CreateFeedbackRequest {

    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    @NotBlank(message = "订单号不能为空")
    private String orderNo;

    @NotNull(message = "客户ID不能为空")
    private Long customerId;

    @NotBlank(message = "客户姓名不能为空")
    private String customerName;

    private LocalDateTime fittingDate;

    private String fittingType;

    private String overallFeedback;

    @NotBlank(message = "反馈详情不能为空")
    private String details;

    public CreateFeedbackRequest() {}

    public CreateFeedbackRequest(Long orderId, String orderNo, Long customerId, String customerName, LocalDateTime fittingDate, String fittingType, String overallFeedback, String details) {
        this.orderId = orderId;
        this.orderNo = orderNo;
        this.customerId = customerId;
        this.customerName = customerName;
        this.fittingDate = fittingDate;
        this.fittingType = fittingType;
        this.overallFeedback = overallFeedback;
        this.details = details;
    }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
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
}