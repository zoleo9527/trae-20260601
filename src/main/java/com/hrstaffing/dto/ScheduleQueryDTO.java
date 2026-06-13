package com.hrstaffing.dto;

import com.hrstaffing.enums.ScheduleStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ScheduleQueryDTO {

    private int page = 1;
    private int size = 20;
    private Long employeeId;
    private ScheduleStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String keyword;
}
