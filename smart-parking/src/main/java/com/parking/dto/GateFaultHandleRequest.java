package com.parking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GateFaultHandleRequest {

    @NotNull
    private Long faultId;

    @NotBlank
    private String handlerName;

    @NotBlank
    private String handlingRemark;

    private Boolean needRemoteRelease = false;

    private String plateNumber;
}
