package com.parking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RemoteReleaseReviewRequest {

    @NotNull
    private Long releaseId;

    @NotBlank
    private String reviewerName;

    @NotBlank
    private String action;

    @NotBlank
    private String reviewRemark;

    private String supplementInfo;
}
