package com.medical.aesthetic.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProjectScheduleDTO {
    private Long customerProjectId;
    private LocalDateTime scheduledTime;
    private String operatingRoom;
    private Long doctorId;
    private Long doctorAssistantId;
    private String preOperationNote;
    private String operatorRemark;
}
