package com.hrstaffing.dto;

import com.hrstaffing.enums.ExceptionStatus;
import com.hrstaffing.enums.ExceptionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExceptionCreateDTO {

    @NotNull(message = "排班ID不能为空")
    private Long scheduleId;

    @NotNull(message = "异常日期不能为空")
    private LocalDate exceptionDate;

    @NotNull(message = "异常类型不能为空")
    private ExceptionType exceptionType;

    @NotBlank(message = "异常描述不能为空")
    private String description;

    private BigDecimal affectedHours;
    private String siteNote;
    private Long attachmentId;
}
