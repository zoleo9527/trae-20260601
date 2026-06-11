package com.elevator.maintenance.dto;

import lombok.Data;

@Data
public class PlanDispatchRequest {
    private Long planId;
    private Long technicianId;
    private Long dispatcherId;
    private String remark;

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
    public Long getTechnicianId() { return technicianId; }
    public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
    public Long getDispatcherId() { return dispatcherId; }
    public void setDispatcherId(Long dispatcherId) { this.dispatcherId = dispatcherId; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
