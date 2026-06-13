package com.hrstaffing.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ExportTaskQueryDTO {

    private String status;

    private String exportType;

    private LocalDate startDate;

    private LocalDate endDate;

    private String keyword;
}
