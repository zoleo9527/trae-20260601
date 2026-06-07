package com.ktv.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("drink_outbound_item")
public class DrinkOutboundItem {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long outboundId;
    private Long drinkId;
    private String drinkName;
    private String spec;
    private String unit;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal amount;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableLogic
    private Integer deleted;
}
