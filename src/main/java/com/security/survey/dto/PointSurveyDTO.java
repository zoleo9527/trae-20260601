package com.security.survey.dto;

import com.security.survey.enums.SurveyStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PointSurveyDTO {
    private Long id;

    @NotBlank(message = "项目名称不能为空")
    private String projectName;

    @NotBlank(message = "项目编号不能为空")
    private String projectCode;

    private String customerName;
    private String address;
    private String pointDescription;
    private Integer pointCount;
    private SurveyStatus status;
    private Long assignedToId;
    private LocalDateTime surveyDate;
    private LocalDateTime deadline;
    private String remarkContent;
}
