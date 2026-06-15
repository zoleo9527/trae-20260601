package com.example.tilestore.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductResponse {

    private Long id;

    private String code;

    private String name;

    private String category;

    private String specification;

    private String color;

    private BigDecimal price;

    private Integer stock;
}