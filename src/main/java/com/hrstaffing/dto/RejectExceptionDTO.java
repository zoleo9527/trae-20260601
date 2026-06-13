package com.hrstaffing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RejectExceptionDTO {

    @NotNull(message = "异常ID不能为空")
    private Long exceptionId;

    @NotBlank(message = "驳回原因不能为空")
    private String rejectReason;

    @NotNull(message = "补录截止时间（小时）不能为空")
    private Integer deadlineHours;

    private Long attachmentId;
    private String siteSnapshot;
}
