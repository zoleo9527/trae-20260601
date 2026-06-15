package com.example.tilestore.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("quotation")
public class Quotation {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long measurementId;

    private Long customerId;

    private Long designerId;

    private BigDecimal totalAmount;

    private BigDecimal discount;

    private BigDecimal finalAmount;

    private LocalDate validUntil;

    private String status;

    private String remark;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}