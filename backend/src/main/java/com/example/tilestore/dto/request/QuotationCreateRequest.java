package com.example.tilestore.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class QuotationCreateRequest {

    @NotNull(message = "量房记录ID不能为空")
    private Long measurementId;

    private BigDecimal discount = BigDecimal.ONE;

    private LocalDate validUntil;

    private String remark;

    @NotNull(message = "报价明细不能为空")
    @Size(min = 1, message = "报价明细至少要有一项")
    @Valid
    private List<QuotationItemRequest> items;

    @Data
    public static class QuotationItemRequest {
        @NotNull(message = "产品ID不能为空")
        private Long productId;

        @NotNull(message = "数量不能为空")
        private BigDecimal quantity;

        private String remark;
    }
}