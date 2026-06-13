
package com.example.recruitment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("system_log")
public class SystemLog {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("module")
    private String module;

    @TableField("operation_type")
    private String operationType;

    @TableField("target_type")
    private String targetType;

    @TableField("target_id")
    private Long targetId;

    @TableField("operator_id")
    private Long operatorId;

    @TableField("operator_name")
    private String operatorName;

    @TableField("content")
    private String content;

    @TableField("ip_address")
    private String ipAddress;

    @TableField("created_at")
    private LocalDateTime createdAt;
}
