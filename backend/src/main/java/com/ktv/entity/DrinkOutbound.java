package com.ktv.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("drink_outbound")
public class DrinkOutbound {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String outboundNo;
    private Long bookingId;
    private String bookingNo;
    private String roomNo;
    private String outboundType;
    private String status;
    private BigDecimal totalAmount;
    private String remark;
    private Long verificationId;
    private String verificationNo;
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
