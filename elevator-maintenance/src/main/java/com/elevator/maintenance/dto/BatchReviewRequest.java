package com.elevator.maintenance.dto;

import lombok.Data;

import java.util.List;

@Data
public class BatchReviewRequest {
    private List<Long> planIds;
    private Long supervisorId;
    private String reviewRemark;
    private String status;

    public List<Long> getPlanIds() { return planIds; }
    public void setPlanIds(List<Long> planIds) { this.planIds = planIds; }
    public Long getSupervisorId() { return supervisorId; }
    public void setSupervisorId(Long supervisorId) { this.supervisorId = supervisorId; }
    public String getReviewRemark() { return reviewRemark; }
    public void setReviewRemark(String reviewRemark) { this.reviewRemark = reviewRemark; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
