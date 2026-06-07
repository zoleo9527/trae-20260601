package com.ktv.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("gift_verification")
public class GiftVerification {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String verificationNo;
    private Long bookingId;
    private String bookingNo;
    private String roomNo;
    private String customerName;
    private Long memberId;
    private BigDecimal giftAmount;
    private BigDecimal historicalUsedAmount;
    private BigDecimal usedAmount;
    private BigDecimal remainingAmount;
    private String status;
    private String outboundStatus;
    private Long outboundId;
    private String outboundNo;
    private String remark;
    private String rejectReason;
    private String idempotentKey;
    private Long createBy;
    private Long handleBy;
    private LocalDateTime handleTime;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    @TableLogic
    private Integer deleted;
}
