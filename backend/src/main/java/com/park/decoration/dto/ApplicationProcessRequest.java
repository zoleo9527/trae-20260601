package com.park.decoration.dto;

import com.park.decoration.enums.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApplicationProcessRequest {

    @NotNull(message = "操作类型不能为空")
    private String action;

    private String reviewOpinion;

    private ApplicationStatus targetStatus;

    private String assignedHandler;

    private String operator;

    private String remark;
}
