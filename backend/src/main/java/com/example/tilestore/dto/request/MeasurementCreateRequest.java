package com.example.tilestore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MeasurementCreateRequest {

    @NotBlank(message = "客户姓名不能为空")
    private String customerName;

    @NotBlank(message = "客户电话不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String customerPhone;

    private String customerAddress;

    private String customerRemark;

    @NotBlank(message = "房型不能为空")
    private String roomType;

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