package com.example.tilestore.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("measurement_record")
public class MeasurementRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long customerId;

    private Long salesmanId;

    private Long designerId;

    private String roomType;

    private BigDecimal length;

    private BigDecimal width;

    private BigDecimal height;

    private BigDecimal area;

    private String windowsInfo;

    private String doorsInfo;

    private String wallInfo;

    private String floorInfo;

    private String photos;

    private String remark;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}