package com.medical.aesthetic.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaymentRecordDTO {
    private Long installmentPlanId;
    private BigDecimal paidAmount;
    private LocalDate paidDate;
    private String remark;
}
