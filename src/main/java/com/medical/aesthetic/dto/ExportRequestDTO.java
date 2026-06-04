package com.medical.aesthetic.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ExportRequestDTO {
    private String exportType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String includeFields;
}
