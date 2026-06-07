package com.ktv.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class DrinkOutboundDTO {
    private Long bookingId;
    private String outboundType;
    private String remark;
    private String idempotentKey;
    private List<OutboundItemDTO> items;

    @Data
    public static class OutboundItemDTO {
        private Long drinkId;
        private Integer quantity;
        private BigDecimal price;
    }
}
