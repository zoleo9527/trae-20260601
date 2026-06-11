package com.park.decoration.dto;

import com.park.decoration.enums.PermitStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EntryPermitDTO {

    private Long id;
    private String permitNo;
    private Long applicationId;
    private String applicationNo;
    private PermitStatus status;
    private LocalDateTime validFrom;
    private LocalDateTime validTo;
    private String permittedScope;
    private String permittedWorkTypes;
    private String safetyRequirements;
    private String responsibleParty;
    private String managementRequirements;
    private String issuedBy;
    private LocalDateTime issuedAt;
    private String revokeReason;
    private LocalDateTime revokedAt;
    private String revokedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
