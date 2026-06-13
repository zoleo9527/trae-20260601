
package com.example.recruitment.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateApplicationUpdateRequest {

    private String candidateName;

    private String candidatePhone;

    private String candidateIdCard;

    private Integer age;

    private Integer gender;

    private String education;

    private String workExperience;

    private String skills;

    private String sourceChannel;

    private String judgmentNote;
}
