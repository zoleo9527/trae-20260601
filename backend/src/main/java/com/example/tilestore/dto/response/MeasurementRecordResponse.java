package com.example.tilestore.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class MeasurementRecordResponse {

    private Long id;

    private String roomType;

    private BigDecimal length;

    private BigDecimal width;

    private BigDecimal height;

    private BigDecimal area;

    private String windowsInfo;

    private String doorsInfo;

    private String wallInfo;

    private String floorInfo;

    private String photos;

    private String remark;

    private String status;

    private CustomerResponse customer;

    private UserResponse salesman;

    private UserResponse designer;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Data
    public static class CustomerResponse {
        private Long id;
        private String name;
        private String phone;
        private String address;
    }

    @Data
    public static class UserResponse {
        private Long id;
        private String username;
        private String realName;
        private String phone;
    }
}