package com.example.bank.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryRecordResponse {

    private Long id;
    private String action;
    private String actionName;
    private String detail;
    private LocalDateTime createdAt;
}