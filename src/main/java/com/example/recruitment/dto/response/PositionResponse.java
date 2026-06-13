
package com.example.recruitment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionResponse {

    private Long id;

    private String positionName;

    private Long companyId;

    private String companyName;

    private String department;

    private String workLocation;

    private BigDecimal salaryMin;

    private BigDecimal salaryMax;

    private Integer salaryType;

    private String salaryTypeDesc;

    private String requirement;

    private String benefits;

    private BigDecimal rebateAmount;

    private String rebateCondition;

    private Integer status;

    private String statusDesc;

    private Integer originalStatus;

    private Boolean isExpired;

    private LocalDateTime expireTime;

    private LocalDateTime createdAt;
}
