package com.ktv.vo;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class DashboardItemVO {
    private Long id;
    private String type;
    private String no;
    private String bookingNo;
    private String roomNo;
    private String customerName;
    private BigDecimal amount;
    private String status;
    private LocalDateTime createTime;
    private LocalDateTime handleTime;
    private String rejectReason;
    private String relatedNo;
}
