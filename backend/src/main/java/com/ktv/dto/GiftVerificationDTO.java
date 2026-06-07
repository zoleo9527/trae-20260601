package com.ktv.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class GiftVerificationDTO {
    private Long bookingId;
    private BigDecimal usedAmount;
    private String remark;
    private String idempotentKey;
    private List<VerificationItemDTO> items;

    @Data
    public static class VerificationItemDTO {
        private Long drinkId;
        private Integer quantity;
        private BigDecimal price;
    }
}
