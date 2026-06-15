package com.example.tilestore.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("measurement_history")
public class MeasurementHistory {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long measurementId;

    private Long operatorId;

    private String operatorRole;

    private String action;

    private String beforeData;

    private String afterData;

    private String remark;

    private LocalDateTime createdAt;
}