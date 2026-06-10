package com.elevator.smartparking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RescueCreateDTO {

    @NotNull(message = "电梯ID不能为空")
    private Long elevatorId;

    private Long faultReportId;

    @NotNull(message = "困人数不能为空")
    private Integer trappedCount;

    private String trappedFloor;

    private String reporterName;

    private String reporterPhone;

    private String initialRemark;

    private Long rescuerId;
}
