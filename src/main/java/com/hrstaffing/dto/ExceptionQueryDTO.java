package com.hrstaffing.dto;

import com.hrstaffing.enums.ExceptionStatus;
import com.hrstaffing.enums.ExceptionType;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ExceptionQueryDTO {

    private int page = 1;
    private int size = 20;
    private Long employeeId;
    private ExceptionStatus status;
    private ExceptionType exceptionType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String keyword;
    private Boolean needDeadlineHint;
}
