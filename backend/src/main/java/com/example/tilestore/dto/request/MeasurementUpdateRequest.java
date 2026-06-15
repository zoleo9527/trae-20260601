package com.example.tilestore.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MeasurementUpdateRequest {

    @NotNull(message = "长度不能为空")
    private BigDecimal length;

    @NotNull(message = "宽度不能为空")
    private BigDecimal width;

    private BigDecimal height;

    private String windowsInfo;

    private String doorsInfo;

    private String wallInfo;

    private String floorInfo;

    private String photos;

    private String remark;
}