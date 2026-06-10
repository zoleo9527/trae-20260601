package com.elevator.smartparking.dto;

import lombok.Data;

@Data
public class RescueHandleDTO {

    private Long operatorId;

    private String content;

    private String rescueProcess;

    private String entrapmentReason;

    private Boolean hasInjury;

    private String injuryDescription;

    private String solution;

    private String remark;
}
