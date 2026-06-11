package com.elevator.maintenance.dto;

import lombok.Data;

@Data
public class NoteRequest {
    private Long planId;
    private Long operatorId;
    private String content;
    private String action;

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }
    public Long getOperatorId() { return operatorId; }
    public void setOperatorId(Long operatorId) { this.operatorId = operatorId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
}
