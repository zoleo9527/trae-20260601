package com.park.decoration.dto;

import com.park.decoration.enums.PermitStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EntryPermitRequest {

    @NotNull(message = "申请ID不能为空")
    private Long applicationId;

    @NotNull(message = "生效日期不能为空")
    private LocalDateTime validFrom;

    @NotNull(message = "失效日期不能为空")
    private LocalDateTime validTo;

    private String permittedScope;
    private String permittedWorkTypes;
    private String safetyRequirements;
    private String responsibleParty;
    private String managementRequirements;

    @NotBlank(message = "签发人不能为空")
    private String issuedBy;
}
