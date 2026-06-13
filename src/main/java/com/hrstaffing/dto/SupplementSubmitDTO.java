package com.hrstaffing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
public class SupplementSubmitDTO {

    @NotNull(message = "异常ID不能为空")
    private Long exceptionId;

    @NotBlank(message = "补录内容不能为空")
    private String supplementContent;

    private BigDecimal correctedHours;
    private LocalTime correctedPunchIn;
    private LocalTime correctedPunchOut;
    private Long proofAttachmentId;
    private String proofRemark;
}
