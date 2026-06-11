package com.elevator.maintenance.dto;

import lombok.Data;

@Data
public class CheckOutRequest {
    private Long recordId;
    private String workContent;
    private String workResult;
    private String problemDesc;
    private String solution;
    private String remark;

    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }
    public String getWorkContent() { return workContent; }
    public void setWorkContent(String workContent) { this.workContent = workContent; }
    public String getWorkResult() { return workResult; }
    public void setWorkResult(String workResult) { this.workResult = workResult; }
    public String getProblemDesc() { return problemDesc; }
    public void setProblemDesc(String problemDesc) { this.problemDesc = problemDesc; }
    public String getSolution() { return solution; }
    public void setSolution(String solution) { this.solution = solution; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
