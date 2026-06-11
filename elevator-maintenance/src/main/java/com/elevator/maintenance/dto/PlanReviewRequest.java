package com.elevator.maintenance.dto;

import lombok.Data;

@Data
public class PlanReviewRequest {
    private Long planId;
    private Long supervisorId;
    private String reviewRemark;
    private String status;

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
    public Long getSupervisorId() { return supervisorId; }
    public void setSupervisorId(Long supervisorId) { this.supervisorId = supervisorId; }
    public String getReviewRemark() { return reviewRemark; }
    public void setReviewRemark(String reviewRemark) { this.reviewRemark = reviewRemark; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
