package com.ktv.dto;

import com.ktv.common.PageQuery;
import lombok.Data;

@Data
public class DrinkOutboundQueryDTO extends PageQuery {
    private String status;
    private String outboundType;
    private String keyword;
}
