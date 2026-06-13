package com.hrstaffing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ScheduleCreateDTO {

    @NotNull(message = "员工ID不能为空")
    private Long employeeId;

    @NotNull(message = "排班日期不能为空")
    private LocalDate scheduleDate;

    @NotNull(message = "上班时间不能为空")
    private LocalTime shiftStart;

    @NotNull(message = "下班时间不能为空")
    private LocalTime shiftEnd;

    @NotNull(message = "计划工时不能为空")
    @DecimalMin(value = "0", message = "计划工时不能为负")
    private BigDecimal scheduledHours;

    private LocalTime actualPunchIn;
    private LocalTime actualPunchOut;
    private BigDecimal actualWorkHours;
    private BigDecimal overtimeHours;
    private BigDecimal leaveHours;
    private String scheduleRemark;
}
