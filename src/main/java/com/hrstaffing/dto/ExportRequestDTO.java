package com.hrstaffing.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ExportRequestDTO {

    private String exportType;
    private String taskName;
    private Long employeeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String keyword;
}
