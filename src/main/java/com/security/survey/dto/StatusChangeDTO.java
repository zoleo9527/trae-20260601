package com.security.survey.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StatusChangeDTO {
    @NotBlank(message = "状态不能为空")
    private String status;

    private String remark;

    private String reason;
}
