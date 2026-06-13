
package com.example.recruitment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("position")
public class Position {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("position_name")
    private String positionName;

    @TableField("company_id")
    private Long companyId;

    @TableField("company_name")
    private String companyName;

    @TableField("department")
    private String department;

    @TableField("work_location")
    private String workLocation;

    @TableField("salary_min")
    private BigDecimal salaryMin;

    @TableField("salary_max")
    private BigDecimal salaryMax;

    @TableField("salary_type")
    private Integer salaryType;

    @TableField("requirement")
    private String requirement;

    @TableField("benefits")
    private String benefits;

    @TableField("rebate_amount")
    private BigDecimal rebateAmount;

    @TableField("rebate_condition")
    private String rebateCondition;

    @TableField("status")
    private Integer status;

    @TableField("expire_time")
    private LocalDateTime expireTime;

    @TableField("created_by")
    private Long createdBy;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
