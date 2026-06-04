package com.medical.aesthetic.dto;

import lombok.Data;

@Data
public class ComplaintHandleDTO {
    private Long complaintId;
    private String handlingResult;
    private String customerFeedback;
    private Integer satisfactionScore;
    private String newStatus;
}
