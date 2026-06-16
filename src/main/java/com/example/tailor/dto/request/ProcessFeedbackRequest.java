package com.example.tailor.dto.request;

import jakarta.validation.constraints.NotNull;

public class ProcessFeedbackRequest {

    @NotNull(message = "处理人ID不能为空")
    private Long processorId;

    @NotNull(message = "处理人姓名不能为空")
    private String processorName;

    private String processNote;

    public ProcessFeedbackRequest() {}

    public ProcessFeedbackRequest(Long processorId, String processorName, String processNote) {
        this.processorId = processorId;
        this.processorName = processorName;
        this.processNote = processNote;
    }

    public Long getProcessorId() { return processorId; }
    public void setProcessorId(Long processorId) { this.processorId = processorId; }
    public String getProcessorName() { return processorName; }
    public void setProcessorName(String processorName) { this.processorName = processorName; }
    public String getProcessNote() { return processNote; }
    public void setProcessNote(String processNote) { this.processNote = processNote; }
}