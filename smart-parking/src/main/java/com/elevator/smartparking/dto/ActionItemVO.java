package com.elevator.smartparking.dto;

import lombok.Data;

@Data
public class ActionItemVO {

    private String action;
    private String actionName;
    private String description;
    private Boolean available;
    private String disabledReason;
}
