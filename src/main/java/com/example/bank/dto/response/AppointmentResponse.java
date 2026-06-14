package com.example.bank.dto.response;

import com.example.bank.enums.AppointmentStatus;
import com.example.bank.enums.BusinessType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {

    private Long id;
    private String appointmentNo;
    private String customerName;
    private String customerId;
    private String customerPhone;
    private BusinessType businessType;
    private String businessTypeName;
    private AppointmentStatus status;
    private String statusName;
    private LocalDateTime appointmentTime;
    private LocalDateTime checkInTime;
    private LocalDateTime startProcessTime;
    private LocalDateTime completeTime;
    private Long assignedUserId;
    private String assignedUserName;
    private String windowNo;
    private Integer estimatedWaitTime;
    private Integer actualProcessTime;
    private String materialStatus;
    private String dueDiligenceStatus;
    private String complaintStatus;
    private Integer urgentLevel;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<HistoryRecordResponse> historyRecords;
}