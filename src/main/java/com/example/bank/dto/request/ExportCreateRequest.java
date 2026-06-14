package com.example.bank.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExportCreateRequest {
    private String exportType;
    private Long appointmentId;
}