package com.medical.aesthetic.dto;

import lombok.Data;

@Data
public class StatusChangeDTO {
    private Long customerProjectId;
    private String newStatus;
    private String changeReason;
    private String internalRemark;
}
