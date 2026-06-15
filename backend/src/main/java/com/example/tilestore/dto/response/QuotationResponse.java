package com.example.tilestore.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuotationResponse {

    private Long id;

    private String status;

    private BigDecimal totalAmount;

    private BigDecimal discount;

    private BigDecimal finalAmount;

    private LocalDate validUntil;

    private String remark;

    private MeasurementRecordResponse measurement;

    private MeasurementRecordResponse.CustomerResponse customer;

    private MeasurementRecordResponse.UserResponse designer;

    private List<QuotationItemResponse> items;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Data
    public static class QuotationItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String specification;
        private String color;
        private BigDecimal unitPrice;
        private BigDecimal quantity;
        private BigDecimal amount;
        private String remark;
    }

    @Data
    public static class BriefMeasurementResponse {
        private Long id;
        private String roomType;
        private BigDecimal area;
        private String status;
    }
}