package com.ktv.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("booking")
public class Booking {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String bookingNo;
    private String roomNo;
    private String customerName;
    private String customerPhone;
    private Long memberId;
    private LocalDateTime bookingTime;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal giftAmount;
    private String status;
    private String remark;
    private Long createBy;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    @TableLogic
    private Integer deleted;
}
