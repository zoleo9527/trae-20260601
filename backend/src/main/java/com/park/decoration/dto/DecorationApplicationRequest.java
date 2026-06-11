package com.park.decoration.dto;

import com.park.decoration.enums.PriorityLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DecorationApplicationRequest {

    @NotBlank(message = "幂等键不能为空")
    private String idempotentKey;

    @NotBlank(message = "企业名称不能为空")
    private String companyName;

    @NotBlank(message = "联系人不能为空")
    private String contactPerson;

    @NotBlank(message = "联系电话不能为空")
    private String contactPhone;

    @NotBlank(message = "园区名称不能为空")
    private String parkName;

    @NotBlank(message = "楼栋号不能为空")
    private String buildingNo;

    @NotBlank(message = "房间号不能为空")
    private String roomNo;

    @NotNull(message = "装修面积不能为空")
    private Double decorationArea;

    private String decorationScope;

    @NotNull(message = "计划开工日期不能为空")
    private LocalDateTime plannedStartDate;

    @NotNull(message = "计划竣工日期不能为空")
    private LocalDateTime plannedEndDate;

    private String constructionCompany;
    private String constructionContact;
    private String constructionPhone;

    private PriorityLevel priority;
    private String remark;
    private String createdBy;
}
