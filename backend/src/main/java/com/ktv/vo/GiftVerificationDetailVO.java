package com.ktv.vo;

import com.ktv.entity.GiftVerification;
import com.ktv.entity.GiftVerificationItem;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class GiftVerificationDetailVO extends GiftVerification {
    private List<GiftVerificationItem> items;
    private BigDecimal bookingGiftAmount;
    private BigDecimal totalUsedAmount;
    private BigDecimal realRemainingAmount;
}
