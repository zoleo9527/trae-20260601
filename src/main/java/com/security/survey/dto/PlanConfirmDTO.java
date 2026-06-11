package com.security.survey.dto;

import com.security.survey.enums.ConfirmStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PlanConfirmDTO {
    private Long id;

    @NotNull(message = "关联勘察单ID不能为空")
    private Long surveyId;

    @NotBlank(message = "项目名称不能为空")
    private String projectName;

    @NotBlank(message = "项目编号不能为空")
    private String projectCode;

    private String planContent;
    private String equipmentList;
    private Double estimatedCost;
    private Integer constructionDays;
    private ConfirmStatus status;
    private Long assignedToId;
    private LocalDateTime planDate;
    private LocalDateTime deadline;
    private String remarkContent;
    private Boolean inheritRemarks = true;
}
