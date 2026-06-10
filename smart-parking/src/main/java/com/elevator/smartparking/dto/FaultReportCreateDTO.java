package com.elevator.smartparking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FaultReportCreateDTO {

    @NotNull(message = "电梯ID不能为空")
    private Long elevatorId;

    private String faultType;

    private String faultDescription;

    private String reporterName;

    private String reporterPhone;

    private String reportSource;

    private Boolean hasEntrapment;

    private Integer entrapmentCount;

    private String remark;
}
