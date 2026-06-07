package com.ktv.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("drink")
public class Drink {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String drinkCode;
    private String drinkName;
    private String category;
    private String spec;
    private String unit;
    private BigDecimal price;
    private Integer stock;
    private Integer status;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    @TableLogic
    private Integer deleted;
}
