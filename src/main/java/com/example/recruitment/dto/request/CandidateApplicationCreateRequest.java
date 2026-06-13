
package com.example.recruitment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateApplicationCreateRequest {

    @NotNull(message = "岗位ID不能为空")
    private Long positionId;

    @NotBlank(message = "候选人姓名不能为空")
    private String candidateName;

    @NotBlank(message = "候选人手机号不能为空")
    private String candidatePhone;

    private String candidateIdCard;

    private Integer age;

    private Integer gender;

    private String education;

    private String workExperience;

    private String skills;

    private String sourceChannel;

    private String judgmentNote;

    @NotNull(message = "提交人ID不能为空")
    private Long submittedBy;

    private String submittedByName;
}
