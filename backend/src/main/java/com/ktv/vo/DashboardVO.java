package com.ktv.vo;

import lombok.Data;
import java.util.List;

@Data
public class DashboardVO {
    private Long pendingOutboundCount;
    private Long pendingVerificationCount;
    private Long timeoutCount;
    private Long rejectedCount;
    private List<?> pendingOutboundList;
    private List<?> pendingVerificationList;
    private List<?> timeoutList;
    private List<?> rejectedList;
}
