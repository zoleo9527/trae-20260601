package com.hrstaffing.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ScheduleUpdateDTO {

    private LocalTime shiftStart;
    private LocalTime shiftEnd;
    private BigDecimal scheduledHours;
    private LocalTime actualPunchIn;
    private LocalTime actualPunchOut;
    private BigDecimal actualWorkHours;
    private BigDecimal overtimeHours;
    private BigDecimal leaveHours;
    private String scheduleRemark;
}
