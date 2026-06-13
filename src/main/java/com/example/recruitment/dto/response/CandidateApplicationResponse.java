
package com.example.recruitment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateApplicationResponse {

    private Long id;

    private Long positionId;

    private String positionName;

    private String candidateName;

    private String candidatePhone;

    private String candidateIdCard;

    private Integer age;

    private Integer gender;

    private String genderDesc;

    private String education;

    private String workExperience;

    private String skills;

    private String sourceChannel;

    private String judgmentNote;

    private Integer status;

    private String statusDesc;

    private Long submittedBy;

    private String submittedByName;

    private LocalDateTime submittedAt;

    private Long confirmedBy;

    private String confirmedByName;

    private LocalDateTime confirmedAt;

    private String rejectedReason;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
