package com.parking.dto;

import lombok.Data;

import java.util.List;

@Data
public class RemoteReleaseReviewVO {

    private RemoteReleaseQuery releaseInfo;
    private GateFaultQuery faultInfo;
    private List<OperationRemark> remarks;
    private List<SupplementRecord> supplementRecords;
    private Boolean isMonthlyRental;

    @Data
    public static class SupplementRecord {
        private Long id;
        private String plateNumber;
        private String supplementType;
        private String content;
        private String operatorName;
        private String operatorRole;
        private String createdAt;
    }

    @Data
    public static class RemoteReleaseQuery {
        private Long id;
        private String plateNumber;
        private String status;
        private String requestedBy;
        private String requestedAt;
        private String inheritedRemark;
        private String reviewRemark;
        private String supplementInfo;
    }

    @Data
    public static class GateFaultQuery {
        private Long id;
        private String faultType;
        private String faultDescription;
        private String status;
        private String handlingRemark;
        private String resolvedBy;
        private String resolvedAt;
        private String gateCode;
    }

    @Data
    public static class OperationRemark {
        private Long id;
        private String source;
        private String operatorName;
        private String operatorRole;
        private String content;
        private String createdAt;
    }
}
