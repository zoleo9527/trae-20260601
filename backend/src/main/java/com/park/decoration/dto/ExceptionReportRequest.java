package com.park.decoration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ExceptionReportRequest {

    @NotNull(message = "申请ID不能为空")
    private Long applicationId;

    @NotBlank(message = "异常标题不能为空")
    private String title;

    @NotBlank(message = "异常描述不能为空")
    private String description;

    private String impact;

    private String responsiblePerson;

    private String attachmentUrls;

    @NotBlank(message = "报告人不能为空")
    private String reportedBy;
}
