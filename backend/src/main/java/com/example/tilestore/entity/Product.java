package com.example.tilestore.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("product")
public class Product {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;

    private String name;

    private String category;

    private String specification;

    private String color;

    private BigDecimal price;

    private Integer stock;

    private Integer status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}