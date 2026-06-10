package com.parking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RemoteReleaseCreateRequest {

    @NotNull
    private Long gateFaultId;

    @NotBlank
    private String plateNumber;

    @NotBlank
    private String requestedBy;
}
