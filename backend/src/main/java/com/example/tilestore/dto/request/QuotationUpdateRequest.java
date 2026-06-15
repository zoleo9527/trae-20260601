package com.example.tilestore.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class QuotationUpdateRequest {

    private BigDecimal discount;

    private LocalDate validUntil;

    private String remark;

    @Size(min = 1, message = "报价明细至少要有一项")
    @Valid
    private List<QuotationCreateRequest.QuotationItemRequest> items;
}