package com.example.tailor.dto.request;

public class ModificationQueryRequest {

    private Long feedbackId;
    private Long orderId;
    private String status;
    private String responsibleRole;
    private Long assigneeId;
    private Integer page;
    private Integer size;

    public ModificationQueryRequest() {}

    public Long getFeedbackId() { return feedbackId; }
    public void setFeedbackId(Long feedbackId) { this.feedbackId = feedbackId; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getResponsibleRole() { return responsibleRole; }
    public void setResponsibleRole(String responsibleRole) { this.responsibleRole = responsibleRole; }
    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }
    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }
}