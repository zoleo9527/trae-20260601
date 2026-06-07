package com.ktv.dto;

import com.ktv.common.PageQuery;
import lombok.Data;

@Data
public class GiftVerificationQueryDTO extends PageQuery {
    private String status;
    private String keyword;
    private String startDate;
    private String endDate;
}
