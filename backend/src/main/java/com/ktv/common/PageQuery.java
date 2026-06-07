package com.ktv.common;

import lombok.Data;

@Data
public class PageQuery {
    private Integer pageNum = 1;
    private Integer pageSize = 10;
}
